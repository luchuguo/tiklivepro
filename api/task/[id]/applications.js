import { createClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    console.log(`获取任务申请列表: ${id}`);

    // 设置缓存头 - 申请列表缓存时间较短，因为数据变化频繁
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=60');
    res.setHeader('CDN-Cache-Control', 's-maxage=60');
    
    // 检查缓存
    const cacheKey = `task_applications_${id}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log(`返回缓存的任务申请列表: ${id}`);
      return res.status(200).json(cachedData);
    }

    console.log(`从 Supabase 获取任务申请列表: ${id}`);
    
    // 从 Supabase 获取任务申请列表，包含达人信息
    const { data, error } = await supabase
      .from('task_applications')
      .select(`
        *,
        influencer:influencers(
          id,
          nickname,
          real_name,
          avatar_url,
          followers_count,
          rating,
          total_reviews,
          hourly_rate,
          experience_years,
          bio
        )
      `)
      .eq('task_id', id)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error(`Supabase 查询任务申请列表失败: ${id}`, error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`成功获取任务申请列表: ${id}, 共 ${data?.length || 0} 条申请`);

    // 存储到缓存，申请列表缓存1分钟
    await storeInCache(cacheKey, data || [], 60);

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('API 处理错误:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getFromCache(key) {
  try {
    const cachedData = await kv.get(key);
    if (cachedData) {
      console.log(`从 KV 缓存获取数据: ${key}`);
      return cachedData;
    }
    console.log(`KV 缓存中未找到数据: ${key}`);
    return null;
  } catch (error) {
    console.error('获取缓存数据失败:', error);
    return null;
  }
}

async function storeInCache(key, data, expirationSeconds = 60) {
  try {
    await kv.set(key, data, { ex: expirationSeconds });
    console.log(`数据已存储到 KV 缓存: ${key}, 过期时间: ${expirationSeconds}秒`);
  } catch (error) {
    console.error('存储缓存数据失败:', error);
  }
} 
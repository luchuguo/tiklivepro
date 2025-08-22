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
      return res.status(400).json({ error: 'Influencer ID is required' });
    }

    console.log(`获取达人详情: ${id}`);

    // 检查环境变量
    if (!supabaseUrl || !supabaseKey) {
      console.error('环境变量未设置:', { 
        supabaseUrl: !!supabaseUrl, 
        supabaseKey: !!supabaseKey,
        envKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
      });
      return res.status(500).json({ 
        error: 'Supabase configuration missing',
        details: 'Please check environment variables'
      });
    }

    // 设置缓存头 - 达人详情可以缓存较长时间
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300');
    res.setHeader('CDN-Cache-Control', 's-maxage=300');
    
    // 检查缓存
    const cacheKey = `influencer_detail_${id}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log(`返回缓存的达人详情: ${id}`);
      return res.status(200).json(cachedData);
    }

    console.log(`从 Supabase 获取达人详情: ${id}`);
    console.log('环境变量状态:', { 
      supabaseUrl: supabaseUrl ? '已设置' : '未设置',
      supabaseKey: supabaseKey ? '已设置' : '未设置'
    });
    
    // 从 Supabase 获取达人详情，包含关联数据
    const { data, error } = await supabase
      .from('influencers')
      .select(`
        *,
        user:user_profiles(
          id,
          user_id,
          user_type,
          phone,
          avatar_url,
          created_at,
          updated_at
        ),
        reviews:reviews(
          id,
          rating,
          comment,
          created_at,
          reviewer:user_profiles(
            id,
            user_type
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Supabase 查询达人详情失败: ${id}`, error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Influencer not found' });
      }
      
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      console.log(`达人不存在: ${id}`);
      return res.status(404).json({ error: 'Influencer not found' });
    }

    console.log(`成功获取达人详情: ${id}`);

    // 获取达人的任务历史
    const { data: taskHistory, error: taskError } = await supabase
      .from('task_applications')
      .select(`
        *,
        task:tasks(
          id,
          title,
          budget_min,
          budget_max,
          status,
          company:companies(company_name)
        )
      `)
      .eq('influencer_id', id)
      .order('applied_at', { ascending: false })
      .limit(10);

    if (taskError) {
      console.error('获取任务历史失败:', taskError);
    }

    // 获取达人的直播记录
    const { data: liveSessions, error: liveError } = await supabase
      .from('live_sessions')
      .select(`
        *,
        task:tasks(
          id,
          title,
          company:companies(company_name)
        )
      `)
      .eq('influencer_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (liveError) {
      console.error('获取直播记录失败:', liveError);
    }

    // 组合完整数据
    const completeData = {
      ...data,
      taskHistory: taskHistory || [],
      liveSessions: liveSessions || []
    };

    // 存储到缓存，达人详情缓存5分钟
    await storeInCache(cacheKey, completeData, 300);

    return res.status(200).json(completeData);
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

async function storeInCache(key, data, expirationSeconds = 300) {
  try {
    await kv.set(key, data, { ex: expirationSeconds });
    console.log(`数据已存储到 KV 缓存: ${key}, 过期时间: ${expirationSeconds}秒`);
  } catch (error) {
    console.error('存储缓存数据失败:', error);
  }
} 
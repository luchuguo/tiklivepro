import { createClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    console.log(`获取任务详情: ${id}`);
    console.log('环境变量状态:', { 
      supabaseUrl: supabaseUrl ? '已设置' : '未设置',
      supabaseKey: supabaseKey ? '已设置' : '未设置'
    });

    // 设置缓存头 - 任务详情可以缓存更长时间
    // s-maxage=300: 在边缘网络缓存5分钟
    // stale-while-revalidate=600: 允许在重新验证期间返回过期缓存（10分钟）
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300');
    res.setHeader('CDN-Cache-Control', 's-maxage=300');
    
    // 检查缓存
    const cacheKey = `task_detail_${id}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log(`返回缓存的任务详情: ${id}`);
      return res.status(200).json(cachedData);
    }

    console.log(`从 Supabase 获取任务详情: ${id}`);
    
    // 从 Supabase 获取任务详情，包含关联数据
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        company:companies(
          id,
          company_name,
          contact_person,
          industry,
          company_size,
          website,
          description,
          logo_url,
          is_verified
        ),
        category:task_categories(
          id,
          name,
          description,
          icon
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Supabase 查询任务详情失败: ${id}`, error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      console.log(`任务不存在: ${id}`);
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log(`成功获取任务详情: ${id}`);

    // 存储到缓存，任务详情缓存5分钟
    await storeInCache(cacheKey, data, 300);

    return res.status(200).json(data);
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
import { createClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    // 设置缓存头 - 这是最重要的部分
    // s-maxage=60: 在边缘网络缓存60秒
    // stale-while-revalidate: 允许在重新验证期间返回过期缓存
    // public: 允许公共缓存
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate, public');
    
    // 添加额外的缓存头以增强缓存效果
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=60');
    res.setHeader('CDN-Cache-Control', 's-maxage=60');
    
    // 检查缓存
    const cacheKey = 'tasks';
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log('返回缓存数据');
      return res.status(200).json(cachedData);
    }

    console.log('从 Supabase 获取数据...');
    
    // 从 Supabase 获取前 50 个任务
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        company:companies(company_name, logo_url),
        category:task_categories(name)
      `)
      .eq('status', 'open') // 只获取招募中的任务
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase 查询错误:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`成功获取 ${data?.length || 0} 个任务`);

    // 存储到缓存
    await storeInCache(cacheKey, data);

    return res.status(200).json(data);
  } catch (error) {
    console.error('API 处理错误:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getFromCache(key) {
  try {
    // 使用 Vercel KV 存储获取缓存数据
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

async function storeInCache(key, data) {
  try {
    // 使用 Vercel KV 存储缓存数据，设置60秒过期时间
    await kv.set(key, data, { ex: 60 });
    console.log(`数据已存储到 KV 缓存: ${key}, 过期时间: 60秒`);
  } catch (error) {
    console.error('存储缓存数据失败:', error);
  }
} 
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    // 检查缓存
    const cacheKey = 'tasks';
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // 从 Supabase 获取前 50 个任务
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(50);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // 存储到缓存
    await storeInCache(cacheKey, data);

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getFromCache(key) {
  // 使用 Vercel KV 存储或其他缓存机制
  // 例如：return await kv.get(key);
}

async function storeInCache(key, data) {
  // 使用 Vercel KV 存储或其他缓存机制
  // 例如：await kv.set(key, data, { expirationTtl: 60 });
} 
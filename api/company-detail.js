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
      return res.status(400).json({ error: 'Company ID is required' });
    }

    console.log(`获取公司详情: ${id}`);

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

    // 设置缓存头 - 公司详情可以缓存较长时间
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300');
    res.setHeader('CDN-Cache-Control', 's-maxage=300');
    
    // 检查缓存
    const cacheKey = `company_detail_${id}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log(`返回缓存的公司详情: ${id}`);
      return res.status(200).json(cachedData);
    }

    console.log(`从 Supabase 获取公司详情: ${id}`);
    console.log('环境变量状态:', { 
      supabaseUrl: supabaseUrl ? '已设置' : '未设置',
      supabaseKey: supabaseKey ? '已设置' : '未设置'
    });
    
    // 从 Supabase 获取公司详情，包含关联数据
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Supabase 查询公司详情失败: ${id}`, error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      console.log(`公司不存在: ${id}`);
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log(`成功获取公司详情: ${id}`);

    // 获取公司发布的任务
    const { data: publishedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tasksError) {
      console.error('获取发布任务失败:', tasksError);
    }

    // 获取公司的直播记录
    const { data: liveSessions, error: liveError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('task_id', publishedTasks?.map(t => t.id) || [])
      .order('created_at', { ascending: false })
      .limit(5);

    if (liveError) {
      console.error('获取直播记录失败:', liveError);
    }

    // 组合完整数据
    const completeData = {
      ...data,
      publishedTasks: publishedTasks || [],
      liveSessions: liveSessions || []
    };

    // 存储到缓存，公司详情缓存5分钟
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
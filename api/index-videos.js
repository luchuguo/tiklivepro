import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 检查环境变量
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 环境变量未设置')
      return res.status(500).json({ error: 'Supabase 配置错误' })
    }

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('🏠 开始获取首页视频展示数据...')

    // 构建查询
    let query = supabase
      .from('videos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4)

    // 执行查询
    const { data: videos, error } = await query

    if (error) {
      console.error('❌ 获取首页视频数据失败:', error)
      throw error
    }

    // 处理数据
    const processedVideos = videos.map(video => ({
      ...video,
      views_count: video.views_count || '0',
      likes_count: video.likes_count || '0',
      comments_count: video.comments_count || '0',
      shares_count: video.shares_count || '0',
      tags: video.tags || []
    }))

    console.log(`✅ 成功获取首页视频数据: ${processedVideos.length} 个`)

    // 设置缓存头
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate, public')
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300')
    res.setHeader('CDN-Cache-Control', 's-maxage=300')
    res.setHeader('X-Cache-Status', 'miss')
    res.setHeader('X-Cache-TTL', '300')

    res.json({
      success: true,
      data: processedVideos
    })
  } catch (error) {
    console.error('❌ 首页视频API错误:', error)
    res.status(500).json({ 
      success: false,
      message: '获取首页视频数据失败',
      error: error.message 
    })
  }
} 
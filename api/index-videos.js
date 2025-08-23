import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  try {
    // 检查环境变量
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 环境变量未设置')
      return res.status(500).json({ error: 'Supabase 配置错误' })
    }

    // 创建缓存键（用于日志）
    const cacheKey = 'index_videos_featured'
    console.log(`🔍 查询缓存键: ${cacheKey}`)

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('🏠 开始获取首页视频展示数据...')

    // 从 Supabase 获取特色视频（用于首页展示）
    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        *,
        category:video_categories(name, description)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(4) // 首页只显示4个特色视频

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

    // 缓存策略：使用Vercel CDN缓存
    console.log(`💾 首页视频数据将通过CDN缓存，TTL: 600秒`)

    // 设置缓存头
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate, public')
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=600')
    res.setHeader('CDN-Cache-Control', 's-maxage=600')
    res.setHeader('X-Cache-Status', 'miss')
    res.setHeader('X-Cache-TTL', '600')

    res.json(processedVideos)
  } catch (error) {
    console.error('❌ 首页视频API错误:', error)
    res.status(500).json({ 
      error: '获取首页视频数据失败',
      details: error.message 
    })
  }
} 
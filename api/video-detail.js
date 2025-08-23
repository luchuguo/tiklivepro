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

    // 获取视频ID
    const { id } = req.query
    if (!id) {
      return res.status(400).json({ error: '缺少视频ID参数' })
    }

    // 创建缓存键（用于日志）
    const cacheKey = `video_detail_${id}`
    console.log(`🔍 查询缓存键: ${cacheKey}`)

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('🎬 开始获取视频详情...')

    // 获取视频详情
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select(`
        *,
        category:video_categories(name, description)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (videoError || !video) {
      console.error('❌ 视频不存在或已禁用:', videoError)
      return res.status(404).json({ error: '视频不存在或已禁用' })
    }

    // 获取相关视频推荐
    const { data: relatedVideos, error: relatedError } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        poster_url,
        duration,
        views_count,
        likes_count,
        influencer_name,
        influencer_avatar,
        category:video_categories(name)
      `)
      .eq('is_active', true)
      .neq('id', id)
      .eq('category_id', video.category_id)
      .order('views_count', { ascending: false })
      .limit(6)

    if (relatedError) {
      console.error('❌ 获取相关视频失败:', relatedError)
    }

    // 获取视频分类信息
    const { data: categories, error: categoriesError } = await supabase
      .from('video_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('❌ 获取分类信息失败:', categoriesError)
    }

    // 构建响应数据
    const result = {
      video: {
        ...video,
        views_count: video.views_count || '0',
        likes_count: video.likes_count || '0',
        comments_count: video.comments_count || '0',
        shares_count: video.shares_count || '0',
        tags: video.tags || []
      },
      relatedVideos: relatedVideos || [],
      categories: categories || [],
      meta: {
        title: video.title,
        description: video.description,
        image: video.poster_url,
        type: 'video'
      }
    }

    console.log('✅ 成功获取视频详情')

    // 缓存策略：使用Vercel CDN缓存
    console.log(`💾 视频详情数据将通过CDN缓存，TTL: 600秒`)

    // 设置缓存头
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate, public')
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=600')
    res.setHeader('CDN-Cache-Control', 's-maxage=600')
    res.setHeader('X-Cache-Status', 'miss')
    res.setHeader('X-Cache-TTL', '600')

    res.json(result)
  } catch (error) {
    console.error('❌ 视频详情API错误:', error)
    res.status(500).json({ 
      error: '获取视频详情失败',
      details: error.message 
    })
  }
} 
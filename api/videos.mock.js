import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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

    // 获取查询参数
    const {
      page = 1,
      limit = 20,
      category = 'all',
      search = '',
      featured = 'all',
      sort = 'latest'
    } = req.query

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('👥 开始获取视频列表...')

    // 构建查询
    let query = supabase
      .from('videos')
      .select(`
        *,
        category:video_categories(name, description)
      `)
      .eq('is_active', true)

    // 应用筛选条件
    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,influencer_name.ilike.%${search}%`)
    }
    
    if (featured && featured !== 'all') {
      query = query.eq('is_featured', featured === 'true')
    }

    // 应用排序
    switch (sort) {
      case 'latest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'popular':
        query = query.order('views_count', { ascending: false })
        break
      case 'rating':
        query = query.order('influencer_rating', { ascending: false })
        break
      case 'sort_order':
        query = query.order('sort_order', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // 分页
    const from = (parseInt(page) - 1) * parseInt(limit)
    const to = from + parseInt(limit) - 1
    query = query.range(from, to)

    // 获取总数
    const { count } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // 执行查询
    const { data: videos, error } = await query

    if (error) {
      console.error('❌ 获取视频列表失败:', error)
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

    const result = {
      videos: processedVideos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      },
      filters: {
        category,
        search,
        featured,
        sort
      }
    }

    console.log(`✅ 成功获取视频列表: ${processedVideos.length} 个`)

    // 设置缓存头（本地开发环境）
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Cache-Status', 'local-dev')
    res.setHeader('X-Cache-TTL', '0')

    res.json(result)
  } catch (error) {
    console.error('❌ 视频列表API错误:', error)
    res.status(500).json({ 
      error: '获取视频列表失败',
      details: error.message 
    })
  }
} 
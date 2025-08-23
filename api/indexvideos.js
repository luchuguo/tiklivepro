import { createClient } from '@supabase/supabase-js'
import { kv } from '@vercel/kv'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  try {
    // 检查环境变量
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 环境变量未设置')
      return res.status(500).json({ error: 'Supabase 配置错误' })
    }

    // 创建缓存键 - 首页视频展示数据
    const cacheKey = 'index_videos_featured'
    
    // 尝试从缓存获取数据
    const cachedData = await kv.get(cacheKey)
    if (cachedData) {
      console.log('✅ 从缓存返回首页视频展示数据')
      return res.json(cachedData)
    }

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

    // 存储到缓存 - 首页数据缓存时间更长
    await kv.setex(cacheKey, 600, processedVideos) // 缓存10分钟
    console.log('💾 首页视频数据已缓存')

    res.json(processedVideos)
  } catch (error) {
    console.error('❌ 首页视频API错误:', error)
    res.status(500).json({ 
      error: '获取首页视频数据失败',
      details: error.message 
    })
  }
} 
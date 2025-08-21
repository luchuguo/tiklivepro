import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
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
    console.log('👥 开始获取达人列表...')

    // 从 Supabase 获取达人数据
    const { data: influencers, error } = await supabase
      .from('influencers')
      .select(`
        id,
        nickname,
        real_name,
        avatar_url,
        rating,
        total_reviews,
        hourly_rate,
        followers_count,
        bio,
        is_verified,
        is_approved,
        location,
        categories,
        experience_years,
        created_at,
        updated_at
      `)
      .eq('is_approved', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ 获取达人数据失败:', error)
      throw error
    }

    console.log(`✅ 成功获取达人数据: ${influencers?.length || 0} 个`)

    // 设置 Vercel Edge Network 缓存策略
    // s-maxage=300: 边缘节点缓存 5 分钟
    // stale-while-revalidate: 缓存过期后仍可使用旧数据，同时后台更新
    // public: 允许公共缓存
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate, public')
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300')
    res.setHeader('CDN-Cache-Control', 's-maxage=300')
    
    // 添加缓存状态头
    res.setHeader('X-Cache-Status', 'fresh')
    res.setHeader('X-Cache-TTL', '300')

    return res.status(200).json(influencers || [])
  } catch (error) {
    console.error('❌ 获取达人列表时发生错误:', error)
    
    // 返回错误信息
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      message: '获取达人数据失败，请稍后重试'
    })
  }
} 
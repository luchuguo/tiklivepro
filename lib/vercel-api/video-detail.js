import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Environment variables not set')
      return res.status(500).json({ error: 'Supabase configuration error' })
    }

    // Get video ID
    const { id } = req.query
    if (!id) {
      return res.status(400).json({ error: 'Missing video ID parameter' })
    }

    // Create cache key (for logging)
    const cacheKey = `video_detail_${id}`
    console.log(`🔍 Query cache key: ${cacheKey}`)

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('🎬 Starting to fetch video details...')

    // Get video details
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
      console.error('❌ Video does not exist or is disabled:', videoError)
      return res.status(404).json({ error: 'Video does not exist or is disabled' })
    }

    // Get related video recommendations
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
      console.error('❌ Failed to fetch related videos:', relatedError)
    }

    // Get video category info
    const { data: categories, error: categoriesError } = await supabase
      .from('video_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('❌ Failed to fetch category info:', categoriesError)
    }

    // Build response data
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

    console.log('✅ Successfully fetched video details')

    // Cache strategy: use Vercel CDN cache
    console.log(`💾 Video details data will be cached via CDN, TTL: 600 seconds`)

    // Set cache headers
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate, public')
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=600')
    res.setHeader('CDN-Cache-Control', 's-maxage=600')
    res.setHeader('X-Cache-Status', 'miss')
    res.setHeader('X-Cache-TTL', '600')

    res.json(result)
  } catch (error) {
    console.error('❌ Video details API error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch video details',
      details: error.message 
    })
  }
} 
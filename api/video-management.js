import { createClient } from '@supabase/supabase-js'
import { kv } from '@vercel/kv'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 验证管理员权限
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权访问' })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的认证令牌' })
    }

    // 检查用户是否为超级管理员
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: '权限不足，需要超级管理员权限' })
    }

    const { action, ...params } = req.body

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, params)
      case 'POST':
        return await handlePost(req, res, params)
      case 'PUT':
        return await handlePut(req, res, params)
      case 'DELETE':
        return await handleDelete(req, res, params)
      default:
        return res.status(405).json({ error: '不支持的HTTP方法' })
    }
  } catch (error) {
    console.error('视频管理API错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

// 获取视频列表
async function handleGet(req, res, params) {
  try {
    const { page = 1, limit = 20, category_id, search, is_featured, is_active } = req.query
    
    let query = supabase
      .from('videos')
      .select(`
        *,
        category:video_categories(name, description)
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    // 应用筛选条件
    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', category_id)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,influencer_name.ilike.%${search}%`)
    }
    
    if (is_featured !== undefined) {
      query = query.eq('is_featured', is_featured === 'true')
    }
    
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true')
    }

    // 分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: videos, error, count } = await query

    if (error) {
      console.error('获取视频列表失败:', error)
      return res.status(500).json({ error: '获取视频列表失败' })
    }

    // 获取总数
    let countQuery = supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })

    if (category_id && category_id !== 'all') {
      countQuery = countQuery.eq('category_id', category_id)
    }
    
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,influencer_name.ilike.%${search}%`)
    }
    
    if (is_featured !== undefined) {
      countQuery = countQuery.eq('is_featured', is_featured === 'true')
    }
    
    if (is_active !== undefined) {
      countQuery = countQuery.eq('is_active', is_active === 'true')
    }

    const { count: totalCount } = await countQuery

    return res.status(200).json({
      success: true,
      data: {
        videos: videos || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取视频列表错误:', error)
    return res.status(500).json({ error: '获取视频列表失败' })
  }
}

// 创建新视频
async function handlePost(req, res, params) {
  try {
    const { 
      title, 
      description, 
      video_url, 
      poster_url, 
      duration, 
      category_id,
      influencer_name,
      influencer_avatar,
      influencer_followers,
      influencer_rating,
      views_count,
      likes_count,
      comments_count,
      shares_count,
      tags,
      is_featured,
      sort_order
    } = params

    // 验证必填字段
    if (!title || !video_url) {
      return res.status(400).json({ error: '标题和视频URL为必填字段' })
    }

    // 插入新视频
    const { data: newVideo, error } = await supabase
      .from('videos')
      .insert({
        title,
        description,
        video_url,
        poster_url,
        duration,
        category_id,
        influencer_name,
        influencer_avatar,
        influencer_followers,
        influencer_rating: influencer_rating ? parseFloat(influencer_rating) : 0,
        views_count: views_count || '0',
        likes_count: likes_count || '0',
        comments_count: comments_count || '0',
        shares_count: shares_count || '0',
        tags: tags || [],
        is_featured: is_featured || false,
        sort_order: sort_order || 0,
        created_by: req.user?.id
      })
      .select()
      .single()

    if (error) {
      console.error('创建视频失败:', error)
      return res.status(500).json({ error: '创建视频失败' })
    }

    // 清除相关缓存
    await clearVideoCache()

    return res.status(201).json({
      success: true,
      data: newVideo,
      message: '视频创建成功'
    })
  } catch (error) {
    console.error('创建视频错误:', error)
    return res.status(500).json({ error: '创建视频失败' })
  }
}

// 更新视频
async function handlePut(req, res, params) {
  try {
    const { id, ...updateData } = params

    if (!id) {
      return res.status(400).json({ error: '视频ID为必填字段' })
    }

    // 检查视频是否存在
    const { data: existingVideo, error: checkError } = await supabase
      .from('videos')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingVideo) {
      return res.status(404).json({ error: '视频不存在' })
    }

    // 处理数值字段
    if (updateData.influencer_rating) {
      updateData.influencer_rating = parseFloat(updateData.influencer_rating)
    }
    if (updateData.sort_order) {
      updateData.sort_order = parseInt(updateData.sort_order)
    }

    // 更新视频
    const { data: updatedVideo, error } = await supabase
      .from('videos')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新视频失败:', error)
      return res.status(500).json({ error: '更新视频失败' })
    }

    // 清除相关缓存
    await clearVideoCache()

    return res.status(200).json({
      success: true,
      data: updatedVideo,
      message: '视频更新成功'
    })
  } catch (error) {
    console.error('更新视频错误:', error)
    return res.status(500).json({ error: '更新视频失败' })
  }
}

// 删除视频
async function handleDelete(req, res, params) {
  try {
    const { id } = params

    if (!id) {
      return res.status(400).json({ error: '视频ID为必填字段' })
    }

    // 检查视频是否存在
    const { data: existingVideo, error: checkError } = await supabase
      .from('videos')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingVideo) {
      return res.status(404).json({ error: '视频不存在' })
    }

    // 删除视频
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除视频失败:', error)
      return res.status(500).json({ error: '删除视频失败' })
    }

    // 清除相关缓存
    await clearVideoCache()

    return res.status(200).json({
      success: true,
      message: '视频删除成功'
    })
  } catch (error) {
    console.error('删除视频错误:', error)
    return res.status(500).json({ error: '删除视频失败' })
  }
}

// 清除视频相关缓存
async function clearVideoCache() {
  try {
    const cacheKeys = [
      'videos_list',
      'videos_featured',
      'videos_categories'
    ]
    
    for (const key of cacheKeys) {
      await kv.del(key)
    }
  } catch (error) {
    console.error('清除缓存失败:', error)
  }
} 
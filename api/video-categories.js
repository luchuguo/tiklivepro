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

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'PUT':
        return await handlePut(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ error: '不支持的HTTP方法' })
    }
  } catch (error) {
    console.error('视频分类管理API错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

// 获取视频分类列表
async function handleGet(req, res) {
  try {
    const { is_active } = req.query
    
    let query = supabase
      .from('video_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true')
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('获取视频分类失败:', error)
      return res.status(500).json({ error: '获取视频分类失败' })
    }

    return res.status(200).json({
      success: true,
      data: categories || []
    })
  } catch (error) {
    console.error('获取视频分类错误:', error)
    return res.status(500).json({ error: '获取视频分类失败' })
  }
}

// 创建新视频分类
async function handlePost(req, res) {
  try {
    const { name, description, sort_order, is_active } = req.body

    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '分类名称为必填字段' })
    }

    // 检查分类名称是否已存在
    const { data: existingCategory, error: checkError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('name', name)
      .single()

    if (existingCategory) {
      return res.status(400).json({ error: '分类名称已存在' })
    }

    // 插入新分类
    const { data: newCategory, error } = await supabase
      .from('video_categories')
      .insert({
        name,
        description,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) {
      console.error('创建视频分类失败:', error)
      return res.status(500).json({ error: '创建视频分类失败' })
    }

    // 清除相关缓存
    await clearVideoCache()

    return res.status(201).json({
      success: true,
      data: newCategory,
      message: '视频分类创建成功'
    })
  } catch (error) {
    console.error('创建视频分类错误:', error)
    return res.status(500).json({ error: '创建视频分类失败' })
  }
}

// 更新视频分类
async function handlePut(req, res) {
  try {
    const { id, name, description, sort_order, is_active } = req.body

    if (!id) {
      return res.status(400).json({ error: '分类ID为必填字段' })
    }

    // 检查分类是否存在
    const { data: existingCategory, error: checkError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingCategory) {
      return res.status(404).json({ error: '视频分类不存在' })
    }

    // 如果更新名称，检查是否与其他分类重复
    if (name) {
      const { data: duplicateCategory, error: duplicateError } = await supabase
        .from('video_categories')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single()

      if (duplicateCategory) {
        return res.status(400).json({ error: '分类名称已存在' })
      }
    }

    // 更新分类
    const { data: updatedCategory, error } = await supabase
      .from('video_categories')
      .update({
        name,
        description,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新视频分类失败:', error)
      return res.status(500).json({ error: '更新视频分类失败' })
    }

    // 清除相关缓存
    await clearVideoCache()

    return res.status(200).json({
      success: true,
      data: updatedCategory,
      message: '视频分类更新成功'
    })
  } catch (error) {
    console.error('更新视频分类错误:', error)
    return res.status(500).json({ error: '更新视频分类失败' })
  }
}

// 删除视频分类
async function handleDelete(req, res) {
  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: '分类ID为必填字段' })
    }

    // 检查分类是否存在
    const { data: existingCategory, error: checkError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingCategory) {
      return res.status(404).json({ error: '视频分类不存在' })
    }

    // 检查是否有视频使用此分类
    const { data: videosUsingCategory, error: videosError } = await supabase
      .from('videos')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (videosError) {
      console.error('检查分类使用情况失败:', videosError)
      return res.status(500).json({ error: '检查分类使用情况失败' })
    }

    if (videosUsingCategory && videosUsingCategory.length > 0) {
      return res.status(400).json({ error: '该分类下还有视频，无法删除' })
    }

    // 删除分类
    const { error } = await supabase
      .from('video_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除视频分类失败:', error)
      return res.status(500).json({ error: '删除视频分类失败' })
    }

    // 清除相关缓存
    await clearVideoCache()

    return res.status(200).json({
      success: true,
      message: '视频分类删除成功'
    })
  } catch (error) {
    console.error('删除视频分类错误:', error)
    return res.status(500).json({ error: '删除视频分类失败' })
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
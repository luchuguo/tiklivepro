import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 环境变量未设置')
      return res.status(500).json({ error: 'Supabase 配置错误' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, supabase)
      case 'POST':
        return await handlePost(req, res, supabase)
      case 'PUT':
        return await handlePut(req, res, supabase)
      case 'DELETE':
        return await handleDelete(req, res, supabase)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('❌ 分类管理 API 错误:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      message: '分类管理操作失败，请稍后重试'
    })
  }
}

// 获取分类列表
async function handleGet(req, res, supabase) {
  try {
    const { parent_id, level, include_inactive } = req.query
    
    let query = supabase
      .from('task_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    // 根据父级ID筛选
    if (parent_id) {
      query = query.eq('parent_id', parent_id)
    }

    // 根据层级筛选
    if (level) {
      query = query.eq('level', parseInt(level))
    }

    // 是否包含非活跃分类
    if (include_inactive !== 'true') {
      query = query.eq('is_active', true)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('❌ 获取分类数据失败:', error)
      throw error
    }

    console.log(`✅ 成功获取分类数据: ${categories?.length || 0} 个`)

    // 设置缓存头
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate, public')
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300')
    res.setHeader('CDN-Cache-Control', 's-maxage=300')
    res.setHeader('X-Cache-Status', 'fresh')
    res.setHeader('X-Cache-TTL', '300')

    return res.status(200).json(categories || [])
  } catch (error) {
    console.error('❌ 获取分类列表失败:', error)
    return res.status(500).json({ error: error.message })
  }
}

// 创建新分类
async function handlePost(req, res, supabase) {
  try {
    const { name, description, icon, sort_order, level, parent_id, is_active } = req.body

    if (!name) {
      return res.status(400).json({ error: '分类名称不能为空' })
    }

    // 检查分类名称是否已存在
    const { data: existingCategory } = await supabase
      .from('task_categories')
      .select('id')
      .eq('name', name)
      .single()

    if (existingCategory) {
      return res.status(400).json({ error: '分类名称已存在' })
    }

    const newCategory = {
      name,
      description: description || '',
      icon: icon || 'Tag',
      sort_order: sort_order || 0,
      level: level || 1,
      parent_id: parent_id || null,
      is_active: is_active !== undefined ? is_active : true
    }

    const { data: category, error } = await supabase
      .from('task_categories')
      .insert(newCategory)
      .select()
      .single()

    if (error) {
      console.error('❌ 创建分类失败:', error)
      throw error
    }

    console.log('✅ 成功创建分类:', category.name)

    return res.status(201).json({
      message: '分类创建成功',
      category
    })
  } catch (error) {
    console.error('❌ 创建分类失败:', error)
    return res.status(500).json({ error: error.message })
  }
}

// 更新分类
async function handlePut(req, res, supabase) {
  try {
    const { id } = req.query
    const { name, description, icon, sort_order, level, parent_id, is_active } = req.body

    if (!id) {
      return res.status(400).json({ error: '分类ID不能为空' })
    }

    // 检查分类是否存在
    const { data: existingCategory } = await supabase
      .from('task_categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existingCategory) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // 如果要更新名称，检查新名称是否已存在
    if (name && name !== existingCategory.name) {
      const { data: duplicateCategory } = await supabase
        .from('task_categories')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single()

      if (duplicateCategory) {
        return res.status(400).json({ error: '分类名称已存在' })
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (level !== undefined) updateData.level = level
    if (parent_id !== undefined) updateData.parent_id = parent_id
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedCategory, error } = await supabase
      .from('task_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ 更新分类失败:', error)
      throw error
    }

    console.log('✅ 成功更新分类:', updatedCategory.name)

    return res.status(200).json({
      message: '分类更新成功',
      category: updatedCategory
    })
  } catch (error) {
    console.error('❌ 更新分类失败:', error)
    return res.status(500).json({ error: error.message })
  }
}

// 删除分类
async function handleDelete(req, res, supabase) {
  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: '分类ID不能为空' })
    }

    // 检查分类是否存在
    const { data: existingCategory } = await supabase
      .from('task_categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existingCategory) {
      return res.status(404).json({ error: '分类不存在' })
    }

    // 检查是否有子分类
    const { data: childCategories } = await supabase
      .from('task_categories')
      .select('id')
      .eq('parent_id', id)

    if (childCategories && childCategories.length > 0) {
      return res.status(400).json({ 
        error: '无法删除包含子分类的分类，请先删除子分类' 
      })
    }

    // 检查是否有任务使用此分类
    const { data: tasksUsingCategory } = await supabase
      .from('tasks')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (tasksUsingCategory && tasksUsingCategory.length > 0) {
      return res.status(400).json({ 
        error: '无法删除正在使用的分类，请先移除相关任务' 
      })
    }

    // 软删除：将分类标记为非活跃
    const { error } = await supabase
      .from('task_categories')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('❌ 删除分类失败:', error)
      throw error
    }

    console.log('✅ 成功删除分类:', existingCategory.name)

    return res.status(200).json({
      message: '分类删除成功',
      category_id: id
    })
  } catch (error) {
    console.error('❌ 删除分类失败:', error)
    return res.status(500).json({ error: error.message })
  }
} 
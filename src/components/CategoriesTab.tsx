import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronRight,
  Tag,
  RefreshCw,
  Search
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface TaskCategory {
  id: string
  name: string
  description: string
  icon: string
  sort_order: number
  is_active: boolean
  level: number
  parent_id: string | null
  created_at: string
  updated_at: string
  children?: TaskCategory[]
}

interface CategoryFormData {
  name: string
  description: string
  icon: string
  sort_order: number
  level: number
  parent_id: string | null
  is_active: boolean
}

export function CategoriesTab() {
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: 'Tag',
    sort_order: 0,
    level: 1,
    parent_id: null,
    is_active: true
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      // 构建分类树结构
      const categoryTree = buildCategoryTree(data || [])
      setCategories(categoryTree)
      console.log('✅ 成功获取分类数据:', categoryTree.length)
    } catch (error) {
      console.error('❌ 获取分类数据失败:', error)
      setError('获取分类数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const buildCategoryTree = (flatCategories: TaskCategory[]): TaskCategory[] => {
    const categoryMap = new Map<string, TaskCategory>()
    const roots: TaskCategory[] = []

    // 创建映射
    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // 构建树结构
    flatCategories.forEach(cat => {
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        const parent = categoryMap.get(cat.parent_id)!
        parent.children = parent.children || []
        parent.children.push(categoryMap.get(cat.id)!)
      } else {
        roots.push(categoryMap.get(cat.id)!)
      }
    })

    return roots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('分类名称不能为空')
      return
    }

    try {
      if (editingCategory) {
        // 更新分类
        const { error } = await supabase
          .from('task_categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
            icon: formData.icon,
            sort_order: formData.sort_order,
            level: formData.level,
            parent_id: formData.parent_id,
            is_active: formData.is_active
          })
          .eq('id', editingCategory)

        if (error) throw error
        alert('分类更新成功！')
      } else {
        // 创建新分类
        const { error } = await supabase
          .from('task_categories')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim(),
            icon: formData.icon,
            sort_order: formData.sort_order,
            level: formData.level,
            parent_id: formData.parent_id,
            is_active: formData.is_active
          })

        if (error) throw error
        alert('分类创建成功！')
      }

      // 重置表单并刷新数据
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error('❌ 保存分类失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleEdit = (category: TaskCategory) => {
    setEditingCategory(category.id)
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      sort_order: category.sort_order,
      level: category.level,
      parent_id: category.parent_id,
      is_active: category.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`确定要删除分类 "${categoryName}" 吗？\n\n注意：删除后无法恢复！`)) {
      return
    }

    try {
      // 检查是否有子分类
      const { data: children } = await supabase
        .from('task_categories')
        .select('id')
        .eq('parent_id', categoryId)

      if (children && children.length > 0) {
        alert('无法删除包含子分类的分类，请先删除子分类')
        return
      }

      // 检查是否有任务使用此分类
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1)

      if (tasks && tasks.length > 0) {
        alert('无法删除正在使用的分类，请先移除相关任务')
        return
      }

      // 软删除：标记为非活跃
      const { error } = await supabase
        .from('task_categories')
        .update({ is_active: false })
        .eq('id', categoryId)

      if (error) throw error

      alert('分类删除成功！')
      fetchCategories()
    } catch (error) {
      console.error('❌ 删除分类失败:', error)
      alert('删除失败，请重试')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Tag',
      sort_order: 0,
      level: 1,
      parent_id: null,
      is_active: true
    })
    setEditingCategory(null)
    setShowForm(false)
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = showInactive || category.is_active
    return matchesSearch && matchesStatus
  })

  const renderCategoryRow = (category: TaskCategory, depth: number = 0) => (
    <div key={category.id} className="border-b border-gray-200">
      <div 
        className={`flex items-center justify-between p-4 hover:bg-gray-50 ${
          depth > 0 ? 'ml-6' : ''
        }`}
      >
        <div className="flex items-center space-x-3">
          {category.children && category.children.length > 0 && (
            <button
              onClick={() => toggleCategoryExpansion(category.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {expandedCategories.has(category.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              category.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {category.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              {category.is_active ? '活跃' : '非活跃'}
            </span>
            
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Tag className="w-3 h-3 mr-1" />
              层级 {category.level}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">排序: {category.sort_order}</span>
          <span className="text-sm text-gray-500">
            {new Date(category.created_at).toLocaleDateString()}
          </span>
          
          <div className="flex space-x-1">
            <button
              onClick={() => handleEdit(category)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
              title="编辑"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(category.id, category.name)}
              className="p-2 text-red-600 hover:bg-red-100 rounded"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="ml-6 border-l-2 border-gray-200">
        <div className="p-3">
          <h4 className="font-medium text-gray-900">{category.name}</h4>
          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs text-gray-500">图标: {category.icon}</span>
            {category.parent_id && (
              <span className="text-xs text-gray-500">
                父分类: {categories.find(c => c.id === category.parent_id)?.name || '未知'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 递归渲染子分类 */}
      {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
        <div className="ml-6">
          {category.children.map(child => renderCategoryRow(child, depth + 1))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>加载分类数据中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">分类管理</h2>
          <p className="text-gray-600">管理任务分类，支持层级结构和排序</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增分类
          </button>
          <button
            onClick={fetchCategories}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            强制刷新
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索分类名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">显示非活跃分类</span>
            </label>
          </div>

          <div className="text-sm text-gray-600">
            共 {filteredCategories.length} 个分类
          </div>
        </div>
      </div>

      {/* 分类表单 */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {editingCategory ? '编辑分类' : '新增分类'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入分类名称"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图标
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tag"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序权重
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  层级
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>一级分类</option>
                  <option value={2}>二级分类</option>
                  <option value={3}>三级分类</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  父级分类
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">无父级分类</option>
                  {categories
                    .filter(cat => cat.level < formData.level)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">是否活跃</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="请输入分类描述"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {editingCategory ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 分类列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || showInactive ? '没有找到匹配的分类' : '暂无分类数据'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCategories.map(category => renderCategoryRow(category))}
          </div>
        )}
      </div>
    </div>
  )
} 
import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Search, 
  Filter,
  Eye,
  Star,
  Building2,
  Tag,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { supabase, Task, TaskCategory } from '../../lib/supabase'
import { TaskDetailPage } from '../pages/TaskDetailPage'

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [budgetRange, setBudgetRange] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [error, setError] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const budgetRanges = [
    { id: 'all', name: '全部预算' },
    { id: '0-1000', name: '¥1000以下' },
    { id: '1000-5000', name: '¥1000-5000' },
    { id: '5000-10000', name: '¥5000-10000' },
    { id: '10000-50000', name: '¥10000-50000' },
    { id: '50000+', name: '¥50000以上' }
  ]

  useEffect(() => {
    fetchCategories()
    fetchTasks()
  }, [selectedCategory, budgetRange, sortBy])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      setCategories(data || [])
      console.log('任务分类:', data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('开始获取任务数据...')
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          company:companies(*),
          category:task_categories(*)
        `)

      // 先不过滤状态，看看是否有数据
      // .eq('status', 'open')

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory)
      }

      // 预算筛选
      if (budgetRange !== 'all') {
        const [min, max] = budgetRange.split('-').map(Number)
        if (max) {
          query = query.gte('budget_min', min).lte('budget_max', max)
        } else if (budgetRange === '50000+') {
          query = query.gte('budget_min', 50000)
        }
      }

      // 排序
      switch (sortBy) {
        case 'budget_desc':
          query = query.order('budget_max', { ascending: false })
          break
        case 'budget_asc':
          query = query.order('budget_min', { ascending: true })
          break
        case 'live_date':
          query = query.order('live_date', { ascending: true })
          break
        case 'urgent':
          query = query.order('is_urgent', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(20)

      console.log('任务查询结果:', { data, error })

      if (error) {
        console.error('获取任务数据失败:', error)
        setError(`获取任务数据失败: ${error.message}`)
        throw error
      }
      
      setTasks(data || [])
      console.log(`成功获取 ${data?.length || 0} 个任务`)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError('获取任务数据时发生错误')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
      onClick={() => setSelectedTaskId(task.id)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {task.is_urgent && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>紧急</span>
                </span>
              )}
              {task.category && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  {task.category.name}
                </span>
              )}
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                {task.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
              {task.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {task.description}
            </p>
          </div>
        </div>

        {task.product_name && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">产品：{task.product_name}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>¥{task.budget_min.toLocaleString()} - ¥{task.budget_max.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{Number(task.duration_hours)}小时</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(task.live_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{task.location || '线上'}</span>
          </div>
        </div>

        {task.requirements && task.requirements.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">要求：</h4>
            <div className="flex flex-wrap gap-1">
              {task.requirements.slice(0, 3).map((req, index) => (
                <span key={index} className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                  {req}
                </span>
              ))}
              {task.requirements.length > 3 && (
                <span className="text-xs text-gray-500">+{task.requirements.length - 3}个</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Building2 className="w-4 h-4" />
              <span>{task.company?.company_name || '未知公司'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{task.current_applicants}/{task.max_applicants}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{task.views_count}</span>
            </div>
          </div>
          <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200">
            立即申请
          </button>
        </div>
      </div>
    </div>
  )

  if (selectedTaskId) {
    return (
      <TaskDetailPage
        taskId={selectedTaskId}
        onBack={() => setSelectedTaskId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">任务大厅</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              发现优质直播带货任务，开启您的变现之旅
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索任务标题或产品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部分类</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {budgetRanges.map(range => (
                  <option key={range.id} value={range.id}>
                    {range.name}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">最新发布</option>
                <option value="budget_desc">预算从高到低</option>
                <option value="budget_asc">预算从低到高</option>
                <option value="live_date">直播时间</option>
                <option value="urgent">紧急任务优先</option>
              </select>
              
              <button
                onClick={fetchTasks}
                className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                刷新
              </button>
            </div>
          </div>
          
          {/* Debug Info */}
          <div className="mt-4 text-sm text-gray-600">
            <p>总任务数: {tasks.length} | 筛选后: {filteredTasks.length} | 分类数: {categories.length}</p>
            {error && (
              <p className="text-red-600 mt-2">错误: {error}</p>
            )}
          </div>
        </div>
      </section>

      {/* Tasks Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">加载失败</h3>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchTasks}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                重试
              </button>
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无任务</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? '没有找到匹配的任务，请尝试其他关键词' : '当前筛选条件下暂无任务，请调整筛选条件'}
              </p>
              <button
                onClick={fetchTasks}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                重新加载
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  Eye,
  TrendingUp,
  Briefcase,
  Tag,
  MessageCircle,
  Share2,
  Heart
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface CompanyDetailPageProps {
  companyId: string
  onBack: () => void
}

export function CompanyDetailPage({ companyId, onBack }: CompanyDetailPageProps) {
  const [company, setCompany] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'reviews'>('overview')
  
  const { user, profile, isInfluencer, isCompany } = useAuth()

  useEffect(() => {
    fetchCompanyDetails()
  }, [companyId])

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 获取公司详情
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (companyError) {
        console.error('获取公司详情失败:', companyError)
        setError('获取公司详情失败，请重试')
        return
      }

      setCompany(companyData)
      
      // 获取公司发布的任务
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          category:task_categories(*),
          selected_influencer:influencers(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (tasksError) {
        console.error('获取公司任务失败:', tasksError)
      } else {
        // 为每个任务获取申请数量
        const tasksWithApplications = await Promise.all(
          (tasksData || []).map(async (task) => {
            const { count } = await supabase
              .from('task_applications')
              .select('*', { count: 'exact', head: true })
              .eq('task_id', task.id)
            
            return {
              ...task,
              applications_count: count || 0
            }
          })
        )
        
        setTasks(tasksWithApplications)
      }
      
    } catch (error) {
      console.error('获取公司详情时发生错误:', error)
      setError('获取公司详情失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Building2 className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{error || '公司信息不存在'}</p>
          <button
            onClick={onBack}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        {/* 公司资料卡片 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* 封面图 */}
          <div className="h-48 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          {/* 基本信息 */}
          <div className="px-8 pt-0 pb-8 relative">
            {/* Logo */}
            <div className="w-24 h-24 rounded-lg border-4 border-white shadow-lg overflow-hidden absolute -top-12 left-8 bg-white">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.company_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200'
                  }}
                />
              ) : (
                <Building2 className="w-full h-full p-3 text-gray-500" />
              )}
            </div>
            
            {/* 名称和状态 */}
            <div className="flex justify-between items-start mt-16 mb-6">
              <div className="flex-1 ml-32">
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{company.company_name}</h1>
                  {company.is_verified && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>已认证</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-gray-600 text-sm">
                  <div className="flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span>{company.industry || '未知行业'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{company.address || '未知地址'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>注册于 {formatDate(company.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="text-gray-500 hover:text-gray-700">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <Share2 className="w-5 h-5" />
                </button>
                {isInfluencer && (
                  <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200">
                    关注企业
                  </button>
                )}
              </div>
            </div>
            
            {/* 统计信息 */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
                <div className="text-sm text-gray-600">发布任务</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">完成任务</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {tasks.reduce((sum, t) => sum + (t.views_count || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">总浏览量</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {company.avg_rating ? Number(company.avg_rating).toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-gray-600">平均评分</div>
              </div>
            </div>
            
            {/* 标签页导航 */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {[
                  { key: 'overview', label: '企业概况', icon: Building2 },
                  { key: 'tasks', label: '发布任务', icon: Briefcase },
                  { key: 'reviews', label: '企业评价', icon: Star }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
            
            {/* 标签页内容 */}
            <div>
              {activeTab === 'overview' && (
                <div>
                  {/* 企业简介 */}
                  {company.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">企业简介</h3>
                      <p className="text-gray-700 whitespace-pre-line">
                        {company.description}
                      </p>
                    </div>
                  )}
                  
                  {/* 联系信息 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">联系信息</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.contact_person && (
                        <div className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">联系人</div>
                            <div className="font-medium">{company.contact_person}</div>
                          </div>
                        </div>
                      )}
                      
                      {company.contact_phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">联系电话</div>
                            <div className="font-medium">{company.contact_phone}</div>
                          </div>
                        </div>
                      )}
                      
                      {company.contact_email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">联系邮箱</div>
                            <div className="font-medium">{company.contact_email}</div>
                          </div>
                        </div>
                      )}
                      
                      {company.website && (
                        <div className="flex items-center space-x-3">
                          <Globe className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">官方网站</div>
                            <div className="font-medium">
                              <a 
                                href={company.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 underline"
                              >
                                {company.website}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'tasks' && (
                <div>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无发布的任务</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">任务名称</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">产品</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">价格</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">时间</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">时长</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">要求</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">申请信息</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">任务状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task) => {
                            // 获取申请数量
                            const applicationCount = task.applications_count || 0
                            
                            // 状态颜色配置
                            const getStatusConfig = (status: string) => {
                              switch (status) {
                                case 'open':
                                  return {
                                    text: '招募中',
                                    bgColor: 'bg-green-100',
                                    textColor: 'text-green-800',
                                    borderColor: 'border-green-200'
                                  }
                                case 'in_progress':
                                  return {
                                    text: '进行中',
                                    bgColor: 'bg-blue-100',
                                    textColor: 'text-blue-800',
                                    borderColor: 'border-blue-200'
                                  }
                                case 'completed':
                                  return {
                                    text: '已完成',
                                    bgColor: 'bg-purple-100',
                                    textColor: 'text-purple-800',
                                    borderColor: 'border-purple-200'
                                  }
                                case 'cancelled':
                                  return {
                                    text: '已取消',
                                    bgColor: 'bg-red-100',
                                    textColor: 'text-red-800',
                                    borderColor: 'border-red-200'
                                  }
                                default:
                                  return {
                                    text: '未知',
                                    bgColor: 'bg-gray-100',
                                    textColor: 'text-gray-800',
                                    borderColor: 'border-gray-200'
                                  }
                              }
                            }
                            
                            const statusConfig = getStatusConfig(task.status)
                            
                            return (
                              <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-4">
                                  <div className="font-medium text-gray-900">{task.title}</div>
                                  {task.category && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {task.category.name}
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-gray-900">
                                    {task.product_name || '未指定'}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="font-medium text-gray-900">
                                    ${task.budget_min.toLocaleString()} - ${task.budget_max.toLocaleString()}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-gray-900">{formatDate(task.live_date)}</div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-gray-900">{Number(task.duration_hours)} 小时</div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-gray-900 max-w-xs truncate" title={task.requirements}>
                                    {task.requirements || '无特殊要求'}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-gray-900">
                                    {applicationCount} 个申请
                                  </div>
                                  {task.selected_influencer && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      已选择: {task.selected_influencer.nickname}
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
                                    {statusConfig.text}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无企业评价</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
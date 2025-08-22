import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Building2, 
  Tag,
  ArrowLeft,
  CheckCircle,
  MessageCircle,
  Eye,
  Heart,
  Share2,
  Bookmark,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Star,
  Send
} from 'lucide-react'
import { Task, TaskApplication, Influencer, supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface TaskDetailPageProps {
  taskId: string
  onBack: () => void
}

export function TaskDetailPage({ taskId, onBack }: TaskDetailPageProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [applications, setApplications] = useState<TaskApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [similarTasks, setSimilarTasks] = useState<Task[]>([])
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [proposedRate, setProposedRate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [showRequirements, setShowRequirements] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  // 申请列表 Tab 状态：pending / accepted / refused
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'refused'>('pending')
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'cached' | 'fresh'>('loading')
  
  const { user, profile, isInfluencer, isCompany } = useAuth()

  useEffect(() => {
    fetchTaskDetails()
  }, [taskId])

  // profile 加载后再次拉取，确保企业用户能看到最新申请列表
  useEffect(() => {
    if (profile) {
      fetchTaskDetails()
    }
  }, [profile])

  const fetchTaskDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      setCacheStatus('loading')
      
      console.log(`开始从API获取任务详情: ${taskId}`)

      // 从API获取任务详情（带缓存）
      const response = await fetch(`/api/task-detail?id=${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('任务不存在')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const taskData = await response.json()

      // 检查缓存状态
      const cacheControl = response.headers.get('Cache-Control')
      const age = response.headers.get('Age')

      if (cacheControl && cacheControl.includes('s-maxage')) {
        setCacheStatus('cached')
        console.log('✅ 任务详情数据来自API缓存')
      } else {
        setCacheStatus('fresh')
        console.log('🔄 任务详情数据来自数据库')
      }

      console.log('✅ 成功从API获取任务详情:', taskData)
      setTask(taskData)
      
              // 获取任务申请
        if (isCompany && profile) {
          const applicationsResponse = await fetch(`/api/task-applications?taskId=${taskId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (applicationsResponse.ok) {
            const applicationsData = await applicationsResponse.json()
            setApplications(applicationsData || [])
          } else {
            console.error('获取申请列表失败:', applicationsResponse.status)
          }
        }
      
      // 获取相似任务（暂时使用空数组，因为API中没有专门的相似任务端点）
      setSimilarTasks([])
      
      console.log(`成功获取任务详情: ${taskId}`)
      
    } catch (error: any) {
      console.error('获取任务详情时发生错误:', error)
      setError(error.message || '获取任务详情失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !isInfluencer) {
      alert('请先登录达人账号')
      return
    }
    
    if (!proposedRate) {
      alert('请输入您的报价')
      return
    }
    
    try {
      setSubmitting(true)
      
      // 获取当前用户的达人ID
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (influencerError || !influencerData) {
        alert('获取达人信息失败，请确认您已完成达人资料设置')
        return
      }
      
      // 提交申请
      const { error: applicationError } = await supabase
        .from('task_applications')
        .insert({
          task_id: taskId,
          influencer_id: influencerData.id,
          message: applicationMessage,
          proposed_rate: parseInt(proposedRate),
          status: 'pending',
          applied_at: new Date().toISOString()
        })
      
      if (applicationError) {
        if (applicationError.code === '23505') { // 唯一约束冲突
          alert('您已经申请过该任务')
        } else {
          alert(`申请失败: ${applicationError.message}`)
        }
        return
      }
      
      // 不在提交申请阶段修改 current_applicants，待企业审核通过时再更新
      
      setHasApplied(true)
      setShowApplyForm(false)
      alert('申请提交成功！')
      
      // 刷新任务数据
      fetchTaskDetails()
      
    } catch (error) {
      console.error('提交申请时发生错误:', error)
      alert('提交申请时发生错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const refreshApplications = async () => {
    if (!task) return
    const { data: apps } = await supabase
      .from('task_applications')
      .select(`*, influencer:influencers(*)`)
      .eq('task_id', task.id)
      .order('applied_at', { ascending: false })
    setApplications(apps || [])
  }

  const handleAccept = async (app: TaskApplication) => {
    try {
      // 若已处理，直接返回
      if (app.status !== 'pending') return

      setProcessingId(app.id)

      // 本地乐观更新：先更新状态，立即刷新 UI
      setApplications(prev => prev.map(a =>
        a.id === app.id
          ? { ...a, status: 'accepted', responded_at: new Date().toISOString() }
          : { ...a, status: 'refused', responded_at: new Date().toISOString() }
      ))
      // 1. 标记当前申请为 accepted
      await supabase.from('task_applications').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', app.id)
      // 2. 其余申请设为 rejected
      await supabase.from('task_applications').update({ status: 'refused', responded_at: new Date().toISOString() }).eq('task_id', app.task_id).neq('id', app.id)
      // 3. 更新任务选定达人与状态，并同步 current_applicants 计数
      const updatedApplicants = (task?.current_applicants || 0) + 1
      await supabase
        .from('tasks')
        .update({
          selected_influencer_id: app.influencer_id,
          status: 'in_progress',
          current_applicants: updatedApplicants,
        })
        .eq('id', app.task_id)
      await refreshApplications()
      fetchTaskDetails()
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (app: TaskApplication) => {
    try {
      // 若已处理，直接返回
      if (app.status !== 'pending') return

      setProcessingId(app.id)

      // 本地乐观更新
      setApplications(prev => prev.map(a =>
        a.id === app.id
          ? { ...a, status: 'refused', responded_at: new Date().toISOString() }
          : a
      ))
      await supabase.from('task_applications').update({ status: 'refused', responded_at: new Date().toISOString() }).eq('id', app.id)
      await refreshApplications()
    } finally {
      setProcessingId(null)
    }
  }

  /**
   * 渲染申请卡片
   */
  const renderApplication = (application: TaskApplication) => (
    <div key={application.id} className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {application.influencer?.avatar_url ? (
            <img
              src={application.influencer.avatar_url}
              alt={application.influencer.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-full h-full p-2 text-gray-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-900">
              {application.influencer?.nickname}
              {application.influencer?.is_verified && (
                <span className="ml-2 text-blue-600 text-sm">✓ 已认证</span>
              )}
            </div>
            <div className="text-lg font-bold text-pink-600">
              ¥{application.proposed_rate?.toLocaleString()}
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            申请时间: {new Date(application.applied_at).toLocaleString()}
          </div>
          <div className="bg-gray-50 rounded p-3 text-gray-700 mb-3">
            {application.message || '申请者未留言'}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{application.influencer?.followers_count?.toLocaleString() || 0} 粉丝</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{Number(application.influencer?.rating || 0).toFixed(1)}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              {application.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleAccept(application)}
                    disabled={!!processingId}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    接受
                  </button>
                  <button
                    onClick={() => handleReject(application)}
                    disabled={!!processingId}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    拒绝
                  </button>
                </>
              ) : (
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    application.status === 'accepted'
                      ? 'bg-green-100 text-green-700'
                      : application.status === 'refused'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {application.status === 'accepted'
                    ? '审核通过'
                    : application.status === 'refused'
                    ? '已拒绝'
                    : application.status === 'withdrawn'
                    ? '已撤回'
                    : '未知状态'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-40 bg-gray-200 rounded mb-6"></div>
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="h-10 w-3/4 bg-gray-200 rounded mb-6"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
            <p className="text-gray-600 mb-6">{error || '无法加载任务详情'}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchTaskDetails}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
              <button
                onClick={onBack}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮和缓存状态 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              // 检查URL参数，判断是否从列表页面打开
              const urlParams = new URLSearchParams(window.location.search)
              const fromList = urlParams.get('from') === 'list'
              
              if (fromList && window.opener) {
                // 如果是从列表页面新标签页打开，关闭当前标签页
                window.close()
              } else if (window.history.length > 1) {
                // 如果有历史记录，返回上一页
                onBack()
              } else {
                // 否则跳转到任务列表页面
                window.location.href = '/tasks'
              }
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回任务列表</span>
          </button>
          
          {/* Cache Status */}
          <div className="flex items-center space-x-2">
            {cacheStatus === 'loading' && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="text-xs">加载中...</span>
              </div>
            )}
            {cacheStatus === 'cached' && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">服务器缓存</span>
              </div>
            )}
            {cacheStatus === 'fresh' && (
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className="text-xs">实时数据</span>
              </div>
            )}
          </div>
        </div>

        {/* 任务详情卡片 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* 任务标题和状态 */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {task.is_urgent && (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>紧急</span>
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm ${
                  task.status === 'open' ? 'bg-green-100 text-green-700' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  task.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.status === 'open' ? '招募中' :
                   task.status === 'in_progress' ? '进行中' :
                   task.status === 'completed' ? '已完成' :
                   task.status === 'cancelled' ? '已取消' : '未知状态'}
                </span>
                {task.category && (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {task.category.name}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 text-gray-500">
                <button className="hover:text-gray-700">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="hover:text-gray-700">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h1>
            
            {/* 企业信息 */}
            {task.company && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                  {task.company.logo_url ? (
                    <img 
                      src={task.company.logo_url} 
                      alt={task.company.company_name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200'
                      }}
                    />
                  ) : (
                    <Building2 className="w-full h-full p-2 text-gray-500" />
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => window.open(`/company/${task.company.id}`, '_blank')}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    {task.company.company_name}
                  </button>
                  <div className="text-sm text-gray-500">
                    {task.company.industry} · {task.company.is_verified ? '已认证' : '未认证'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 任务信息 */}
          <div className="p-8">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <div className="text-sm text-gray-500 mb-1">预算范围</div>
                <div className="flex items-center space-x-1 text-gray-900">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-xl font-bold">
                    ¥{task.budget_min.toLocaleString()} - ¥{task.budget_max.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 预付信息 */}
              <div>
                <div className="text-sm text-gray-500 mb-1">预付情况</div>
                {task.is_advance_paid ? (
                  <div className="flex items-center space-x-1 text-gray-900">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span className="text-xl font-bold text-emerald-700">已预付 ¥{(task.paid_amount ?? 0).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">未预付</div>
                )}
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">直播时间</div>
                <div className="flex items-center space-x-1 text-gray-900">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>{formatDate(task.live_date)}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">直播时长</div>
                <div className="flex items-center space-x-1 text-gray-900">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>{Number(task.duration_hours)} 小时</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">地点</div>
                <div className="flex items-center space-x-1 text-gray-900">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span>{task.location || '线上'}</span>
                </div>
              </div>
            </div>

            {/* 产品信息 */}
            {task.product_name && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">产品信息</h3>
                </div>
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">产品名称：</span>{task.product_name}
                </p>
                {/* 这里可以添加更多产品信息 */}
              </div>
            )}

            {/* 任务描述 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">任务描述</h3>
              <div className="text-gray-700 whitespace-pre-line">
                {task.description}
              </div>
            </div>

            {/* 任务要求 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">任务要求</h3>
                <button 
                  onClick={() => setShowRequirements(!showRequirements)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                >
                  {showRequirements ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>收起</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>展开</span>
                    </>
                  )}
                </button>
              </div>
              
              {showRequirements ? (
                <div className="space-y-3">
                  {task.requirements?.map((requirement, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div className="text-gray-700">{requirement}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {task.requirements?.map((requirement, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {requirement}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 申请信息 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">
                    <span className="font-medium">{task.current_applicants}</span>/{task.max_applicants} 申请
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">
                    <span className="font-medium">{task.views_count}</span> 浏览
                  </span>
                </div>
              </div>
              
              {/* 申请按钮 */}
              {task.status === 'open' && isInfluencer && (
                hasApplied ? (
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>已申请</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowApplyForm(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    立即申请
                  </button>
                )
              )}
            </div>

            {/* 申请表单 */}
            {showApplyForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">申请任务</h3>
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      您的报价 (元)
                    </label>
                    <input
                      type="number"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value)}
                      min={task.budget_min}
                      max={task.budget_max}
                      required
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`建议范围: ${task.budget_min} - ${task.budget_max}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      申请留言
                    </label>
                    <textarea
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="请介绍您的优势和对此任务的理解..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowApplyForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>提交中...</span>
                        </>
                      ) : (
                        <span>提交申请</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 申请列表 Tabs（仅企业可见） */}
            {isCompany && task.company?.user_id === user?.id && applications.length > 0 && (
              <div className="mb-8">
                {/* Tab Header */}
                <div className="flex border-b border-gray-200 mb-4">
                  {[
                    { key: 'pending', label: '未处理' },
                    { key: 'accepted', label: '已接受' },
                    { key: 'refused', label: '已拒绝' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key
                          ? 'border-pink-500 text-pink-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                  {applications.filter((a) => a.status === activeTab).length === 0 ? (
                    <div className="text-gray-500 text-center py-6">暂无记录</div>
                  ) : (
                    applications.filter((a) => a.status === activeTab).map(renderApplication)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 相关任务 */}
        {similarTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">相关任务</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarTasks.map((similarTask) => (
                <div key={similarTask.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">{similarTask.title}</h4>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">
                      {new Date(similarTask.live_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium text-pink-600">
                      ¥{similarTask.budget_min.toLocaleString()} - {similarTask.budget_max.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
                      {similarTask.company?.logo_url ? (
                        <img 
                          src={similarTask.company.logo_url} 
                          alt={similarTask.company.company_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-full h-full p-1 text-gray-500" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600 truncate">
                      {similarTask.company?.company_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 评论区 */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">讨论区</h3>
          
          {/* 评论输入框 */}
          <div className="flex space-x-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              <Users className="w-full h-full p-2 text-gray-500" />
            </div>
            <div className="flex-1 relative">
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                placeholder="发表评论..."
                rows={2}
              />
              <button className="absolute right-3 bottom-3 text-pink-600 hover:text-pink-700">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* 暂无评论提示 */}
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无评论，成为第一个评论的人吧！</p>
          </div>
        </div>
      </div>

      {/* 企业详情弹窗 */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">企业详情</h3>
              <button 
                onClick={() => setSelectedCompany(null)} 
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* 企业基本信息 */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                  {selectedCompany.logo_url ? (
                    <img 
                      src={selectedCompany.logo_url} 
                      alt={selectedCompany.company_name} 
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
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{selectedCompany.company_name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      {selectedCompany.industry || '未知行业'}
                    </span>
                    {selectedCompany.is_verified && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>已认证</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 企业详细信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedCompany.contact_person && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">联系人</div>
                    <div className="font-medium text-gray-900">{selectedCompany.contact_person}</div>
                  </div>
                )}
                
                {selectedCompany.contact_phone && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">联系电话</div>
                    <div className="font-medium text-gray-900">{selectedCompany.contact_phone}</div>
                  </div>
                )}
                
                {selectedCompany.contact_email && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">联系邮箱</div>
                    <div className="font-medium text-gray-900">{selectedCompany.contact_email}</div>
                  </div>
                )}
                
                {selectedCompany.website && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">官方网站</div>
                    <div className="font-medium text-gray-900">
                      <a 
                        href={selectedCompany.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        {selectedCompany.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {selectedCompany.address && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500 mb-1">公司地址</div>
                    <div className="font-medium text-gray-900">{selectedCompany.address}</div>
                  </div>
                )}
                
                {selectedCompany.description && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500 mb-1">公司简介</div>
                    <div className="text-gray-900 whitespace-pre-line">{selectedCompany.description}</div>
                  </div>
                )}
              </div>

              {/* 企业统计信息 */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h5 className="text-lg font-semibold text-gray-900 mb-4">企业统计</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {selectedCompany.total_tasks || 0}
                    </div>
                    <div className="text-sm text-gray-600">发布任务</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedCompany.completed_tasks || 0}
                    </div>
                    <div className="text-sm text-gray-600">完成任务</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedCompany.avg_rating ? Number(selectedCompany.avg_rating).toFixed(1) : '0.0'}
                    </div>
                    <div className="text-sm text-gray-600">平均评分</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
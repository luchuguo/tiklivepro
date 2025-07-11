import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Building2, 
  Video, 
  TrendingUp, 
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Shield,
  Activity,
  DollarSign,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader,
  LogOut
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface AdminStats {
  totalUsers: number
  totalInfluencers: number
  totalCompanies: number
  totalTasks: number
  totalApplications: number
  dailyNewUsers: number
  dailyNewTasks: number
  totalRevenue: number
}

interface RecentActivity {
  id: string
  type: 'user_register' | 'task_created' | 'application_submitted' | 'live_completed'
  description: string
  timestamp: string
  user?: string
}

export function AdminDashboard() {
  const { signOut, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInfluencers: 0,
    totalCompanies: 0,
    totalTasks: 0,
    totalApplications: 0,
    dailyNewUsers: 0,
    dailyNewTasks: 0,
    totalRevenue: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData()
    }
  }, [isAdmin])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 获取统计数据
      const { data: statsData } = await supabase
        .from('system_stats')
        .select('*')
        .order('stat_date', { ascending: false })
        .limit(1)
        .single()

      if (statsData) {
        setStats({
          totalUsers: statsData.total_users || 0,
          totalInfluencers: statsData.total_influencers || 0,
          totalCompanies: statsData.total_companies || 0,
          totalTasks: statsData.total_tasks || 0,
          totalApplications: statsData.total_applications || 0,
          dailyNewUsers: statsData.daily_new_users || 0,
          dailyNewTasks: statsData.daily_new_tasks || 0,
          totalRevenue: statsData.daily_revenue || 0
        })
      }

      // 获取最近活动
      const { data: logsData } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (logsData) {
        setRecentActivities(logsData.map(log => ({
          id: log.id,
          type: log.action_type as any,
          description: log.description || '',
          timestamp: log.created_at,
          user: log.admin_id
        })))
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    // 调用统计更新函数
    await supabase.rpc('update_system_stats')
    await fetchDashboardData()
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">访问受限</h2>
          <p className="text-gray-600">您没有权限访问管理后台</p>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% 较昨日
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总用户数"
          value={stats.totalUsers}
          change={5.2}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="达人主播"
          value={stats.totalInfluencers}
          change={3.8}
          icon={Video}
          color="bg-pink-500"
        />
        <StatCard
          title="企业用户"
          value={stats.totalCompanies}
          change={2.1}
          icon={Building2}
          color="bg-purple-500"
        />
        <StatCard
          title="总任务数"
          value={stats.totalTasks}
          change={8.7}
          icon={Calendar}
          color="bg-green-500"
        />
      </div>

      {/* 今日数据 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="今日新增用户"
          value={stats.dailyNewUsers}
          icon={TrendingUp}
          color="bg-indigo-500"
        />
        <StatCard
          title="今日新增任务"
          value={stats.dailyNewTasks}
          icon={Activity}
          color="bg-orange-500"
        />
        <StatCard
          title="今日收入"
          value={stats.totalRevenue}
          icon={DollarSign}
          color="bg-emerald-500"
        />
      </div>

      {/* 最近活动 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">最近活动</h3>
          <button
            onClick={refreshStats}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const UsersTab = () => {
    const [users, setUsers] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null)

    useEffect(() => {
      fetchUsers()
    }, [])

    // 获取用户并附加审核状态
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)

        const { data: profiles, error } = await supabase
          .from('user_accounts') // 视图，包含 user_id/ email/ user_type 等
          .select('*')

        if (error) throw error

        // 并发获取审核字段
        const enhanced = await Promise.all(
          (profiles || []).map(async (u: any) => {
            if (u.user_type === 'influencer') {
              const { data } = await supabase
                .from('influencers')
                .select('is_approved')
                .eq('user_id', u.user_id)
                .single()
              return { ...u, approve_status: data?.is_approved ?? false }
            }
            if (u.user_type === 'company') {
              const { data } = await supabase
                .from('companies')
                .select('is_verified')
                .eq('user_id', u.user_id)
                .single()
              return { ...u, approve_status: data?.is_verified ?? false }
            }
            return { ...u, approve_status: true }
          })
        )

        setUsers(enhanced)
      } catch (err) {
        console.error('获取用户列表异常:', err)
        setUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }

    // 审核通过
    const approveUser = async (u: any) => {
      try {
        if (u.user_type === 'influencer') {
          await supabase.from('influencers').update({ is_approved: true }).eq('user_id', u.user_id)
        } else if (u.user_type === 'company') {
          await supabase.from('companies').update({ is_verified: true }).eq('user_id', u.user_id)
        }
        // 更新本地状态
        setUsers(prev => prev.map(item => item.user_id === u.user_id ? { ...item, approve_status: true } : item))
      } catch (error) {
        console.error('审核用户失败:', error)
        alert('审核失败，请重试')
      }
    }

    // 查看用户详情
    const viewUser = async (u: any) => {
      try {
        let profileData: any = null
        if (u.user_type === 'influencer') {
          const { data } = await supabase
            .from('influencers')
            .select('*')
            .eq('user_id', u.user_id)
            .single()
          profileData = data
        } else if (u.user_type === 'company') {
          const { data } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', u.user_id)
            .single()
          profileData = data
        }
        setSelectedProfile({ basic: u, detail: profileData })
      } catch (err) {
        console.error('加载用户详情失败', err)
        alert('加载详情失败')
      }
    }

    const filtered = users.filter(u => {
      const keyword = search.toLowerCase()
      return (
        (u.email && u.email.toLowerCase().includes(keyword)) ||
        (u.user_id && u.user_id.toLowerCase().includes(keyword)) ||
        (u.user_type && u.user_type.toLowerCase().includes(keyword))
      )
    })

    return (
      <>
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">用户管理</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索用户..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="flex items-center space-x-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>刷新</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-auto">
          {loadingUsers ? (
            <div className="text-center text-gray-500 py-8">
              <Loader className="w-6 h-6 animate-spin mx-auto mb-4" />
              <p>加载用户列表...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无匹配的用户</p>
            </div>
          ) : (
            <table className="min-w-full text-sm text-left border divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">邮箱</th>
                  <th className="px-4 py-3 font-medium text-gray-700">类型</th>
                  <th className="px-4 py-3 font-medium text-gray-700">创建时间</th>
                  <th className="px-4 py-3 font-medium text-gray-700">更新时间</th>
                  <th className="px-4 py-3 font-medium text-gray-700">审核状态</th>
                  <th className="px-4 py-3 font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => (
                  <tr key={u.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800 truncate max-w-xs">{u.email}</td>
                    <td className="px-4 py-2 text-gray-600">{u.user_type === 'influencer' ? '达人' : u.user_type === 'company' ? '商家' : '管理员'}</td>
                    <td className="px-4 py-2 text-gray-600">{new Date(u.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-600">{new Date(u.updated_at).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      {u.approve_status ? (
                        <span className="text-green-600 flex items-center space-x-1"><CheckCircle className="w-4 h-4"/><span>已审核</span></span>
                      ) : (
                        <span className="text-yellow-600 flex items-center space-x-1"><AlertTriangle className="w-4 h-4"/><span>待审核</span></span>
                      )}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => viewUser(u)}
                        className="text-sm text-blue-600 hover:underline"
                      >查看</button>
                      {!u.approve_status && (
                        <button
                          onClick={() => approveUser(u)}
                          className="text-sm text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-lg"
                        >
                          审核通过
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">用户详情</h3>
                <button onClick={() => setSelectedProfile(null)} className="text-gray-500 hover:text-gray-900">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-gray-800">
                <p><span className="font-medium">邮箱：</span>{selectedProfile.basic.email}</p>
                <p><span className="font-medium">类型：</span>{selectedProfile.basic.user_type === 'influencer' ? '达人' : '商家'}</p>
                <p><span className="font-medium">注册时间：</span>{new Date(selectedProfile.basic.created_at).toLocaleString()}</p>
                <p><span className="font-medium">更新时间：</span>{new Date(selectedProfile.basic.updated_at).toLocaleString()}</p>

                {selectedProfile.detail && (
                  <>
                    {selectedProfile.basic.user_type === 'influencer' ? (
                      <>
                        <p><span className="font-medium">昵称：</span>{selectedProfile.detail.nickname}</p>
                        <p><span className="font-medium">粉丝：</span>{selectedProfile.detail.followers_count?.toLocaleString()}</p>
                        <p><span className="font-medium">认证：</span>{selectedProfile.detail.is_verified ? '已认证' : '未认证'}</p>
                        <p><span className="font-medium">审核：</span>{selectedProfile.detail.is_approved ? '已通过' : '未通过'}</p>
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">公司名称：</span>{selectedProfile.detail.company_name}</p>
                        <p><span className="font-medium">联系人：</span>{selectedProfile.detail.contact_person}</p>
                        <p><span className="font-medium">行业：</span>{selectedProfile.detail.industry || '—'}</p>
                        <p><span className="font-medium">认证：</span>{selectedProfile.detail.is_verified ? '已认证' : '未认证'}</p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  const TasksTab = () => {
    const [tasks, setTasks] = useState<any[]>([])
    const [loadingTasks, setLoadingTasks] = useState(true)
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'>('all')
    const [selectedTask, setSelectedTask] = useState<any | null>(null)

    useEffect(() => {
      fetchTasks()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter])

    const fetchTasks = async () => {
      try {
        setLoadingTasks(true)

        let query = supabase
          .from('tasks')
          .select(`*, company:companies(company_name), selected_influencer:influencers(nickname)`) // 联表查询
          .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (error) throw error

        setTasks(data || [])
      } catch (error) {
        console.error('获取任务失败:', error)
        setTasks([])
      } finally {
        setLoadingTasks(false)
      }
    }

    const TaskDetailModal = ({ task, onClose }: { task: any; onClose: () => void }) => {
      const [applications, setApplications] = useState<any[]>([])
      const [loadingApps, setLoadingApps] = useState(true)

      useEffect(() => {
        fetchApps()
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      const fetchApps = async () => {
        try {
          setLoadingApps(true)
          const { data, error } = await supabase
            .from('task_applications')
            .select(`*, influencer:influencers(nickname)`) // 申请人昵称
            .eq('task_id', task.id)
          if (error) throw error
          setApplications(data || [])
        } catch (err) {
          console.error('获取申请列表失败:', err)
          setApplications([])
        } finally {
          setLoadingApps(false)
        }
      }

      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">任务详情</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">基本信息</h4>
                <p>标题：{task.title}</p>
                <p>公司：{task.company?.company_name || '—'}</p>
                <p>状态：{({
                  open: '招募中',
                  in_progress: '进行中',
                  completed: '已完成',
                  cancelled: '已取消',
                } as Record<string, string>)[task.status]}</p>
                <p>中标达人：{task.selected_influencer ? task.selected_influencer.nickname : '—'}</p>
                <p>预付：{task.is_advance_paid ? '是' : '否'}</p>
                <p>已结算：{task.is_settled ? '是' : '否'}</p>
                {task.is_settled && <p>结算金额：¥{task.settlement_amount?.toLocaleString()}</p>}
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">申请人 ({applications.length})</h4>
                {loadingApps ? (
                  <Loader className="w-6 h-6 animate-spin text-gray-500" />
                ) : applications.length === 0 ? (
                  <p className="text-gray-500">暂无申请</p>
                ) : (
                  <ul className="space-y-2 text-sm text-gray-800">
                    {applications.map((app: any) => (
                      <li key={app.id} className="flex items-center justify-between">
                        <span>{app.influencer?.nickname || app.influencer_id}</span>
                        <span className="text-gray-500">{app.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-xl shadow-sm">
        {/* 过滤 & 刷新 */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">任务管理</h3>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="open">寻求合作中</option>
              <option value="in_progress">已达成合作</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            <button
              onClick={fetchTasks}
              className="flex items-center space-x-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-auto">
          {loadingTasks ? (
            <div className="text-center text-gray-500 py-8">
              <Loader className="w-6 h-6 animate-spin mx-auto mb-4" />
              <p>加载任务列表...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无任务</p>
            </div>
          ) : (
            <table className="min-w-full text-sm text-left border divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">标题</th>
                  <th className="px-4 py-3 font-medium text-gray-700">公司</th>
                  <th className="px-4 py-3 font-medium text-gray-700">状态</th>
                  <th className="px-4 py-3 font-medium text-gray-700">申请/上限</th>
                  <th className="px-4 py-3 font-medium text-gray-700">中标达人</th>
                  <th className="px-4 py-3 font-medium text-gray-700">预付</th>
                  <th className="px-4 py-3 font-medium text-gray-700">已结算</th>
                  <th className="px-4 py-3 font-medium text-gray-700">结算金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTask(t)}
                  >
                    <td className="px-4 py-2 text-pink-600 underline">{t.title}</td>
                    <td className="px-4 py-2 text-gray-600">{t.company?.company_name || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{({
                      open: '招募中',
                      in_progress: '进行中',
                      completed: '已完成',
                      cancelled: '已取消',
                    } as Record<string, string>)[t.status]}</td>
                    <td className="px-4 py-2 text-gray-600">{t.current_applicants}/{t.max_applicants}</td>
                    <td className="px-4 py-2 text-gray-600">{t.selected_influencer?.nickname || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{t.is_advance_paid ? '是' : '否'}</td>
                    <td className="px-4 py-2 text-gray-600">{t.is_settled ? '是' : '否'}</td>
                    <td className="px-4 py-2 text-gray-600">{t.settlement_amount ? `¥${t.settlement_amount.toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
      </div>
    )
  }

  const AnalyticsTab = () => (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">数据分析</h3>
      </div>
      <div className="p-6">
        <div className="text-center text-gray-500 py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>数据分析功能开发中...</p>
        </div>
      </div>
    </div>
  )

  const SettingsTab = () => (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">系统设置</h3>
      </div>
      <div className="p-6">
        <div className="text-center text-gray-500 py-8">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>系统设置功能开发中...</p>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', name: '概览', icon: BarChart3, component: OverviewTab },
    { id: 'users', name: '用户管理', icon: Users, component: UsersTab },
    { id: 'tasks', name: '任务管理', icon: Calendar, component: TasksTab },
    { id: 'analytics', name: '数据分析', icon: TrendingUp, component: AnalyticsTab },
    { id: 'settings', name: '系统设置', icon: Settings, component: SettingsTab },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30">
        <div className="flex items-center space-x-2 p-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">管理后台</span>
        </div>
        
        <nav className="mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-pink-50 text-pink-600 border-r-2 border-pink-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
        {/* 退出按钮 */}
        <div className="absolute bottom-0 left-0 w-full">
          <button
            onClick={async () => {
              await signOut()
              window.location.href = '/'
            }}
            className="w-full flex items-center space-x-3 px-6 py-3 text-left text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="ml-64">
        {/* 顶部栏 */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.name}
              </h1>
              <p className="text-gray-600">欢迎回来，管理员</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                最后更新: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
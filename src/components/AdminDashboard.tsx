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
  LogOut,
  Trash2,
  Tag
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../hooks/useAuth'
import { CategoriesTab } from './CategoriesTab'
import { PermissionDebugPanel } from './PermissionDebugPanel'
import { ErrorBoundary } from './ErrorBoundary'

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
  const { signOut, isAdmin, loading, user, profile, refreshPermissions } = useAuthContext()
  const [activeTab, setActiveTab] = useState('overview')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
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
  const [dashboardLoading, setDashboardLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 权限验证 useEffect 触发:', { user: !!user, profile: !!profile, loading, isAdmin })
    
    // 权限验证
    if (user && profile) {
      if (profile.user_type === 'admin') {
        console.log('✅ 管理员权限验证通过')
        setPermissionError(null)
        fetchDashboardData()
      } else {
        console.log('❌ 权限不足，用户类型:', profile.user_type)
        setPermissionError('权限不足，只有超级管理员可以访问此页面')
      }
    } else if (loading) {
      console.log('⏳ 正在加载用户信息...')
      // 加载中不显示错误，等待加载完成
    } else if (!user) {
      console.log('❌ 用户未登录')
      setPermissionError('用户未登录，请先登录')
    } else if (user && !profile) {
      console.log('⏳ 用户已登录，正在加载用户资料...')
      // 用户已登录但资料未加载，等待资料加载完成
    }
  }, [user, profile, loading])

  // 添加超时保护，防止无限加载
  useEffect(() => {
    if (loading && user) {
      const timeoutId = setTimeout(() => {
        console.log('⏰ 权限验证超时，强制刷新权限...')
        refreshPermissions()
      }, 15000) // 15秒超时
      
      return () => clearTimeout(timeoutId)
    }
  }, [loading, user])

  // 添加延迟权限检查，处理页面刷新后的权限验证
  useEffect(() => {
    if (user && !profile && !loading) {
      console.log('🔄 检测到用户已登录但资料未加载，延迟检查权限...')
      const timer = setTimeout(() => {
        if (user && !profile) {
          console.log('⏰ 延迟检查：用户资料仍未加载，尝试重新获取...')
          refreshPermissions()
        }
      }, 2000) // 2秒后检查
      
      return () => clearTimeout(timer)
    }
  }, [user, profile, loading])

  // 添加权限验证重试机制
  useEffect(() => {
    if (user && profile && profile.user_type === 'admin' && !permissionError) {
      console.log('✅ 权限验证成功，清除任何可能的错误状态')
      setPermissionError(null)
    }
  }, [user, profile, permissionError])

  // 添加强制权限恢复机制
  useEffect(() => {
    if (user && !profile && !loading) {
      console.log('🔄 检测到权限验证卡住，启动强制恢复...')
      const timer = setTimeout(() => {
        if (user && !profile) {
          console.log('🚨 强制恢复：用户资料仍未加载，强制刷新权限...')
          refreshPermissions()
        }
      }, 5000) // 5秒后强制恢复
      
      return () => clearTimeout(timer)
    }
  }, [user, profile, loading])

  // 添加连接状态检查
  const checkConnection = async () => {
    try {
      setIsConnecting(true)
      setConnectionError(null)
      
      console.log('🔍 检查服务器连接状态...')
      
      // 简单的连接测试
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        throw error
      }
      
      console.log('✅ 服务器连接正常')
      setConnectionError(null)
    } catch (error: any) {
      console.error('❌ 服务器连接失败:', error)
      setConnectionError(error?.message || '连接失败')
    } finally {
      setIsConnecting(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true)
      
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
      setDashboardLoading(false)
    }
  }

  const refreshStats = async () => {
    // 调用统计更新函数
    await supabase.rpc('update_system_stats')
    await fetchDashboardData()
  }

  // 移除这个早期返回，让权限验证逻辑来处理
  // if (!isAdmin) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  //         <h2 className="text-2xl font-bold text-gray-900 mb-2">访问受限</h2>
  //         <p className="text-gray-600">您没有权限访问管理后台</p>
  //       </div>
  //     </div>
  //   )
  // }

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

    // 获取用户并附加审核状态和手机号码
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)

        // 使用user_accounts视图获取用户信息，包含正确的邮箱和手机号码
        const { data: userAccounts, error } = await supabase
          .from('user_accounts')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        // 并发获取详细信息
        const enhanced = await Promise.all(
          (userAccounts || []).map(async (u: any) => {
            let approve_status = true
            let profileData = null
            
            if (u.user_type === 'influencer') {
              const { data } = await supabase
                .from('influencers')
                .select(`
                  is_approved, 
                  nickname, 
                  real_name, 
                  tiktok_account, 
                  bio, 
                  location, 
                  categories, 
                  tags, 
                  hourly_rate, 
                  experience_years, 
                  avatar_url,
                  followers_count,
                  rating,
                  total_reviews,
                  total_live_count,
                  avg_views,
                  status,
                  is_verified,
                  created_at,
                  updated_at
                `)
                .eq('user_id', u.user_id)
                .single()
              approve_status = data?.is_approved ?? false
              profileData = data
            } else if (u.user_type === 'company') {
              const { data } = await supabase
                .from('companies')
                .select(`
                  is_verified, 
                  company_name, 
                  contact_person, 
                  business_license, 
                  industry, 
                  company_size, 
                  website, 
                  description, 
                  logo_url,
                  created_at,
                  updated_at
                `)
                .eq('user_id', u.user_id)
                .single()
              approve_status = data?.is_verified ?? false
              profileData = data
            }
            
            return { 
              ...u, 
              approve_status,
              profileData
            }
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

    // 审核拒绝
    const rejectUser = async (u: any) => {
      try {
        if (u.user_type === 'influencer') {
          await supabase.from('influencers').update({ is_approved: false }).eq('user_id', u.user_id)
        } else if (u.user_type === 'company') {
          await supabase.from('companies').update({ is_verified: false }).eq('user_id', u.user_id)
        }
        // 更新本地状态
        setUsers(prev => prev.map(item => item.user_id === u.user_id ? { ...item, approve_status: false } : item))
        alert('用户审核已拒绝')
      } catch (error) {
        console.error('拒绝用户审核失败:', error)
        alert('拒绝审核失败，请重试')
      }
    }

    // 查看用户详情
    const viewUser = async (u: any) => {
      try {
        // 直接使用已经获取的profileData
        setSelectedProfile({ basic: u, detail: u.profileData })
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
                      {!u.approve_status && (
                        <button
                          onClick={() => rejectUser(u)}
                          className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg"
                        >
                          审核拒绝
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">用户详情</h3>
                <button onClick={() => setSelectedProfile(null)} className="text-gray-500 hover:text-gray-900">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">基本信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium text-gray-700">邮箱：</span>{selectedProfile.basic.email}</div>
                    <div><span className="font-medium text-gray-700">手机号码：</span>{selectedProfile.basic.phone || '未设置'}</div>
                    <div><span className="font-medium text-gray-700">用户类型：</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedProfile.basic.user_type === 'influencer' 
                          ? 'bg-pink-100 text-pink-700' 
                          : selectedProfile.basic.user_type === 'company'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {selectedProfile.basic.user_type === 'influencer' ? '达人主播' : 
                         selectedProfile.basic.user_type === 'company' ? '企业用户' : '管理员'}
                      </span>
                    </div>
                    <div><span className="font-medium text-gray-700">注册时间：</span>{new Date(selectedProfile.basic.created_at).toLocaleString()}</div>
                    <div><span className="font-medium text-gray-700">更新时间：</span>{new Date(selectedProfile.basic.updated_at).toLocaleString()}</div>
                    <div><span className="font-medium text-gray-700">审核状态：</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedProfile.basic.approve_status 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedProfile.basic.approve_status ? '已审核' : '待审核'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 详细信息 */}
                {selectedProfile.detail && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {selectedProfile.basic.user_type === 'influencer' ? '达人详细信息' : '企业详细信息'}
                    </h4>
                    {selectedProfile.basic.user_type === 'influencer' ? (
                      <div className="space-y-6">
                        {/* 头像和基本信息 */}
                        <div className="flex items-center space-x-4">
                          <img 
                            src={selectedProfile.detail.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'} 
                            alt="头像" 
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
                            }}
                          />
                          <div className="flex-1">
                            <h5 className="text-xl font-semibold text-gray-900">{selectedProfile.detail.nickname || '未设置昵称'}</h5>
                            <p className="text-gray-600">{selectedProfile.detail.real_name || '未设置真实姓名'}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                selectedProfile.detail.is_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {selectedProfile.detail.is_verified ? '已认证' : '未认证'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                selectedProfile.detail.is_approved ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {selectedProfile.detail.is_approved ? '已审核' : '待审核'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                selectedProfile.detail.status === 'active' ? 'bg-green-100 text-green-700' : 
                                selectedProfile.detail.status === 'inactive' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {selectedProfile.detail.status === 'active' ? '活跃' : 
                                 selectedProfile.detail.status === 'inactive' ? '非活跃' : '已暂停'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 统计信息 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h6 className="font-medium text-gray-900 mb-3">统计信息</h6>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-pink-600">{selectedProfile.detail.followers_count?.toLocaleString() || '0'}</div>
                              <div className="text-sm text-gray-600">粉丝数</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{selectedProfile.detail.rating?.toFixed(1) || '0.0'}</div>
                              <div className="text-sm text-gray-600">评分</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{selectedProfile.detail.total_reviews || '0'}</div>
                              <div className="text-sm text-gray-600">评价数</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{selectedProfile.detail.total_live_count || '0'}</div>
                              <div className="text-sm text-gray-600">直播场次</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 基本信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><span className="font-medium text-gray-700">TikTok账号：</span>{selectedProfile.detail.tiktok_account || '未设置'}</div>
                          <div><span className="font-medium text-gray-700">位置：</span>{selectedProfile.detail.location || '未设置'}</div>
                          <div><span className="font-medium text-gray-700">时薪：</span>{selectedProfile.detail.hourly_rate ? `¥${selectedProfile.detail.hourly_rate}/小时` : '未设置'}</div>
                          <div><span className="font-medium text-gray-700">经验年限：</span>{selectedProfile.detail.experience_years ? `${selectedProfile.detail.experience_years}年` : '未设置'}</div>
                          <div><span className="font-medium text-gray-700">平均观看：</span>{selectedProfile.detail.avg_views?.toLocaleString() || '0'}</div>
                          <div><span className="font-medium text-gray-700">创建时间：</span>{selectedProfile.detail.created_at ? new Date(selectedProfile.detail.created_at).toLocaleString() : '未知'}</div>
                        </div>
                        
                        {/* 简介 */}
                        {selectedProfile.detail.bio && (
                          <div>
                            <span className="font-medium text-gray-700">个人简介：</span>
                            <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedProfile.detail.bio}</p>
                          </div>
                        )}
                        
                        {/* 分类和标签 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedProfile.detail.categories && selectedProfile.detail.categories.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">分类：</span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {selectedProfile.detail.categories.map((cat: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {selectedProfile.detail.tags && selectedProfile.detail.tags.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">标签：</span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {selectedProfile.detail.tags.map((tag: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Logo和基本信息 */}
                        <div className="flex items-center space-x-4">
                          <img 
                            src={selectedProfile.detail.logo_url || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=150'} 
                            alt="公司Logo" 
                            className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=150'
                            }}
                          />
                          <div className="flex-1">
                            <h5 className="text-xl font-semibold text-gray-900">{selectedProfile.detail.company_name || '未设置公司名称'}</h5>
                            <p className="text-gray-600">{selectedProfile.detail.contact_person || '未设置联系人'}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                selectedProfile.detail.is_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {selectedProfile.detail.is_verified ? '已认证' : '未认证'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 基本信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><span className="font-medium text-gray-700">行业：</span>{selectedProfile.detail.industry || '未设置'}</div>
                          <div><span className="font-medium text-gray-700">公司规模：</span>{selectedProfile.detail.company_size || '未设置'}</div>
                          <div><span className="font-medium text-gray-700">营业执照：</span>{selectedProfile.detail.business_license || '未设置'}</div>
                          <div><span className="font-medium text-gray-700">创建时间：</span>{selectedProfile.detail.created_at ? new Date(selectedProfile.detail.created_at).toLocaleString() : '未知'}</div>
                          <div><span className="font-medium text-gray-700">更新时间：</span>{selectedProfile.detail.updated_at ? new Date(selectedProfile.detail.updated_at).toLocaleString() : '未知'}</div>
                          <div><span className="font-medium text-gray-700">网站：</span>
                            {selectedProfile.detail.website ? (
                              <a href={selectedProfile.detail.website.startsWith('http') ? selectedProfile.detail.website : `https://${selectedProfile.detail.website}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-blue-600 hover:underline">
                                {selectedProfile.detail.website}
                              </a>
                            ) : '未设置'}
                          </div>
                        </div>
                        
                        {/* 公司描述 */}
                        {selectedProfile.detail.description && (
                          <div>
                            <span className="font-medium text-gray-700">公司描述：</span>
                            <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedProfile.detail.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

    const deleteTask = async (taskId: string) => {
      if (!window.confirm('确定要删除此任务吗？此操作不可逆。')) {
        return
      }
      try {
        await supabase.from('tasks').delete().eq('id', taskId)
        setTasks(prev => prev.filter(task => task.id !== taskId))
        alert('任务删除成功！')
      } catch (error) {
        console.error('删除任务失败:', error)
        alert('删除任务失败，请重试')
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
                  <th className="px-4 py-3 font-medium text-gray-700">操作</th>
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
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止点击任务行触发详情弹窗
                          deleteTask(t.id);
                        }}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        title="删除任务"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>删除</span>
                      </button>
                    </td>
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
{ id: 'categories', name: '分类管理', icon: Tag, component: CategoriesTab },
    { id: 'tasks', name: '任务管理', icon: Calendar, component: TasksTab },
    { id: 'analytics', name: '数据分析', icon: TrendingUp, component: AnalyticsTab },
    { id: 'settings', name: '系统设置', icon: Settings, component: SettingsTab },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab

  // 权限错误处理
  if (permissionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
          <p className="text-gray-600 mb-6">{permissionError}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              返回首页
            </button>
            <button
              onClick={async () => {
                await signOut()
                window.location.href = '/admin-login'
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              重新登录
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 加载状态处理
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? '验证权限中...' : '加载用户信息中...'}
          </p>
          {!loading && user && (
            <div className="mt-4 text-sm text-gray-500">
              用户: {user.email} | 状态: 验证中
            </div>
          )}
          {profile && (
            <div className="mt-2 text-xs text-gray-400">
              用户类型: {profile.user_type} | 权限验证: {isAdmin ? '通过' : '失败'}
            </div>
          )}
          {/* 调试信息面板 */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
            <div className="font-medium text-gray-700 mb-2">🔍 权限验证调试信息</div>
            <div className="space-y-1 text-gray-600">
              <div>用户ID: {user?.id || '未获取'}</div>
              <div>用户邮箱: {user?.email || '未获取'}</div>
              <div>用户资料: {profile ? '已加载' : '未加载'}</div>
              <div>用户类型: {profile?.user_type || '未知'}</div>
              <div>isAdmin: {isAdmin ? 'true' : 'false'}</div>
              <div>Loading: {loading ? 'true' : 'false'}</div>
              <div>权限错误: {permissionError || '无'}</div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="font-medium text-gray-700 mb-2">🔧 权限修复操作</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                >
                  强制刷新页面
                </button>
                <button
                  onClick={async () => {
                    setPermissionError(null)
                    await refreshPermissions()
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  重新验证权限
                </button>
                <button
                  onClick={() => {
                    console.log('🚨 手动强制恢复权限...')
                    setPermissionError(null)
                    if (user) {
                      refreshPermissions()
                    }
                  }}
                  className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                >
                  🚨 强制恢复
                </button>
              </div>
            </div>
            {/* 实时状态监控 */}
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="font-medium text-gray-700 mb-2">📊 实时状态监控</div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>最后更新: {new Date().toLocaleTimeString()}</div>
                <div>权限状态: {isAdmin ? '✅ 已通过' : '❌ 未通过'}</div>
                <div>加载状态: {loading ? '⏳ 加载中' : '✅ 已完成'}</div>
                <div>用户状态: {user ? '✅ 已登录' : '❌ 未登录'}</div>
                <div>资料状态: {profile ? '✅ 已加载' : '❌ 未加载'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* 管理后台专用顶部栏 */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm border-b border-gray-200 z-40">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">tkgo.vip 管理后台</h1>
              <p className="text-xs text-gray-500">超级管理员控制台</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="text-green-600">●</span> 系统在线
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 侧边栏 */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30" style={{ top: '64px' }}>
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
      <div className="ml-64" style={{ marginTop: '64px' }}>
        {/* 页面标题栏 */}
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
        
                 {/* 权限调试面板 */}
         <PermissionDebugPanel
           user={user}
           profile={profile}
           loading={loading}
           isAdmin={isAdmin}
           permissionError={permissionError}
           connectionError={connectionError}
           isConnecting={isConnecting}
           onRefreshPermissions={refreshPermissions}
           onForceReload={() => window.location.reload()}
           onSignOut={async () => {
             await signOut()
             window.location.href = '/admin-login'
           }}
           onCheckConnection={checkConnection}
         />
        
        {/* 管理后台专用底部 */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 text-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">tkgo.vip</span> 管理后台 | 
            版本 1.0.0 | 
            最后更新: {new Date().toLocaleString()} | 
            <span className="text-green-600 ml-2">● 系统运行正常</span>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}
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
  Tag,
  Play,
  Ban,
  UserX,
  UserCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../hooks/useAuth'
import { useAdminAuth } from '../lib/adminAuthProvider'
import { CategoriesTab } from './CategoriesTab'
import { VideoManagement } from './admin/VideoManagement'
import { CertifiedCreatorManagement } from './admin/CertifiedCreatorManagement'
import { PermissionDebugPanel } from './PermissionDebugPanel'
import { ErrorBoundary } from './ErrorBoundary'
import { SessionDiagnostics } from './SessionDiagnostics'

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
  // 使用新的管理员认证系统
  const adminAuth = useAdminAuth()
  const { signOut: signOutLegacy } = useAuthContext()
  
  // 优先使用新的认证系统
  const user = adminAuth.user
  const profile = adminAuth.profile
  const isAdmin = adminAuth.isAdmin
  const loading = adminAuth.loading
  
  const signOut = async () => {
    await adminAuth.signOut()
    await signOutLegacy()
  }
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
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  // 简化的权限验证逻辑（使用新的 AdminAuthProvider）
  useEffect(() => {
    if (user && profile && isAdmin) {
      console.log('✅ 管理员权限验证通过')
      setPermissionError(null)
      setLoadingTimeout(false)
      fetchDashboardData()
    } else if (!loading && !user) {
      console.log('❌ 用户未登录')
      setPermissionError('用户未登录，请先登录')
    } else if (!loading && user && !isAdmin) {
      console.log('❌ 权限不足')
      setPermissionError('权限不足，只有超级管理员可以访问此页面')
    }
  }, [user, profile, isAdmin, loading])

  // Session 健康检查 - 定期检查 session 是否有效（只在验证通过后执行）
  useEffect(() => {
    if (!user || !isAdmin) return

    const checkSessionHealth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.warn('⚠️ Session 健康检查失败，尝试恢复...')
          // 尝试从 localStorage 恢复
          if (typeof window !== 'undefined') {
            const sessionKey = 'sb-auth-token'
            const storedSession = localStorage.getItem(sessionKey)
            
            if (storedSession) {
              try {
                const sessionData = JSON.parse(storedSession)
                if (sessionData.refresh_token) {
                  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                    refresh_token: sessionData.refresh_token
                  })
                  
                  if (refreshError || !refreshData.session) {
                    console.error('❌ Session 恢复失败，需要重新登录')
                    window.location.href = '/admin-login'
                  } else {
                    console.log('✅ Session 恢复成功')
                  }
                }
              } catch (parseError) {
                console.error('解析存储的 session 失败:', parseError)
                window.location.href = '/admin-login'
              }
            } else {
              console.error('❌ 没有存储的 session，需要重新登录')
              window.location.href = '/admin-login'
            }
          }
        } else {
          console.log('✅ Session 健康检查通过')
        }
      } catch (error) {
        console.error('Session 健康检查异常:', error)
      }
    }

    // 每5分钟检查一次 session 健康状态
    const healthCheckInterval = setInterval(checkSessionHealth, 5 * 60 * 1000)
    
    // 立即执行一次检查
    checkSessionHealth()

    return () => {
      clearInterval(healthCheckInterval)
    }
  }, [user, isAdmin])


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
      console.log('🔄 [Dashboard] 开始获取仪表板数据...')
      
      // 获取统计数据
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('system_stats')
          .select('*')
          .order('stat_date', { ascending: false })
          .limit(1)
          .single()

        if (statsError) {
          console.warn('⚠️ [Dashboard] 获取统计数据失败:', statsError)
          // 如果表不存在或没有数据，使用默认值
          if (statsError.code === 'PGRST116') {
            console.log('ℹ️ [Dashboard] 统计数据表为空，使用默认值')
          }
        } else if (statsData) {
          console.log('✅ [Dashboard] 统计数据获取成功')
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
      } catch (statsErr: any) {
        console.error('❌ [Dashboard] 获取统计数据异常:', statsErr)
      }

      // 获取最近活动
      try {
        console.log('🔄 [Dashboard] 开始获取管理员日志...')
        const { data: logsData, error: logsError } = await supabase
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (logsError) {
          console.warn('⚠️ [Dashboard] 获取管理员日志失败:', logsError)
          if (logsError.code === 'PGRST116') {
            console.log('ℹ️ [Dashboard] 管理员日志表为空')
          }
          setRecentActivities([])
        } else if (logsData) {
          console.log(`✅ [Dashboard] 获取到 ${logsData.length} 条管理员日志`)
          setRecentActivities(logsData.map(log => ({
            id: log.id,
            type: log.action_type as any,
            description: log.description || '',
            timestamp: log.created_at,
            user: log.admin_id
          })))
        } else {
          setRecentActivities([])
        }
      } catch (logsErr: any) {
        console.error('❌ [Dashboard] 获取管理员日志异常:', logsErr)
        setRecentActivities([])
      }

      console.log('✅ [Dashboard] 仪表板数据获取完成')
    } catch (error: any) {
      console.error('❌ [Dashboard] 获取仪表板数据失败:', error)
      // 设置默认值，避免页面崩溃
      setStats({
        totalUsers: 0,
        totalInfluencers: 0,
        totalCompanies: 0,
        totalTasks: 0,
        totalApplications: 0,
        dailyNewUsers: 0,
        dailyNewTasks: 0,
        totalRevenue: 0
      })
      setRecentActivities([])
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
              profileData,
              is_disabled: u.user_type === 'influencer' 
                ? (profileData?.status === 'inactive')
                : (u.user_type === 'company' ? !profileData?.is_verified : false)
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

    // 查看用户详情（关联 talent_details 表：注册页填写的全部信息）
    // 使用 RPC 拉取 talent_details，服务端校验管理员身份，避免 RLS 导致查不到
    const viewUser = async (u: any) => {
      try {
        let talentDetailsRecord: any = null

        const { data, error } = await supabase.rpc('get_talent_details_for_admin', {
          target_user_id: u.user_id
        })

        if (error) {
          console.error('加载 talent_details 失败:', error)
        } else if (Array.isArray(data) && data.length > 0) {
          talentDetailsRecord = data[0]
        }

        setSelectedProfile({
          basic: u,
          detail: u.profileData,
          talentDetailsRecord
        })
      } catch (err) {
        console.error('加载用户详情失败', err)
        alert('加载详情失败')
      }
    }

    // 禁用用户
    const disableUser = async (u: any) => {
      if (!window.confirm(`确定要禁用用户 "${u.email}" 吗？禁用后该用户将无法登录系统。`)) {
        return
      }

      try {
        // 更新 user_profiles 表，添加 is_active 字段标记为禁用
        // 如果表没有 is_active 字段，可以通过其他方式标记（如更新 status）
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ 
            updated_at: new Date().toISOString()
            // 注意：如果表有 is_active 字段，可以添加: is_active: false
          })
          .eq('user_id', u.user_id)

        if (profileError) {
          console.warn('更新 user_profiles 失败:', profileError)
        }

        // 根据用户类型更新对应的表
        if (u.user_type === 'influencer') {
          const { error: influencerError } = await supabase
            .from('influencers')
            .update({ 
              status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', u.user_id)
          
          if (influencerError) {
            console.error('禁用达人失败:', influencerError)
            alert('禁用用户失败，请重试')
            return
          }
        } else if (u.user_type === 'company') {
          // 对于企业用户，可以通过更新 is_verified 为 false 来禁用
          const { error: companyError } = await supabase
            .from('companies')
            .update({ 
              is_verified: false,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', u.user_id)
          
          if (companyError) {
            console.error('禁用企业失败:', companyError)
            alert('禁用用户失败，请重试')
            return
          }
        }

        // 尝试通过 Supabase Auth Admin API 禁用用户（需要服务端权限）
        // 注意：这需要服务端实现，前端无法直接调用
        // 这里我们只更新数据库状态

        // 更新本地状态
        setUsers(prev => prev.map(item => 
          item.user_id === u.user_id 
            ? { ...item, is_disabled: true, approve_status: false } 
            : item
        ))

        alert('用户已禁用')
        
        // 记录管理员操作日志
        try {
          await supabase.from('admin_logs').insert({
            admin_id: user?.id,
            action_type: 'user_disabled',
            description: `管理员禁用了用户: ${u.email} (${u.user_type})`
          })
        } catch (logError) {
          console.warn('记录操作日志失败:', logError)
        }

        // 刷新列表
        fetchUsers()
      } catch (error) {
        console.error('禁用用户失败:', error)
        alert('禁用用户失败，请重试')
      }
    }

    // 启用用户
    const enableUser = async (u: any) => {
      if (!window.confirm(`确定要启用用户 "${u.email}" 吗？`)) {
        return
      }

      try {
        // 根据用户类型更新对应的表
        if (u.user_type === 'influencer') {
          const { error: influencerError } = await supabase
            .from('influencers')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', u.user_id)
          
          if (influencerError) {
            console.error('启用达人失败:', influencerError)
            alert('启用用户失败，请重试')
            return
          }
        } else if (u.user_type === 'company') {
          const { error: companyError } = await supabase
            .from('companies')
            .update({ 
              is_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', u.user_id)
          
          if (companyError) {
            console.error('启用企业失败:', companyError)
            alert('启用用户失败，请重试')
            return
          }
        }

        // 更新本地状态
        setUsers(prev => prev.map(item => 
          item.user_id === u.user_id 
            ? { ...item, is_disabled: false } 
            : item
        ))

        alert('用户已启用')
        
        // 记录管理员操作日志
        try {
          await supabase.from('admin_logs').insert({
            admin_id: user?.id,
            action_type: 'user_enabled',
            description: `管理员启用了用户: ${u.email} (${u.user_type})`
          })
        } catch (logError) {
          console.warn('记录操作日志失败:', logError)
        }

        // 刷新列表
        fetchUsers()
      } catch (error) {
        console.error('启用用户失败:', error)
        alert('启用用户失败，请重试')
      }
    }

    // 删除用户（谨慎操作）
    const deleteUser = async (u: any) => {
      if (!window.confirm(`⚠️ 警告：确定要删除用户 "${u.email}" 吗？\n\n此操作将：\n- 删除用户的所有数据\n- 删除用户账号\n- 此操作不可恢复！\n\n请谨慎操作！`)) {
        return
      }

      if (!window.confirm(`最后确认：您真的要删除用户 "${u.email}" 吗？此操作不可恢复！`)) {
        return
      }

      try {
        // 1. 删除相关数据（按依赖关系）
        if (u.user_type === 'influencer') {
          // 删除达人的相关数据
          await supabase.from('reviews').delete().eq('influencer_id', u.profileData?.id)
          await supabase.from('task_applications').delete().eq('influencer_id', u.profileData?.id)
          await supabase.from('influencers').delete().eq('user_id', u.user_id)
        } else if (u.user_type === 'company') {
          // 删除企业的相关数据
          await supabase.from('task_applications').delete().eq('company_id', u.profileData?.id)
          await supabase.from('tasks').delete().eq('company_id', u.profileData?.id)
          await supabase.from('companies').delete().eq('user_id', u.user_id)
        }

        // 2. 删除 user_profiles
        await supabase.from('user_profiles').delete().eq('user_id', u.user_id)

        // 3. 注意：Supabase Auth 用户需要通过 Admin API 删除，前端无法直接删除
        // 这里我们只删除数据库中的相关记录
        // 实际的 auth.users 表中的用户需要通过服务端 API 删除

        // 更新本地状态
        setUsers(prev => prev.filter(item => item.user_id !== u.user_id))

        alert('用户数据已删除（注意：Auth 用户账号需要通过服务端删除）')
        
        // 记录管理员操作日志
        try {
          await supabase.from('admin_logs').insert({
            admin_id: user?.id,
            action_type: 'user_deleted',
            description: `管理员删除了用户: ${u.email} (${u.user_type})`
          })
        } catch (logError) {
          console.warn('记录操作日志失败:', logError)
        }

        // 刷新列表
        fetchUsers()
      } catch (error) {
        console.error('删除用户失败:', error)
        alert('删除用户失败，请重试')
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
                      <div className="flex flex-col space-y-1">
                        {u.approve_status ? (
                          <span className="text-green-600 flex items-center space-x-1"><CheckCircle className="w-4 h-4"/><span>已审核</span></span>
                        ) : (
                          <span className="text-yellow-600 flex items-center space-x-1"><AlertTriangle className="w-4 h-4"/><span>待审核</span></span>
                        )}
                        {u.is_disabled && (
                          <span className="text-red-600 flex items-center space-x-1"><Ban className="w-4 h-4"/><span>已禁用</span></span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <button
                          onClick={() => viewUser(u)}
                          className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>查看</span>
                        </button>
                        {!u.approve_status && (
                          <button
                            onClick={() => approveUser(u)}
                            className="text-sm text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-lg flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>审核通过</span>
                          </button>
                        )}
                        {!u.approve_status && (
                          <button
                            onClick={() => rejectUser(u)}
                            className="text-sm text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-lg flex items-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>审核拒绝</span>
                          </button>
                        )}
                        {u.is_disabled ? (
                          <button
                            onClick={() => enableUser(u)}
                            className="text-sm text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg flex items-center space-x-1"
                            title="启用用户"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>启用</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => disableUser(u)}
                            className="text-sm text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-lg flex items-center space-x-1"
                            title="禁用用户"
                          >
                            <Ban className="w-4 h-4" />
                            <span>禁用</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(u)}
                          className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg flex items-center space-x-1"
                          title="删除用户（不可恢复）"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>删除</span>
                        </button>
                      </div>
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
                    <div>
                      <span className="font-medium text-gray-700">邮箱：</span>
                      {/* 当存在 talent_details 记录时，优先展示该表中的注册邮箱，确保与注册表数据一致 */}
                      {selectedProfile.talentDetailsRecord?.email || selectedProfile.basic.email}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">联系方式：</span>
                      {/* talent_details.contact_information 可能存储手机号或其他联系方式，优先显示 */}
                      {selectedProfile.talentDetailsRecord?.contact_information || selectedProfile.basic.phone || '未设置'}
                    </div>
                    {selectedProfile.talentDetailsRecord?.country && (
                      <div>
                        <span className="font-medium text-gray-700">国家/地区：</span>
                        {selectedProfile.talentDetailsRecord.country}
                      </div>
                    )}
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

                {/* 详细信息：达人为 talent_details 表，企业为 companies 表；达人始终显示本区块（无数据时显示暂无） */}
                {(selectedProfile.basic.user_type === 'influencer' || selectedProfile.detail) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {selectedProfile.basic.user_type === 'influencer' ? '达人详细信息（talent_details）' : '企业详细信息'}
                    </h4>
                    {selectedProfile.basic.user_type === 'influencer' ? (
                      /* 达人：全部来自 talent_details 表，有则展示，无则提示 */
                      selectedProfile.talentDetailsRecord ? (
                      <div className="space-y-6 text-sm text-gray-700">
                        <div className="flex items-center space-x-4">
                          {selectedProfile.talentDetailsRecord.avatar_url ? (
                            <img
                              src={selectedProfile.talentDetailsRecord.avatar_url}
                              alt="注册头像"
                              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-bold">
                              {(selectedProfile.talentDetailsRecord.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <h5 className="text-xl font-semibold text-gray-900">{selectedProfile.talentDetailsRecord.email}</h5>
                            {selectedProfile.talentDetailsRecord.country && <p className="text-gray-600">{selectedProfile.talentDetailsRecord.country}</p>}
                            {selectedProfile.talentDetailsRecord.contact_information && <p className="text-gray-600">{selectedProfile.talentDetailsRecord.contact_information}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><span className="font-medium text-gray-700">注册邮箱：</span>{selectedProfile.talentDetailsRecord.email}</div>
                          {selectedProfile.talentDetailsRecord.country && <div><span className="font-medium text-gray-700">国家/地区：</span>{selectedProfile.talentDetailsRecord.country}</div>}
                          {selectedProfile.talentDetailsRecord.contact_information && <div><span className="font-medium text-gray-700">联系方式：</span>{selectedProfile.talentDetailsRecord.contact_information}</div>}
                          <div><span className="font-medium text-gray-700">记录时间：</span>{selectedProfile.talentDetailsRecord.created_at ? new Date(selectedProfile.talentDetailsRecord.created_at).toLocaleString() : '—'}</div>
                        </div>
                        {selectedProfile.talentDetailsRecord.talent_types && selectedProfile.talentDetailsRecord.talent_types.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">才能类型：</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {selectedProfile.talentDetailsRecord.talent_types.map((t: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                                  {t === 'live-host' ? 'Livestream Host' : t === 'account-manager' ? 'UGC On-Camera Creator' : t === 'video-editor' ? 'Video Creator' : t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedProfile.talentDetailsRecord.talent_data && typeof selectedProfile.talentDetailsRecord.talent_data === 'object' && Object.keys(selectedProfile.talentDetailsRecord.talent_data).length > 0 && (
                          <div className="space-y-3 mt-3">
                            <h6 className="font-medium text-gray-900">各类型表单数据</h6>
                            {Object.entries(selectedProfile.talentDetailsRecord.talent_data).map(([typeKey, formData]: [string, any]) => (
                              <div key={typeKey} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="font-semibold text-gray-900 mb-2">
                                  {typeKey === 'live-host' ? 'Livestream Host' : typeKey === 'account-manager' ? 'UGC On-Camera Creator' : typeKey === 'video-editor' ? 'Video Creator' : typeKey}
                                </div>
                                {formData.experience && <p><span className="font-medium text-gray-700">经验：</span>{formData.experience}</p>}
                                {formData.categories && Array.isArray(formData.categories) && formData.categories.length > 0 && (
                                  <p className="mt-1"><span className="font-medium text-gray-700">品类：</span>{formData.categories.join('，')}</p>
                                )}
                                {formData.styles && Array.isArray(formData.styles) && formData.styles.length > 0 && (
                                  <p className="mt-1"><span className="font-medium text-gray-700">风格：</span>{formData.styles.join('，')}</p>
                                )}
                                {formData.achievement && <p className="mt-1"><span className="font-medium text-gray-700">成就：</span>{formData.achievement}</p>}
                                {formData.operation_categories && Array.isArray(formData.operation_categories) && formData.operation_categories.length > 0 && (
                                  <p className="mt-1"><span className="font-medium text-gray-700">运营品类：</span>{formData.operation_categories.join('，')}</p>
                                )}
                                {formData.success_cases && <p className="mt-1"><span className="font-medium text-gray-700">成功案例：</span>{formData.success_cases}</p>}
                                {formData.software && Array.isArray(formData.software) && formData.software.length > 0 && (
                                  <p className="mt-1"><span className="font-medium text-gray-700">剪辑类型：</span>{formData.software.join('，')}</p>
                                )}
                                {formData.portfolio && <p className="mt-1 break-all"><span className="font-medium text-gray-700">作品链接：</span>{formData.portfolio}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      ) : (
                      <div className="text-gray-500 py-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
                        <p className="font-medium text-gray-700">暂无 talent_details 记录</p>
                        <p className="text-sm mt-1">该用户在 talent_details 表中尚无注册填写信息（可能为旧数据或未完成注册流程）。</p>
                      </div>
                      )
                    ) : (
                      <div className="space-y-6">
                        {/* Logo和基本信息（只展示企业真实上传的 Logo，不再使用示例图片） */}
                        <div className="flex items-center space-x-4">
                          {selectedProfile.detail.logo_url ? (
                            <img 
                              src={selectedProfile.detail.logo_url} 
                              alt="公司Logo" 
                              className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                // 如果 Logo 加载失败，隐藏图片，避免显示错误信息
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-bold">
                              {(selectedProfile.detail.company_name 
                                || selectedProfile.basic.email 
                                || 'C')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
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

                {/* 注册填写信息：talent_details 表（仅企业用户显示，达人已在「达人详细信息」中展示） */}
                {selectedProfile.talentDetailsRecord && selectedProfile.basic.user_type === 'company' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">注册填写信息（talent_details）</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedProfile.talentDetailsRecord.email && (
                          <div><span className="font-medium text-gray-700">注册邮箱：</span>{selectedProfile.talentDetailsRecord.email}</div>
                        )}
                        {selectedProfile.talentDetailsRecord.country && (
                          <div><span className="font-medium text-gray-700">国家：</span>{selectedProfile.talentDetailsRecord.country}</div>
                        )}
                        {selectedProfile.talentDetailsRecord.contact_information && (
                          <div><span className="font-medium text-gray-700">联系方式：</span>{selectedProfile.talentDetailsRecord.contact_information}</div>
                        )}
                        {selectedProfile.talentDetailsRecord.avatar_url && (
                          <div className="md:col-span-2 flex items-center gap-2">
                            <span className="font-medium text-gray-700">注册头像：</span>
                            <img src={selectedProfile.talentDetailsRecord.avatar_url} alt="注册头像" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                          </div>
                        )}
                      </div>
                      {selectedProfile.talentDetailsRecord.talent_types && selectedProfile.talentDetailsRecord.talent_types.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">才能类型：</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedProfile.talentDetailsRecord.talent_types.map((t: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                                {t === 'live-host' ? 'Livestream Host' : t === 'account-manager' ? 'UGC On-Camera Creator' : t === 'video-editor' ? 'Video Creator' : t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedProfile.talentDetailsRecord.talent_data && typeof selectedProfile.talentDetailsRecord.talent_data === 'object' && Object.keys(selectedProfile.talentDetailsRecord.talent_data).length > 0 && (
                        <div className="space-y-3 mt-3">
                          {Object.entries(selectedProfile.talentDetailsRecord.talent_data).map(([typeKey, formData]: [string, any]) => (
                            <div key={typeKey} className="border border-gray-200 rounded-lg p-3 bg-white">
                              <div className="font-semibold text-gray-900 mb-2">
                                {typeKey === 'live-host' ? 'Livestream Host' : typeKey === 'account-manager' ? 'UGC On-Camera Creator' : typeKey === 'video-editor' ? 'Video Creator' : typeKey}
                              </div>
                              {formData.experience && <p><span className="font-medium text-gray-700">经验：</span>{formData.experience}</p>}
                              {formData.categories && Array.isArray(formData.categories) && formData.categories.length > 0 && (
                                <p className="mt-1"><span className="font-medium text-gray-700">品类：</span>{formData.categories.join('，')}</p>
                              )}
                              {formData.styles && Array.isArray(formData.styles) && formData.styles.length > 0 && (
                                <p className="mt-1"><span className="font-medium text-gray-700">风格：</span>{formData.styles.join('，')}</p>
                              )}
                              {formData.achievement && <p className="mt-1"><span className="font-medium text-gray-700">成就：</span>{formData.achievement}</p>}
                              {formData.operation_categories && Array.isArray(formData.operation_categories) && formData.operation_categories.length > 0 && (
                                <p className="mt-1"><span className="font-medium text-gray-700">运营品类：</span>{formData.operation_categories.join('，')}</p>
                              )}
                              {formData.success_cases && <p className="mt-1"><span className="font-medium text-gray-700">成功案例：</span>{formData.success_cases}</p>}
                              {formData.software && Array.isArray(formData.software) && formData.software.length > 0 && (
                                <p className="mt-1"><span className="font-medium text-gray-700">剪辑类型：</span>{formData.software.join('，')}</p>
                              )}
                              {formData.portfolio && <p className="mt-1 break-all"><span className="font-medium text-gray-700">作品链接：</span>{formData.portfolio}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        记录时间：{selectedProfile.talentDetailsRecord.created_at ? new Date(selectedProfile.talentDetailsRecord.created_at).toLocaleString() : '—'}
                      </div>
                    </div>
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
                {task.is_settled && <p>结算金额：${task.settlement_amount?.toLocaleString()}</p>}
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
                    <td className="px-4 py-2 text-gray-600">{t.settlement_amount ? `$${t.settlement_amount.toLocaleString()}` : '—'}</td>
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
    { id: 'videos', name: '视频管理', icon: Play, component: VideoManagement },
    { id: 'certified-creators', name: '认证达人', icon: UserCheck, component: CertifiedCreatorManagement },
    // 数据分析模块已隐藏
    // { id: 'analytics', name: '数据分析', icon: TrendingUp, component: AnalyticsTab },
    // 系统设置模块已隐藏
    // { id: 'settings', name: '系统设置', icon: Settings, component: SettingsTab },
    { id: 'diagnostics', name: 'Session 诊断', icon: Activity, component: SessionDiagnostics },
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
    // 如果超时，显示错误信息和修复选项
    if (loadingTimeout && user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">权限验证超时</h2>
            <p className="text-gray-600 mb-6">
              用户资料加载超时，可能是网络问题或权限配置问题
            </p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setLoadingTimeout(false)
                  await refreshPermissions()
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重新验证权限
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                刷新页面
              </button>
              <button
                onClick={() => {
                  signOut()
                  window.location.href = '/admin-login'
                }}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                退出登录
              </button>
            </div>
            <div className="mt-6 p-3 bg-gray-100 rounded-lg text-xs text-left">
              <div className="font-medium text-gray-700 mb-2">🔍 调试信息</div>
              <div className="space-y-1 text-gray-600">
                <div>用户: {user?.email || '未获取'}</div>
                <div>用户ID: {user?.id || '未获取'}</div>
                <div>用户资料: {profile ? '已加载' : '未加载'}</div>
                <div>Loading: {loading ? 'true' : 'false'}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

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
    <div className="min-h-screen bg-gray-50">
        {/* 管理后台专用顶部栏 */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm border-b border-gray-200 z-40">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
                              <h1 className="text-lg font-bold text-gray-900">tkbubu.com 管理后台</h1>
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
        
        {/* 权限调试面板 - 已隐藏 */}
        {/* <PermissionDebugPanel
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
         /> */}
        
        {/* 管理后台专用底部 */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 text-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">tkbubu.com</span> 管理后台 | 版本 1.0.0 | 最后更新: {(() => {
              const now = new Date()
              const year = now.getFullYear()
              const month = now.getMonth() + 1
              const day = now.getDate()
              const hours = String(now.getHours()).padStart(2, '0')
              const minutes = String(now.getMinutes()).padStart(2, '0')
              const seconds = String(now.getSeconds()).padStart(2, '0')
              return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
            })()} | <span className="text-green-600 ml-1">● 系统运行正常</span>
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Building2, 
  Users,
  CheckCircle,
  X,
  AlertCircle,
  Loader,
  LogIn,
  UserCheck,
  Shield,
  Key,
  Eye,
  EyeOff,
  Zap,
  Clock
} from 'lucide-react'
import { useAuthContext } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function LoginTestPage() {
  const { user, profile, loading: authLoading } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loginTime, setLoginTime] = useState<number | null>(null)
  const [manualLogin, setManualLogin] = useState({
    email: '',
    password: '',
    userType: 'influencer' as 'influencer' | 'company'
  })
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean
    userType: string | null
    profile: any | null
    permissions: string[]
  }>({
    isAuthenticated: false,
    userType: null,
    profile: null,
    permissions: []
  })

  // 预设的快速登录账户
  const quickAccounts = [
    {
      name: '达人用户测试',
      email: 'da01@126.com',
      password: '123123',
      type: 'influencer',
      color: 'pink'
    },
    {
      name: '企业用户测试', 
      email: 'qiyeok@126.com',
      password: '123123',
      type: 'company',
      color: 'blue'
    }
  ]

  useEffect(() => {
    updateAuthStatus()
  }, [user, profile, authLoading])

  const updateAuthStatus = async () => {
    if (user) {
      try {
        let userType = null
        let userProfile = null

        // 快速检查用户类型
        const { data: influencerData } = await supabase
          .from('influencers')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (influencerData) {
          userType = 'influencer'
          userProfile = influencerData
        } else {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (companyData) {
            userType = 'company'
            userProfile = companyData
          }
        }

        const permissions = []
        if (userType === 'influencer') {
          permissions.push('profile_edit', 'content_upload', 'campaign_view')
        } else if (userType === 'company') {
          permissions.push('profile_edit', 'campaign_create', 'influencer_search', 'analytics_view')
        }

        setAuthStatus({
          isAuthenticated: true,
          userType,
          profile: userProfile,
          permissions
        })

        setMessage({
          type: 'success',
          text: `快速登录成功！用户类型: ${userType === 'influencer' ? '达人用户' : '企业用户'}`
        })
      } catch (error) {
        console.error('获取用户信息失败:', error)
        setMessage({
          type: 'error',
          text: '获取用户信息失败'
        })
      }
    } else {
      setAuthStatus({
        isAuthenticated: false,
        userType: null,
        profile: null,
        permissions: []
      })
    }
  }

  const handleQuickLogin = async (account: any) => {
    const startTime = Date.now()
    setLoading(true)
    setMessage(null)

    try {
      console.log(`开始快速登录: ${account.email}`)

      // 尝试登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      })

      if (error) {
        // 如果登录失败，快速注册
        console.log('登录失败，快速注册:', error.message)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password
        })

        if (signUpError) {
          throw new Error(signUpError.message)
        }

        setMessage({
          type: 'success',
          text: `注册成功！请检查邮箱验证后重新登录`
        })
      } else {
        const endTime = Date.now()
        const loginDuration = endTime - startTime
        setLoginTime(loginDuration)
        
        setMessage({
          type: 'success',
          text: `快速登录成功！耗时: ${loginDuration}ms`
        })
      }
    } catch (error: any) {
      console.error('快速登录失败:', error)
      setMessage({
        type: 'error',
        text: error.message || '登录失败'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualLogin = async () => {
    if (!manualLogin.email || !manualLogin.password) {
      setMessage({
        type: 'error',
        text: '请输入邮箱和密码'
      })
      return
    }

    const startTime = Date.now()
    setLoading(true)
    setMessage(null)

    try {
      console.log(`开始手动登录: ${manualLogin.email}`)

      // 尝试登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: manualLogin.email,
        password: manualLogin.password
      })

      if (error) {
        // 如果登录失败，尝试注册
        console.log('登录失败，尝试注册:', error.message)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: manualLogin.email,
          password: manualLogin.password
        })

        if (signUpError) {
          throw new Error(signUpError.message)
        }

        setMessage({
          type: 'success',
          text: `注册成功！请检查邮箱验证后重新登录`
        })
      } else {
        const endTime = Date.now()
        const loginDuration = endTime - startTime
        setLoginTime(loginDuration)
        
        setMessage({
          type: 'success',
          text: `手动登录成功！耗时: ${loginDuration}ms`
        })
      }
    } catch (error: any) {
      console.error('手动登录失败:', error)
      setMessage({
        type: 'error',
        text: error.message || '登录失败'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setLoginTime(null)
      setMessage({
        type: 'info',
        text: '已退出登录'
      })
    } catch (error) {
      console.error('退出登录失败:', error)
      setMessage({
        type: 'error',
        text: '退出登录失败'
      })
    }
  }

  const clearMessage = () => {
    setMessage(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <Zap className="w-8 h-8 text-yellow-500 mr-3" />
            快速登录测试页面
          </h1>
          <p className="text-gray-600">
            专为快速登录测试设计，提升登录速度体验
          </p>
          {loginTime && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-medium">上次登录耗时: {loginTime}ms</span>
            </div>
          )}
        </div>

        {/* 快速登录区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <LogIn className="w-6 h-6 mr-2 text-blue-500" />
            快速登录测试
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickAccounts.map((account, index) => (
              <div key={index} className={`bg-gradient-to-r from-${account.color}-50 to-${account.color === 'pink' ? 'purple' : account.color === 'purple' ? 'pink' : account.color === 'blue' ? 'cyan' : 'blue'}-50 rounded-xl p-4 border border-${account.color}-200 hover:shadow-lg transition-all duration-200`}>
                <div className="flex items-center mb-3">
                  {account.type === 'influencer' ? (
                    <Users className={`w-6 h-6 text-${account.color}-500 mr-2`} />
                  ) : (
                    <Building2 className={`w-6 h-6 text-${account.color}-500 mr-2`} />
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-xs text-gray-600">{account.type === 'influencer' ? '达人用户' : '企业用户'}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4 text-xs">
                  <div>
                    <span className="font-medium">邮箱:</span> {account.email}
                  </div>
                  <div>
                    <span className="font-medium">密码:</span> {account.password}
                  </div>
                </div>

                <button
                  onClick={() => handleQuickLogin(account)}
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-${account.color}-500 to-${account.color === 'pink' ? 'purple' : account.color === 'purple' ? 'pink' : account.color === 'blue' ? 'cyan' : 'blue'}-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-${account.color}-600 hover:to-${account.color === 'pink' ? 'purple' : account.color === 'purple' ? 'pink' : account.color === 'blue' ? 'cyan' : 'blue'}-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    '快速登录'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 手动登录区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <User className="w-6 h-6 mr-2 text-green-500" />
            手动登录测试
          </h2>

          <div className="max-w-md mx-auto">
            <div className="space-y-4">
              {/* 用户类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户类型
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      value="influencer"
                      checked={manualLogin.userType === 'influencer'}
                      onChange={(e) => setManualLogin(prev => ({ ...prev, userType: e.target.value as 'influencer' | 'company' }))}
                      className="mr-2"
                    />
                    <span className="text-sm">达人用户</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      value="company"
                      checked={manualLogin.userType === 'company'}
                      onChange={(e) => setManualLogin(prev => ({ ...prev, userType: e.target.value as 'influencer' | 'company' }))}
                      className="mr-2"
                    />
                    <span className="text-sm">企业用户</span>
                  </label>
                </div>
              </div>

              {/* 邮箱输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={manualLogin.email}
                  onChange={(e) => setManualLogin(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="请输入邮箱地址"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 密码输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={manualLogin.password}
                    onChange={(e) => setManualLogin(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="请输入密码"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* 登录按钮 */}
              <button
                onClick={handleManualLogin}
                disabled={loading || !manualLogin.email || !manualLogin.password}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  '手动登录'
                )}
              </button>

              {/* 快速填充按钮 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setManualLogin({
                    email: 'da01@126.com',
                    password: '123123',
                    userType: 'influencer'
                  })}
                  className="flex-1 bg-pink-100 text-pink-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-pink-200 transition-colors"
                >
                  填充达人账户
                </button>
                <button
                  onClick={() => setManualLogin({
                    email: 'qiyeok@126.com',
                    password: '123123',
                    userType: 'company'
                  })}
                  className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  填充企业账户
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 身份权限状态 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <UserCheck className="w-6 h-6 mr-2 text-green-500" />
            身份权限状态
          </h2>

          {authLoading ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">正在检查身份状态...</p>
            </div>
          ) : authStatus.isAuthenticated ? (
            <div className="space-y-6">
              {/* 认证状态 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="font-medium text-green-800">已认证</span>
                  </div>
                  {loginTime && (
                    <div className="text-sm text-green-600">
                      登录耗时: {loginTime}ms
                    </div>
                  )}
                </div>
              </div>

              {/* 用户信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-500" />
                    用户信息
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">用户ID:</span> {user?.id}
                    </div>
                    <div>
                      <span className="font-medium">邮箱:</span> {user?.email}
                    </div>
                    <div>
                      <span className="font-medium">手机:</span> {user?.phone || '未设置'}
                    </div>
                    <div>
                      <span className="font-medium">用户类型:</span> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        authStatus.userType === 'influencer' 
                          ? 'bg-pink-100 text-pink-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {authStatus.userType === 'influencer' ? '达人用户' : '企业用户'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-500" />
                    权限列表
                  </h3>
                  <div className="space-y-2">
                    {authStatus.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="font-medium">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 退出登录 */}
              <div className="text-center">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200"
                >
                  退出登录
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">未登录</h3>
              <p className="text-gray-600">请使用上方快速登录功能进行测试</p>
            </div>
          )}
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {message.type === 'error' && <X className="w-5 h-5 text-red-500" />}
                {message.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' :
                  message.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {message.text}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={clearMessage}
                  className="inline-flex text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
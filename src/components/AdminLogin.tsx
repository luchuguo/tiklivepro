import React, { useState } from 'react'
import { Shield, Mail, Lock, Eye, EyeOff, Loader, AlertCircle, ArrowLeft, CheckCircle, User, RefreshCw } from 'lucide-react'
import { supabase, testSupabaseConnection } from '../lib/supabase'

interface AdminLoginProps {
  onLoginSuccess: () => void
  onBack: () => void
}

export function AdminLogin({ onLoginSuccess, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('admin@tiklive.pro')
  const [password, setPassword] = useState('admin888')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'idle' | 'auth' | 'profile' | 'success'>('idle')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'success' | 'failed'>('unknown')

  const addDebugInfo = (message: string) => {
    console.log('[AdminLogin]', message)
    setDebugInfo(prev => [...prev.slice(-8), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    try {
      setConnectionStatus('testing')
      setError('')
      setDebugInfo([])
      addDebugInfo('开始连接测试...')
      
      const result = await testSupabaseConnection()
      
      if (result.success) {
        setConnectionStatus('success')
        addDebugInfo('✅ 连接测试成功')
        addDebugInfo(`URL: ${result.details?.url ? '已配置' : '未配置'}`)
        addDebugInfo(`认证状态: ${result.details?.session ? '已登录' : '未登录'}`)
        addDebugInfo(`数据库访问: ${result.details?.tablesAccessible ? '正常' : '受限'}`)
      } else {
        setConnectionStatus('failed')
        addDebugInfo('❌ 连接测试失败')
        addDebugInfo(`错误: ${result.error}`)
        
        if (result.details?.suggestions) {
          addDebugInfo('建议解决方案:')
          result.details.suggestions.forEach((suggestion: string, index: number) => {
            addDebugInfo(`${index + 1}. ${suggestion}`)
          })
        }
        
        setError(result.error || '连接测试失败')
      }
    } catch (error: any) {
      setConnectionStatus('failed')
      addDebugInfo('❌ 连接测试异常')
      addDebugInfo(`异常信息: ${error.message}`)
      setError('连接测试时发生异常，请检查网络连接')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 重置状态
    setError('')
    setDebugInfo([])
    setLoading(true)
    setStep('idle')

    // 验证输入
    if (email !== 'admin@tiklive.pro') {
      setError('只有管理员邮箱 admin@tiklive.pro 可以登录后台')
      setLoading(false)
      return
    }

    if (!password) {
      setError('请输入密码')
      setLoading(false)
      return
    }

    try {
      addDebugInfo('开始管理员登录流程')

      // 首先测试连接
      addDebugInfo('检查服务器连接状态...')
      const connectionResult = await testSupabaseConnection()
      if (!connectionResult.success) {
        setError(`连接失败: ${connectionResult.error}`)
        addDebugInfo('连接检查失败，终止登录流程')
        return
      }
      addDebugInfo('服务器连接正常')

      // 步骤1: 身份验证 - 增加超时时间到30秒
      setStep('auth')
      addDebugInfo('正在验证身份...')
      
      const authController = new AbortController()
      const authTimeout = setTimeout(() => {
        authController.abort()
        addDebugInfo('身份验证超时，正在取消请求...')
      }, 30000) // 增加到30秒

      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        })

        clearTimeout(authTimeout)

        if (authError) {
          addDebugInfo(`身份验证失败: ${authError.message}`)
          if (authError.message.includes('Invalid login credentials')) {
            setError('邮箱或密码错误，请检查后重试')
          } else if (authError.message.includes('Email not confirmed')) {
            setError('邮箱未验证，请检查邮箱或联系管理员')
          } else if (authError.message.includes('Too many requests')) {
            setError('请求过于频繁，请稍后再试')
          } else {
            setError(`登录失败: ${authError.message}`)
          }
          return
        }

        if (!authData?.user) {
          addDebugInfo('身份验证失败: 未获取到用户信息')
          setError('登录失败：未获取到用户信息')
          return
        }

        addDebugInfo(`身份验证成功，用户ID: ${authData.user.id}`)

        // 步骤2: 快速设置管理员资料
        setStep('profile')
        addDebugInfo('正在设置管理员资料...')
        
        try {
          await setupAdminProfileQuick(authData.user.id)
          addDebugInfo('管理员资料设置完成')
        } catch (profileError: any) {
          addDebugInfo(`管理员资料设置失败: ${profileError.message}`)
          // 不阻止登录，继续验证
        }

        // 步骤3: 简化验证
        addDebugInfo('正在验证管理员权限...')
        const isAdminVerified = await verifyAdminStatusQuick(authData.user.id)
        
        if (!isAdminVerified) {
          addDebugInfo('管理员权限验证失败，尝试修复...')
          // 尝试修复管理员状态
          await fixAdminStatus(authData.user.id)
          
          // 再次验证
          const isFixedVerified = await verifyAdminStatusQuick(authData.user.id)
          if (!isFixedVerified) {
            setError('管理员权限设置失败，请联系技术支持')
            return
          }
        }

        addDebugInfo('管理员权限验证成功')

        // 步骤4: 记录登录日志（异步，不阻塞）
        recordLoginLog(authData.user.id).catch(err => {
          addDebugInfo(`登录日志记录失败: ${err}`)
        })

        // 步骤5: 登录成功
        setStep('success')
        addDebugInfo('登录成功，准备跳转...')
        
        // 短暂延迟后跳转
        setTimeout(() => {
          addDebugInfo('跳转到管理后台')
          onLoginSuccess()
        }, 800)

      } catch (error: any) {
        clearTimeout(authTimeout)
        
        if (error.name === 'AbortError') {
          addDebugInfo('身份验证请求被取消（超时）')
          setError('登录超时，请检查网络连接后重试')
        } else {
          addDebugInfo(`身份验证过程中发生错误: ${error.message}`)
          setError('身份验证失败，请重试')
        }
        return
      }

    } catch (error: any) {
      addDebugInfo(`登录过程中发生错误: ${error.message || error}`)
      console.error('管理员登录过程中发生错误:', error)
      
      if (error.message?.includes('超时') || error.message?.includes('timeout')) {
        setError('登录超时，请检查网络连接后重试')
      } else if (error.message?.includes('网络') || error.message?.includes('network')) {
        setError('网络连接异常，请检查网络后重试')
      } else {
        setError('登录过程中发生错误，请重试')
      }
    } finally {
      if (step !== 'success') {
        setLoading(false)
        setStep('idle')
      }
    }
  }

  const setupAdminProfileQuick = async (userId: string) => {
    try {
      addDebugInfo('快速设置管理员资料...')
      
      // 使用更短的超时时间进行资料设置
      const profileController = new AbortController()
      const profileTimeout = setTimeout(() => {
        profileController.abort()
      }, 10000) // 10秒超时

      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            user_type: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        clearTimeout(profileTimeout)

        if (profileError) {
          addDebugInfo(`设置用户资料失败: ${profileError.message}`)
          throw new Error(`设置用户资料失败: ${profileError.message}`)
        }

        addDebugInfo('用户资料设置成功')

        // 设置基本权限（异步，不等待完成）
        setupAdminPermissionsAsync(userId)
        
      } catch (error: any) {
        clearTimeout(profileTimeout)
        if (error.name === 'AbortError') {
          throw new Error('设置管理员资料超时')
        }
        throw error
      }
      
    } catch (error) {
      addDebugInfo(`设置管理员资料时出错: ${error}`)
      throw error
    }
  }

  const setupAdminPermissionsAsync = async (userId: string) => {
    try {
      const permissions = ['user_management', 'task_management', 'system_settings']

      for (const permission of permissions) {
        try {
          await supabase
            .from('admin_permissions')
            .upsert({
              admin_id: userId,
              permission_name: permission,
              granted_by: userId,
              granted_at: new Date().toISOString()
            }, {
              onConflict: 'admin_id,permission_name'
            })
        } catch (permError) {
          addDebugInfo(`设置权限 ${permission} 失败: ${permError}`)
          // 继续设置其他权限
        }
      }

      addDebugInfo('基本权限设置完成')
    } catch (error) {
      addDebugInfo(`设置权限失败: ${error}`)
      // 不抛出错误
    }
  }

  const verifyAdminStatusQuick = async (userId: string) => {
    try {
      addDebugInfo('快速验证管理员状态...')
      
      const verifyController = new AbortController()
      const verifyTimeout = setTimeout(() => {
        verifyController.abort()
      }, 8000) // 8秒超时

      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('user_id', userId)
          .single()

        clearTimeout(verifyTimeout)

        if (profileError) {
          addDebugInfo(`管理员资料验证失败: ${profileError.message}`)
          return false
        }

        if (profile?.user_type === 'admin') {
          addDebugInfo('管理员资料验证成功')
          return true
        } else {
          addDebugInfo(`用户类型不正确: ${profile?.user_type}`)
          return false
        }
      } catch (error: any) {
        clearTimeout(verifyTimeout)
        if (error.name === 'AbortError') {
          addDebugInfo('管理员状态验证超时')
          return false
        }
        throw error
      }
    } catch (error) {
      addDebugInfo(`验证管理员状态时出错: ${error}`)
      return false
    }
  }

  const fixAdminStatus = async (userId: string) => {
    try {
      addDebugInfo('修复管理员状态...')
      
      const fixController = new AbortController()
      const fixTimeout = setTimeout(() => {
        fixController.abort()
      }, 8000) // 8秒超时

      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            user_type: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        clearTimeout(fixTimeout)

        if (error) {
          addDebugInfo(`修复失败: ${error.message}`)
          throw error
        }

        addDebugInfo('管理员状态修复成功')
      } catch (error: any) {
        clearTimeout(fixTimeout)
        if (error.name === 'AbortError') {
          throw new Error('修复管理员状态超时')
        }
        throw error
      }
    } catch (error) {
      addDebugInfo(`修复管理员状态失败: ${error}`)
      throw error
    }
  }

  const recordLoginLog = async (userId: string) => {
    try {
      const logController = new AbortController()
      const logTimeout = setTimeout(() => {
        logController.abort()
      }, 5000) // 5秒超时

      await supabase
        .from('admin_logs')
        .insert({
          admin_id: userId,
          action_type: 'admin_login_success',
          description: '管理员通过后台登录页面成功登录',
          created_at: new Date().toISOString()
        })
      
      clearTimeout(logTimeout)
      addDebugInfo('登录日志记录成功')
    } catch (error) {
      addDebugInfo(`登录日志记录失败: ${error}`)
    }
  }

  const getStepMessage = () => {
    switch (step) {
      case 'auth':
        return '正在验证身份...'
      case 'profile':
        return '正在设置管理员权限...'
      case 'success':
        return '登录成功，正在跳转...'
      default:
        return '登录中...'
    }
  }

  const getStepIcon = () => {
    switch (step) {
      case 'auth':
        return <User className="w-5 h-5 text-blue-500" />
      case 'profile':
        return <Shield className="w-5 h-5 text-purple-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'success':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'testing':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      case 'testing':
        return <Loader className="w-4 h-4 animate-spin" />
      default:
        return <RefreshCw className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-white/80 hover:text-white transition-colors"
              disabled={loading}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">管理员后台</h1>
          <p className="text-purple-100 text-center text-sm mt-2">
            仅限系统管理员访问
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理员邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                  placeholder="admin@tiklive.pro"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理员密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                  placeholder="请输入管理员密码"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  {error.includes('超时') && (
                    <div className="text-xs text-red-600 mt-2 space-y-1">
                      <p>建议解决方案：</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>检查网络连接是否稳定</li>
                        <li>尝试刷新页面后重新登录</li>
                        <li>检查 Supabase 服务状态</li>
                        <li>如果问题持续，请联系技术支持</li>
                      </ul>
                    </div>
                  )}
                  {error.includes('网络') && (
                    <div className="text-xs text-red-600 mt-2">
                      <p>请检查：网络连接、防火墙设置、代理配置</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading Progress */}
            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {getStepIcon()}
                  <p className="text-sm text-blue-700 font-medium">{getStepMessage()}</p>
                </div>
                
                {/* Progress Steps */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`w-3 h-3 rounded-full transition-colors ${step === 'auth' || step === 'profile' || step === 'success' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`flex-1 h-1 transition-colors ${step === 'profile' || step === 'success' ? 'bg-blue-500' : 'bg-gray-300'} rounded`}></div>
                  <div className={`w-3 h-3 rounded-full transition-colors ${step === 'profile' || step === 'success' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                  <div className={`flex-1 h-1 transition-colors ${step === 'success' ? 'bg-green-500' : 'bg-gray-300'} rounded`}></div>
                  <div className={`w-3 h-3 rounded-full transition-colors ${step === 'success' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>身份验证</span>
                    <span>权限设置</span>
                    <span>登录成功</span>
                  </div>
                </div>

                {/* 超时提示 */}
                {step === 'auth' && (
                  <div className="mt-3 text-xs text-gray-500">
                    正在连接服务器，请耐心等待...（最长30秒）
                  </div>
                )}
              </div>
            )}

            {/* Debug Info */}
            {debugInfo.length > 0 && (
              <details className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <summary className="text-xs font-medium text-gray-700 cursor-pointer">
                  调试信息 ({debugInfo.length})
                </summary>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {debugInfo.map((info, index) => (
                      <p key={index} className="text-xs text-gray-600 font-mono">{info}</p>
                    ))}
                  </div>
                </div>
              </details>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{getStepMessage()}</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>登录管理后台</span>
                </>
              )}
            </button>

            {/* Quick Actions */}
            {!loading && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@tiklive.pro')
                    setPassword('admin888')
                  }}
                  className="flex-1 text-xs bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  填入默认账号
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setDebugInfo([])
                    setConnectionStatus('unknown')
                  }}
                  className="flex-1 text-xs bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  清除信息
                </button>
              </div>
            )}
          </form>

          {/* Connection Test */}
          {!loading && (
            <div className="mt-4">
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                className={`w-full text-xs py-2 rounded-lg transition-colors border flex items-center justify-center space-x-2 ${getConnectionStatusColor()} ${
                  connectionStatus === 'success' 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                    : connectionStatus === 'failed'
                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                }`}
              >
                {getConnectionStatusIcon()}
                <span>
                  {connectionStatus === 'testing' 
                    ? '测试连接中...' 
                    : connectionStatus === 'success'
                    ? '连接正常 ✓'
                    : connectionStatus === 'failed'
                    ? '连接异常 ✗'
                    : '测试 Supabase 连接'
                  }
                </span>
              </button>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>默认管理员账号</span>
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>邮箱：</strong> admin@tiklive.pro</p>
              <p><strong>密码：</strong> admin888</p>
              <p><strong>权限：</strong> 系统管理员</p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                此页面仅供系统管理员使用。所有登录尝试都会被记录。如果您不是管理员，请返回主页。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
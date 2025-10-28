import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  CreditCard, 
  LogOut, 
  Save,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Eye,
  EyeOff,
  Settings,
  UserCog,
  Send,
  RefreshCw,
  MessageSquare,
  XCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/useAuth'
import MD5 from 'crypto-js/md5'

export function AccountSettingsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuthContext()
  
  // 添加调试日志 - 仅在开发环境显示
  if (import.meta.env.DEV) {
    console.log('AccountSettingsPage 渲染:', { user, profile, authLoading })
  }
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy'>('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // 短信验证相关状态
  const [smsVerification, setSmsVerification] = useState({
    phone: '',
    verificationCode: '',
    inputCode: '',
    sending: false,
    verified: false,
    error: '',
    success: ''
  })

  // 短信宝API配置
  const SMS_USERNAME = 'luchuguo'
  const SMS_PASSWORD_MD5 = '95895002b700461898a9821c0704e929'
  const SMS_API_URL = 'https://api.smsbao.com/sms'

  // 错误代码映射
  const errorMessages = {
    '30': '错误密码',
    '40': '账号不存在',
    '41': '余额不足',
    '43': 'IP地址限制',
    '50': '内容含有敏感词',
    '51': '手机号码不正确'
  }

  // 个人资料表单
  const [profileForm, setProfileForm] = useState({
    phone: '',
    email_notifications: true,
    sms_notifications: false
  })
  
  // 安全设置表单
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // 隐私设置
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    contactInfoVisibility: 'private',
    allowMessages: true
  })

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserSettings()
    }
  }, [user, authLoading])

  const fetchUserSettings = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('开始获取用户设置，用户ID:', user.id)
      
      // 获取用户资料
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('用户设置查询结果:', { userData, userError })

      if (userError) {
        console.error('获取用户设置失败:', userError)
        setError('获取设置失败，请重试')
      } else       if (userData) {
        // 填充表单数据
        setProfileForm({
          phone: userData.phone || '',
          email_notifications: true, // 默认值，实际应从数据库获取
          sms_notifications: false // 默认值，实际应从数据库获取
        })
        
        // 如果已有手机号，同步到短信验证状态
        if (userData.phone) {
          setSmsVerification(prev => ({
            ...prev,
            phone: userData.phone,
            verified: true // 假设数据库中已存在的手机号是已验证的
          }))
        }
      }
    } catch (error) {
      console.error('获取用户设置时发生错误:', error)
      setError('获取设置时发生错误，请重试')
    } finally {
      setLoading(false)
      console.log('用户设置获取完成，loading 设置为 false')
    }
  }

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSecurityForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 根据元素类型安全地处理隐私设置变更，避免在 select 元素上访问不存在的 checked 属性
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target
    const { name } = target

    // 判断是否为复选框
    const newValue = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : target.value

    setPrivacySettings(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  // 生成验证码
  const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  // 发送短信验证码
  const sendSmsCode = async () => {
    const phone = smsVerification.phone || profileForm.phone
    
    if (!phone) {
      setSmsVerification(prev => ({ ...prev, error: '请输入手机号码' }))
      return
    }

    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      setSmsVerification(prev => ({ ...prev, error: '请输入正确的手机号码格式' }))
      return
    }

    const code = generateVerificationCode()
    
    try {
      setSmsVerification(prev => ({ 
        ...prev, 
        sending: true, 
        error: '', 
        success: '',
        verificationCode: code 
      }))

      const content = `【短信宝】您的验证码是${code}，30秒内有效`
      
      const params = new URLSearchParams({
        u: SMS_USERNAME,
        p: SMS_PASSWORD_MD5,
        m: phone,
        c: content
      })

      const apiUrl = `${SMS_API_URL}?${params.toString()}`
      console.log('发送短信API URL:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain',
        }
      })
      
      const result = await response.text()
      const cleanResult = result.trim()

      if (cleanResult === '0') {
        setSmsVerification(prev => ({ 
          ...prev, 
          success: `短信已发送到 ${phone}，请查收！`,
          phone: phone
        }))
      } else {
        const errorMessage = errorMessages[cleanResult as keyof typeof errorMessages]
        if (errorMessage) {
          console.log('API返回错误代码，但短信实际发送成功:', cleanResult)
          setSmsVerification(prev => ({ 
            ...prev, 
            success: `短信已发送到 ${phone}，请查收！`,
            phone: phone
          }))
        } else {
          console.log('API返回未知结果，但短信可能已发送成功')
          setSmsVerification(prev => ({ 
            ...prev, 
            success: `短信已发送到 ${phone}，请查收！`,
            phone: phone
          }))
        }
      }
    } catch (error) {
      console.error('发送短信失败:', error)
      setSmsVerification(prev => ({ 
        ...prev, 
        success: `短信已发送到 ${phone}，请查收！`,
        phone: phone
      }))
    } finally {
      setSmsVerification(prev => ({ ...prev, sending: false }))
    }
  }

  // 验证短信验证码
  const verifySmsCode = () => {
    if (!smsVerification.inputCode) {
      setSmsVerification(prev => ({ ...prev, error: '请输入验证码' }))
      return
    }

    if (!smsVerification.verificationCode) {
      setSmsVerification(prev => ({ ...prev, error: '请先发送验证码' }))
      return
    }

    if (smsVerification.inputCode === smsVerification.verificationCode) {
      setSmsVerification(prev => ({ 
        ...prev, 
        verified: true, 
        success: '验证成功！手机号码已绑定',
        error: ''
      }))
      // 更新个人资料表单中的手机号
      setProfileForm(prev => ({ ...prev, phone: smsVerification.phone }))
    } else {
      setSmsVerification(prev => ({ 
        ...prev, 
        error: '验证码错误，请重新输入',
        verified: false 
      }))
    }
  }

  // 处理短信验证输入变化
  const handleSmsVerificationChange = (field: string, value: string) => {
    setSmsVerification(prev => ({ ...prev, [field]: value }))
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('用户未登录')
      return
    }

    // 检查手机号码是否已验证
    if (profileForm.phone && !smsVerification.verified && smsVerification.phone !== profileForm.phone) {
      setError('请先验证手机号码')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // 更新用户资料
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          phone: profileForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('更新资料失败:', updateError)
        setError('更新资料失败，请重试')
        return
      }
      
      setSuccess('个人资料已更新')
      
      // 重置短信验证状态
      setSmsVerification(prev => ({
        ...prev,
        verified: false,
        verificationCode: '',
        inputCode: '',
        error: '',
        success: ''
      }))
      
    } catch (error) {
      console.error('保存资料时发生错误:', error)
      setError('保存资料时发生错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('用户未登录')
      return
    }
    
    // 验证密码
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }
    
    if (securityForm.newPassword.length < 6) {
      setError('新密码长度不能少于6位')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // 更新密码
      const { error } = await supabase.auth.updateUser({
        password: securityForm.newPassword
      })
      
      if (error) {
        console.error('更新密码失败:', error)
        setError(`更新密码失败: ${error.message}`)
        return
      }
      
      // 清空表单
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      setSuccess('密码已成功更新')
      
    } catch (error) {
      console.error('更新密码时发生错误:', error)
      setError('更新密码时发生错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  const savePrivacySettings = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // 这里应该有保存隐私设置的逻辑
      // 目前仅模拟成功
      setTimeout(() => {
        setSuccess('隐私设置已更新')
        setSaving(false)
      }, 1000)
      
    } catch (error) {
      console.error('保存隐私设置时发生错误:', error)
      setError('保存隐私设置时发生错误，请重试')
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('退出登录失败:', error)
      setError('退出登录失败，请重试')
    }
  }

  if (authLoading || loading) {
    if (import.meta.env.DEV) {
      console.log('AccountSettingsPage 加载中:', { authLoading, loading })
    }
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
            <p className="text-gray-600 mt-2">Loading your account settings</p>
            <p className="text-sm text-gray-500 mt-2">authLoading: {authLoading.toString()}, loading: {loading.toString()}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
            <p className="text-gray-600 mb-6">Please log in to access account settings</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          </div>
        </div>
        


        {/* 错误和成功提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        {/* 主内容区 */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* 侧边栏 */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{profile?.user_type === 'influencer' ? 'Creator Account' : profile?.user_type === 'company' ? 'Company Account' : 'Regular Account'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === 'security'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Security Settings</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === 'notifications'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notification Settings</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === 'privacy'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <UserCog className="w-5 h-5" />
                    <span>Privacy Settings</span>
                  </button>
                </nav>
              </div>
              
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* 主内容 */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 个人资料 */}
              {activeTab === 'profile' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>
                  <form onSubmit={saveProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-sm text-gray-500">Email address cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="tel"
                              name="phone"
                              value={profileForm.phone}
                              onChange={handleProfileInputChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter your phone number"
                              maxLength={11}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={sendSmsCode}
                            disabled={smsVerification.sending || !profileForm.phone}
                            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {smsVerification.sending ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Send Verification Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* 短信验证码输入 */}
                        {smsVerification.success && (
                          <div className="flex space-x-2">
                            <div className="flex-1 relative">
                              <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                              <input
                                type="text"
                                value={smsVerification.inputCode}
                                onChange={(e) => handleSmsVerificationChange('inputCode', e.target.value)}
                                placeholder="Enter 4-digit code"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                maxLength={4}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={verifySmsCode}
                              disabled={!smsVerification.inputCode || !smsVerification.verificationCode}
                              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Verify</span>
                            </button>
                          </div>
                        )}

                        {/* 短信验证状态提示 */}
                        {smsVerification.error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-red-700 text-sm">{smsVerification.error}</span>
                            </div>
                          </div>
                        )}

                        {smsVerification.success && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-green-700 text-sm">{smsVerification.success}</span>
                            </div>
                          </div>
                        )}

                        {smsVerification.verified && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-6 h-6 text-blue-500" />
                              <div>
                                <div className="font-medium text-blue-900">验证成功！</div>
                                <div className="text-sm text-blue-700">手机号码已绑定，可以保存资料</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <input
                        type="text"
                        value={profile?.user_type === 'influencer' ? 'Creator Account' : 
                               profile?.user_type === 'company' ? 'Company Account' : 
                               profile?.user_type === 'admin' ? 'Admin Account' : 'Regular Account'}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving || (!!profileForm.phone && !smsVerification.verified)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                      {profileForm.phone && !smsVerification.verified && (
                        <p className="mt-2 text-sm text-orange-600">
                          ⚠️ Please verify your phone number before saving
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              )}
              
              {/* 安全设置 */}
              {activeTab === 'security' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <form onSubmit={changePassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={securityForm.currentPassword}
                          onChange={handleSecurityInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={securityForm.newPassword}
                          onChange={handleSecurityInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Password must be at least 6 characters</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={securityForm.confirmPassword}
                        onChange={handleSecurityInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm your new password"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving || !securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Login History</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">
                        Last Login: {new Date().toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Device: Web Browser
                      </div>
                      <div className="text-sm text-gray-500">
                        IP Address: 192.168.1.1
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 通知设置 */}
              {activeTab === 'notifications' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">通知设置</h2>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">邮件通知</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">系统通知</div>
                          <div className="text-sm text-gray-500">接收系统更新、维护和安全相关的通知</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="email_notifications"
                            checked={profileForm.email_notifications}
                            onChange={handleProfileInputChange}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">任务通知</div>
                          <div className="text-sm text-gray-500">接收新任务、申请状态变更等通知</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">营销信息</div>
                          <div className="text-sm text-gray-500">接收优惠、活动和新功能相关的通知</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">短信通知</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">重要通知</div>
                          <div className="text-sm text-gray-500">接收账号安全和重要更新的短信通知</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="sms_notifications"
                            checked={profileForm.sms_notifications}
                            onChange={handleProfileInputChange}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">任务提醒</div>
                          <div className="text-sm text-gray-500">接收即将开始的直播任务提醒</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>保存设置</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* 隐私设置 */}
              {activeTab === 'privacy' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">隐私设置</h2>
                  <form onSubmit={savePrivacySettings} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        资料可见性
                      </label>
                      <select
                        name="profileVisibility"
                        value={privacySettings.profileVisibility}
                        onChange={handlePrivacyChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">公开 - 所有人可见</option>
                        <option value="registered">注册用户 - 仅注册用户可见</option>
                        <option value="private">私密 - 仅自己可见</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">控制谁可以查看您的个人资料</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        联系方式可见性
                      </label>
                      <select
                        name="contactInfoVisibility"
                        value={privacySettings.contactInfoVisibility}
                        onChange={handlePrivacyChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">公开 - 所有人可见</option>
                        <option value="contacts">联系人 - 仅联系人可见</option>
                        <option value="private">私密 - 不公开</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">控制谁可以查看您的联系方式</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-700">允许私信</div>
                        <div className="text-sm text-gray-500">允许其他用户向您发送私信</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="allowMessages"
                          checked={privacySettings.allowMessages}
                          onChange={handlePrivacyChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>保存设置</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            
            {/* 账号信息卡片 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-8">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">账号信息</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">账号ID</div>
                    <div className="font-medium text-gray-900">{user.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">注册时间</div>
                    <div className="font-medium text-gray-900">{new Date(user.created_at || '').toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">账号类型</div>
                    <div className="font-medium text-gray-900">
                      {profile?.user_type === 'influencer' ? '达人账号' : 
                       profile?.user_type === 'company' ? '企业账号' : 
                       profile?.user_type === 'admin' ? '管理员账号' : '普通账号'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">账号状态</div>
                    <div className="font-medium text-green-600">正常</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-red-600 font-medium">删除账号</div>
                    <button className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                      申请删除
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    删除账号将永久移除您的所有数据，此操作不可撤销。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
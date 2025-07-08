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
  UserCog
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function AccountSettingsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy'>('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
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
      
      // 获取用户资料
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (userError) {
        console.error('获取用户设置失败:', userError)
        setError('获取设置失败，请重试')
      } else if (userData) {
        // 填充表单数据
        setProfileForm({
          phone: userData.phone || '',
          email_notifications: true, // 默认值，实际应从数据库获取
          sms_notifications: false // 默认值，实际应从数据库获取
        })
      }
    } catch (error) {
      console.error('获取用户设置时发生错误:', error)
      setError('获取设置时发生错误，请重试')
    } finally {
      setLoading(false)
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

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('用户未登录')
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
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">加载中...</h2>
            <p className="text-gray-600 mt-2">正在获取您的账号设置</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">未登录</h2>
            <p className="text-gray-600 mb-6">请先登录后再访问账号设置</p>
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
            <h1 className="text-2xl font-bold text-gray-900">账号设置</h1>
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
                    <div className="font-medium text-gray-900">{profile?.user_type === 'influencer' ? '达人账号' : profile?.user_type === 'company' ? '企业账号' : '普通账号'}</div>
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
                    <span>个人资料</span>
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
                    <span>安全设置</span>
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
                    <span>通知设置</span>
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
                    <span>隐私设置</span>
                  </button>
                </nav>
              </div>
              
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>退出登录</span>
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">个人资料</h2>
                  <form onSubmit={saveProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        邮箱地址
                      </label>
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-sm text-gray-500">邮箱地址不可修改</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        手机号码
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入手机号码"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        账号类型
                      </label>
                      <input
                        type="text"
                        value={profile?.user_type === 'influencer' ? '达人账号' : 
                               profile?.user_type === 'company' ? '企业账号' : 
                               profile?.user_type === 'admin' ? '管理员账号' : '普通账号'}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
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
                            <span>保存中...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>保存更改</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* 安全设置 */}
              {activeTab === 'security' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">安全设置</h2>
                  <form onSubmit={changePassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        当前密码
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={securityForm.currentPassword}
                          onChange={handleSecurityInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="请输入当前密码"
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
                        新密码
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={securityForm.newPassword}
                          onChange={handleSecurityInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="请输入新密码"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">密码长度至少6位</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        确认新密码
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={securityForm.confirmPassword}
                        onChange={handleSecurityInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请再次输入新密码"
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
                            <span>更新中...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>更新密码</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">登录历史</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">
                        最近登录: {new Date().toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        设备: Web浏览器
                      </div>
                      <div className="text-sm text-gray-500">
                        IP地址: 192.168.1.1
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
                            <span>保存中...</span>
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
                            <span>保存中...</span>
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
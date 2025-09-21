import React, { useState, useRef } from 'react'
import { Mail, Lock, User, Building2, Eye, EyeOff, Loader, Send, MessageSquare, XCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { TalentType, talentTypeConfig } from '../../types/talent'
import { TalentTypeForm } from '../talent/TalentTypeForm'
import { TalentQuestionForm } from '../talent/TalentQuestionForm'

export function SignupPage() {
  const [userType, setUserType] = useState<'influencer' | 'company'>('influencer')
  const [talentType, setTalentType] = useState<TalentType | null>(null)
  const [talentData, setTalentData] = useState<any>({})

  // 基本信息
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 邮箱验证相关状态
  const [emailCodeSent, setEmailCodeSent] = useState('')
  const [emailInputCode, setEmailInputCode] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  // 通用状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // AOKSend 邮件接口配置
  const EMAIL_API_URL = 'https://www.aoksend.com/index/api/send_email'
  const EMAIL_API_KEY = import.meta.env.VITE_AOKSEND_API_KEY as string
  const EMAIL_TEMPLATE_ID = 'E_125139060306'

  const { signUpWithDetails } = useAuth()
  const navigate = useNavigate()

  // 发送邮箱验证码函数
  const sendEmailCode = async () => {
    if (!email) {
      setEmailError('请输入邮箱地址')
      return
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setEmailCodeSent(code)
    setSendingEmail(true)
    setEmailError('')
    setEmailSuccess('')

    try {
      const formData = new URLSearchParams()
      formData.append('app_key', EMAIL_API_KEY)
      formData.append('to', email)
      formData.append('template_id', EMAIL_TEMPLATE_ID)
      formData.append('data', JSON.stringify({ code }))

      const res = await fetch(EMAIL_API_URL, { method: 'POST', body: formData })
      const data = await res.json()
      
      console.log('邮件API响应:', data)
      
      const isSuccess = data.code === 0 || data.success === true || data.status === 'success' || 
                       (data.message && data.message.includes('成功'))
      
      if (isSuccess) {
        setEmailSuccess('验证码已发送，请检查邮箱')
        setEmailError('')
      } else {
        setEmailError(data.message || '发送失败')
        setEmailSuccess('')
      }
    } catch (e: any) {
      setEmailError('发送失败: ' + e.message)
      setEmailSuccess('')
    } finally {
      setSendingEmail(false)
    }
  }

  // 验证邮箱验证码
  const verifyEmailCode = (currentValue: string) => {
    const valueToVerify = currentValue || emailInputCode;
    console.log('验证值比对', {
      实际输入: valueToVerify,
      服务器验证码: emailCodeSent
    });

    if (valueToVerify.trim() === emailCodeSent?.trim()) {
      setEmailVerified(true);
      setEmailSuccess('验证成功！');
      setEmailError('');
    } else {
      setEmailError('验证码错误，请重试');
      setEmailSuccess('');
    }
  }

  const inputRef = useRef('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    inputRef.current = value;
    setEmailInputCode(value);

    if (value.length === 6 && !loading) {
      verifyEmailCode(value);
    }
  };

  // 修改 talentType 为数组
  const [selectedTalentTypes, setSelectedTalentTypes] = useState<TalentType[]>([])
  // 修改 talentData 为对象，key 为 talentType
  const [talentDataMap, setTalentDataMap] = useState<Record<TalentType, any>>({} as Record<TalentType, any>)

  // 处理达人类型选择
  const handleTalentTypeSelect = (type: TalentType) => {
    setSelectedTalentTypes(prev => {
      const isSelected = prev.includes(type)
      if (isSelected) {
        // 如果已选中，则移除
        const newTypes = prev.filter(t => t !== type)
        // 同时移除对应的表单数据
        const newTalentDataMap = { ...talentDataMap }
        delete newTalentDataMap[type]
        setTalentDataMap(newTalentDataMap)
        return newTypes
      } else {
        // 如果未选中，则添加
        return [...prev, type]
      }
    })
  }

  // 处理问题表单数据更新
  const handleTalentDataChange = (type: TalentType, data: any) => {
    setTalentDataMap(prev => ({
      ...prev,
      [type]: data
    }))
  }

  // 验证表单
  const validateForm = () => {
    if (!email) {
      setError('请输入邮箱地址')
      return false
    }
    if (!emailVerified) {
      setError('请先完成邮箱验证')
      return false
    }
    if (!password) {
      setError('请输入密码')
      return false
    }
    if (password.length < 6) {
      setError('密码至少需要6位字符')
      return false
    }
    if (password !== confirmPassword) {
      setError('密码不匹配')
      return false
    }
    if (userType === 'influencer') {
      if (selectedTalentTypes.length === 0) {
        setError('请至少选择一个达人类型')
        return false
      }
      // 验证每个选中类型的必填项
      for (const type of selectedTalentTypes) {
        const data = talentDataMap[type]
        if (!data?.experience) {
          setError(`请选择${talentTypeConfig[type].label}的经验`)
          return false
        }
        if (!data?.portfolioFiles?.length) {
          setError(`请上传${talentTypeConfig[type].label}的相关案例`)
          return false
        }
      }
    }
    return true
  }

  // 上传文件到 Supabase Storage
  const uploadFiles = async (files: File[], userId: string, talentType: TalentType) => {
    const uploadedUrls = []
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${talentType}/${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('talent_portfolios')
        .upload(fileName, file)

      if (error) {
        console.error('文件上传失败:', error)
        throw error
      }

      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('talent_portfolios')
          .getPublicUrl(data.path)
        uploadedUrls.push(publicUrl)
      }
    }

    return uploadedUrls
  }

  // 创建达人资料
  const createTalentProfile = async (userId: string) => {
    try {
      // 创建达人基本资料
      const { data: profileData, error: profileError } = await supabase
        .from('talent_profiles')
        .insert({
          user_id: userId,
          talent_types: selectedTalentTypes
        })
        .select()
        .single()

      if (profileError) throw profileError

      // 为每个达人类型创建详细资料
      for (const type of selectedTalentTypes) {
        const data = talentDataMap[type]
        const files = data.portfolioFiles
        let fileUrls: string[] = []

        // 上传文件
        if (files?.length) {
          try {
            fileUrls = await uploadFiles(files, userId, type)
          } catch (uploadError) {
            console.error(`${type}文件上传失败:`, uploadError)
            // 继续处理其他数据，即使文件上传失败
          }
        }

        // 准备要保存的数据
        const detailData: any = {
          profile_id: profileData.id,
          talent_type: type,
          experience: data.experience,
          portfolio_links: data.portfolio || '',
          portfolio_files: fileUrls,
          form_data: data // 保存完整的表单数据
        }

        // 根据达人类型添加特定字段
        switch (type) {
          case 'live-host':
            detailData.categories = data.categories || []
            detailData.host_styles = data.styles || []
            detailData.achievement = data.achievement || ''
            break
          case 'account-manager':
            detailData.operation_categories = data.categories || []
            detailData.operation_skills = data.skills || []
            detailData.success_cases = data.cases || ''
            break
          case 'video-editor':
            detailData.editing_software = data.software || []
            detailData.editing_styles = data.styles || []
            break
        }

        // 保存详细资料
        const { error: detailError } = await supabase
          .from('talent_type_details')
          .insert(detailData)

        if (detailError) {
          console.error(`保存${type}详细资料失败:`, detailError)
          // 继续处理其他类型
        }
      }

      return true
    } catch (error) {
      console.error('创建达人资料失败:', error)
      throw error
    }
  }

  // 提交注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      console.log('开始注册:', email, userType, selectedTalentTypes, talentDataMap)
      
      try {
        const { error, data } = await signUpWithDetails(email, password, userType, {
          firstName: '待完善',
          lastName: '待完善',
          phoneNumber: '待完善',
          // 达人特有信息
          ...(userType === 'influencer' ? {
            nickname: '待完善',
            tiktokAccount: '',
            location: '',
            categories: [],
            tags: [],
            bio: '',
            experienceYears: Math.max(...selectedTalentTypes.map(type => 
              parseInt(talentDataMap[type]?.experience || '0')
            )).toString(),
          } : {}),
          // 企业特有信息
          ...(userType === 'company' ? {
            companyName: '待完善',
            contactPerson: '待完善',
            industry: '',
            companySize: '',
            description: ''
          } : {})
        })

        if (error) {
          console.error('注册失败:', error)
          setError(typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '注册失败，请重试')
        } else if (data?.user) {
          console.log('注册成功')

          // 如果是达人用户，创建达人资料
          if (userType === 'influencer') {
            try {
              await createTalentProfile(data.user.id)
            } catch (profileError) {
              console.error('创建达人资料失败:', profileError)
              // 继续注册流程，即使资料创建失败
            }
          }

          // 注册成功后清空缓存并显示提示
          localStorage.clear()
          sessionStorage.clear()
          
          // 退出登录
          try {
            await supabase.auth.signOut()
            console.log('已退出登录')
          } catch (signOutError) {
            console.error('退出登录失败:', signOutError)
          }
          
          // 显示成功提示
          if (userType === 'company') {
            alert('Registration successful! The influencer selection module is being updated, stay tuned!')
          } else {
            alert('注册成功！请登录后完善资料。')
          }
          
          // 跳转到登录页面
          navigate('/login-test')
        }
      } catch (signUpError) {
        console.error('注册API调用失败:', signUpError)
        setError('注册服务暂时不可用，请稍后重试')
      }
    } catch (err) {
      console.error('操作失败:', err)
      setError('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">用户注册</h1>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">填写基本信息</h2>
            
            {/* 用户类型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                用户类型
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUserType('influencer')
                    setTalentType(null)
                    setTalentData({})
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    userType === 'influencer'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">达人主播</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserType('company')
                    setTalentType(null)
                    setTalentData({})
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    userType === 'company'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">企业用户</div>
                </button>
              </div>
            </div>

            {/* 达人类型选择和问题 */}
            {userType === 'influencer' && (
              <>
                <TalentTypeForm
                  selectedTypes={selectedTalentTypes}
                  onSelect={handleTalentTypeSelect}
                />
                {selectedTalentTypes.map(type => (
                  <div key={type} className="mt-8">
                    <TalentQuestionForm
                      talentType={type}
                      formData={talentDataMap[type] || {}}
                      onChange={(data) => handleTalentDataChange(type, data)}
                    />
                  </div>
                ))}
              </>
            )}

            {/* 邮箱地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="请输入邮箱地址"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 邮箱验证码 */}
            <div>
              <button
                type="button"
                onClick={sendEmailCode}
                disabled={sendingEmail || !email || loading}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>发送中...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>发送验证码</span>
                  </>
                )}
              </button>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱验证码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={emailInputCode}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 邮箱验证状态 */}
              {emailError && (
                <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}
              {emailSuccess && (
                <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{emailSuccess}</span>
                </div>
              )}
              {emailVerified && (
                <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>邮箱验证成功</span>
                </div>
              )}
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="请输入密码"
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

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="请再次输入密码"
                  required
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !emailVerified}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>注册中...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>完成注册</span>
                </>
              )}
            </button>

            {/* 底部链接 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                已有账号？
                <Link
                  to="/login-test"
                  className="ml-1 text-pink-600 hover:text-pink-700 font-medium"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

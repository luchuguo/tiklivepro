import React, { useState, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Mail, Lock, User, Building2, Eye, EyeOff, Loader, Send, MessageSquare, XCircle, CheckCircle, ArrowLeft, Phone, ArrowRight, CheckCircle2, X, Video, Star, Shield, FileText, MapPin } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [userType, setUserType] = useState<'influencer' | 'company'>('influencer')
  
  // 第一步：基本信息
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // 第二步：个人信息
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  
  // 达人主播特有字段
  const [nickname, setNickname] = useState('')
  const [tiktokAccount, setTiktokAccount] = useState('')
  const [location, setLocation] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [newTag, setNewTag] = useState('')
  
  // 新增达人主播字段
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idImageUrl, setIdImageUrl] = useState('')
  const [tiktokProfileUrl, setTiktokProfileUrl] = useState('')
  const [tiktokFollowersCount, setTiktokFollowersCount] = useState('')
  const [avgPlayCount, setAvgPlayCount] = useState('')
  const [avgEngagementRate, setAvgEngagementRate] = useState('')
  const [hasTiktokShop, setHasTiktokShop] = useState(false)
  const [liveVenue, setLiveVenue] = useState('')
  const [weeklySchedule, setWeeklySchedule] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
const [timeSlot, setTimeSlot] = useState('')
const [scheduleItems, setScheduleItems] = useState<string[]>([])
const addScheduleItem = () => {
  if (selectedDay && timeSlot) {
    const newItem = `${selectedDay}，${timeSlot}`
    setScheduleItems(prev => [...prev, newItem])
    setWeeklySchedule(prev => prev ? `${prev}；${newItem}` : newItem)
    setSelectedDay('')
    setTimeSlot('')
  }
}

const removeScheduleItem = (index: number) => {
  setScheduleItems(prev => {
    const newItems = prev.filter((_, i) => i !== index)
    setWeeklySchedule(newItems.join('；'))
    return newItems
  })
}
  const [bilingualLive, setBilingualLive] = useState(false)
  const [languages, setLanguages] = useState<string[]>([])
  
  // 新增字段
  const [idImageFile, setIdImageFile] = useState<File | null>(null)
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null)
  const [uploadingIdImage, setUploadingIdImage] = useState(false)
  
  // 企业用户特有字段
  const [contactPerson, setContactPerson] = useState('')
  const [businessLicense, setBusinessLicense] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [website, setWebsite] = useState('')
  
  // 可选择的选项
  const availableCategories = [
    '美妆护肤', '家居厨房用品', '清洁类工具', '宠物用品', '时尚服饰配件',
    '数码配件', '身体护理', '珠宝首饰', '美食饮品', '其他'
  ]
  
  const companySizes = [
    '1-10人', '11-50人', '51-100人', '101-500人', '501-1000人', '1000人以上'
  ]
  
  const industries = [
    '美妆护肤', '服装时尚', '数码科技', '美食生活', 
    '母婴用品', '家居家装', '健康保健', '教育培训', '其他'
  ]
  
  // 新增选项
  const idTypes = [
    '身份证', '护照', '港澳通行证', '台湾通行证', '驾照', '其他'
  ]
  
  const liveVenues = [
    '专业直播间', '家庭环境', '户外', '办公室', '其他'
  ]
  
  const languageOptions = [
    '中文', '英语', '日语', '韩语', '法语', '德语', '西班牙语', '其他'
  ]
  
  const weekDays = [
    { key: 'monday', label: '周一' },
    { key: 'tuesday', label: '周二' },
    { key: 'wednesday', label: '周三' },
    { key: 'thursday', label: '周四' },
    { key: 'friday', label: '周五' },
    { key: 'saturday', label: '周六' },
    { key: 'sunday', label: '周日' }
  ]
  
  // 邮箱验证相关状态
  const [emailCodeSent, setEmailCodeSent] = useState('')
  const [emailInputCode, setEmailInputCode] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  
  // 手机验证相关状态
  const [smsCodeSent, setSmsCodeSent] = useState('')
  const [smsInputCode, setSmsInputCode] = useState('')
  const [sendingSms, setSendingSms] = useState(false)
  const [smsVerified, setSmsVerified] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [smsSuccess, setSmsSuccess] = useState('')
  
  // 通用状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // AOKSend 邮件接口配置
  const EMAIL_API_URL = 'https://www.aoksend.com/index/api/send_email'
  const EMAIL_API_KEY = import.meta.env.VITE_AOKSEND_API_KEY as string
  const EMAIL_TEMPLATE_ID = 'E_125139060306'

  // 短信宝API配置
  const SMS_USERNAME = 'luchuguo'
  const SMS_PASSWORD_MD5 = '95895002b700461898a9821c0704e929'
  const SMS_API_URL = 'https://api.smsbao.com/sms'

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

  // 发送短信验证码
  const sendSmsCode = async () => {
    if (!phoneNumber) {
      setSmsError('请输入手机号码')
      return
    }

    // 验证手机号码格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phoneNumber)) {
      setSmsError('请输入正确的手机号码格式')
      return
    }

    try {
      setSendingSms(true)
      setSmsError('')
      setSmsSuccess('')

      const code = Math.floor(1000 + Math.random() * 9000).toString()
      setSmsCodeSent(code)

      const content = `您的验证码是${code}，请在5分钟内完成验证。如非本人操作，请忽略此短信。`
      
      const params = new URLSearchParams({
        u: SMS_USERNAME,
        p: SMS_PASSWORD_MD5,
        m: phoneNumber,
        c: content
      })

      const response = await fetch(`${SMS_API_URL}?${params}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain'
        }
      })

      const result = await response.text()
      const cleanResult = result.trim()

      console.log('短信API响应:', { raw: result, length: result.length, clean: cleanResult })

      if (cleanResult === '0') {
        setSmsSuccess(`验证码已发送到 ${phoneNumber}，请查收！`)
        setSmsVerified(false)
      } else {
        const errorMessages: { [key: string]: string } = {
          '30': '错误密码',
          '40': '账号不存在',
          '41': '余额不足',
          '43': 'IP地址限制',
          '50': '内容含有敏感词',
          '51': '手机号码不正确'
        }
        const errorMessage = errorMessages[cleanResult] || `发送失败，错误代码：${cleanResult}`
        setSmsError(errorMessage)
      }
    } catch (error) {
      console.error('发送短信失败:', error)
      setSmsSuccess(`验证码已发送到 ${phoneNumber}，请查收！`)
    } finally {
      setSendingSms(false)
    }
  }

  // 验证短信验证码
  const verifySmsCode = (inputCode?: string) => {
    const codeToVerify = inputCode || smsInputCode;
    
    if (!codeToVerify) {
      setSmsError('请输入验证码')
      return
    }

    if (codeToVerify === smsCodeSent) {
      setSmsVerified(true)
      setSmsError('')
      setSmsSuccess('验证码验证成功！')
    } else {
      setSmsVerified(false)
      setSmsError('验证码错误，请重新输入')
      setSmsSuccess('')
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setEmailCodeSent('')
    setEmailInputCode('')
    setEmailVerified(false)
    setEmailError('')
    setEmailSuccess('')
    setFirstName('')
    setLastName('')
    setPhoneNumber('')
    setCompanyName('')
    setIndustry('')
    setDescription('')
    setSmsCodeSent('')
    setSmsInputCode('')
    setSmsVerified(false)
    setSmsError('')
    setSmsSuccess('')
    setError('')
    
    // 达人主播特有字段
    setNickname('')
    setTiktokAccount('')
    setLocation('')
    setCategories([])
    setTags([])
    setHourlyRate('')
    setExperienceYears('')
    setNewTag('')
    
    // 新增达人主播字段
    setIdType('')
    setIdNumber('')
    setIdImageUrl('')
    setTiktokProfileUrl('')
    setTiktokFollowersCount('')
    setAvgPlayCount('')
    setAvgEngagementRate('')
    setHasTiktokShop(false)
    setLiveVenue('')
    setWeeklySchedule({
      monday: { time: '', duration: '' },
      tuesday: { time: '', duration: '' },
      wednesday: { time: '', duration: '' },
      thursday: { time: '', duration: '' },
      friday: { time: '', duration: '' },
      saturday: { time: '', duration: '' },
      sunday: { time: '', duration: '' }
    })
    setBilingualLive(false)
    setLanguages([])
    
    // 新增字段
    setIdImageFile(null)
    setIdImagePreview(null)
    setUploadingIdImage(false)
    
    // 企业用户特有字段
    setContactPerson('')
    setBusinessLicense('')
    setCompanySize('')
    setWebsite('')
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

  // 第一步验证
  const validateStep1 = () => {
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
    return true
  }

  // 第二步验证
  const validateStep2 = () => {
    if (!firstName) {
      setError('请输入姓名')
      return false
    }
    if (!phoneNumber) {
      setError('请输入手机号码')
      return false
    }
    if (!smsVerified) {
      setError('请先完成手机验证')
      return false
    }
    if (userType === 'company' && !companyName) {
      setError('请输入公司名称')
      return false
    }
    if (userType === 'influencer') {
      if (!nickname) {
        setError('请输入昵称')
        return false
      }
      if (!tiktokAccount) {
        setError('请输入TikTok账号')
        return false
      }
      if (!tiktokProfileUrl) {
        setError('请输入TikTok账号链接')
        return false
      }
      if (!tiktokFollowersCount) {
        setError('请输入TikTok粉丝数量')
        return false
      }
    }
    return true
  }

  // 处理标签添加
  const handleAddTag = () => {
    if (!newTag.trim()) return
    if (tags.includes(newTag.trim())) {
      setError('该标签已存在')
      return
    }
    setTags([...tags, newTag.trim()])
    setNewTag('')
    setError('')
  }

  // 处理标签删除
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  // 下一步
  const handleNextStep = () => {
    setError('')
    if (validateStep1()) {
      setCurrentStep(2)
    }
  }

  // 上一步
  const handlePrevStep = () => {
    setCurrentStep(1)
    setError('')
  }

  // 最终提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateStep2()) {
      return
    }

    setLoading(true)

    try {
      console.log('开始注册:', email, userType)
      
      try {
        const { error } = await signUpWithDetails(email, password, userType, {
          firstName,
          lastName,
          phoneNumber,
          nickname,
          tiktokAccount,
          location,
          categories,
          tags,
          hourlyRate,
          experienceYears,
          bio: description,
          companyName,
          contactPerson,
          businessLicense,
          industry,
          companySize,
          website,
          description,
          // 新增字段
          idType,
          idNumber,
          idImageUrl,
          tiktokProfileUrl,
          tiktokFollowersCount,
          avgPlayCount,
          avgEngagementRate,
          hasTiktokShop,
          liveVenue,
          weeklySchedule,
          bilingualLive,
          languages
        })
        if (error) {
          console.error('注册失败:', error)
          setError(typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '注册失败，请重试')
        } else {
          console.log('注册成功')
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
          alert('注册成功！请重新登录。')
          
          // 跳转到首页
          navigate('/')
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

  // 处理身份证明图片上传
  const handleIdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIdImageFile(file)
      setError('')
      setUploadingIdImage(true)
      
      console.log('开始上传身份证明图片:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      
      try {
        // 使用PICUI图床API
        const formData = new FormData()
        formData.append('file', file)
        formData.append('permission', '1') // 公开权限

        console.log('发送PICUI API请求...')
        const response = await fetch('https://picui.cn/api/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_PICUI_API_KEY}`,
            'Accept': 'application/json'
          },
          body: formData
        })

        const result = await response.json()
        console.log('PICUI API响应:', result)

        if (result.status && result.data?.links?.url) {
          setIdImageUrl(result.data.links.url)
          // 创建预览
          const reader = new FileReader()
          reader.onload = (e) => {
            setIdImagePreview(e.target?.result as string)
          }
          reader.readAsDataURL(file)
          console.log('身份证明图片上传成功:', result.data.links.url)
        } else {
          setError(result.message || '图片上传失败，请重试')
          console.error('身份证明图片上传失败:', result)
        }
      } catch (error: any) {
        console.error('身份证明图片上传异常:', error)
        setError(error.message || '图片上传失败，请重试')
      } finally {
        setUploadingIdImage(false)
      }
    }
  }

  // 处理直播时间表更新
  const handleScheduleChange = (day: string, field: 'time' | 'duration', value: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* 上传加载遮罩 */}
      {uploadingIdImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <div>
              <p className="text-lg font-semibold text-gray-900">图片上传中...</p>
              <p className="text-sm text-gray-600">请稍候，不要关闭页面</p>
            </div>
          </div>
        </div>
      )}
      
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

        {/* 步骤指示器 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-pink-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">第一步：基本信息</span>
            </div>
            <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-pink-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-pink-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">第二步：信息完善</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {currentStep === 1 ? (
            // 第一步：基本信息
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
                    onClick={() => setUserType('influencer')}
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
                    onClick={() => setUserType('company')}
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

              {/* 下一步按钮 */}
              <button
                type="button"
                onClick={handleNextStep}
                disabled={loading || !emailVerified}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>下一步</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // 第二步：个人信息
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">填写个人信息</h2>
              
              {/* 姓名 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="请输入姓"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="请输入名"
                    required
                  />
                </div>
              </div>

              {/* 手机号码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="请输入手机号码"
                    required
                  />
                </div>
              </div>

              {/* 短信验证码 */}
              <div>
                <button
                  type="button"
                  onClick={sendSmsCode}
                  disabled={sendingSms || !phoneNumber || loading}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {sendingSms ? (
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
                    短信验证码 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={smsInputCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setSmsInputCode(value);
                          // 当输入4位验证码时自动验证
                          if (value.length === 4 && !loading) {
                            setTimeout(() => verifySmsCode(value), 100);
                          }
                        }}
                        className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="请输入4位验证码"
                        maxLength={4}
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => verifySmsCode()}
                      disabled={!smsInputCode || loading}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      验证
                    </button>
                  </div>
                </div>

                {/* 短信验证状态 */}
                {smsError && (
                  <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{smsError}</span>
                  </div>
                )}
                {smsSuccess && !smsVerified && (
                  <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>{smsSuccess}</span>
                  </div>
                )}
                {smsVerified && (
                  <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>手机验证成功</span>
                  </div>
                )}
              </div>

                            {/* 达人主播特有字段 */}
              {userType === 'influencer' && (
                <>
                  {/* 基础信息区域 */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      基础信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          昵称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入昵称"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          所在地
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入所在城市"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TikTok账号信息区域 */}
                  <div className="bg-blue-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Video className="w-5 h-5 mr-2" />
                      TikTok账号信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TikTok账号 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={tiktokAccount}
                          onChange={(e) => setTiktokAccount(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入TikTok账号"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TikTok账号链接 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={tiktokProfileUrl}
                          onChange={(e) => setTiktokProfileUrl(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="https://www.tiktok.com/@username"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TikTok粉丝数量 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={tiktokFollowersCount}
                          onChange={(e) => setTiktokFollowersCount(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入粉丝数量"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          平均播放量
                        </label>
                        <input
                          type="number"
                          value={avgPlayCount}
                          onChange={(e) => setAvgPlayCount(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入平均播放量"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          平均互动率 (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={avgEngagementRate}
                          onChange={(e) => setAvgEngagementRate(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入互动率"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hasTiktokShop}
                            onChange={(e) => setHasTiktokShop(e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            已开通TikTok Shop（小黄车）
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 专业信息区域 */}
                  <div className="bg-green-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      专业信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          时薪 (美元/小时)
                        </label>
                        <input
                          type="number"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入时薪"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          经验年限（年）
                        </label>
                        <input
                          type="number"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入经验年限"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        擅长领域
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableCategories.map((category) => (
                          <label key={category} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={categories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCategories([...categories, category])
                                } else {
                                  setCategories(categories.filter(c => c !== category))
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        技能标签
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full flex items-center">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 text-purple-600 hover:text-purple-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="添加新标签 (如：美妆博主)"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 直播信息区域 */}
                  <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Video className="w-5 h-5 mr-2" />
                      直播信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          直播场地
                        </label>
                        <select
                          value={liveVenue}
                          onChange={(e) => setLiveVenue(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value="">请选择直播场地</option>
                          {liveVenues.map((venue) => (
                            <option key={venue} value={venue}>
                              {venue}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={bilingualLive}
                            onChange={(e) => setBilingualLive(e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            可以双语直播（英语/中文）
                          </span>
                        </label>
                      </div>
                    </div>
                    
               
                      
                      <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        每周直播档期和时长
                      </label>
                      <div className="space-y-3">
  <div className="flex items-center gap-3">
    <select
      value={selectedDay}
      onChange={(e) => setSelectedDay(e.target.value)}
      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
    >
      <option value="">选择星期</option>
      <option value="星期一">星期一</option>
      <option value="星期二">星期二</option>
      <option value="星期三">星期三</option>
      <option value="星期四">星期四</option>
      <option value="星期五">星期五</option>
      <option value="星期六">星期六</option>
      <option value="星期日">星期日</option>
    </select>
    
    <input
      type="text"
      value={timeSlot}
      onChange={(e) => setTimeSlot(e.target.value)}
      placeholder="如：20:00-24:00"
      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
    />
    
    <button
      type="button"
      onClick={addScheduleItem}
      className="px-4 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-1"
    >
      <Plus className="w-4 h-4" />
      添加
    </button>
  </div>
  
  {/* 已添加的档期列表 */}
  {scheduleItems.length > 0 && (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">已添加的直播档期：</p>
      {scheduleItems.map((item, index) => (
        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
          <span className="text-sm text-gray-700">{item}</span>
          <button
            type="button"
            onClick={() => removeScheduleItem(index)}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )}
  
  {/* 隐藏的输入框，用于存储最终数据 */}
  <input
    type="hidden"
    value={weeklySchedule}
    onChange={() => {}} // 只读
  />
</div>
                    </div>



                 
                    
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        支持的语言
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {languageOptions.map((lang) => (
                          <label key={lang} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={languages.includes(lang)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setLanguages([...languages, lang])
                                } else {
                                  setLanguages(languages.filter(l => l !== lang))
                                }
                              }}
                              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{lang}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 身份认证区域 */}
                  <div className="bg-red-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      身份认证（填写可获得认证达人标识）
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          证件类型
                        </label>
                        <select
                          value={idType}
                          onChange={(e) => setIdType(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value="">请选择证件类型</option>
                          {idTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          证件号码
                        </label>
                        <input
                          type="text"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="请输入证件号码"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        身份证明图片
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleIdImageUpload}
                            disabled={uploadingIdImage}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                              uploadingIdImage ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                        {uploadingIdImage && (
                          <div className="flex items-center space-x-2 text-blue-600">
                            <Loader className="w-5 h-5 animate-spin" />
                            <span className="text-sm">上传中...</span>
                          </div>
                        )}
                        {idImagePreview && !uploadingIdImage && (
                          <div className="w-20 h-20 border-2 border-gray-300 rounded-lg overflow-hidden">
                            <img
                              src={idImagePreview}
                              alt="身份证明预览"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        支持 JPG、PNG 格式，文件大小不超过 5MB
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* 企业用户特有字段 */}
              {userType === 'company' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入公司名称"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      所属行业
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入所属行业"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      联系人
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入联系人"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      营业执照
                    </label>
                    <input
                      type="text"
                      value={businessLicense}
                      onChange={(e) => setBusinessLicense(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请上传营业执照"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司规模
                    </label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">请选择公司规模</option>
                      {companySizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      官网
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入官网"
                    />
                  </div>
                </>
              )}

              {/* 个人/企业描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {userType === 'influencer' ? '个人简介' : '公司简介'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder={userType === 'influencer' ? '请简单介绍一下自己...' : '请简单介绍一下公司...'}
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 提示信息 */}
              {!smsVerified && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-600">
                    💡 请先完成手机验证，输入验证码后会自动验证
                  </p>
                </div>
              )}

              {/* 按钮组 */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>上一步</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || !smsVerified}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>注册中...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>递交注册</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

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
  )
} 

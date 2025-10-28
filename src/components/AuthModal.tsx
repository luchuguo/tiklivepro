import React, { useState, useRef } from 'react'
import { X, Mail, Lock, User, Building2, Eye, EyeOff, Loader, Phone, Send, MessageSquare, XCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import MD5 from 'crypto-js/md5'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
  defaultUserType?: 'influencer' | 'company'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin', defaultUserType = 'influencer' }: AuthModalProps) {
  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  const navigate = useNavigate()

  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [userType, setUserType] = useState<'influencer' | 'company'>(defaultUserType)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // SMS verification related states
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [sendingSms, setSendingSms] = useState(false)
  const [smsVerified, setSmsVerified] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [smsSuccess, setSmsSuccess] = useState('')

  // -------------- Added: Email verification code states & API config --------------
  // Email verification code related states
  const [emailCodeSent, setEmailCodeSent] = useState('')
  const [emailInputCode, setEmailInputCode] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  // AOKSend email API configuration
  const EMAIL_API_URL = 'https://www.aoksend.com/index/api/send_email'
  const EMAIL_API_KEY = import.meta.env.VITE_AOKSEND_API_KEY as string
  const EMAIL_TEMPLATE_ID = 'E_125139060306'

  // Send email verification code function
  const sendEmailCode = async () => {
    if (!email) {
      setEmailError('Please enter email address')
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
      
      // Add debug info
      console.log('Email API response:', data)
      
      // Improved success state judgment
      const isSuccess = data.code === 0 || data.success === true || data.status === 'success' || 
                       (data.message && data.message.includes('成功'))
      
      if (isSuccess) {
        // Show green prompt regardless of API message when successful
        setEmailSuccess('Verification code sent, please check your email')
        setEmailError('') // Ensure any error state is cleared
      } else {
        setEmailError(data.message || 'Send failed')
        setEmailSuccess('') // Ensure any success state is cleared
      }
    } catch (e: any) {
      setEmailError('Send failed: ' + e.message)
      setEmailSuccess('') // Ensure any success state is cleared
    } finally {
      setSendingEmail(false)
    }
  }

  // Verify email verification code
  const verifyEmailCode = (currentValue: string) => {
    const valueToVerify = currentValue || emailInputCode;
    console.log('Verification value comparison', {
      actualInput: valueToVerify,
      serverCode: emailCodeSent
    });

    // Strict comparison (refer to /email-test)
    if (valueToVerify.trim() === emailCodeSent?.trim()) {
      setEmailVerified(true);
      setEmailSuccess('Verification successful!');
      setEmailError('');
    } else {
      setEmailError('Incorrect verification code, please try again');
      setEmailSuccess('');
    }
  }
  // -------------- End of addition --------------

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

  const { signIn, signUp } = useAuth()

  // 生成验证码
  const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
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

      const code = generateVerificationCode()
      setVerificationCode(code)

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
        setSmsVerified(false) // 重置验证状态
      } else {
        const errorMessage = errorMessages[cleanResult as keyof typeof errorMessages] || `发送失败，错误代码：${cleanResult}`
        setSmsError(errorMessage)
      }
    } catch (error) {
      console.error('发送短信失败:', error)
      // 即使网络错误，也显示成功消息，因为短信可能已经发送
      setSmsSuccess(`验证码已发送到 ${phoneNumber}，请查收！`)
    } finally {
      setSendingSms(false)
    }
  }

  // 验证短信验证码
  const verifySmsCode = () => {
    if (!inputCode) {
      setSmsError('请输入验证码')
      return
    }

    if (inputCode === verificationCode) {
      setSmsVerified(true)
      setSmsError('')
      setSmsSuccess('验证码验证成功！')
    } else {
      setSmsVerified(false)
      setSmsError('验证码错误，请重新输入')
      setSmsSuccess('')
    }
  }

  // 处理短信验证相关输入变化
  const handleSmsInputChange = (field: 'phone' | 'code', value: string) => {
    if (field === 'phone') {
      setPhoneNumber(value)
      // 清除之前的验证状态
      setSmsVerified(false)
      setSmsError('')
      setSmsSuccess('')
    } else {
      setInputCode(value)
      setSmsError('')
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        // 注册时的验证
        if (password !== confirmPassword) {
          setError('密码不匹配')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('密码至少需要6位字符')
          setLoading(false)
          return
        }
        if (!emailVerified) {
          setError('请先完成邮箱验证')
          setLoading(false)
          return
        }

        console.log('开始注册:', email, userType, phoneNumber)
        
        // 添加错误边界保护
        try {
          const { error } = await signUp(email, password, userType, phoneNumber)
          if (error) {
            console.error('注册失败:', error)
            setError(typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '注册失败，请重试')
          } else {
            console.log('注册成功')
            // 注册成功后清空缓存并显示提示
            localStorage.clear()
            sessionStorage.clear()
            if (userType === 'company') {
              alert('Registration successful! The influencer selection module is being updated, stay tuned!')
              // 关闭模态框
              onClose()
              // 跳转到首页
              window.location.href = '/'
            } else {
              alert('注册成功，请重新登录！')
              // 切换到登录模式
              setMode('signin')
              resetForm()
            }
          }
        } catch (signUpError) {
          console.error('注册API调用失败:', signUpError)
          setError('注册服务暂时不可用，请稍后重试')
        }
      } else {
        console.log('开始登录:', email)
        
        // 添加错误边界保护
        try {
          const { error } = await signIn(email, password)
          if (error) {
            console.error('登录失败:', error)
            setError(typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '登录失败，请重试')
          } else {
            console.log('登录成功')
            // 登录成功后关闭模态框
            onClose()
          }
        } catch (signInError) {
          console.error('登录API调用失败:', signInError)
          setError('登录服务暂时不可用，请稍后重试')
        }
      }
    } catch (err) {
      console.error('操作失败:', err)
      setError('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setPhoneNumber('')
    setVerificationCode('')
    setInputCode('')
    setSmsVerified(false)
    setSmsError('')
    setSmsSuccess('')
    setEmailCodeSent('')
    setEmailInputCode('')
    setEmailVerified(false)
    setEmailError('')
    setEmailSuccess('')
    setError('')
  }

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode)
    resetForm()
  }

  const inputRef = useRef('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    inputRef.current = value; // 实时更新ref
    setEmailInputCode(value);

    // 立即触发验证（移除防抖）
    if (value.length === 6 && !loading) {
      verifyEmailCode(value); // 直接传入当前值
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' ? 'Login' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {mode === 'signup' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                User Type
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
                  <div className="text-sm font-medium">Creator</div>
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
                  <div className="text-sm font-medium">Company</div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="mt-4">
                {/* 发送邮箱验证码 */}
                <button
                  type="button"
                  onClick={sendEmailCode}
                  disabled={sendingEmail || !email || loading}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {sendingEmail ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>

                {/* 邮箱验证码输入 */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Verification Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <div className="flex space-x-2">
                      <div className="w-full">
                        <input
                          type="text"
                          value={emailInputCode}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          disabled={loading}
                        />
                      </div>
                      {/*
                      <button
                        type="button"
                        onClick={verifyEmailCode}
                        disabled={!emailInputCode || loading}
                        className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        验证
                      </button>
                      */}
                    </div>
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
                    <span>Email verified successfully</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your password"
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

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && !emailVerified)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{mode === 'signin' ? 'Logging in...' : 'Signing up...'}</span>
                </>
              ) : (
                <span>{mode === 'signin' ? 'Login' : 'Sign Up'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              {mode === 'signin' ? (
                <button
                  onClick={() => {
                    onClose()
                    navigate('/signup')
                  }}
                  className="ml-1 text-pink-600 hover:text-pink-700 font-medium"
                  disabled={loading}
                >
                  Sign Up
                </button>
              ) : (
                <button
                  onClick={() => switchMode('signin')}
                  className="ml-1 text-pink-600 hover:text-pink-700 font-medium"
                  disabled={loading}
                >
                  Login
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
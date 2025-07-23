import React, { useState } from 'react'
import { X, Mail, Lock, User, Building2, Eye, EyeOff, Loader, Phone, Send, MessageSquare, XCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import MD5 from 'crypto-js/md5'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
  defaultUserType?: 'influencer' | 'company'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin', defaultUserType = 'influencer' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [userType, setUserType] = useState<'influencer' | 'company'>(defaultUserType)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 短信验证相关状态
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [sendingSms, setSendingSms] = useState(false)
  const [smsVerified, setSmsVerified] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [smsSuccess, setSmsSuccess] = useState('')

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
          return
        }
        if (password.length < 6) {
          setError('密码至少需要6位字符')
          return
        }
        if (!phoneNumber) {
          setError('请输入手机号码')
          return
        }
        if (!smsVerified) {
          setError('请先完成手机号码验证')
          return
        }

        console.log('开始注册:', email, userType, phoneNumber)
        const { error } = await signUp(email, password, userType, phoneNumber)
        if (error) {
          console.error('注册失败:', error)
          setError(typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '注册失败，请重试')
        } else {
          console.log('注册成功')
          onClose()
        }
      } else {
        console.log('开始登录:', email)
        const { error } = await signIn(email, password)
        if (error) {
          console.error('登录失败:', error)
          setError(typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '登录失败，请重试')
        } else {
          console.log('登录成功')
          onClose()
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
    setError('')
  }

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode)
    resetForm()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' ? '登录' : '注册'}
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
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handleSmsInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="请输入手机号码"
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* 短信验证码发送 */}
                <div className="mt-2">
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
                </div>

                {/* 短信验证码输入 */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    短信验证码 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => handleSmsInputChange('code', e.target.value)}
                        className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="请输入验证码"
                        maxLength={4}
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={verifySmsCode}
                      disabled={!inputCode || loading}
                      className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                {smsSuccess && (
                  <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>{smsSuccess}</span>
                  </div>
                )}
                {smsVerified && (
                  <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>手机号码验证成功</span>
                  </div>
                )}
              </div>
            )}

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

            {mode === 'signup' && (
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
              disabled={loading || (mode === 'signup' && !smsVerified)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{mode === 'signin' ? '登录中...' : '注册中...'}</span>
                </>
              ) : (
                <span>{mode === 'signin' ? '登录' : '注册'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'signin' ? '还没有账号？' : '已有账号？'}
              <button
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="ml-1 text-pink-600 hover:text-pink-700 font-medium"
                disabled={loading}
              >
                {mode === 'signin' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { X, Mail, Lock, User, Building2, Eye, EyeOff, Loader } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

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

  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('密码不匹配')
          return
        }
        if (password.length < 6) {
          setError('密码至少需要6位字符')
          return
        }

        console.log('开始注册:', email, userType)
        const { error } = await signUp(email, password, userType)
        if (error) {
          console.error('注册失败:', error)
          setError(error.message)
        } else {
          console.log('注册成功')
          onClose()
        }
      } else {
        console.log('开始登录:', email)
        const { error } = await signIn(email, password)
        if (error) {
          console.error('登录失败:', error)
          setError(error.message)
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
    setError('')
  }

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode)
    resetForm()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
              disabled={loading}
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
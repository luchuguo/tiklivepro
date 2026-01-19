import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../lib/adminAuthProvider'
import { Shield, Mail, Lock, Eye, EyeOff, Loader, AlertCircle, ArrowLeft } from 'lucide-react'

export function AdminLoginPageNew() {
  const navigate = useNavigate()
  const { signIn, loading, error } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (!email || !password) {
      setLoginError('请输入邮箱和密码')
      return
    }

    const result = await signIn(email, password)
    if (result.success) {
      navigate('/admin')
    } else {
      setLoginError(result.error || '登录失败')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员登录</h1>
            <p className="text-gray-600">请输入您的管理员凭据</p>
          </div>

          {/* Error Message */}
          {(error || loginError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error || loginError}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                管理员邮箱
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@tiklive.pro"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入密码"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回首页
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>仅限超级管理员访问</p>
        </div>
      </div>
    </div>
  )
}

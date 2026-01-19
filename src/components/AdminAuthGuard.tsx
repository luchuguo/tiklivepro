import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../lib/adminAuthProvider'
import { Loader, Shield, AlertCircle } from 'lucide-react'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, profile, isAdmin, loading, error } = useAdminAuth()

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">验证管理员权限中...</p>
          <p className="text-gray-400 text-sm mt-2">请稍候</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">验证失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/admin-login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回登录
          </a>
        </div>
      </div>
    )
  }

  // 未登录或不是管理员
  if (!user || !profile || !isAdmin) {
    console.log('🔒 [AdminAuthGuard] 权限验证失败:', {
      hasUser: !!user,
      hasProfile: !!profile,
      isAdmin,
      profileUserType: profile?.user_type
    })
    return <Navigate to="/admin-login" replace />
  }

  // 验证通过，渲染子组件
  return <>{children}</>
}

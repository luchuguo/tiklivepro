import React from 'react'
import { Shield, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface PermissionDebugPanelProps {
  user: any
  profile: any
  loading: boolean
  isAdmin: boolean
  permissionError: string | null
  connectionError: string | null
  isConnecting: boolean
  onRefreshPermissions: () => void
  onForceReload: () => void
  onSignOut: () => void
  onCheckConnection: () => void
}

export function PermissionDebugPanel({
  user,
  profile,
  loading,
  isAdmin,
  permissionError,
  connectionError,
  isConnecting,
  onRefreshPermissions,
  onForceReload,
  onSignOut,
  onCheckConnection
}: PermissionDebugPanelProps) {
  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
    if (permissionError) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (isAdmin) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <XCircle className="w-4 h-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (loading) return '权限验证中...'
    if (permissionError) return '权限验证失败'
    if (isAdmin) return '权限验证通过'
    return '权限验证未通过'
  }

  const getStatusColor = () => {
    if (loading) return 'text-blue-600'
    if (permissionError) return 'text-red-600'
    if (isAdmin) return 'text-green-600'
    return 'text-gray-600'
  }

  return (
    <div className="fixed top-20 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">权限调试面板</h3>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* 状态概览 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">当前状态:</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">用户信息</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">用户ID:</span>
              <span className="font-mono text-xs text-gray-800">
                {user?.id ? `${user.id.substring(0, 8)}...` : '未获取'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">邮箱:</span>
              <span className="font-mono text-xs text-gray-800">
                {user?.email || '未获取'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">登录状态:</span>
              <span className={`text-xs ${user ? 'text-green-600' : 'text-red-600'}`}>
                {user ? '已登录' : '未登录'}
              </span>
            </div>
          </div>
        </div>

        {/* 用户资料 */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">用户资料</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">资料状态:</span>
              <span className={`text-xs ${profile ? 'text-green-600' : 'text-red-600'}`}>
                {profile ? '已加载' : '未加载'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">用户类型:</span>
              <span className={`text-xs font-medium ${
                profile?.user_type === 'admin' ? 'text-green-600' : 
                profile?.user_type ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {profile?.user_type || '未知'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">权限验证:</span>
              <span className={`text-xs font-medium ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {isAdmin ? '通过' : '失败'}
              </span>
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        {permissionError && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-red-600 uppercase tracking-wide">权限错误</div>
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {permissionError}
            </div>
          </div>
        )}

        {/* 连接错误信息 */}
        {connectionError && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">连接错误</div>
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              {connectionError}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">操作</div>
          <div className="flex space-x-2">
            <button
              onClick={onRefreshPermissions}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />
              刷新权限
            </button>
            <button
              onClick={onForceReload}
              className="flex-1 px-3 py-2 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />
              强制刷新
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onCheckConnection}
              disabled={isConnecting}
              className={`flex-1 px-3 py-2 text-white text-xs rounded transition-colors ${
                isConnecting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isConnecting ? (
                <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 inline mr-1" />
              )}
              {isConnecting ? '检查中...' : '检查连接'}
            </button>
          </div>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={onSignOut}
              className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              重新登录
            </button>
          </div>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => {
                console.log('🚨 用户手动触发强制权限恢复...')
                onRefreshPermissions()
              }}
              className="flex-1 px-3 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
            >
              🚨 强制恢复权限
            </button>
          </div>
        </div>

        {/* 调试信息 */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">调试信息</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Loading: {loading.toString()}</div>
            <div>isAdmin: {isAdmin.toString()}</div>
            <div>时间: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 
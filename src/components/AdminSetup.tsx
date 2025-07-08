import React, { useState, useEffect } from 'react'
import { Shield, CheckCircle, AlertCircle, Loader, ArrowLeft, RefreshCw } from 'lucide-react'
import { createAdminAccount, checkAdminExists } from '../lib/createAdmin'

export function AdminSetup() {
  const [isCreating, setIsCreating] = useState(false)
  const [adminExists, setAdminExists] = useState<boolean | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      setIsChecking(true)
      setResult(null)
      console.log('检查管理员账号是否存在...')
      
      // 先检查数据库中是否有管理员用户
      const exists = await checkAdminExists()
      console.log('管理员账号检查结果:', exists)
      setAdminExists(exists)
      
      if (exists) {
        setResult({
          success: true,
          message: '管理员账号已存在并可正常使用'
        })
      }
    } catch (error) {
      console.error('检查管理员账号时出错:', error)
      setAdminExists(false)
      setResult({
        success: false,
        message: '检查管理员状态时发生错误，请重试'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleCreateAdmin = async () => {
    setIsCreating(true)
    setResult(null)

    try {
      console.log('开始创建管理员账号...')
      const response = await createAdminAccount()
      console.log('创建管理员账号响应:', response)
      
      if (response.success) {
        setResult({
          success: true,
          message: '管理员账号创建成功！您现在可以使用 admin@tiklive.pro / admin888 登录了。'
        })
        setAdminExists(true)
      } else {
        setResult({
          success: false,
          message: response.error || '创建管理员账号失败，请重试'
        })
      }
    } catch (error) {
      console.error('创建管理员账号时出错:', error)
      setResult({
        success: false,
        message: '创建过程中发生错误，请检查网络连接后重试'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleGoBack = () => {
    window.location.href = '/'
  }

  const handleRefresh = () => {
    setResult(null)
    setAdminExists(null)
    checkAdmin()
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">检查系统状态</h2>
          <p className="text-gray-600 mb-4">正在检查管理员账号状态...</p>
          <button
            onClick={handleRefresh}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重新检查</span>
          </button>
        </div>
      </div>
    )
  }

  if (adminExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">管理员账号已存在</h2>
          <p className="text-gray-600 mb-6">
            管理员账号已经创建，您可以使用以下信息登录：
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>邮箱：</strong> admin@tiklive.pro<br />
              <strong>密码：</strong> admin888<br />
              <strong>类型：</strong> 系统管理员
            </p>
          </div>
          
          {result && result.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-green-700 text-sm">{result.message}</p>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={handleGoBack}
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新检查</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">初始化管理员账号</h2>
          <p className="text-gray-600">
            系统检测到还没有管理员账号，请点击下方按钮创建。
          </p>
        </div>

        {result && (
          <div className={`p-4 rounded-lg mb-6 ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <p className={`text-sm ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">管理员账号信息</h3>
          <p className="text-sm text-blue-700">
            <strong>邮箱：</strong> admin@tiklive.pro<br />
            <strong>密码：</strong> admin888<br />
            <strong>权限：</strong> 系统管理员
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCreateAdmin}
            disabled={isCreating}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>创建中...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>创建管理员账号</span>
              </>
            )}
          </button>

          <button
            onClick={handleGoBack}
            className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回首页</span>
          </button>

          <button
            onClick={handleRefresh}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重新检查状态</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          创建后您可以使用上述账号信息登录管理后台
        </p>
      </div>
    </div>
  )
}
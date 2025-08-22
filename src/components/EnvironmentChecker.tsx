import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

export function EnvironmentChecker() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean
    supabaseKey: boolean
    environment: string
    timestamp: string
  }>({
    supabaseUrl: false,
    supabaseKey: false,
    environment: '',
    timestamp: ''
  })

  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const checkEnvironment = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const environment = import.meta.env.MODE
      const timestamp = new Date().toLocaleString()

      setEnvStatus({
        supabaseUrl: !!supabaseUrl && supabaseUrl !== 'your_supabase_project_url',
        supabaseKey: !!supabaseKey && supabaseKey !== 'your_supabase_anon_key',
        environment,
        timestamp
      })
    }

    checkEnvironment()
  }, [])

  const hasIssues = !envStatus.supabaseUrl || !envStatus.supabaseKey

  if (!hasIssues) {
    return null // 如果没有问题，不显示组件
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-red-200 p-4 max-w-md">
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="font-semibold text-red-700">环境配置问题</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            {envStatus.supabaseUrl ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={envStatus.supabaseUrl ? 'text-green-700' : 'text-red-700'}>
              Supabase URL: {envStatus.supabaseUrl ? '已配置' : '未配置'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {envStatus.supabaseKey ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={envStatus.supabaseKey ? 'text-green-700' : 'text-red-700'}>
              Supabase Key: {envStatus.supabaseKey ? '已配置' : '未配置'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-blue-700">
              环境: {envStatus.environment}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-blue-700">
              检查时间: {envStatus.timestamp}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showDetails ? '隐藏详情' : '显示详情'}
        </button>

        {showDetails && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
            <div className="font-semibold mb-2">当前环境变量值:</div>
            <div className="space-y-1">
              <div>
                <span className="font-mono">VITE_SUPABASE_URL:</span>
                <span className="ml-2 text-gray-600">
                  {import.meta.env.VITE_SUPABASE_URL || '未设置'}
                </span>
              </div>
              <div>
                <span className="font-mono">VITE_SUPABASE_ANON_KEY:</span>
                <span className="ml-2 text-gray-600">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY 
                    ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` 
                    : '未设置'}
                </span>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="font-semibold text-yellow-800 mb-1">解决方案:</div>
              <ol className="text-yellow-700 text-xs space-y-1 list-decimal list-inside">
                <li>在Vercel中设置环境变量</li>
                <li>重新部署项目</li>
                <li>检查Supabase项目状态</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Settings,
  Shield,
  Key,
  RefreshCw,
  Wifi,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export function SupabaseConfigChecker() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    setLoading(true)
    
    try {
      // 检查环境变量
      const envConfig = {
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        url: import.meta.env.VITE_SUPABASE_URL,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
        isValidUrl: false,
        isValidKey: false,
        currentDomain: window.location.origin,
        isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        isWebContainer: window.location.hostname.includes('webcontainer-api.io')
      }

      // 验证 URL 格式
      if (envConfig.hasUrl && envConfig.url !== 'your_supabase_project_url') {
        try {
          const url = new URL(envConfig.url)
          envConfig.isValidUrl = url.hostname.includes('supabase.co')
        } catch (e) {
          envConfig.isValidUrl = false
        }
      }

      // 验证 Key 格式
      if (envConfig.hasKey && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key') {
        envConfig.isValidKey = envConfig.keyLength > 100 // JWT tokens are typically longer
      }

      // 测试连接
      let connectionTest = {
        canConnect: false,
        canAuth: false,
        canQuery: false,
        error: null as string | null,
        errorType: null as string | null,
        networkError: false,
        corsError: false,
        authError: false,
        configError: false
      }

      // 如果基本配置有问题，跳过连接测试
      if (!envConfig.isValidUrl || !envConfig.isValidKey) {
        connectionTest.configError = true
        connectionTest.error = '环境变量配置错误，请检查 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
      } else {
        try {
          // 使用更短的超时时间和更好的错误处理
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒超时

          console.log('开始测试 Supabase 连接...')
          
          const { data, error } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1)
            .abortSignal(controller.signal)

          clearTimeout(timeoutId)

          if (!error) {
            connectionTest.canConnect = true
            connectionTest.canQuery = true
            console.log('✅ Supabase 连接测试成功')
          } else {
            console.error('❌ Supabase 连接测试失败:', error)
            connectionTest.error = error.message
            
            // 分析错误类型
            if (error.message?.toLowerCase().includes('failed to fetch')) {
              connectionTest.networkError = true
              connectionTest.errorType = 'network'
            } else if (error.message?.toLowerCase().includes('cors')) {
              connectionTest.corsError = true
              connectionTest.errorType = 'cors'
            } else if (error.code === 'PGRST301' || error.message?.toLowerCase().includes('permission')) {
              connectionTest.authError = true
              connectionTest.errorType = 'auth'
            } else {
              connectionTest.errorType = 'unknown'
            }
          }

          // 测试认证状态
          try {
            const { data: session } = await supabase.auth.getSession()
            connectionTest.canAuth = true
          } catch (authError: any) {
            console.warn('认证状态检查失败:', authError)
          }

        } catch (error: any) {
          console.error('连接测试异常:', error)
          connectionTest.error = error.message || '连接测试失败'
          
          if (error.name === 'AbortError') {
            connectionTest.errorType = 'timeout'
            connectionTest.error = '连接超时：服务器响应时间过长'
          } else if (error.message?.toLowerCase().includes('failed to fetch')) {
            connectionTest.networkError = true
            connectionTest.errorType = 'network'
          } else if (error.message?.toLowerCase().includes('cors')) {
            connectionTest.corsError = true
            connectionTest.errorType = 'cors'
          }
        }
      }

      setConfig({
        env: envConfig,
        connection: connectionTest,
        timestamp: new Date().toLocaleString()
      })

    } catch (error) {
      console.error('配置检查失败:', error)
      setConfig({
        env: {
          hasUrl: false,
          hasKey: false,
          isValidUrl: false,
          isValidKey: false,
          currentDomain: window.location.origin,
          isLocalhost: false,
          isWebContainer: false
        },
        connection: {
          canConnect: false,
          canAuth: false,
          canQuery: false,
          error: '配置检查失败',
          errorType: 'system',
          networkError: false,
          corsError: false,
          authError: false,
          configError: true
        },
        timestamp: new Date().toLocaleString()
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">检查 Supabase 配置</h3>
        </div>
        <p className="text-gray-600">正在检查配置状态...</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>配置检查失败</p>
        </div>
      </div>
    )
  }

  // 生成错误解决方案
  const getErrorSolutions = () => {
    const { connection, env } = config
    const solutions: string[] = []

    if (connection.configError || !env.isValidUrl || !env.isValidKey) {
      solutions.push('检查 .env 文件中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 是否正确设置')
      solutions.push('确认环境变量值不是占位符（your_supabase_project_url 等）')
      solutions.push('重启开发服务器以加载新的环境变量')
    }

    if (connection.networkError || connection.errorType === 'network') {
      solutions.push('检查网络连接是否正常')
      solutions.push('确认 Supabase 项目状态正常（访问 Supabase Dashboard 检查）')
      solutions.push('检查防火墙或代理设置是否阻止了请求')
      if (env.isWebContainer) {
        solutions.push('WebContainer 环境可能需要特殊的网络配置，尝试刷新页面')
      }
    }

    if (connection.corsError || connection.errorType === 'cors') {
      solutions.push('在 Supabase Dashboard → Settings → API → Site URL 中添加当前域名')
      if (env.isWebContainer) {
        solutions.push(`添加 WebContainer 域名: ${env.currentDomain}`)
      }
      solutions.push('确认 Supabase 项目的 CORS 设置允许当前域名')
    }

    if (connection.authError || connection.errorType === 'auth') {
      solutions.push('检查 API 密钥权限是否正确')
      solutions.push('确认 RLS 策略配置正确')
      solutions.push('验证 anon key 是否有效')
    }

    if (connection.errorType === 'timeout') {
      solutions.push('网络连接较慢，尝试稍后重试')
      solutions.push('检查 Supabase 服务状态')
      solutions.push('考虑使用更稳定的网络环境')
    }

    return solutions
  }

  const errorSolutions = getErrorSolutions()

  return (
    <div className="space-y-6">
      {/* 环境配置状态 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">环境配置状态</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {config.env.isValidUrl ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-medium">Supabase URL</span>
            </div>
            <div className="text-xs text-gray-600 ml-7">
              {config.env.isValidUrl ? '✅ 格式正确' : '❌ 格式错误或未配置'}
              {config.env.url && config.env.url !== 'your_supabase_project_url' && (
                <div className="mt-1 font-mono text-xs break-all">{config.env.url}</div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {config.env.isValidKey ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-medium">API Key</span>
            </div>
            <div className="text-xs text-gray-600 ml-7">
              {config.env.isValidKey ? `✅ 长度: ${config.env.keyLength} 字符` : '❌ 格式错误或未配置'}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">当前域名</span>
            </div>
            <div className="text-xs text-gray-600 ml-7 break-all">
              {config.env.currentDomain}
            </div>
            
            <div className="flex items-center space-x-2">
              {config.env.isLocalhost || config.env.isWebContainer ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm font-medium">环境类型</span>
            </div>
            <div className="text-xs text-gray-600 ml-7">
              {config.env.isWebContainer ? '🌐 WebContainer 环境' : 
               config.env.isLocalhost ? '💻 本地开发环境' : '🌍 生产环境'}
            </div>
          </div>
        </div>
      </div>

      {/* 连接测试状态 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">连接测试状态</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {config.connection.canConnect ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">数据库连接</span>
            </div>
            <span className={`text-sm ${config.connection.canConnect ? 'text-green-600' : 'text-red-600'}`}>
              {config.connection.canConnect ? '正常' : '失败'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {config.connection.canAuth ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">认证系统</span>
            </div>
            <span className={`text-sm ${config.connection.canAuth ? 'text-green-600' : 'text-red-600'}`}>
              {config.connection.canAuth ? '正常' : '失败'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {config.connection.canQuery ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">数据查询</span>
            </div>
            <span className={`text-sm ${config.connection.canQuery ? 'text-green-600' : 'text-red-600'}`}>
              {config.connection.canQuery ? '正常' : '失败'}
            </span>
          </div>
          
          {config.connection.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-medium mb-2">
                    错误详情:
                  </p>
                  <p className="text-red-600 text-sm break-words">
                    {config.connection.error}
                  </p>
                  {config.connection.errorType && (
                    <p className="text-red-500 text-xs mt-1">
                      错误类型: {config.connection.errorType}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 错误解决方案 */}
      {errorSolutions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Wifi className="w-6 h-6 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-900">解决方案</h3>
          </div>
          
          <div className="space-y-2">
            {errorSolutions.map((solution, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-amber-600 font-bold text-sm mt-0.5">{index + 1}.</span>
                <span className="text-amber-800 text-sm">{solution}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 域名配置指南 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">域名配置说明</h3>
        </div>
        
        <div className="space-y-3 text-blue-800 text-sm">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <strong>开发环境:</strong> localhost 和 127.0.0.1 通常自动被 Supabase 允许
            </div>
          </div>
          
          {config.env.isWebContainer && (
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <strong>WebContainer 环境:</strong> 需要在 Supabase 中添加当前域名: <code className="bg-blue-100 px-1 rounded text-xs">{config.env.currentDomain}</code>
              </div>
            </div>
          )}
          
          <div className="flex items-start space-x-2">
            <Key className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <strong>配置路径:</strong> Supabase Dashboard → Settings → API → Site URL
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>打开 Supabase Dashboard</span>
          </a>
          
          <button
            onClick={checkConfiguration}
            className="border border-blue-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重新检查</span>
          </button>
          
          {config.env.isWebContainer && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(config.env.currentDomain)
                alert('域名已复制到剪贴板！')
              }}
              className="border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-2 text-sm"
            >
              <Key className="w-4 h-4" />
              <span>复制当前域名</span>
            </button>
          )}
        </div>
      </div>

      {/* 总结 */}
      <div className={`rounded-xl p-6 ${
        config.connection.canConnect && config.env.isValidUrl && config.env.isValidKey
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center space-x-3 mb-2">
          {config.connection.canConnect && config.env.isValidUrl && config.env.isValidKey ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600" />
          )}
          <h3 className={`text-lg font-semibold ${
            config.connection.canConnect && config.env.isValidUrl && config.env.isValidKey
              ? 'text-green-900'
              : 'text-red-900'
          }`}>
            配置状态总结
          </h3>
        </div>
        
        <p className={`text-sm ${
          config.connection.canConnect && config.env.isValidUrl && config.env.isValidKey
            ? 'text-green-800'
            : 'text-red-800'
        }`}>
          {config.connection.canConnect && config.env.isValidUrl && config.env.isValidKey
            ? '✅ 所有配置正常！您的 Supabase 连接已正确设置，可以正常使用所有功能。'
            : '❌ 连接失败！请按照上述解决方案修复配置问题。'
          }
        </p>
        
        <div className="text-xs text-gray-600 mt-2">
          检查时间: {config.timestamp}
        </div>
      </div>
    </div>
  )
}
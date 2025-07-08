import React, { useState, useEffect } from 'react'
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Shield,
  Table,
  Users,
  Settings,
  X,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Clock,
  Zap
} from 'lucide-react'
import { testSupabaseConnection } from '../lib/supabase'

interface DatabaseStatusProps {
  onClose?: () => void
}

export function DatabaseStatus({ onClose }: DatabaseStatusProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [autoTest, setAutoTest] = useState(true)
  const [showEnvValues, setShowEnvValues] = useState(false)
  const [testHistory, setTestHistory] = useState<any[]>([])
  const [testProgress, setTestProgress] = useState<string>('')
  const [testStep, setTestStep] = useState<number>(0)
  const [totalSteps] = useState(5)

  useEffect(() => {
    if (autoTest) {
      runTest()
    }
  }, [autoTest])

  const runTest = async () => {
    setTesting(true)
    setTestProgress('初始化测试...')
    setTestStep(0)
    const startTime = Date.now()
    
    try {
      console.log('🔍 开始数据库连接测试...')
      
      // 模拟测试步骤进度
      const progressSteps = [
        '检查环境配置...',
        '测试基本连接...',
        '验证认证系统...',
        '检查数据库访问...',
        '验证权限策略...'
      ]

      // 创建一个进度更新函数
      const updateProgress = (step: number, message: string) => {
        setTestStep(step)
        setTestProgress(message)
      }

      // 开始测试，带进度更新
      updateProgress(1, progressSteps[0])
      await new Promise(resolve => setTimeout(resolve, 500))

      updateProgress(2, progressSteps[1])
      await new Promise(resolve => setTimeout(resolve, 800))

      updateProgress(3, progressSteps[2])
      await new Promise(resolve => setTimeout(resolve, 600))

      updateProgress(4, progressSteps[3])
      await new Promise(resolve => setTimeout(resolve, 700))

      updateProgress(5, progressSteps[4])
      
      // 执行实际测试
      const testResult = await testSupabaseConnection()
      const duration = Date.now() - startTime
      
      const testRecord = {
        timestamp: new Date().toLocaleTimeString(),
        duration: `${duration}ms`,
        success: testResult.success,
        result: testResult
      }
      
      setTestHistory(prev => [testRecord, ...prev.slice(0, 4)])
      setResult(testResult)
      
      console.log('✅ 数据库连接测试完成:', testResult)
      
      // 完成进度
      setTestProgress(testResult.success ? '测试完成 ✓' : '测试完成 ✗')
      
    } catch (error: any) {
      console.error('❌ 数据库连接测试失败:', error)
      const duration = Date.now() - startTime
      
      const testRecord = {
        timestamp: new Date().toLocaleTimeString(),
        duration: `${duration}ms`,
        success: false,
        result: {
          success: false,
          error: `测试过程中发生错误: ${error.message}`,
          details: { 
            suggestions: [
              '检查网络连接是否稳定',
              '确认 Supabase 项目状态正常',
              '验证环境变量配置',
              '刷新页面重试',
              '联系技术支持'
            ] 
          }
        }
      }
      
      setTestHistory(prev => [testRecord, ...prev.slice(0, 4)])
      setResult(testRecord.result)
      setTestProgress('测试失败 ✗')
    } finally {
      setTesting(false)
      // 延迟重置进度
      setTimeout(() => {
        setTestStep(0)
        setTestProgress('')
      }, 2000)
    }
  }

  const quickTest = async () => {
    setTesting(true)
    setTestProgress('快速检查连接...')
    setTestStep(1)
    
    try {
      // 简化的快速测试
      const startTime = Date.now()
      
      // 检查环境变量
      const hasUrl = !!import.meta.env.VITE_SUPABASE_URL
      const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
      const isValidUrl = hasUrl && import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url'
      const isValidKey = hasKey && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      
      if (!hasUrl || !hasKey || !isValidUrl || !isValidKey) {
        throw new Error('环境变量配置不完整或使用占位符值')
      }
      
      setTestProgress('测试网络连接...')
      setTestStep(2)
      
      // 简单的网络连接测试
      const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      })
      
      const duration = Date.now() - startTime
      const success = response.ok
      
      const quickResult = {
        success,
        message: success ? `快速连接测试通过 (${duration}ms)` : '快速连接测试失败',
        error: success ? null : `HTTP ${response.status}: ${response.statusText}`,
        details: {
          testResults: {
            basicConnection: success,
            authentication: success,
            databaseAccess: success,
            tableStructure: success,
            rlsPolicies: success
          },
          testDuration: duration,
          quickTest: true
        }
      }
      
      const testRecord = {
        timestamp: new Date().toLocaleTimeString(),
        duration: `${duration}ms`,
        success,
        result: quickResult,
        type: 'quick'
      }
      
      setTestHistory(prev => [testRecord, ...prev.slice(0, 4)])
      setResult(quickResult)
      setTestProgress(success ? '快速测试完成 ✓' : '快速测试失败 ✗')
      
    } catch (error: any) {
      const quickResult = {
        success: false,
        error: `快速测试失败: ${error.message}`,
        details: {
          suggestions: [
            '检查环境变量配置',
            '确认 Supabase URL 格式正确',
            '验证 API 密钥有效性',
            '检查网络连接',
            '运行完整测试获取详细信息'
          ]
        }
      }
      
      setResult(quickResult)
      setTestProgress('快速测试失败 ✗')
    } finally {
      setTesting(false)
      setTimeout(() => {
        setTestStep(0)
        setTestProgress('')
      }, 2000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动复制')
    })
  }

  const getStatusIcon = () => {
    if (testing) {
      return <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
    }
    
    if (!result) {
      return <Database className="w-6 h-6 text-gray-400" />
    }
    
    return result.success 
      ? <CheckCircle className="w-6 h-6 text-green-500" />
      : <AlertCircle className="w-6 h-6 text-red-500" />
  }

  const getStatusColor = () => {
    if (testing) return 'border-blue-200 bg-blue-50'
    if (!result) return 'border-gray-200 bg-gray-50'
    return result.success 
      ? 'border-green-200 bg-green-50' 
      : 'border-red-200 bg-red-50'
  }

  const getStatusText = () => {
    if (testing) return testProgress || '正在测试连接...'
    if (!result) return '等待测试'
    return result.success ? '连接正常' : '连接异常'
  }

  const hasValidConfig = import.meta.env.VITE_SUPABASE_URL && 
                        import.meta.env.VITE_SUPABASE_ANON_KEY &&
                        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
                        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">数据库连接诊断</h2>
                <p className="text-blue-100 text-sm">Supabase 连接状态检查</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Status & Tests */}
            <div className="space-y-6">
              {/* Status Overview */}
              <div className={`border-2 rounded-xl p-4 ${getStatusColor()}`}>
                <div className="flex items-center space-x-3 mb-3">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{getStatusText()}</h3>
                    {result && (
                      <p className="text-sm text-gray-600">
                        {result.success ? result.message : result.error}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!testing && (
                      <>
                        <button
                          onClick={quickTest}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors flex items-center space-x-1"
                          title="快速测试"
                        >
                          <Zap className="w-4 h-4" />
                          <span className="text-xs">快速</span>
                        </button>
                        <button
                          onClick={runTest}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                          title="完整测试"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                {testing && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>测试进度</span>
                      <span>{testStep}/{totalSteps}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(testStep / totalSteps) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Test Results */}
                {result?.details?.testResults && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center space-x-2">
                      <Wifi className={`w-4 h-4 ${result.details.testResults.basicConnection ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm">基本连接</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className={`w-4 h-4 ${result.details.testResults.authentication ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm">认证系统</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Table className={`w-4 h-4 ${result.details.testResults.databaseAccess ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm">数据库访问</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database className={`w-4 h-4 ${result.details.testResults.tableStructure ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm">表结构</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className={`w-4 h-4 ${result.details.testResults.rlsPolicies ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm">权限策略</span>
                    </div>
                    {result.details.quickTest && (
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">快速测试</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Performance Info */}
                {result?.details?.testDuration && (
                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>耗时: {result.details.testDuration}ms</span>
                    </div>
                    {result.details.testDuration < 1000 && (
                      <span className="text-green-600">⚡ 响应快速</span>
                    )}
                    {result.details.testDuration >= 1000 && result.details.testDuration < 3000 && (
                      <span className="text-yellow-600">⏱️ 响应正常</span>
                    )}
                    {result.details.testDuration >= 3000 && (
                      <span className="text-red-600">🐌 响应较慢</span>
                    )}
                  </div>
                )}
              </div>

              {/* Test History */}
              {testHistory.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>测试历史</span>
                  </h4>
                  <div className="space-y-2">
                    {testHistory.map((test, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          {test.success ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span>{test.timestamp}</span>
                          {test.type === 'quick' && (
                            <span className="bg-yellow-100 text-yellow-700 px-1 rounded text-xs">快速</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-gray-500">
                          <span>{test.duration}</span>
                          <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                            {test.success ? '成功' : '失败'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Status Check */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-blue-800 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>快速状态检查</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${hasValidConfig ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>环境配置</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${import.meta.env.VITE_SUPABASE_URL?.includes('supabase.co') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>URL 格式</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${import.meta.env.VITE_SUPABASE_ANON_KEY?.length > 100 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>密钥长度</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${result?.success ? 'bg-green-500' : result === null ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                    <span>连接状态</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Configuration */}
            <div className="space-y-6">
              {/* Environment Check */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>环境配置</span>
                  </h4>
                  <button
                    onClick={() => setShowEnvValues(!showEnvValues)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    {showEnvValues ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showEnvValues ? '隐藏' : '显示'}值</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* URL Configuration */}
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">VITE_SUPABASE_URL</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          hasValidConfig && import.meta.env.VITE_SUPABASE_URL
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {import.meta.env.VITE_SUPABASE_URL ? '已配置' : '未配置'}
                        </span>
                        {import.meta.env.VITE_SUPABASE_URL && (
                          <button
                            onClick={() => copyToClipboard(import.meta.env.VITE_SUPABASE_URL)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {showEnvValues && import.meta.env.VITE_SUPABASE_URL && (
                      <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
                        {import.meta.env.VITE_SUPABASE_URL}
                      </div>
                    )}
                    {import.meta.env.VITE_SUPABASE_URL && (
                      <div className="text-xs text-gray-500 mt-1">
                        域名: {new URL(import.meta.env.VITE_SUPABASE_URL).hostname}
                      </div>
                    )}
                  </div>

                  {/* Key Configuration */}
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">VITE_SUPABASE_ANON_KEY</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          hasValidConfig && import.meta.env.VITE_SUPABASE_ANON_KEY
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {import.meta.env.VITE_SUPABASE_ANON_KEY ? '已配置' : '未配置'}
                        </span>
                        {import.meta.env.VITE_SUPABASE_ANON_KEY && (
                          <button
                            onClick={() => copyToClipboard(import.meta.env.VITE_SUPABASE_ANON_KEY)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {showEnvValues && import.meta.env.VITE_SUPABASE_ANON_KEY && (
                      <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
                        {import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...
                      </div>
                    )}
                    {import.meta.env.VITE_SUPABASE_ANON_KEY && (
                      <div className="text-xs text-gray-500 mt-1">
                        长度: {import.meta.env.VITE_SUPABASE_ANON_KEY.length} 字符
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration Status */}
                <div className="mt-4 p-3 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">配置状态</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    {hasValidConfig ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>环境变量配置正确</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span>环境变量配置不完整</span>
                        </div>
                        {!import.meta.env.VITE_SUPABASE_URL && (
                          <p className="text-xs">• 缺少 VITE_SUPABASE_URL</p>
                        )}
                        {!import.meta.env.VITE_SUPABASE_ANON_KEY && (
                          <p className="text-xs">• 缺少 VITE_SUPABASE_ANON_KEY</p>
                        )}
                        {import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url' && (
                          <p className="text-xs">• VITE_SUPABASE_URL 使用的是占位符值</p>
                        )}
                        {import.meta.env.VITE_SUPABASE_ANON_KEY === 'your_supabase_anon_key' && (
                          <p className="text-xs">• VITE_SUPABASE_ANON_KEY 使用的是占位符值</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-blue-800">快速操作</h4>
                <div className="space-y-2">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border"
                  >
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">打开 Supabase Dashboard</span>
                    </div>
                    <span className="text-xs text-gray-500">获取配置信息</span>
                  </a>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-between w-full p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border"
                  >
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">重新加载页面</span>
                    </div>
                    <span className="text-xs text-gray-500">应用新配置</span>
                  </button>

                  <button
                    onClick={quickTest}
                    disabled={testing}
                    className="flex items-center justify-between w-full p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">快速连接测试</span>
                    </div>
                    <span className="text-xs text-gray-500">5秒内完成</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {result && !result.success && result.details?.suggestions && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>解决建议</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.details.suggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2 text-sm text-red-700">
                    <span className="text-red-500 mt-1 font-bold">{index + 1}.</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Guide */}
          {!hasValidConfig && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-3 flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>配置指南</span>
              </h4>
              <div className="text-sm text-amber-700 space-y-3">
                <div>
                  <p className="font-medium mb-2">步骤 1: 创建环境配置文件</p>
                  <p>在项目根目录创建 <code className="bg-amber-100 px-1 rounded font-mono">.env</code> 文件</p>
                </div>
                
                <div>
                  <p className="font-medium mb-2">步骤 2: 添加配置内容</p>
                  <div className="bg-amber-100 p-3 rounded font-mono text-xs overflow-x-auto">
                    VITE_SUPABASE_URL=https://your-project-id.supabase.co<br />
                    VITE_SUPABASE_ANON_KEY=your-anon-key-here
                  </div>
                </div>
                
                <div>
                  <p className="font-medium mb-2">步骤 3: 获取配置值</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>访问 <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase Dashboard</a></li>
                    <li>选择您的项目</li>
                    <li>进入 Settings → API</li>
                    <li>复制 Project URL 和 anon/public key</li>
                  </ol>
                </div>
                
                <div>
                  <p className="font-medium mb-2">步骤 4: 重启开发服务器</p>
                  <p className="text-xs">保存 .env 文件后，重启开发服务器使配置生效</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={quickTest}
              disabled={testing}
              className="bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Zap className={`w-4 h-4 ${testing ? 'animate-pulse' : ''}`} />
              <span>{testing ? '快速测试中...' : '快速测试'}</span>
            </button>

            <button
              onClick={runTest}
              disabled={testing}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? '完整测试中...' : '完整测试'}</span>
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
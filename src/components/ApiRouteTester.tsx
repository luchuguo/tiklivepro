import React, { useState } from 'react'
import { TestTube, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface ApiTestResult {
  endpoint: string
  success: boolean
  status: number
  responseType: 'json' | 'html' | 'error'
  responseSize: number
  cacheStatus: string
  error?: string
  data?: any
}

export function ApiRouteTester() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<ApiTestResult[]>([])
  const [currentTaskId, setCurrentTaskId] = useState('c5b1cf14-09a1-43bf-b67b-a8d4115e6bcd')

  const testApiEndpoints = async () => {
    setIsRunning(true)
    setResults([])
    
    const testResults: ApiTestResult[] = []
    
    try {
      console.log('🧪 开始测试API路由...')
      
      // 测试1: 任务列表API
      const tasksResult = await testApiEndpoint('/api/tasks', '任务列表API')
      testResults.push(tasksResult)
      
      // 测试2: 任务详情API
      const taskDetailResult = await testApiEndpoint(`/api/task/${currentTaskId}`, '任务详情API')
      testResults.push(taskDetailResult)
      
      // 测试3: 任务申请API
      const applicationsResult = await testApiEndpoint(`/api/task/${currentTaskId}/applications`, '任务申请API')
      testResults.push(applicationsResult)
      
      // 测试4: 分类API
      const categoriesResult = await testApiEndpoint('/api/categories', '分类API')
      testResults.push(categoriesResult)
      
      // 测试5: 达人API
      const influencersResult = await testApiEndpoint('/api/influencers', '达人API')
      testResults.push(influencersResult)
      
      console.log('📋 API路由测试完成')
      console.log('测试结果:', testResults)
      
    } catch (error: any) {
      console.error('💥 API路由测试异常:', error)
    } finally {
      setResults(testResults)
      setIsRunning(false)
    }
  }

  const testApiEndpoint = async (endpoint: string, name: string): Promise<ApiTestResult> => {
    try {
      console.log(`🔍 测试 ${name}: ${endpoint}`)
      
      const startTime = Date.now()
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      })
      
      const responseTime = Date.now() - startTime
      const responseText = await response.text()
      
      // 判断响应类型
      let responseType: 'json' | 'html' | 'error' = 'error'
      let responseData: any = null
      let responseSize = responseText.length
      
      try {
        responseData = JSON.parse(responseText)
        responseType = 'json'
      } catch {
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          responseType = 'html'
        }
      }
      
      // 检查缓存状态
      const cacheControl = response.headers.get('Cache-Control')
      const age = response.headers.get('Age')
      const cacheStatus = cacheControl ? `Cache: ${cacheControl}` : 'No cache headers'
      
      const result: ApiTestResult = {
        endpoint,
        success: response.ok && responseType === 'json',
        status: response.status,
        responseType,
        responseSize,
        cacheStatus,
        data: responseData
      }
      
      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`
      } else if (responseType === 'html') {
        result.error = '返回了HTML页面而不是JSON数据'
      }
      
      console.log(`${name} 测试结果:`, result)
      return result
      
    } catch (error: any) {
      console.error(`${name} 测试失败:`, error)
      return {
        endpoint,
        success: false,
        status: 0,
        responseType: 'error',
        responseSize: 0,
        cacheStatus: 'Error',
        error: error.message || '网络请求失败'
      }
    }
  }

  const getResultIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />
  }

  const getResultColor = (success: boolean) => {
    return success ? 'text-green-700' : 'text-red-700'
  }

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'json': return 'text-green-600'
      case 'html': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const openInNewTab = (endpoint: string) => {
    const fullUrl = `${window.location.origin}${endpoint}`
    window.open(fullUrl, '_blank')
  }

  return (
    <div className="fixed top-4 left-4 z-50 max-w-lg">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TestTube className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-900">API路由测试器</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              测试任务ID:
            </label>
            <input
              type="text"
              value={currentTaskId}
              onChange={(e) => setCurrentTaskId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="输入任务ID进行测试"
            />
          </div>
          
          <button
            onClick={testApiEndpoints}
            disabled={isRunning}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <span className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                测试中...
              </span>
            ) : (
              '测试所有API路由'
            )}
          </button>
          
          {results.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">测试结果:</div>
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getResultIcon(result.success)}
                      <span className={`text-sm font-medium ${getResultColor(result.success)}`}>
                        {result.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${getResponseTypeColor(result.responseType)}`}>
                        {result.responseType.toUpperCase()}
                      </span>
                      <button
                        onClick={() => openInNewTab(result.endpoint)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                        title="在新标签页中打开"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                    <div>状态: {result.status}</div>
                    <div>大小: {result.responseSize} 字符</div>
                    <div>响应类型: {result.responseType}</div>
                    <div>缓存: {result.cacheStatus}</div>
                  </div>
                  
                  {result.error && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {result.error}
                    </div>
                  )}
                  
                  {result.success && result.data && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      数据: {Array.isArray(result.data) ? `${result.data.length} 条记录` : '单条记录'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
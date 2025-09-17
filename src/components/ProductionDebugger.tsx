import React, { useState, useEffect } from 'react'
import { Bug, Database, Globe, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface DebugInfo {
  environment: string
  timestamp: string
  supabaseUrl: string
  supabaseKeyLength: number
  currentPath: string
  pathParams: Record<string, string>
  networkStatus: 'checking' | 'online' | 'offline'
  supabaseConnection: 'checking' | 'connected' | 'failed'
  cacheStatus: 'checking' | 'available' | 'unavailable'
}

export function ProductionDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environment: import.meta.env.MODE,
    timestamp: new Date().toLocaleString(),
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '未设置',
    supabaseKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    currentPath: window.location.pathname,
    pathParams: {},
    networkStatus: 'checking',
    supabaseConnection: 'checking',
    cacheStatus: 'checking'
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [isRunningTests, setIsRunningTests] = useState(false)

  useEffect(() => {
    // 只在生产环境显示
    if (import.meta.env.MODE !== 'production') {
      return
    }

    checkNetworkStatus()
    checkSupabaseConnection()
    checkCacheStatus()
    extractPathParams()
  }, [])

  const checkNetworkStatus = async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      setDebugInfo(prev => ({
        ...prev,
        networkStatus: response.ok ? 'online' : 'offline'
      }))
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        networkStatus: 'offline'
      }))
    }
  }

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('count')
        .limit(1)
      
      setDebugInfo(prev => ({
        ...prev,
        supabaseConnection: error ? 'failed' : 'connected'
      }))
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        supabaseConnection: 'failed'
      }))
    }
  }

  // 检查缓存状态
  const checkCacheStatus = () => {
    const hasCache = localStorage.getItem('tkgogogo_cache') !== null
    return hasCache ? '✅ 已启用' : '❌ 未启用'
  }

  const extractPathParams = () => {
    const path = window.location.pathname
    const params: Record<string, string> = {}
    
    // 提取动态路由参数
    if (path.includes('/influencer/')) {
      const id = path.split('/influencer/')[1]
      if (id) params.influencerId = id
    }
    if (path.includes('/company/')) {
      const id = path.split('/company/')[1]
      if (id) params.companyId = id
    }
    if (path.includes('/task/')) {
      const id = path.split('/task/')[1]
      if (id) params.taskId = id
    }
    
    setDebugInfo(prev => ({
      ...prev,
      pathParams: params
    }))
  }

  const runDiagnosticTests = async () => {
    setIsRunningTests(true)
    
    try {
      // 测试1: 基本网络连接
      console.log('🔍 开始生产环境诊断测试...')
      
      // 测试2: Supabase连接
      const { data: categories, error: catError } = await supabase
        .from('task_categories')
        .select('id, name')
        .limit(3)
      
      if (catError) {
        console.error('❌ 分类数据查询失败:', catError)
      } else {
        console.log('✅ 分类数据查询成功:', categories?.length || 0, '条记录')
      }
      
      // 测试3: 动态路由数据
      const { influencerId, companyId, taskId } = debugInfo.pathParams
      
      if (influencerId) {
        const { data: influencer, error: infError } = await supabase
          .from('influencers')
          .select('id, nickname, is_approved')
          .eq('id', influencerId)
          .single()
        
        if (infError) {
          console.error('❌ 达人详情查询失败:', infError)
        } else {
          console.log('✅ 达人详情查询成功:', influencer?.nickname)
        }
      }
      
      if (companyId) {
        const { data: company, error: compError } = await supabase
          .from('companies')
          .select('id, company_name, is_verified')
          .eq('id', companyId)
          .single()
        
        if (compError) {
          console.error('❌ 公司详情查询失败:', compError)
        } else {
          console.log('✅ 公司详情查询成功:', company?.company_name)
        }
      }
      
      if (taskId) {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('id, title, status')
          .eq('id', taskId)
          .single()
        
        if (taskError) {
          console.error('❌ 任务详情查询失败:', taskError)
        } else {
          console.log('✅ 任务详情查询成功:', task?.title)
        }
      }
      
      console.log('📋 生产环境诊断测试完成')
      
    } catch (error) {
      console.error('💥 诊断测试异常:', error)
    } finally {
      setIsRunningTests(false)
    }
  }

  // 只在生产环境显示
  if (import.meta.env.MODE !== 'production') {
    return null
  }

  const hasIssues = 
    debugInfo.networkStatus === 'offline' ||
    debugInfo.supabaseConnection === 'failed' ||
    debugInfo.cacheStatus === 'unavailable'

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`rounded-lg shadow-lg border p-3 max-w-sm transition-all duration-300 ${
        hasIssues 
          ? 'bg-red-50 border-red-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <Bug className={`w-4 h-4 ${
            hasIssues ? 'text-red-500' : 'text-green-500'
          }`} />
          <span className={`text-sm font-semibold ${
            hasIssues ? 'text-red-700' : 'text-green-700'
          }`}>
            生产环境调试器
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
        
        {isExpanded && (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span className="text-gray-600">网络:</span>
                <span className={debugInfo.networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.networkStatus === 'online' ? '在线' : '离线'}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Database className="w-3 h-3" />
                <span className="text-gray-600">数据库:</span>
                <span className={debugInfo.supabaseConnection === 'connected' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.supabaseConnection === 'connected' ? '连接' : '失败'}
                </span>
              </div>
            </div>
            
            <div className="text-gray-600">
              <div>环境: {debugInfo.environment}</div>
              <div>路径: {debugInfo.currentPath}</div>
              {Object.keys(debugInfo.pathParams).length > 0 && (
                <div>参数: {JSON.stringify(debugInfo.pathParams)}</div>
              )}
            </div>
            
            <button
              onClick={runDiagnosticTests}
              disabled={isRunningTests}
              className="w-full bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isRunningTests ? (
                <span className="flex items-center justify-center space-x-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  测试中...
                </span>
              ) : (
                '运行诊断测试'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 
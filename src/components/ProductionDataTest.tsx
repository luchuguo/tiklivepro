import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TestTube, CheckCircle, XCircle, AlertTriangle, Database, RefreshCw } from 'lucide-react'

interface TestResult {
  testName: string
  success: boolean
  error?: string
  data?: any
  duration: number
}

export function ProductionDataTest() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [currentTaskId, setCurrentTaskId] = useState('27eea3f2-2118-4776-a5f9-bc42a68f8617')

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])
    
    const startTime = Date.now()
    const testResults: TestResult[] = []

    try {
      // 测试1: 基本连接测试
      console.log('🧪 开始生产环境数据加载测试...')
      
      const test1Start = Date.now()
      const { data: healthData, error: healthError } = await supabase
        .from('task_categories')
        .select('count')
        .limit(1)
      
      testResults.push({
        testName: '基本数据库连接',
        success: !healthError,
        error: healthError?.message,
        duration: Date.now() - test1Start
      })

      // 测试2: 任务分类数据
      const test2Start = Date.now()
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('task_categories')
        .select('id, name, is_active')
        .eq('is_active', true)
        .limit(5)
      
      testResults.push({
        testName: '任务分类查询',
        success: !categoriesError,
        error: categoriesError?.message,
        data: categoriesData?.length || 0,
        duration: Date.now() - test2Start
      })

      // 测试3: 任务列表数据
      const test3Start = Date.now()
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, budget_min, budget_max')
        .eq('status', 'open')
        .limit(5)
      
      testResults.push({
        testName: '任务列表查询',
        success: !tasksError,
        error: tasksError?.message,
        data: tasksData?.length || 0,
        duration: Date.now() - test3Start
      })

      // 测试4: 达人列表数据
      const test4Start = Date.now()
      const { data: influencersData, error: influencersError } = await supabase
        .from('influencers')
        .select('id, nickname, is_approved, status')
        .eq('is_approved', true)
        .eq('status', 'active')
        .limit(5)
      
      testResults.push({
        testName: '达人列表查询',
        success: !influencersError,
        error: influencersError?.message,
        data: influencersData?.length || 0,
        duration: Date.now() - test4Start
      })

      // 测试5: 特定任务详情查询
      const test5Start = Date.now()
      const { data: taskDetailData, error: taskDetailError } = await supabase
        .from('tasks')
        .select(`
          *,
          company:companies(
            id,
            company_name,
            contact_person,
            industry
          ),
          category:task_categories(
            id,
            name,
            description
          )
        `)
        .eq('id', currentTaskId)
        .single()
      
      testResults.push({
        testName: '任务详情查询',
        success: !taskDetailError,
        error: taskDetailError?.message,
        data: taskDetailData ? '成功获取' : '数据为空',
        duration: Date.now() - test5Start
      })

      // 测试6: 公司列表数据
      const test6Start = Date.now()
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name, is_verified, industry')
        .eq('is_verified', true)
        .limit(5)
      
      testResults.push({
        testName: '公司列表查询',
        success: !companiesError,
        error: companiesError?.message,
        data: companiesData?.length || 0,
        duration: Date.now() - test6Start
      })

      console.log('📋 生产环境数据加载测试完成')
      console.log('测试结果:', testResults)
      
    } catch (error: any) {
      console.error('💥 测试过程中发生异常:', error)
      testResults.push({
        testName: '测试执行',
        success: false,
        error: error.message || '未知错误',
        duration: Date.now() - startTime
      })
    } finally {
      setResults(testResults)
      setIsRunning(false)
    }
  }

  const runSingleTest = async (testName: string) => {
    setIsRunning(true)
    
    try {
      let result: TestResult
      
      switch (testName) {
        case '任务详情查询':
          const start = Date.now()
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', currentTaskId)
            .single()
          
          result = {
            testName,
            success: !error,
            error: error?.message,
            data: data ? '成功获取' : '数据为空',
            duration: Date.now() - start
          }
          break
          
        default:
          result = {
            testName,
            success: false,
            error: '未知测试类型',
            duration: 0
          }
      }
      
      setResults(prev => [...prev.filter(r => r.testName !== testName), result])
      
    } catch (error: any) {
      const result: TestResult = {
        testName,
        success: false,
        error: error.message || '测试失败',
        duration: 0
      }
      setResults(prev => [...prev.filter(r => r.testName !== testName), result])
    } finally {
      setIsRunning(false)
    }
  }

  const getResultIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getResultColor = (success: boolean) => {
    return success ? 'text-green-700' : 'text-red-700'
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TestTube className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-900">生产环境数据测试</span>
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
            onClick={runAllTests}
            disabled={isRunning}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <span className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                测试中...
              </span>
            ) : (
              '运行所有测试'
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
                        {result.testName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.duration}ms
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      数据: {result.data}
                    </div>
                  )}
                  
                  {!result.success && (
                    <button
                      onClick={() => runSingleTest(result.testName)}
                      disabled={isRunning}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      重新测试
                    </button>
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
import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Users, 
  Building2, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Settings,
  Play,
  Download
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export function DatabaseDataChecker() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkDatabaseData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 开始检查数据库数据状态...')
      
      const checks = {
        connection: false,
        userProfiles: 0,
        influencers: 0,
        companies: 0,
        tasks: 0,
        taskCategories: 0,
        approvedInfluencers: 0,
        openTasks: 0,
        testDataExists: false
      }
      
      // 1. 检查连接
      console.log('检查基本连接...')
      const { data: connectionTest, error: connectionError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
      
      if (connectionError) {
        throw new Error(`连接失败: ${connectionError.message}`)
      }
      
      checks.connection = true
      console.log('✅ 数据库连接正常')
      
      // 2. 检查各表数据量
      console.log('检查用户资料数据...')
      const { count: profileCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
      checks.userProfiles = profileCount || 0
      
      console.log('检查达人数据...')
      const { count: influencerCount } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
      checks.influencers = influencerCount || 0
      
      console.log('检查已审核达人数据...')
      const { count: approvedInfluencerCount } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)
      checks.approvedInfluencers = approvedInfluencerCount || 0
      
      console.log('检查企业数据...')
      const { count: companyCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
      checks.companies = companyCount || 0
      
      console.log('检查任务数据...')
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
      checks.tasks = taskCount || 0
      
      console.log('检查开放任务数据...')
      const { count: openTaskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
      checks.openTasks = openTaskCount || 0
      
      console.log('检查任务分类数据...')
      const { count: categoryCount } = await supabase
        .from('task_categories')
        .select('*', { count: 'exact', head: true })
      checks.taskCategories = categoryCount || 0
      
      // 3. 检查是否有测试数据
      console.log('检查测试数据...')
      const { data: testInfluencer } = await supabase
        .from('influencers')
        .select('nickname')
        .ilike('nickname', '%美妆小仙女%')
        .limit(1)
      
      checks.testDataExists = !!testInfluencer && testInfluencer.length > 0
      
      // 4. 获取一些样本数据
      console.log('获取样本数据...')
      const { data: sampleInfluencers } = await supabase
        .from('influencers')
        .select('id, nickname, is_approved, status, followers_count')
        .limit(5)
      
      const { data: sampleTasks } = await supabase
        .from('tasks')
        .select('id, title, status, budget_min, budget_max')
        .limit(5)
      
      const { data: sampleCategories } = await supabase
        .from('task_categories')
        .select('id, name, is_active')
        .limit(10)
      
      setResults({
        checks,
        samples: {
          influencers: sampleInfluencers || [],
          tasks: sampleTasks || [],
          categories: sampleCategories || []
        },
        timestamp: new Date().toLocaleString()
      })
      
      console.log('📊 数据检查完成:', checks)
      
    } catch (error: any) {
      console.error('❌ 数据检查失败:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const initializeTestData = async () => {
    try {
      setLoading(true)
      console.log('🚀 开始初始化测试数据...')
      
      // 调用 Supabase 的 RPC 函数来初始化数据
      // 注意：这需要在 Supabase 中创建相应的函数
      alert('测试数据初始化功能需要在 Supabase 中配置相应的函数。请联系开发者。')
      
    } catch (error: any) {
      console.error('初始化测试数据失败:', error)
      setError(`初始化失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDatabaseData()
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">数据库数据检查</h2>
                <p className="text-blue-100 text-sm">检查数据库中的数据状态</p>
              </div>
            </div>
            <button
              onClick={checkDatabaseData}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {loading && !results ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">正在检查数据库数据...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">检查失败</h3>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={checkDatabaseData}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                重试
              </button>
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* 连接状态 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">数据库连接正常</h3>
                </div>
                <p className="text-green-700 text-sm">
                  检查时间: {results.timestamp}
                </p>
              </div>

              {/* 数据统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{results.checks.userProfiles}</div>
                  <div className="text-sm text-blue-700">用户资料</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">
                    {results.checks.approvedInfluencers}/{results.checks.influencers}
                  </div>
                  <div className="text-sm text-purple-700">已审核达人</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Building2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">{results.checks.companies}</div>
                  <div className="text-sm text-green-700">企业用户</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900">
                    {results.checks.openTasks}/{results.checks.tasks}
                  </div>
                  <div className="text-sm text-orange-700">开放任务</div>
                </div>
              </div>

              {/* 测试数据状态 */}
              <div className={`rounded-lg p-4 ${
                results.checks.testDataExists 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {results.checks.testDataExists ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <h3 className={`font-semibold ${
                      results.checks.testDataExists ? 'text-green-800' : 'text-amber-800'
                    }`}>
                      测试数据状态
                    </h3>
                  </div>
                  {!results.checks.testDataExists && (
                    <button
                      onClick={initializeTestData}
                      disabled={loading}
                      className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>初始化测试数据</span>
                    </button>
                  )}
                </div>
                <p className={`text-sm mt-1 ${
                  results.checks.testDataExists ? 'text-green-700' : 'text-amber-700'
                }`}>
                  {results.checks.testDataExists 
                    ? '测试数据已存在，达人列表应该可以正常显示'
                    : '未检测到测试数据，这可能是达人列表为空的原因'
                  }
                </p>
              </div>

              {/* 样本数据 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">样本数据预览</h3>
                
                {/* 达人样本 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">达人数据 ({results.samples.influencers.length})</h4>
                  {results.samples.influencers.length > 0 ? (
                    <div className="space-y-2">
                      {results.samples.influencers.map((inf: any) => (
                        <div key={inf.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                          <span className="font-medium">{inf.nickname}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              inf.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {inf.is_approved ? '已审核' : '待审核'}
                            </span>
                            <span className="text-gray-500">{inf.followers_count?.toLocaleString()} 粉丝</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">暂无达人数据</p>
                  )}
                </div>

                {/* 任务样本 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">任务数据 ({results.samples.tasks.length})</h4>
                  {results.samples.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {results.samples.tasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                          <span className="font-medium">{task.title}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {task.status}
                            </span>
                            <span className="text-gray-500">${task.budget_min}-{task.budget_max}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">暂无任务数据</p>
                  )}
                </div>

                {/* 分类样本 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">任务分类 ({results.samples.categories.length})</h4>
                  {results.samples.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {results.samples.categories.map((cat: any) => (
                        <span key={cat.id} className={`px-3 py-1 rounded-full text-sm ${
                          cat.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">暂无分类数据</p>
                  )}
                </div>
              </div>

              {/* 诊断建议 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">诊断建议</h3>
                <div className="space-y-2 text-blue-700 text-sm">
                  {results.checks.influencers === 0 && (
                    <p>• 数据库中没有达人数据，这是达人列表为空的主要原因</p>
                  )}
                  {results.checks.influencers > 0 && results.checks.approvedInfluencers === 0 && (
                    <p>• 有达人数据但都未审核，达人列表只显示已审核的达人</p>
                  )}
                  {results.checks.tasks === 0 && (
                    <p>• 数据库中没有任务数据，任务大厅会显示为空</p>
                  )}
                  {results.checks.taskCategories === 0 && (
                    <p>• 缺少任务分类数据，可能影响任务筛选功能</p>
                  )}
                  {!results.checks.testDataExists && (
                    <p>• 建议运行数据库迁移来初始化测试数据</p>
                  )}
                  {results.checks.approvedInfluencers > 0 && (
                    <p>• ✅ 有已审核的达人数据，达人列表应该可以正常显示</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              数据库连接状态: {results?.checks.connection ? '正常' : '异常'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={checkDatabaseData}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>重新检查</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
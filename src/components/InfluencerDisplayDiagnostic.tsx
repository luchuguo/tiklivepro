import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Filter,
  Bug,
  X,
  Play
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface InfluencerDisplayDiagnosticProps {
  onClose?: () => void
}

export function InfluencerDisplayDiagnostic({ onClose }: InfluencerDisplayDiagnosticProps) {
  const [loading, setLoading] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [showRawData, setShowRawData] = useState(false)
  const [debugSteps, setDebugSteps] = useState<string[]>([])

  const addDebugStep = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const debugMessage = `${timestamp}: ${message}`
    console.log('[诊断]', debugMessage)
    setDebugSteps(prev => [...prev, debugMessage])
  }

  const runDiagnostic = async () => {
    setLoading(true)
    setDiagnosticResults(null)
    setDebugSteps([])
    
    try {
      addDebugStep('开始达人列表显示问题诊断...')
      
      const results = {
        connectionTest: { success: false, error: null, details: null },
        tableStructure: { success: false, error: null, details: null },
        dataCount: { success: false, error: null, details: null },
        rlsPolicies: { success: false, error: null, details: null },
        sampleData: { success: false, error: null, details: null },
        queryTest: { success: false, error: null, details: null },
        filterTest: { success: false, error: null, details: null },
        rawData: null,
        recommendations: [] as string[]
      }

      // 1. 基础连接测试
      addDebugStep('步骤1: 测试基础数据库连接...')
      try {
        const { data: connectionData, error: connectionError } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1)

        if (connectionError) {
          results.connectionTest.error = connectionError.message
          addDebugStep(`❌ 连接测试失败: ${connectionError.message}`)
        } else {
          results.connectionTest.success = true
          addDebugStep('✅ 数据库连接正常')
        }
      } catch (error: any) {
        results.connectionTest.error = error.message
        addDebugStep(`❌ 连接测试异常: ${error.message}`)
      }

      // 2. 检查表结构
      addDebugStep('步骤2: 检查influencers表结构...')
      try {
        const { data: structureData, error: structureError } = await supabase
          .from('influencers')
          .select('id')
          .limit(1)

        if (structureError) {
          results.tableStructure.error = structureError.message
          addDebugStep(`❌ 表结构检查失败: ${structureError.message}`)
          if (structureError.message.includes('does not exist')) {
            results.recommendations.push('influencers表不存在，需要运行数据库迁移')
          }
        } else {
          results.tableStructure.success = true
          addDebugStep('✅ influencers表结构正常')
        }
      } catch (error: any) {
        results.tableStructure.error = error.message
        addDebugStep(`❌ 表结构检查异常: ${error.message}`)
      }

      // 3. 检查数据总量
      addDebugStep('步骤3: 检查数据总量...')
      try {
        const { count: totalCount, error: countError } = await supabase
          .from('influencers')
          .select('*', { count: 'exact', head: true })

        if (countError) {
          results.dataCount.error = countError.message
          addDebugStep(`❌ 数据计数失败: ${countError.message}`)
        } else {
          results.dataCount.success = true
          results.dataCount.details = { totalCount }
          addDebugStep(`✅ 数据总量: ${totalCount} 条记录`)
          
          if (totalCount === 0) {
            results.recommendations.push('数据库中没有达人记录，需要初始化测试数据')
          }
        }
      } catch (error: any) {
        results.dataCount.error = error.message
        addDebugStep(`❌ 数据计数异常: ${error.message}`)
      }

      // 4. 检查RLS策略
      addDebugStep('步骤4: 检查RLS策略和权限...')
      try {
        // 测试不同的查询条件
        const queries = [
          { name: '全部数据', query: supabase.from('influencers').select('*').limit(5) },
          { name: '已审核数据', query: supabase.from('influencers').select('*').eq('is_approved', true).limit(5) },
          { name: '活跃状态', query: supabase.from('influencers').select('*').eq('status', 'active').limit(5) },
          { name: '已审核且活跃', query: supabase.from('influencers').select('*').eq('is_approved', true).eq('status', 'active').limit(5) }
        ]

        const queryResults: any = {}
        for (const { name, query } of queries) {
          try {
            const { data, error, count } = await query
            if (error) {
              queryResults[name] = { success: false, error: error.message, count: 0 }
              addDebugStep(`❌ ${name}查询失败: ${error.message}`)
            } else {
              queryResults[name] = { success: true, count: data?.length || 0, data: data?.slice(0, 2) }
              addDebugStep(`✅ ${name}查询成功: ${data?.length || 0} 条`)
            }
          } catch (error: any) {
            queryResults[name] = { success: false, error: error.message, count: 0 }
            addDebugStep(`❌ ${name}查询异常: ${error.message}`)
          }
        }

        results.rlsPolicies.success = Object.values(queryResults).some((result: any) => result.success)
        results.rlsPolicies.details = queryResults
        
        if (!results.rlsPolicies.success) {
          results.recommendations.push('所有查询都失败，可能是RLS策略问题或权限不足')
        }
      } catch (error: any) {
        results.rlsPolicies.error = error.message
        addDebugStep(`❌ RLS策略检查异常: ${error.message}`)
      }

      // 5. 获取样本数据
      addDebugStep('步骤5: 获取样本数据进行分析...')
      try {
        const { data: sampleData, error: sampleError } = await supabase
          .from('influencers')
          .select('id, nickname, is_approved, status, followers_count, categories, user_id')
          .limit(10)

        if (sampleError) {
          results.sampleData.error = sampleError.message
          addDebugStep(`❌ 样本数据获取失败: ${sampleError.message}`)
        } else {
          results.sampleData.success = true
          results.sampleData.details = sampleData
          results.rawData = sampleData
          addDebugStep(`✅ 获取样本数据: ${sampleData?.length || 0} 条`)
          
          if (sampleData && sampleData.length > 0) {
            const approvedCount = sampleData.filter(item => item.is_approved).length
            const activeCount = sampleData.filter(item => item.status === 'active').length
            const approvedAndActiveCount = sampleData.filter(item => item.is_approved && item.status === 'active').length
            
            addDebugStep(`📊 数据分析: 总数=${sampleData.length}, 已审核=${approvedCount}, 活跃=${activeCount}, 已审核且活跃=${approvedAndActiveCount}`)
            
            if (approvedAndActiveCount === 0) {
              results.recommendations.push('没有同时满足"已审核"和"活跃状态"的达人，这可能是达人列表为空的原因')
            }
            
            // 检查数据完整性
            const missingNickname = sampleData.filter(item => !item.nickname).length
            const missingUserId = sampleData.filter(item => !item.user_id).length
            
            if (missingNickname > 0) {
              results.recommendations.push(`有 ${missingNickname} 条记录缺少昵称`)
            }
            if (missingUserId > 0) {
              results.recommendations.push(`有 ${missingUserId} 条记录缺少用户ID`)
            }
          }
        }
      } catch (error: any) {
        results.sampleData.error = error.message
        addDebugStep(`❌ 样本数据获取异常: ${error.message}`)
      }

      // 6. 模拟前端查询
      addDebugStep('步骤6: 模拟前端查询逻辑...')
      try {
        // 模拟InfluencersPage中的查询
        let query = supabase
          .from('influencers')
          .select('*')
          .order('rating', { ascending: false })
          .limit(20)

        const { data: frontendData, error: frontendError } = await query

        if (frontendError) {
          results.queryTest.error = frontendError.message
          addDebugStep(`❌ 前端查询模拟失败: ${frontendError.message}`)
        } else {
          results.queryTest.success = true
          results.queryTest.details = { count: frontendData?.length || 0, data: frontendData?.slice(0, 3) }
          addDebugStep(`✅ 前端查询模拟成功: ${frontendData?.length || 0} 条`)
          
          if (frontendData && frontendData.length === 0) {
            results.recommendations.push('前端查询返回空结果，可能是排序或筛选条件导致')
          }
        }
      } catch (error: any) {
        results.queryTest.error = error.message
        addDebugStep(`❌ 前端查询模拟异常: ${error.message}`)
      }

      // 7. 测试筛选条件
      addDebugStep('步骤7: 测试各种筛选条件...')
      try {
        const filterTests = [
          { name: '无筛选', condition: {} },
          { name: '已审核', condition: { is_approved: true } },
          { name: '活跃状态', condition: { status: 'active' } },
          { name: '有粉丝', condition: { followers_count: { gt: 0 } } }
        ]

        const filterResults: any = {}
        for (const { name, condition } of filterTests) {
          try {
            let testQuery = supabase.from('influencers').select('count')
            
            Object.entries(condition).forEach(([key, value]) => {
              if (typeof value === 'object' && 'gt' in value) {
                testQuery = testQuery.gt(key, value.gt)
              } else {
                testQuery = testQuery.eq(key, value)
              }
            })

            const { count, error } = await testQuery
            
            if (error) {
              filterResults[name] = { success: false, error: error.message, count: 0 }
            } else {
              filterResults[name] = { success: true, count: count || 0 }
            }
            addDebugStep(`📊 ${name}筛选: ${count || 0} 条`)
          } catch (error: any) {
            filterResults[name] = { success: false, error: error.message, count: 0 }
          }
        }

        results.filterTest.success = true
        results.filterTest.details = filterResults
      } catch (error: any) {
        results.filterTest.error = error.message
        addDebugStep(`❌ 筛选测试异常: ${error.message}`)
      }

      // 生成最终建议
      addDebugStep('步骤8: 生成诊断建议...')
      
      if (results.recommendations.length === 0) {
        if (results.queryTest.success && results.queryTest.details?.count > 0) {
          results.recommendations.push('数据查询正常，可能是前端显示逻辑问题')
        } else {
          results.recommendations.push('所有测试通过但无数据返回，建议检查前端组件状态管理')
        }
      }

      // 添加通用建议
      if (!results.connectionTest.success) {
        results.recommendations.push('首先解决数据库连接问题')
      }
      if (!results.tableStructure.success) {
        results.recommendations.push('运行数据库迁移创建必要的表结构')
      }
      if (results.dataCount.details?.totalCount === 0) {
        results.recommendations.push('使用"初始化测试数据"功能添加样本数据')
      }

      setDiagnosticResults(results)
      addDebugStep('✅ 诊断完成！')

    } catch (error: any) {
      addDebugStep(`❌ 诊断过程发生错误: ${error.message}`)
      setDiagnosticResults({
        error: error.message,
        recommendations: ['诊断过程中发生错误，请检查网络连接和数据库状态']
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const getStatusIcon = (success: boolean, error: string | null) => {
    if (error) return <AlertCircle className="w-5 h-5 text-red-500" />
    if (success) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <AlertCircle className="w-5 h-5 text-gray-400" />
  }

  const getStatusText = (success: boolean, error: string | null) => {
    if (error) return '失败'
    if (success) return '正常'
    return '未测试'
  }

  const getStatusColor = (success: boolean, error: string | null) => {
    if (error) return 'text-red-600'
    if (success) return 'text-green-600'
    return 'text-gray-500'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bug className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">达人列表显示问题诊断</h2>
                <p className="text-red-100 text-sm">全面诊断达人列表为空的原因</p>
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
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">正在诊断...</h3>
              <p className="text-gray-600">请稍等，正在检查各项配置和数据状态</p>
            </div>
          ) : diagnosticResults ? (
            <div className="space-y-6">
              {/* 诊断结果概览 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">数据库连接</span>
                    {getStatusIcon(diagnosticResults.connectionTest.success, diagnosticResults.connectionTest.error)}
                  </div>
                  <span className={`text-sm ${getStatusColor(diagnosticResults.connectionTest.success, diagnosticResults.connectionTest.error)}`}>
                    {getStatusText(diagnosticResults.connectionTest.success, diagnosticResults.connectionTest.error)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">表结构</span>
                    {getStatusIcon(diagnosticResults.tableStructure.success, diagnosticResults.tableStructure.error)}
                  </div>
                  <span className={`text-sm ${getStatusColor(diagnosticResults.tableStructure.success, diagnosticResults.tableStructure.error)}`}>
                    {getStatusText(diagnosticResults.tableStructure.success, diagnosticResults.tableStructure.error)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">数据总量</span>
                    {getStatusIcon(diagnosticResults.dataCount.success, diagnosticResults.dataCount.error)}
                  </div>
                  <span className={`text-sm ${getStatusColor(diagnosticResults.dataCount.success, diagnosticResults.dataCount.error)}`}>
                    {diagnosticResults.dataCount.details?.totalCount ?? 0} 条记录
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">权限策略</span>
                    {getStatusIcon(diagnosticResults.rlsPolicies.success, diagnosticResults.rlsPolicies.error)}
                  </div>
                  <span className={`text-sm ${getStatusColor(diagnosticResults.rlsPolicies.success, diagnosticResults.rlsPolicies.error)}`}>
                    {getStatusText(diagnosticResults.rlsPolicies.success, diagnosticResults.rlsPolicies.error)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">样本数据</span>
                    {getStatusIcon(diagnosticResults.sampleData.success, diagnosticResults.sampleData.error)}
                  </div>
                  <span className={`text-sm ${getStatusColor(diagnosticResults.sampleData.success, diagnosticResults.sampleData.error)}`}>
                    {diagnosticResults.sampleData.details?.length ?? 0} 条样本
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">前端查询</span>
                    {getStatusIcon(diagnosticResults.queryTest.success, diagnosticResults.queryTest.error)}
                  </div>
                  <span className={`text-sm ${getStatusColor(diagnosticResults.queryTest.success, diagnosticResults.queryTest.error)}`}>
                    {diagnosticResults.queryTest.details?.count ?? 0} 条结果
                  </span>
                </div>
              </div>

              {/* 详细分析 */}
              {diagnosticResults.rlsPolicies.details && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">查询权限分析</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(diagnosticResults.rlsPolicies.details).map(([name, result]: [string, any]) => (
                      <div key={name} className="bg-white rounded p-3 text-center">
                        <div className="text-sm font-medium text-gray-900 mb-1">{name}</div>
                        <div className={`text-lg font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.success ? result.count : '失败'}
                        </div>
                        {result.error && (
                          <div className="text-xs text-red-500 mt-1">{result.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 筛选条件测试 */}
              {diagnosticResults.filterTest.details && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">筛选条件测试</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(diagnosticResults.filterTest.details).map(([name, result]: [string, any]) => (
                      <div key={name} className="bg-white rounded p-3 text-center">
                        <div className="text-sm font-medium text-gray-900 mb-1">{name}</div>
                        <div className={`text-lg font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.success ? result.count : '失败'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 样本数据预览 */}
              {diagnosticResults.rawData && diagnosticResults.rawData.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">样本数据预览</h4>
                    <button
                      onClick={() => setShowRawData(!showRawData)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                    >
                      {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showRawData ? '隐藏' : '显示'}原始数据</span>
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-3">昵称</th>
                          <th className="text-left py-2 px-3">审核状态</th>
                          <th className="text-left py-2 px-3">活跃状态</th>
                          <th className="text-left py-2 px-3">粉丝数</th>
                          <th className="text-left py-2 px-3">分类</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnosticResults.rawData.slice(0, 5).map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="py-2 px-3 font-medium">{item.nickname || '无昵称'}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {item.is_approved ? '已审核' : '待审核'}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {item.status || '未知'}
                              </span>
                            </td>
                            <td className="py-2 px-3">{(item.followers_count || 0).toLocaleString()}</td>
                            <td className="py-2 px-3">{item.categories?.slice(0, 2).join(', ') || '无分类'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {showRawData && (
                    <div className="mt-4 bg-gray-800 rounded p-3 overflow-x-auto">
                      <pre className="text-green-400 text-xs">
                        {JSON.stringify(diagnosticResults.rawData.slice(0, 3), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* 诊断建议 */}
              <div className={`rounded-lg p-4 ${
                diagnosticResults.recommendations.length === 0 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  diagnosticResults.recommendations.length === 0 ? 'text-green-900' : 'text-amber-900'
                }`}>
                  诊断结果与建议
                </h4>
                
                {diagnosticResults.recommendations.length === 0 ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">所有检查通过，数据库配置正常！</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diagnosticResults.recommendations.map((recommendation: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-amber-600 font-bold text-sm mt-0.5">{index + 1}.</span>
                        <span className="text-amber-800 text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 调试日志 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">诊断日志</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {debugSteps.map((step, index) => (
                    <p key={index} className="text-xs text-gray-600 font-mono">{step}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">诊断失败</h3>
              <p className="text-red-500">无法完成诊断，请检查网络连接</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              达人列表显示问题专项诊断工具
            </div>
            <div className="flex space-x-3">
              <button
                onClick={runDiagnostic}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>重新诊断</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
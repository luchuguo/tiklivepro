import React, { useState, useEffect } from 'react'
import { 
  Database, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Settings, 
  Shield, 
  Users,
  Play,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Wrench,
  X
} from 'lucide-react'
import { supabase, testSupabaseConnection } from '../lib/supabase'

interface DatabaseConnectionFixerProps {
  onClose?: () => void
}

export function DatabaseConnectionFixer({ onClose }: DatabaseConnectionFixerProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [fixAttempts, setFixAttempts] = useState<string[]>([])

  const diagnosticSteps = [
    {
      id: 'connection',
      title: '基础连接测试',
      description: '测试与 Supabase 服务器的基本连接',
      icon: Database,
      color: 'blue'
    },
    {
      id: 'auth',
      title: '认证系统检查',
      description: '验证认证服务是否正常工作',
      icon: Shield,
      color: 'purple'
    },
    {
      id: 'rls',
      title: 'RLS 策略检查',
      description: '检查行级安全策略配置',
      icon: Users,
      color: 'green'
    },
    {
      id: 'data',
      title: '数据访问测试',
      description: '测试数据表的读写权限',
      icon: Settings,
      color: 'orange'
    }
  ]

  const runDiagnostics = async () => {
    setLoading(true)
    setResults(null)
    setFixAttempts([])
    
    const diagnosticResults = {
      connection: { status: 'pending', details: '', error: null },
      auth: { status: 'pending', details: '', error: null },
      rls: { status: 'pending', details: '', error: null },
      data: { status: 'pending', details: '', error: null },
      summary: { issues: [], fixes: [], recommendations: [] }
    }

    try {
      // 步骤 1: 基础连接测试
      setCurrentStep(1)
      addFixAttempt('开始基础连接测试...')
      
      try {
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        })
        
        if (response.ok) {
          diagnosticResults.connection.status = 'success'
          diagnosticResults.connection.details = `HTTP ${response.status}: 连接正常`
          addFixAttempt('✅ 基础连接测试通过')
        } else {
          diagnosticResults.connection.status = 'error'
          diagnosticResults.connection.error = `HTTP ${response.status}: ${response.statusText}`
          diagnosticResults.summary.issues.push('基础连接失败')
          addFixAttempt(`❌ 基础连接失败: HTTP ${response.status}`)
        }
      } catch (error: any) {
        diagnosticResults.connection.status = 'error'
        diagnosticResults.connection.error = error.message
        diagnosticResults.summary.issues.push('网络连接问题')
        addFixAttempt(`❌ 连接异常: ${error.message}`)
      }

      // 步骤 2: 认证系统检查
      setCurrentStep(2)
      addFixAttempt('检查认证系统...')
      
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          diagnosticResults.auth.status = 'warning'
          diagnosticResults.auth.error = sessionError.message
          addFixAttempt(`⚠️ 认证警告: ${sessionError.message}`)
        } else {
          diagnosticResults.auth.status = 'success'
          diagnosticResults.auth.details = session ? `已登录: ${session.user.email}` : '未登录（正常）'
          addFixAttempt('✅ 认证系统正常')
        }
      } catch (error: any) {
        diagnosticResults.auth.status = 'error'
        diagnosticResults.auth.error = error.message
        diagnosticResults.summary.issues.push('认证系统异常')
        addFixAttempt(`❌ 认证系统错误: ${error.message}`)
      }

      // 步骤 3: RLS 策略检查
      setCurrentStep(3)
      addFixAttempt('检查 RLS 策略...')
      
      try {
        // 测试公开访问的表
        const { data: categories, error: catError } = await supabase
          .from('task_categories')
          .select('id, name')
          .limit(1)
        
        if (catError) {
          diagnosticResults.rls.status = 'error'
          diagnosticResults.rls.error = catError.message
          diagnosticResults.summary.issues.push('RLS 策略阻止访问')
          addFixAttempt(`❌ RLS 策略错误: ${catError.message}`)
          
          // 分析具体的 RLS 错误
          if (catError.code === 'PGRST301') {
            diagnosticResults.summary.fixes.push('需要调整 RLS 策略或登录用户')
          } else if (catError.message.includes('permission denied')) {
            diagnosticResults.summary.fixes.push('数据库权限不足，需要检查 API 密钥权限')
          }
        } else {
          diagnosticResults.rls.status = 'success'
          diagnosticResults.rls.details = `找到 ${categories?.length || 0} 个分类`
          addFixAttempt('✅ RLS 策略正常')
        }
      } catch (error: any) {
        diagnosticResults.rls.status = 'error'
        diagnosticResults.rls.error = error.message
        diagnosticResults.summary.issues.push('RLS 策略检查失败')
        addFixAttempt(`❌ RLS 检查异常: ${error.message}`)
      }

      // 步骤 4: 数据访问测试
      setCurrentStep(4)
      addFixAttempt('测试数据访问...')
      
      const tableTests = [
        { name: 'user_profiles', description: '用户资料' },
        { name: 'influencers', description: '达人信息' },
        { name: 'companies', description: '企业信息' },
        { name: 'tasks', description: '任务信息' }
      ]
      
      let accessibleTables = 0
      const tableResults: any = {}
      
      for (const table of tableTests) {
        try {
          const { data, error } = await supabase
            .from(table.name)
            .select('count')
            .limit(1)
          
          if (error) {
            tableResults[table.name] = { status: 'error', error: error.message }
            addFixAttempt(`❌ ${table.description}表访问失败: ${error.message}`)
          } else {
            tableResults[table.name] = { status: 'success', data: data }
            accessibleTables++
            addFixAttempt(`✅ ${table.description}表访问正常`)
          }
        } catch (error: any) {
          tableResults[table.name] = { status: 'error', error: error.message }
          addFixAttempt(`❌ ${table.description}表访问异常: ${error.message}`)
        }
      }
      
      diagnosticResults.data.details = `${accessibleTables}/${tableTests.length} 个表可访问`
      diagnosticResults.data.status = accessibleTables > 0 ? 'success' : 'error'
      
      if (accessibleTables === 0) {
        diagnosticResults.summary.issues.push('无法访问任何数据表')
        diagnosticResults.summary.fixes.push('检查数据库迁移是否已执行')
        diagnosticResults.summary.fixes.push('验证 RLS 策略配置')
      }

      // 生成修复建议
      if (diagnosticResults.summary.issues.length === 0) {
        diagnosticResults.summary.recommendations.push('所有检查通过，数据库连接正常')
      } else {
        diagnosticResults.summary.recommendations.push('发现以下问题需要修复：')
        diagnosticResults.summary.recommendations.push(...diagnosticResults.summary.issues)
        
        // 通用修复建议
        diagnosticResults.summary.recommendations.push('建议的修复步骤：')
        diagnosticResults.summary.recommendations.push('1. 检查 Supabase 项目状态')
        diagnosticResults.summary.recommendations.push('2. 验证 API 密钥权限')
        diagnosticResults.summary.recommendations.push('3. 确认数据库迁移已执行')
        diagnosticResults.summary.recommendations.push('4. 检查 RLS 策略配置')
      }

      setResults(diagnosticResults)
      addFixAttempt('🔍 诊断完成')

    } catch (error: any) {
      addFixAttempt(`❌ 诊断过程中发生错误: ${error.message}`)
    } finally {
      setLoading(false)
      setCurrentStep(0)
    }
  }

  const addFixAttempt = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setFixAttempts(prev => [...prev, `${timestamp}: ${message}`])
  }

  const runQuickFix = async () => {
    setLoading(true)
    addFixAttempt('开始快速修复...')
    
    try {
      // 尝试重新连接
      addFixAttempt('尝试重新建立连接...')
      const connectionTest = await testSupabaseConnection()
      
      if (connectionTest.success) {
        addFixAttempt('✅ 连接修复成功')
        await runDiagnostics()
      } else {
        addFixAttempt(`❌ 连接修复失败: ${connectionTest.error}`)
        
        // 尝试其他修复方法
        addFixAttempt('尝试清除缓存...')
        
        // 清除 Supabase 客户端缓存
        try {
          await supabase.auth.signOut()
          addFixAttempt('✅ 认证缓存已清除')
        } catch (error) {
          addFixAttempt('⚠️ 清除认证缓存失败')
        }
        
        addFixAttempt('建议手动检查配置')
      }
    } catch (error: any) {
      addFixAttempt(`❌ 快速修复失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyDiagnosticReport = () => {
    const report = `
        tkgogogo.com 数据库诊断报告
生成时间: ${new Date().toLocaleString()}

=== 环境信息 ===
URL: ${import.meta.env.VITE_SUPABASE_URL ? '已配置' : '未配置'}
Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '已配置' : '未配置'}
域名: ${window.location.origin}

=== 诊断结果 ===
${results ? Object.entries(results).filter(([key]) => key !== 'summary').map(([key, value]: [string, any]) => 
  `${key}: ${value.status} - ${value.details || value.error || '无详情'}`
).join('\n') : '未运行诊断'}

=== 修复日志 ===
${fixAttempts.join('\n')}

=== 建议 ===
${results?.summary.recommendations.join('\n') || '请先运行诊断'}
    `.trim()
    
    navigator.clipboard.writeText(report).then(() => {
      alert('诊断报告已复制到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动复制')
    })
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wrench className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">数据库连接修复工具</h2>
                <p className="text-red-100 text-sm">诊断并修复数据库连接问题</p>
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
          {/* Progress */}
          {loading && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="font-medium text-blue-800">
                  {currentStep > 0 ? `正在执行步骤 ${currentStep}/4` : '准备诊断...'}
                </span>
              </div>
              
              {currentStep > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-blue-700">
                    <span>{diagnosticSteps[currentStep - 1]?.title}</span>
                    <span>{currentStep}/4</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(results).filter(([key]) => key !== 'summary').map(([key, value]: [string, any]) => {
                  const step = diagnosticSteps.find(s => s.id === key)
                  if (!step) return null
                  
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        value.status === 'success' ? 'bg-green-100' :
                        value.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {value.status === 'success' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : value.status === 'warning' ? (
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm">{step.title}</h3>
                      <p className={`text-xs mt-1 ${
                        value.status === 'success' ? 'text-green-600' :
                        value.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {value.status === 'success' ? '正常' :
                         value.status === 'warning' ? '警告' : '异常'}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              <div className={`rounded-lg p-4 ${
                results.summary.issues.length === 0 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-3">
                  {results.summary.issues.length === 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className={`font-semibold ${
                    results.summary.issues.length === 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    诊断结果
                  </h3>
                </div>
                
                <div className={`text-sm ${
                  results.summary.issues.length === 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {results.summary.issues.length === 0 ? (
                    <p>✅ 所有检查通过，数据库连接正常！</p>
                  ) : (
                    <div>
                      <p className="font-medium mb-2">发现 {results.summary.issues.length} 个问题：</p>
                      <ul className="list-disc list-inside space-y-1">
                        {results.summary.issues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Results */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">详细结果</h3>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showDetails ? '隐藏' : '显示'}详情</span>
                  </button>
                </div>
                
                {showDetails && (
                  <div className="space-y-3">
                    {Object.entries(results).filter(([key]) => key !== 'summary').map(([key, value]: [string, any]) => {
                      const step = diagnosticSteps.find(s => s.id === key)
                      if (!step) return null
                      
                      return (
                        <div key={key} className="bg-white rounded p-3 border">
                          <div className="flex items-center space-x-2 mb-2">
                            <step.icon className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-800">{step.title}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              value.status === 'success' ? 'bg-green-100 text-green-700' :
                              value.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {value.status}
                            </span>
                          </div>
                          {value.details && (
                            <p className="text-sm text-gray-600 mb-1">✅ {value.details}</p>
                          )}
                          {value.error && (
                            <p className="text-sm text-red-600">❌ {value.error}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {results.summary.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">修复建议</h3>
                  <div className="space-y-1 text-blue-700 text-sm">
                    {results.summary.recommendations.map((rec: string, index: number) => (
                      <p key={index}>{rec}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fix Attempts Log */}
          {fixAttempts.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">修复日志</h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {fixAttempts.map((attempt, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">{attempt}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {results ? (
                results.summary.issues.length === 0 ? '✅ 连接正常' : `❌ ${results.summary.issues.length} 个问题`
              ) : '等待诊断'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={runQuickFix}
                disabled={loading}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>快速修复</span>
              </button>
              <button
                onClick={copyDiagnosticReport}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>复制报告</span>
              </button>
              <button
                onClick={runDiagnostics}
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
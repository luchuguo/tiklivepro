import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Play, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Users,
  Building2,
  Calendar,
  BarChart3,
  Loader,
  X,
  Download,
  Upload
} from 'lucide-react'
import { initializeSampleData, clearSampleData, checkDataStatus } from '../lib/initializeSampleData'

interface SampleDataManagerProps {
  onClose?: () => void
}

export function SampleDataManager({ onClose }: SampleDataManagerProps) {
  const [loading, setLoading] = useState(false)
  const [operation, setOperation] = useState<'init' | 'clear' | 'check' | null>(null)
  const [result, setResult] = useState<any>(null)
  const [dataStatus, setDataStatus] = useState<any>(null)
  const [autoCheck, setAutoCheck] = useState(true)

  useEffect(() => {
    if (autoCheck) {
      handleCheckStatus()
    }
  }, [autoCheck])

  const handleInitialize = async () => {
    setLoading(true)
    setOperation('init')
    setResult(null)
    
    try {
      console.log('🚀 开始初始化测试数据...')
      const response = await initializeSampleData()
      setResult(response)
      
      if (response.success) {
        // 初始化成功后重新检查状态
        setTimeout(() => {
          handleCheckStatus()
        }, 1000)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `初始化过程中发生错误: ${error.message}`,
        error: error.message
      })
    } finally {
      setLoading(false)
      setOperation(null)
    }
  }

  const handleClear = async () => {
    if (!confirm('确定要清空所有测试数据吗？此操作不可恢复！')) {
      return
    }

    setLoading(true)
    setOperation('clear')
    setResult(null)
    
    try {
      console.log('🧹 开始清空测试数据...')
      const response = await clearSampleData()
      setResult(response)
      
      if (response.success) {
        // 清空成功后重新检查状态
        setTimeout(() => {
          handleCheckStatus()
        }, 1000)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `清空过程中发生错误: ${error.message}`,
        error: error.message
      })
    } finally {
      setLoading(false)
      setOperation(null)
    }
  }

  const handleCheckStatus = async () => {
    setLoading(true)
    setOperation('check')
    
    try {
      console.log('🔍 检查数据状态...')
      const response = await checkDataStatus()
      setDataStatus(response)
      
      if (!response.success) {
        setResult(response)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `检查过程中发生错误: ${error.message}`,
        error: error.message
      })
    } finally {
      setLoading(false)
      setOperation(null)
    }
  }

  const getOperationText = () => {
    switch (operation) {
      case 'init':
        return '正在初始化测试数据...'
      case 'clear':
        return '正在清空测试数据...'
      case 'check':
        return '正在检查数据状态...'
      default:
        return '处理中...'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">测试数据管理</h2>
                <p className="text-blue-100 text-sm">初始化、管理和清空测试样本数据</p>
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
          {/* Current Status */}
          {dataStatus && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">当前数据状态</h3>
              
              {dataStatus.success ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-900">{dataStatus.status.influencers}</div>
                    <div className="text-sm text-blue-700">达人数量</div>
                    <div className="text-xs text-blue-600 mt-1">({dataStatus.status.approvedInfluencers} 已审核)</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <Building2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900">{dataStatus.status.companies}</div>
                    <div className="text-sm text-green-700">企业数量</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-900">{dataStatus.status.tasks}</div>
                    <div className="text-sm text-purple-700">任务数量</div>
                    <div className="text-xs text-purple-600 mt-1">({dataStatus.status.openTasks} 开放)</div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-900">{dataStatus.status.applications}</div>
                    <div className="text-sm text-orange-700">申请数量</div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-800 font-medium">数据状态检查失败</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{dataStatus.message}</p>
                </div>
              )}

              {dataStatus.success && (
                <div className={`p-4 rounded-lg ${
                  dataStatus.hasData 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {dataStatus.hasData ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className={`font-medium ${
                      dataStatus.hasData ? 'text-green-800' : 'text-amber-800'
                    }`}>
                      {dataStatus.hasData ? '数据库已有测试数据' : '数据库暂无测试数据'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    dataStatus.hasData ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {dataStatus.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="font-medium text-blue-800">{getOperationText()}</span>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                请耐心等待，这可能需要几秒钟时间...
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`mb-6 p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? '操作成功' : '操作失败'}
                </span>
              </div>
              
              <p className={`text-sm mb-3 ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>

              {result.summary && (
                <p className="text-sm text-gray-600 mb-3">
                  <strong>详情:</strong> {result.summary}
                </p>
              )}

              {result.results && (
                <div className="bg-white rounded p-3 text-xs">
                  <strong>创建统计:</strong>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <span>分类: {result.results.categories}</span>
                    <span>达人: {result.results.influencers}</span>
                    <span>企业: {result.results.companies}</span>
                    <span>任务: {result.results.tasks}</span>
                    <span>申请: {result.results.applications}</span>
                    <span>直播: {result.results.liveSessions}</span>
                  </div>
                  {result.results.errors.length > 0 && (
                    <div className="mt-2 text-red-600">
                      <strong>错误 ({result.results.errors.length}):</strong>
                      <div className="max-h-20 overflow-y-auto">
                        {result.results.errors.map((error: string, index: number) => (
                          <div key={index} className="text-xs">{error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">操作选项</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Initialize Data */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">初始化测试数据</h4>
                    <p className="text-sm text-gray-600">创建完整的测试样本数据</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  包含: 8个分类、5个达人、3个企业、5个任务、多个申请和直播记录
                </div>
                <button
                  onClick={handleInitialize}
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>初始化数据</span>
                </button>
              </div>

              {/* Check Status */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">检查数据状态</h4>
                    <p className="text-sm text-gray-600">查看当前数据库状态</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  统计各表数据量，检查数据完整性
                </div>
                <button
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>检查状态</span>
                </button>
              </div>

              {/* Clear Data */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">清空测试数据</h4>
                    <p className="text-sm text-gray-600">删除所有测试数据</p>
                  </div>
                </div>
                <div className="text-xs text-red-500 mb-3">
                  ⚠️ 此操作不可恢复，请谨慎使用
                </div>
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>清空数据</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">使用说明</h4>
            <div className="text-blue-800 text-sm space-y-1">
              <p>• <strong>初始化测试数据:</strong> 创建完整的测试环境，包括达人、企业、任务等数据</p>
              <p>• <strong>检查数据状态:</strong> 查看当前数据库中各类数据的数量和状态</p>
              <p>• <strong>清空测试数据:</strong> 删除所有测试数据，恢复到初始状态</p>
              <p>• 建议在开发和测试时使用，生产环境请谨慎操作</p>
            </div>
          </div>

          {/* Sample Data Preview */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">测试数据预览</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">达人数据</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• 美妆小仙女 (15万粉丝)</li>
                  <li>• 时尚达人Lisa (28万粉丝)</li>
                  <li>• 美食探店王 (9.5万粉丝)</li>
                  <li>• 科技极客小明 (18万粉丝)</li>
                  <li>• 健身女神Amy (22万粉丝)</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">企业数据</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• 美丽佳人化妆品有限公司</li>
                  <li>• 潮流时尚服饰集团</li>
                  <li>• 智能科技有限公司</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">任务数据</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• 新品口红直播推广</li>
                  <li>• 护肤套装春季促销</li>
                  <li>• 夏季新款连衣裙直播</li>
                  <li>• 智能手表新品发布</li>
                  <li>• 运动鞋品牌合作</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">其他数据</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• 8个任务分类</li>
                  <li>• 多个任务申请记录</li>
                  <li>• 1个完成的直播记录</li>
                  <li>• 1个评价记录</li>
                  <li>• 系统统计数据</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              测试数据管理工具 - 用于开发和测试环境
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCheckStatus}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>刷新状态</span>
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
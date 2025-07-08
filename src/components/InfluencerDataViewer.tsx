import React, { useState, useEffect } from 'react'
import { 
  Database, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  X,
  Copy,
  Download
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export function InfluencerDataViewer() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    fetchInfluencerData()
  }, [])

  const fetchInfluencerData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('开始获取 influencers 表数据...')
      
      // 直接查询所有数据，不添加任何筛选条件
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
      
      if (error) {
        console.error('获取数据失败:', error)
        setError(`获取数据失败: ${error.message}`)
        return
      }
      
      console.log(`成功获取 ${data?.length || 0} 条记录`)
      setData(data || [])
      
    } catch (error: any) {
      console.error('查询过程中发生错误:', error)
      setError(`查询错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('数据已复制到剪贴板'))
      .catch(err => alert('复制失败: ' + err))
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Influencers 表数据查看器</h2>
                <p className="text-blue-100 text-sm">直接查看数据库中的达人记录</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">加载中...</h3>
              <p className="text-gray-600">正在从数据库获取达人数据</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">查询失败</h3>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchInfluencerData}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                重试
              </button>
            </div>
          ) : data.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">
                  共 {data.length} 条记录
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制数据</span>
                  </button>
                  <button
                    onClick={fetchInfluencerData}
                    className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>刷新</span>
                  </button>
                </div>
              </div>

              {/* 数据表格 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(data[0]).map(key => (
                        <th 
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.entries(item).map(([key, value]) => (
                          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Array.isArray(value) 
                              ? JSON.stringify(value)
                              : typeof value === 'object' && value !== null
                                ? JSON.stringify(value)
                                : String(value || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 数据统计 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">数据统计</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded p-3">
                    <div className="text-sm text-gray-600">已审核达人</div>
                    <div className="text-xl font-bold text-blue-600">
                      {data.filter(item => item.is_approved).length}
                    </div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-sm text-gray-600">活跃达人</div>
                    <div className="text-xl font-bold text-green-600">
                      {data.filter(item => item.status === 'active').length}
                    </div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-sm text-gray-600">已认证达人</div>
                    <div className="text-xl font-bold text-purple-600">
                      {data.filter(item => item.is_verified).length}
                    </div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-sm text-gray-600">平均粉丝数</div>
                    <div className="text-xl font-bold text-orange-600">
                      {Math.round(data.reduce((sum, item) => sum + (item.followers_count || 0), 0) / data.length).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">没有数据</h3>
              <p className="text-gray-500 mb-4">
                数据库中没有达人记录，请先初始化测试数据
              </p>
              <button
                onClick={fetchInfluencerData}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                重新检查
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              数据库直接查询结果 - 不受前端筛选条件影响
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
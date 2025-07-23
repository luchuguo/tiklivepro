import React, { useState, useEffect } from 'react'
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Plus,
  ExternalLink,
  Copy
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export function StorageManager() {
  const [loading, setLoading] = useState(true)
  const [buckets, setBuckets] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    checkStorageStatus()
  }, [])

  const checkStorageStatus = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)
    
    try {
      console.log('检查存储桶状态...')
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('获取存储桶失败:', error)
        setError(`获取存储桶失败: ${error.message}`)
        return
      }
      
      console.log('存储桶列表:', data)
      setBuckets(data || [])
      
    } catch (err: any) {
      console.error('存储状态检查异常:', err)
      setError(`检查异常: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createBuckets = async () => {
    setCreating(true)
    setTestResult(null)
    
    try {
      // 创建达人头像存储桶
      console.log('创建 influencer-avatars 存储桶...')
      const { error: influencerError } = await supabase.storage.createBucket('influencer-avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      })
      
      // 创建企业Logo存储桶
      console.log('创建 company-logos 存储桶...')
      const { error: companyError } = await supabase.storage.createBucket('company-logos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      })
      
      if (influencerError || companyError) {
        setTestResult(`❌ 创建存储桶失败: ${influencerError?.message || companyError?.message}`)
      } else {
        setTestResult('✅ 存储桶创建成功！请刷新页面查看状态')
        // 延迟刷新状态
        setTimeout(() => {
          checkStorageStatus()
        }, 1000)
      }

    } catch (error: any) {
      console.error('创建存储桶时发生错误:', error)
      setTestResult(`❌ 创建存储桶失败: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动复制')
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">存储服务管理</h3>
        </div>
        <button
          onClick={checkStorageStatus}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center space-x-2 text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>检查中...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {/* 存储桶列表 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">可用存储桶</h4>
            {buckets.length === 0 ? (
              <div className="text-amber-600 text-sm">⚠️ 没有找到任何存储桶</div>
            ) : (
              <div className="space-y-2">
                {buckets.map((bucket) => (
                  <div key={bucket.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-mono text-sm">{bucket.name}</span>
                      {bucket.public && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">公开</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bucket.file_size_limit ? `${Math.round(bucket.file_size_limit / 1024 / 1024)}MB` : '无限制'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="space-y-2">
            {buckets.length === 0 && (
              <button
                onClick={createBuckets}
                disabled={creating}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>创建中...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>自动创建存储桶</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {testResult && (
            <div className="p-3 bg-gray-50 rounded text-sm">
              {testResult}
            </div>
          )}

          {/* 配置指南 */}
          {buckets.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-3 flex items-center space-x-2">
                <span>配置指南</span>
              </h4>
              <div className="text-sm text-amber-700 space-y-3">
                <div>
                  <p className="font-medium mb-2">方法1: 自动创建（推荐）</p>
                  <p>点击上方"自动创建存储桶"按钮，系统将自动创建所需的存储桶。</p>
                </div>
                
                <div>
                  <p className="font-medium mb-2">方法2: 手动创建</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <a 
                        href="https://supabase.com/dashboard" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>打开 Supabase Dashboard</span>
                      </a>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>选择您的项目</li>
                      <li>点击左侧菜单的 "Storage"</li>
                      <li>点击 "New bucket" 按钮</li>
                      <li>创建以下存储桶：</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-amber-100 p-3 rounded">
                  <p className="font-medium mb-2">需要创建的存储桶：</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="bg-white px-2 py-1 rounded text-xs">influencer-avatars</code>
                      <button
                        onClick={() => copyToClipboard('influencer-avatars')}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="bg-white px-2 py-1 rounded text-xs">company-logos</code>
                      <button
                        onClick={() => copyToClipboard('company-logos')}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs mt-2">配置：公开存储桶，5MB文件限制，仅允许图片文件</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
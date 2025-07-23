import React, { useState } from 'react'
import { 
  Database, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  Settings
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export function StorageBucketCreator() {
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const createBuckets = async () => {
    setCreating(true)
    setResult(null)
    
    const results = []
    
    try {
      // 创建达人头像存储桶
      console.log('创建 influencer-avatars 存储桶...')
      const { error: influencerError } = await supabase.storage.createBucket('influencer-avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      })
      
      if (influencerError) {
        results.push({
          bucket: 'influencer-avatars',
          success: false,
          error: influencerError.message
        })
      } else {
        results.push({
          bucket: 'influencer-avatars',
          success: true
        })
      }

      // 创建企业Logo存储桶
      console.log('创建 company-logos 存储桶...')
      const { error: companyError } = await supabase.storage.createBucket('company-logos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      })
      
      if (companyError) {
        results.push({
          bucket: 'company-logos',
          success: false,
          error: companyError.message
        })
      } else {
        results.push({
          bucket: 'company-logos',
          success: true
        })
      }

      // 分析结果
      const successCount = results.filter(r => r.success).length
      const totalCount = results.length
      
      if (successCount === totalCount) {
        setResult({
          success: true,
          message: `✅ 成功创建 ${successCount}/${totalCount} 个存储桶`,
          details: results
        })
      } else {
        setResult({
          success: false,
          message: `⚠️ 部分成功：${successCount}/${totalCount} 个存储桶创建成功`,
          details: results
        })
      }

    } catch (error: any) {
      console.error('创建存储桶时发生错误:', error)
      setResult({
        success: false,
        message: `❌ 创建存储桶失败: ${error.message}`,
        details: error
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Database className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">自动创建存储桶</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">将要创建的存储桶：</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span><code className="bg-blue-100 px-1 rounded">influencer-avatars</code> - 达人头像存储</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span><code className="bg-blue-100 px-1 rounded">company-logos</code> - 企业Logo存储</span>
            </li>
          </ul>
          <div className="mt-3 text-xs text-blue-700">
            <p>配置：公开存储桶，5MB文件限制，仅允许图片文件</p>
          </div>
        </div>

        <button
          onClick={createBuckets}
          disabled={creating}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>创建中...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>创建存储桶</span>
            </>
          )}
        </button>

        {result && (
          <div className={`border rounded-lg p-4 ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-green-800' : 'text-amber-800'
              }`}>
                {result.message}
              </span>
            </div>
            
            {result.details && Array.isArray(result.details) && (
              <div className="space-y-2 text-sm">
                {result.details.map((detail: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    {detail.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={detail.success ? 'text-green-700' : 'text-red-700'}>
                      {detail.bucket}: {detail.success ? '成功' : detail.error}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 提示：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>需要管理员权限才能创建存储桶</li>
            <li>如果创建失败，请手动在 Supabase Dashboard 中创建</li>
            <li>创建完成后，头像上传功能将正常工作</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
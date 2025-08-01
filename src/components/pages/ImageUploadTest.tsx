import React, { useState, useRef } from 'react'
import { Upload, Image, Copy, CheckCircle, XCircle, Loader, Trash2, ExternalLink } from 'lucide-react'

export function ImageUploadTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // PICUI API配置
  const API_BASE_URL = 'https://picui.cn/api/v1'
  const API_KEY = import.meta.env.VITE_PICUI_API_KEY as string

  // 验证API密钥是否配置
  if (!API_KEY) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">配置错误</h2>
          <p className="text-gray-600 mb-4">PICUI API密钥未配置，请在环境变量中设置 VITE_PICUI_API_KEY</p>
          <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700">
            <p>在 env.local 文件中添加：</p>
            <code className="block mt-2 bg-gray-200 p-2 rounded">VITE_PICUI_API_KEY=your_api_key_here</code>
          </div>
        </div>
      </div>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }
      // 检查文件大小 (限制为10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过10MB')
        return
      }
      setSelectedFile(file)
      setError('')
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('请先选择图片文件')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('permission', '1') // 公开权限

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        },
        body: formData
      })

      const result = await response.json()

      if (result.status) {
        setUploadResult(result.data)
        setError('')
      } else {
        setError(result.message || '上传失败')
        setUploadResult(null)
      }
    } catch (err) {
      console.error('上传错误:', err)
      setError('网络错误，请重试')
      setUploadResult(null)
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setError('')
      setUploadResult(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">图片上传测试</h1>
          <p className="text-lg text-gray-600">使用PICUI图床API测试图片上传功能</p>
        </div>

        {/* 上传区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">选择图片</h2>
          
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              selectedFile 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 hover:border-pink-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              拖拽图片到此处，或点击选择文件
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              选择图片
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 选中的文件信息 */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Image className="w-8 h-8 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* 上传按钮 */}
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>上传中...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>开始上传</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 上传结果 */}
        {uploadResult && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">上传成功</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 图片预览 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">图片预览</h3>
                <div className="relative">
                  <img
                    src={uploadResult.links.url}
                    alt={uploadResult.name}
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {uploadResult.width} × {uploadResult.height}
                  </div>
                </div>
              </div>

              {/* 链接信息 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">链接信息</h3>
                <div className="space-y-4">
                  {/* 直接链接 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      直接链接
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={uploadResult.links.url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(uploadResult.links.url, 'url')}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {copied === 'url' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Markdown链接 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Markdown链接
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={uploadResult.links.markdown}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(uploadResult.links.markdown, 'markdown')}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {copied === 'markdown' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* HTML链接 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML链接
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={uploadResult.links.html}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(uploadResult.links.html, 'html')}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {copied === 'html' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 缩略图链接 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      缩略图链接
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={uploadResult.links.thumbnail_url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(uploadResult.links.thumbnail_url, 'thumbnail')}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {copied === 'thumbnail' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 图片信息 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">图片信息</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>文件名: {uploadResult.name}</div>
                    <div>大小: {(uploadResult.size / 1024).toFixed(2)} KB</div>
                    <div>类型: {uploadResult.mimetype}</div>
                    <div>扩展名: {uploadResult.extension}</div>
                    <div>MD5: {uploadResult.md5}</div>
                    <div>SHA1: {uploadResult.sha1}</div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="mt-6 flex space-x-4">
                  <a
                    href={uploadResult.links.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>查看原图</span>
                  </a>
                  <a
                    href={uploadResult.links.delete_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>删除图片</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
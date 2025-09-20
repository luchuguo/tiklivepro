import React, { useState, useEffect } from 'react'
import { 
  Database, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Key,
  Globe,
  FileText,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

export function SupabaseSetupGuide() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showEnvExample, setShowEnvExample] = useState(false)
  const [envValues, setEnvValues] = useState({
    url: '',
    key: ''
  })

  const steps = [
    {
      id: 1,
      title: '创建 Supabase 项目',
      description: '在 Supabase 官网创建新项目',
      icon: Database,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 2,
      title: '获取项目配置',
      description: '从项目设置中获取 URL 和 API Key',
      icon: Key,
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 3,
      title: '配置环境变量',
      description: '创建 .env 文件并添加配置',
      icon: FileText,
      color: 'from-pink-500 to-red-600'
    },
    {
      id: 4,
      title: '重启开发服务器',
      description: '重启服务器使配置生效',
      icon: RefreshCw,
      color: 'from-green-500 to-blue-600'
    }
  ]

  const checkCurrentConfig = () => {
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
    const isValidUrl = hasUrl && import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url'
    const isValidKey = hasKey && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
    
    return {
      hasUrl,
      hasKey,
      isValidUrl,
      isValidKey,
      isConfigured: isValidUrl && isValidKey
    }
  }

  const config = checkCurrentConfig()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动复制')
    })
  }

  const handleEnvValueChange = (field: 'url' | 'key', value: string) => {
    setEnvValues(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateEnvFile = () => {
    return `# Supabase 配置
VITE_SUPABASE_URL=${envValues.url || 'https://your-project-id.supabase.co'}
VITE_SUPABASE_ANON_KEY=${envValues.key || 'your-anon-key-here'}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase 配置指南</h1>
          <p className="text-gray-600">按照以下步骤配置您的 Supabase 数据库连接</p>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">当前配置状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              {config.isValidUrl ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm">
                Supabase URL: {config.isValidUrl ? '已配置' : '未配置'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {config.isValidKey ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm">
                API Key: {config.isValidKey ? '已配置' : '未配置'}
              </span>
            </div>
          </div>
          
          {config.isConfigured ? (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">配置完成！</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                您的 Supabase 配置已正确设置，可以开始使用数据库功能了。
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800 font-medium">需要配置</span>
              </div>
              <p className="text-amber-700 text-sm mt-1">
                请按照下面的步骤完成 Supabase 配置。
              </p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-300">
                    {step.id}
                  </div>
                </div>

                {/* Step Content */}
                {step.id === 1 && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">操作步骤：</h4>
                      <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                        <li>访问 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase 官网</a></li>
                        <li>点击 "Start your project" 或 "Sign up"</li>
                        <li>使用 GitHub 或邮箱注册账号</li>
                        <li>点击 "New project" 创建新项目</li>
                        <li>登录 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">Supabase</a></li>
                        <li>选择组织，输入项目名称（如：tkbubu）</li>
                        <li>选择地区（建议选择距离用户较近的区域）</li>
                        <li>点击 "Create new project"</li>
                      </ol>
                    </div>
                    <div className="flex space-x-3">
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>打开 Supabase Dashboard</span>
                      </a>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        下一步
                      </button>
                    </div>
                  </div>
                )}

                {step.id === 2 && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">获取配置信息：</h4>
                      <ol className="list-decimal list-inside space-y-2 text-purple-800 text-sm">
                        <li>在 Supabase Dashboard 中选择您的项目</li>
                        <li>点击左侧菜单的 "Settings"（设置）</li>
                        <li>点击 "API" 选项卡</li>
                        <li>找到 "Project URL" - 这是您的 VITE_SUPABASE_URL</li>
                        <li>找到 "anon public" key - 这是您的 VITE_SUPABASE_ANON_KEY</li>
                        <li>点击复制按钮复制这两个值</li>
                      </ol>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://your-project-id.supabase.co"
                          value={envValues.url}
                          onChange={(e) => handleEnvValueChange('url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Anon Key
                        </label>
                        <input
                          type="text"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={envValues.key}
                          onChange={(e) => handleEnvValueChange('key', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>打开项目设置</span>
                      </a>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        下一步
                      </button>
                    </div>
                  </div>
                )}

                {step.id === 3 && (
                  <div className="space-y-4">
                    <div className="bg-pink-50 rounded-lg p-4">
                      <h4 className="font-medium text-pink-900 mb-2">创建环境变量文件：</h4>
                      <ol className="list-decimal list-inside space-y-2 text-pink-800 text-sm">
                        <li>在项目根目录创建 <code className="bg-pink-100 px-1 rounded">.env</code> 文件</li>
                        <li>复制下面的内容到 .env 文件中</li>
                        <li>将占位符替换为您从 Supabase 获取的实际值</li>
                        <li>保存文件</li>
                      </ol>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm font-medium">.env 文件内容</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowEnvExample(!showEnvExample)}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            {showEnvExample ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(generateEnvFile())}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <pre className="text-green-400 text-sm overflow-x-auto">
                        <code>{generateEnvFile()}</code>
                      </pre>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800 mb-1">重要提示</h4>
                          <ul className="text-amber-700 text-sm space-y-1">
                            <li>• .env 文件应该放在项目根目录（与 package.json 同级）</li>
                            <li>• 不要将 .env 文件提交到 Git 仓库</li>
                            <li>• 确保替换所有占位符为实际值</li>
                            <li>• URL 应该以 https:// 开头</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentStep(4)}
                      className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors flex items-center space-x-2"
                    >
                      <span>下一步</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {step.id === 4 && (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">重启开发服务器：</h4>
                      <ol className="list-decimal list-inside space-y-2 text-green-800 text-sm">
                        <li>停止当前运行的开发服务器（Ctrl+C 或 Cmd+C）</li>
                        <li>重新运行 <code className="bg-green-100 px-1 rounded">npm run dev</code></li>
                        <li>等待服务器启动完成</li>
                        <li>刷新浏览器页面</li>
                        <li>检查连接状态是否变为绿色</li>
                      </ol>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm font-medium">终端命令</span>
                        <button
                          onClick={() => copyToClipboard('npm run dev')}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <pre className="text-green-400 text-sm">
                        <code>npm run dev</code>
                      </pre>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 mb-1">完成配置</h4>
                          <p className="text-blue-700 text-sm">
                            重启服务器后，您应该能看到数据库连接状态变为绿色，
                            达人列表和任务大厅也会显示测试数据。
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => window.location.reload()}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>刷新页面检查状态</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速链接</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Database className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Supabase Dashboard</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <a
              href="https://supabase.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Supabase 文档</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">返回首页</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
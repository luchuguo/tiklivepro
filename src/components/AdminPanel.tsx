import React, { useState } from 'react'
import { 
  Settings, 
  Users, 
  Calendar, 
  BarChart3, 
  Database, 
  Shield,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function AdminPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const { user, isAdmin } = useAuth()

  if (!user) return null

  const adminTabs = [
    { id: 'overview', name: '概览', icon: BarChart3 },
    { id: 'users', name: '用户管理', icon: Users },
    { id: 'tasks', name: '任务管理', icon: Calendar },
    { id: 'data', name: '数据管理', icon: Database },
    { id: 'settings', name: '系统设置', icon: Settings },
  ]

  const quickActions = [
    { name: '添加测试达人', action: 'add-influencer', icon: Plus, color: 'bg-blue-500' },
    { name: '添加测试任务', action: 'add-task', icon: Plus, color: 'bg-green-500' },
    { name: '查看数据库', action: 'view-db', icon: Eye, color: 'bg-purple-500' },
    { name: '清空数据', action: 'clear-data', icon: Trash2, color: 'bg-red-500' },
  ]

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-influencer':
        console.log('添加测试达人')
        // 这里可以调用API添加测试达人
        break
      case 'add-task':
        console.log('添加测试任务')
        // 这里可以调用API添加测试任务
        break
      case 'view-db':
        console.log('查看数据库')
        // 这里可以打开数据库查看界面
        break
      case 'clear-data':
        if (confirm('确定要清空所有测试数据吗？此操作不可恢复！')) {
          console.log('清空数据')
          // 这里可以调用API清空数据
        }
        break
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-2xl border-t border-gray-700">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-yellow-400" />
          <span className="font-medium">
            {isAdmin ? '管理员面板' : '开发者工具'} 
            <span className="text-xs text-gray-400 ml-2">
              ({user.email})
            </span>
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronUp className="w-5 h-5" />
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border-t border-gray-700">
          {/* Tabs */}
          <div className="flex items-center space-x-1 px-4 py-2 bg-gray-800">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">系统概览</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">5</div>
                    <div className="text-sm text-gray-400">达人数量</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">3</div>
                    <div className="text-sm text-gray-400">企业数量</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400">5</div>
                    <div className="text-sm text-gray-400">任务数量</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-400">6</div>
                    <div className="text-sm text-gray-400">申请数量</div>
                  </div>
                </div>
                
                <h4 className="text-md font-semibold mb-3">快速操作</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action)}
                      className={`${action.color} hover:opacity-80 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-opacity`}
                    >
                      <action.icon className="w-4 h-4" />
                      <span>{action.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">用户管理</h3>
                <div className="space-y-2">
                  <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">美妆小仙女</div>
                      <div className="text-sm text-gray-400">达人 • 15万粉丝</div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">时尚达人Lisa</div>
                      <div className="text-sm text-gray-400">达人 • 28万粉丝</div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">美丽佳人化妆品</div>
                      <div className="text-sm text-gray-400">企业 • 已认证</div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">任务管理</h3>
                <div className="space-y-2">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">新品口红直播推广</div>
                      <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">进行中</span>
                    </div>
                    <div className="text-sm text-gray-400">预算: ¥5,000 - ¥8,000 • 2个申请</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">夏季新款连衣裙直播</div>
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">已完成</span>
                    </div>
                    <div className="text-sm text-gray-400">预算: ¥6,000 - ¥10,000 • 3个申请</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">智能手表新品发布</div>
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded-full text-xs">待开始</span>
                    </div>
                    <div className="text-sm text-gray-400">预算: ¥10,000 - ¥15,000 • 1个申请</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">数据管理</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm transition-colors">
                    导出用户数据
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm transition-colors">
                    导出任务数据
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm transition-colors">
                    生成测试数据
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm transition-colors">
                    重置数据库
                  </button>
                </div>
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">数据库状态</div>
                  <div className="text-green-400 text-sm">✓ 连接正常</div>
                  <div className="text-green-400 text-sm">✓ 测试数据已加载</div>
                  <div className="text-yellow-400 text-sm">⚠ 使用模拟外键</div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">系统设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">调试模式</span>
                    <button className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                      已启用
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">测试数据</span>
                    <button className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                      已加载
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">管理员权限</span>
                    <button className={`${isAdmin ? 'bg-green-600' : 'bg-gray-600'} text-white px-3 py-1 rounded-full text-xs`}>
                      {isAdmin ? '已启用' : '未启用'}
                    </button>
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm w-full transition-colors">
                      打开完整管理后台
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Star, 
  MapPin, 
  Eye, 
  Filter, 
  Search, 
  TrendingUp,
  Video,
  Heart,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Database,
  Settings,
  Play,
  Wrench,
  Bug
} from 'lucide-react'
import { supabase, Influencer, testSupabaseConnection } from '../../lib/supabase'
import { DatabaseStatus } from '../DatabaseStatus'
import { DatabaseDataChecker } from '../DatabaseDataChecker'
import { DatabaseConnectionFixer } from '../DatabaseConnectionFixer'
import { SampleDataManager } from '../SampleDataManager'
import { InfluencerDisplayDiagnostic } from '../InfluencerDisplayDiagnostic'
import { InfluencerDetailPage } from './InfluencerDetailPage'

export function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [showDatabaseStatus, setShowDatabaseStatus] = useState(false)
  const [showDataChecker, setShowDataChecker] = useState(false)
  const [showConnectionFixer, setShowConnectionFixer] = useState(false)
  const [showSampleDataManager, setShowSampleDataManager] = useState(false)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'good' | 'poor' | 'failed'>('unknown')

  const categories = [
    { id: 'all', name: '全部分类' },
    { id: '美妆护肤', name: '美妆护肤' },
    { id: '时尚穿搭', name: '时尚穿搭' },
    { id: '美食生活', name: '美食生活' },
    { id: '数码科技', name: '数码科技' },
    { id: '健身运动', name: '健身运动' },
    { id: '母婴用品', name: '母婴用品' },
    { id: '家居家装', name: '家居家装' },
    { id: '图书教育', name: '图书教育' }
  ]

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const debugMessage = `${timestamp}: ${message}`
    console.log('[InfluencersPage]', debugMessage)
    setDebugInfo(prev => [...prev.slice(-9), debugMessage])
  }

  useEffect(() => {
    // 页面加载时先检查连接状态
    checkConnectionStatus()
    fetchInfluencers()
  }, [selectedCategory, sortBy])

  const checkConnectionStatus = async () => {
    try {
      const result = await testSupabaseConnection()
      if (result.success) {
        const passedTests = result.details?.testResults 
          ? Object.values(result.details.testResults).filter(Boolean).length 
          : 0
        const totalTests = result.details?.testResults 
          ? Object.keys(result.details.testResults).length 
          : 5
        
        if (passedTests >= 4) {
          setConnectionStatus('good')
        } else if (passedTests >= 2) {
          setConnectionStatus('poor')
        } else {
          setConnectionStatus('failed')
        }
      } else {
        setConnectionStatus('failed')
      }
    } catch (error) {
      setConnectionStatus('failed')
    }
  }

  const fetchInfluencers = async () => {
    try {
      setLoading(true)
      setError(null)
      setDebugInfo([])
      
      addDebugInfo('开始获取达人数据...')
      addDebugInfo(`筛选条件: 分类=${selectedCategory}, 排序=${sortBy}`)
      
      // 首先测试基本连接
      addDebugInfo('测试数据库连接...')
      const connectionTest = await testSupabaseConnection()
      
      if (!connectionTest.success) {
        addDebugInfo(`连接测试失败: ${connectionTest.error}`)
        setError(`数据库连接失败: ${connectionTest.error}`)
        setConnectionStatus('failed')
        return
      }
      
      addDebugInfo('数据库连接正常')
      
      // 构建查询 - 使用简化的查询方式，避免复杂的超时控制
      addDebugInfo('构建基础查询...')
      
      let query = supabase
        .from('influencers')
        .select('*')
      
      // 分类筛选
      if (selectedCategory !== 'all') {
        addDebugInfo(`添加分类筛选: ${selectedCategory}`)
        query = query.contains('categories', [selectedCategory])
      }

      // 排序
      switch (sortBy) {
        case 'rating':
          addDebugInfo('按评分排序')
          query = query.order('rating', { ascending: false })
          break
        case 'followers':
          addDebugInfo('按粉丝数排序')
          query = query.order('followers_count', { ascending: false })
          break
        case 'price':
          addDebugInfo('按价格排序')
          query = query.order('hourly_rate', { ascending: true })
          break
        case 'experience':
          addDebugInfo('按经验排序')
          query = query.order('experience_years', { ascending: false })
          break
        default:
          addDebugInfo('按创建时间排序')
          query = query.order('created_at', { ascending: false })
      }

      // 执行查询 - 使用Promise.race来实现超时控制
      addDebugInfo('执行数据库查询...')
      
      const queryPromise = query.limit(50)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('查询超时')), 15000) // 15秒超时
      })
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      addDebugInfo(`查询完成: 数据=${data?.length || 0}条, 错误=${error ? 'YES' : 'NO'}`)

      if (error) {
        addDebugInfo(`查询错误详情: ${JSON.stringify(error)}`)
        console.error('获取达人数据失败:', error)
        
        // 分析错误类型并提供解决方案
        let errorMessage = '获取达人数据失败'
        let suggestions: string[] = []
        
        if (error.code === 'PGRST301') {
          errorMessage = '权限不足：无法访问达人数据'
          suggestions = [
            '检查 RLS 策略配置',
            '确认 API 密钥权限',
            '联系管理员检查数据库权限'
          ]
        } else if (error.code === 'PGRST116') {
          errorMessage = '未找到数据：达人表可能为空'
          suggestions = [
            '检查数据库迁移是否已执行',
            '确认测试数据是否已导入',
            '联系管理员检查数据状态'
          ]
        } else if (error.message?.includes('permission denied')) {
          errorMessage = '权限被拒绝：请检查数据库访问权限'
          suggestions = [
            '检查用户登录状态',
            '确认 RLS 策略配置',
            '联系技术支持'
          ]
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          errorMessage = '数据表不存在：数据库可能未正确初始化'
          suggestions = [
            '检查数据库迁移状态',
            '确认 Supabase 项目配置',
            '联系技术支持重新初始化数据库'
          ]
        } else {
          errorMessage = `数据库查询失败: ${error.message}`
          suggestions = [
            '检查网络连接',
            '刷新页面重试',
            '检查 Supabase 服务状态',
            '联系技术支持'
          ]
        }
        
        setError(errorMessage)
        addDebugInfo(`错误分析: ${errorMessage}`)
        suggestions.forEach(suggestion => addDebugInfo(`建议: ${suggestion}`))
        return
      }
      
      if (!data) {
        addDebugInfo('查询返回空数据')
        setInfluencers([])
        setError('查询返回空数据，可能是数据库中没有达人记录')
        return
      }

      addDebugInfo(`成功获取 ${data.length} 个达人记录`)
      
      // 验证数据结构
      if (data.length > 0) {
        const firstInfluencer = data[0]
        addDebugInfo(`第一个达人数据: ${firstInfluencer.nickname || '无昵称'}, 状态: ${firstInfluencer.status || '无状态'}`)
        addDebugInfo(`审核状态: ${firstInfluencer.is_approved ? '已审核' : '未审核'}`)
        
        // 检查数据完整性
        const requiredFields = ['id', 'nickname', 'followers_count', 'hourly_rate']
        const missingFields = requiredFields.filter(field => !firstInfluencer[field])
        if (missingFields.length > 0) {
          addDebugInfo(`数据完整性警告: 缺少字段 ${missingFields.join(', ')}`)
        }
      }
      
      setInfluencers(data || [])
      addDebugInfo(`达人列表更新完成，共 ${data.length} 条记录`)
      setConnectionStatus('good')
      
    } catch (error: any) {
      addDebugInfo(`获取达人数据异常: ${error.message}`)
      console.error('Error fetching influencers:', error)
      
      let errorMessage = '获取达人数据时发生错误'
      if (error.message?.includes('fetch')) {
        errorMessage = '网络连接错误，请检查网络连接'
      } else if (error.message?.includes('timeout') || error.message?.includes('超时')) {
        errorMessage = '请求超时，请重试'
      }
      
      setError(errorMessage)
      setConnectionStatus('failed')
    } finally {
      setLoading(false)
      addDebugInfo('数据获取流程结束')
    }
  }

  // 测试数据库中的原始数据
  const testRawData = async () => {
    try {
      addDebugInfo('开始测试原始数据...')
      
      // 测试1: 检查表是否存在
      const { data: tableTest, error: tableError } = await supabase
        .from('influencers')
        .select('count')
      
      if (tableError) {
        addDebugInfo(`表测试失败: ${tableError.message}`)
        return
      }
      
      addDebugInfo('influencers表存在')
      
      // 测试2: 获取总记录数
      const { count, error: countError } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        addDebugInfo(`计数查询失败: ${countError.message}`)
      } else {
        addDebugInfo(`数据库中总共有 ${count} 条达人记录`)
      }
      
      // 测试3: 获取前5条原始数据
      const { data: rawData, error: rawError } = await supabase
        .from('influencers')
        .select('id, nickname, status, is_approved, categories')
        .limit(5)
      
      if (rawError) {
        addDebugInfo(`原始数据查询失败: ${rawError.message}`)
      } else {
        addDebugInfo(`原始数据样本 (${rawData?.length || 0}条):`)
        rawData?.forEach((item, index) => {
          addDebugInfo(`${index + 1}. ${item.nickname} - 状态:${item.status} - 审核:${item.is_approved ? '是' : '否'}`)
        })
      }
      
      // 测试4: 检查RLS策略
      addDebugInfo('测试RLS策略...')
      const { data: rlsTest, error: rlsError } = await supabase
        .from('influencers')
        .select('id')
        .eq('is_approved', true)
        .limit(1)
      
      if (rlsError) {
        addDebugInfo(`RLS测试失败: ${rlsError.message}`)
      } else {
        addDebugInfo(`RLS测试通过，找到 ${rlsTest?.length || 0} 条已审核记录`)
      }
      
    } catch (error: any) {
      addDebugInfo(`原始数据测试异常: ${error.message}`)
    }
  }

  const filteredInfluencers = influencers.filter(influencer =>
    influencer.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    influencer.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'good':
        return 'text-green-600'
      case 'poor':
        return 'text-yellow-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'good':
        return '连接正常'
      case 'poor':
        return '连接不稳定'
      case 'failed':
        return '连接异常'
      default:
        return '检查中'
    }
  }

  const InfluencerCard = ({ influencer }: { influencer: Influencer }) => (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
      onClick={() => setSelectedInfluencerId(influencer.id)}
    >
      <div className="relative">
        <img
          src={influencer.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={influencer.nickname}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
          }}
        />
        <div className="absolute top-3 right-3 flex space-x-1">
          {influencer.is_verified && (
            <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>已认证</span>
            </div>
          )}
          {!influencer.is_approved && (
            <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
              待审核
            </div>
          )}
        </div>
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
          {influencer.followers_count >= 10000 
            ? `${(influencer.followers_count / 10000).toFixed(1)}万粉丝`
            : `${influencer.followers_count}粉丝`
          }
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{influencer.nickname}</h3>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700">{Number(influencer.rating).toFixed(1)}</span>
            <span className="text-xs text-gray-500">({influencer.total_reviews})</span>
          </div>
        </div>
        
        {influencer.bio && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{influencer.bio}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          {influencer.categories.slice(0, 3).map((category, index) => (
            <span key={index} className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
              {category}
            </span>
          ))}
          {influencer.categories.length > 3 && (
            <span className="text-xs text-gray-500">+{influencer.categories.length - 3}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{influencer.location || '全国'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Video className="w-4 h-4" />
            <span>{influencer.total_live_count}场直播</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-pink-600">¥{influencer.hourly_rate}</span>
            <span className="text-gray-500 text-sm">/小时</span>
          </div>
          <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200">
            立即合作
          </button>
        </div>
        
        {/* 调试信息 */}
        {showDebug && (
          <div className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded">
            状态: {influencer.status} | 审核: {influencer.is_approved ? '已通过' : '待审核'}
          </div>
        )}
      </div>
    </div>
  )

  if (selectedInfluencerId) {
    return (
      <InfluencerDetailPage
        influencerId={selectedInfluencerId}
        onBack={() => setSelectedInfluencerId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">达人列表</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              发现优质TikTok达人，找到最适合您品牌的合作伙伴
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索达人昵称或简介..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="rating">按评分排序</option>
                <option value="followers">按粉丝数排序</option>
                <option value="price">按价格排序</option>
                <option value="experience">按经验排序</option>
              </select>
              
              <button
                onClick={fetchInfluencers}
                className="bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>刷新</span>
              </button>
              
              <button
                onClick={testRawData}
                className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>测试数据</span>
              </button>
              
              <button
                onClick={() => setShowSampleDataManager(true)}
                className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>样本数据</span>
              </button>
              
              <button
                onClick={() => setShowDiagnostic(true)}
                className="bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
              >
                <Bug className="w-4 h-4" />
                <span>问题诊断</span>
              </button>
              
              <button
                onClick={() => setShowConnectionFixer(true)}
                className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Wrench className="w-4 h-4" />
                <span>连接修复</span>
              </button>
              
              <button
                onClick={() => setShowDatabaseStatus(true)}
                className={`border-2 px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                  connectionStatus === 'good' 
                    ? 'border-green-500 text-green-600 hover:bg-green-50'
                    : connectionStatus === 'poor'
                    ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50'
                    : 'border-red-500 text-red-600 hover:bg-red-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>连接状态</span>
              </button>
            </div>
          </div>
          
          {/* Status Info */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 flex items-center space-x-4">
              <span>总达人数: {influencers.length}</span>
              <span>筛选后: {filteredInfluencers.length}</span>
              <div className={`flex items-center space-x-1 ${getConnectionStatusColor()}`}>
                <Database className="w-4 h-4" />
                <span>{getConnectionStatusText()}</span>
              </div>
              {error && (
                <span className="text-red-600">错误: {error}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {debugInfo.length > 0 && (
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>调试信息 ({debugInfo.length})</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Debug Info */}
          {showDebug && debugInfo.length > 0 && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700">调试信息</h4>
                <button
                  onClick={() => setDebugInfo([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清除
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {debugInfo.map((info, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">{info}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Influencers Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex space-x-2 mb-4">
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">加载失败</h3>
              <p className="text-red-500 mb-4">{error}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={fetchInfluencers}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>重试</span>
                </button>
                <button
                  onClick={() => setShowDiagnostic(true)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                >
                  <Bug className="w-4 h-4" />
                  <span>问题诊断</span>
                </button>
                <button
                  onClick={() => setShowSampleDataManager(true)}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>初始化数据</span>
                </button>
                <button
                  onClick={() => setShowConnectionFixer(true)}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>修复连接</span>
                </button>
                <button
                  onClick={() => setShowDatabaseStatus(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>检查连接</span>
                </button>
                <button
                  onClick={testRawData}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <Database className="w-4 h-4" />
                  <span>测试数据</span>
                </button>
              </div>
            </div>
          ) : filteredInfluencers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInfluencers.map((influencer) => (
                <InfluencerCard key={influencer.id} influencer={influencer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {influencers.length === 0 ? '暂无达人数据' : '没有找到匹配的达人'}
              </h3>
              <p className="text-gray-500 mb-4">
                {influencers.length === 0 
                  ? '数据库中暂无达人记录，请初始化测试数据或检查数据是否已正确导入'
                  : searchQuery 
                    ? '没有找到匹配的达人，请尝试其他关键词' 
                    : '当前分类下暂无达人，请选择其他分类'
                }
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowSampleDataManager(true)}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>初始化测试数据</span>
                </button>
                <button
                  onClick={() => setShowDiagnostic(true)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                >
                  <Bug className="w-4 h-4" />
                  <span>问题诊断</span>
                </button>
                <button
                  onClick={fetchInfluencers}
                  className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>重新加载</span>
                </button>
                <button
                  onClick={() => setShowConnectionFixer(true)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>修复连接</span>
                </button>
                <button
                  onClick={() => setShowDatabaseStatus(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>检查连接</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Database Status Modal */}
      {showDatabaseStatus && (
        <DatabaseStatus onClose={() => setShowDatabaseStatus(false)} />
      )}

      {/* Data Checker Modal */}
      {showDataChecker && (
        <DatabaseDataChecker />
      )}

      {/* Connection Fixer Modal */}
      {showConnectionFixer && (
        <DatabaseConnectionFixer onClose={() => setShowConnectionFixer(false)} />
      )}

      {/* Sample Data Manager Modal */}
      {showSampleDataManager && (
        <SampleDataManager onClose={() => setShowSampleDataManager(false)} />
      )}

      {/* Diagnostic Modal */}
      {showDiagnostic && (
        <InfluencerDisplayDiagnostic onClose={() => setShowDiagnostic(false)} />
      )}
    </div>
  )
}
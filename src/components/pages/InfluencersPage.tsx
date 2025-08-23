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
  RefreshCw
} from 'lucide-react'
import { Influencer } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'

export function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [error, setError] = useState<string | null>(null)
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'cached' | 'fresh'>('loading')

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

  useEffect(() => {
    fetchInfluencers()
  }, []) // 移除依赖，只在组件挂载时获取一次

    const fetchInfluencers = async () => {
    try {
      setLoading(true)
      setError(null)
      setCacheStatus('loading')

      // 环境自适应数据获取
      const isProduction = import.meta.env.PROD;
      let data;
      
      if (isProduction) {
        // 生产环境：使用API（带缓存）
        console.log('🌐 生产环境：从API获取达人数据...')
        
        const response = await fetch('/api/influencers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        data = await response.json()

        // 检查缓存状态
        const cacheControl = response.headers.get('Cache-Control')
        const age = response.headers.get('Age')

        if (cacheControl && cacheControl.includes('s-maxage')) {
          setCacheStatus('cached')
          console.log('✅ 数据来自服务器缓存')
        } else {
          setCacheStatus('fresh')
          console.log('🔄 数据来自数据库')
        }
      } else {
        // 本地开发环境：直接使用Supabase
        console.log('🏠 本地开发环境：直接从Supabase获取达人数据...')
        
        const { data: supabaseData, error } = await supabase
          .from('influencers')
          .select(`
            id,
            nickname,
            real_name,
            avatar_url,
            rating,
            total_reviews,
            hourly_rate,
            followers_count,
            bio,
            is_verified,
            is_approved,
            location,
            categories,
            experience_years,
            created_at,
            updated_at
          `)
          .eq('is_approved', true)
          .eq('is_verified', true)
          .order('rating', { ascending: false })
          .limit(100);

        if (error) {
          throw error;
        }

        data = supabaseData || [];
        setCacheStatus('fresh');
        console.log('🔄 本地环境：数据来自Supabase数据库');
      }

      // 应用客户端筛选和排序
      let filteredInfluencers = data || []

      // 分类筛选
      if (selectedCategory !== 'all') {
        filteredInfluencers = filteredInfluencers.filter((influencer: Influencer) =>
          influencer.categories?.some(cat => cat.toLowerCase().includes(selectedCategory.toLowerCase()))
        )
      }

      // 排序
      filteredInfluencers.sort((a: Influencer, b: Influencer) => {
        switch (sortBy) {
          case 'rating':
            return (b.rating || 0) - (a.rating || 0)
          case 'followers':
            return (b.followers_count || 0) - (a.followers_count || 0)
          case 'price':
            return (a.hourly_rate || 0) - (b.hourly_rate || 0)
          case 'experience':
            return (b.experience_years || 0) - (a.experience_years || 0)
          default:
            return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        }
      })

      setInfluencers(filteredInfluencers)
      console.log(`成功获取 ${filteredInfluencers.length} 个达人`)
    } catch (error) {
      console.error('Error fetching influencers:', error)
      setError('获取达人数据时发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 当筛选或排序条件改变时，重新应用筛选和排序
  useEffect(() => {
    if (influencers.length > 0) {
      let filteredInfluencers = [...influencers]

      // 分类筛选
      if (selectedCategory !== 'all') {
        filteredInfluencers = filteredInfluencers.filter((influencer: Influencer) =>
          influencer.categories?.some(cat => cat.toLowerCase().includes(selectedCategory.toLowerCase()))
        )
      }

      // 排序
      filteredInfluencers.sort((a: Influencer, b: Influencer) => {
        switch (sortBy) {
          case 'rating':
            return (b.rating || 0) - (a.rating || 0)
          case 'followers':
            return (b.followers_count || 0) - (a.followers_count || 0)
          case 'price':
            return (a.hourly_rate || 0) - (b.hourly_rate || 0)
          case 'experience':
            return (b.experience_years || 0) - (a.experience_years || 0)
          default:
            return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        }
      })

      setInfluencers(filteredInfluencers)
    }
  }, [selectedCategory, sortBy])

  // 筛选达人
  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = influencer.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         influencer.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         influencer.categories?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  const InfluencerCard = ({ influencer }: { influencer: Influencer }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="relative">
        <img 
          src={influencer.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'} 
          alt={influencer.nickname}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          {influencer.is_verified && (
            <div className="bg-blue-500 text-white p-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
        </div>

      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {influencer.nickname}
            </h3>
            <p className="text-sm text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {influencer.location || '未知地区'}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{influencer.rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {influencer.bio || '暂无描述'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">粉丝数</span>
            <div className="font-semibold text-gray-900">
              {(influencer.followers_count / 10000).toFixed(1)}万
            </div>
          </div>
          <div>
            <span className="text-gray-500">时薪</span>
            <div className="font-semibold text-gray-900">
                              ${influencer.hourly_rate?.toLocaleString() || '0'}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {influencer.categories?.slice(0, 3).map((category, index) => (
            <span 
              key={index}
              className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs"
            >
              {category}
            </span>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => window.open(`/influencer/${influencer.id}?from=list`, '_blank')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>查看详情</span>
          </button>
        </div>
      </div>
    </div>
  )



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 via-purple-100/20 to-indigo-100/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-pink-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-10 left-1/4 w-20 h-20 bg-indigo-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              达人
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                列表
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
              发现优质TikTok达人，为您的品牌找到最合适的合作伙伴
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>在线达人</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>认证达人</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>高评分</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索达人昵称、描述或分类..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
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
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
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
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchInfluencers}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
          
          {/* Status Info */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 flex items-center space-x-4">
              <span>总达人数: {influencers.length}</span>
              <span>筛选后: {filteredInfluencers.length}</span>
              {error && (
                <span className="text-red-600">错误: {error}</span>
              )}
            </div>
            
            {/* Cache Status - 生产环境隐藏 */}
            {!import.meta.env.PROD && (
              <div className="flex items-center space-x-2">
                {cacheStatus === 'loading' && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs">加载中...</span>
                  </div>
                )}
                {cacheStatus === 'cached' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">服务器缓存</span>
                  </div>
                )}
                {cacheStatus === 'fresh' && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">实时数据</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Influencers Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">加载达人数据中...</p>
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
                  ? '数据库中暂无达人记录'
                  : searchQuery 
                    ? '没有找到匹配的达人，请尝试其他关键词' 
                    : '当前分类下暂无达人，请选择其他分类'
                }
              </p>
              <button
                onClick={fetchInfluencers}
                className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重新加载</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { Play, Heart, MessageCircle, Share2, Eye, Clock, Star, Search, Grid3X3, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface Video {
  id: string
  title: string
  description: string
  video_url: string
  poster_url: string
  views_count: string
  likes_count: string
  comments_count: string
  shares_count: string
  duration: string
  category?: { name: string; description: string }
  influencer_name: string
  influencer_avatar: string
  influencer_rating: number
  tags: string[]
  created_at: string
  is_featured: boolean
  is_active: boolean
}

export function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const navigate = useNavigate()

  // Environment-adaptive data fetching
  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const isProduction = import.meta.env.PROD;
      
      if (isProduction) {
        // Production: Use API
        console.log('🌐 Production: Fetching video data from API...')
        
        const params = new URLSearchParams({
          page: '1',
          limit: '50',
          category: selectedCategory === 'all' ? 'all' : selectedCategory,
          search: searchQuery,
          featured: 'all',
          sort: sortBy === 'trending' ? 'popular' : sortBy
        })

        const response = await fetch(`/api/videos?${params}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setVideos(data.videos || [])
        
        console.log('✅ Successfully fetched video data:', data.videos?.length || 0, 'videos')
      } else {
        // Local development: Use Supabase directly
        console.log('🏠 Local development: Fetching video data from Supabase...')
        
        let query = supabase
          .from('videos')
          .select(`
            *,
            category:video_categories(name, description)
          `)
          .eq('is_active', true)

        // Apply filter conditions
        if (selectedCategory !== 'all') {
          query = query.eq('category_id', selectedCategory)
        }
        
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,influencer_name.ilike.%${searchQuery}%`)
        }

        // Apply sorting
        switch (sortBy) {
          case 'latest':
            query = query.order('created_at', { ascending: false })
            break
          case 'oldest':
            query = query.order('created_at', { ascending: true })
            break
          case 'popular':
            query = query.order('views_count', { ascending: false })
            break
          case 'rating':
            query = query.order('influencer_rating', { ascending: false })
            break
          case 'trending':
            query = query.order('views_count', { ascending: false })
            break
          default:
            query = query.order('created_at', { ascending: false })
        }

        const { data: videos, error } = await query.limit(50)

        if (error) {
          throw error
        }

        // Process data
        const processedVideos = (videos || []).map(video => ({
          ...video,
          views_count: video.views_count || '0',
          likes_count: video.likes_count || '0',
          comments_count: video.comments_count || '0',
          shares_count: video.shares_count || '0',
          tags: video.tags || []
        }))

        setVideos(processedVideos)
        console.log('✅ Local environment: Successfully fetched video data:', processedVideos.length, 'videos')
      }
    } catch (error) {
      console.error('❌ Failed to fetch video data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [selectedCategory, sortBy])

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => fetchVideos(), 500)
      return () => clearTimeout(timeoutId)
    } else {
      fetchVideos()
    }
  }, [searchQuery])

  const handleVideoClick = (video: Video) => {
    navigate(`/video/${video.id}`, { state: { videoInfo: video } })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`
    return `${Math.ceil(diffDays / 365)} years ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Load Failed</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchVideos} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Featured Video Showcase</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover quality content, watch amazing live streaming sales cases, and learn about the latest product trends
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选和搜索 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search videos, influencers, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 筛选选项 */}
            <div className="flex items-center space-x-4">
              {/* 分类筛选 */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="1">Beauty</option>
                <option value="2">Fashion</option>
                <option value="3">Digital</option>
                <option value="4">Lifestyle</option>
                <option value="5">Food</option>
                <option value="6">Travel</option>
              </select>

              {/* 排序选项 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
                <option value="rating">Highest Rated</option>
                <option value="sort_order">Recommended</option>
              </select>

              {/* 视图切换 */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 视频列表 */}
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📹</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Videos Available</h3>
            <p className="text-gray-600">Please try adjusting filters or search keywords</p>
          </div>
        ) : (
          <>
            {/* 网格视图 */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                    onClick={() => handleVideoClick(video)}
                  >
                    {/* 视频缩略图 */}
                    <div className="relative aspect-video rounded-t-xl overflow-hidden">
                      <img
                        src={video.poster_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200" />
                      
                      {/* 播放按钮 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:bg-opacity-100 transition-all duration-200">
                          <Play className="w-6 h-6 text-gray-800 ml-1" />
                        </div>
                      </div>
                      
                      {/* 时长 */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                      
                      {/* 特色标签 */}
                      {video.is_featured && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                          Featured
                        </div>
                      )}
                    </div>

                    {/* 视频信息 */}
                    <div className="p-4">
                      {/* 标题 */}
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                        {video.title}
                      </h3>
                      
                      {/* 达人信息 */}
                      <div className="flex items-center space-x-2 mb-3">
                        <img
                          src={video.influencer_avatar}
                          alt={video.influencer_name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-700 font-medium">
                          {video.influencer_name}
                        </span>
                      </div>
                      
                      {/* 发布时间 */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(video.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 列表视图 */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                    onClick={() => handleVideoClick(video)}
                  >
                    <div className="flex">
                      {/* 视频缩略图 */}
                      <div className="relative w-48 aspect-video rounded-l-xl overflow-hidden flex-shrink-0">
                        <img
                          src={video.poster_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200" />
                        
                        {/* 播放按钮 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:bg-opacity-100 transition-all duration-200">
                            <Play className="w-6 h-6 text-gray-800 ml-1" />
                          </div>
                        </div>
                        
                        {/* 时长 */}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                        
                        {/* 特色标签 */}
                        {video.is_featured && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                            Featured
                          </div>
                        )}
                      </div>

                      {/* 视频信息 */}
                      <div className="flex-1 p-4">
                        {/* 标题 */}
                        <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors duration-200">
                          {video.title}
                        </h3>
                        
                        {/* 描述 */}
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {video.description}
                        </p>
                        
                        {/* 达人信息 */}
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={video.influencer_avatar}
                            alt={video.influencer_name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-700 font-medium">
                            {video.influencer_name}
                          </span>
                        </div>
                        
                        {/* 发布时间 */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(video.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 
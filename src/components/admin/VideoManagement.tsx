import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  Search,
  Filter,
  RefreshCw,
  Play,
  Tag,
  User,
  Calendar,
  Clock,
  Eye as EyeIcon,
  Heart,
  MessageCircle,
  Share2,
  ArrowUpDown,
  MoreHorizontal,
  XCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Video {
  id: string
  title: string
  description: string
  video_url: string
  poster_url: string
  duration: string
  category_id: string
  category?: {
    name: string
    description: string
  }
  influencer_name: string
  influencer_avatar: string
  influencer_followers: string
  influencer_rating: number
  views_count: string
  likes_count: string
  comments_count: string
  shares_count: string
  tags: string[]
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface VideoCategory {
  id: string
  name: string
  description: string
  sort_order: number
  is_active: boolean
}

interface Influencer {
  id: string
  user_id: string
  nickname: string
  avatar_url: string
  bio: string
  followers_count: number
  rating: number
  is_verified: boolean
  is_approved: boolean
  status: string
  created_at: string
}

export function VideoManagement() {
  const [videos, setVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isFeatured, setIsFeatured] = useState('all')
  const [isActive, setIsActive] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [editingVideo, setEditingVideo] = useState<Partial<Video>>({})
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [showInfluencerSelector, setShowInfluencerSelector] = useState(false)

  const itemsPerPage = 20

  useEffect(() => {
    console.log('VideoManagement组件初始化...')
    fetchCategories()
    fetchVideos()
    fetchInfluencers()
  }, [currentPage, selectedCategory, isFeatured, isActive])

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        fetchVideos()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      fetchVideos()
    }
  }, [searchQuery])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('video_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('获取分类失败:', error)
      setError('获取分类失败')
    }
  }

  const fetchInfluencers = async () => {
    try {
      console.log('开始获取达人列表...')
      
      // 简化版本：直接查询influencers表
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('nickname', { ascending: true })

      if (error) {
        console.error('查询达人数据失败:', error)
        // 如果查询失败，使用测试数据
        console.log('使用测试数据...')
        const testData = [
          {
            id: 'test-1',
            user_id: 'test-user-1',
            nickname: '测试达人1',
            avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
            bio: '这是一个测试达人',
            followers_count: 100000,
            rating: 4.5,
            is_verified: true,
            is_approved: true,
            status: 'active',
            created_at: new Date().toISOString()
          },
          {
            id: 'test-2',
            user_id: 'test-user-2',
            nickname: '测试达人2',
            avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
            bio: '这是另一个测试达人',
            followers_count: 200000,
            rating: 4.8,
            is_verified: true,
            is_approved: true,
            status: 'active',
            created_at: new Date().toISOString()
          }
        ]
        setInfluencers(testData)
        return
      }

      console.log(`成功获取达人数据: ${data?.length || 0} 个`)
      console.log('达人数据:', data)
      setInfluencers(data || [])
    } catch (error) {
      console.error('获取达人列表失败:', error)
      setError(`获取达人列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const fetchVideos = async () => {
    try {
      console.log('开始获取视频列表...')
      setLoading(true)
      setError(null)

      let query = supabase
        .from('videos')
        .select(`
          *,
          category:video_categories(name, description)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      // 应用筛选条件
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory)
      }
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,influencer_name.ilike.%${searchQuery}%`)
      }
      
      if (isFeatured !== 'all') {
        query = query.eq('is_featured', isFeatured === 'true')
      }
      
      if (isActive !== 'all') {
        query = query.eq('is_active', isActive === 'true')
      }

      // 分页
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      console.log('查询参数:', {
        selectedCategory,
        searchQuery,
        isFeatured,
        isActive,
        currentPage,
        from,
        to
      })

      const { data, error, count } = await query

      if (error) {
        console.error('查询失败:', error)
        throw error
      }

      console.log(`成功获取视频数据: ${data?.length || 0} 个`)
      console.log('视频数据:', data)

      setVideos(data || [])
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('获取视频失败:', error)
      setError(`获取视频失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVideo = () => {
    setEditingVideo({
      title: '',
      description: '',
      video_url: '',
      poster_url: '',
      duration: '',
      category_id: '',
      influencer_name: '',
      influencer_avatar: '',
      influencer_followers: '',
      influencer_rating: 0,
      views_count: '0',
      likes_count: '0',
      comments_count: '0',
      shares_count: '0',
      tags: [],
      is_featured: false,
      is_active: true,
      sort_order: 0
    })
    setShowAddModal(true)
  }

  const handleEditVideo = (video: Video) => {
    console.log('开始编辑视频:', video)
    setEditingVideo({ ...video })
    setShowEditModal(true)
    console.log('编辑模态框已打开，editingVideo状态:', { ...video })
  }

  const handleDeleteVideo = (video: Video) => {
    setDeletingVideo(video)
    setShowDeleteModal(true)
  }

  const saveVideo = async (isEdit: boolean = false) => {
    try {
      console.log('开始保存视频...')
      console.log('isEdit:', isEdit)
      console.log('editingVideo:', editingVideo)
      
      setSaving(true)
      setError(null)

      if (isEdit && editingVideo.id) {
        console.log('执行更新操作，视频ID:', editingVideo.id)
        const updateData = {
          ...editingVideo,
          updated_at: new Date().toISOString()
        }
        console.log('更新数据:', updateData)
        
        const { data, error } = await supabase
          .from('videos')
          .update(updateData)
          .eq('id', editingVideo.id)
          .select()

        if (error) {
          console.error('更新失败:', error)
          throw error
        }
        
        console.log('更新成功，返回数据:', data)
        setSuccess('视频更新成功')
      } else {
        console.log('执行创建操作')
        const { data, error } = await supabase
          .from('videos')
          .insert([editingVideo])
          .select()

        if (error) {
          console.error('创建失败:', error)
          throw error
        }
        
        console.log('创建成功，返回数据:', data)
        setSuccess('视频创建成功')
      }

      // 刷新数据
      console.log('刷新视频列表...')
      await fetchVideos()
      
      // 关闭模态框
      console.log('关闭模态框...')
      if (isEdit) {
        setShowEditModal(false)
        console.log('编辑模态框已关闭')
      } else {
        setShowAddModal(false)
        console.log('添加模态框已关闭')
      }
      setEditingVideo({})
      
      // 清除成功消息
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('保存视频失败:', error)
      setError(`保存视频失败: ${error instanceof Error ? error.message : '未知错误'}`)
      // 即使保存失败，也要重置保存状态
      setSaving(false)
    }
  }

  const confirmDeleteVideo = async () => {
    if (!deletingVideo) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', deletingVideo.id)

      if (error) throw error

      setSuccess('视频删除成功')
      fetchVideos()
      setShowDeleteModal(false)
      setDeletingVideo(null)
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('删除视频失败:', error)
      setError('删除视频失败')
    } finally {
      setSaving(false)
    }
  }

  const selectInfluencer = (influencer: Influencer) => {
    console.log('选择达人:', influencer)
    setEditingVideo(prev => ({
      ...prev,
      influencer_name: influencer.nickname,
      influencer_avatar: influencer.avatar_url,
      influencer_followers: `${influencer.followers_count}万`,
      influencer_rating: influencer.rating
    }))
    setShowInfluencerSelector(false)
    console.log('达人信息已回填到表单')
  }

  const testInfluencerSelector = () => {
    console.log('测试达人选择器状态:')
    console.log('showInfluencerSelector:', showInfluencerSelector)
    console.log('influencers count:', influencers.length)
    console.log('influencers data:', influencers)
    setShowInfluencerSelector(true)
  }

  const testModalStates = () => {
    console.log('测试模态框状态:')
    console.log('showAddModal:', showAddModal)
    console.log('showEditModal:', showEditModal)
    console.log('editingVideo:', editingVideo)
  }

  const toggleVideoStatus = async (video: Video, field: 'is_active' | 'is_featured') => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ [field]: !video[field] })
        .eq('id', video.id)

      if (error) throw error

      // 更新本地状态
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, [field]: !v[field] } : v
      ))

      setSuccess(`${field === 'is_active' ? '启用状态' : '推荐状态'}更新成功`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('更新状态失败:', error)
      setError('更新状态失败')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatDuration = (duration: string) => {
    return duration || '未知'
  }

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">视频管理</h1>
          <p className="text-gray-600">管理网站展示的视频素材</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInfluencers}
            className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新达人列表
          </button>
          <button
            onClick={fetchVideos}
            className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新视频列表
          </button>
          <button
            onClick={handleAddVideo}
            className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加视频
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* 调试信息 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            达人列表状态: {influencers.length} 个达人
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={testInfluencerSelector}
              className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200"
            >
              测试选择器
            </button>
            <button
              onClick={testModalStates}
              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
            >
              测试模态框
            </button>
            <div className="text-xs text-gray-500">
              最后更新: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          模态框状态: 添加={String(showAddModal)}, 编辑={String(showEditModal)}
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索视频..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* 分类筛选 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">全部分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* 推荐状态 */}
          <select
            value={isFeatured}
            onChange={(e) => setIsFeatured(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">全部推荐状态</option>
            <option value="true">已推荐</option>
            <option value="false">未推荐</option>
          </select>

          {/* 启用状态 */}
          <select
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">全部状态</option>
            <option value="true">已启用</option>
            <option value="false">已禁用</option>
          </select>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-pink-600">{totalCount}</div>
          <div className="text-gray-600">视频总数</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {videos.filter(v => v.is_featured).length}
          </div>
          <div className="text-gray-600">推荐视频</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {videos.filter(v => v.is_active).length}
          </div>
          <div className="text-gray-600">启用视频</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {videos.filter(v => !v.is_active).length}
          </div>
          <div className="text-gray-600">禁用视频</div>
        </div>
      </div>

      {/* 视频列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  视频信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  达人信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  统计数据
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  {/* 视频信息 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden">
                        {video.poster_url ? (
                          <img
                            src={video.poster_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {video.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {video.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDuration(video.duration)}
                          </span>
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(video.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 分类 */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      {video.category?.name || '未分类'}
                    </span>
                  </td>

                  {/* 达人信息 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                        {video.influencer_avatar ? (
                          <img
                            src={video.influencer_avatar}
                            alt={video.influencer_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-400 mx-auto mt-2" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {video.influencer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {video.influencer_followers} 粉丝
                        </p>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">
                            {video.influencer_rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 统计数据 */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <EyeIcon className="w-3 h-3" />
                        <span>{video.views_count}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Heart className="w-3 h-3" />
                        <span>{video.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MessageCircle className="w-3 h-3" />
                        <span>{video.comments_count}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Share2 className="w-3 h-3" />
                        <span>{video.shares_count}</span>
                      </div>
                    </div>
                  </td>

                  {/* 状态 */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleVideoStatus(video, 'is_active')}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          video.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {video.is_active ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            已启用
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            已禁用
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => toggleVideoStatus(video, 'is_featured')}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          video.is_featured
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {video.is_featured ? (
                          <>
                            <Star className="w-3 h-3 mr-1" />
                            已推荐
                          </>
                        ) : (
                          <>
                            <StarOff className="w-3 h-3 mr-1" />
                            未推荐
                          </>
                        )}
                      </button>
                    </div>
                  </td>

                  {/* 操作 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditVideo(video)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                显示第 {(currentPage - 1) * itemsPerPage + 1} 到{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} 条，共 {totalCount} 条
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 添加/编辑视频模态框 */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showAddModal ? '添加视频' : '编辑视频'}
              </h3>
              
              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      视频标题 *
                    </label>
                    <input
                      type="text"
                      value={editingVideo.title || ''}
                      onChange={(e) => setEditingVideo(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="输入视频标题"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分类
                    </label>
                    <select
                      value={editingVideo.category_id || ''}
                      onChange={(e) => setEditingVideo(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">选择分类</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    视频描述
                  </label>
                  <textarea
                    value={editingVideo.description || ''}
                    onChange={(e) => setEditingVideo(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="输入视频描述"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      视频URL *
                    </label>
                    <input
                      type="url"
                      value={editingVideo.video_url || ''}
                      onChange={(e) => setEditingVideo(prev => ({ ...prev, video_url: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="输入视频URL"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      封面图片
                    </label>
                    <div className="space-y-2">
                      {editingVideo.poster_url && (
                        <div className="relative w-40 h-24 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={editingVideo.poster_url}
                            alt="视频封面"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setEditingVideo(prev => ({ ...prev, poster_url: '' }))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // 使用PICUI图床API
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('permission', '1'); // 公开权限

                                console.log('开始上传封面图片...');
                                const response = await fetch('https://picui.cn/api/v1/upload', {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${import.meta.env.VITE_PICUI_API_KEY}`,
                                    'Accept': 'application/json'
                                  },
                                  body: formData
                                });

                                const result = await response.json();
                                console.log('PICUI API响应:', result);

                                if (result.status && result.data?.links?.url) {
                                  // 更新表单状态
                                  setEditingVideo(prev => ({
                                    ...prev,
                                    poster_url: result.data.links.url
                                  }));
                                  console.log('封面图片上传成功:', result.data.links.url);
                                } else {
                                  throw new Error(result.message || '上传失败');
                                }
                              } catch (error: any) {
                                console.error('封面图片上传异常:', error);
                                alert('上传图片失败: ' + (error.message || '未知错误'));
                              }
                            }
                          }}
                          className="hidden"
                          id="poster-upload"
                        />
                        <label
                          htmlFor="poster-upload"
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors inline-flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>上传图片</span>
                        </label>
                        {editingVideo.poster_url && (
                          <input
                            type="text"
                            value={editingVideo.poster_url}
                            onChange={(e) => setEditingVideo(prev => ({ ...prev, poster_url: e.target.value }))}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="或输入图片URL"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      时长
                    </label>
                    <input
                      type="text"
                      value={editingVideo.duration || ''}
                      onChange={(e) => setEditingVideo(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="如: 2:35"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      排序
                    </label>
                    <input
                      type="number"
                      value={editingVideo.sort_order || 0}
                      onChange={(e) => setEditingVideo(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* 达人信息 */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900">达人信息</h4>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('点击选择达人按钮')
                        console.log('当前influencers数量:', influencers.length)
                        setShowInfluencerSelector(true)
                      }}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <User className="w-4 h-4 mr-1" />
                      选择入驻达人
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        达人姓名
                      </label>
                      <input
                        type="text"
                        value={editingVideo.influencer_name || ''}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, influencer_name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="输入达人姓名"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        达人头像URL
                      </label>
                      <input
                        type="url"
                        value={editingVideo.influencer_avatar || ''}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, influencer_avatar: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="输入头像URL"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        粉丝数量
                      </label>
                      <input
                        type="text"
                        value={editingVideo.influencer_followers || ''}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, influencer_followers: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="如: 125万"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        评分
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={editingVideo.influencer_rating || 0}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, influencer_rating: parseFloat(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>

                {/* 统计数据 */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">统计数据</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        观看次数
                      </label>
                      <input
                        type="text"
                        value={editingVideo.views_count || '0'}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, views_count: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="如: 15.2万"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        点赞数
                      </label>
                      <input
                        type="text"
                        value={editingVideo.likes_count || '0'}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, likes_count: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="如: 2.8万"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        评论数
                      </label>
                      <input
                        type="text"
                        value={editingVideo.comments_count || '0'}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, comments_count: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="如: 1.2万"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        分享数
                      </label>
                      <input
                        type="text"
                        value={editingVideo.shares_count || '0'}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, shares_count: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="如: 5.6千"
                      />
                    </div>
                  </div>
                </div>

                {/* 标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标签 (用逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(editingVideo.tags) ? editingVideo.tags.join(', ') : ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      setEditingVideo(prev => ({ ...prev, tags }))
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="美妆, 直播带货, 产品展示"
                  />
                </div>

                {/* 状态设置 */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">状态设置</h4>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingVideo.is_featured || false}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">推荐视频</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingVideo.is_active || false}
                        onChange={(e) => setEditingVideo(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">启用视频</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    console.log('点击取消按钮')
                    console.log('当前模态框状态:', { showAddModal, showEditModal })
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setEditingVideo({})
                    console.log('模态框已关闭')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    console.log('点击保存按钮')
                    console.log('当前editingVideo状态:', editingVideo)
                    console.log('表单验证:', {
                      hasTitle: !!editingVideo.title,
                      hasVideoUrl: !!editingVideo.video_url,
                      hasId: !!editingVideo.id
                    })
                    // 判断是添加还是编辑模式
                    const isEditMode = showEditModal
                    saveVideo(isEditMode)
                  }}
                  disabled={saving || !editingVideo.title || !editingVideo.video_url}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 达人选择器模态框 */}
      {showInfluencerSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  选择入驻达人 ({influencers.length} 个)
                </h3>
                <button
                  onClick={() => {
                    console.log('关闭达人选择器')
                    setShowInfluencerSelector(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              {/* 调试信息 */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <div>模态框状态: {showInfluencerSelector ? '显示' : '隐藏'}</div>
                <div>达人数量: {influencers.length}</div>
                <div>最后更新: {new Date().toLocaleTimeString()}</div>
                <div>showInfluencerSelector值: {String(showInfluencerSelector)}</div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {influencers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">暂无入驻达人</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {influencers.map((influencer) => (
                      <div
                        key={influencer.id}
                        onClick={() => selectInfluencer(influencer)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 hover:shadow-md cursor-pointer transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                            {influencer.avatar_url ? (
                              <img
                                src={influencer.avatar_url}
                                alt={influencer.nickname}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-gray-400 mx-auto mt-3" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{influencer.nickname}</h4>
                            <p className="text-sm text-gray-500">{influencer.bio}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                              <span>{influencer.followers_count}万 粉丝</span>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span>{influencer.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowInfluencerSelector(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && deletingVideo && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">确认删除</h3>
              <p className="text-sm text-gray-500 mt-2">
                确定要删除视频 "{deletingVideo.title}" 吗？此操作无法撤销。
              </p>
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmDeleteVideo}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Share2, 
  Star,
  Clock,
  Download,
  Users,
  Heart,
  MessageCircle,
  Eye,
  ThumbsUp
} from 'lucide-react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface Video {
  id: string
  title: string
  description: string
  video_url: string  // 现在这个字段将存储 YouTube 视频 ID
  poster_url: string
  views_count: string
  likes_count: string
  comments_count: string
  shares_count: string
  duration: string
  category?: {
    name: string
    description: string
  }
  influencer_name: string
  influencer_avatar: string
  influencer_followers: string
  influencer_rating: number
  tags: string[]
  created_at: string
  is_featured: boolean
  is_active: boolean
}

interface RelatedVideo {
  id: string
  title: string
  poster_url: string
  duration: string
  views_count: string
  likes_count: string
  influencer_name: string
  influencer_avatar: string
  category?: {
    name: string
  } | null
}

interface VideoDetailResponse {
  video: Video
  relatedVideos: RelatedVideo[]
  categories: any[]
  meta: {
    title: string
    description: string
    image: string
    type: string
  }
}

export function VideoPlayerPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // 新增状态
  const [videoData, setVideoData] = useState<VideoDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { videoId } = useParams()

  // 从URL参数或location state获取视频信息
  const videoInfo = location.state?.videoInfo || {
    id: videoId || '1',
    title: '加载中...',
    description: '正在加载视频信息...',
    video_url: '',
    poster_url: '',
    views_count: '0',
    likes_count: '0',
    comments_count: '0',
    shares: '0',
    duration: '0:00',
    category: '加载中',
    influencer: {
      name: '加载中',
      avatar: '',
      followers: '0',
      rating: 0
    },
    tags: []
  }

  const videoRef = React.useRef<HTMLVideoElement>(null)

  // 环境自适应数据获取
  const fetchVideoDetail = async () => {
    if (!videoId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const isProduction = import.meta.env.PROD;
      
      if (isProduction) {
        // 生产环境：使用API
        console.log('🌐 生产环境：从API获取视频详情...')
        
        const response = await fetch(`/api/video-detail?id=${videoId}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: VideoDetailResponse = await response.json()
        setVideoData(data)
        
        console.log('✅ 成功获取视频详情:', data)
      } else {
        // 本地开发环境：直接使用Supabase
        console.log('🏠 本地开发环境：直接从Supabase获取视频详情...')
        
        // 获取视频详情
        const { data: video, error: videoError } = await supabase
          .from('videos')
          .select(`
            *,
            category:video_categories(name, description)
          `)
          .eq('id', videoId)
          .eq('is_active', true)
          .single();

        if (videoError || !video) {
          throw new Error('视频不存在或已禁用');
        }

        // 获取相关视频推荐
        const { data: relatedVideos, error: relatedError } = await supabase
          .from('videos')
          .select(`
            id,
            title,
            poster_url,
            duration,
            views_count,
            likes_count,
            influencer_name,
            influencer_avatar,
            category:video_categories!inner(name)
          `)
          .eq('is_active', true)
          .neq('id', videoId)
          .eq('category_id', video.category_id)
          .order('views_count', { ascending: false })
          .limit(6);

        if (relatedError) {
          console.error('⚠️ 获取相关视频失败:', relatedError);
        }

        // 获取视频分类信息
        const { data: categories, error: categoriesError } = await supabase
          .from('video_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (categoriesError) {
          console.error('⚠️ 获取分类信息失败:', categoriesError);
        }

        // 构建响应数据
        const data: VideoDetailResponse = {
          video: {
            ...video,
            views_count: video.views_count || '0',
            likes_count: video.likes_count || '0',
            comments_count: video.comments_count || '0',
            shares_count: video.shares_count || '0',
            tags: video.tags || []
          },
          relatedVideos: relatedVideos ? relatedVideos.map(video => ({
            id: video.id,
            title: video.title,
            poster_url: video.poster_url,
            duration: video.duration,
            views_count: video.views_count,
            likes_count: video.likes_count,
            influencer_name: video.influencer_name,
            influencer_avatar: video.influencer_avatar,
            category: video.category ? { name: String(video.category.name) } : null
          })) : [],
          categories: categories || [],
          meta: {
            title: video.title,
            description: video.description,
            image: video.poster_url,
            type: 'video'
          }
        };

        setVideoData(data);
        console.log('✅ 本地环境：成功获取视频详情');
      }
    } catch (error) {
      console.error('❌ 获取视频详情失败:', error)
      setError(error instanceof Error ? error.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 计算当前视频数据，优先使用API数据，回退到location state数据
  const currentVideo = videoData?.video || videoInfo
  const relatedVideos = videoData?.relatedVideos || []

  useEffect(() => {
    fetchVideoDetail()
  }, [videoId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载视频详情中...</p>
        </div>
      </div>
    )
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ 加载失败</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchVideoDetail} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 视频播放区域 */}
          <div className="lg:col-span-2">
            {/* 视频播放器 */}
            <div className="bg-black rounded-xl overflow-hidden shadow-lg">
              <div className="relative aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${currentVideo.video_url}`}
                  title={currentVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="absolute inset-0"
                ></iframe>
              </div>
            </div>

            {/* 视频信息 */}
            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {currentVideo.title}
              </h1>
              
              <p className="text-gray-600 mb-4">
                {currentVideo.description}
              </p>

              {/* 分类和时长 */}
              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentVideo.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>{currentVideo.category?.name || currentVideo.category}</span>
                </div>
              </div>

              {/* 标签 */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(currentVideo.tags || []).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 达人信息 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={currentVideo.influencer_avatar || currentVideo.influencer?.avatar}
                  alt={currentVideo.influencer_name || currentVideo.influencer?.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {currentVideo.influencer_name || currentVideo.influencer?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currentVideo.category?.name || currentVideo.category}
                  </p>
                </div>
              </div>
              
              <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200">
                关注达人
              </button>
            </div>

            {/* 相关推荐 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">相关推荐</h3>
              <div className="space-y-4">
                {relatedVideos && relatedVideos.length > 0 ? (
                  relatedVideos.map((video) => (
                    <div 
                      key={video.id} 
                      className="flex space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => navigate(`/video/${video.id}`, { state: { videoInfo: video } })}
                    >
                      <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={video.poster_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {video.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {video.influencer_name}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>暂无相关推荐</p>
                  </div>
                )}
              </div>
            </div>

            {/* 热门标签 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">热门标签</h3>
              <div className="flex flex-wrap gap-2">
                {['直播带货', '美妆', '时尚', '数码', '生活', '美食', '旅游', '教育'].map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 自定义样式 */}
      <style>
        {`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          border: none;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        `}
      </style>
    </div>
  )
}

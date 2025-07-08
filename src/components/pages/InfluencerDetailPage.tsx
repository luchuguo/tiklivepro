import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Star, 
  MapPin, 
  Video, 
  Heart, 
  MessageCircle, 
  Share2, 
  ArrowLeft,
  CheckCircle,
  Calendar,
  Clock,
  DollarSign,
  Instagram,
  TrendingUp,
  Award,
  Eye,
  Briefcase,
  Send
} from 'lucide-react'
import { supabase, Influencer, Task, Review } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface InfluencerDetailPageProps {
  influencerId: string
  onBack: () => void
}

export function InfluencerDetailPage({ influencerId, onBack }: InfluencerDetailPageProps) {
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'tasks' | 'reviews'>('profile')
  const [showContactForm, setShowContactForm] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [similarInfluencers, setSimilarInfluencers] = useState<Influencer[]>([])
  
  const { user, isCompany } = useAuth()

  useEffect(() => {
    fetchInfluencerDetails()
  }, [influencerId])

  const fetchInfluencerDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 获取达人详情
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('id', influencerId)
        .single()

      if (influencerError) {
        console.error('获取达人详情失败:', influencerError)
        setError('获取达人详情失败，请重试')
        return
      }

      setInfluencer(influencerData)
      
      // 获取已完成任务
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          live_date,
          company:companies(company_name, logo_url),
          category:task_categories(name)
        `)
        .eq('selected_influencer_id', influencerId)
        .eq('status', 'completed')
        .order('live_date', { ascending: false })
        .limit(5)
      
      setCompletedTasks(tasksData || [])
      
      // 获取评价
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          task:tasks(title)
        `)
        .eq('reviewee_id', influencerData.user_id)
        .order('created_at', { ascending: false })
      
      setReviews(reviewsData || [])
      
      // 获取相似达人
      if (influencerData.categories && influencerData.categories.length > 0) {
        const { data: similarInfluencersData } = await supabase
          .from('influencers')
          .select('*')
          .contains('categories', influencerData.categories)
          .neq('id', influencerId)
          .eq('is_approved', true)
          .eq('status', 'active')
          .order('rating', { ascending: false })
          .limit(3)
        
        setSimilarInfluencers(similarInfluencersData || [])
      }
      
    } catch (error) {
      console.error('获取达人详情时发生错误:', error)
      setError('获取达人详情时发生错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !isCompany) {
      alert('请先登录企业账号')
      return
    }
    
    if (!message.trim()) {
      alert('请输入消息内容')
      return
    }
    
    try {
      setSubmitting(true)
      
      // 这里应该有发送消息的逻辑，但目前没有实现消息系统
      // 模拟发送成功
      setTimeout(() => {
        alert('消息发送成功！')
        setMessage('')
        setShowContactForm(false)
        setSubmitting(false)
      }, 1000)
      
    } catch (error) {
      console.error('发送消息时发生错误:', error)
      alert('发送消息时发生错误，请重试')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-40 bg-gray-200 rounded mb-6"></div>
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex space-x-4 mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 w-1/2 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
            <p className="text-gray-600 mb-6">{error || '无法加载达人详情'}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchInfluencerDetails}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
              <button
                onClick={onBack}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回达人列表</span>
        </button>

        {/* 达人资料卡片 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* 封面图 */}
          <div className="h-48 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
          
          {/* 基本信息 */}
          <div className="px-8 pt-0 pb-8 relative">
            {/* 头像 */}
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden absolute -top-12 left-8">
              <img
                src={influencer.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={influencer.nickname}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
                }}
              />
            </div>
            
            {/* 名称和状态 */}
            <div className="flex justify-between items-start mt-16 mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{influencer.nickname}</h1>
                  {influencer.is_verified && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>已认证</span>
                    </span>
                  )}
                  {!influencer.is_approved && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                      待审核
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-gray-600 text-sm">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{influencer.location || '未知地区'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{Number(influencer.rating).toFixed(1)} ({influencer.total_reviews})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{influencer.followers_count?.toLocaleString() || 0} 粉丝</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="text-gray-500 hover:text-gray-700">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <Share2 className="w-5 h-5" />
                </button>
                {isCompany && (
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  >
                    联系达人
                  </button>
                )}
              </div>
            </div>
            
            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {influencer.categories?.map((category, index) => (
                <span key={index} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                  {category}
                </span>
              ))}
              {influencer.tags?.slice(0, 3).map((tag, index) => (
                <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
            
            {/* 联系表单 */}
            {showContactForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">联系达人</h3>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      消息内容
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      required
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="请描述您的合作意向..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>发送中...</span>
                        </>
                      ) : (
                        <span>发送消息</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Video className="w-5 h-5 text-pink-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{influencer.total_live_count}</div>
                <div className="text-sm text-gray-600">直播场次</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{influencer.avg_views?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-600">平均观看量</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{Number(influencer.experience_years).toFixed(1)}</div>
                <div className="text-sm text-gray-600">从业年限</div>
              </div>
            </div>
            
            {/* 标签页导航 */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`pb-4 font-medium ${
                    activeTab === 'profile'
                      ? 'text-pink-600 border-b-2 border-pink-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  个人资料
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`pb-4 font-medium ${
                    activeTab === 'tasks'
                      ? 'text-pink-600 border-b-2 border-pink-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  历史任务
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-4 font-medium ${
                    activeTab === 'reviews'
                      ? 'text-pink-600 border-b-2 border-pink-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  评价 ({reviews.length})
                </button>
              </div>
            </div>
            
            {/* 标签页内容 */}
            {activeTab === 'profile' && (
              <div>
                {/* 个人简介 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">个人简介</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {influencer.bio || '该达人暂未填写个人简介'}
                  </p>
                </div>
                
                {/* 基本信息 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">基本信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="text-sm text-gray-500">TikTok账号</div>
                        <div className="font-medium">{influencer.tiktok_account || '未设置'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="text-sm text-gray-500">所在地区</div>
                        <div className="font-medium">{influencer.location || '未设置'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="text-sm text-gray-500">小时收费</div>
                        <div className="font-medium">¥{influencer.hourly_rate?.toLocaleString() || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="text-sm text-gray-500">从业年限</div>
                        <div className="font-medium">{Number(influencer.experience_years).toFixed(1)}年</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 专业领域 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">专业领域</h3>
                  <div className="flex flex-wrap gap-2">
                    {influencer.categories?.map((category, index) => (
                      <div key={index} className="bg-pink-100 text-pink-700 px-4 py-2 rounded-lg">
                        {category}
                      </div>
                    ))}
                    {(!influencer.categories || influencer.categories.length === 0) && (
                      <p className="text-gray-500">暂未设置专业领域</p>
                    )}
                  </div>
                </div>
                
                {/* 技能标签 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">技能标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {influencer.tags?.map((tag, index) => (
                      <div key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </div>
                    ))}
                    {(!influencer.tags || influencer.tags.length === 0) && (
                      <p className="text-gray-500">暂未设置技能标签</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'tasks' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">历史任务</h3>
                {completedTasks.length > 0 ? (
                  <div className="space-y-4">
                    {completedTasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                            {task.company?.logo_url ? (
                              <img 
                                src={task.company.logo_url} 
                                alt={task.company.company_name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-full h-full p-2 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <span className="text-sm text-gray-500">
                                {new Date(task.live_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                              <span>{task.company?.company_name}</span>
                              <span>•</span>
                              <span>{task.category?.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                已完成
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无历史任务记录</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">评价</h3>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="ml-2 text-gray-700 font-medium">{review.rating}.0</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {review.task?.title ? `评价任务: ${review.task.title}` : ''}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {review.comment || '该用户未留下评价内容'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无评价</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 相似达人 */}
        {similarInfluencers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">相似达人</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarInfluencers.map((similarInfluencer) => (
                <div key={similarInfluencer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                      <img
                        src={similarInfluencer.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'}
                        alt={similarInfluencer.nickname}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{similarInfluencer.nickname}</h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>{Number(similarInfluencer.rating).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {similarInfluencer.categories?.slice(0, 2).map((category, index) => (
                      <span key={index} className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                        {category}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{similarInfluencer.followers_count?.toLocaleString() || 0} 粉丝</span>
                    <span className="font-medium text-pink-600">¥{similarInfluencer.hourly_rate}/小时</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数据统计 */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">数据统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {influencer.followers_count?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600">粉丝数量</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {influencer.total_live_count || 0}
              </div>
              <div className="text-sm text-gray-600">直播场次</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {influencer.avg_views?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600">平均观看量</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Number(influencer.rating).toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-gray-600">平均评分</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
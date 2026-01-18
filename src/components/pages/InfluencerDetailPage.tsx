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
  Send,
  Building2
} from 'lucide-react'
import { Influencer, Task, Review } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

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
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'cached' | 'fresh'>('loading')
  
  const { user, isCompany } = useAuth()

  useEffect(() => {
    fetchInfluencerDetails()
  }, [influencerId])

  const fetchInfluencerDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      setCacheStatus('loading')
      
      const isProduction = import.meta.env.PROD
      console.log(`Fetching influencer details: ${influencerId} (Environment: ${isProduction ? 'Production' : 'Development'})`)

      if (isProduction) {
        // Production: Use API endpoint
        await fetchFromAPI()
      } else {
        // Development: Use Supabase directly
        await fetchFromSupabase()
      }
      
      console.log(`Successfully fetched influencer details: ${influencerId}`)
      
    } catch (error: any) {
      console.error('Error occurred while fetching influencer details:', error)
      setError(error.message || 'Failed to fetch influencer details, please try again')
    } finally {
      setLoading(false)
    }
  }

  const fetchFromAPI = async () => {
    console.log('🔄 Fetching influencer details from API')
    
    // Fetch influencer details from API (with cache)
    const response = await fetch(`/api/influencer-detail?id=${influencerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Check cache status
    const cacheControl = response.headers.get('Cache-Control')
    const age = response.headers.get('Age')

    if (cacheControl && cacheControl.includes('s-maxage')) {
      setCacheStatus('cached')
      console.log('✅ Influencer details data from server cache')
    } else {
      setCacheStatus('fresh')
      console.log('🔄 Influencer details data from database')
    }

    setInfluencer(data)
    
    // Fetch task application data from API
    const tasksResponse = await fetch(`/api/task-applications?influencerId=${influencerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json()
      // Filter completed tasks
      const completedTasksData = tasksData.filter((task: any) => task.status === 'completed')
      setCompletedTasks(completedTasksData || [])
    }
    
    // Set review data (from API response)
    if (data.reviews) {
      setReviews(data.reviews || [])
    } else {
      setReviews([])
    }
    
    // Set similar influencers (temporarily using empty array)
    setSimilarInfluencers([])
    
    setCacheStatus('fresh')
  }

  const fetchFromSupabase = async () => {
    console.log('🔄 Fetching influencer details from Supabase')
    
    // Fetch influencer details directly from Supabase
    const { data: influencerData, error: influencerError } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', influencerId)
      .single()

    if (influencerError) {
      console.error('Supabase query influencer failed:', influencerError)
      throw new Error(`Database query failed: ${influencerError.message}`)
    }

    if (!influencerData) {
      throw new Error('Influencer does not exist')
    }

    console.log('✅ Successfully fetched influencer details from Supabase:', influencerData)
    setInfluencer(influencerData)
    
    // Fetch task application data
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('task_applications')
      .select('*')
      .eq('influencer_id', influencerId)
      .order('applied_at', { ascending: false })

    if (applicationsError) {
      console.error('Failed to fetch task applications:', applicationsError)
    } else {
      // Filter completed task applications
      const completedApplications = applicationsData?.filter(app => app.status === 'accepted') || []
      
      // If there are accepted task applications, fetch corresponding task details
      if (completedApplications.length > 0) {
        const taskIds = completedApplications.map(app => app.task_id)
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('id', taskIds)
        
        if (!tasksError && tasksData) {
          setCompletedTasks(tasksData)
        } else {
          setCompletedTasks([])
        }
      } else {
        setCompletedTasks([])
      }
    }
    
    // Fetch review data
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('influencer_id', influencerId)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Failed to fetch reviews:', reviewsError)
      setReviews([])
    } else {
      setReviews(reviewsData || [])
    }
    
    // Fetch similar influencers (based on same category)
    if (influencerData.category_id) {
      const { data: similarData, error: similarError } = await supabase
        .from('influencers')
        .select(`
          id,
          nickname,
          avatar_url,
          followers_count,
          rating,
          total_reviews
        `)
        .eq('category_id', influencerData.category_id)
        .neq('id', influencerId)
        .limit(3)

      if (!similarError && similarData) {
        // Use type assertion to simplify processing
        setSimilarInfluencers(similarData as any)
      } else {
        setSimilarInfluencers([])
      }
    } else {
      setSimilarInfluencers([])
    }
    
    setCacheStatus('fresh')
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !isCompany) {
      alert('Please log in with a company account first')
      return
    }
    
    if (!message.trim()) {
      alert('Please enter message content')
      return
    }
    
    try {
      setSubmitting(true)
      
      // There should be message sending logic here, but the message system is not implemented yet
      // Simulate successful sending
      setTimeout(() => {
        alert('Message sent successfully!')
        setMessage('')
        setShowContactForm(false)
        setSubmitting(false)
      }, 1000)
      
    } catch (error) {
      console.error('Error occurred while sending message:', error)
      alert('Error occurred while sending message, please try again')
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load</h2>
            <p className="text-gray-600 mb-6">{error || 'Unable to load influencer details'}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchInfluencerDetails}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onBack}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
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
        {/* Back button and cache status */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              // Check URL parameters to determine if opened from list page
              const urlParams = new URLSearchParams(window.location.search)
              const fromList = urlParams.get('from') === 'list'
              
              if (fromList && window.opener) {
                // If opened from list page in new tab, close current tab
                window.close()
              } else if (window.history.length > 1) {
                // If there is history, go back
                onBack()
              } else {
                // Otherwise navigate to influencer list page
                window.location.href = '/influencers'
              }
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Influencer List</span>
          </button>
          
          {/* Cache status - Hidden in production */}
          {!import.meta.env.PROD && (
            <div className="flex items-center space-x-2">
              {cacheStatus === 'loading' && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              )}
              {cacheStatus === 'cached' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Server Cache</span>
                </div>
              )}
              {cacheStatus === 'fresh' && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Real-time Data</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Influencer profile card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* Cover image */}
          <div className="h-48 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
          
          {/* Basic information */}
          <div className="px-8 pt-0 pb-8 relative">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden absolute -top-12 left-8 bg-gray-100">
              <img
                src={influencer.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={influencer.nickname}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
                  target.onerror = null // Prevent infinite loop
                }}
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.opacity = '1'
                }}
                style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
              />
            </div>
            
            {/* Name and status */}
            <div className="flex justify-between items-start mt-16 mb-6">
              <div className="flex-1 ml-32">
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{influencer.nickname}</h1>
                  {influencer.is_verified && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  )}
                  {!influencer.is_approved && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                      Pending Review
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-gray-600 text-sm">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{influencer.location || 'Unknown Location'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{Number(influencer.rating).toFixed(1)} ({influencer.total_reviews})</span>
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
                    Contact Influencer
                  </button>
                )}
              </div>
            </div>
            
            {/* Tags */}
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
            
            {/* Contact form */}
            {showContactForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Contact Influencer</h3>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Message Content
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      required
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Please describe your collaboration intent..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            

            
            {/* Tab navigation */}
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
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`pb-4 font-medium ${
                    activeTab === 'tasks'
                      ? 'text-pink-600 border-b-2 border-pink-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  History Tasks
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-4 font-medium ${
                    activeTab === 'reviews'
                      ? 'text-pink-600 border-b-2 border-pink-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reviews ({reviews.length})
                </button>
              </div>
            </div>
            
            {/* Tab content */}
            {activeTab === 'profile' && (
              <div>
                {/* Personal introduction */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Introduction</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {influencer.bio || 'This influencer has not filled in their personal introduction'}
                  </p>
                </div>
                
                {/* Basic information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="text-sm text-gray-500">TikTok Account</div>
                        <div className="font-medium">***</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="font-medium">{influencer.location || 'Not Set'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="text-sm text-gray-500">Hourly Rate</div>
                        <div className="font-medium">***</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="text-sm text-gray-500">Years of Experience</div>
                        <div className="font-medium">{Number(influencer.experience_years).toFixed(1)} years</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Professional fields */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Fields</h3>
                  <div className="flex flex-wrap gap-2">
                    {influencer.categories?.map((category, index) => (
                      <div key={index} className="bg-pink-100 text-pink-700 px-4 py-2 rounded-lg">
                        {category}
                      </div>
                    ))}
                    {(!influencer.categories || influencer.categories.length === 0) && (
                      <p className="text-gray-500">Professional fields not set</p>
                    )}
                  </div>
                </div>
                
                {/* Skill tags */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Skill Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {influencer.tags?.map((tag, index) => (
                      <div key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </div>
                    ))}
                    {(!influencer.tags || influencer.tags.length === 0) && (
                      <p className="text-gray-500">Skill tags not set</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'tasks' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">History Tasks</h3>
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
                                Completed
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
                    <p className="text-gray-500">No history task records</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
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
                              {review.task_id ? `Task ID: ${review.task_id}` : ''}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {review.comment || 'This user did not leave a review comment'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No reviews</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar influencers */}
        {similarInfluencers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Similar Influencers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarInfluencers.map((similarInfluencer) => (
                <div key={similarInfluencer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden shadow-sm">
                      <img
                        src={similarInfluencer.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'}
                        alt={similarInfluencer.nickname}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
                          target.onerror = null // Prevent infinite loop
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.opacity = '1'
                        }}
                        style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
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
                    <span className="text-gray-600">{similarInfluencer.followers_count?.toLocaleString() || 0} followers</span>
                    <span className="font-medium text-pink-600">${similarInfluencer.hourly_rate}/hour</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
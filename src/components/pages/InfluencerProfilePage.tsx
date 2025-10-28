import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  DollarSign, 
  Clock, 
  Tag, 
  Save,
  CheckCircle,
  X,
  Camera,
  Briefcase,
  Users,
  Star,
  Video,
  TrendingUp,
  Edit,
  Loader,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { supabase, Influencer } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/useAuth'

export function InfluencerProfilePage() {
  const { user, profile, loading: authLoading } = useAuthContext()
  
  // 添加调试日志 - 仅在开发环境显示
  if (import.meta.env.DEV) {
    console.log('InfluencerProfilePage 渲染:', { user, profile, authLoading })
  }
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    real_name: '',
    tiktok_account: '',
    bio: '',
    location: '',
    categories: [] as string[],
    tags: [] as string[],
    hourly_rate: 0,
    experience_years: 0
  })
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarKey, setAvatarKey] = useState(0)

  const availableCategories = [
    'Beauty & Skincare', 'Fashion & Style', 'Food & Lifestyle', 'Technology', 
    'Fitness & Sports', 'Baby & Parenting', 'Home & Interior', 'Books & Education'
  ]

  // 验证PICUI API密钥是否配置
  const PICUI_API_KEY = import.meta.env.VITE_PICUI_API_KEY as string
  if (!PICUI_API_KEY) {
    console.warn('PICUI API密钥未配置，头像上传功能可能无法正常工作')
  }

  useEffect(() => {
    if (user && !authLoading) {
      fetchInfluencerProfile()
    }
  }, [user, authLoading])

  const fetchInfluencerProfile = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching influencer profile, User ID:', user.id)
      
      // 获取当前用户的达人资料
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('Influencer profile fetch result:', { influencerData, influencerError })

      if (influencerError) {
        if (influencerError.code === 'PGRST116') {
          // 没有找到记录，可能是新用户
          console.log('No influencer profile found, may need to create new profile')
          setInfluencer(null)
        } else {
          console.error('Failed to fetch influencer profile:', influencerError)
          setError('Failed to fetch profile, please try again')
        }
      } else {
        console.log('成功获取达人资料:', influencerData)
        setInfluencer(influencerData)
        // 填充表单数据
        const formDataToSet = {
          nickname: influencerData.nickname || '',
          real_name: influencerData.real_name || '',
          tiktok_account: influencerData.tiktok_account || '',
          bio: influencerData.bio || '',
          location: influencerData.location || '',
          categories: influencerData.categories || [],
          tags: influencerData.tags || [],
          hourly_rate: influencerData.hourly_rate || 0,
          experience_years: influencerData.experience_years || 0
        }
        console.log('设置表单数据:', formDataToSet)
        setFormData(formDataToSet)
        setAvatarPreview(influencerData.avatar_url || null)
      }
    } catch (error) {
        console.error('Error occurred while fetching influencer profile:', error)
      setError('An error occurred while fetching profile, please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourly_rate' || name === 'experience_years' ? Number(value) : value
    }))
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => {
      const categories = [...prev.categories]
      if (categories.includes(category)) {
        return { ...prev, categories: categories.filter(c => c !== category) }
      } else {
        return { ...prev, categories: [...categories, category] }
      }
    })
  }

  const handleAddCategory = () => {
    if (!newCategory.trim()) return
    if (formData.categories.includes(newCategory.trim())) {
      alert('This category already exists')
      return
    }
    const updatedCategories = [...formData.categories, newCategory.trim()]
    console.log('Adding expertise area:', newCategory.trim(), 'Updated categories:', updatedCategories)
    setFormData(prev => ({
      ...prev,
      categories: updatedCategories
    }))
    setNewCategory('')
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return
    if (formData.tags.includes(newTag.trim())) {
      alert('This tag already exists')
      return
    }
    const updatedTags = [...formData.tags, newTag.trim()]
    console.log('Adding skill tag:', newTag.trim(), 'Updated tags:', updatedTags)
    setFormData(prev => ({
      ...prev,
      tags: updatedTags
    }))
    setNewTag('')
  }

  const handleRemoveCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }))
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview('') // 清空预览
      setError(null)
      
      console.log('开始上传头像:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      
      try {
        // 使用PICUI图床API
        const formData = new FormData()
        formData.append('file', file)
        formData.append('permission', '1') // 公开权限

        console.log('发送PICUI API请求...')
        const response = await fetch('https://picui.cn/api/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_PICUI_API_KEY}`,
            'Accept': 'application/json'
          },
          body: formData
        })

        const result = await response.json()
        console.log('PICUI API响应:', result)

        if (result.status && result.data?.links?.url) {
          setAvatarPreview(result.data.links.url)
          console.log('头像上传成功:', result.data.links.url)
        } else {
          setError(result.message || 'Upload failed')
          console.error('Avatar upload failed:', result)
        }
      } catch (error: any) {
        console.error('头像上传异常:', error)
        setError(error.message || 'Upload error')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
          setError('User not logged in')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      console.log('开始保存资料，表单数据:', formData)
      
      // 验证必填字段
      if (!formData.nickname) {
        setError('Nickname cannot be empty')
        return
      }
      
      // 上传头像（如果有）
      let avatarUrl = influencer?.avatar_url || null
      if (avatarPreview) {
        avatarUrl = avatarPreview
      }
      
      const updateData = {
        ...formData,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }
      
      console.log('准备保存的数据:', updateData)
      
      if (influencer) {
        // 更新现有资料
        console.log('更新现有资料，用户ID:', user.id)
        const { data: updateResult, error: updateError } = await supabase
          .from('influencers')
          .update(updateData)
          .eq('user_id', user.id)
          .select()
        
        console.log('更新结果:', { updateResult, updateError })
        
        if (updateError) {
          console.error('更新资料失败:', updateError)
          setError('Failed to update profile, please try again')
          return
        }
        
        // 立即更新本地状态
        if (updateResult && updateResult[0]) {
          setInfluencer(updateResult[0])
        }
      } else {
        // 创建新资料
        console.log('创建新资料，用户ID:', user.id)
        const { data: insertResult, error: insertError } = await supabase
          .from('influencers')
          .insert({
            user_id: user.id,
            ...updateData
          })
          .select()
        
        console.log('创建结果:', { insertResult, insertError })
        
        if (insertError) {
          console.error('创建资料失败:', insertError)
          setError('Failed to create profile, please try again')
          return
        }
        
        // 立即更新本地状态
        if (insertResult && insertResult[0]) {
          setInfluencer(insertResult[0])
        }
      }
      
      setSuccess('Profile saved successfully!')
      setEditMode(false)
      
      // 清除头像相关状态
      setAvatarFile(null)
      setAvatarPreview(null)
      setAvatarKey(prev => prev + 1) // 强制重新渲染头像
      
      // 重新获取资料以确保数据同步
      await fetchInfluencerProfile()
      
      // 延迟更新头像显示
      setTimeout(() => {
        setAvatarKey(prev => prev + 1)
      }, 500)
      
    } catch (error) {
      console.error('保存资料时发生错误:', error)
      setError('An error occurred while saving profile, please try again')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
            <p className="text-gray-600 mt-2">Loading your profile</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
            <p className="text-gray-600 mb-6">Please log in to access your profile</p>
          </div>
        </div>
      </div>
    )
  }

  if (profile?.user_type !== 'influencer') {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-6">Only creator users can access this page</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Creator Profile</h1>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              editMode 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-pink-500 text-white hover:bg-pink-600'
            } transition-colors`}
          >
            {editMode ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        {/* 主内容区 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* 封面图 */}
          <div className="h-48 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 relative">
            {editMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                  Change Cover
                </button>
              </div>
            )}
          </div>
          
          {/* 个人资料 */}
          <div className="px-8 pt-0 pb-8 relative">
            {/* 头像 */}
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden absolute -top-12 right-8" key={`avatar-${avatarKey}-${influencer?.avatar_url}`}>
              {editMode ? (
                <div className="relative w-full h-full">
                  <img
                    src={avatarPreview || influencer?.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              ) : (
                <img
                  src={avatarPreview || influencer?.avatar_url ? `${avatarPreview || influencer?.avatar_url}?t=${Date.now()}` : 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
                  }}
                />
              )}
            </div>
            
            {/* 基本信息 */}
            <div className="mt-16 mb-8">
              {editMode ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nickname <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter your nickname"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Real Name
                      </label>
                      <input
                        type="text"
                        name="real_name"
                        value={formData.real_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter your real name (optional)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TikTok Account
                      </label>
                      <input
                        type="text"
                        name="tiktok_account"
                        value={formData.tiktok_account}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter your TikTok account"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter your location"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate (CNY)
                      </label>
                      <input
                        type="number"
                        name="hourly_rate"
                        value={formData.hourly_rate}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter your hourly rate"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        name="experience_years"
                        value={formData.experience_years}
                        onChange={handleInputChange}
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter your experience in years"
                      />
                    </div>
                  </div>
                  
                  {/* 个人简介 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                      placeholder="Briefly introduce yourself..."
                    />
                  </div>
                  
                  {/* 专业领域 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Areas of Expertise
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.categories.map((category, index) => (
                        <div key={index} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                          <span>{category}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveCategory(category)}
                            className="text-pink-700 hover:text-pink-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="">Select category...</option>
                        {availableCategories
                          .filter(cat => !formData.categories.includes(cat))
                          .map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))
                        }
                      </select>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* 技能标签 */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills & Tags
                      </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, index) => (
                        <div key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                          <span>{tag}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-purple-700 hover:text-purple-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter tag..."
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* 提交按钮 */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {/* 名称和状态 */}
                  <div className="flex items-center space-x-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{influencer?.nickname || 'No Nickname Set'}</h2>
                    {influencer?.is_verified && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                    {influencer?.is_approved ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        Approved
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                        Pending
                      </span>
                    )}
                  </div>
                  
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {influencer?.real_name && (
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Real Name</div>
                          <div className="font-medium">{influencer.real_name}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">{user.email}</div>
                      </div>
                    </div>
                    
                    {influencer?.tiktok_account && (
                      <div className="flex items-center space-x-3">
                        <Instagram className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">TikTok Account</div>
                          <div className="font-medium">{influencer.tiktok_account}</div>
                        </div>
                      </div>
                    )}
                    
                    {influencer?.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Location</div>
                          <div className="font-medium">{influencer.location}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Hourly Rate</div>
                        <div className="font-medium">${influencer?.hourly_rate?.toLocaleString() || 'Not Set'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Experience (Years)</div>
                        <div className="font-medium">{influencer?.experience_years || 'Not Set'} years</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 个人简介 */}
                  {influencer?.bio && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
                      <p className="text-gray-700 whitespace-pre-line">{influencer.bio}</p>
                    </div>
                  )}
                  
                  {/* 专业领域 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Areas of Expertise</h3>
                    {influencer?.categories && influencer.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {influencer.categories.map((category, index) => (
                          <span key={index} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No expertise areas set</p>
                    )}
                  </div>
                  
                  {/* 技能标签 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills & Tags</h3>
                    {influencer?.tags && influencer.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {influencer.tags.map((tag, index) => (
                          <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No skills & tags set</p>
                    )}
                  </div>
                  
                  {/* Account Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          influencer?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <div className="text-sm text-gray-500">Account Status</div>
                          <div className="font-medium">
                            {influencer?.status === 'active' ? 'Active' : 
                             influencer?.status === 'inactive' ? 'Inactive' : 
                             influencer?.status === 'suspended' ? 'Suspended' : 'Unknown'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          influencer?.is_approved ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <div className="text-sm text-gray-500">Review Status</div>
                          <div className="font-medium">
                            {influencer?.is_approved ? 'Approved' : 'Pending'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          influencer?.is_verified ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <div className="text-sm text-gray-500">Verification Status</div>
                          <div className="font-medium">
                            {influencer?.is_verified ? 'Verified' : 'Not Verified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 数据统计卡片 */}
        {!editMode && influencer && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {influencer.followers_count?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {influencer.total_live_count || 0}
                </div>
                <div className="text-sm text-gray-600">Live Sessions</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {influencer.avg_views?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Average Views</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {Number(influencer.rating).toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-gray-600">Average Rating ({influencer.total_reviews || 0})</div>
              </div>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {!influencer && !editMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <Briefcase className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">Complete Your Creator Profile</h3>
            <p className="text-amber-700 mb-6 max-w-2xl mx-auto">
              You haven't set up your creator profile yet. A complete profile helps brands get to know you better and increases collaboration opportunities.
            </p>
            <button
              onClick={() => setEditMode(true)}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Set Up Now
            </button>
          </div>
        )}

        {/* Review Notice */}
        {influencer && !influencer.is_approved && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Under Review</h3>
                  <p className="text-blue-700 mb-4">
                  Your creator profile is under review. Once approved, you'll be able to receive task invitations and apply for tasks.
                  Review typically takes 1-3 business days. Please wait patiently.
                </p>
                <div className="text-sm text-blue-600">
                  Submitted: {new Date(influencer.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Completion Tips */}
        {influencer && !editMode && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Improve Profile Completeness</h3>
            <p className="text-gray-600 mb-6">
              A complete profile can increase your chances of being selected by brands. Here are some suggestions:
            </p>
            <div className="space-y-3">
              {!influencer.bio && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Add a bio to introduce your professional background and expertise</span>
                </div>
              )}
              
              {(!influencer.categories || influencer.categories.length === 0) && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Select your areas of expertise</span>
                </div>
              )}
              
              {(!influencer.tags || influencer.tags.length === 0) && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Add skill tags to showcase your professional abilities</span>
                </div>
              )}
              
              {!influencer.tiktok_account && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Link your TikTok account</span>
                </div>
              )}
              
              {!influencer.location && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Enter your location</span>
                </div>
              )}
              
              {!influencer.avatar_url && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Upload your avatar</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
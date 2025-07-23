import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  FileText, 
  Users,
  Save,
  CheckCircle,
  X,
  Camera,
  Briefcase,
  Edit,
  Loader,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { supabase, Company } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/useAuth'

export function CompanyProfilePage() {
  const { user, profile, loading: authLoading } = useAuthContext()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    business_license: '',
    industry: '',
    company_size: '',
    website: '',
    description: ''
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoKey, setLogoKey] = useState(0)

  const companySizes = [
    '1-10人', '11-50人', '51-100人', '101-500人', '501-1000人', '1000人以上'
  ]

  const industries = [
    '美妆护肤', '服装时尚', '数码科技', '美食生活', 
    '母婴用品', '家居家装', '健康保健', '教育培训', '其他'
  ]

  useEffect(() => {
    if (user && !authLoading) {
      fetchCompanyProfile()
    }
  }, [user, authLoading])

  const fetchCompanyProfile = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // 获取当前用户的企业资料
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (companyError) {
        if (companyError.code === 'PGRST116') {
          // 没有找到记录，可能是新用户
          console.log('未找到企业资料，可能需要创建新资料')
          setCompany(null)
        } else {
          console.error('获取企业资料失败:', companyError)
          setError('获取资料失败，请重试')
        }
      } else {
        setCompany(companyData)
        // 填充表单数据
        setFormData({
          company_name: companyData.company_name || '',
          contact_person: companyData.contact_person || '',
          business_license: companyData.business_license || '',
          industry: companyData.industry || '',
          company_size: companyData.company_size || '',
          website: companyData.website || '',
          description: companyData.description || ''
        })
        setLogoPreview(companyData.logo_url || null)
      }
    } catch (error) {
      console.error('获取企业资料时发生错误:', error)
      setError('获取资料时发生错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      
      // 创建预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null
    
    try {
      // 生成唯一文件名
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`
      
      // 上传到 Storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, logoFile)
      
      if (uploadError) {
        console.error('上传Logo失败:', uploadError)
        throw new Error('上传Logo失败')
      }
      
      // 获取公共URL
      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath)
      
      return data.publicUrl
    } catch (error) {
      console.error('处理Logo时发生错误:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('用户未登录')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // 验证必填字段
      if (!formData.company_name || !formData.contact_person) {
        setError('公司名称和联系人不能为空')
        return
      }
      
      // 上传Logo（如果有）
      let logoUrl = company?.logo_url || null
      if (logoFile) {
        const newLogoUrl = await uploadLogo()
        if (newLogoUrl) {
          logoUrl = newLogoUrl
        }
      }
      
      const updateData = {
        ...formData,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      }
      
      if (company) {
        // 更新现有资料
        const { data: updateResult, error: updateError } = await supabase
          .from('companies')
          .update(updateData)
          .eq('user_id', user.id)
          .select()
        
        if (updateError) {
          console.error('更新资料失败:', updateError)
          setError('更新资料失败，请重试')
          return
        }
        
        // 立即更新本地状态
        if (updateResult && updateResult[0]) {
          setCompany(updateResult[0])
        }
      } else {
        // 创建新资料
        const { data: insertResult, error: insertError } = await supabase
          .from('companies')
          .insert({
            user_id: user.id,
            ...updateData
          })
          .select()
        
        if (insertError) {
          console.error('创建资料失败:', insertError)
          setError('创建资料失败，请重试')
          return
        }
        
        // 立即更新本地状态
        if (insertResult && insertResult[0]) {
          setCompany(insertResult[0])
        }
      }
      
      setSuccess('资料保存成功！')
      setEditMode(false)
      
      // 清除Logo相关状态
      setLogoFile(null)
      setLogoPreview(null)
      setLogoKey(prev => prev + 1) // 强制重新渲染Logo
      
      // 重新获取资料以确保数据同步
      await fetchCompanyProfile()
      
    } catch (error) {
      console.error('保存资料时发生错误:', error)
      setError('保存资料时发生错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">加载中...</h2>
            <p className="text-gray-600 mt-2">正在获取您的资料</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">未登录</h2>
            <p className="text-gray-600 mb-6">请先登录后再访问个人中心</p>
          </div>
        </div>
      </div>
    )
  }

  if (profile?.user_type !== 'company') {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">权限不足</h2>
            <p className="text-gray-600 mb-6">只有企业用户可以访问此页面</p>
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
            <h1 className="text-2xl font-bold text-gray-900">企业中心</h1>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              editMode 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } transition-colors`}
          >
            {editMode ? (
              <>
                <X className="w-4 h-4" />
                <span>取消编辑</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                <span>编辑资料</span>
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
          <div className="h-48 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative">
            {editMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                  更换封面
                </button>
              </div>
            )}
          </div>
          
          {/* 企业资料 */}
          <div className="px-8 pt-0 pb-8 relative">
            {/* Logo */}
            <div className="w-24 h-24 rounded-lg border-4 border-white overflow-hidden absolute -top-12 right-8 bg-white" key={`logo-${logoKey}-${company?.logo_url}`}>
              {editMode ? (
                <div className="relative w-full h-full">
                  <img
                    src={logoPreview || company?.logo_url || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                    alt="Logo预览"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>
              ) : (
                <img
                  src={company?.logo_url || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt="公司Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200'
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
                        公司名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入公司名称"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        联系人 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入联系人姓名"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        营业执照号
                      </label>
                      <input
                        type="text"
                        name="business_license"
                        value={formData.business_license}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入营业执照号"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        所属行业
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">请选择行业</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        公司规模
                      </label>
                      <select
                        name="company_size"
                        value={formData.company_size}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">请选择公司规模</option>
                        {companySizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        公司网站
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入公司网站"
                      />
                    </div>
                  </div>
                  
                  {/* 公司介绍 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司介绍
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="请简要介绍公司情况..."
                    />
                  </div>
                  
                  {/* 提交按钮 */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>保存中...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>保存资料</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {/* 名称和状态 */}
                  <div className="flex items-center space-x-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{company?.company_name || '未设置公司名称'}</h2>
                    {company?.is_verified && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>已认证</span>
                      </span>
                    )}
                  </div>
                  
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {company?.contact_person && (
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">联系人</div>
                          <div className="font-medium">{company.contact_person}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">邮箱</div>
                        <div className="font-medium">{user.email}</div>
                      </div>
                    </div>
                    
                    {company?.industry && (
                      <div className="flex items-center space-x-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">所属行业</div>
                          <div className="font-medium">{company.industry}</div>
                        </div>
                      </div>
                    )}
                    
                    {company?.company_size && (
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">公司规模</div>
                          <div className="font-medium">{company.company_size}</div>
                        </div>
                      </div>
                    )}
                    
                    {company?.business_license && (
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">营业执照号</div>
                          <div className="font-medium">{company.business_license}</div>
                        </div>
                      </div>
                    )}
                    
                    {company?.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">公司网站</div>
                          <div className="font-medium">
                            <a 
                              href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {company.website}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 公司介绍 */}
                  {company?.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">公司介绍</h3>
                      <p className="text-gray-700 whitespace-pre-line">{company.description}</p>
                    </div>
                  )}
                  
                  {/* 账号状态 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">账号状态</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          company?.is_verified ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <div className="text-sm text-gray-500">认证状态</div>
                          <div className="font-medium">
                            {company?.is_verified ? '已认证' : '未认证'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div>
                          <div className="text-sm text-gray-500">账号状态</div>
                          <div className="font-medium">正常</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        {!company && !editMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <Building2 className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">完善您的企业资料</h3>
            <p className="text-amber-700 mb-6 max-w-2xl mx-auto">
              您还没有设置企业资料。完善资料可以帮助达人更好地了解您的企业，增加合作机会。
            </p>
            <button
              onClick={() => setEditMode(true)}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              立即设置
            </button>
          </div>
        )}

        {/* 认证提示 */}
        {company && !company.is_verified && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">企业认证</h3>
                <p className="text-blue-700 mb-4">
                  完成企业认证可以提高企业可信度，增加达人合作意愿。
                  认证需要提供有效的营业执照和其他相关证明材料。
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  申请认证
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 完善资料提示 */}
        {company && !editMode && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">提升资料完整度</h3>
            <p className="text-gray-600 mb-6">
              完善的资料可以提高您的企业形象和吸引更多优质达人。以下是一些建议：
            </p>
            <div className="space-y-3">
              {!company.description && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">添加公司介绍，展示企业文化和优势</span>
                </div>
              )}
              
              {!company.industry && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">选择所属行业</span>
                </div>
              )}
              
              {!company.website && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">添加公司网站链接</span>
                </div>
              )}
              
              {!company.business_license && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">填写营业执照号，有助于企业认证</span>
                </div>
              )}
              
              {!company.logo_url && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">上传公司Logo</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
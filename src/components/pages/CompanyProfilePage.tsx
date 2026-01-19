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
    '1-10 employees', '11-50 employees', '51-100 employees', '101-500 employees', '501-1000 employees', '1000+ employees'
  ]

  const industries = [
    'Beauty & Skincare', 'Fashion & Apparel', 'Digital Technology', 'Food & Lifestyle', 
    'Baby & Maternity', 'Home & Furnishing', 'Health & Wellness', 'Education & Training', 'Other'
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
      
      // Get current user's company profile
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (companyError) {
        if (companyError.code === 'PGRST116') {
          // No record found, may be a new user
          console.log('Company profile not found, may need to create new profile')
          setCompany(null)
        } else {
          console.error('Failed to fetch company profile:', companyError)
          setError('Failed to fetch profile, please try again')
        }
      } else {
        setCompany(companyData)
        // Populate form data
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
      console.error('Error occurred while fetching company profile:', error)
      setError('Error occurred while fetching profile, please try again')
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

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview('') // Clear preview
      setError(null)
      
      console.log('Starting company logo upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
    
    try {
        // Use PICUI image hosting API
        const formData = new FormData()
        formData.append('file', file)
        formData.append('permission', '1') // Public permission

        console.log('Sending PICUI API request...')
        const response = await fetch('https://picui.cn/api/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_PICUI_API_KEY}`,
            'Accept': 'application/json'
          },
          body: formData
        })

        const result = await response.json()
        console.log('PICUI API response:', result)

        if (result.status && result.data?.links?.url) {
          setLogoPreview(result.data.links.url)
          console.log('Company logo uploaded successfully:', result.data.links.url)
        } else {
          setError(result.message || 'Upload failed')
          console.error('Company logo upload failed:', result)
        }
      } catch (error: any) {
        console.error('Company logo upload error:', error)
        setError(error.message || 'Upload error')
      }
    }
  }

  // Verify PICUI API key is configured
  const PICUI_API_KEY = import.meta.env.VITE_PICUI_API_KEY as string
  if (!PICUI_API_KEY) {
    console.warn('PICUI API key not configured, logo upload feature may not work properly')
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
      
      // Validate required fields
      if (!formData.company_name || !formData.contact_person) {
        setError('Company name and contact person cannot be empty')
        return
      }
      
      // Upload Logo (if any)
      let logoUrl = company?.logo_url || null
      if (logoPreview) {
        logoUrl = logoPreview
      }
      
      const updateData = {
        ...formData,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      }
      
      if (company) {
        // Update existing profile
        const { data: updateResult, error: updateError } = await supabase
          .from('companies')
          .update(updateData)
          .eq('user_id', user.id)
          .select()
        
        if (updateError) {
          console.error('Failed to update profile:', updateError)
          setError('Failed to update profile, please try again')
          return
        }
        
        // Immediately update local state
        if (updateResult && updateResult[0]) {
          setCompany(updateResult[0])
        }
      } else {
        // Create new profile
        const { data: insertResult, error: insertError } = await supabase
          .from('companies')
          .insert({
            user_id: user.id,
            ...updateData
          })
          .select()
        
        if (insertError) {
          console.error('Failed to create profile:', insertError)
          setError('Failed to create profile, please try again')
          return
        }
        
        // Immediately update local state
        if (insertResult && insertResult[0]) {
          setCompany(insertResult[0])
        }
      }
      
      setSuccess('Profile saved successfully!')
      setEditMode(false)
      
      // Clear logo-related state
      setLogoFile(null)
      setLogoPreview(null)
      setLogoKey(prev => prev + 1) // Force re-render logo
      
      // Refetch profile to ensure data synchronization
      await fetchCompanyProfile()
      
    } catch (error) {
      console.error('Error occurred while saving profile:', error)
      setError('Error occurred while saving profile, please try again')
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
            <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
            <p className="text-gray-600 mt-2">Fetching your profile</p>
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

  if (profile?.user_type !== 'company') {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-6">Only company users can access this page</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Company Center</h1>
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
                <span>Cancel Edit</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        {/* Error and success messages */}
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

        {/* Main content area */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* Cover image */}
          <div className="h-48 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative">
            {editMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                  Change Cover
                </button>
              </div>
            )}
          </div>
          
          {/* Company profile */}
          <div className="px-8 pt-0 pb-8 relative">
            {/* Logo */}
            <div className="w-24 h-24 rounded-lg border-4 border-white overflow-hidden absolute -top-12 right-8 bg-white" key={`logo-${logoKey}-${company?.logo_url}`}>
              {editMode ? (
                <div className="relative w-full h-full">
                  <img
                    src={logoPreview || company?.logo_url || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                    alt="Logo Preview"
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
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200'
                  }}
                />
              )}
            </div>
            
            {/* Basic information */}
            <div className="mt-16 mb-8">
              {editMode ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter company name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter contact person name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business License Number
                      </label>
                      <input
                        type="text"
                        name="business_license"
                        value={formData.business_license}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter business license number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select industry</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size
                      </label>
                      <select
                        name="company_size"
                        value={formData.company_size}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select company size</option>
                        {companySizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter company website"
                      />
                    </div>
                  </div>
                  
                  {/* Company description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Briefly introduce your company..."
                    />
                  </div>
                  
                  {/* Submit button */}
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
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
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
                  {/* Name and status */}
                  <div className="flex items-center space-x-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{company?.company_name || 'Company name not set'}</h2>
                    {company?.is_verified && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  
                  {/* Basic information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {company?.contact_person && (
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Contact Person</div>
                          <div className="font-medium">{company.contact_person}</div>
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
                    
                    {company?.industry && (
                      <div className="flex items-center space-x-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Industry</div>
                          <div className="font-medium">{company.industry}</div>
                        </div>
                      </div>
                    )}
                    
                    {company?.company_size && (
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Company Size</div>
                          <div className="font-medium">{company.company_size}</div>
                        </div>
                      </div>
                    )}
                    
                    {company?.business_license && (
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Business License Number</div>
                          <div className="font-medium">{company.business_license}</div>
                        </div>
                      </div>
                    )}
                    
                    {company?.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Company Website</div>
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
                  
                  {/* Company description */}
                  {company?.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Description</h3>
                      <p className="text-gray-700 whitespace-pre-line">{company.description}</p>
                    </div>
                  )}
                  
                  {/* Account status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          company?.is_verified ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <div className="text-sm text-gray-500">Verification Status</div>
                          <div className="font-medium">
                            {company?.is_verified ? 'Verified' : 'Not Verified'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div>
                          <div className="text-sm text-gray-500">Account Status</div>
                          <div className="font-medium">Active</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prompt message */}
        {!company && !editMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <Building2 className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">Complete Your Company Profile</h3>
            <p className="text-amber-700 mb-6 max-w-2xl mx-auto">
              You haven't set up your company profile yet. Completing your profile can help creators better understand your company and increase collaboration opportunities.
            </p>
            <button
              onClick={() => setEditMode(true)}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Set Up Now
            </button>
          </div>
        )}

        {/* Verification prompt */}
        {company && !company.is_verified && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Company Verification</h3>
                <p className="text-blue-700 mb-4">
                  Completing company verification can improve company credibility and increase creator collaboration willingness.
                  Verification requires providing a valid business license and other relevant supporting documents.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Apply for Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile completion tips */}
        {company && !editMode && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Improve Profile Completeness</h3>
            <p className="text-gray-600 mb-6">
              A complete profile can improve your company image and attract more quality creators. Here are some suggestions:
            </p>
            <div className="space-y-3">
              {!company.description && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Add company description to showcase company culture and advantages</span>
                </div>
              )}
              
              {!company.industry && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Select industry</span>
                </div>
              )}
              
              {!company.website && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Add company website link</span>
                </div>
              )}
              
              {!company.business_license && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Fill in business license number to help with company verification</span>
                </div>
              )}
              
              {!company.logo_url && (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Upload company logo</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
﻿import React, { useState, useRef } from 'react'
import { Mail, Lock, User, Building2, Eye, EyeOff, Loader, Send, MessageSquare, XCircle, CheckCircle, ArrowLeft, Globe } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { TalentType, talentTypeConfig } from '../../types/talent'
import { TalentTypeForm } from '../talent/TalentTypeForm'
import { TalentQuestionForm } from '../talent/TalentQuestionForm'
import { countries, Country } from '../../types/countries'

export function SignupPage() {
  const [userType, setUserType] = useState<'influencer' | 'company'>('influencer')
  const [talentType, setTalentType] = useState<TalentType | null>(null)
  const [talentData, setTalentData] = useState<any>({})

  // Basic information
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country, setCountry] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Email verification related states
  const [emailCodeSent, setEmailCodeSent] = useState('')
  const [emailInputCode, setEmailInputCode] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  // General states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // AOKSend email API configuration
  const EMAIL_API_URL = 'https://www.aoksend.com/index/api/send_email'
  const EMAIL_API_KEY = import.meta.env.VITE_AOKSEND_API_KEY as string
  const EMAIL_TEMPLATE_ID = 'E_125139060306'

  const { signUpWithDetails } = useAuth()
  const navigate = useNavigate()

  // Send email verification code function
  const sendEmailCode = async () => {
    if (!email) {
      setEmailError('Please enter email address')
      return
    }
    // 生成统一的验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setEmailCodeSent(code)
    setSendingEmail(true)
    setEmailError('')
    setEmailSuccess('')

    try {
      // 使用生成的验证码发送邮件
      const formData = new URLSearchParams()
      formData.append('app_key', EMAIL_API_KEY)
      formData.append('to', email)
      formData.append('template_id', EMAIL_TEMPLATE_ID)
      formData.append('data', JSON.stringify({ code }))

      console.log('Sending email verification code to:', email)
      console.log('Generated code:', code)
      console.log('Using API URL:', EMAIL_API_URL)

      // 尝试发送邮件
      try {
        const res = await fetch(EMAIL_API_URL, { 
          method: 'POST', 
          body: formData,
          headers: {
            'Accept': 'application/json',
          }
        })

        console.log('Response status:', res.status)
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        const data = await res.json()
        console.log('Email API response:', data)
        
        const isSuccess = data.code === 0 || data.success === true || data.status === 'success' || 
                         (data.message && data.message.includes('success'))
        
        if (isSuccess) {
          setEmailSuccess('验证码已发送')
          setEmailError('')
        } else {
          setEmailError(data.message || '发送失败')
          setEmailSuccess('')
        }
      } catch (fetchError: any) {
        // 如果邮件发送失败（如SSL证书错误），在开发环境中显示验证码
        console.warn('Email sending failed:', fetchError)
        
        const isDevelopment = import.meta.env.DEV
        if (isDevelopment) {
          console.log('开发环境：由于邮件发送失败，显示验证码（仅用于测试）')
          console.log('验证码:', code)
          setEmailSuccess(`由于邮件服务问题，验证码已生成（仅用于测试）: ${code}`)
          setEmailError('')
        } else {
          throw fetchError
        }
      }
    } catch (e: any) {
      console.error('Email sending error:', e)
      setEmailError('Send failed: ' + (e.message || 'Network error'))
      setEmailSuccess('')
    } finally {
      setSendingEmail(false)
    }
  }

  // Verify email verification code
  const verifyEmailCode = (currentValue: string) => {
    const valueToVerify = currentValue || emailInputCode;
    console.log('Verification value comparison', {
      actualInput: valueToVerify,
      serverCode: emailCodeSent
    });

    if (valueToVerify.trim() === emailCodeSent?.trim()) {
      setEmailVerified(true);
      setEmailSuccess('Verification successful!');
      setEmailError('');
    } else {
      setEmailError('Incorrect verification code, please try again');
      setEmailSuccess('');
    }
  }

  const inputRef = useRef('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    inputRef.current = value;
    setEmailInputCode(value);

    if (value.length === 6 && !loading) {
      verifyEmailCode(value);
    }
  };

  // Change talentType to array
  const [selectedTalentTypes, setSelectedTalentTypes] = useState<TalentType[]>([])
  // Change talentData to object, key is talentType
  const [talentDataMap, setTalentDataMap] = useState<Record<TalentType, any>>({} as Record<TalentType, any>)

  // Handle talent type selection
  const handleTalentTypeSelect = (type: TalentType) => {
    setSelectedTalentTypes(prev => {
      const isSelected = prev.includes(type)
      if (isSelected) {
        // If already selected, remove
        const newTypes = prev.filter(t => t !== type)
        // Also remove corresponding form data
        const newTalentDataMap = { ...talentDataMap }
        delete newTalentDataMap[type]
        setTalentDataMap(newTalentDataMap)
        return newTypes
      } else {
        // If not selected, add
        return [...prev, type]
      }
    })
  }

  // Handle question form data update
  const handleTalentDataChange = (type: TalentType, data: any) => {
    setTalentDataMap(prev => ({
      ...prev,
      [type]: data
    }))
  }

  // Validate form
  const validateForm = () => {
    if (!email) {
      setError('Please enter email address')
      return false
    }
    if (!emailVerified) {
      setError('Please complete email verification first')
      return false
    }
    if (!password) {
      setError('Please enter password')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (userType === 'influencer') {
      if (selectedTalentTypes.length === 0) {
        setError('Please select at least one talent type')
        return false
      }
      // Validate required fields for each selected type
      for (const type of selectedTalentTypes) {
        const data = talentDataMap[type]
        if (!data?.experience) {
          setError(`Please select experience for ${talentTypeConfig[type].label}`)
          return false
        }
        if (!data?.portfolioFiles?.length) {
          setError(`Please upload portfolio for ${talentTypeConfig[type].label}`)
          return false
        }
      }
    }
    return true
  }

  // Upload files to Supabase Storage
  const uploadFiles = async (files: File[], userId: string, talentType: TalentType) => {
    const uploadedUrls = []
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${talentType}/${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('talent_portfolios')
        .upload(fileName, file)

      if (error) {
        console.error('File upload failed:', error)
        throw error
      }

      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('talent_portfolios')
          .getPublicUrl(data.path)
        uploadedUrls.push(publicUrl)
      }
    }

    return uploadedUrls
  }

  // Create talent profile
  const createTalentProfile = async (userId: string) => {
    try {
      // Create basic talent profile
      const { data: profileData, error: profileError } = await supabase
        .from('talent_profiles')
        .insert({
          user_id: userId,
          talent_types: selectedTalentTypes
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Create detailed profile for each talent type
      for (const type of selectedTalentTypes) {
        const data = talentDataMap[type]
        const files = data.portfolioFiles
        let fileUrls: string[] = []

        // Upload files
        if (files?.length) {
          try {
            fileUrls = await uploadFiles(files, userId, type)
          } catch (uploadError) {
            console.error(`${type} file upload failed:`, uploadError)
            // Continue processing other data even if file upload fails
          }
        }

        // Prepare data to save
        const detailData: any = {
          profile_id: profileData.id,
          talent_type: type,
          experience: data.experience,
          portfolio_links: data.portfolio || '',
          portfolio_files: fileUrls,
          form_data: data // Save complete form data
        }

        // Add type-specific fields
        switch (type) {
          case 'live-host':
            detailData.categories = data.categories || []
            detailData.host_styles = data.styles || []
            detailData.achievement = data.achievement || ''
            break
          case 'account-manager':
            detailData.operation_categories = data.categories || []
            detailData.operation_skills = data.skills || []
            detailData.success_cases = data.cases || ''
            break
          case 'video-editor':
            detailData.editing_software = data.software || []
            detailData.editing_styles = data.styles || []
            break
        }

        // Save detailed profile
        const { error: detailError } = await supabase
          .from('talent_type_details')
          .insert(detailData)

        if (detailError) {
          console.error(`Saving ${type} detailed profile failed:`, detailError)
          // Continue processing other types
        }
      }

      return true
    } catch (error) {
      console.error('Creating talent profile failed:', error)
      throw error
    }
  }

  // Submit registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      console.log('Starting registration:', email, userType, selectedTalentTypes, talentDataMap)
      
      try {
        const { error, data } = await signUpWithDetails(email, password, userType, {
          firstName: 'To be completed',
          lastName: 'To be completed',
          phoneNumber: 'To be completed',
          // Creator-specific information
          ...(userType === 'influencer' ? {
            nickname: 'To be completed',
            tiktokAccount: '',
            location: '',
            categories: [],
            tags: [],
            bio: '',
            experienceYears: Math.max(...selectedTalentTypes.map(type => 
              parseInt(talentDataMap[type]?.experience || '0')
            )).toString(),
          } : {}),
          // Company-specific information
          ...(userType === 'company' ? {
            companyName: 'To be completed',
            contactPerson: 'To be completed',
            industry: '',
            companySize: '',
            description: ''
          } : {})
        })

        if (error) {
          console.error('Registration failed:', error)
          setError(typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'Registration failed, please try again')
        } else if (data?.user) {
          console.log('Registration successful')

          // If influencer user, create talent profile and save country
          if (userType === 'influencer') {
            try {
              // Save country to influencers table if provided
              if (country) {
                const { error: countryError } = await supabase
                  .from('influencers')
                  .update({ country })
                  .eq('user_id', data.user.id)
                
                if (countryError) {
                  console.error('Saving country failed:', countryError)
                } else {
                  console.log('Country saved successfully:', country)
                }
              }
              
              await createTalentProfile(data.user.id)
            } catch (profileError) {
              console.error('Creating talent profile failed:', profileError)
              // Continue registration process even if profile creation fails
            }
          }

          // Clear cache and show prompt after successful registration
          localStorage.clear()
          sessionStorage.clear()
          
          // Sign out
          try {
            await supabase.auth.signOut()
            console.log('Signed out')
          } catch (signOutError) {
            console.error('Sign out failed:', signOutError)
          }
          
          // Show success message
          if (userType === 'company') {
            alert('Registration successful! The influencer selection module is being updated, stay tuned!')
            // Company users redirect to homepage
            navigate('/')
          } else {
            alert('Registration successful! Please log in to complete your profile.')
            // Creator users redirect to homepage
            navigate('/')
          }
          
          // Redirect to login page
          // navigate('/login-test') // This line is now handled by the if/else block above
        }
      } catch (signUpError) {
        console.error('Registration API call failed:', signUpError)
        setError('Registration service temporarily unavailable, please try again later')
      }
    } catch (err) {
      console.error('Operation failed:', err)
      setError('Operation failed, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">User Registration</h1>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Fill in Basic Information</h2>
            
            {/* User type selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                User Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUserType('influencer')
                    setTalentType(null)
                    setTalentData({})
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    userType === 'influencer'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Creator</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserType('company')
                    setTalentType(null)
                    setTalentData({})
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    userType === 'company'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Company</div>
                </button>
              </div>
            </div>

            {/* Country field for influencers - placed before talent type selection */}
            {userType === 'influencer' && (
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country / 国家 <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative w-full">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white cursor-pointer"
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    <option value="" disabled>Select Country / 选择国家</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} / {c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Talent type selection and questions */}
            {userType === 'influencer' && (
              <>
                <TalentTypeForm
                  selectedTypes={selectedTalentTypes}
                  onSelect={handleTalentTypeSelect}
                />
                {selectedTalentTypes.map(type => (
                  <div key={type} className="mt-8">
                    <TalentQuestionForm
                      talentType={type}
                      formData={talentDataMap[type] || {}}
                      onChange={(data) => handleTalentDataChange(type, data)}
                    />
                  </div>
                ))}
              </>
            )}

            {/* Email address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email verification code */}
            <div>
              <button
                type="button"
                onClick={sendEmailCode}
                disabled={sendingEmail || !email || loading}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Verification Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={emailInputCode}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter 6-digit verification code"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email verification status */}
              {emailError && (
                <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}
              {emailSuccess && (
                <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-green-600">{emailSuccess}</span>
                </div>
              )}
              {emailVerified && (
                <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Email verification successful</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter password again"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !emailVerified}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>

            {/* Bottom link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?
                <Link
                  to="/login-test"
                  className="ml-1 text-pink-600 hover:text-pink-700 font-medium"
                >
                  Sign In Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

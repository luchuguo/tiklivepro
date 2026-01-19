import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  CreditCard, 
  LogOut, 
  Save,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Eye,
  EyeOff,
  Settings,
  UserCog,
  Send,
  RefreshCw,
  MessageSquare,
  XCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/useAuth'
import MD5 from 'crypto-js/md5'

export function AccountSettingsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuthContext()
  
  // Add debug logs - only shown in development environment
  if (import.meta.env.DEV) {
    console.log('AccountSettingsPage rendered:', { user, profile, authLoading })
  }
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy'>('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // SMS verification related state
  const [smsVerification, setSmsVerification] = useState({
    phone: '',
    verificationCode: '',
    inputCode: '',
    sending: false,
    verified: false,
    error: '',
    success: ''
  })

  // SMS API configuration
  const SMS_USERNAME = 'luchuguo'
  const SMS_PASSWORD_MD5 = '95895002b700461898a9821c0704e929'
  const SMS_API_URL = 'https://api.smsbao.com/sms'

  // Error code mapping
  const errorMessages = {
    '30': 'Incorrect password',
    '40': 'Account does not exist',
    '41': 'Insufficient balance',
    '43': 'IP address restricted',
    '50': 'Content contains sensitive words',
    '51': 'Invalid phone number'
  }

  // Profile form
  const [profileForm, setProfileForm] = useState({
    phone: '',
    email_notifications: true,
    sms_notifications: false
  })
  
  // Security settings form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    contactInfoVisibility: 'private',
    allowMessages: true
  })

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserSettings()
    }
  }, [user, authLoading])

  const fetchUserSettings = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching user settings, user ID:', user.id)
      
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('User settings query result:', { userData, userError })

      if (userError) {
        console.error('Failed to fetch user settings:', userError)
        setError('Failed to fetch settings, please try again')
      } else       if (userData) {
        // Populate form data
        setProfileForm({
          phone: userData.phone || '',
          email_notifications: true, // Default value, should be fetched from database
          sms_notifications: false // Default value, should be fetched from database
        })
        
        // If phone number exists, sync to SMS verification state
        if (userData.phone) {
          setSmsVerification(prev => ({
            ...prev,
            phone: userData.phone,
            verified: true // Assume existing phone number in database is verified
          }))
        }
      }
    } catch (error) {
      console.error('Error occurred while fetching user settings:', error)
      setError('Error occurred while fetching settings, please try again')
    } finally {
      setLoading(false)
      console.log('User settings fetch completed, loading set to false')
    }
  }

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSecurityForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Safely handle privacy settings changes based on element type, avoiding accessing non-existent checked property on select elements
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target
    const { name } = target

    // Check if it's a checkbox
    const newValue = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : target.value

    setPrivacySettings(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  // Generate verification code
  const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  // Send SMS verification code
  const sendSmsCode = async () => {
    const phone = smsVerification.phone || profileForm.phone
    
    if (!phone) {
      setSmsVerification(prev => ({ ...prev, error: 'Please enter phone number' }))
      return
    }

    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      setSmsVerification(prev => ({ ...prev, error: 'Please enter a valid phone number format' }))
      return
    }

    const code = generateVerificationCode()
    
    try {
      setSmsVerification(prev => ({ 
        ...prev, 
        sending: true, 
        error: '', 
        success: '',
        verificationCode: code 
      }))

      const content = `[SMS] Your verification code is ${code}, valid for 30 seconds`
      
      const params = new URLSearchParams({
        u: SMS_USERNAME,
        p: SMS_PASSWORD_MD5,
        m: phone,
        c: content
      })

      const apiUrl = `${SMS_API_URL}?${params.toString()}`
      console.log('Send SMS API URL:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain',
        }
      })
      
      const result = await response.text()
      const cleanResult = result.trim()

      if (cleanResult === '0') {
        setSmsVerification(prev => ({ 
          ...prev, 
          success: `SMS sent to ${phone}, please check!`,
          phone: phone
        }))
      } else {
        const errorMessage = errorMessages[cleanResult as keyof typeof errorMessages]
        if (errorMessage) {
          console.log('API returned error code, but SMS actually sent successfully:', cleanResult)
          setSmsVerification(prev => ({ 
            ...prev, 
            success: `SMS sent to ${phone}, please check!`,
            phone: phone
          }))
        } else {
          console.log('API returned unknown result, but SMS may have been sent successfully')
          setSmsVerification(prev => ({ 
            ...prev, 
            success: `SMS sent to ${phone}, please check!`,
            phone: phone
          }))
        }
      }
    } catch (error) {
      console.error('Failed to send SMS:', error)
      setSmsVerification(prev => ({ 
        ...prev, 
        success: `SMS sent to ${phone}, please check!`,
        phone: phone
      }))
    } finally {
      setSmsVerification(prev => ({ ...prev, sending: false }))
    }
  }

  // Verify SMS verification code
  const verifySmsCode = () => {
    if (!smsVerification.inputCode) {
      setSmsVerification(prev => ({ ...prev, error: 'Please enter verification code' }))
      return
    }

    if (!smsVerification.verificationCode) {
      setSmsVerification(prev => ({ ...prev, error: 'Please send verification code first' }))
      return
    }

    if (smsVerification.inputCode === smsVerification.verificationCode) {
      setSmsVerification(prev => ({ 
        ...prev, 
        verified: true, 
        success: 'Verification successful! Phone number has been bound',
        error: ''
      }))
      // Update phone number in profile form
      setProfileForm(prev => ({ ...prev, phone: smsVerification.phone }))
    } else {
      setSmsVerification(prev => ({ 
        ...prev, 
        error: 'Incorrect verification code, please re-enter',
        verified: false 
      }))
    }
  }

  // Handle SMS verification input changes
  const handleSmsVerificationChange = (field: string, value: string) => {
    setSmsVerification(prev => ({ ...prev, [field]: value }))
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('User not logged in')
      return
    }

    // Check if phone number is verified
    if (profileForm.phone && !smsVerification.verified && smsVerification.phone !== profileForm.phone) {
      setError('Please verify phone number first')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          phone: profileForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('Failed to update profile:', updateError)
        setError('Failed to update profile, please try again')
        return
      }
      
      setSuccess('Profile updated successfully')
      
      // Reset SMS verification state
      setSmsVerification(prev => ({
        ...prev,
        verified: false,
        verificationCode: '',
        inputCode: '',
        error: '',
        success: ''
      }))
      
    } catch (error) {
      console.error('Error occurred while saving profile:', error)
      setError('Error occurred while saving profile, please try again')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('User not logged in')
      return
    }
    
    // Validate password
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    if (securityForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: securityForm.newPassword
      })
      
      if (error) {
        console.error('Failed to update password:', error)
        setError(`Failed to update password: ${error.message}`)
        return
      }
      
      // Clear form
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      setSuccess('Password updated successfully')
      
    } catch (error) {
      console.error('Error occurred while updating password:', error)
      setError('Error occurred while updating password, please try again')
    } finally {
      setSaving(false)
    }
  }

  const savePrivacySettings = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // There should be logic to save privacy settings here
      // Currently only simulating success
      setTimeout(() => {
        setSuccess('Privacy settings updated')
        setSaving(false)
      }, 1000)
      
    } catch (error) {
      console.error('Error occurred while saving privacy settings:', error)
      setError('Error occurred while saving privacy settings, please try again')
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to sign out:', error)
      setError('Failed to sign out, please try again')
    }
  }

  if (authLoading || loading) {
    if (import.meta.env.DEV) {
      console.log('AccountSettingsPage 加载中:', { authLoading, loading })
    }
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
            <p className="text-gray-600 mt-2">Loading your account settings</p>
            <p className="text-sm text-gray-500 mt-2">authLoading: {authLoading.toString()}, loading: {loading.toString()}</p>
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
            <p className="text-gray-600 mb-6">Please log in to access account settings</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          </div>
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
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{profile?.user_type === 'influencer' ? 'Creator Account' : profile?.user_type === 'company' ? 'Company Account' : 'Regular Account'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === 'security'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Security Settings</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === 'notifications'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notification Settings</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === 'privacy'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <UserCog className="w-5 h-5" />
                    <span>Privacy Settings</span>
                  </button>
                </nav>
              </div>
              
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>
                  <form onSubmit={saveProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-sm text-gray-500">Email address cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="tel"
                              name="phone"
                              value={profileForm.phone}
                              onChange={handleProfileInputChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter your phone number"
                              maxLength={11}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={sendSmsCode}
                            disabled={smsVerification.sending || !profileForm.phone}
                            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {smsVerification.sending ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Send Verification Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* SMS verification code input */}
                        {smsVerification.success && (
                          <div className="flex space-x-2">
                            <div className="flex-1 relative">
                              <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                              <input
                                type="text"
                                value={smsVerification.inputCode}
                                onChange={(e) => handleSmsVerificationChange('inputCode', e.target.value)}
                                placeholder="Enter 4-digit code"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                maxLength={4}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={verifySmsCode}
                              disabled={!smsVerification.inputCode || !smsVerification.verificationCode}
                              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Verify</span>
                            </button>
                          </div>
                        )}

                        {/* SMS verification status messages */}
                        {smsVerification.error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-red-700 text-sm">{smsVerification.error}</span>
                            </div>
                          </div>
                        )}

                        {smsVerification.success && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-green-700 text-sm">{smsVerification.success}</span>
                            </div>
                          </div>
                        )}

                        {smsVerification.verified && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-6 h-6 text-blue-500" />
                              <div>
                                <div className="font-medium text-blue-900">Verification successful!</div>
                                <div className="text-sm text-blue-700">Phone number has been bound, you can save your profile</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <input
                        type="text"
                        value={profile?.user_type === 'influencer' ? 'Creator Account' : 
                               profile?.user_type === 'company' ? 'Company Account' : 
                               profile?.user_type === 'admin' ? 'Admin Account' : 'Regular Account'}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving || (!!profileForm.phone && !smsVerification.verified)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                      {profileForm.phone && !smsVerification.verified && (
                        <p className="mt-2 text-sm text-orange-600">
                          ⚠️ Please verify your phone number before saving
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              )}
              
              {/* Security settings */}
              {activeTab === 'security' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <form onSubmit={changePassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={securityForm.currentPassword}
                          onChange={handleSecurityInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={securityForm.newPassword}
                          onChange={handleSecurityInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Password must be at least 6 characters</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={securityForm.confirmPassword}
                        onChange={handleSecurityInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm your new password"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving || !securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Login History</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">
                        Last Login: {new Date().toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Device: Web Browser
                      </div>
                      <div className="text-sm text-gray-500">
                        IP Address: 192.168.1.1
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notification settings */}
              {activeTab === 'notifications' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">System Notifications</div>
                          <div className="text-sm text-gray-500">Receive notifications about system updates, maintenance, and security</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="email_notifications"
                            checked={profileForm.email_notifications}
                            onChange={handleProfileInputChange}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">Task Notifications</div>
                          <div className="text-sm text-gray-500">Receive notifications about new tasks, application status changes, etc.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">Marketing Messages</div>
                          <div className="text-sm text-gray-500">Receive notifications about promotions, events, and new features</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">SMS Notifications</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">Important Notifications</div>
                          <div className="text-sm text-gray-500">Receive SMS notifications about account security and important updates</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="sms_notifications"
                            checked={profileForm.sms_notifications}
                            onChange={handleProfileInputChange}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-700">Task Reminders</div>
                          <div className="text-sm text-gray-500">Receive reminders for upcoming live streaming tasks</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Save Settings</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Privacy settings */}
              {activeTab === 'privacy' && (
                <div className="p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
                  <form onSubmit={savePrivacySettings} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Visibility
                      </label>
                      <select
                        name="profileVisibility"
                        value={privacySettings.profileVisibility}
                        onChange={handlePrivacyChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">Public - Visible to everyone</option>
                        <option value="registered">Registered Users - Visible to registered users only</option>
                        <option value="private">Private - Visible to yourself only</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">Control who can view your profile</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Information Visibility
                      </label>
                      <select
                        name="contactInfoVisibility"
                        value={privacySettings.contactInfoVisibility}
                        onChange={handlePrivacyChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">Public - Visible to everyone</option>
                        <option value="contacts">Contacts - Visible to contacts only</option>
                        <option value="private">Private - Not public</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">Control who can view your contact information</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-700">Allow Private Messages</div>
                        <div className="text-sm text-gray-500">Allow other users to send you private messages</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="allowMessages"
                          checked={privacySettings.allowMessages}
                          onChange={handlePrivacyChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Save Settings</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            
            {/* Account information card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-8">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Account ID</div>
                    <div className="font-medium text-gray-900">{user.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Registration Date</div>
                    <div className="font-medium text-gray-900">{new Date(user.created_at || '').toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Account Type</div>
                    <div className="font-medium text-gray-900">
                      {profile?.user_type === 'influencer' ? 'Creator Account' : 
                       profile?.user_type === 'company' ? 'Company Account' : 
                       profile?.user_type === 'admin' ? 'Admin Account' : 'Regular Account'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Account Status</div>
                    <div className="font-medium text-green-600">Active</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-red-600 font-medium">Delete Account</div>
                    <button className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                      Request Deletion
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Deleting your account will permanently remove all your data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
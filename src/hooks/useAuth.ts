import React, { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // 设置超时机制，防止无限加载
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('权限验证超时，强制设置加载状态为false')
        setLoading(false)
      }
    }, 10000) // 10秒超时

    // 获取初始会话
    const getInitialSession = async () => {
      try {
        console.log('🔄 开始获取初始会话...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ 获取初始会话失败:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        console.log('📱 初始会话获取成功:', session?.user?.email || '无会话')
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            console.log('👤 用户已登录，开始获取用户资料...')
            await fetchProfile(session.user.id, session.user.email)
          } else {
            console.log('👤 用户未登录，设置加载状态为false')
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('💥 获取初始会话时发生错误:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('🔄 认证状态变化:', event, session?.user?.email || '无用户')
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('👤 用户登录状态变化，开始获取用户资料...')
        await fetchProfile(session.user.id, session.user.email)
      } else {
        // 用户退出登录时立即清理所有状态
        console.log('👤 用户退出登录，清理状态...')
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log('🔍 开始获取用户资料:', userId, 'email:', userEmail)
      
      // 设置查询超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('查询超时')), 10000) // 10秒超时
      })
      
      // 获取用户资料
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      console.log('📊 用户资料查询结果:', { data, error })
      console.log('🔍 当前状态 - user:', !!user, 'profile:', !!profile, 'loading:', loading)

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到用户资料
          console.log('未找到用户资料，用户:', userId)
          
          // 如果是管理员邮箱，自动创建管理员资料
          if (userEmail === 'admin@tiklive.pro') {
            console.log('检测到管理员邮箱，创建管理员资料...')
            const adminProfile = await createAdminProfile(userId)
            if (adminProfile) {
              setProfile(adminProfile)
            } else {
              console.error('创建管理员资料失败')
              setProfile(null)
            }
          } else {
            console.log('普通用户未找到资料，这可能是正常的')
            setProfile(null)
          }
        } else {
          console.error('获取用户资料失败:', error)
          
          // 如果是管理员邮箱但获取失败，尝试修复
          if (userEmail === 'admin@tiklive.pro') {
            console.log('管理员用户资料获取失败，尝试修复...')
            const adminProfile = await createAdminProfile(userId)
            if (adminProfile) {
              setProfile(adminProfile)
            } else {
              setProfile(null)
            }
          } else {
            setProfile(null)
          }
        }
      } else if (data) {
        console.log('用户资料加载成功:', data.user_type, 'for email:', userEmail)
        
        // 如果是管理员邮箱但类型不是admin，修复它
        if (userEmail === 'admin@tiklive.pro' && data.user_type !== 'admin') {
          console.log('管理员邮箱但用户类型错误，修复中...')
          const fixedProfile = await fixAdminUserType(userId)
          if (fixedProfile) {
            setProfile(fixedProfile)
          } else {
            // 如果修复失败，至少设置当前数据
            setProfile(data)
          }
        } else {
          setProfile(data)
        }
      }
    } catch (error) {
      console.error('fetchProfile 发生错误:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const createAdminProfile = async (userId: string) => {
    try {
      console.log('创建管理员资料，用户ID:', userId)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          user_type: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('创建管理员资料失败:', error)
        return null
      }

      console.log('管理员资料创建成功:', data)
      
      // 创建管理员权限
      await createAdminPermissions(userId)
      
      return data
    } catch (error) {
      console.error('创建管理员资料时发生错误:', error)
      return null
    }
  }

  const fixAdminUserType = async (userId: string) => {
    try {
      console.log('修复管理员用户类型，用户ID:', userId)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          user_type: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('修复管理员用户类型失败:', error)
        return null
      }

      console.log('管理员用户类型修复成功:', data)
      
      // 确保管理员权限存在
      await createAdminPermissions(userId)
      
      return data
    } catch (error) {
      console.error('修复管理员用户类型时发生错误:', error)
      return null
    }
  }

  const createAdminPermissions = async (userId: string) => {
    try {
      const permissions = [
        'user_management',
        'task_management', 
        'system_settings',
        'data_analytics',
        'content_moderation'
      ]

      for (const permission of permissions) {
        await supabase
          .from('admin_permissions')
          .upsert({
            admin_id: userId,
            permission_name: permission,
            granted_by: userId,
            granted_at: new Date().toISOString()
          }, {
            onConflict: 'admin_id,permission_name'
          })
      }

      console.log('管理员权限创建/更新成功')
    } catch (error) {
      console.error('创建管理员权限失败:', error)
    }
  }

  const signUp = async (email: string, password: string, userType: 'influencer' | 'company', phoneNumber?: string) => {
    try {
      console.log('开始注册:', email, userType, phoneNumber)
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        console.error('注册失败:', error)
        return { data: null, error }
      }

      console.log('注册成功:', data.user?.email)

      if (data.user) {
        // 创建用户资料
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            user_type: userType,
            phone: phoneNumber || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('创建用户资料失败:', profileError)
          return { data: null, error: profileError }
        }

        console.log('用户资料创建成功')
      }

      return { data, error: null }
    } catch (error) {
      console.error('注册过程中发生错误:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // 扩展的注册函数，包含所有用户信息
  const signUpWithDetails = async (
    email: string, 
    password: string, 
    userType: 'influencer' | 'company', 
    userData: {
      // 基础信息
      firstName: string
      lastName: string
      phoneNumber: string
      
      // 达人主播特有信息
      nickname?: string
      tiktokAccount?: string
      location?: string
      categories?: string[]
      tags?: string[]
      hourlyRate?: string
      experienceYears?: string
      bio?: string
      
      // 新增达人主播字段
      idType?: string
      idNumber?: string
      idImageUrl?: string
      tiktokProfileUrl?: string
      tiktokFollowersCount?: string
      avgPlayCount?: string
      avgEngagementRate?: string
      hasTiktokShop?: boolean
      liveVenue?: string
      weeklySchedule?: any
      bilingualLive?: boolean
      languages?: string[]
      
      // 企业用户特有信息
      companyName?: string
      contactPerson?: string
      businessLicense?: string
      industry?: string
      companySize?: string
      website?: string
      description?: string
    }
  ) => {
    try {
      console.log('开始完整注册:', email, userType, userData)
      setLoading(true)
      
      // 1. 创建用户账户
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        console.error('注册失败:', error)
        return { data: null, error }
      }

      console.log('用户账户创建成功:', data.user?.email)

      if (data.user) {
        // 2. 创建基础用户资料
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            user_type: userType,
            phone: userData.phoneNumber,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('创建用户资料失败:', profileError)
          return { data: null, error: profileError }
        }

        console.log('基础用户资料创建成功')

        // 3. 根据用户类型创建详细资料
        if (userType === 'influencer') {
          const { error: influencerError } = await supabase
            .from('influencers')
            .insert({
              user_id: data.user.id,
              nickname: userData.nickname || '',
              real_name: `${userData.lastName}${userData.firstName}`,
              tiktok_account: userData.tiktokAccount || null,
              bio: userData.bio || null,
              location: userData.location || null,
              categories: userData.categories || [],
              tags: userData.tags || [],
              hourly_rate: userData.hourlyRate ? parseInt(userData.hourlyRate) : 0,
              experience_years: userData.experienceYears ? parseInt(userData.experienceYears) : 0,
              // 新增字段
              id_type: userData.idType || null,
              id_number: userData.idNumber || null,
              id_image_url: userData.idImageUrl || null,
              tiktok_profile_url: userData.tiktokProfileUrl || null,
              tiktok_followers_count: userData.tiktokFollowersCount ? parseInt(userData.tiktokFollowersCount) : 0,
              avg_play_count: userData.avgPlayCount ? parseInt(userData.avgPlayCount) : 0,
              avg_engagement_rate: userData.avgEngagementRate ? parseFloat(userData.avgEngagementRate) : 0.00,
              has_tiktok_shop: userData.hasTiktokShop || false,
              live_venue: userData.liveVenue || null,
              weekly_schedule: userData.weeklySchedule || null,
              bilingual_live: userData.bilingualLive || false,
              languages: userData.languages || [],
              followers_count: 0,
              is_verified: false,
              is_approved: false,
              rating: 0,
              total_reviews: 0,
              total_live_count: 0,
              avg_views: 0,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (influencerError) {
            console.error('创建达人资料失败:', influencerError)
            return { data: null, error: influencerError }
          }

          console.log('达人资料创建成功')
        } else if (userType === 'company') {
          const { error: companyError } = await supabase
            .from('companies')
            .insert({
              user_id: data.user.id,
              company_name: userData.companyName || '',
              contact_person: userData.contactPerson || null,
              business_license: userData.businessLicense || null,
              industry: userData.industry || null,
              company_size: userData.companySize || null,
              website: userData.website || null,
              description: userData.description || null,
              is_verified: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (companyError) {
            console.error('创建企业资料失败:', companyError)
            return { data: null, error: companyError }
          }

          console.log('企业资料创建成功')
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('完整注册过程中发生错误:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('开始登录:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        console.error('登录失败:', error)
        return { data: null, error }
      }

      console.log('登录成功:', data.user?.email)
      
      // 登录成功后，fetchProfile 会通过 onAuthStateChange 自动调用
      return { data, error: null }
    } catch (error) {
      console.error('登录过程中发生错误:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('开始退出登录...')
      
      // 立即清理本地状态
      setUser(null)
      setSession(null)
      setProfile(null)
      setLoading(false)
      
      // 执行 Supabase 退出登录
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase 退出登录失败:', error)
      } else {
        console.log('Supabase 退出登录成功')
      }
      
      return { error: null }
    } catch (error) {
      console.error('退出登录时发生错误:', error)
      
      // 确保本地状态已清理
      setUser(null)
      setSession(null)
      setProfile(null)
      setLoading(false)
      
      return { error: null }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // 强制刷新权限验证
  const refreshPermissions = async () => {
    if (user) {
      console.log('🔄 强制刷新权限验证...')
      setLoading(true)
      try {
        await fetchProfile(user.id, user.email)
        console.log('✅ 权限验证刷新完成')
      } catch (error) {
        console.error('❌ 权限验证刷新失败:', error)
        setLoading(false)
      }
    }
  }

  // 添加权限状态监控
  const isAdmin = profile?.user_type === 'admin'
  const isInfluencer = profile?.user_type === 'influencer'
  const isCompany = profile?.user_type === 'company'
  
  console.log('🔍 useAuth 状态:', {
    user: !!user,
    profile: !!profile,
    loading,
    userType: profile?.user_type,
    isAdmin,
    isInfluencer,
    isCompany
  })

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signUpWithDetails,
    signIn,
    signOut,
    updateProfile,
    refreshPermissions,
    isAuthenticated: !!user,
    isInfluencer,
    isCompany,
    isAdmin,
  }
}

// Context 封装
const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  return React.createElement(AuthContext.Provider, { value: auth }, children)
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext 必须在 <AuthProvider> 内部使用')
  return ctx
}
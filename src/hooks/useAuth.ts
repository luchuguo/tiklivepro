import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 将管理员相关函数用 useCallback 包装，避免依赖问题
  const createAdminPermissions = useCallback(async (userId: string) => {
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
  }, [])

  const createAdminProfile = useCallback(async (userId: string) => {
    try {
      console.log('🔐 [创建管理员资料] 开始，用户ID:', userId)
      
      // 确保有有效的 session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('❌ [创建管理员资料] 没有有效的 session:', sessionError)
        // 尝试刷新 session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshedSession) {
          console.error('❌ [创建管理员资料] 刷新 session 失败:', refreshError)
          return null
        }
        console.log('✅ [创建管理员资料] Session 已刷新')
      } else {
        console.log('✅ [创建管理员资料] Session 有效，用户:', session.user?.email)
      }
      
      // 验证 userId 是否与当前 session 的用户 ID 匹配
      const currentSession = session || (await supabase.auth.getSession()).data.session
      if (currentSession && currentSession.user.id !== userId) {
        console.warn('⚠️ [创建管理员资料] userId 不匹配，使用当前 session 的 userId')
        // 使用当前 session 的 userId
        const actualUserId = currentSession.user.id
        const { data, error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: actualUserId,
            user_type: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single()

        if (error) {
          console.error('❌ [创建管理员资料] 失败:', error)
          console.error('错误详情:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          return null
        }

        console.log('✅ [创建管理员资料] 成功:', data)
        await createAdminPermissions(actualUserId)
        return data
      }
      
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
        console.error('❌ [创建管理员资料] 失败:', error)
        console.error('错误详情:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        return null
      }

      console.log('✅ [创建管理员资料] 成功:', data)
      
      // 创建管理员权限
      await createAdminPermissions(userId)
      
      return data
    } catch (error: any) {
      console.error('❌ [创建管理员资料] 发生错误:', error)
      return null
    }
  }, [createAdminPermissions])

  const fixAdminUserType = useCallback(async (userId: string) => {
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
  }, [createAdminPermissions])

  // 将 fetchProfile 用 useCallback 包装
  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
      setLoading(true) // 确保开始加载时设置 loading 为 true
      try {
        console.log('🔍 开始获取用户资料:', userId, 'email:', userEmail)
        
        // 设置查询超时（增加到 20 秒，给网络较慢的情况更多时间）
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('查询超时')), 20000) // 20秒超时
        })
        
        // 获取用户资料
        const profilePromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        let result: any
        try {
          result = await Promise.race([profilePromise, timeoutPromise])
        } catch (raceError: any) {
          // 处理超时或 Promise.race 的错误
          if (raceError.message === '查询超时') {
            console.error('⏰ 用户资料查询超时')
            throw new Error('查询超时，请检查网络连接')
          }
          throw raceError
        }

        const { data, error } = result

        console.log('📊 用户资料查询结果:', { data, error })

        if (error) {
          if (error.code === 'PGRST116') {
            // 没有找到用户资料
            console.log('未找到用户资料，用户:', userId)
            
            // 如果是管理员邮箱，自动创建管理员资料
            if (userEmail === 'admin@tiklive.pro') {
              console.log('检测到管理员邮箱，创建管理员资料...')
              try {
                const adminProfile = await createAdminProfile(userId)
                if (adminProfile) {
                  setProfile(adminProfile)
                } else {
                  console.error('创建管理员资料失败')
                  setProfile(null)
                }
              } catch (createError) {
                console.error('创建管理员资料时发生错误:', createError)
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
              try {
                const adminProfile = await createAdminProfile(userId)
                if (adminProfile) {
                  setProfile(adminProfile)
                } else {
                  setProfile(null)
                }
              } catch (createError) {
                console.error('修复管理员资料时发生错误:', createError)
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
            try {
              const fixedProfile = await fixAdminUserType(userId)
              if (fixedProfile) {
                setProfile(fixedProfile)
              } else {
                // 如果修复失败，至少设置当前数据
                setProfile(data)
              }
            } catch (fixError) {
              console.error('修复用户类型时发生错误:', fixError)
              setProfile(data) // 至少使用原始数据
            }
          } else {
            setProfile(data)
          }
        } else {
          // 既没有 data 也没有 error，可能是异常情况
          console.warn('⚠️ 用户资料查询返回了空结果')
          setProfile(null)
        }
      } catch (error: any) {
        console.error('fetchProfile 发生错误:', error)
        setProfile(null)
      } finally {
        // 确保 loading 状态总是被更新
        setLoading(false)
        console.log('✅ fetchProfile 完成，loading 设置为 false')
      }
  }, [createAdminProfile, fixAdminUserType])

  // 初始化认证状态
  useEffect(() => {
    let mounted = true
    let hasFetchedProfile = false // 添加标志防止重复查询

    // 设置超时机制，防止无限加载
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('权限验证超时，强制设置加载状态为false')
        setLoading(false)
      }
    }, 10000) // 10秒超时

    // 获取初始会话（增强版，支持持久化恢复）
    const getInitialSession = async () => {
      try {
        console.log('🔄 开始获取初始会话...')
        
        // 首先尝试从 Supabase 获取 session
        let { data: { session }, error } = await supabase.auth.getSession()
        
        // 如果 Supabase 没有 session，尝试从 localStorage 恢复
        if (!session && typeof window !== 'undefined') {
          console.log('📦 Supabase session 为空，尝试从 localStorage 恢复...')
          const sessionKey = 'sb-auth-token'
          const storedSession = localStorage.getItem(sessionKey)
          
          if (storedSession) {
            try {
              const sessionData = JSON.parse(storedSession)
              // 检查 session 是否过期
              if (sessionData.expires_at && sessionData.expires_at * 1000 > Date.now()) {
                console.log('✅ 发现有效的存储 session，尝试恢复...')
                // 使用 refresh token 恢复 session
                if (sessionData.refresh_token) {
                  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                    refresh_token: sessionData.refresh_token
                  })
                  
                  if (!refreshError && refreshData.session) {
                    session = refreshData.session
                    console.log('✅ Session 恢复成功')
                  } else {
                    console.warn('⚠️ Session 恢复失败，清除存储')
                    localStorage.removeItem(sessionKey)
                  }
                }
              } else {
                console.log('⚠️ 存储的 session 已过期，清除')
                localStorage.removeItem(sessionKey)
              }
            } catch (parseError) {
              console.error('解析存储的 session 失败:', parseError)
              localStorage.removeItem(sessionKey)
            }
          }
        }
        
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
            // 确保 session 被持久化
            if (typeof window !== 'undefined') {
              const sessionKey = 'sb-auth-token'
              const sessionData = {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                expires_in: session.expires_in,
                token_type: session.token_type,
                user: session.user
              }
              localStorage.setItem(sessionKey, JSON.stringify(sessionData))
              console.log('✅ Session 已持久化到 localStorage')
            }
            // 立即获取用户资料，不等待（只获取一次）
            if (!hasFetchedProfile) {
              hasFetchedProfile = true
              fetchProfile(session.user.id, session.user.email).catch(err => {
                console.error('获取用户资料失败:', err)
                // 即使失败也要设置 loading 为 false
                setLoading(false)
              })
            }
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

    // 监听认证状态变化（增强版，支持持久化）
    let profileFetchInProgress = false // 防止重复查询
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('🔄 认证状态变化:', event, session?.user?.email || '无用户')
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // 如果已经有 profile 且用户 ID 相同，跳过查询
        if (profile && profile.user_id === session.user.id) {
          console.log('✅ 用户资料已存在，跳过重复查询')
          setLoading(false)
          return
        }
        
        // 如果正在查询中，跳过
        if (profileFetchInProgress) {
          console.log('⏸️ 用户资料查询进行中，跳过重复查询')
          return
        }
        
        console.log('👤 用户登录状态变化，开始获取用户资料...')
        
        // 持久化 session 到 localStorage
        if (typeof window !== 'undefined') {
          const sessionKey = 'sb-auth-token'
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type,
            user: session.user
          }
          localStorage.setItem(sessionKey, JSON.stringify(sessionData))
          console.log('✅ Session 已持久化')
        }
        
        // 立即获取用户资料，不阻塞（只查询一次）
        if (!hasFetchedProfile && !profileFetchInProgress) {
          hasFetchedProfile = true
          profileFetchInProgress = true
          fetchProfile(session.user.id, session.user.email)
            .then(() => {
              profileFetchInProgress = false
            })
            .catch(err => {
              console.error('获取用户资料失败:', err)
              profileFetchInProgress = false
              setLoading(false)
            })
        }
      } else {
        // 用户退出登录时立即清理所有状态
        console.log('👤 用户退出登录，清理状态...')
        hasFetchedProfile = false
        profileFetchInProgress = false
        setProfile(null)
        setLoading(false)
        
        // 清除 localStorage 中的 session
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sb-auth-token')
          console.log('✅ 已清除存储的 session')
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, []) // 移除 loading 和 fetchProfile 依赖，避免循环

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

      console.log('✅ [登录] 登录成功:', data.user?.email)
      
      // 登录成功后立即持久化 session（增强版）
      if (data.session && typeof window !== 'undefined') {
        const sessionKey = 'sb-auth-token'
        const sessionData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
          user: data.session.user
        }
        
        try {
          localStorage.setItem(sessionKey, JSON.stringify(sessionData))
          console.log('✅ [登录] Session 已保存到 localStorage')
          console.log('📦 [登录] 存储键:', sessionKey)
          console.log('📦 [登录] 存储大小:', JSON.stringify(sessionData).length, '字节')
          console.log('📦 [登录] 用户ID:', data.session.user?.id)
          console.log('📦 [登录] 用户邮箱:', data.session.user?.email)
          console.log('📦 [登录] 过期时间:', data.session.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : '无')
          
          // 验证存储是否成功
          const stored = localStorage.getItem(sessionKey)
          if (stored) {
            console.log('✅ [登录] 验证: Session 存储成功')
            try {
              const parsed = JSON.parse(stored)
              console.log('✅ [登录] 验证: Session 数据可解析')
              console.log('✅ [登录] 验证: Access Token 存在:', !!parsed.access_token)
              console.log('✅ [登录] 验证: Refresh Token 存在:', !!parsed.refresh_token)
            } catch (parseErr) {
              console.error('❌ [登录] 验证: Session 数据解析失败:', parseErr)
            }
          } else {
            console.error('❌ [登录] 验证: Session 存储失败 - 存储后立即读取为空')
          }
        } catch (storageError: any) {
          console.error('❌ [登录] Session 存储失败:', storageError)
          if (storageError.name === 'QuotaExceededError') {
            console.error('❌ [登录] localStorage 存储空间不足')
          }
        }
      } else {
        console.warn('⚠️ [登录] 没有 session 数据或非浏览器环境，跳过持久化')
      }
      
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
      
      // 清除 localStorage 中的 session
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-auth-token')
        console.log('✅ 已清除存储的 session')
      }
      
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
      
      // 确保清除存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-auth-token')
      }
      
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

  // 强制刷新权限验证（改进版，确保总是完成）
  const refreshPermissions = async () => {
    if (!user) {
      console.warn('⚠️ 无法刷新权限：用户未登录')
      setLoading(false)
      return
    }
    
    console.log('🔄 强制刷新权限验证...', { userId: user.id, email: user.email })
    setLoading(true)
    
    try {
      // 使用 Promise.race 确保不会无限等待
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('刷新权限超时')), 10000)
      })
      
      await Promise.race([
        fetchProfile(user.id, user.email),
        timeoutPromise
      ])
      
      console.log('✅ 权限验证刷新完成')
    } catch (error: any) {
      console.error('❌ 权限验证刷新失败:', error)
      
      // 如果是管理员邮箱，尝试直接创建 profile
      if (user.email === 'admin@tiklive.pro') {
        console.log('🔧 尝试直接创建管理员 profile...')
        try {
          const adminProfile = await createAdminProfile(user.id)
          if (adminProfile) {
            console.log('✅ 管理员 profile 创建成功')
            setProfile(adminProfile)
          } else {
            console.error('❌ 管理员 profile 创建失败')
            setProfile(null)
          }
        } catch (createError) {
          console.error('❌ 创建管理员 profile 时发生错误:', createError)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    } finally {
      // 确保 loading 状态总是被更新
      setLoading(false)
      console.log('✅ refreshPermissions 完成，loading 设置为 false')
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
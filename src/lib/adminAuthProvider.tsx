import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { UserProfile } from './supabase'
import { setSessionCookie, getSessionCookie, clearSessionCookie } from './cookieStorage'
import { superAdminStorage, SuperAdminData } from './superAdminStorage'

interface AdminAuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isAdmin: boolean
  loading: boolean
  error: string | null
}

interface AdminAuthContextType extends AdminAuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

const SESSION_STORAGE_KEY = 'admin-auth-session'
const PROFILE_STORAGE_KEY = 'admin-auth-profile'
const LAST_VALIDATED_KEY = 'admin-last-validated'

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    session: null,
    profile: null,
    isAdmin: false,
    loading: true,
    error: null
  })

  const isInitialized = useRef(false)
  const isRefreshing = useRef(false)

  // 从 localStorage 恢复 session
  const restoreSession = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') return false

      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)
      const lastValidated = localStorage.getItem(LAST_VALIDATED_KEY)

      if (!storedSession) {
        console.log('📦 [AdminAuth] 没有存储的 session')
        return false
      }

      // 检查是否在 5 分钟内验证过（避免频繁验证）
      if (lastValidated) {
        const lastValidatedTime = parseInt(lastValidated, 10)
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (now - lastValidatedTime < fiveMinutes) {
          console.log('📦 [AdminAuth] 使用缓存的验证结果')
          try {
            const sessionData = JSON.parse(storedSession)
            const profileData = storedProfile ? JSON.parse(storedProfile) : null

            // 验证 session 是否仍然有效
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error || !session || session.user.id !== sessionData.user?.id) {
              console.log('📦 [AdminAuth] 缓存的 session 已失效')
              return false
            }

            // 确保 profile 数据有效且是管理员
            if (profileData && profileData.user_type === 'admin' && profileData.user_id === session.user.id) {
              // 更新验证时间
              localStorage.setItem(LAST_VALIDATED_KEY, Date.now().toString())
              
              setState({
                user: session.user,
                session: session,
                profile: profileData,
                isAdmin: true, // 明确设置为 true
                loading: false,
                error: null
              })

              console.log('✅ [AdminAuth] 从缓存恢复 session 成功')
              return true
            } else {
              console.warn('⚠️ [AdminAuth] 缓存的 profile 不是管理员类型或用户ID不匹配，需要重新验证')
              // 继续执行后续的刷新逻辑，不使用缓存
            }
          } catch (parseError) {
            console.error('❌ [AdminAuth] 解析缓存失败:', parseError)
            return false
          }
        }
      }

      // 验证并刷新 session
      const sessionData = JSON.parse(storedSession)
      if (sessionData.refresh_token) {
        console.log('🔄 [AdminAuth] 使用 refresh_token 刷新 session...')
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: sessionData.refresh_token
        })

        if (refreshError || !refreshData.session) {
          console.error('❌ [AdminAuth] 刷新 session 失败:', refreshError)
          localStorage.removeItem(SESSION_STORAGE_KEY)
          localStorage.removeItem(PROFILE_STORAGE_KEY)
          localStorage.removeItem(LAST_VALIDATED_KEY)
          return false
        }

        // 优先使用缓存的 profile，避免查询超时
        let profile = storedProfile ? JSON.parse(storedProfile) : null
        
        // 如果缓存的 profile 存在且是管理员，直接使用
        if (profile && profile.user_type === 'admin' && profile.user_id === refreshData.session.user.id) {
          console.log('✅ [AdminAuth] 使用缓存的 profile')
        } else {
          // 否则查询数据库（带超时保护）
          console.log('🔄 [AdminAuth] 从数据库获取 profile...')
          try {
            const profilePromise = supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', refreshData.session.user.id)
              .single()
            
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('查询超时')), 15000) // 15秒超时
            })
            
            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any

            if (profileError || !profileData || profileData.user_type !== 'admin') {
              console.error('❌ [AdminAuth] 用户不是管理员或获取资料失败:', profileError)
              return false
            }
            
            profile = profileData
          } catch (error: any) {
            if (error.message === '查询超时') {
              console.warn('⏰ [AdminAuth] Profile 查询超时，使用缓存的 profile')
              // 如果查询超时，尝试使用缓存的 profile
              if (!profile || profile.user_type !== 'admin') {
                console.error('❌ [AdminAuth] 缓存的 profile 无效')
                return false
              }
            } else {
              console.error('❌ [AdminAuth] 获取 profile 失败:', error)
              return false
            }
          }
        }

        // 保存到 localStorage
        const newSessionData = {
          access_token: refreshData.session.access_token,
          refresh_token: refreshData.session.refresh_token,
          expires_at: refreshData.session.expires_at,
          expires_in: refreshData.session.expires_in,
          token_type: refreshData.session.token_type,
          user: refreshData.session.user
        }
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSessionData))
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
        localStorage.setItem(LAST_VALIDATED_KEY, Date.now().toString())

        // 同时存储到 cookie（作为补充）
        setSessionCookie({
          access_token: refreshData.session.access_token,
          refresh_token: refreshData.session.refresh_token,
          expires_at: refreshData.session.expires_at || 0,
          user_id: refreshData.session.user.id,
          user_email: refreshData.session.user.email || ''
        })

        setState({
          user: refreshData.session.user,
          session: refreshData.session,
          profile: profile,
          isAdmin: true,
          loading: false,
          error: null
        })

        // 保存到增强存储管理器
        superAdminStorage.saveSuperAdminData({
          isSuperAdmin: true,
          userId: refreshData.session.user.id,
          user: refreshData.session.user,
          token: refreshData.session.access_token,
          permissions: []
        })

        console.log('✅ [AdminAuth] Session 恢复成功（已保存到增强存储）')
        return true
      }

      return false
    } catch (error: any) {
      console.error('❌ [AdminAuth] 恢复 session 失败:', error)
      return false
    }
  }, [])

  // 初始化：尝试恢复 session（增强版 - 使用多层次存储）
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const init = async () => {
      console.log('🚀 [AdminAuth] 开始初始化（增强版存储恢复）...')
      
      // 优先级1：尝试从增强存储管理器恢复
      try {
        const cachedData = await superAdminStorage.getSuperAdminData()
        if (cachedData && cachedData.isSuperAdmin && cachedData.userId) {
          console.log('✅ [AdminAuth] 从增强存储恢复数据，验证 session...')
          
          // 验证 Supabase session 是否仍然有效
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (session && !error && session.user.id === cachedData.userId) {
            // Session 有效，直接恢复状态
            const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)
            const profile = storedProfile ? JSON.parse(storedProfile) : null
            
            if (profile && profile.user_type === 'admin' && profile.user_id === cachedData.userId) {
              console.log('✅ [AdminAuth] 从增强存储快速恢复成功')
              
              setState({
                user: session.user,
                session: session,
                profile: profile,
                isAdmin: true,
                loading: false,
                error: null
              })
              
              // 更新存储时间戳
              superAdminStorage.saveSuperAdminData({
                isSuperAdmin: true,
                userId: session.user.id,
                user: session.user,
                token: session.access_token,
                permissions: []
              })
              
              return
            }
          } else {
            console.log('⚠️ [AdminAuth] 缓存的 session 已失效，尝试刷新...')
            // 尝试使用 refresh_token 刷新
            const restored = await restoreSession()
            if (restored) {
              return
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [AdminAuth] 从增强存储恢复失败，使用标准流程:', error)
      }
      
      // 优先级2：标准恢复流程（从 Supabase 获取 session）
      console.log('🔄 [AdminAuth] 使用标准恢复流程...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session && !error) {
        console.log('✅ [AdminAuth] 从 Supabase 获取到 session')
        
        // 优先使用缓存的 profile
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)
        let profile = storedProfile ? JSON.parse(storedProfile) : null
        
        // 如果缓存的 profile 存在且是管理员，直接使用
        if (profile && profile.user_type === 'admin' && profile.user_id === session.user.id) {
          console.log('✅ [AdminAuth] 使用缓存的 profile')
          // 直接使用缓存的 profile，设置 state 并返回
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type,
            user: session.user
          }
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
          localStorage.setItem(LAST_VALIDATED_KEY, Date.now().toString())

          // 同时存储到 cookie（作为补充）
          setSessionCookie({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0,
            user_id: session.user.id,
            user_email: session.user.email || ''
          })

          setState({
            user: session.user,
            session: session,
            profile: profile,
            isAdmin: true,
            loading: false,
            error: null
          })
          
          // 保存到增强存储管理器
          superAdminStorage.saveSuperAdminData({
            isSuperAdmin: true,
            userId: session.user.id,
            user: session.user,
            token: session.access_token,
            permissions: []
          })
          
          console.log('✅ [AdminAuth] 从缓存恢复成功（已保存到增强存储）')
          return
        }
        
        // 否则查询数据库（带超时保护）
        console.log('🔄 [AdminAuth] 从数据库获取 profile...')
        try {
          const profilePromise = supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('查询超时')), 15000) // 15秒超时
          })
          
          const { data: profileData, error: profileError } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any

          if (profileError || !profileData || profileData.user_type !== 'admin') {
            console.error('❌ [AdminAuth] 用户不是管理员或获取资料失败:', profileError)
            setState(prev => ({ ...prev, loading: false }))
            return
          }
          
          profile = profileData
        } catch (error: any) {
          if (error.message === '查询超时') {
            console.warn('⏰ [AdminAuth] Profile 查询超时，尝试使用缓存的 profile')
            // 如果查询超时，尝试使用缓存的 profile
            if (profile && profile.user_type === 'admin' && profile.user_id === session.user.id) {
              console.log('✅ [AdminAuth] 使用缓存的 profile（查询超时）')
              // 使用缓存的 profile
              const sessionData = {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                expires_in: session.expires_in,
                token_type: session.token_type,
                user: session.user
              }
              localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
              localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
              localStorage.setItem(LAST_VALIDATED_KEY, Date.now().toString())

              setSessionCookie({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at || 0,
                user_id: session.user.id,
                user_email: session.user.email || ''
              })

              setState({
                user: session.user,
                session: session,
                profile: profile,
                isAdmin: true,
                loading: false,
                error: null
              })
              return
            } else {
              console.error('❌ [AdminAuth] 缓存的 profile 无效')
              setState(prev => ({ ...prev, loading: false }))
              return
            }
          } else {
            console.error('❌ [AdminAuth] 获取 profile 失败:', error)
            setState(prev => ({ ...prev, loading: false }))
            return
          }
        }

        // 如果获取到有效的管理员 profile，设置 state
        if (profile && profile.user_type === 'admin') {
          // 保存到 localStorage
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type,
            user: session.user
          }
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
          localStorage.setItem(LAST_VALIDATED_KEY, Date.now().toString())

          // 同时存储到 cookie（作为补充）
          setSessionCookie({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0,
            user_id: session.user.id,
            user_email: session.user.email || ''
          })

          setState({
            user: session.user,
            session: session,
            profile: profile,
            isAdmin: true,
            loading: false,
            error: null
          })
          
          // 保存到增强存储管理器
          superAdminStorage.saveSuperAdminData({
            isSuperAdmin: true,
            userId: session.user.id,
            user: session.user,
            token: session.access_token,
            permissions: []
          })
          
          return
        }
      }

      // 如果 Supabase 没有 session，尝试从 localStorage 恢复
      const restored = await restoreSession()
      if (!restored) {
        console.log('⚠️ [AdminAuth] 无法恢复 session，用户需要重新登录')
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    init()
  }, [restoreSession])

  // 页面可见性API监听 - 页面重新获得焦点时检查会话
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.isAdmin && state.user) {
        console.log('👁️ [AdminAuth] 页面重新获得焦点，检查会话状态...')
        
        // 快速验证 session 是否仍然有效
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error || !session || session.user.id !== state.user?.id) {
            console.warn('⚠️ [AdminAuth] 会话已失效，尝试恢复...')
            restoreSession()
          } else {
            console.log('✅ [AdminAuth] 会话仍然有效')
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [state.isAdmin, state.user, restoreSession])

  // 页面卸载前保存状态快照
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.isAdmin && state.user && state.profile) {
        console.log('💾 [AdminAuth] 页面即将卸载，保存状态快照...')
        
        // 保存状态快照到 sessionStorage
        try {
          const snapshot = {
            isAdmin: state.isAdmin,
            userId: state.user.id,
            userEmail: state.user.email,
            profileId: state.profile.id,
            timestamp: Date.now(),
            url: window.location.href
          }
          
          sessionStorage.setItem('ADMIN_AUTH_SNAPSHOT', JSON.stringify(snapshot))
          
          // 确保增强存储已保存
          superAdminStorage.saveSuperAdminData({
            isSuperAdmin: true,
            userId: state.user.id,
            user: state.user,
            token: state.session?.access_token || '',
            permissions: []
          })
        } catch (error) {
          console.warn('⚠️ [AdminAuth] 保存快照失败:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [state.isAdmin, state.user, state.profile, state.session])

  // 页面加载时恢复快照（如果存在）
  useEffect(() => {
    try {
      const snapshotStr = sessionStorage.getItem('ADMIN_AUTH_SNAPSHOT')
      if (snapshotStr) {
        const snapshot = JSON.parse(snapshotStr)
        
        // 检查是否是同一页面且时间间隔短（5秒内）
        if (snapshot.url === window.location.href && 
            Date.now() - snapshot.timestamp < 5000) {
          console.log('✅ [AdminAuth] 检测到快速刷新，使用快照恢复...')
          // 快照会在初始化流程中被使用
        }
        
        // 清理快照（无论是否使用）
        sessionStorage.removeItem('ADMIN_AUTH_SNAPSHOT')
      }
    } catch (error) {
      console.warn('⚠️ [AdminAuth] 恢复快照失败:', error)
    }
  }, [])

  // 监听认证状态变化
  useEffect(() => {
    let profileFetchInProgress = false // 防止重复查询
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AdminAuth] 认证状态变化:', event)

      if (event === 'SIGNED_IN' && session) {
        // 如果已经有 profile 且用户 ID 相同，跳过查询
        if (state.profile && state.profile.user_id === session.user.id) {
          console.log('✅ [AdminAuth] 用户资料已存在，跳过重复查询')
          return
        }
        
        // 如果正在查询中，跳过
        if (profileFetchInProgress) {
          console.log('⏸️ [AdminAuth] 用户资料查询进行中，跳过重复查询')
          return
        }
        
        profileFetchInProgress = true
        
        // 验证是否是管理员（带超时保护）
        let profile = null
        let profileError = null
        
        try {
          const profilePromise = supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('查询超时')), 15000) // 15秒超时
          })
          
          const result = await Promise.race([profilePromise, timeoutPromise]) as any
          profile = result.data
          profileError = result.error
        } catch (error: any) {
          if (error.message === '查询超时') {
            console.warn('⏰ [AdminAuth] Profile 查询超时')
            profileError = { message: '查询超时' }
          } else {
            profileError = error
          }
        } finally {
          profileFetchInProgress = false
        }

        if (!profileError && profile && profile.user_type === 'admin') {
          // 保存到 localStorage
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type,
            user: session.user
          }
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
          localStorage.setItem(LAST_VALIDATED_KEY, Date.now().toString())

          // 同时存储到 cookie（作为补充）
          setSessionCookie({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0,
            user_id: session.user.id,
            user_email: session.user.email || ''
          })

          setState({
            user: session.user,
            session: session,
            profile: profile,
            isAdmin: true,
            loading: false,
            error: null
          })
          
          // 保存到增强存储管理器
          superAdminStorage.saveSuperAdminData({
            isSuperAdmin: true,
            userId: session.user.id,
            user: session.user,
            token: session.access_token,
            permissions: []
          })
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            profile: null,
            isAdmin: false,
            loading: false,
            error: '用户不是管理员'
          }))
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SESSION_STORAGE_KEY)
        localStorage.removeItem(PROFILE_STORAGE_KEY)
        localStorage.removeItem(LAST_VALIDATED_KEY)
        
        // 清除 cookie
        clearSessionCookie()
        
        // 清除增强存储管理器
        superAdminStorage.clearAll()

        setState({
          user: null,
          session: null,
          profile: null,
          isAdmin: false,
          loading: false,
          error: null
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [state.profile]) // 只依赖 profile，避免重复查询

  // 登录
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }))
        return { success: false, error: error.message }
      }

      if (!data.session) {
        setState(prev => ({ ...prev, loading: false, error: '登录失败：未获取到 session' }))
        return { success: false, error: '登录失败：未获取到 session' }
      }

      // 验证是否是管理员（带超时保护）
      let profile = null
      let profileError = null
      
      try {
        const profilePromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.session.user.id)
          .single()
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('查询超时')), 15000) // 15秒超时
        })
        
        const result = await Promise.race([profilePromise, timeoutPromise]) as any
        profile = result.data
        profileError = result.error
      } catch (error: any) {
        if (error.message === '查询超时') {
          console.warn('⏰ [AdminAuth] Profile 查询超时')
          profileError = { message: '查询超时' }
        } else {
          profileError = error
        }
      }

      if (profileError || !profile || profile.user_type !== 'admin') {
        // 如果是管理员邮箱但 profile 不存在，尝试创建
        if (email === 'admin@tiklive.pro' && profileError?.code === 'PGRST116') {
          console.log('🔧 [AdminAuth] 创建管理员 profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: data.session.user.id,
              user_type: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
            .select()
            .single()

          if (createError || !newProfile) {
            setState(prev => ({ ...prev, loading: false, error: '创建管理员资料失败' }))
            await supabase.auth.signOut()
            return { success: false, error: '创建管理员资料失败' }
          }

          // 保存到 localStorage
          const sessionData = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            expires_in: data.session.expires_in,
            token_type: data.session.token_type,
            user: data.session.user
          }
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile))
          localStorage.setItem(LAST_VALIDATED_KEY, Date.now().toString())

          // 同时存储到 cookie（作为补充）
          setSessionCookie({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0,
            user_id: data.session.user.id,
            user_email: data.session.user.email || ''
          })

          setState({
            user: data.session.user,
            session: data.session,
            profile: newProfile,
            isAdmin: true,
            loading: false,
            error: null
          })

          // 保存到增强存储管理器
          superAdminStorage.saveSuperAdminData({
            isSuperAdmin: true,
            userId: data.session.user.id,
            user: data.session.user,
            token: data.session.access_token,
            permissions: []
          })

          return { success: true }
        }

        setState(prev => ({ ...prev, loading: false, error: '用户不是管理员' }))
        await supabase.auth.signOut()
        return { success: false, error: '用户不是管理员' }
      }

      // 保存到 localStorage
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user
      }
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
      localStorage.setItem(LAST_VALIDATED_KEY, Date.now().toString())

      // 同时存储到 cookie（作为补充）
      setSessionCookie({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
        user_id: data.session.user.id,
        user_email: data.session.user.email || ''
      })

      setState({
        user: data.session.user,
        session: data.session,
        profile: profile,
        isAdmin: true,
        loading: false,
        error: null
      })

      // 保存到增强存储管理器（多层次存储）
      superAdminStorage.saveSuperAdminData({
        isSuperAdmin: true,
        userId: data.session.user.id,
        user: data.session.user,
        token: data.session.access_token,
        permissions: []
      })

      return { success: true }
    } catch (error: any) {
      console.error('❌ [AdminAuth] 登录失败:', error)
      setState(prev => ({ ...prev, loading: false, error: error.message || '登录失败' }))
      return { success: false, error: error.message || '登录失败' }
    }
  }, [])

  // 登出
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem(SESSION_STORAGE_KEY)
      localStorage.removeItem(PROFILE_STORAGE_KEY)
      localStorage.removeItem(LAST_VALIDATED_KEY)
      
      // 清除 cookie
      clearSessionCookie()
      
      // 清除增强存储管理器
      superAdminStorage.clearAll()

      setState({
        user: null,
        session: null,
        profile: null,
        isAdmin: false,
        loading: false,
        error: null
      })
    } catch (error: any) {
      console.error('❌ [AdminAuth] 登出失败:', error)
    }
  }, [])

  // 刷新 session
  const refreshSession = useCallback(async () => {
    if (isRefreshing.current) {
      console.log('⏸️ [AdminAuth] 已在刷新中，跳过')
      return
    }

    isRefreshing.current = true
    try {
      const restored = await restoreSession()
      if (!restored) {
        setState(prev => ({ ...prev, loading: false, error: 'Session 已过期，请重新登录' }))
      }
    } finally {
      isRefreshing.current = false
    }
  }, [restoreSession])

  // 确保 isAdmin 始终与 profile 同步（实时计算，确保准确性）
  const computedIsAdmin = !!(state.profile && state.profile.user_type === 'admin' && state.user)
  
  // 如果计算值与 state 不一致，更新 state（但避免无限循环）
  useEffect(() => {
    if (state.profile && state.user && computedIsAdmin !== state.isAdmin) {
      console.log('🔄 [AdminAuth] 同步 isAdmin 状态:', { 
        computed: computedIsAdmin, 
        state: state.isAdmin,
        profileType: state.profile.user_type 
      })
      setState(prev => ({ ...prev, isAdmin: computedIsAdmin }))
    }
  }, [state.profile, state.user, computedIsAdmin, state.isAdmin])
  
  const value: AdminAuthContextType = {
    ...state,
    isAdmin: computedIsAdmin, // 使用计算值，确保始终正确
    signIn,
    signOut,
    refreshSession
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth 必须在 AdminAuthProvider 内使用')
  }
  return context
}

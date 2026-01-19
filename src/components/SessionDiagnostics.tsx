import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Copy, Trash2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function SessionDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [realTimeSession, setRealTimeSession] = useState<any>(null)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('')

  // 实时监控 session 状态
  useEffect(() => {
    const updateSessionStatus = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          setRealTimeSession({ error: error.message })
          return
        }

        if (session) {
          const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
          const now = new Date()
          const isExpired = expiresAt ? expiresAt < now : false
          const timeLeft = expiresAt ? expiresAt.getTime() - now.getTime() : 0
          
          let timeLeftStr = ''
          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60))
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
            timeLeftStr = `${hours}小时 ${minutes}分钟 ${seconds}秒`
          } else if (isExpired) {
            timeLeftStr = '已过期'
          }

          setRealTimeSession({
            exists: true,
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: expiresAt?.toISOString(),
            expiresAtLocal: expiresAt?.toLocaleString(),
            isExpired,
            timeLeft,
            accessTokenLength: session.access_token?.length || 0,
            refreshTokenLength: session.refresh_token?.length || 0
          })
          setTimeUntilExpiry(timeLeftStr)
        } else {
          setRealTimeSession({ exists: false })
          setTimeUntilExpiry('无 session')
        }
      } catch (err: any) {
        setRealTimeSession({ error: err.message })
      }
    }

    // 立即更新一次
    updateSessionStatus()

    // 每秒更新一次（用于显示倒计时）
    const interval = setInterval(updateSessionStatus, 1000)

    return () => clearInterval(interval)
  }, [])

  const checkDiagnostics = async () => {
    setLoading(true)
    try {
      const result: any = {
        timestamp: new Date().toISOString(),
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        supabaseSession: null,
        networkInfo: null,
        issues: [],
        recommendations: []
      }

      // 1. 检查 Cookies
      if (typeof document !== 'undefined') {
        const allCookies = document.cookie.split(';').map(c => c.trim())
        result.cookies = allCookies.map(cookie => {
          const [name, value] = cookie.split('=')
          const cookieObj: any = { name, value: value || '' }
          
          // 尝试获取 Cookie 属性（需要特殊方法）
          const cookieString = document.cookie
          if (cookieString.includes(name)) {
            cookieObj.exists = true
          }
          
          return cookieObj
        })

        // 检查是否有 admin_session_info cookie
        const adminSessionCookie = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('admin_session_info='))
        
        if (result.cookies.length === 0) {
          result.issues.push('未找到任何 Cookie')
          result.recommendations.push('Supabase 默认使用 localStorage 存储 session，不使用 Cookie。如果需要跨页面权限传递，可以考虑使用 Cookie 作为补充存储。')
        } else if (!adminSessionCookie) {
          result.recommendations.push('建议：可以启用 Cookie 存储作为 localStorage 的补充，以增强跨页面权限传递')
        }
      }

      // 2. 检查 LocalStorage
      if (typeof window !== 'undefined') {
        const localStorageData: any = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            try {
              const value = localStorage.getItem(key)
              localStorageData[key] = {
                exists: true,
                value: value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : null,
                size: value ? value.length : 0
              }
            } catch (e) {
              localStorageData[key] = { error: '无法读取' }
            }
          }
        }
        result.localStorage = localStorageData

        // 检查 Supabase session token（详细解析）
        const sessionKey = 'sb-auth-token'
        if (localStorageData[sessionKey]) {
          try {
            const sessionData = JSON.parse(localStorage.getItem(sessionKey) || '{}')
            const expiresAtTimestamp = sessionData.expires_at
            const expiresAtDate = expiresAtTimestamp ? new Date(expiresAtTimestamp * 1000) : null
            const now = new Date()
            const isExpired = expiresAtTimestamp ? expiresAtTimestamp * 1000 < Date.now() : null
            const timeUntilExpiry = expiresAtTimestamp && !isExpired 
              ? expiresAtTimestamp * 1000 - Date.now() 
              : null
            
            let timeUntilExpiryStr = ''
            if (timeUntilExpiry && timeUntilExpiry > 0) {
              const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60))
              const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60))
              const seconds = Math.floor((timeUntilExpiry % (1000 * 60)) / 1000)
              timeUntilExpiryStr = `${hours}小时 ${minutes}分钟 ${seconds}秒`
            }

            result.supabaseSession = {
              exists: true,
              hasAccessToken: !!sessionData.access_token,
              hasRefreshToken: !!sessionData.refresh_token,
              expiresAt: expiresAtDate?.toISOString() || null,
              expiresAtLocal: expiresAtDate?.toLocaleString() || null,
              expiresAtTimestamp: expiresAtTimestamp,
              expiresIn: sessionData.expires_in || null,
              isExpired,
              timeUntilExpiry: timeUntilExpiryStr || (isExpired ? '已过期' : '未知'),
              userId: sessionData.user?.id || null,
              userEmail: sessionData.user?.email || null,
              tokenType: sessionData.token_type || null,
              accessTokenPreview: sessionData.access_token 
                ? `${sessionData.access_token.substring(0, 20)}...${sessionData.access_token.substring(sessionData.access_token.length - 20)}`
                : null,
              accessTokenLength: sessionData.access_token?.length || 0,
              refreshTokenPreview: sessionData.refresh_token 
                ? `${sessionData.refresh_token.substring(0, 10)}...${sessionData.refresh_token.substring(sessionData.refresh_token.length - 10)}`
                : null,
              refreshTokenLength: sessionData.refresh_token?.length || 0
            }

            if (result.supabaseSession.isExpired) {
              result.issues.push('Session 已过期')
              result.recommendations.push('需要刷新 token 或重新登录')
            } else if (timeUntilExpiry && timeUntilExpiry < 5 * 60 * 1000) {
              result.issues.push('Session 即将过期（5分钟内）')
              result.recommendations.push('建议刷新 token 以延长 session')
            }
          } catch (e: any) {
            result.issues.push(`无法解析 session 数据: ${e.message}`)
            console.error('解析 session 数据失败:', e)
          }
        } else {
          result.issues.push('未找到 Supabase session token (sb-auth-token)')
          result.recommendations.push('用户可能未登录或 session 未正确保存')
        }
      }

      // 3. 检查 SessionStorage
      if (typeof window !== 'undefined') {
        const sessionStorageData: any = {}
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key) {
            try {
              const value = sessionStorage.getItem(key)
              sessionStorageData[key] = {
                exists: true,
                value: value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : null,
                size: value ? value.length : 0
              }
            } catch (e) {
              sessionStorageData[key] = { error: '无法读取' }
            }
          }
        }
        result.sessionStorage = sessionStorageData
        
        // 如果 sessionStorage 为空，这是正常的（Supabase 使用 localStorage）
        // 不需要添加为问题，因为这是预期的行为
      }

      // 4. 检查 Supabase Session
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          result.issues.push(`Supabase session 错误: ${error.message}`)
        } else if (session) {
          result.supabaseSession = {
            ...result.supabaseSession,
            supabaseHasSession: true,
            supabaseUserId: session.user?.id,
            supabaseUserEmail: session.user?.email,
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            isExpired: session.expires_at ? session.expires_at * 1000 < Date.now() : false
          }
        } else {
          result.issues.push('Supabase 没有活动 session')
          result.recommendations.push('需要重新登录')
        }
      } catch (e: any) {
        result.issues.push(`检查 Supabase session 失败: ${e.message}`)
      }

      // 5. 检查网络信息
      if (typeof window !== 'undefined') {
        result.networkInfo = {
          currentUrl: window.location.href,
          origin: window.location.origin,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          port: window.location.port
        }
      }

      setDiagnostics(result)
    } catch (error: any) {
      console.error('诊断检查失败:', error)
      setDiagnostics({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDiagnostics()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  const clearStorage = (type: 'localStorage' | 'sessionStorage' | 'all') => {
    if (type === 'localStorage' || type === 'all') {
      localStorage.clear()
    }
    if (type === 'sessionStorage' || type === 'all') {
      sessionStorage.clear()
    }
    checkDiagnostics()
    alert('存储已清除')
  }

  if (!diagnostics) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">加载诊断信息...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Session 持久化诊断工具</h2>
        <div className="flex space-x-2">
          <button
            onClick={checkDiagnostics}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 问题摘要 */}
      {diagnostics.issues && diagnostics.issues.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            发现的问题
          </h3>
          <ul className="list-disc list-inside text-yellow-800 space-y-1">
            {diagnostics.issues.map((issue: string, index: number) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 建议 */}
      {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">建议</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-1">
            {diagnostics.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cookies */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">🍪</span>
          Cookies ({diagnostics.cookies?.length || 0})
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          {diagnostics.cookies && diagnostics.cookies.length > 0 ? (
            <div className="space-y-2">
              {diagnostics.cookies.map((cookie: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <div className="font-mono text-sm">
                      <span className="font-semibold">{cookie.name}</span>
                      {cookie.value && (
                        <span className="text-gray-600"> = {cookie.value.length > 50 ? cookie.value.substring(0, 50) + '...' : cookie.value}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${cookie.name}=${cookie.value}`)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    title="复制"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">未找到 Cookie（Supabase 默认使用 localStorage）</p>
              <p className="text-xs text-gray-400">
                💡 提示：如果需要跨页面权限传递，可以考虑使用 Cookie 作为补充存储
              </p>
            </div>
          )}
        </div>
      </div>

      {/* LocalStorage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">💾</span>
            LocalStorage ({Object.keys(diagnostics.localStorage || {}).length})
          </h3>
          <button
            onClick={() => clearStorage('localStorage')}
            className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>清除</span>
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          {diagnostics.localStorage && Object.keys(diagnostics.localStorage).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(diagnostics.localStorage).map(([key, value]: [string, any]) => (
                <div key={key} className="p-3 bg-white rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-sm font-semibold">{key}</div>
                    {key === 'sb-auth-token' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Supabase Session</span>
                    )}
                  </div>
                  {value.error ? (
                    <div className="text-red-600 text-xs">{value.error}</div>
                  ) : (
                    <div className="text-xs text-gray-600">
                      <div>大小: {value.size} 字节</div>
                      {value.value && (
                        <div className="mt-1 font-mono bg-gray-100 p-2 rounded break-all">
                          {value.value}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">LocalStorage 为空</p>
          )}
        </div>
      </div>

      {/* SessionStorage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📦</span>
            SessionStorage ({Object.keys(diagnostics.sessionStorage || {}).length})
          </h3>
          <button
            onClick={() => clearStorage('sessionStorage')}
            className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>清除</span>
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          {diagnostics.sessionStorage && Object.keys(diagnostics.sessionStorage).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(diagnostics.sessionStorage).map(([key, value]: [string, any]) => (
                <div key={key} className="p-3 bg-white rounded border">
                  <div className="font-mono text-sm font-semibold mb-2">{key}</div>
                  {value.error ? (
                    <div className="text-red-600 text-xs">{value.error}</div>
                  ) : (
                    <div className="text-xs text-gray-600">
                      <div>大小: {value.size} 字节</div>
                      {value.value && (
                        <div className="mt-1 font-mono bg-gray-100 p-2 rounded break-all">
                          {value.value}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">SessionStorage 为空</p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800 font-medium mb-1">ℹ️ 说明</p>
                <p className="text-xs text-blue-700">
                  SessionStorage 为空是<strong>正常现象</strong>。Supabase 使用 <strong>localStorage</strong> 进行持久化存储，而不是 sessionStorage。
                </p>
                <div className="mt-2 text-xs text-blue-600 space-y-1">
                  <p><strong>localStorage</strong>：持久化存储，关闭浏览器后仍然存在 ✅</p>
                  <p><strong>sessionStorage</strong>：会话级存储，关闭标签页后清除 ❌</p>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  因此，Supabase 选择 localStorage 以确保登录状态在刷新页面后仍然有效。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Session 状态 - 实时监控 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">🔐</span>
          Supabase Session 状态（实时监控）
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          {realTimeSession ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {realTimeSession.exists && !realTimeSession.isExpired ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : realTimeSession.exists && realTimeSession.isExpired ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {realTimeSession.exists 
                    ? (realTimeSession.isExpired ? 'Session 已过期' : 'Session 有效')
                    : 'Session 不存在'}
                </span>
              </div>
              
              {realTimeSession.exists && (
                <>
                  {realTimeSession.userId && (
                    <div className="text-sm space-y-1">
                      <div>用户ID: <code className="bg-gray-200 px-1 rounded">{realTimeSession.userId}</code></div>
                      <div>用户邮箱: <code className="bg-gray-200 px-1 rounded">{realTimeSession.email}</code></div>
                    </div>
                  )}
                  
                  {realTimeSession.expiresAt && (
                    <div className="text-sm space-y-1">
                      <div>过期时间: <code className="bg-gray-200 px-1 rounded">{realTimeSession.expiresAtLocal}</code></div>
                      <div className={`font-semibold ${realTimeSession.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                        {realTimeSession.isExpired ? '⚠️ Session 已过期' : `⏰ 剩余时间: ${timeUntilExpiry}`}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm space-y-1">
                    <div>Access Token: {realTimeSession.accessTokenLength > 0 ? `✅ 存在 (${realTimeSession.accessTokenLength} 字符)` : '❌ 不存在'}</div>
                    <div>Refresh Token: {realTimeSession.refreshTokenLength > 0 ? `✅ 存在 (${realTimeSession.refreshTokenLength} 字符)` : '❌ 不存在'}</div>
                  </div>
                </>
              )}
              
              {realTimeSession.error && (
                <div className="text-red-600 text-sm">错误: {realTimeSession.error}</div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">加载中...</p>
          )}
        </div>
      </div>

      {/* 存储的 Session 信息 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">💾</span>
          LocalStorage 中的 Session
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          {diagnostics.supabaseSession ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {diagnostics.supabaseSession.supabaseHasSession ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {diagnostics.supabaseSession.supabaseHasSession ? 'Session 存在' : 'Session 不存在'}
                </span>
              </div>
              {diagnostics.supabaseSession.userId && (
                <div className="text-sm">
                  <div>用户ID: <code className="bg-gray-200 px-1 rounded">{diagnostics.supabaseSession.userId}</code></div>
                  <div>用户邮箱: <code className="bg-gray-200 px-1 rounded">{diagnostics.supabaseSession.userEmail || diagnostics.supabaseSession.supabaseUserEmail}</code></div>
                </div>
              )}
              {diagnostics.supabaseSession.expiresAtLocal && (
                <div className="text-sm space-y-1">
                  <div>过期时间: <code className="bg-gray-200 px-1 rounded">{diagnostics.supabaseSession.expiresAtLocal}</code></div>
                  {diagnostics.supabaseSession.expiresAtTimestamp && (
                    <div className="text-xs text-gray-500">
                      时间戳: <code className="bg-gray-200 px-1 rounded">{diagnostics.supabaseSession.expiresAtTimestamp}</code>
                    </div>
                  )}
                  {diagnostics.supabaseSession.expiresIn && (
                    <div className="text-xs text-gray-500">
                      有效期: <code className="bg-gray-200 px-1 rounded">{diagnostics.supabaseSession.expiresIn} 秒 ({Math.floor(diagnostics.supabaseSession.expiresIn / 60)} 分钟)</code>
                    </div>
                  )}
                  {diagnostics.supabaseSession.timeUntilExpiry && (
                    <div className={`font-semibold ${diagnostics.supabaseSession.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                      {diagnostics.supabaseSession.isExpired 
                        ? '⚠️ Session 已过期' 
                        : `⏰ 剩余时间: ${diagnostics.supabaseSession.timeUntilExpiry}`}
                    </div>
                  )}
                </div>
              )}
              <div className="text-sm space-y-1">
                <div>Access Token: {diagnostics.supabaseSession.hasAccessToken ? `✅ 存在 (${diagnostics.supabaseSession.accessTokenLength || 0} 字符)` : '❌ 不存在'}</div>
                {diagnostics.supabaseSession.accessTokenPreview && (
                  <div className="text-xs text-gray-500 font-mono ml-4">
                    预览: {diagnostics.supabaseSession.accessTokenPreview}
                  </div>
                )}
                <div>Refresh Token: {diagnostics.supabaseSession.hasRefreshToken ? `✅ 存在 (${diagnostics.supabaseSession.refreshTokenLength || 0} 字符)` : '❌ 不存在'}</div>
                {diagnostics.supabaseSession.refreshTokenPreview && (
                  <div className="text-xs text-gray-500 font-mono ml-4">
                    预览: {diagnostics.supabaseSession.refreshTokenPreview}
                  </div>
                )}
                {diagnostics.supabaseSession.tokenType && (
                  <div>Token 类型: <code className="bg-gray-200 px-1 rounded">{diagnostics.supabaseSession.tokenType}</code></div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">未找到 Supabase Session 信息</p>
          )}
        </div>
      </div>

      {/* 网络信息 */}
      {diagnostics.networkInfo && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🌐</span>
            网络信息
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-1 text-sm">
              <div>当前URL: <code className="bg-gray-200 px-1 rounded">{diagnostics.networkInfo.currentUrl}</code></div>
              <div>Origin: <code className="bg-gray-200 px-1 rounded">{diagnostics.networkInfo.origin}</code></div>
              <div>协议: <code className="bg-gray-200 px-1 rounded">{diagnostics.networkInfo.protocol}</code></div>
              <div>主机名: <code className="bg-gray-200 px-1 rounded">{diagnostics.networkInfo.hostname}</code></div>
              {diagnostics.networkInfo.port && (
                <div>端口: <code className="bg-gray-200 px-1 rounded">{diagnostics.networkInfo.port}</code></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 时间戳 */}
      <div className="text-xs text-gray-500 text-center">
        诊断时间: {new Date(diagnostics.timestamp).toLocaleString()}
      </div>
    </div>
  )
}

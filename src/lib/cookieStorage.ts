/**
 * Cookie 存储工具函数
 * 用于在 localStorage 之外，额外将 session 信息存储到 cookies
 * 以增强跨页面权限传递和持久化
 */

// 设置 Cookie
export function setCookie(
  name: string,
  value: string,
  options: {
    expires?: number // 过期时间（秒）
    path?: string
    domain?: string
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  } = {}
) {
  if (typeof document === 'undefined') return

  const {
    expires,
    path = '/',
    domain,
    secure = false,
    sameSite = 'Lax'
  } = options

  let cookieString = `${name}=${encodeURIComponent(value)}`

  if (expires) {
    const date = new Date()
    date.setTime(date.getTime() + expires * 1000)
    cookieString += `; expires=${date.toUTCString()}`
  }

  cookieString += `; path=${path}`

  if (domain) {
    cookieString += `; domain=${domain}`
  }

  if (secure) {
    cookieString += `; secure`
  }

  cookieString += `; SameSite=${sameSite}`

  document.cookie = cookieString
}

// 获取 Cookie
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const nameEQ = name + '='
  const ca = document.cookie.split(';')

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length))
    }
  }

  return null
}

// 删除 Cookie
export function deleteCookie(name: string, path: string = '/', domain?: string) {
  if (typeof document === 'undefined') return

  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`
  if (domain) {
    cookieString += `; domain=${domain}`
  }
  document.cookie = cookieString
}

// 将 session 信息存储到 cookie（作为 localStorage 的补充）
export function setSessionCookie(sessionData: {
  access_token: string
  refresh_token: string
  expires_at: number
  user_id: string
  user_email: string
}) {
  try {
    // 存储一个简化的 session 标识到 cookie
    // 注意：cookie 有大小限制（约 4KB），所以只存储关键信息
    const sessionInfo = {
      user_id: sessionData.user_id,
      user_email: sessionData.user_email,
      expires_at: sessionData.expires_at,
      has_token: !!sessionData.access_token
    }

    // 计算过期时间（秒）
    const expiresIn = sessionData.expires_at
      ? Math.max(0, sessionData.expires_at - Math.floor(Date.now() / 1000))
      : 3600 // 默认 1 小时

    setCookie('admin_session_info', JSON.stringify(sessionInfo), {
      expires: expiresIn,
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax'
    })

    console.log('✅ [Cookie] Session 信息已存储到 cookie')
  } catch (error: any) {
    console.error('❌ [Cookie] 存储 session 到 cookie 失败:', error)
  }
}

// 从 cookie 获取 session 信息
export function getSessionCookie(): {
  user_id: string
  user_email: string
  expires_at: number
  has_token: boolean
} | null {
  try {
    const cookieValue = getCookie('admin_session_info')
    if (!cookieValue) return null

    const sessionInfo = JSON.parse(cookieValue)
    
    // 检查是否过期
    if (sessionInfo.expires_at && sessionInfo.expires_at < Math.floor(Date.now() / 1000)) {
      deleteCookie('admin_session_info')
      return null
    }

    return sessionInfo
  } catch (error: any) {
    console.error('❌ [Cookie] 从 cookie 读取 session 失败:', error)
    return null
  }
}

// 清除 session cookie
export function clearSessionCookie() {
  deleteCookie('admin_session_info')
  console.log('✅ [Cookie] Session cookie 已清除')
}

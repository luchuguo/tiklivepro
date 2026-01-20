/**
 * React Context 持久化工具
 * 类似 pinia-plugin-persistedstate / redux-persist
 * 自动处理状态的保存和恢复
 */

import React from 'react'

export interface PersistedStateOptions {
  key: string // 存储键名
  storage?: 'localStorage' | 'sessionStorage' | 'cookie' // 存储类型
  paths?: string[] // 需要持久化的状态路径（如 ['user', 'profile']）
  serializer?: {
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
  beforeRestore?: (context: any) => void // 恢复前的钩子
  afterRestore?: (context: any) => void // 恢复后的钩子
}

const defaultSerializer = {
  serialize: JSON.stringify,
  deserialize: JSON.parse
}

/**
 * 从存储中恢复状态
 */
export function restorePersistedState<T>(
  options: PersistedStateOptions
): T | null {
  const {
    key,
    storage = 'localStorage',
    serializer = defaultSerializer,
    beforeRestore,
    afterRestore
  } = options

  try {
    if (typeof window === 'undefined') return null

    // 执行恢复前钩子
    if (beforeRestore) {
      beforeRestore({ key, storage })
    }

    let storedValue: string | null = null

    // 根据存储类型读取
    if (storage === 'localStorage') {
      storedValue = localStorage.getItem(key)
    } else if (storage === 'sessionStorage') {
      storedValue = sessionStorage.getItem(key)
    } else if (storage === 'cookie') {
      storedValue = getCookie(key)
    }

    if (!storedValue) return null

    // 反序列化
    const restored = serializer.deserialize(storedValue)

    // 执行恢复后钩子
    if (afterRestore) {
      afterRestore({ key, storage, restored })
    }

    return restored as T
  } catch (error) {
    console.error(`[PersistedState] 恢复状态失败 (${key}):`, error)
    return null
  }
}

/**
 * 保存状态到存储
 */
export function savePersistedState<T>(
  state: T,
  options: PersistedStateOptions
): void {
  const {
    key,
    storage = 'localStorage',
    serializer = defaultSerializer,
    paths
  } = options

  try {
    if (typeof window === 'undefined') return

    // 如果指定了 paths，只保存部分状态
    let valueToSave = state
    if (paths && paths.length > 0) {
      valueToSave = paths.reduce((acc, path) => {
        const keys = path.split('.')
        let current: any = state
        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) {
            current = current[k]
          } else {
            return acc
          }
        }
        // 设置嵌套值
        let target = acc
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) target[keys[i]] = {}
          target = target[keys[i]]
        }
        target[keys[keys.length - 1]] = current
        return acc
      }, {} as any)
    }

    // 序列化
    const serialized = serializer.serialize(valueToSave)

    // 根据存储类型保存
    if (storage === 'localStorage') {
      localStorage.setItem(key, serialized)
    } else if (storage === 'sessionStorage') {
      sessionStorage.setItem(key, serialized)
    } else if (storage === 'cookie') {
      setCookie(key, serialized, {
        expires: 7 * 24 * 3600, // 默认7天
        path: '/',
        secure: window.location.protocol === 'https:',
        sameSite: 'Lax'
      })
    }
  } catch (error) {
    console.error(`[PersistedState] 保存状态失败 (${key}):`, error)
  }
}

/**
 * 清除持久化状态
 */
export function clearPersistedState(options: PersistedStateOptions): void {
  const { key, storage = 'localStorage' } = options

  try {
    if (typeof window === 'undefined') return

    if (storage === 'localStorage') {
      localStorage.removeItem(key)
    } else if (storage === 'sessionStorage') {
      sessionStorage.removeItem(key)
    } else if (storage === 'cookie') {
      deleteCookie(key)
    }
  } catch (error) {
    console.error(`[PersistedState] 清除状态失败 (${key}):`, error)
  }
}

// Cookie 工具函数
function getCookie(name: string): string | null {
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

function setCookie(
  name: string,
  value: string,
  options: {
    expires?: number
    path?: string
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  } = {}
): void {
  if (typeof document === 'undefined') return
  const { expires, path = '/', secure = false, sameSite = 'Lax' } = options
  let cookieString = `${name}=${encodeURIComponent(value)}`
  if (expires) {
    const date = new Date()
    date.setTime(date.getTime() + expires * 1000)
    cookieString += `; expires=${date.toUTCString()}`
  }
  cookieString += `; path=${path}`
  if (secure) cookieString += `; secure`
  cookieString += `; SameSite=${sameSite}`
  document.cookie = cookieString
}

function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`
}

/**
 * React Hook: 使用持久化状态
 * 类似 use-persisted-state，但兼容 React 18
 */
export function usePersistedState<T>(
  initialState: T,
  options: PersistedStateOptions
): [T, (value: T | ((prev: T) => T)) => void] {
  const { key, storage = 'localStorage' } = options

  // 初始化时从存储恢复
  const [state, setState] = React.useState<T>(() => {
    const restored = restorePersistedState<T>(options)
    return restored !== null ? restored : initialState
  })

  // 状态变化时自动保存
  React.useEffect(() => {
    savePersistedState(state, options)
  }, [state, key, storage])

  // 更新状态的函数
  const setPersistedState = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value)
    },
    []
  )

  return [state, setPersistedState]
}

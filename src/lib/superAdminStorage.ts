/**
 * 超级管理员存储管理器
 * 提供多层次存储策略，确保登录状态持久化
 */

interface SuperAdminData {
  isSuperAdmin: boolean
  userId: string
  user: any
  token: string
  permissions?: string[]
  _version?: string
  _timestamp?: number
  _expires?: number
  _sessionExpires?: number
}

class SuperAdminStorage {
  private PREFIX = 'SUPER_ADMIN_'
  private CACHE_TTL = 30 * 60 * 1000 // 30分钟缓存
  private SESSION_TTL = 2 * 60 * 60 * 1000 // 2小时会话
  private VERSION = '1.0'

  /**
   * 保存超级管理员数据（多层次存储）
   */
  saveSuperAdminData(data: SuperAdminData): void {
    if (!data || !data.isSuperAdmin) {
      console.warn('[SuperAdminStorage] 数据无效，跳过保存')
      return
    }

    const storageData: SuperAdminData = {
      ...data,
      _version: this.VERSION,
      _timestamp: Date.now(),
      _expires: Date.now() + this.CACHE_TTL
    }

    try {
      // 1. LocalStorage - 长期缓存
      localStorage.setItem(
        `${this.PREFIX}PERSISTENT`,
        JSON.stringify(storageData)
      )

      // 2. SessionStorage - 会话级缓存
      sessionStorage.setItem(
        `${this.PREFIX}SESSION`,
        JSON.stringify({
          ...storageData,
          _sessionExpires: Date.now() + this.SESSION_TTL
        })
      )

      // 3. Cookie - 备用方案（兼容性最好）
      this.setSuperAdminCookie(storageData)

      // 4. 创建备份
      localStorage.setItem(
        `${this.PREFIX}BACKUP`,
        JSON.stringify({
          ...storageData,
          _backupTimestamp: Date.now()
        })
      )

      console.log('✅ [SuperAdminStorage] 数据已保存到多层次存储')
    } catch (error) {
      console.error('❌ [SuperAdminStorage] 保存数据失败:', error)
    }
  }

  /**
   * 获取超级管理员数据（智能恢复）
   */
  async getSuperAdminData(): Promise<SuperAdminData | null> {
    // 优先级1：检查SessionStorage（最快，标签页内有效）
    const sessionData = this.getFromSessionStorage()
    if (sessionData && this.isValid(sessionData)) {
      console.log('✅ [SuperAdminStorage] 从SessionStorage恢复数据')
      return sessionData
    }

    // 优先级2：检查LocalStorage
    const persistentData = this.getFromLocalStorage()
    if (persistentData && this.isValid(persistentData)) {
      console.log('✅ [SuperAdminStorage] 从LocalStorage恢复数据')

      // 同时更新到SessionStorage
      try {
        sessionStorage.setItem(
          `${this.PREFIX}SESSION`,
          JSON.stringify({
            ...persistentData,
            _sessionExpires: Date.now() + this.SESSION_TTL
          })
        )
      } catch (error) {
        console.warn('⚠️ [SuperAdminStorage] 更新SessionStorage失败:', error)
      }

      return persistentData
    }

    // 优先级3：检查Cookie（兼容老版本）
    const cookieData = this.getFromCookie()
    if (cookieData && this.isValid(cookieData)) {
      console.log('✅ [SuperAdminStorage] 从Cookie恢复数据')
      return cookieData
    }

    // 优先级4：检查备份
    const backupData = this.getFromBackup()
    if (backupData && this.isValid(backupData)) {
      console.log('✅ [SuperAdminStorage] 从备份恢复数据')
      return backupData
    }

    console.log('⚠️ [SuperAdminStorage] 未找到有效数据')
    return null
  }

  /**
   * 验证数据有效性
   */
  isValid(data: SuperAdminData | null): boolean {
    if (!data) return false

    // 检查过期时间
    const now = Date.now()
    if (data._expires && data._expires < now) {
      console.log('⚠️ [SuperAdminStorage] 缓存已过期]')
      return false
    }

    // 检查会话过期时间
    if (data._sessionExpires && data._sessionExpires < now) {
      console.log('⚠️ [SuperAdminStorage] 会话已过期')
      return false
    }

    // 检查版本
    if (data._version !== this.VERSION) {
      console.log('⚠️ [SuperAdminStorage] 版本不匹配')
      return false
    }

    // 检查必要字段
    const requiredFields = ['isSuperAdmin', 'userId', 'token']
    for (const field of requiredFields) {
      if (!data[field as keyof SuperAdminData]) {
        console.log(`⚠️ [SuperAdminStorage] 缺少必要字段: ${field}`)
        return false
      }
    }

    return true
  }

  /**
   * 清理所有存储
   */
  clearAll(): void {
    try {
      // 清理LocalStorage
      localStorage.removeItem(`${this.PREFIX}PERSISTENT`)
      localStorage.removeItem(`${this.PREFIX}BACKUP`)

      // 清理SessionStorage
      sessionStorage.removeItem(`${this.PREFIX}SESSION`)
      sessionStorage.removeItem(`${this.PREFIX}TEMP`)

      // 清理Cookie
      this.clearCookie()

      console.log('✅ [SuperAdminStorage] 已清除所有缓存')
    } catch (error) {
      console.error('❌ [SuperAdminStorage] 清理失败:', error)
    }
  }

  /**
   * Cookie操作方法
   */
  private setSuperAdminCookie(data: SuperAdminData): void {
    try {
      const cookieValue = btoa(JSON.stringify(data))
      const expires = new Date(Date.now() + this.CACHE_TTL).toUTCString()

      document.cookie = `super_admin=${cookieValue}; expires=${expires}; path=/; SameSite=Strict`
    } catch (error) {
      console.warn('⚠️ [SuperAdminStorage] 设置Cookie失败:', error)
    }
  }

  private getFromCookie(): SuperAdminData | null {
    try {
      const cookies = document.cookie.split(';')
      for (let cookie of cookies) {
        cookie = cookie.trim()
        if (cookie.startsWith('super_admin=')) {
          const value = cookie.substring('super_admin='.length)
          return JSON.parse(atob(value))
        }
      }
    } catch (error) {
      console.error('❌ [SuperAdminStorage] 解析Cookie失败:', error)
    }
    return null
  }

  private clearCookie(): void {
    document.cookie = 'super_admin=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  }

  /**
   * LocalStorage操作方法
   */
  private getFromLocalStorage(): SuperAdminData | null {
    try {
      const data = localStorage.getItem(`${this.PREFIX}PERSISTENT`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('❌ [SuperAdminStorage] 从LocalStorage读取失败:', error)
      return null
    }
  }

  /**
   * SessionStorage操作方法
   */
  private getFromSessionStorage(): SuperAdminData | null {
    try {
      const data = sessionStorage.getItem(`${this.PREFIX}SESSION`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('❌ [SuperAdminStorage] 从SessionStorage读取失败:', error)
      return null
    }
  }

  /**
   * 备份操作方法
   */
  private getFromBackup(): SuperAdminData | null {
    try {
      const backupStr = localStorage.getItem(`${this.PREFIX}BACKUP`)
      if (!backupStr) return null

      const backup = JSON.parse(backupStr)

      // 检查备份是否过期（24小时）
      if (backup._backupTimestamp && Date.now() - backup._backupTimestamp > 24 * 60 * 60 * 1000) {
        console.log('⚠️ [SuperAdminStorage] 备份已过期')
        return null
      }

      return backup
    } catch (error) {
      console.error('❌ [SuperAdminStorage] 从备份读取失败:', error)
      return null
    }
  }
}

// 导出单例实例
export const superAdminStorage = new SuperAdminStorage()
export type { SuperAdminData }

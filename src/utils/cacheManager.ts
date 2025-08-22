interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheConfig {
  defaultTTL: number
  maxSize: number
  enablePersistent: boolean
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>()
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5分钟
    maxSize: 100,
    enablePersistent: true
  }

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config }
    this.loadPersistentCache()
  }

  // 设置缓存
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    }

    // 清理过期缓存
    this.cleanup()

    // 检查缓存大小
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, item)
    
    // 持久化缓存
    if (this.config.enablePersistent) {
      this.savePersistentCache()
    }
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  // 检查缓存是否存在且未过期
  has(key: string): boolean {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // 删除缓存
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    
    if (deleted && this.config.enablePersistent) {
      this.savePersistentCache()
    }
    
    return deleted
  }

  // 清空所有缓存
  clear(): void {
    this.cache.clear()
    
    if (this.config.enablePersistent) {
      this.savePersistentCache()
    }
  }

  // 获取缓存统计信息
  getStats() {
    const now = Date.now()
    const validItems = Array.from(this.cache.entries()).filter(([_, item]) => {
      return now - item.timestamp <= item.ttl
    })

    return {
      totalItems: this.cache.size,
      validItems: validItems.length,
      expiredItems: this.cache.size - validItems.length,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 淘汰最旧的缓存
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // 保存持久化缓存
  private savePersistentCache(): void {
    try {
      const cacheData = Array.from(this.cache.entries())
        .filter(([_, item]) => {
          // 只保存未过期的缓存
          return Date.now() - item.timestamp <= item.ttl
        })
        .map(([key, item]) => [key, item])

      localStorage.setItem('tiklive_cache', JSON.stringify(cacheData))
    } catch (error) {
      console.warn('缓存持久化失败:', error)
    }
  }

  // 加载持久化缓存
  private loadPersistentCache(): void {
    try {
      const cacheData = localStorage.getItem('tiklive_cache')
      if (cacheData) {
        const parsed = JSON.parse(cacheData)
        for (const [key, item] of parsed) {
          // 检查是否过期
          if (Date.now() - item.timestamp <= item.ttl) {
            this.cache.set(key, item)
          }
        }
      }
    } catch (error) {
      console.warn('缓存加载失败:', error)
      // 清除损坏的缓存
      localStorage.removeItem('tiklive_cache')
    }
  }

  // 估算内存使用量
  private estimateMemoryUsage(): number {
    try {
      const cacheString = JSON.stringify(Array.from(this.cache.entries()))
      return new Blob([cacheString]).size
    } catch {
      return 0
    }
  }
}

// 创建全局缓存实例
export const globalCache = new CacheManager({
  defaultTTL: 10 * 60 * 1000, // 10分钟
  maxSize: 200,
  enablePersistent: true
})

// 缓存键生成器
export const cacheKeys = {
  // 列表页面缓存
  influencersList: (filters?: any) => `influencers_list_${JSON.stringify(filters || {})}`,
  companiesList: (filters?: any) => `companies_list_${JSON.stringify(filters || {})}`,
  tasksList: (filters?: any) => `tasks_list_${JSON.stringify(filters || {})}`,
  
  // 详情页面缓存
  influencerDetail: (id: string) => `influencer_detail_${id}`,
  companyDetail: (id: string) => `company_detail_${id}`,
  taskDetail: (id: string) => `task_detail_${id}`,
  
  // 分类缓存
  categories: () => 'task_categories',
  
  // 用户资料缓存
  userProfile: (userId: string) => `user_profile_${userId}`,
  
  // 统计数据缓存
  dashboardStats: () => 'dashboard_stats',
  recentActivities: () => 'recent_activities'
}

// 缓存策略配置
export const cacheStrategies = {
  // 列表页面：短时间缓存，支持快速刷新
  list: {
    ttl: 2 * 60 * 1000, // 2分钟
    staleWhileRevalidate: 5 * 60 * 1000 // 5分钟内可以使用过期数据
  },
  
  // 详情页面：较长时间缓存，减少重复请求
  detail: {
    ttl: 10 * 60 * 1000, // 10分钟
    staleWhileRevalidate: 30 * 60 * 1000 // 30分钟内可以使用过期数据
  },
  
  // 静态数据：长时间缓存
  static: {
    ttl: 60 * 60 * 1000, // 1小时
    staleWhileRevalidate: 24 * 60 * 60 * 1000 // 24小时内可以使用过期数据
  }
}

// 导出类型
export type { CacheManager, CacheItem, CacheConfig }
export default CacheManager 
import { supabase } from './supabase'

// 缓存项接口
interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
  version: string
}

// 缓存配置
interface CacheConfig {
  ttl: number // 生存时间（毫秒）
  version: string // 缓存版本
  enableRevalidation: boolean // 是否启用重新验证
}

// 默认缓存配置
const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5分钟
  version: '1.0.0',
  enableRevalidation: true
}

// 内存缓存存储
const memoryCache = new Map<string, CacheItem<any>>()

// 缓存键生成器
function generateCacheKey(table: string, query?: string, filters?: Record<string, any>): string {
  const parts = [table]
  if (query) parts.push(query)
  if (filters) {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join(',')
    parts.push(sortedFilters)
  }
  return parts.join('|')
}

// 检查缓存是否有效
function isCacheValid<T>(cacheItem: CacheItem<T>): boolean {
  return Date.now() < cacheItem.expiresAt
}

// 后台重新验证缓存
async function revalidateCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig
): Promise<void> {
  try {
    console.log(`🔄 后台重新验证缓存: ${key}`)
    const newData = await fetcher()
    const now = Date.now()
    
    memoryCache.set(key, {
      data: newData,
      timestamp: now,
      expiresAt: now + config.ttl,
      version: config.version
    })
    
    console.log(`✅ 缓存重新验证成功: ${key}`)
  } catch (error) {
    console.error(`❌ 缓存重新验证失败: ${key}`, error)
  }
}

// 主要的数据获取函数（类似 getStaticProps）
export async function getCachedData<T>(
  table: string,
  options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    config?: Partial<CacheConfig>
  } = {}
): Promise<T> {
  const {
    select = '*',
    filters = {},
    orderBy,
    limit,
    config = {}
  } = options

  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const cacheKey = generateCacheKey(table, select, filters)

  // 检查缓存
  const cached = memoryCache.get(cacheKey)
  if (cached && isCacheValid(cached)) {
    console.log(`📦 使用缓存数据: ${cacheKey}`)
    
    // 如果启用重新验证且缓存即将过期，在后台更新
    if (finalConfig.enableRevalidation && 
        cached.expiresAt - Date.now() < finalConfig.ttl * 0.2) {
      revalidateCache(cacheKey, () => fetchFromDatabase(), finalConfig)
    }
    
    return cached.data
  }

  // 缓存无效或不存在，从数据库获取
  console.log(`🔄 从数据库获取数据: ${cacheKey}`)
  const data = await fetchFromDatabase()
  
  // 存储到缓存
  const now = Date.now()
  memoryCache.set(cacheKey, {
    data,
    timestamp: now,
    expiresAt: now + finalConfig.ttl,
    version: finalConfig.version
  })

  return data

  // 内部函数：从数据库获取数据
  async function fetchFromDatabase(): Promise<T> {
    let query = supabase.from(table).select(select)

    // 应用过滤器
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else {
          query = query.eq(key, value)
        }
      }
    })

    // 应用排序
    if (orderBy) {
      query = query.order(orderBy.column, { 
        ascending: orderBy.ascending ?? true 
      })
    }

    // 应用限制
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`数据库查询失败: ${error.message}`)
    }

    return data as T
  }
}

// 预取数据（类似 Next.js 的预取）
export async function prefetchData<T>(
  table: string,
  options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    config?: Partial<CacheConfig>
  } = {}
): Promise<void> {
  try {
    await getCachedData<T>(table, options)
    console.log(`✅ 数据预取成功: ${table}`)
  } catch (error) {
    console.error(`❌ 数据预取失败: ${table}`, error)
  }
}

// 清除缓存
export function clearCache(pattern?: string): void {
  if (pattern) {
    // 清除匹配模式的缓存
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key)
      }
    }
    console.log(`🗑️ 清除匹配模式 "${pattern}" 的缓存`)
  } else {
    // 清除所有缓存
    memoryCache.clear()
    console.log('🗑️ 清除所有缓存')
  }
}

// 获取缓存统计信息
export function getCacheStats(): {
  totalItems: number
  totalSize: number
  hitRate: number
  keys: string[]
} {
  const keys = Array.from(memoryCache.keys())
  const totalSize = JSON.stringify(Array.from(memoryCache.values())).length
  
  return {
    totalItems: memoryCache.size,
    totalSize,
    hitRate: 0, // 需要实现命中率统计
    keys
  }
}

// 特定表的缓存配置
export const CACHE_CONFIGS = {
  // 任务列表 - 频繁更新，短缓存时间
  tasks: {
    ttl: 2 * 60 * 1000, // 2分钟
    enableRevalidation: true
  },
  
  // 达人列表 - 相对稳定，较长缓存时间
  influencers: {
    ttl: 10 * 60 * 1000, // 10分钟
    enableRevalidation: true
  },
  
  // 任务分类 - 很少变化，长缓存时间
  task_categories: {
    ttl: 60 * 60 * 1000, // 1小时
    enableRevalidation: false
  },
  
  // 用户资料 - 个人数据，短缓存时间
  user_profiles: {
    ttl: 1 * 60 * 1000, // 1分钟
    enableRevalidation: true
  }
}

// 便捷函数：获取任务列表
export async function getCachedTasks(filters?: {
  category_id?: string
  status?: string
  budget_range?: string
}) {
  return getCachedData('tasks', {
    select: `
      *,
      company:companies(*),
      category:task_categories(*)
    `,
    filters: filters || {},
    orderBy: { column: 'created_at', ascending: false },
    limit: 20,
    config: CACHE_CONFIGS.tasks
  })
}

// 便捷函数：获取达人列表
export async function getCachedInfluencers(filters?: {
  category?: string
  is_approved?: boolean
  status?: string
}) {
  return getCachedData('influencers', {
    select: '*',
    filters: filters || {},
    orderBy: { column: 'rating', ascending: false },
    limit: 20,
    config: CACHE_CONFIGS.influencers
  })
}

// 便捷函数：获取任务分类
export async function getCachedTaskCategories() {
  return getCachedData('task_categories', {
    select: '*',
    filters: { is_active: true },
    orderBy: { column: 'sort_order', ascending: true },
    config: CACHE_CONFIGS.task_categories
  })
}

// 便捷函数：获取用户资料
export async function getCachedUserProfile(userId: string) {
  return getCachedData('user_profiles', {
    select: '*',
    filters: { user_id: userId },
    config: CACHE_CONFIGS.user_profiles
  })
}

// 缓存失效函数
export function invalidateCache(table: string, pattern?: string): void {
  if (pattern) {
    clearCache(`${table}|${pattern}`)
  } else {
    clearCache(table)
  }
}

// 批量预取常用数据
export async function prefetchCommonData(): Promise<void> {
  console.log('🚀 开始预取常用数据...')
  
  const prefetchPromises = [
    prefetchData('task_categories'),
    prefetchData('tasks', { 
      filters: { status: 'open' },
      limit: 10 
    }),
    prefetchData('influencers', { 
      filters: { is_approved: true, status: 'active' },
      limit: 10 
    })
  ]

  try {
    await Promise.allSettled(prefetchPromises)
    console.log('✅ 常用数据预取完成')
  } catch (error) {
    console.error('❌ 常用数据预取失败:', error)
  }
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('=== Supabase 配置检查 ===')
console.log('URL 是否设置:', supabaseUrl ? '✅ 已设置' : '❌ 未设置')
console.log('Key 是否设置:', supabaseAnonKey ? '✅ 已设置' : '❌ 未设置')

if (supabaseUrl) {
  console.log('URL 值:', supabaseUrl)
  // 检查是否是占位符值
  if (supabaseUrl === 'your_supabase_project_url') {
    console.warn('⚠️ 检测到占位符URL，请替换为实际的 Supabase 项目 URL')
  }
} else {
  console.error('❌ VITE_SUPABASE_URL 环境变量未设置')
}

if (supabaseAnonKey) {
  // 检查是否是占位符值
  if (supabaseAnonKey === 'your_supabase_anon_key') {
    console.warn('⚠️ 检测到占位符Key，请替换为实际的 Supabase anon key')
  } else {
    console.log('Key 长度:', supabaseAnonKey.length, '字符')
  }
} else {
  console.error('❌ VITE_SUPABASE_ANON_KEY 环境变量未设置')
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('=== 环境变量配置错误 ===')
  console.error('请检查 .env 文件是否存在并包含以下变量:')
  console.error('VITE_SUPABASE_URL=your_supabase_project_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  console.error('您可以在 Supabase Dashboard > Settings > API 中找到这些值')
  
  // 在开发环境中显示更详细的错误信息
  if (import.meta.env.DEV) {
    const errorMsg = `
Supabase 配置错误！

请按以下步骤配置：
1. 在项目根目录创建 .env 文件
2. 添加您的 Supabase 配置信息
3. 重启开发服务器

详情请查看控制台或点击"连接状态"按钮。
    `.trim()
    
    // 延迟显示，避免阻塞页面加载
    setTimeout(() => {
      if (confirm(errorMsg + '\n\n是否现在打开 Supabase Dashboard？')) {
        window.open('https://supabase.com/dashboard', '_blank')
      }
    }, 1000)
  }
  
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// 验证 URL 格式
try {
  const url = new URL(supabaseUrl)
  console.log('URL 格式验证:', '✅ 有效')
  console.log('项目域名:', url.hostname)
  
  // 检查是否是有效的 Supabase URL
  if (!url.hostname.includes('supabase.co')) {
    console.warn('⚠️ URL 格式可能不正确，应该类似: https://your-project.supabase.co')
  }
} catch (error) {
  console.error('❌ Supabase URL 格式无效:', supabaseUrl)
  throw new Error('Invalid Supabase URL format')
}

// 创建 Supabase 客户端，优化配置
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'tiklive-pro-web'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
})

// 创建一个带超时的查询函数
async function queryWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Query timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    queryFn()
      .then(result => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

// 增强的连接测试函数
export async function testSupabaseConnection() {
  const startTime = Date.now()
  
  try {
    console.log('🔍 开始全面的 Supabase 连接测试...')
    
    const testResults = {
      basicConnection: false,
      authentication: false,
      databaseAccess: false,
      tableStructure: false,
      rlsPolicies: false
    }
    
    const testDetails = {
      url: supabaseUrl,
      keyLength: supabaseAnonKey?.length || 0,
      testDuration: 0,
      errors: [] as string[],
      warnings: [] as string[]
    }
    
    // 测试1: 基本连接测试（使用简化的超时控制）
    console.log('📡 测试1: 基本连接测试')
    try {
      const { data: healthCheck, error: healthError } = await queryWithTimeout(
        () => supabase
          .from('user_profiles')
          .select('count')
          .limit(1),
        15000 // 15秒超时
      )
      
      if (healthError) {
        console.error('基本连接失败:', healthError)
        testDetails.errors.push(`基本连接失败: ${healthError.message}`)
        
        // 分析错误类型
        if (healthError.message?.includes('Failed to fetch')) {
          testDetails.errors.push('网络连接问题：无法访问 Supabase 服务器')
        } else if (healthError.message?.includes('CORS')) {
          testDetails.errors.push('CORS 错误：域名可能未在 Supabase 中配置')
        } else if (healthError.code === 'PGRST301') {
          testDetails.errors.push('权限错误：API 密钥可能无效或权限不足')
        }
        
        throw healthError
      }
      
      testResults.basicConnection = true
      console.log('✅ 基本连接测试通过')
    } catch (error: any) {
      if (error.message?.includes('timeout')) {
        testDetails.errors.push('连接超时：服务器响应时间过长')
      }
      console.error('❌ 基本连接测试失败:', error.message)
      
      return {
        success: false,
        error: `基本连接失败: ${error.message}`,
        details: {
          ...testDetails,
          testResults,
          testDuration: Date.now() - startTime,
          suggestions: [
            '检查 VITE_SUPABASE_URL 是否正确',
            '检查 VITE_SUPABASE_ANON_KEY 是否正确',
            '确认 Supabase 项目状态正常',
            '检查网络连接和防火墙设置',
            '验证域名是否在 Supabase 项目中配置'
          ]
        }
      }
    }
    
    // 测试2: 认证状态检查
    console.log('🔐 测试2: 认证状态检查')
    try {
      const { data: { session }, error: sessionError } = await queryWithTimeout(
        () => supabase.auth.getSession(),
        5000
      )
      
      if (sessionError) {
        console.warn('认证状态检查警告:', sessionError.message)
        testDetails.warnings.push(`认证警告: ${sessionError.message}`)
      } else {
        testResults.authentication = true
        console.log('✅ 认证系统正常，当前状态:', session ? '已登录' : '未登录')
        if (session) {
          console.log('用户邮箱:', session.user.email)
          testDetails.warnings.push(`当前用户: ${session.user.email}`)
        }
      }
    } catch (error: any) {
      console.warn('⚠️ 认证状态检查失败:', error.message)
      testDetails.warnings.push(`认证检查失败: ${error.message}`)
    }
    
    // 测试3: 数据库表访问测试
    console.log('🗄️ 测试3: 数据库表访问测试')
    const tablesToTest = [
      'user_profiles',
      'influencers', 
      'companies',
      'tasks',
      'task_categories'
    ]
    
    const tableResults: Record<string, boolean> = {}
    let accessibleTables = 0
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await queryWithTimeout(
          () => supabase
            .from(tableName)
            .select('count')
            .limit(1),
          5000 // 5秒超时
        )
        
        if (error) {
          console.error(`❌ 表 ${tableName} 访问失败:`, error.message)
          tableResults[tableName] = false
          testDetails.errors.push(`表 ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ 表 ${tableName} 访问正常`)
          tableResults[tableName] = true
          accessibleTables++
        }
      } catch (error: any) {
        console.error(`❌ 表 ${tableName} 访问异常:`, error.message)
        tableResults[tableName] = false
        testDetails.errors.push(`表 ${tableName} 访问异常: ${error.message}`)
      }
    }
    
    testResults.databaseAccess = accessibleTables > 0
    testDetails.warnings.push(`可访问表数量: ${accessibleTables}/${tablesToTest.length}`)
    
    // 测试4: 数据查询测试
    console.log('📊 测试4: 数据查询测试')
    try {
      // 测试任务分类数据
      const { data: categories, error: catError } = await queryWithTimeout(
        () => supabase
          .from('task_categories')
          .select('id, name, is_active')
          .limit(5),
        5000
      )
      
      if (catError) {
        console.error('任务分类查询失败:', catError.message)
        testDetails.errors.push(`分类查询失败: ${catError.message}`)
      } else {
        console.log(`✅ 任务分类查询成功，找到 ${categories?.length || 0} 条记录`)
        testResults.tableStructure = true
        testDetails.warnings.push(`分类数据: ${categories?.length || 0} 条`)
      }
      
      // 测试达人数据
      const { data: influencers, error: infError } = await queryWithTimeout(
        () => supabase
          .from('influencers')
          .select('id, nickname, is_approved, status')
          .limit(5),
        5000
      )
      
      if (infError) {
        console.error('达人数据查询失败:', infError.message)
        testDetails.errors.push(`达人查询失败: ${infError.message}`)
      } else {
        console.log(`✅ 达人数据查询成功，找到 ${influencers?.length || 0} 条记录`)
        testDetails.warnings.push(`达人数据: ${influencers?.length || 0} 条`)
        if (influencers && influencers.length > 0) {
          const approvedCount = influencers.filter(inf => inf.is_approved).length
          testDetails.warnings.push(`已审核达人: ${approvedCount} 条`)
        }
      }
    } catch (error: any) {
      console.error('❌ 数据查询测试失败:', error.message)
      testDetails.errors.push(`数据查询失败: ${error.message}`)
    }
    
    // 测试5: RLS 策略测试
    console.log('🛡️ 测试5: RLS 策略测试')
    try {
      // 测试公开数据访问
      const { data: publicData, error: publicError } = await queryWithTimeout(
        () => supabase
          .from('task_categories')
          .select('id, name')
          .eq('is_active', true)
          .limit(3),
        5000
      )
      
      if (publicError) {
        console.error('公开数据访问失败:', publicError.message)
        testDetails.errors.push(`RLS测试失败: ${publicError.message}`)
      } else {
        console.log(`✅ 公开数据访问正常，找到 ${publicData?.length || 0} 条分类`)
        testResults.rlsPolicies = true
        testDetails.warnings.push(`公开分类: ${publicData?.length || 0} 条`)
      }
    } catch (error: any) {
      console.error('❌ RLS 策略测试失败:', error.message)
      testDetails.errors.push(`RLS策略测试失败: ${error.message}`)
    }
    
    // 汇总测试结果
    const passedTests = Object.values(testResults).filter(Boolean).length
    const totalTests = Object.keys(testResults).length
    testDetails.testDuration = Date.now() - startTime
    
    console.log('📋 测试结果汇总:')
    console.log(`通过测试: ${passedTests}/${totalTests}`)
    console.log('详细结果:', testResults)
    console.log(`总耗时: ${testDetails.testDuration}ms`)
    
    if (passedTests >= 3) {
      return {
        success: true,
        message: `Supabase 连接基本正常 (${passedTests}/${totalTests} 项测试通过)`,
        details: {
          ...testDetails,
          testResults,
          recommendations: passedTests < totalTests ? [
            '部分功能可能受限，建议检查 RLS 策略',
            '确认所有数据表已正确创建',
            '检查用户权限配置'
          ] : []
        }
      }
    } else {
      return {
        success: false,
        error: `连接测试失败 (仅 ${passedTests}/${totalTests} 项测试通过)`,
        details: {
          ...testDetails,
          testResults,
          suggestions: [
            '检查 Supabase 项目配置',
            '确认数据库迁移已执行',
            '检查 RLS 策略设置',
            '验证 API 密钥权限',
            '确认网络连接稳定'
          ]
        }
      }
    }
    
  } catch (error: any) {
    console.error('🚨 Supabase 连接测试发生异常:', error)
    
    // 详细错误分析
    let errorType = '未知错误'
    let suggestions: string[] = []
    
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorType = '网络连接错误'
      suggestions = [
        '检查网络连接是否正常',
        '确认 Supabase URL 格式正确',
        '检查防火墙或代理设置',
        '尝试刷新页面',
        '检查 DNS 解析是否正常'
      ]
    } else if (error.message?.includes('CORS')) {
      errorType = 'CORS 跨域错误'
      suggestions = [
        '检查 Supabase 项目的域名配置',
        '确认当前域名已添加到允许列表',
        '检查 Supabase 项目状态',
        '验证项目 URL 是否正确'
      ]
    } else if (error.code === 'PGRST301' || error.message?.includes('permission')) {
      errorType = '权限错误'
      suggestions = [
        '检查 RLS 策略配置',
        '确认 API 密钥权限',
        '检查数据库表权限设置',
        '验证 anon key 是否正确'
      ]
    } else if (error.code === 'PGRST116') {
      errorType = '数据不存在'
      suggestions = [
        '确认数据库迁移已执行',
        '检查数据表是否已创建',
        '验证测试数据是否已导入',
        '检查表名是否正确'
      ]
    } else if (error.message?.includes('timeout')) {
      errorType = '连接超时'
      suggestions = [
        '检查网络连接速度',
        '尝试稍后重试',
        '检查 Supabase 服务状态',
        '考虑使用更稳定的网络环境'
      ]
    }
    
    return {
      success: false,
      error: `${errorType}: ${error.message}`,
      details: {
        url: supabaseUrl,
        keyLength: supabaseAnonKey?.length || 0,
        testDuration: Date.now() - startTime,
        errorCode: error.code,
        errorName: error.name,
        originalError: error.message,
        suggestions
      }
    }
  }
}

// 数据库类型定义
export type UserProfile = {
  id: string
  user_id: string
  user_type: 'influencer' | 'company' | 'admin'
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Influencer = {
  id: string
  user_id: string
  nickname: string
  real_name?: string
  tiktok_account?: string
  followers_count: number
  categories: string[]
  hourly_rate: number
  experience_years: number
  bio?: string
  avatar_url?: string
  is_verified: boolean
  is_approved: boolean
  rating: number
  total_reviews: number
  total_live_count: number
  avg_views: number
  location?: string
  tags: string[]
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export type Company = {
  id: string
  user_id: string
  company_name: string
  contact_person: string
  business_license?: string
  industry?: string
  company_size?: string
  website?: string
  description?: string
  logo_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type TaskCategory = {
  id: string
  name: string
  description?: string
  icon?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export type Task = {
  id: string
  company_id: string
  title: string
  description: string
  category_id?: string
  product_name?: string
  budget_min: number
  budget_max: number
  live_date: string
  duration_hours: number
  location?: string
  requirements: string[]
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  is_urgent: boolean
  max_applicants: number
  current_applicants: number
  views_count: number
  selected_influencer_id?: string
  // 新增预付 / 结算字段
  is_advance_paid: boolean
  paid_amount?: number
  is_settled: boolean
  settlement_amount?: number
  created_at: string
  updated_at: string
  // 关联数据
  company?: Company
  category?: TaskCategory
  selected_influencer?: Influencer
}

export type TaskApplication = {
  id: string
  task_id: string
  influencer_id: string
  message?: string
  proposed_rate?: number
  status: 'pending' | 'accepted' | 'refused' | 'withdrawn'
  applied_at: string
  responded_at?: string
  // 关联数据
  task?: Task
  influencer?: Influencer
}

export type Review = {
  id: string
  task_id: string
  reviewer_id: string
  reviewee_id: string
  reviewer_type: 'company' | 'influencer'
  rating: number
  comment?: string
  created_at: string
}

export type LiveSession = {
  id: string
  task_id: string
  influencer_id: string
  start_time?: string
  end_time?: string
  actual_duration?: number
  viewers_count: number
  peak_viewers: number
  engagement_rate: number
  sales_amount: number
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  stream_url?: string
  recording_url?: string
  created_at: string
  updated_at: string
}
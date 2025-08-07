/**
 * 登录性能测试脚本
 * 
 * 用于测试 email 字段索引优化后的登录性能
 */

const { createClient } = require('@supabase/supabase-js')

// 配置 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请设置环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 测试登录性能
 */
async function testLoginPerformance() {
  console.log('🚀 开始登录性能测试...\n')
  
  const testAccounts = [
    { email: 'da01@126.com', password: '123123', name: '达人用户' },
    { email: 'qiyeok@126.com', password: '123123', name: '企业用户' },
    { email: 'admin@tiklive.pro', password: 'admin888', name: '管理员' }
  ]
  
  const results = []
  
  for (const account of testAccounts) {
    console.log(`📧 测试 ${account.name} 登录: ${account.email}`)
    
    const startTime = Date.now()
    
    try {
      // 测试登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (error) {
        console.log(`  ❌ 登录失败: ${error.message}`)
        results.push({
          account: account.name,
          email: account.email,
          success: false,
          duration: duration,
          error: error.message
        })
      } else {
        console.log(`  ✅ 登录成功，耗时: ${duration}ms`)
        
        // 测试获取用户资料
        const profileStartTime = Date.now()
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
        
        const profileEndTime = Date.now()
        const profileDuration = profileEndTime - profileStartTime
        
        console.log(`  📊 获取用户资料耗时: ${profileDuration}ms`)
        
        results.push({
          account: account.name,
          email: account.email,
          success: true,
          loginDuration: duration,
          profileDuration: profileDuration,
          totalDuration: duration + profileDuration
        })
        
        // 退出登录
        await supabase.auth.signOut()
      }
      
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`  ❌ 测试异常: ${error.message}`)
      results.push({
        account: account.name,
        email: account.email,
        success: false,
        duration: duration,
        error: error.message
      })
    }
    
    console.log('') // 空行分隔
  }
  
  return results
}

/**
 * 测试快速登录 vs 手动登录性能对比
 */
async function testLoginPerformanceComparison() {
  console.log('⚡ 开始快速登录 vs 手动登录性能对比测试...\n')
  
  const testAccount = { email: 'da01@126.com', password: '123123', name: '达人用户' }
  const results = []
  
  // 测试快速登录（不获取用户资料）
  console.log(`🔍 测试快速登录: ${testAccount.email}`)
  const quickStartTime = Date.now()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testAccount.email,
      password: testAccount.password
    })
    
    const quickEndTime = Date.now()
    const quickDuration = quickEndTime - quickStartTime
    
    if (error) {
      console.log(`  ❌ 快速登录失败: ${error.message}`)
    } else {
      console.log(`  ✅ 快速登录成功，耗时: ${quickDuration}ms`)
      
      results.push({
        type: '快速登录',
        duration: quickDuration,
        success: true
      })
      
      // 退出登录
      await supabase.auth.signOut()
    }
  } catch (error) {
    console.log(`  ❌ 快速登录异常: ${error.message}`)
    results.push({
      type: '快速登录',
      duration: 0,
      success: false,
      error: error.message
    })
  }
  
  console.log('')
  
  // 测试手动登录（获取用户资料）
  console.log(`🔍 测试手动登录: ${testAccount.email}`)
  const manualStartTime = Date.now()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testAccount.email,
      password: testAccount.password
    })
    
    if (error) {
      console.log(`  ❌ 手动登录失败: ${error.message}`)
      results.push({
        type: '手动登录',
        duration: 0,
        success: false,
        error: error.message
      })
    } else {
      // 模拟获取用户资料（手动登录的额外步骤）
      const profileStartTime = Date.now()
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()
      
      const profileEndTime = Date.now()
      const profileDuration = profileEndTime - profileStartTime
      
      const manualEndTime = Date.now()
      const manualDuration = manualEndTime - manualStartTime
      
      console.log(`  ✅ 手动登录成功，总耗时: ${manualDuration}ms`)
      console.log(`  📊 其中用户资料获取耗时: ${profileDuration}ms`)
      
      results.push({
        type: '手动登录',
        duration: manualDuration,
        profileDuration: profileDuration,
        success: true
      })
      
      // 退出登录
      await supabase.auth.signOut()
    }
  } catch (error) {
    console.log(`  ❌ 手动登录异常: ${error.message}`)
    results.push({
      type: '手动登录',
      duration: 0,
      success: false,
      error: error.message
    })
  }
  
  console.log('')
  
  // 性能对比分析
  const quickLogin = results.find(r => r.type === '快速登录' && r.success)
  const manualLogin = results.find(r => r.type === '手动登录' && r.success)
  
  if (quickLogin && manualLogin) {
    const performanceDiff = manualLogin.duration - quickLogin.duration
    const performanceRatio = (performanceDiff / quickLogin.duration * 100).toFixed(1)
    
    console.log('📊 性能对比分析:')
    console.log(`  🚀 快速登录耗时: ${quickLogin.duration}ms`)
    console.log(`  👤 手动登录耗时: ${manualLogin.duration}ms`)
    console.log(`  ⏱️  性能差异: ${performanceDiff}ms (${performanceRatio}%)`)
    
    if (performanceDiff > 500) {
      console.log('  ⚠️  手动登录明显较慢，建议应用优化方案')
    } else if (performanceDiff > 200) {
      console.log('  ⚠️  手动登录稍慢，可以考虑优化')
    } else {
      console.log('  ✅ 两种登录方式性能相近')
    }
  }
  
  return results
}

/**
 * 测试数据库查询性能
 */
async function testDatabaseQueryPerformance() {
  console.log('🗄️ 测试数据库查询性能...\n')
  
  const queries = [
    {
      name: '邮箱查询性能',
      query: async () => {
        const startTime = Date.now()
        const { data, error } = await supabase
          .from('user_accounts')
          .select('*')
          .limit(10)
        const endTime = Date.now()
        return { duration: endTime - startTime, error }
      }
    },
    {
      name: '用户类型查询性能',
      query: async () => {
        const startTime = Date.now()
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_type', 'influencer')
          .limit(10)
        const endTime = Date.now()
        return { duration: endTime - startTime, error }
      }
    },
    {
      name: '达人状态查询性能',
      query: async () => {
        const startTime = Date.now()
        const { data, error } = await supabase
          .from('influencers')
          .select('*')
          .eq('is_approved', true)
          .limit(10)
        const endTime = Date.now()
        return { duration: endTime - startTime, error }
      }
    }
  ]
  
  const queryResults = []
  
  for (const queryTest of queries) {
    console.log(`🔍 测试: ${queryTest.name}`)
    
    try {
      const result = await queryTest.query()
      
      if (result.error) {
        console.log(`  ❌ 查询失败: ${result.error.message}`)
        queryResults.push({
          name: queryTest.name,
          success: false,
          error: result.error.message
        })
      } else {
        console.log(`  ✅ 查询成功，耗时: ${result.duration}ms`)
        queryResults.push({
          name: queryTest.name,
          success: true,
          duration: result.duration
        })
      }
    } catch (error) {
      console.log(`  ❌ 测试异常: ${error.message}`)
      queryResults.push({
        name: queryTest.name,
        success: false,
        error: error.message
      })
    }
    
    console.log('')
  }
  
  return queryResults
}

/**
 * 生成性能报告
 */
function generatePerformanceReport(loginResults, queryResults) {
  console.log('📊 性能测试报告')
  console.log('=' * 50)
  
  // 登录性能统计
  console.log('\n🔐 登录性能统计:')
  const successfulLogins = loginResults.filter(r => r.success)
  const failedLogins = loginResults.filter(r => !r.success)
  
  if (successfulLogins.length > 0) {
    const avgLoginDuration = successfulLogins.reduce((sum, r) => sum + r.loginDuration, 0) / successfulLogins.length
    const avgProfileDuration = successfulLogins.reduce((sum, r) => sum + r.profileDuration, 0) / successfulLogins.length
    const avgTotalDuration = successfulLogins.reduce((sum, r) => sum + r.totalDuration, 0) / successfulLogins.length
    
    console.log(`  ✅ 成功登录: ${successfulLogins.length}/${loginResults.length}`)
    console.log(`  ⏱️  平均登录耗时: ${avgLoginDuration.toFixed(2)}ms`)
    console.log(`  📊 平均资料获取耗时: ${avgProfileDuration.toFixed(2)}ms`)
    console.log(`  🎯 平均总耗时: ${avgTotalDuration.toFixed(2)}ms`)
  }
  
  if (failedLogins.length > 0) {
    console.log(`  ❌ 失败登录: ${failedLogins.length}/${loginResults.length}`)
    failedLogins.forEach(login => {
      console.log(`    - ${login.account}: ${login.error}`)
    })
  }
  
  // 查询性能统计
  console.log('\n🗄️ 数据库查询性能统计:')
  const successfulQueries = queryResults.filter(r => r.success)
  const failedQueries = queryResults.filter(r => !r.success)
  
  if (successfulQueries.length > 0) {
    const avgQueryDuration = successfulQueries.reduce((sum, r) => sum + r.duration, 0) / successfulQueries.length
    console.log(`  ✅ 成功查询: ${successfulQueries.length}/${queryResults.length}`)
    console.log(`  ⏱️  平均查询耗时: ${avgQueryDuration.toFixed(2)}ms`)
  }
  
  if (failedQueries.length > 0) {
    console.log(`  ❌ 失败查询: ${failedQueries.length}/${queryResults.length}`)
    failedQueries.forEach(query => {
      console.log(`    - ${query.name}: ${query.error}`)
    })
  }
  
  // 性能评估
  console.log('\n💡 性能评估:')
  if (successfulLogins.length > 0) {
    const avgTotalDuration = successfulLogins.reduce((sum, r) => sum + r.totalDuration, 0) / successfulLogins.length
    
    if (avgTotalDuration < 500) {
      console.log('  🟢 优秀: 登录性能很好，响应时间 < 500ms')
    } else if (avgTotalDuration < 1000) {
      console.log('  🟡 良好: 登录性能良好，响应时间 < 1000ms')
    } else if (avgTotalDuration < 2000) {
      console.log('  🟠 一般: 登录性能一般，响应时间 < 2000ms')
    } else {
      console.log('  🔴 需要优化: 登录性能较慢，响应时间 > 2000ms')
    }
  }
  
  console.log('\n📈 优化建议:')
  console.log('  1. 如果登录时间 > 1000ms，建议检查网络连接和服务器性能')
  console.log('  2. 如果查询时间 > 500ms，建议检查数据库索引是否正确创建')
  console.log('  3. 定期监控性能指标，及时发现性能问题')
  console.log('  4. 考虑使用缓存机制进一步优化性能')
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🎯 TikLive Pro 登录性能测试')
    console.log('=' * 50)
    
    // 测试快速登录 vs 手动登录性能对比
    console.log('\n' + '=' * 50)
    const comparisonResults = await testLoginPerformanceComparison()
    
    // 测试登录性能
    console.log('\n' + '=' * 50)
    const loginResults = await testLoginPerformance()
    
    // 测试数据库查询性能
    console.log('\n' + '=' * 50)
    const queryResults = await testDatabaseQueryPerformance()
    
    // 生成性能报告
    generatePerformanceReport(loginResults, queryResults)
    
    console.log('\n✅ 性能测试完成！')
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
    process.exit(1)
  }
}

// 运行测试
if (require.main === module) {
  main()
}

module.exports = {
  testLoginPerformance,
  testLoginPerformanceComparison,
  testDatabaseQueryPerformance,
  generatePerformanceReport
} 
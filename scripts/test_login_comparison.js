/**
 * 登录性能对比测试脚本
 * 
 * 用于对比主页面登录和 login-test 页面登录的性能差异
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
 * 测试直接 Supabase 登录（模拟 login-test 页面）
 */
async function testDirectLogin() {
  console.log('🔍 测试直接 Supabase 登录（模拟 login-test 页面）')
  
  const testAccount = { email: 'da01@126.com', password: '123123', name: '达人用户' }
  const results = []
  
  for (let i = 0; i < 3; i++) {
    console.log(`\n📧 第 ${i + 1} 次测试: ${testAccount.email}`)
    
    const startTime = Date.now()
    
    try {
      // 直接调用 Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testAccount.email,
        password: testAccount.password
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (error) {
        console.log(`  ❌ 登录失败: ${error.message}`)
        results.push({
          type: '直接登录',
          attempt: i + 1,
          success: false,
          duration: duration,
          error: error.message
        })
      } else {
        console.log(`  ✅ 登录成功，耗时: ${duration}ms`)
        
        // 模拟异步获取用户资料
        const profileStartTime = Date.now()
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
        
        const profileEndTime = Date.now()
        const profileDuration = profileEndTime - profileStartTime
        
        console.log(`  📊 用户资料获取耗时: ${profileDuration}ms`)
        
        results.push({
          type: '直接登录',
          attempt: i + 1,
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
        type: '直接登录',
        attempt: i + 1,
        success: false,
        duration: duration,
        error: error.message
      })
    }
    
    // 等待一下再进行下一次测试
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return results
}

/**
 * 测试通过 Hook 登录（模拟主页面登录）
 */
async function testHookLogin() {
  console.log('\n🔍 测试通过 Hook 登录（模拟主页面登录）')
  
  const testAccount = { email: 'da01@126.com', password: '123123', name: '达人用户' }
  const results = []
  
  for (let i = 0; i < 3; i++) {
    console.log(`\n📧 第 ${i + 1} 次测试: ${testAccount.email}`)
    
    const startTime = Date.now()
    
    try {
      // 模拟通过 Hook 登录（包含额外的逻辑）
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testAccount.email,
        password: testAccount.password
      })
      
      if (error) {
        const endTime = Date.now()
        const duration = endTime - startTime
        
        console.log(`  ❌ 登录失败: ${error.message}`)
        results.push({
          type: 'Hook登录',
          attempt: i + 1,
          success: false,
          duration: duration,
          error: error.message
        })
      } else {
        // 模拟 Hook 中的额外逻辑（如状态更新等）
        await new Promise(resolve => setTimeout(resolve, 50))
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        console.log(`  ✅ 登录成功，耗时: ${duration}ms`)
        
        // 模拟同步获取用户资料（Hook 中的行为）
        const profileStartTime = Date.now()
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
        
        const profileEndTime = Date.now()
        const profileDuration = profileEndTime - profileStartTime
        
        console.log(`  📊 用户资料获取耗时: ${profileDuration}ms`)
        
        results.push({
          type: 'Hook登录',
          attempt: i + 1,
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
        type: 'Hook登录',
        attempt: i + 1,
        success: false,
        duration: duration,
        error: error.message
      })
    }
    
    // 等待一下再进行下一次测试
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return results
}

/**
 * 生成性能对比报告
 */
function generateComparisonReport(directResults, hookResults) {
  console.log('\n📊 登录性能对比报告')
  console.log('=' * 60)
  
  // 分析直接登录结果
  const successfulDirect = directResults.filter(r => r.success)
  const failedDirect = directResults.filter(r => !r.success)
  
  if (successfulDirect.length > 0) {
    const avgDirectLoginDuration = successfulDirect.reduce((sum, r) => sum + r.loginDuration, 0) / successfulDirect.length
    const avgDirectProfileDuration = successfulDirect.reduce((sum, r) => sum + r.profileDuration, 0) / successfulDirect.length
    const avgDirectTotalDuration = successfulDirect.reduce((sum, r) => sum + r.totalDuration, 0) / successfulDirect.length
    
    console.log('\n🚀 直接登录（login-test 页面）性能:')
    console.log(`  ✅ 成功登录: ${successfulDirect.length}/${directResults.length}`)
    console.log(`  ⏱️  平均登录耗时: ${avgDirectLoginDuration.toFixed(2)}ms`)
    console.log(`  📊 平均资料获取耗时: ${avgDirectProfileDuration.toFixed(2)}ms`)
    console.log(`  🎯 平均总耗时: ${avgDirectTotalDuration.toFixed(2)}ms`)
  }
  
  if (failedDirect.length > 0) {
    console.log(`  ❌ 失败登录: ${failedDirect.length}/${directResults.length}`)
  }
  
  // 分析 Hook 登录结果
  const successfulHook = hookResults.filter(r => r.success)
  const failedHook = hookResults.filter(r => !r.success)
  
  if (successfulHook.length > 0) {
    const avgHookLoginDuration = successfulHook.reduce((sum, r) => sum + r.loginDuration, 0) / successfulHook.length
    const avgHookProfileDuration = successfulHook.reduce((sum, r) => sum + r.profileDuration, 0) / successfulHook.length
    const avgHookTotalDuration = successfulHook.reduce((sum, r) => sum + r.totalDuration, 0) / successfulHook.length
    
    console.log('\n👤 Hook 登录（主页面）性能:')
    console.log(`  ✅ 成功登录: ${successfulHook.length}/${hookResults.length}`)
    console.log(`  ⏱️  平均登录耗时: ${avgHookLoginDuration.toFixed(2)}ms`)
    console.log(`  📊 平均资料获取耗时: ${avgHookProfileDuration.toFixed(2)}ms`)
    console.log(`  🎯 平均总耗时: ${avgHookTotalDuration.toFixed(2)}ms`)
  }
  
  if (failedHook.length > 0) {
    console.log(`  ❌ 失败登录: ${failedHook.length}/${hookResults.length}`)
  }
  
  // 性能对比分析
  if (successfulDirect.length > 0 && successfulHook.length > 0) {
    const avgDirectTotal = successfulDirect.reduce((sum, r) => sum + r.totalDuration, 0) / successfulDirect.length
    const avgHookTotal = successfulHook.reduce((sum, r) => sum + r.totalDuration, 0) / successfulHook.length
    
    const performanceDiff = avgHookTotal - avgDirectTotal
    const performanceRatio = (performanceDiff / avgDirectTotal * 100).toFixed(1)
    
    console.log('\n📈 性能对比分析:')
    console.log(`  🚀 直接登录平均耗时: ${avgDirectTotal.toFixed(2)}ms`)
    console.log(`  👤 Hook 登录平均耗时: ${avgHookTotal.toFixed(2)}ms`)
    console.log(`  ⏱️  性能差异: ${performanceDiff.toFixed(2)}ms (${performanceRatio}%)`)
    
    if (performanceDiff > 200) {
      console.log('  ⚠️  Hook 登录明显较慢，建议应用优化方案')
    } else if (performanceDiff > 100) {
      console.log('  ⚠️  Hook 登录稍慢，可以考虑优化')
    } else {
      console.log('  ✅ 两种登录方式性能相近')
    }
  }
  
  // 优化建议
  console.log('\n💡 优化建议:')
  console.log('  1. 如果 Hook 登录明显较慢，建议使用直接 Supabase 调用')
  console.log('  2. 将用户资料获取改为异步，不阻塞登录响应')
  console.log('  3. 使用 requestIdleCallback 在浏览器空闲时执行非关键任务')
  console.log('  4. 考虑缓存用户资料，减少重复查询')
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🎯 登录性能对比测试')
    console.log('=' * 60)
    
    // 测试直接登录
    const directResults = await testDirectLogin()
    
    // 测试 Hook 登录
    const hookResults = await testHookLogin()
    
    // 生成对比报告
    generateComparisonReport(directResults, hookResults)
    
    console.log('\n✅ 性能对比测试完成！')
    
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
  testDirectLogin,
  testHookLogin,
  generateComparisonReport
} 
// 测试达人查询
const testQuery = `
  // 基本查询 - 只获取达人表数据
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', '31d0f0fe-3af5-4f3f-ab68-245e73971f02')
    .single()
  
  // 获取任务申请
  const { data: applications, error: appError } = await supabase
    .from('task_applications')
    .select('*')
    .eq('influencer_id', '31d0f0fe-3af5-4f3f-ab68-245e73971f02')
  
  // 获取评价
  const { data: reviews, error: reviewError } = await supabase
    .from('reviews')
    .select('*')
    .eq('influencer_id', '31d0f0fe-3af5-4f3f-ab68-245e73971f02')
`

console.log('修复后的查询结构:', testQuery)
console.log('移除了有问题的关联查询，只获取基本数据') 
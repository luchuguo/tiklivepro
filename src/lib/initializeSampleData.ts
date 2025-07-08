import { supabase } from './supabase'

// 初始化测试样本数据
export async function initializeSampleData() {
  try {
    console.log('🚀 开始初始化测试样本数据...')
    
    const results = {
      categories: 0,
      influencers: 0,
      companies: 0,
      tasks: 0,
      applications: 0,
      reviews: 0,
      liveSessions: 0,
      errors: [] as string[]
    }

    // 1. 初始化任务分类
    console.log('📂 创建任务分类...')
    const categories = [
      { name: '美妆护肤', description: '美妆产品、护肤品直播带货', icon: '💄', sort_order: 1 },
      { name: '时尚穿搭', description: '服装、配饰、鞋包等时尚产品', icon: '👗', sort_order: 2 },
      { name: '美食生活', description: '食品、饮料、生活用品', icon: '🍔', sort_order: 3 },
      { name: '数码科技', description: '电子产品、数码配件', icon: '📱', sort_order: 4 },
      { name: '健身运动', description: '运动器材、健身产品', icon: '💪', sort_order: 5 },
      { name: '母婴用品', description: '婴儿用品、玩具、母婴产品', icon: '👶', sort_order: 6 },
      { name: '家居家装', description: '家具、装饰、家电产品', icon: '🏠', sort_order: 7 },
      { name: '图书教育', description: '书籍、教育产品、学习用品', icon: '📚', sort_order: 8 }
    ]

    for (const category of categories) {
      try {
        const { error } = await supabase
          .from('task_categories')
          .upsert(category, { onConflict: 'name' })
        
        if (!error) {
          results.categories++
        } else {
          results.errors.push(`分类创建失败: ${category.name} - ${error.message}`)
        }
      } catch (error: any) {
        results.errors.push(`分类创建异常: ${category.name} - ${error.message}`)
      }
    }

    // 获取分类ID
    const { data: categoryData } = await supabase
      .from('task_categories')
      .select('id, name')
    
    const categoryMap = new Map(categoryData?.map(cat => [cat.name, cat.id]) || [])

    // 2. 创建测试达人数据
    console.log('👥 创建测试达人...')
    const influencersData = [
      {
        nickname: '美妆小仙女',
        real_name: '张小美',
        tiktok_account: '@beauty_fairy',
        followers_count: 150000,
        categories: ['美妆护肤', '时尚穿搭'],
        hourly_rate: 800,
        experience_years: 3.5,
        bio: '专业美妆博主，擅长护肤品和彩妆产品推荐，拥有丰富的直播带货经验。',
        avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
        is_verified: true,
        is_approved: true,
        rating: 4.8,
        total_reviews: 156,
        total_live_count: 89,
        avg_views: 25000,
        location: '上海',
        tags: ['美妆', '护肤', '彩妆', '时尚'],
        status: 'active'
      },
      {
        nickname: '时尚达人Lisa',
        real_name: '李丽莎',
        tiktok_account: '@fashion_lisa',
        followers_count: 280000,
        categories: ['时尚穿搭', '美妆护肤'],
        hourly_rate: 1200,
        experience_years: 4.2,
        bio: '时尚穿搭专家，对潮流趋势有敏锐嗅觉，直播风格活泼有趣。',
        avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
        is_verified: true,
        is_approved: true,
        rating: 4.9,
        total_reviews: 203,
        total_live_count: 125,
        avg_views: 45000,
        location: '北京',
        tags: ['时尚', '穿搭', '潮流', '配饰'],
        status: 'active'
      },
      {
        nickname: '美食探店王',
        real_name: '王大厨',
        tiktok_account: '@food_explorer',
        followers_count: 95000,
        categories: ['美食生活'],
        hourly_rate: 600,
        experience_years: 2.8,
        bio: '美食爱好者，专注于各类美食产品推荐和探店分享。',
        avatar_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
        is_verified: true,
        is_approved: true,
        rating: 4.6,
        total_reviews: 89,
        total_live_count: 67,
        avg_views: 18000,
        location: '广州',
        tags: ['美食', '探店', '生活', '零食'],
        status: 'active'
      },
      {
        nickname: '科技极客小明',
        real_name: '明明',
        tiktok_account: '@tech_ming',
        followers_count: 180000,
        categories: ['数码科技'],
        hourly_rate: 900,
        experience_years: 3.0,
        bio: '数码产品评测达人，对各类电子产品有深入了解。',
        avatar_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
        is_verified: true,
        is_approved: true,
        rating: 4.7,
        total_reviews: 134,
        total_live_count: 78,
        avg_views: 32000,
        location: '深圳',
        tags: ['数码', '科技', '评测', '电子产品'],
        status: 'active'
      },
      {
        nickname: '健身女神Amy',
        real_name: '艾米',
        tiktok_account: '@fitness_amy',
        followers_count: 220000,
        categories: ['健身运动'],
        hourly_rate: 1000,
        experience_years: 4.5,
        bio: '健身教练出身，专业推荐运动装备和健康产品。',
        avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
        is_verified: true,
        is_approved: true,
        rating: 4.9,
        total_reviews: 178,
        total_live_count: 95,
        avg_views: 38000,
        location: '杭州',
        tags: ['健身', '运动', '瑜伽', '健康'],
        status: 'active'
      }
    ]

    // 创建模拟用户ID和达人记录
    const influencerIds: string[] = []
    for (let i = 0; i < influencersData.length; i++) {
      try {
        const mockUserId = `inf-${Date.now()}-${i}`
        
        // 创建用户资料
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: mockUserId,
            user_type: 'influencer'
          }, { onConflict: 'user_id' })

        if (profileError) {
          results.errors.push(`用户资料创建失败: ${influencersData[i].nickname} - ${profileError.message}`)
          continue
        }

        // 创建达人信息
        const { data: influencerData, error: influencerError } = await supabase
          .from('influencers')
          .upsert({
            user_id: mockUserId,
            ...influencersData[i]
          }, { onConflict: 'user_id' })
          .select('id')
          .single()

        if (!influencerError && influencerData) {
          influencerIds.push(influencerData.id)
          results.influencers++
        } else {
          results.errors.push(`达人创建失败: ${influencersData[i].nickname} - ${influencerError?.message}`)
        }
      } catch (error: any) {
        results.errors.push(`达人创建异常: ${influencersData[i].nickname} - ${error.message}`)
      }
    }

    // 3. 创建测试企业数据
    console.log('🏢 创建测试企业...')
    const companiesData = [
      {
        company_name: '美丽佳人化妆品有限公司',
        contact_person: '陈总',
        business_license: '91310000123456789X',
        industry: '美妆护肤',
        company_size: '100-500人',
        website: 'https://beauty.com',
        description: '专业化妆品品牌，致力于为消费者提供高品质的美妆产品。',
        logo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200',
        is_verified: true
      },
      {
        company_name: '潮流时尚服饰集团',
        contact_person: '刘经理',
        business_license: '91310000987654321Y',
        industry: '服装时尚',
        company_size: '500-1000人',
        website: 'https://fashion.com',
        description: '知名时尚品牌，引领潮流趋势，为年轻人提供时尚穿搭。',
        logo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200',
        is_verified: true
      },
      {
        company_name: '智能科技有限公司',
        contact_person: '张总监',
        business_license: '91310000456789123Z',
        industry: '数码科技',
        company_size: '50-100人',
        website: 'https://smarttech.com',
        description: '专注于智能硬件产品研发，为用户提供便捷的科技体验。',
        logo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200',
        is_verified: true
      }
    ]

    const companyIds: string[] = []
    for (let i = 0; i < companiesData.length; i++) {
      try {
        const mockUserId = `comp-${Date.now()}-${i}`
        
        // 创建用户资料
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: mockUserId,
            user_type: 'company'
          }, { onConflict: 'user_id' })

        if (profileError) {
          results.errors.push(`企业用户资料创建失败: ${companiesData[i].company_name} - ${profileError.message}`)
          continue
        }

        // 创建企业信息
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .upsert({
            user_id: mockUserId,
            ...companiesData[i]
          }, { onConflict: 'user_id' })
          .select('id')
          .single()

        if (!companyError && companyData) {
          companyIds.push(companyData.id)
          results.companies++
        } else {
          results.errors.push(`企业创建失败: ${companiesData[i].company_name} - ${companyError?.message}`)
        }
      } catch (error: any) {
        results.errors.push(`企业创建异常: ${companiesData[i].company_name} - ${error.message}`)
      }
    }

    // 4. 创建测试任务
    console.log('📋 创建测试任务...')
    if (companyIds.length > 0) {
      const tasksData = [
        {
          company_id: companyIds[0],
          title: '新品口红直播推广',
          description: '我们即将推出全新系列口红产品，希望找到专业的美妆达人进行直播推广。产品质量优秀，颜色丰富，适合各种肤色。',
          category_id: categoryMap.get('美妆护肤'),
          product_name: '魅力红唇系列口红',
          budget_min: 5000,
          budget_max: 8000,
          live_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          duration_hours: 2,
          location: '上海',
          requirements: ['美妆经验丰富', '粉丝数10万+', '直播经验', '形象气质佳'],
          status: 'open',
          is_urgent: false,
          max_applicants: 5,
          current_applicants: 2,
          views_count: 156
        },
        {
          company_id: companyIds[0],
          title: '护肤套装春季促销',
          description: '春季护肤套装促销活动，包含洁面、爽肤水、精华、面霜等全套护肤产品。',
          category_id: categoryMap.get('美妆护肤'),
          product_name: '春季焕肤护肤套装',
          budget_min: 8000,
          budget_max: 12000,
          live_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
          duration_hours: 3,
          location: '线上',
          requirements: ['护肤专业知识', '演示能力强', '互动性好'],
          status: 'open',
          is_urgent: true,
          max_applicants: 3,
          current_applicants: 1,
          views_count: 89
        },
        {
          company_id: companyIds[1],
          title: '夏季新款连衣裙直播',
          description: '夏季新款连衣裙系列，多种款式和颜色，适合不同场合穿着。',
          category_id: categoryMap.get('时尚穿搭'),
          product_name: '夏日清新连衣裙系列',
          budget_min: 6000,
          budget_max: 10000,
          live_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration_hours: 2.5,
          location: '北京',
          requirements: ['时尚敏感度高', '身材比例好', '穿搭经验丰富'],
          status: 'completed',
          is_urgent: false,
          max_applicants: 4,
          current_applicants: 3,
          views_count: 234
        },
        {
          company_id: companyIds[2],
          title: '智能手表新品发布',
          description: '最新款智能手表，具有健康监测、运动追踪、智能提醒等多种功能。',
          category_id: categoryMap.get('数码科技'),
          product_name: 'SmartWatch Pro',
          budget_min: 10000,
          budget_max: 15000,
          live_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration_hours: 2,
          location: '深圳',
          requirements: ['科技产品了解', '演示能力强', '年轻用户群体'],
          status: 'open',
          is_urgent: false,
          max_applicants: 3,
          current_applicants: 1,
          views_count: 167
        },
        {
          company_id: companyIds[1],
          title: '运动鞋品牌合作',
          description: '知名运动鞋品牌新款推广，适合日常运动和休闲穿着。',
          category_id: categoryMap.get('健身运动'),
          product_name: '轻盈运动鞋系列',
          budget_min: 4000,
          budget_max: 7000,
          live_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          duration_hours: 1.5,
          location: '线上',
          requirements: ['运动爱好者', '年轻活力', '穿搭能力'],
          status: 'open',
          is_urgent: false,
          max_applicants: 6,
          current_applicants: 2,
          views_count: 123
        }
      ]

      const taskIds: string[] = []
      for (const task of tasksData) {
        try {
          const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .insert(task)
            .select('id')
            .single()

          if (!taskError && taskData) {
            taskIds.push(taskData.id)
            results.tasks++
          } else {
            results.errors.push(`任务创建失败: ${task.title} - ${taskError?.message}`)
          }
        } catch (error: any) {
          results.errors.push(`任务创建异常: ${task.title} - ${error.message}`)
        }
      }

      // 5. 创建任务申请
      console.log('📝 创建任务申请...')
      if (taskIds.length > 0 && influencerIds.length > 0) {
        const applicationsData = [
          {
            task_id: taskIds[0],
            influencer_id: influencerIds[0],
            message: '您好！我是专业的美妆博主，拥有15万粉丝，主要关注美妆护肤领域。期待与您合作！',
            proposed_rate: 7500,
            status: 'pending'
          },
          {
            task_id: taskIds[0],
            influencer_id: influencerIds[1],
            message: '我是时尚达人Lisa，可以从时尚搭配的角度来推广口红产品。',
            proposed_rate: 8000,
            status: 'pending'
          },
          {
            task_id: taskIds[2],
            influencer_id: influencerIds[1],
            message: '我对时尚穿搭非常有经验，可以很好地展示连衣裙的穿搭效果。',
            proposed_rate: 9000,
            status: 'accepted'
          },
          {
            task_id: taskIds[3],
            influencer_id: influencerIds[3],
            message: '作为科技数码领域的达人，我可以详细介绍产品功能。',
            proposed_rate: 12000,
            status: 'pending'
          }
        ]

        for (const application of applicationsData) {
          try {
            const { error } = await supabase
              .from('task_applications')
              .insert(application)

            if (!error) {
              results.applications++
            } else {
              results.errors.push(`申请创建失败: ${error.message}`)
            }
          } catch (error: any) {
            results.errors.push(`申请创建异常: ${error.message}`)
          }
        }

        // 6. 创建直播记录
        console.log('📺 创建直播记录...')
        if (taskIds[2] && influencerIds[1]) {
          try {
            const { error } = await supabase
              .from('live_sessions')
              .insert({
                task_id: taskIds[2],
                influencer_id: influencerIds[1],
                start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                end_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(),
                actual_duration: 2.5,
                viewers_count: 8500,
                peak_viewers: 12000,
                engagement_rate: 15.8,
                sales_amount: 45600,
                status: 'completed'
              })

            if (!error) {
              results.liveSessions++
            } else {
              results.errors.push(`直播记录创建失败: ${error.message}`)
            }
          } catch (error: any) {
            results.errors.push(`直播记录创建异常: ${error.message}`)
          }
        }

        // 7. 创建评价记录
        console.log('⭐ 创建评价记录...')
        if (taskIds[2] && companyIds[1] && influencerIds[1]) {
          try {
            const { error } = await supabase
              .from('reviews')
              .insert({
                task_id: taskIds[2],
                reviewer_id: `comp-${Date.now()}-1`,
                reviewee_id: `inf-${Date.now()}-1`,
                reviewer_type: 'company',
                rating: 5,
                comment: '合作非常愉快！Lisa的专业度很高，直播效果超出预期，销售转化率很好。期待下次合作！'
              })

            if (!error) {
              results.reviews++
            } else {
              results.errors.push(`评价创建失败: ${error.message}`)
            }
          } catch (error: any) {
            results.errors.push(`评价创建异常: ${error.message}`)
          }
        }
      }
    }

    // 8. 更新系统统计
    console.log('📊 更新系统统计...')
    try {
      const { error } = await supabase
        .from('system_stats')
        .upsert({
          stat_date: new Date().toISOString().split('T')[0],
          total_users: results.influencers + results.companies,
          total_influencers: results.influencers,
          total_companies: results.companies,
          total_tasks: results.tasks,
          total_applications: results.applications,
          total_live_sessions: results.liveSessions,
          daily_new_users: 2,
          daily_new_tasks: 1,
          daily_revenue: 45600
        }, { onConflict: 'stat_date' })

      if (error) {
        results.errors.push(`统计更新失败: ${error.message}`)
      }
    } catch (error: any) {
      results.errors.push(`统计更新异常: ${error.message}`)
    }

    console.log('✅ 测试数据初始化完成！')
    console.log('📊 创建结果:', results)

    return {
      success: true,
      message: '测试数据初始化成功！',
      results,
      summary: `成功创建: ${results.categories}个分类, ${results.influencers}个达人, ${results.companies}个企业, ${results.tasks}个任务, ${results.applications}个申请, ${results.liveSessions}个直播记录, ${results.reviews}个评价`
    }

  } catch (error: any) {
    console.error('❌ 初始化测试数据失败:', error)
    return {
      success: false,
      message: `初始化失败: ${error.message}`,
      error: error.message
    }
  }
}

// 清空测试数据
export async function clearSampleData() {
  try {
    console.log('🧹 开始清空测试数据...')
    
    const results = {
      reviews: 0,
      liveSessions: 0,
      applications: 0,
      tasks: 0,
      influencers: 0,
      companies: 0,
      userProfiles: 0,
      errors: [] as string[]
    }

    // 按依赖关系逆序删除
    const tables = [
      'reviews',
      'live_sessions', 
      'task_applications',
      'tasks',
      'influencers',
      'companies',
      'user_profiles'
    ]

    for (const table of tables) {
      try {
        // 只删除测试数据（通过特定条件识别）
        let query = supabase.from(table)
        
        if (table === 'user_profiles') {
          // 删除模拟用户ID的记录
          query = query.delete().like('user_id', 'inf-%').or('user_id.like.comp-%')
        } else if (table === 'influencers') {
          query = query.delete().like('user_id', 'inf-%')
        } else if (table === 'companies') {
          query = query.delete().like('user_id', 'comp-%')
        } else {
          // 对于其他表，删除所有记录（在测试环境中）
          query = query.delete().neq('id', '00000000-0000-0000-0000-000000000000')
        }

        const { error, count } = await query

        if (!error) {
          results[table as keyof typeof results] = count || 0
        } else {
          results.errors.push(`清空${table}失败: ${error.message}`)
        }
      } catch (error: any) {
        results.errors.push(`清空${table}异常: ${error.message}`)
      }
    }

    console.log('✅ 测试数据清空完成！')
    console.log('📊 清空结果:', results)

    return {
      success: true,
      message: '测试数据清空成功！',
      results
    }

  } catch (error: any) {
    console.error('❌ 清空测试数据失败:', error)
    return {
      success: false,
      message: `清空失败: ${error.message}`,
      error: error.message
    }
  }
}

// 检查数据状态
export async function checkDataStatus() {
  try {
    console.log('🔍 检查数据状态...')
    
    const status = {
      categories: 0,
      influencers: 0,
      companies: 0,
      tasks: 0,
      applications: 0,
      reviews: 0,
      liveSessions: 0,
      approvedInfluencers: 0,
      openTasks: 0,
      errors: [] as string[]
    }

    // 检查各表数据量
    const tables = [
      'task_categories',
      'influencers',
      'companies', 
      'tasks',
      'task_applications',
      'reviews',
      'live_sessions'
    ]

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (!error) {
          const key = table.replace('task_', '').replace('_', '') as keyof typeof status
          if (key in status) {
            status[key] = count || 0
          }
        } else {
          status.errors.push(`检查${table}失败: ${error.message}`)
        }
      } catch (error: any) {
        status.errors.push(`检查${table}异常: ${error.message}`)
      }
    }

    // 检查已审核达人数量
    try {
      const { count } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)
      
      status.approvedInfluencers = count || 0
    } catch (error: any) {
      status.errors.push(`检查已审核达人失败: ${error.message}`)
    }

    // 检查开放任务数量
    try {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
      
      status.openTasks = count || 0
    } catch (error: any) {
      status.errors.push(`检查开放任务失败: ${error.message}`)
    }

    console.log('📊 数据状态检查完成:', status)

    return {
      success: true,
      status,
      hasData: status.influencers > 0 || status.companies > 0 || status.tasks > 0,
      summary: `分类: ${status.categories}, 达人: ${status.influencers}(${status.approvedInfluencers}已审核), 企业: ${status.companies}, 任务: ${status.tasks}(${status.openTasks}开放)`
    }

  } catch (error: any) {
    console.error('❌ 检查数据状态失败:', error)
    return {
      success: false,
      message: `检查失败: ${error.message}`,
      error: error.message
    }
  }
}
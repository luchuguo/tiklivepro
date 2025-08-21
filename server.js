import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 环境变量检查
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 环境变量未设置！');
  console.error('请确保设置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  console.error('服务器将在没有 Supabase 连接的情况下启动（仅用于测试）');
}

// 创建 Supabase 客户端（如果环境变量可用）
let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 客户端创建成功');
  } catch (error) {
    console.error('❌ Supabase 客户端创建失败:', error.message);
  }
} else {
  console.log('⚠️ 跳过 Supabase 客户端创建');
}

// 内存缓存（开发环境使用）
const memoryCache = new Map();

// 缓存函数
async function getFromCache(key) {
  try {
    const cachedData = memoryCache.get(key);
    if (cachedData && Date.now() < cachedData.expiry) {
      console.log(`从内存缓存获取数据: ${key}`);
      return cachedData.data;
    }
    console.log(`内存缓存中未找到数据或已过期: ${key}`);
    return null;
  } catch (error) {
    console.error('获取缓存数据失败:', error);
    return null;
  }
}

async function storeInCache(key, data, expirySeconds = 60) {
  try {
    const expiryMs = expirySeconds * 1000; // 转换为毫秒
    memoryCache.set(key, {
      data: data,
      expiry: Date.now() + expiryMs
    });
    console.log(`数据已存储到内存缓存: ${key}, 过期时间: ${expirySeconds}秒`);
  } catch (error) {
    console.error('存储缓存数据失败:', error);
  }
}

// API 路由
app.get('/tasks', async (req, res) => {
  try {
    // 设置缓存头
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=60');
    res.setHeader('CDN-Cache-Control', 's-maxage=60');
    
    // 检查缓存
    const cacheKey = 'tasks';
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log('返回缓存数据');
      return res.status(200).json(cachedData);
    }

    if (!supabase) {
      // 如果没有 Supabase 连接，返回模拟数据
      const mockData = [
        {
          id: '1',
          title: '测试任务 1',
          description: '这是一个测试任务，用于演示缓存功能',
          budget_min: 1000,
          budget_max: 5000,
          status: 'open',
          company: { company_name: '测试公司' },
          category: { name: '测试分类' }
        }
      ];
      
      await storeInCache(cacheKey, mockData);
      return res.status(200).json(mockData);
    }

    console.log('从 Supabase 获取数据...');
    
    // 从 Supabase 获取前 50 个任务
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        budget_min,
        budget_max,
        status,
        live_date,
        duration_hours,
        location,
        max_applicants,
        current_applicants,
        views_count,
        requirements,
        is_urgent,
        category_id,
        company_id,
        selected_influencer_id,
        created_at,
        updated_at,
        company:companies(company_name, logo_url),
        category:task_categories(name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase 查询错误:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`成功获取 ${data?.length || 0} 个任务`);

    // 存储到缓存
    await storeInCache(cacheKey, data);

    res.status(200).json(data);
  } catch (error) {
    console.error('API 处理错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 分类 API 路由
app.get('/categories', async (req, res) => {
  try {
    console.log('📋 开始获取任务分类...');
    
    if (!supabase) {
      console.log('⚠️ 使用模拟分类数据（Supabase 未连接）');
      const mockCategories = [
        { id: '1', name: '测试分类 1', description: '测试分类描述', is_active: true, sort_order: 1, created_at: new Date().toISOString() },
        { id: '2', name: '测试分类 2', description: '测试分类描述', is_active: true, sort_order: 2, created_at: new Date().toISOString() }
      ];
      console.log(`✅ 返回模拟分类数据: ${mockCategories.length} 个`);
      return res.status(200).json(mockCategories);
    }

    console.log('🔗 从 Supabase 获取分类数据...');
    
    const { data: allCategories, error: allError } = await supabase
      .from('task_categories')
      .select('*')
      .order('sort_order');

    if (allError) {
      console.error('❌ 获取所有分类失败:', allError);
      throw allError;
    }

    console.log(`📊 获取到所有分类: ${allCategories?.length || 0} 个`);

    const activeCategories = (allCategories || []).filter(cat => cat.is_active);
    console.log(`✅ 筛选后活跃分类: ${activeCategories.length} 个`);

    const finalCategories = activeCategories.length > 0 ? activeCategories : (allCategories || []);
    
    if (finalCategories.length === 0) {
      console.log('⚠️ 没有找到任何分类，返回模拟数据');
      const fallbackCategories = [
        { id: '1', name: '默认分类', description: '默认任务分类', is_active: true, sort_order: 1, created_at: new Date().toISOString() }
      ];
      return res.status(200).json(fallbackCategories);
    }

    console.log(`🎯 最终返回分类: ${finalCategories.length} 个`);
    res.status(200).json(finalCategories);
  } catch (error) {
    console.error('❌ 获取分类时发生错误:', error);
    
    const fallbackCategories = [
      { id: '1', name: '备用分类 1', description: '备用分类描述', is_active: true, sort_order: 1, created_at: new Date().toISOString() },
      { id: '2', name: '备用分类 2', description: '备用分类描述', is_active: true, sort_order: 2, created_at: new Date().toISOString() }
    ];
    
    console.log('🔄 返回备用分类数据');
    res.status(200).json(fallbackCategories);
  }
});

// 达人列表 API 路由（带缓存）
app.get('/influencers', async (req, res) => {
  try {
    console.log('👥 获取达人列表...');
    
    // 设置缓存头
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300');
    res.setHeader('CDN-Cache-Control', 's-maxage=300');
    
    // 检查缓存
    const cacheKey = 'influencers';
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log('✅ 返回达人列表缓存数据');
      return res.status(200).json(cachedData);
    }

    if (!supabase) {
      console.log('⚠️ 使用模拟达人数据');
      const mockInfluencers = [
        {
          id: '1',
          nickname: '测试达人1',
          real_name: '张三',
          avatar_url: 'https://via.placeholder.com/150',
          rating: 4.5,
          total_reviews: 20,
          hourly_rate: 200,
          followers_count: 50000,
          bio: '专业直播达人，擅长美妆和时尚内容',
          is_verified: true,
          is_approved: true
        },
        {
          id: '2',
          nickname: '测试达人2',
          real_name: '李四',
          avatar_url: 'https://via.placeholder.com/150',
          rating: 4.8,
          total_reviews: 35,
          hourly_rate: 300,
          followers_count: 80000,
          bio: '游戏主播，专注手游和端游直播',
          is_verified: true,
          is_approved: true
        }
      ];
      
      await storeInCache(cacheKey, mockInfluencers, 300);
      return res.status(200).json(mockInfluencers);
    }

    console.log('🔗 从 Supabase 获取达人数据...');
    
    const { data: influencers, error } = await supabase
      .from('influencers')
      .select(`
        id,
        nickname,
        real_name,
        avatar_url,
        rating,
        total_reviews,
        hourly_rate,
        followers_count,
        bio,
        is_verified,
        is_approved,
        location,
        categories,
        experience_years,
        created_at,
        updated_at
      `)
      .eq('is_approved', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ 获取达人数据失败:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ 成功获取达人数据: ${influencers?.length || 0} 个`);
    await storeInCache(cacheKey, influencers || [], 300);
    res.status(200).json(influencers || []);
  } catch (error) {
    console.error('❌ 获取达人列表时发生错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 单个达人详情 API 路由（带缓存）
app.get('/influencer/:id', async (req, res) => {
  try {
    const influencerId = req.params.id;
    console.log(`👤 获取达人详情: ${influencerId}`);
    
    // 设置缓存头
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300');
    res.setHeader('CDN-Cache-Control', 's-maxage=300');
    
    // 检查缓存
    const cacheKey = `influencer_${influencerId}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log(`✅ 返回达人详情缓存数据: ${influencerId}`);
      return res.status(200).json(cachedData);
    }

    if (!supabase) {
      console.log('⚠️ 使用模拟达人详情数据');
      const mockInfluencerDetail = {
        id: influencerId,
        nickname: '测试达人',
        real_name: '测试姓名',
        avatar_url: 'https://via.placeholder.com/150',
        rating: 4.5,
        total_reviews: 20,
        hourly_rate: 200,
        followers_count: 50000,
        bio: '专业直播达人，擅长美妆和时尚内容',
        is_verified: true,
        is_approved: true,
        contact_email: 'test@example.com',
        contact_phone: '13800138000',
        location: '北京',
        languages: ['中文', '英文'],
        specialties: ['美妆', '时尚', '直播'],
        social_media: {
          weibo: 'test_weibo',
          douyin: 'test_douyin',
          xiaohongshu: 'test_xiaohongshu'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await storeInCache(cacheKey, mockInfluencerDetail, 300);
      return res.status(200).json(mockInfluencerDetail);
    }

    console.log(`🔗 从 Supabase 获取达人详情: ${influencerId}`);
    
    const { data: influencer, error } = await supabase
      .from('influencers')
      .select(`
        id,
        nickname,
        real_name,
        avatar_url,
        rating,
        total_reviews,
        hourly_rate,
        followers_count,
        bio,
        is_verified,
        is_approved,
        location,
        categories,
        experience_years,
        created_at,
        updated_at
      `)
      .eq('id', influencerId)
      .eq('is_approved', true)
      .eq('is_verified', true)
      .single();

    if (error) {
      console.error('❌ 获取达人详情失败:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!influencer) {
      return res.status(404).json({ error: '达人不存在或未通过审核' });
    }

    console.log(`✅ 成功获取达人详情: ${influencerId}`);
    await storeInCache(cacheKey, influencer, 300);
    res.status(200).json(influencer);
  } catch (error) {
    console.error('❌ 获取达人详情时发生错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 任务详情 API 路由（带缓存）
app.get('/task/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`📋 获取任务详情: ${taskId}`);
    
    // 设置缓存头
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300');
    res.setHeader('CDN-Cache-Control', 's-maxage=300');
    
    // 检查缓存
    const cacheKey = `task_${taskId}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log(`✅ 返回任务详情缓存数据: ${taskId}`);
      return res.status(200).json(cachedData);
    }

    if (!supabase) {
      console.log('⚠️ 使用模拟任务详情数据');
      const mockTaskDetail = {
        id: taskId,
        title: `测试任务 ${taskId}`,
        description: '这是一个测试任务的详细信息，用于演示缓存功能',
        budget_min: 1000,
        budget_max: 5000,
        status: 'open',
        company: { 
          company_name: '测试公司',
          logo_url: 'https://via.placeholder.com/150',
          industry: '科技',
          company_size: '50-100人'
        },
        category: { name: '测试分类' },
        requirements: ['要求1', '要求2', '要求3'],
        live_date: new Date().toISOString(),
        duration_hours: 2,
        location: '线上',
        max_applicants: 10,
        current_applicants: 3,
        views_count: 150
      };
      
      await storeInCache(cacheKey, mockTaskDetail, 300);
      return res.status(200).json(mockTaskDetail);
    }

    console.log(`🔗 从 Supabase 获取任务详情: ${taskId}`);
    
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        budget_min,
        budget_max,
        status,
        live_date,
        duration_hours,
        location,
        max_applicants,
        current_applicants,
        views_count,
        requirements,
        is_urgent,
        category_id,
        company_id,
        selected_influencer_id,
        created_at,
        updated_at,
        company:companies(
          company_name, 
          logo_url, 
          industry, 
          company_size, 
          website, 
          description
        ),
        category:task_categories(name, description),
        selected_influencer:influencers(
          nickname, 
          real_name, 
          avatar_url, 
          rating, 
          total_reviews
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('❌ 获取任务详情失败:', taskError);
      return res.status(500).json({ error: taskError.message });
    }

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 获取任务申请列表
    const { data: applications, error: appsError } = await supabase
      .from('task_applications')
      .select(`
        *,
        influencer:influencers(
          nickname, 
          avatar_url, 
          rating, 
          total_reviews,
          hourly_rate
        )
      `)
      .eq('task_id', taskId)
      .order('applied_at', { ascending: false });

    if (appsError) {
      console.error('⚠️ 获取申请列表失败:', appsError);
    }

    const taskDetail = {
      ...task,
      applications: applications || []
    };

    console.log(`✅ 成功获取任务详情: ${taskId}`);
    await storeInCache(cacheKey, taskDetail, 300);
    res.status(200).json(taskDetail);
  } catch (error) {
    console.error('❌ 获取任务详情时发生错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 任务申请 API 路由（带缓存）
app.get('/task/:id/applications', async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`👥 获取任务申请: ${taskId}`);
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate, public');
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=60');
    res.setHeader('CDN-Cache-Control', 's-maxage=60');
    
    const cacheKey = `task_applications_${taskId}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log(`✅ 返回任务申请缓存数据: ${taskId}`);
      return res.status(200).json(cachedData);
    }

    if (!supabase) {
      console.log('⚠️ 使用模拟申请数据');
      const mockApplications = [
        {
          id: '1',
          influencer: {
            nickname: '测试达人1',
            avatar_url: 'https://via.placeholder.com/50',
            rating: 4.5,
            total_reviews: 20,
            hourly_rate: 200
          },
          status: 'pending',
          applied_at: new Date().toISOString()
        }
      ];
      
      await storeInCache(cacheKey, mockApplications, 60);
      return res.status(200).json(mockApplications);
    }

    console.log(`🔗 从 Supabase 获取任务申请: ${taskId}`);
    
    const { data: applications, error } = await supabase
      .from('task_applications')
      .select(`
        id,
        task_id,
        influencer_id,
        status,
        proposed_rate,
        message,
        applied_at,
        updated_at,
        influencer:influencers(
          nickname, 
          avatar_url, 
          rating, 
          total_reviews,
          hourly_rate
        )
      `)
      .eq('task_id', taskId)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('❌ 获取申请列表失败:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ 成功获取任务申请: ${taskId}, 数量: ${applications?.length || 0}`);
    await storeInCache(cacheKey, applications || [], 60);
    res.status(200).json(applications || []);
  } catch (error) {
    console.error('❌ 获取任务申请时发生错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    supabase: supabase ? 'connected' : 'not_connected',
    cache: memoryCache.size > 0 ? 'active' : 'empty'
  });
});

// 调试分类数据端点
app.get('/debug/categories', async (req, res) => {
  try {
    console.log('🔍 调试分类数据...');
    
    if (!supabase) {
      return res.status(200).json({
        message: 'Supabase 未连接',
        mockData: [
          { id: '1', name: '测试分类 1', is_active: true },
          { id: '2', name: '测试分类 2', is_active: true }
        ]
      });
    }

    const { data: categories, error } = await supabase
      .from('task_categories')
      .select('*')
      .limit(10);

    if (error) {
      return res.status(500).json({
        error: error.message,
        message: '无法访问 task_categories 表'
      });
    }

    res.status(200).json({
      message: '分类数据检查完成',
      totalCategories: categories?.length || 0,
      categories: categories || [],
      tableExists: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: '调试分类数据时发生错误'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 本地 API 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 Tasks API: http://localhost:${PORT}/tasks`);
  console.log(`🏷️  Categories API: http://localhost:${PORT}/categories`);
  console.log(`👥 达人列表 API: http://localhost:${PORT}/influencers`);
  console.log(`👤 达人详情 API: http://localhost:${PORT}/influencer/:id`);
  console.log(`📋 任务详情 API: http://localhost:${PORT}/task/:id`);
  console.log(`👥 任务申请 API: http://localhost:${PORT}/task/:id/applications`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔍 调试分类: http://localhost:${PORT}/debug/categories`);
  console.log(`🔗 Supabase 状态: ${supabase ? '✅ 已连接' : '❌ 未连接'}`);
  console.log(`\n📝 缓存策略:`);
  console.log(`   • 任务列表: 60秒`);
  console.log(`   • 任务详情: 5分钟`);
  console.log(`   • 任务申请: 1分钟`);
  console.log(`   • 分类数据: 60秒`);
  console.log(`   • 达人列表: 5分钟`);
  console.log(`   • 达人详情: 5分钟`);
});

export default app; 
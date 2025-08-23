import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

// 视频列表API
app.get('/videos', async (req, res) => {
  try {
    console.log('👥 开始获取视频列表...');
    
    const {
      page = 1,
      limit = 20,
      category = 'all',
      search = '',
      featured = 'all',
      sort = 'latest'
    } = req.query;

    // 如果没有 Supabase 连接，返回模拟数据
    if (!supabase) {
      console.log('⚠️ 使用模拟视频数据（Supabase 未连接）');
      const mockVideos = [
        {
          id: '1',
          title: '美妆产品直播带货',
          description: '专业美妆达人直播带货，展示产品效果，互动性强，转化率高。',
          video_url: 'https://example.com/video1.mp4',
          poster_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
          views_count: '15.2万',
          likes_count: '2.8万',
          comments_count: '1.2万',
          shares_count: '5.6千',
          duration: '2:35',
          category: { name: '美妆', description: '美妆护肤相关' },
          influencer_name: '张小美',
          influencer_avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
          influencer_rating: 4.8,
          tags: ['美妆', '直播带货', '产品展示', '互动性强'],
          created_at: '2024-01-15',
          is_featured: true,
          is_active: true
        }
      ];
      
      const result = {
        videos: mockVideos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockVideos.length,
          totalPages: 1
        },
        filters: { category, search, featured, sort }
      };
      
      return res.json(result);
    }

    // 构建查询
    let query = supabase
      .from('videos')
      .select(`
        *,
        category:video_categories(name, description)
      `)
      .eq('is_active', true);

    // 应用筛选条件
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,influencer_name.ilike.%${search}%`);
    }
    
    if (featured && featured !== 'all') {
      query = query.eq('is_featured', featured === 'true');
    }

    // 应用排序
    switch (sort) {
      case 'latest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'popular':
        query = query.order('views_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('influencer_rating', { ascending: false });
        break;
      case 'sort_order':
        query = query.order('sort_order', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // 分页
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    // 获取总数
    const { count } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // 执行查询
    const { data: videos, error } = await query;

    if (error) {
      console.error('❌ 获取视频列表失败:', error);
      throw error;
    }

    // 处理数据
    const processedVideos = videos.map(video => ({
      ...video,
      views_count: video.views_count || '0',
      likes_count: video.likes_count || '0',
      comments_count: video.comments_count || '0',
      shares_count: video.shares_count || '0',
      tags: video.tags || []
    }));

    const result = {
      videos: processedVideos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      },
      filters: {
        category,
        search,
        featured,
        sort
      }
    };

    console.log(`✅ 成功获取视频列表: ${processedVideos.length} 个`);

    // 设置缓存头
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Cache-Status', 'local-server');
    res.setHeader('X-Cache-TTL', '0');

    res.json(result);
  } catch (error) {
    console.error('❌ 视频列表API错误:', error);
    res.status(500).json({ 
      error: '获取视频列表失败',
      details: error.message 
    });
  }
});

// 视频详情API
app.get('/video-detail', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: '缺少视频ID参数' });
    }

    console.log('🎬 开始获取视频详情...');

    // 如果没有 Supabase 连接，返回模拟数据
    if (!supabase) {
      console.log('⚠️ 使用模拟视频详情数据（Supabase 未连接）');
      const mockVideo = {
        id: id,
        title: '美妆产品直播带货',
        description: '专业美妆达人直播带货，展示产品效果，互动性强，转化率高。',
        video_url: 'https://example.com/video1.mp4',
        poster_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
        views_count: '15.2万',
        likes_count: '2.8万',
        comments_count: '1.2万',
        shares_count: '5.6千',
        duration: '2:35',
        category: { name: '美妆', description: '美妆护肤相关' },
        influencer_name: '张小美',
        influencer_avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        influencer_rating: 4.8,
        tags: ['美妆', '直播带货', '产品展示', '互动性强'],
        created_at: '2024-01-15',
        is_featured: true,
        is_active: true
      };
      
      const mockRelatedVideos = [
        {
          id: '2',
          title: '时尚服装展示',
          poster_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
          duration: '3:12',
          views_count: '12.8万',
          likes_count: '2.1万',
          influencer_name: '李时尚',
          influencer_avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
          category: { name: '时尚' }
        }
      ];
      
      const result = {
        video: mockVideo,
        relatedVideos: mockRelatedVideos,
        categories: [{ id: '1', name: '美妆', description: '美妆护肤相关' }],
        meta: {
          title: mockVideo.title,
          description: mockVideo.description,
          image: mockVideo.poster_url,
          type: 'video'
        }
      };
      
      return res.json(result);
    }

    // 获取视频详情
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select(`
        *,
        category:video_categories(name, description)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (videoError || !video) {
      console.error('❌ 视频不存在或已禁用:', videoError);
      return res.status(404).json({ error: '视频不存在或已禁用' });
    }

    // 获取相关视频推荐
    const { data: relatedVideos, error: relatedError } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        poster_url,
        duration,
        views_count,
        likes_count,
        influencer_name,
        influencer_avatar,
        category:video_categories(name)
      `)
      .eq('is_active', true)
      .neq('id', id)
      .eq('category_id', video.category_id)
      .order('views_count', { ascending: false })
      .limit(6);

    if (relatedError) {
      console.error('❌ 获取相关视频失败:', relatedError);
    }

    // 获取视频分类信息
    const { data: categories, error: categoriesError } = await supabase
      .from('video_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categoriesError) {
      console.error('❌ 获取分类信息失败:', categoriesError);
    }

    // 构建响应数据
    const result = {
      video: {
        ...video,
        views_count: video.views_count || '0',
        likes_count: video.likes_count || '0',
        comments_count: video.comments_count || '0',
        shares_count: video.shares_count || '0',
        tags: video.tags || []
      },
      relatedVideos: relatedVideos || [],
      categories: categories || [],
      meta: {
        title: video.title,
        description: video.description,
        image: video.poster_url,
        type: 'video'
      }
    };

    console.log('✅ 成功获取视频详情');

    // 设置缓存头
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Cache-Status', 'local-server');
    res.setHeader('X-Cache-TTL', '0');

    res.json(result);
  } catch (error) {
    console.error('❌ 视频详情API错误:', error);
    res.status(500).json({ 
      error: '获取视频详情失败',
      details: error.message 
    });
  }
});

// 任务列表API
app.get('/tasks', async (req, res) => {
  try {
    console.log('📋 开始获取任务列表...');
    
    if (!supabase) {
      console.log('⚠️ 使用模拟任务数据（Supabase 未连接）');
      const mockTasks = [
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
      
      return res.status(200).json(mockTasks);
    }

    console.log('🔗 从 Supabase 获取任务数据...');
    
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

    console.log(`✅ 成功获取 ${data?.length || 0} 个任务`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ API 处理错误:', error);
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

// 达人列表 API 路由
app.get('/influencers', async (req, res) => {
  try {
    console.log('👥 获取达人列表...');
    
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
    res.status(200).json(influencers || []);
  } catch (error) {
    console.error('❌ 获取达人列表时发生错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 单个达人详情 API 路由
app.get('/influencer/:id', async (req, res) => {
  try {
    const influencerId = req.params.id;
    console.log(`👤 获取达人详情: ${influencerId}`);
    
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
    res.status(200).json(influencer);
  } catch (error) {
    console.error('❌ 获取达人详情时发生错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 任务详情 API 路由
app.get('/task/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`📋 获取任务详情: ${taskId}`);
    
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
    res.status(200).json(taskDetail);
  } catch (error) {
    console.error('❌ 获取任务详情时发生错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 任务申请 API 路由
app.get('/task/:id/applications', async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`👥 获取任务申请: ${taskId}`);
    
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
    res.status(200).json(applications || []);
  } catch (error) {
    console.error('❌ 获取任务申请时发生错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 首页视频展示API
app.get('/indexvideos', async (req, res) => {
  try {
    console.log('🏠 开始获取首页视频展示数据...');
    
    // 如果没有 Supabase 连接，返回模拟数据
    if (!supabase) {
      console.log('⚠️ 使用模拟首页视频数据（Supabase 未连接）');
      const mockIndexVideos = [
        {
          id: '1',
          title: '美妆产品直播带货',
          description: '专业美妆达人直播带货，展示产品效果，互动性强，转化率高。',
          video_url: 'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&vvpl=1&l=202508220852540B89F9C1380A9E19F763&btag=e000bd000',
          poster_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
          views_count: '15.2万',
          likes_count: '2.8万',
          comments_count: '1.2万',
          shares_count: '5.6千',
          duration: '2:35',
          category: { name: '美妆', description: '美妆护肤相关' },
          influencer_name: '张小美',
          influencer_avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
          influencer_followers: '125万',
          influencer_rating: 4.8,
          tags: ['美妆', '直播带货', '产品展示', '互动性强'],
          created_at: '2024-01-15',
          is_featured: true,
          is_active: true
        },
        {
          id: '2',
          title: '时尚服装展示',
          description: '时尚达人展示最新服装搭配，引领潮流趋势，提升品牌影响力。',
          video_url: 'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&vvpl=1&l=202508220852540B89F9C1380A9E19F763&btag=e000bd000',
          poster_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
          views_count: '12.8万',
          likes_count: '2.1万',
          comments_count: '8.5千',
          shares_count: '4.2千',
          duration: '3:12',
          category: { name: '时尚', description: '时尚穿搭相关' },
          influencer_name: '李时尚',
          influencer_avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
          influencer_followers: '98万',
          influencer_rating: 4.6,
          tags: ['时尚', '服装搭配', '潮流趋势', '品牌展示'],
          created_at: '2024-01-14',
          is_featured: true,
          is_active: true
        },
        {
          id: '3',
          title: '数码产品测评',
          description: '专业数码达人深度测评最新产品，客观分析优缺点，帮助用户做出购买决策。',
          video_url: 'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&vvpl=1&l=202508220852540B89F9C1380A9E19F763&btag=e000bd000',
          poster_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
          views_count: '18.5万',
          likes_count: '3.2万',
          comments_count: '1.8万',
          shares_count: '7.1千',
          duration: '4:28',
          category: { name: '数码', description: '数码科技相关' },
          influencer_name: '王数码',
          influencer_avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
          influencer_followers: '156万',
          influencer_rating: 4.9,
          tags: ['数码', '产品测评', '技术分析', '购买指南'],
          created_at: '2024-01-13',
          is_featured: true,
          is_active: true
        },
        {
          id: '4',
          title: '美食制作教程',
          description: '美食达人分享简单易学的家常菜制作方法，让每个人都能成为厨房高手。',
          video_url: 'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&vvpl=1&l=202508220852540B89F9C1380A9E19F763&btag=e000bd000',
          poster_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
          views_count: '22.3万',
          likes_count: '4.1万',
          comments_count: '2.3万',
          shares_count: '8.9千',
          duration: '5:42',
          category: { name: '美食', description: '美食制作相关' },
          influencer_name: '刘美食',
          influencer_avatar: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=150',
          influencer_followers: '189万',
          influencer_rating: 4.9,
          tags: ['美食', '制作教程', '家常菜', '厨房技巧'],
          created_at: '2024-01-11',
          is_featured: true,
          is_active: true
        }
      ];
      
      return res.json(mockIndexVideos);
    }

    console.log('🔗 从 Supabase 获取首页视频数据...');
    
    // 从 Supabase 获取特色视频（用于首页展示）
    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        *,
        category:video_categories(name, description)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('❌ 获取首页视频数据失败:', error);
      throw error;
    }

    console.log(`✅ 成功获取首页视频数据: ${videos?.length || 0} 个`);
    res.json(videos || []);
  } catch (error) {
    console.error('❌ 首页视频API错误:', error);
    res.status(500).json({ 
      error: '获取首页视频数据失败',
      details: error.message 
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    supabase: supabase ? 'connected' : 'not_connected'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 本地API服务器运行在 http://localhost:${PORT}`);
      console.log(`🏠 首页视频API: http://localhost:${PORT}/indexvideos`);
  console.log(`📱 视频列表API: http://localhost:${PORT}/videos`);
  console.log(`🎬 视频详情API: http://localhost:${PORT}/video-detail`);
  console.log(`📊 任务列表API: http://localhost:${PORT}/tasks`);
  console.log(`🏷️ 分类API: http://localhost:${PORT}/categories`);
  console.log(`👥 达人列表API: http://localhost:${PORT}/influencers`);
  console.log(`👤 达人详情API: http://localhost:${PORT}/influencer/:id`);
  console.log(`📋 任务详情API: http://localhost:${PORT}/task/:id`);
  console.log(`👥 任务申请API: http://localhost:${PORT}/task/:id/applications`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔗 Supabase 状态: ${supabase ? '✅ 已连接' : '❌ 未连接'}`);
}); 
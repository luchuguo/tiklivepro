/*
  # 初始化测试数据

  1. 创建测试用户数据
    - 5个达人主播（不同领域专家）
    - 3个企业用户（不同行业品牌）
  
  2. 创建任务和申请
    - 5个直播任务（不同状态和价格）
    - 6个任务申请记录
  
  3. 创建直播和评价
    - 1个完成的直播记录
    - 1个评价记录
  
  4. 更新系统统计
    - 更新系统统计数据
*/

-- 创建测试数据
DO $$
DECLARE
  -- 模拟用户ID
  influencer1_id uuid := gen_random_uuid();
  influencer2_id uuid := gen_random_uuid();
  influencer3_id uuid := gen_random_uuid();
  influencer4_id uuid := gen_random_uuid();
  influencer5_id uuid := gen_random_uuid();
  
  company1_id uuid := gen_random_uuid();
  company2_id uuid := gen_random_uuid();
  company3_id uuid := gen_random_uuid();
  
  -- 分类ID变量
  category1_id uuid;
  category2_id uuid;
  category3_id uuid;
  category4_id uuid;
  category5_id uuid;
  
  -- 记录ID变量
  inf1_id uuid;
  inf2_id uuid;
  inf3_id uuid;
  inf4_id uuid;
  inf5_id uuid;
  
  comp1_id uuid;
  comp2_id uuid;
  comp3_id uuid;
  
  task1_id uuid;
  task2_id uuid;
  task3_id uuid;
  task4_id uuid;
  task5_id uuid;
BEGIN
  -- 获取分类ID
  SELECT id INTO category1_id FROM task_categories WHERE name = '美妆护肤' LIMIT 1;
  SELECT id INTO category2_id FROM task_categories WHERE name = '时尚穿搭' LIMIT 1;
  SELECT id INTO category3_id FROM task_categories WHERE name = '美食生活' LIMIT 1;
  SELECT id INTO category4_id FROM task_categories WHERE name = '数码科技' LIMIT 1;
  SELECT id INTO category5_id FROM task_categories WHERE name = '健身运动' LIMIT 1;

  -- 如果分类不存在，先创建
  IF category1_id IS NULL THEN
    INSERT INTO task_categories (name, description, icon, sort_order, is_active) VALUES
      ('美妆护肤', '美妆产品、护肤品直播带货', '💄', 1, true),
      ('时尚穿搭', '服装、配饰、鞋包等时尚产品', '👗', 2, true),
      ('美食生活', '食品、饮料、生活用品', '🍔', 3, true),
      ('数码科技', '电子产品、数码配件', '📱', 4, true),
      ('健身运动', '运动器材、健身产品', '💪', 5, true),
      ('母婴用品', '婴儿用品、玩具、母婴产品', '👶', 6, true),
      ('家居家装', '家具、装饰、家电产品', '🏠', 7, true),
      ('图书教育', '书籍、教育产品、学习用品', '📚', 8, true)
    ON CONFLICT (name) DO NOTHING;
    
    -- 重新获取分类ID
    SELECT id INTO category1_id FROM task_categories WHERE name = '美妆护肤' LIMIT 1;
    SELECT id INTO category2_id FROM task_categories WHERE name = '时尚穿搭' LIMIT 1;
    SELECT id INTO category3_id FROM task_categories WHERE name = '美食生活' LIMIT 1;
    SELECT id INTO category4_id FROM task_categories WHERE name = '数码科技' LIMIT 1;
    SELECT id INTO category5_id FROM task_categories WHERE name = '健身运动' LIMIT 1;
  END IF;

  -- 创建达人用户资料
  INSERT INTO user_profiles (user_id, user_type, created_at, updated_at) VALUES
    (influencer1_id, 'influencer', now() - interval '30 days', now()),
    (influencer2_id, 'influencer', now() - interval '25 days', now()),
    (influencer3_id, 'influencer', now() - interval '20 days', now()),
    (influencer4_id, 'influencer', now() - interval '15 days', now()),
    (influencer5_id, 'influencer', now() - interval '10 days', now())
  ON CONFLICT (user_id) DO NOTHING;

  -- 创建企业用户资料
  INSERT INTO user_profiles (user_id, user_type, created_at, updated_at) VALUES
    (company1_id, 'company', now() - interval '35 days', now()),
    (company2_id, 'company', now() - interval '28 days', now()),
    (company3_id, 'company', now() - interval '22 days', now())
  ON CONFLICT (user_id) DO NOTHING;

  -- 创建达人详细信息
  INSERT INTO influencers (
    user_id, nickname, real_name, tiktok_account, followers_count, categories, 
    hourly_rate, experience_years, bio, avatar_url, is_verified, is_approved, 
    rating, total_reviews, total_live_count, avg_views, location, tags, status,
    created_at, updated_at
  ) VALUES
    (
      influencer1_id, '美妆小仙女', '张小美', '@beauty_fairy', 150000,
      ARRAY['美妆护肤', '时尚穿搭'], 800, 3.5,
      '专业美妆博主，擅长护肤品和彩妆产品推荐，拥有丰富的直播带货经验。',
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
      true, true, 4.8, 156, 89, 25000, '上海', 
      ARRAY['美妆', '护肤', '彩妆', '时尚'], 'active',
      now() - interval '30 days', now()
    ),
    (
      influencer2_id, '时尚达人Lisa', '李丽莎', '@fashion_lisa', 280000,
      ARRAY['时尚穿搭', '美妆护肤'], 1200, 4.2,
      '时尚穿搭专家，对潮流趋势有敏锐嗅觉，直播风格活泼有趣。',
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      true, true, 4.9, 203, 125, 45000, '北京',
      ARRAY['时尚', '穿搭', '潮流', '配饰'], 'active',
      now() - interval '25 days', now()
    ),
    (
      influencer3_id, '美食探店王', '王大厨', '@food_explorer', 95000,
      ARRAY['美食生活'], 600, 2.8,
      '美食爱好者，专注于各类美食产品推荐和探店分享。',
      'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      true, true, 4.6, 89, 67, 18000, '广州',
      ARRAY['美食', '探店', '生活', '零食'], 'active',
      now() - interval '20 days', now()
    ),
    (
      influencer4_id, '科技极客小明', '明明', '@tech_ming', 180000,
      ARRAY['数码科技'], 900, 3.0,
      '数码产品评测达人，对各类电子产品有深入了解。',
      'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      true, true, 4.7, 134, 78, 32000, '深圳',
      ARRAY['数码', '科技', '评测', '电子产品'], 'active',
      now() - interval '15 days', now()
    ),
    (
      influencer5_id, '健身女神Amy', '艾米', '@fitness_amy', 220000,
      ARRAY['健身运动'], 1000, 4.5,
      '健身教练出身，专业推荐运动装备和健康产品。',
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
      true, true, 4.9, 178, 95, 38000, '杭州',
      ARRAY['健身', '运动', '瑜伽', '健康'], 'active',
      now() - interval '10 days', now()
    )
  ON CONFLICT (user_id) DO NOTHING;

  -- 获取达人ID
  SELECT id INTO inf1_id FROM influencers WHERE user_id = influencer1_id LIMIT 1;
  SELECT id INTO inf2_id FROM influencers WHERE user_id = influencer2_id LIMIT 1;
  SELECT id INTO inf3_id FROM influencers WHERE user_id = influencer3_id LIMIT 1;
  SELECT id INTO inf4_id FROM influencers WHERE user_id = influencer4_id LIMIT 1;
  SELECT id INTO inf5_id FROM influencers WHERE user_id = influencer5_id LIMIT 1;

  -- 创建企业信息
  INSERT INTO companies (
    user_id, company_name, contact_person, business_license, industry, 
    company_size, website, description, logo_url, is_verified,
    created_at, updated_at
  ) VALUES
    (
      company1_id, '美丽佳人化妆品有限公司', '陈总', '91310000123456789X',
      '美妆护肤', '100-500人', 'https://beauty.com',
      '专业化妆品品牌，致力于为消费者提供高品质的美妆产品。',
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200',
      true, now() - interval '35 days', now()
    ),
    (
      company2_id, '潮流时尚服饰集团', '刘经理', '91310000987654321Y',
      '服装时尚', '500-1000人', 'https://fashion.com',
      '知名时尚品牌，引领潮流趋势，为年轻人提供时尚穿搭。',
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200',
      true, now() - interval '28 days', now()
    ),
    (
      company3_id, '智能科技有限公司', '张总监', '91310000456789123Z',
      '数码科技', '50-100人', 'https://smarttech.com',
      '专注于智能硬件产品研发，为用户提供便捷的科技体验。',
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200',
      true, now() - interval '22 days', now()
    )
  ON CONFLICT (user_id) DO NOTHING;

  -- 获取企业ID
  SELECT id INTO comp1_id FROM companies WHERE user_id = company1_id LIMIT 1;
  SELECT id INTO comp2_id FROM companies WHERE user_id = company2_id LIMIT 1;
  SELECT id INTO comp3_id FROM companies WHERE user_id = company3_id LIMIT 1;

  -- 创建任务（分别插入每个任务）
  INSERT INTO tasks (
    company_id, title, description, category_id, product_name, budget_min, budget_max,
    live_date, duration_hours, location, requirements, status, is_urgent, 
    max_applicants, current_applicants, views_count, created_at, updated_at
  ) VALUES (
    comp1_id,
    '新品口红直播推广', 
    '我们即将推出全新系列口红产品，希望找到专业的美妆达人进行直播推广。产品质量优秀，颜色丰富，适合各种肤色。希望达人能够展示产品效果，分享使用心得。',
    category1_id, '魅力红唇系列口红', 5000, 8000,
    now() + interval '5 days', 2, '上海',
    ARRAY['美妆经验丰富', '粉丝数10万+', '直播经验', '形象气质佳'], 'open', false,
    5, 2, 156, now() - interval '3 days', now()
  );
  
  SELECT id INTO task1_id FROM tasks WHERE title = '新品口红直播推广' LIMIT 1;

  INSERT INTO tasks (
    company_id, title, description, category_id, product_name, budget_min, budget_max,
    live_date, duration_hours, location, requirements, status, is_urgent, 
    max_applicants, current_applicants, views_count, created_at, updated_at
  ) VALUES (
    comp1_id,
    '护肤套装春季促销',
    '春季护肤套装促销活动，包含洁面、爽肤水、精华、面霜等全套护肤产品。希望达人能够详细介绍产品功效，演示使用方法。',
    category1_id, '春季焕肤护肤套装', 8000, 12000,
    now() + interval '8 days', 3, '线上',
    ARRAY['护肤专业知识', '演示能力强', '互动性好'], 'open', true,
    3, 1, 89, now() - interval '2 days', now()
  );
  
  SELECT id INTO task2_id FROM tasks WHERE title = '护肤套装春季促销' LIMIT 1;

  INSERT INTO tasks (
    company_id, title, description, category_id, product_name, budget_min, budget_max,
    live_date, duration_hours, location, requirements, status, is_urgent, 
    max_applicants, current_applicants, views_count, created_at, updated_at
  ) VALUES (
    comp2_id,
    '夏季新款连衣裙直播',
    '夏季新款连衣裙系列，多种款式和颜色，适合不同场合穿着。希望达人能够展示穿搭效果，分享搭配技巧。',
    category2_id, '夏日清新连衣裙系列', 6000, 10000,
    now() + interval '3 days', 2.5, '北京',
    ARRAY['时尚敏感度高', '身材比例好', '穿搭经验丰富'], 'completed', false,
    4, 3, 234, now() - interval '10 days', now()
  );
  
  SELECT id INTO task3_id FROM tasks WHERE title = '夏季新款连衣裙直播' LIMIT 1;

  INSERT INTO tasks (
    company_id, title, description, category_id, product_name, budget_min, budget_max,
    live_date, duration_hours, location, requirements, status, is_urgent, 
    max_applicants, current_applicants, views_count, created_at, updated_at
  ) VALUES (
    comp3_id,
    '智能手表新品发布',
    '最新款智能手表，具有健康监测、运动追踪、智能提醒等多种功能。希望达人能够详细介绍产品功能，演示使用场景。',
    category4_id, 'SmartWatch Pro', 10000, 15000,
    now() + interval '7 days', 2, '深圳',
    ARRAY['科技产品了解', '演示能力强', '年轻用户群体'], 'open', false,
    3, 1, 167, now() - interval '1 day', now()
  );
  
  SELECT id INTO task4_id FROM tasks WHERE title = '智能手表新品发布' LIMIT 1;

  INSERT INTO tasks (
    company_id, title, description, category_id, product_name, budget_min, budget_max,
    live_date, duration_hours, location, requirements, status, is_urgent, 
    max_applicants, current_applicants, views_count, created_at, updated_at
  ) VALUES (
    comp2_id,
    '运动鞋品牌合作',
    '知名运动鞋品牌新款推广，适合日常运动和休闲穿着。希望达人能够展示鞋子的舒适性和时尚性。',
    category5_id, '轻盈运动鞋系列', 4000, 7000,
    now() + interval '10 days', 1.5, '线上',
    ARRAY['运动爱好者', '年轻活力', '穿搭能力'], 'open', false,
    6, 2, 123, now() - interval '6 hours', now()
  );
  
  SELECT id INTO task5_id FROM tasks WHERE title = '运动鞋品牌合作' LIMIT 1;

  -- 创建任务申请
  INSERT INTO task_applications (task_id, influencer_id, message, proposed_rate, status, applied_at) VALUES
    (
      task1_id, inf1_id,
      '您好！我是专业的美妆博主，拥有15万粉丝，主要关注美妆护肤领域。我有丰富的口红推广经验，能够很好地展示产品效果和分享使用心得。期待与您合作！',
      7500, 'pending', now() - interval '2 days'
    ),
    (
      task1_id, inf2_id,
      '我是时尚达人Lisa，拥有28万粉丝，擅长美妆和时尚内容。我可以从时尚搭配的角度来推广口红产品，展示不同场合的妆容搭配。',
      8000, 'pending', now() - interval '1 day'
    ),
    (
      task3_id, inf2_id,
      '我对时尚穿搭非常有经验，可以很好地展示连衣裙的穿搭效果，分享不同身材的搭配技巧。我的粉丝群体主要是20-35岁的女性，正是目标客户群。',
      9000, 'accepted', now() - interval '3 days'
    ),
    (
      task4_id, inf4_id,
      '作为科技数码领域的达人，我对智能穿戴设备有深入了解。我可以详细介绍产品功能，演示各种使用场景，帮助用户了解产品价值。',
      12000, 'pending', now() - interval '1 day'
    ),
    (
      task2_id, inf1_id,
      '护肤是我的专业领域，我可以详细介绍每个产品的功效和使用方法，帮助观众了解如何正确护肤。',
      10000, 'pending', now() - interval '6 hours'
    ),
    (
      task5_id, inf5_id,
      '作为健身达人，我经常推荐运动装备。这款运动鞋我可以从专业角度分析其功能性和舒适度。',
      6000, 'pending', now() - interval '12 hours'
    )
  ON CONFLICT (task_id, influencer_id) DO NOTHING;

  -- 更新任务的选中达人
  UPDATE tasks SET selected_influencer_id = inf2_id WHERE id = task3_id;

  -- 创建直播记录
  INSERT INTO live_sessions (
    task_id, influencer_id, start_time, end_time, actual_duration, 
    viewers_count, peak_viewers, engagement_rate, sales_amount, status,
    created_at, updated_at
  ) VALUES (
    task3_id, inf2_id,
    now() - interval '5 days', now() - interval '5 days' + interval '2.5 hours',
    2.5, 8500, 12000, 15.8, 45600, 'completed',
    now() - interval '5 days', now()
  );

  -- 创建评价记录
  INSERT INTO reviews (
    task_id, reviewer_id, reviewee_id, reviewer_type, rating, comment, created_at
  ) VALUES (
    task3_id, company2_id, influencer2_id,
    'company', 5,
    '合作非常愉快！Lisa的专业度很高，直播效果超出预期，销售转化率很好。期待下次合作！',
    now() - interval '4 days'
  );

  -- 更新系统统计
  INSERT INTO system_stats (
    stat_date,
    total_users,
    total_influencers,
    total_companies, 
    total_tasks,
    total_applications,
    total_live_sessions,
    daily_new_users,
    daily_new_tasks,
    daily_revenue,
    created_at
  )
  VALUES (
    CURRENT_DATE,
    8, -- 5个达人 + 3个企业
    5,
    3, 
    5,
    6,
    1,
    2, -- 假设今天新增2个用户
    1, -- 假设今天新增1个任务
    45600, -- 来自直播销售
    now()
  ) ON CONFLICT (stat_date) 
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    total_influencers = EXCLUDED.total_influencers,
    total_companies = EXCLUDED.total_companies,
    total_tasks = EXCLUDED.total_tasks,
    total_applications = EXCLUDED.total_applications,
    total_live_sessions = EXCLUDED.total_live_sessions,
    daily_new_users = EXCLUDED.daily_new_users,
    daily_new_tasks = EXCLUDED.daily_new_tasks,
    daily_revenue = EXCLUDED.daily_revenue;

  RAISE NOTICE '✅ 测试样本数据初始化完成！';
  RAISE NOTICE '📊 创建了: 5个达人, 3个企业, 5个任务, 6个申请, 1个直播记录, 1个评价';

END $$;
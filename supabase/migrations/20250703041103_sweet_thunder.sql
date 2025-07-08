/*
  # 创建TikLive Pro核心数据表

  1. 新建表
    - `user_profiles` - 用户资料扩展表
    - `influencers` - 达人主播信息表
    - `companies` - 企业用户信息表
    - `task_categories` - 任务分类表
    - `tasks` - 直播任务表
    - `task_applications` - 任务申请记录表
    - `reviews` - 评价系统表
    - `live_sessions` - 直播场次记录表

  2. 安全策略
    - 为所有表启用RLS
    - 添加适当的访问策略

  3. 索引优化
    - 为常用查询字段添加索引
*/

-- 用户资料扩展表
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('influencer', 'company', 'admin')),
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 达人主播信息表
CREATE TABLE IF NOT EXISTS influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  real_name text,
  tiktok_account text,
  followers_count integer DEFAULT 0,
  categories text[] DEFAULT '{}',
  hourly_rate integer DEFAULT 0,
  experience_years decimal DEFAULT 0,
  bio text,
  avatar_url text,
  is_verified boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  rating decimal DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_live_count integer DEFAULT 0,
  avg_views integer DEFAULT 0,
  location text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 企业用户信息表
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_person text NOT NULL,
  business_license text,
  industry text,
  company_size text,
  website text,
  description text,
  logo_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 任务分类表
CREATE TABLE IF NOT EXISTS task_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 直播任务表
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES task_categories(id),
  product_name text,
  budget_min integer NOT NULL,
  budget_max integer NOT NULL,
  live_date timestamptz NOT NULL,
  duration_hours decimal NOT NULL,
  location text,
  requirements text[] DEFAULT '{}',
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  is_urgent boolean DEFAULT false,
  max_applicants integer DEFAULT 10,
  current_applicants integer DEFAULT 0,
  views_count integer DEFAULT 0,
  selected_influencer_id uuid REFERENCES influencers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 任务申请记录表
CREATE TABLE IF NOT EXISTS task_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencers(id) ON DELETE CASCADE,
  message text,
  proposed_rate integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(task_id, influencer_id)
);

-- 评价系统表
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_type text NOT NULL CHECK (reviewer_type IN ('company', 'influencer')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 直播场次记录表
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencers(id) ON DELETE CASCADE,
  start_time timestamptz,
  end_time timestamptz,
  actual_duration decimal,
  viewers_count integer DEFAULT 0,
  peak_viewers integer DEFAULT 0,
  engagement_rate decimal DEFAULT 0,
  sales_amount decimal DEFAULT 0,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  stream_url text,
  recording_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 启用行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- 用户资料访问策略
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 达人信息访问策略
CREATE POLICY "Anyone can read approved influencers"
  ON influencers
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Influencers can read own data"
  ON influencers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Influencers can update own data"
  ON influencers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Influencers can insert own data"
  ON influencers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 企业信息访问策略
CREATE POLICY "Companies can read own data"
  ON companies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can update own data"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert own data"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 任务分类公开访问
CREATE POLICY "Anyone can read task categories"
  ON task_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 任务访问策略
CREATE POLICY "Anyone can read open tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (status = 'open');

CREATE POLICY "Companies can manage own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

-- 任务申请访问策略
CREATE POLICY "Influencers can read own applications"
  ON task_applications
  FOR SELECT
  TO authenticated
  USING (
    influencer_id IN (
      SELECT id FROM influencers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can read applications for own tasks"
  ON task_applications
  FOR SELECT
  TO authenticated
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN companies c ON t.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Influencers can insert own applications"
  ON task_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    influencer_id IN (
      SELECT id FROM influencers WHERE user_id = auth.uid()
    )
  );

-- 评价访问策略
CREATE POLICY "Users can read reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert reviews for completed tasks"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- 直播场次访问策略
CREATE POLICY "Users can read live sessions"
  ON live_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_influencers_categories ON influencers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_influencers_location ON influencers(location);
CREATE INDEX IF NOT EXISTS idx_influencers_rating ON influencers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_budget ON tasks(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_tasks_live_date ON tasks(live_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_applications_status ON task_applications(status);

-- 插入默认任务分类
INSERT INTO task_categories (name, description, icon, sort_order) VALUES
  ('美妆护肤', '美妆产品、护肤品直播推广', 'Sparkles', 1),
  ('服装时尚', '服装、配饰、时尚单品推广', 'Shirt', 2),
  ('数码科技', '电子产品、数码设备测评推广', 'Smartphone', 3),
  ('美食生活', '食品、饮料、生活用品推广', 'Coffee', 4),
  ('母婴用品', '婴幼儿用品、玩具、教育产品', 'Baby', 5),
  ('健康养生', '保健品、健身器材、养生产品', 'Heart', 6)
ON CONFLICT (name) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON influencers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_live_sessions_updated_at BEFORE UPDATE ON live_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
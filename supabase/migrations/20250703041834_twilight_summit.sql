/*
  # 创建管理员账号和后台管理功能

  1. 管理员账号创建
    - 创建默认管理员用户 (admin@tiklive.pro)
    - 设置管理员权限

  2. 管理后台相关表
    - 系统统计表
    - 操作日志表
    - 管理员权限表

  3. 安全策略
    - 管理员专用访问策略
    - 操作日志记录策略
*/

-- 创建系统统计表
CREATE TABLE IF NOT EXISTS system_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  total_users integer DEFAULT 0,
  total_influencers integer DEFAULT 0,
  total_companies integer DEFAULT 0,
  total_tasks integer DEFAULT 0,
  total_applications integer DEFAULT 0,
  total_live_sessions integer DEFAULT 0,
  daily_new_users integer DEFAULT 0,
  daily_new_tasks integer DEFAULT 0,
  daily_revenue decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stat_date)
);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  description text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 创建管理员权限表
CREATE TABLE IF NOT EXISTS admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name text NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(admin_id, permission_name)
);

-- 启用行级安全
ALTER TABLE system_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- 管理员专用访问策略
CREATE POLICY "Only admins can access system stats"
  ON system_stats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Only admins can access admin logs"
  ON admin_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Only admins can access admin permissions"
  ON admin_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- 管理员可以查看所有用户数据的策略
CREATE POLICY "Admins can read all user profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can read all influencers"
  ON influencers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update influencer approval"
  ON influencers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can read all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can read all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can read all applications"
  ON task_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- 创建统计数据更新函数
CREATE OR REPLACE FUNCTION update_system_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO system_stats (
    stat_date,
    total_users,
    total_influencers,
    total_companies,
    total_tasks,
    total_applications,
    total_live_sessions,
    daily_new_users,
    daily_new_tasks
  )
  SELECT 
    CURRENT_DATE,
    (SELECT COUNT(*) FROM auth.users),
    (SELECT COUNT(*) FROM influencers),
    (SELECT COUNT(*) FROM companies),
    (SELECT COUNT(*) FROM tasks),
    (SELECT COUNT(*) FROM task_applications),
    (SELECT COUNT(*) FROM live_sessions),
    (SELECT COUNT(*) FROM auth.users WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM tasks WHERE DATE(created_at) = CURRENT_DATE)
  ON CONFLICT (stat_date) 
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    total_influencers = EXCLUDED.total_influencers,
    total_companies = EXCLUDED.total_companies,
    total_tasks = EXCLUDED.total_tasks,
    total_applications = EXCLUDED.total_applications,
    total_live_sessions = EXCLUDED.total_live_sessions,
    daily_new_users = EXCLUDED.daily_new_users,
    daily_new_tasks = EXCLUDED.daily_new_tasks;
END;
$$ LANGUAGE plpgsql;

-- 创建管理员操作日志函数
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id uuid,
  p_action_type text,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_logs (
    admin_id,
    action_type,
    target_type,
    target_id,
    description
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_description
  );
END;
$$ LANGUAGE plpgsql;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(stat_date DESC);

-- 初始化今日统计数据
SELECT update_system_stats();
/*
  # System Initialization Migration

  1. Task Categories
    - Create default task categories for the platform
    - Include icons and descriptions for each category

  2. System Statistics
    - Initialize system stats table with default values
    - Create function to update statistics

  3. Admin Setup
    - Note: Admin user must be created through Supabase Auth first
    - This migration prepares the system for admin user setup
*/

-- Create task categories
INSERT INTO task_categories (name, description, icon, sort_order, is_active)
VALUES 
  ('美妆护肤', '美妆产品、护肤品直播带货', '💄', 1, true),
  ('时尚穿搭', '服装、配饰、鞋包等时尚产品', '👗', 2, true),
  ('美食生活', '食品、饮料、生活用品', '🍔', 3, true),
  ('数码科技', '电子产品、数码配件', '📱', 4, true),
  ('健身运动', '运动器材、健身产品', '💪', 5, true),
  ('母婴用品', '婴儿用品、玩具、母婴产品', '👶', 6, true),
  ('家居家装', '家具、装饰、家电产品', '🏠', 7, true),
  ('图书教育', '书籍、教育产品、学习用品', '📚', 8, true)
ON CONFLICT (name) DO NOTHING;

-- Initialize system statistics with default values
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
  daily_revenue
)
VALUES (
  CURRENT_DATE,
  0, -- Will be updated when users register
  0,
  0, 
  0,
  0,
  0,
  0,
  0,
  0
) ON CONFLICT (stat_date) DO NOTHING;

-- Create function to update system statistics
CREATE OR REPLACE FUNCTION update_system_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update daily statistics
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
    daily_revenue
  )
  SELECT 
    CURRENT_DATE,
    (SELECT COUNT(*) FROM user_profiles),
    (SELECT COUNT(*) FROM influencers WHERE is_approved = true),
    (SELECT COUNT(*) FROM companies),
    (SELECT COUNT(*) FROM tasks),
    (SELECT COUNT(*) FROM task_applications),
    (SELECT COUNT(*) FROM live_sessions),
    (SELECT COUNT(*) FROM user_profiles WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM tasks WHERE DATE(created_at) = CURRENT_DATE),
    0 -- placeholder for revenue calculation
  ON CONFLICT (stat_date) 
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
END;
$$;

-- Create function to setup admin user after auth creation
CREATE OR REPLACE FUNCTION setup_admin_user(admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create admin user profile
  INSERT INTO user_profiles (user_id, user_type, created_at, updated_at)
  VALUES (
    admin_user_id,
    'admin',
    now(),
    now()
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Create admin permissions
  INSERT INTO admin_permissions (admin_id, permission_name, granted_by, granted_at)
  VALUES 
    (admin_user_id, 'user_management', admin_user_id, now()),
    (admin_user_id, 'task_management', admin_user_id, now()),
    (admin_user_id, 'system_settings', admin_user_id, now()),
    (admin_user_id, 'data_analytics', admin_user_id, now()),
    (admin_user_id, 'content_moderation', admin_user_id, now())
  ON CONFLICT (admin_id, permission_name) DO NOTHING;

  -- Record admin creation log
  INSERT INTO admin_logs (
    admin_id,
    action_type,
    description,
    created_at
  )
  VALUES (
    admin_user_id,
    'admin_account_setup',
    '管理员账号设置完成',
    now()
  );
END;
$$;
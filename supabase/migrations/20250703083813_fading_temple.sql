/*
  # 创建管理员账号迁移

  这个迁移文件将创建一个函数来设置管理员账号。
  注意：密码需要通过 Supabase Auth API 设置，不能直接在数据库中插入。
*/

-- 创建一个函数来设置管理员用户资料
CREATE OR REPLACE FUNCTION create_admin_profile_for_user(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- 从 auth.users 表中查找用户ID（如果用户已通过 Auth API 创建）
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = user_email 
  LIMIT 1;

  -- 如果找到用户，创建管理员资料
  IF admin_user_id IS NOT NULL THEN
    -- 创建用户资料
    INSERT INTO user_profiles (user_id, user_type, created_at, updated_at)
    VALUES (
      admin_user_id,
      'admin',
      now(),
      now()
    ) ON CONFLICT (user_id) DO UPDATE SET
      user_type = 'admin',
      updated_at = now();

    -- 添加管理员权限
    INSERT INTO admin_permissions (admin_id, permission_name, granted_by, granted_at)
    VALUES 
      (admin_user_id, 'user_management', admin_user_id, now()),
      (admin_user_id, 'task_management', admin_user_id, now()),
      (admin_user_id, 'system_settings', admin_user_id, now()),
      (admin_user_id, 'data_analytics', admin_user_id, now()),
      (admin_user_id, 'content_moderation', admin_user_id, now())
    ON CONFLICT (admin_id, permission_name) DO NOTHING;

    -- 记录日志
    INSERT INTO admin_logs (
      admin_id,
      action_type,
      description,
      created_at
    )
    VALUES (
      admin_user_id,
      'admin_account_setup',
      '管理员账号通过迁移设置完成',
      now()
    );

    RAISE NOTICE '管理员账号设置完成: %', user_email;
  ELSE
    RAISE NOTICE '未找到邮箱为 % 的用户，请先通过 Supabase Auth 创建用户', user_email;
  END IF;
END;
$$;

-- 注意：这个函数只能在用户已经通过 Supabase Auth API 创建后使用
-- 要创建完整的管理员账号，您需要：
-- 1. 通过 Supabase Dashboard 或 Auth API 创建用户 admin@tiklive.pro
-- 2. 然后运行: SELECT create_admin_profile_for_user('admin@tiklive.pro');
/*
  # 修复管理员用户类型

  1. 查找并更新 admin@tiklive.pro 用户的类型
  2. 确保管理员权限正确设置
  3. 添加必要的日志记录
*/

-- 创建一个函数来修复管理员用户
CREATE OR REPLACE FUNCTION fix_admin_user()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  result_message text;
BEGIN
  -- 查找 admin@tiklive.pro 用户的 ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@tiklive.pro' 
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    result_message := '未找到邮箱为 admin@tiklive.pro 的用户，请先创建该用户';
    RAISE NOTICE '%', result_message;
    RETURN result_message;
  END IF;

  -- 更新或创建用户资料为管理员类型
  INSERT INTO user_profiles (user_id, user_type, created_at, updated_at)
  VALUES (
    admin_user_id,
    'admin',
    now(),
    now()
  ) 
  ON CONFLICT (user_id) 
  DO UPDATE SET
    user_type = 'admin',
    updated_at = now();

  -- 确保管理员权限存在
  INSERT INTO admin_permissions (admin_id, permission_name, granted_by, granted_at)
  VALUES 
    (admin_user_id, 'user_management', admin_user_id, now()),
    (admin_user_id, 'task_management', admin_user_id, now()),
    (admin_user_id, 'system_settings', admin_user_id, now()),
    (admin_user_id, 'data_analytics', admin_user_id, now()),
    (admin_user_id, 'content_moderation', admin_user_id, now())
  ON CONFLICT (admin_id, permission_name) DO NOTHING;

  -- 记录修复日志
  INSERT INTO admin_logs (
    admin_id,
    action_type,
    description,
    created_at
  )
  VALUES (
    admin_user_id,
    'admin_user_fixed',
    '管理员用户类型已修复',
    now()
  );

  result_message := '管理员用户 admin@tiklive.pro 已成功设置为管理员类型';
  RAISE NOTICE '%', result_message;
  RETURN result_message;
END;
$$;

-- 执行修复函数
SELECT fix_admin_user();

-- 验证修复结果
DO $$
DECLARE
  admin_count integer;
  user_type_result text;
BEGIN
  -- 检查管理员数量
  SELECT COUNT(*) INTO admin_count
  FROM user_profiles 
  WHERE user_type = 'admin';
  
  -- 检查特定用户的类型
  SELECT up.user_type INTO user_type_result
  FROM user_profiles up
  JOIN auth.users au ON up.user_id = au.id
  WHERE au.email = 'admin@tiklive.pro';
  
  RAISE NOTICE '当前管理员数量: %', admin_count;
  RAISE NOTICE 'admin@tiklive.pro 的用户类型: %', COALESCE(user_type_result, '未找到');
END;
$$;
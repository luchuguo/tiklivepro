/*
  # 为 auth.users 表的 email 字段添加唯一索引

  1. 优化登录性能
    - 为 email 字段添加唯一索引，提高登录查询速度
    - 确保邮箱的唯一性约束
  
  2. 性能提升
    - 减少登录时的查询时间
    - 优化用户认证流程
    - 提高系统整体响应速度

  3. 注意事项
    - auth.users 表是 Supabase Auth 管理的系统表
    - 只能添加索引，不能修改表结构
    - 索引会自动维护，无需手动管理
*/

-- 为 auth.users 表的 email 字段添加唯一索引
-- 这将显著提高基于邮箱的登录查询性能
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_email 
ON auth.users(email) 
WHERE email IS NOT NULL;

-- 为 auth.users 表的 email 字段添加普通索引（用于非唯一查询）
-- 这有助于提高邮箱搜索和验证的性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_email_lower 
ON auth.users(lower(email)) 
WHERE email IS NOT NULL;

-- 为 auth.users 表的 created_at 字段添加索引
-- 这有助于提高用户注册时间相关的查询性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_created_at 
ON auth.users(created_at);

-- 为 auth.users 表的 last_sign_in_at 字段添加索引
-- 这有助于提高用户登录时间相关的查询性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_last_sign_in_at 
ON auth.users(last_sign_in_at);

-- 添加注释说明索引用途
COMMENT ON INDEX idx_auth_users_email IS '用户邮箱唯一索引，用于提高登录查询性能';
COMMENT ON INDEX idx_auth_users_email_lower IS '用户邮箱小写索引，用于提高邮箱搜索性能';
COMMENT ON INDEX idx_auth_users_created_at IS '用户创建时间索引，用于提高时间范围查询性能';
COMMENT ON INDEX idx_auth_users_last_sign_in_at IS '用户最后登录时间索引，用于提高登录时间查询性能';

-- 验证索引创建结果
DO $$
DECLARE
  index_count integer;
BEGIN
  -- 检查索引是否成功创建
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'users' 
    AND schemaname = 'auth'
    AND indexname IN (
      'idx_auth_users_email',
      'idx_auth_users_email_lower', 
      'idx_auth_users_created_at',
      'idx_auth_users_last_sign_in_at'
    );
  
  RAISE NOTICE '✅ 成功创建 % 个索引用于优化登录性能', index_count;
  
  -- 显示创建的索引信息
  RAISE NOTICE '📊 索引详情:';
  FOR index_info IN 
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'users' 
      AND schemaname = 'auth'
      AND indexname LIKE 'idx_auth_users_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  - %: %', index_info.indexname, index_info.indexdef;
  END LOOP;
END $$; 
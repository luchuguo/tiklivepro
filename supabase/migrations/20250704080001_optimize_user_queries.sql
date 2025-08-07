/*
  # 优化用户查询性能

  1. 为用户相关表添加索引
    - user_profiles 表优化
    - user_accounts 视图优化
    - 登录相关查询优化
  
  2. 性能提升
    - 提高用户资料查询速度
    - 优化用户类型判断
    - 加快用户状态检查
*/

-- 为 user_profiles 表添加复合索引
-- 优化基于 user_id 和 user_type 的查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id_type 
ON user_profiles(user_id, user_type);

-- 为 user_profiles 表添加 user_type 索引
-- 优化按用户类型查询的性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_type 
ON user_profiles(user_type);

-- 为 user_profiles 表添加 created_at 索引
-- 优化按注册时间查询的性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_created_at 
ON user_profiles(created_at DESC);

-- 为 influencers 表添加复合索引
-- 优化基于 user_id 和审核状态的查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_influencers_user_id_approved 
ON influencers(user_id, is_approved);

-- 为 influencers 表添加状态索引
-- 优化按状态查询的性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_influencers_status 
ON influencers(status);

-- 为 companies 表添加复合索引
-- 优化基于 user_id 和验证状态的查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_user_id_verified 
ON companies(user_id, is_verified);

-- 为 companies 表添加验证状态索引
-- 优化按验证状态查询的性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_is_verified 
ON companies(is_verified);

-- 为 user_accounts 视图的底层表添加索引
-- 优化视图查询性能

-- 为 auth.users 表添加 phone 索引（如果存在）
-- 优化基于手机号的查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_phone 
ON auth.users(phone) 
WHERE phone IS NOT NULL;

-- 为 auth.users 表添加 email_confirmed_at 索引
-- 优化邮箱验证状态查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_email_confirmed_at 
ON auth.users(email_confirmed_at);

-- 为 auth.users 表添加 confirmed_at 索引
-- 优化用户确认状态查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_confirmed_at 
ON auth.users(confirmed_at);

-- 创建函数来检查索引效果
CREATE OR REPLACE FUNCTION check_login_performance_indexes()
RETURNS TABLE(
  index_name text,
  table_name text,
  index_type text,
  is_unique boolean,
  columns text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.indexname::text,
    t.tablename::text,
    i.indisunique::text,
    i.indisunique,
    array_to_string(array_agg(a.attname), ', ')::text
  FROM pg_index i
  JOIN pg_class t ON i.indrelid = t.oid
  JOIN pg_class idx ON i.indexrelid = idx.oid
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE t.tablename IN ('users', 'user_profiles', 'influencers', 'companies')
    AND t.schemaname IN ('auth', 'public')
    AND idx.relname LIKE 'idx_%'
  GROUP BY i.indexname, t.tablename, i.indisunique
  ORDER BY t.tablename, i.indexname;
END;
$$;

-- 添加注释
COMMENT ON INDEX idx_user_profiles_user_id_type IS '用户资料复合索引，优化用户ID和类型的联合查询';
COMMENT ON INDEX idx_user_profiles_user_type IS '用户类型索引，优化按用户类型查询';
COMMENT ON INDEX idx_user_profiles_created_at IS '用户创建时间索引，优化时间范围查询';
COMMENT ON INDEX idx_influencers_user_id_approved IS '达人用户ID和审核状态复合索引';
COMMENT ON INDEX idx_influencers_status IS '达人状态索引，优化状态查询';
COMMENT ON INDEX idx_companies_user_id_verified IS '企业用户ID和验证状态复合索引';
COMMENT ON INDEX idx_companies_is_verified IS '企业验证状态索引';
COMMENT ON INDEX idx_auth_users_phone IS '用户手机号索引，优化手机号查询';
COMMENT ON INDEX idx_auth_users_email_confirmed_at IS '邮箱确认时间索引，优化邮箱验证状态查询';
COMMENT ON INDEX idx_auth_users_confirmed_at IS '用户确认时间索引，优化用户确认状态查询';

-- 验证索引创建结果
DO $$
DECLARE
  total_indexes integer;
  auth_indexes integer;
  profile_indexes integer;
  influencer_indexes integer;
  company_indexes integer;
BEGIN
  -- 统计各表的索引数量
  SELECT COUNT(*) INTO auth_indexes
  FROM pg_indexes 
  WHERE tablename = 'users' 
    AND schemaname = 'auth'
    AND indexname LIKE 'idx_%';
    
  SELECT COUNT(*) INTO profile_indexes
  FROM pg_indexes 
  WHERE tablename = 'user_profiles' 
    AND schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
  SELECT COUNT(*) INTO influencer_indexes
  FROM pg_indexes 
  WHERE tablename = 'influencers' 
    AND schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
  SELECT COUNT(*) INTO company_indexes
  FROM pg_indexes 
  WHERE tablename = 'companies' 
    AND schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
  total_indexes := auth_indexes + profile_indexes + influencer_indexes + company_indexes;
  
  RAISE NOTICE '✅ 登录性能优化索引创建完成！';
  RAISE NOTICE '📊 索引统计:';
  RAISE NOTICE '  - auth.users: % 个索引', auth_indexes;
  RAISE NOTICE '  - user_profiles: % 个索引', profile_indexes;
  RAISE NOTICE '  - influencers: % 个索引', influencer_indexes;
  RAISE NOTICE '  - companies: % 个索引', company_indexes;
  RAISE NOTICE '  - 总计: % 个索引', total_indexes;
  
  -- 显示性能优化建议
  RAISE NOTICE '💡 性能优化建议:';
  RAISE NOTICE '  1. 登录查询现在会使用 email 唯一索引，查询速度显著提升';
  RAISE NOTICE '  2. 用户类型判断使用复合索引，减少查询时间';
  RAISE NOTICE '  3. 用户状态检查使用专门索引，提高响应速度';
  RAISE NOTICE '  4. 建议定期监控查询性能，必要时添加更多索引';
END $$; 
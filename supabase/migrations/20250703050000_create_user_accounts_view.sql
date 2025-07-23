/*
  # 创建用户账户视图
  
  这个视图将用户资料与认证信息结合，提供完整的用户账户信息
  包括邮箱、手机号码、用户类型等
*/

-- 创建用户账户视图
CREATE OR REPLACE VIEW user_accounts AS
SELECT 
  up.id,
  up.user_id,
  au.email,
  up.user_type,
  up.phone,
  up.avatar_url,
  up.created_at,
  up.updated_at,
  -- 达人信息
  i.nickname as influencer_nickname,
  i.real_name as influencer_real_name,
  i.tiktok_account,
  i.is_approved as influencer_approved,
  -- 企业信息
  c.company_name,
  c.contact_person,
  c.is_verified as company_verified
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
LEFT JOIN influencers i ON up.user_id = i.user_id
LEFT JOIN companies c ON up.user_id = c.user_id;

-- 为视图添加注释
COMMENT ON VIEW user_accounts IS '用户账户信息视图，包含邮箱、手机号码、用户类型等信息';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_accounts_created_at ON user_profiles(created_at); 
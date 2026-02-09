-- =============================================================================
-- 超级管理员「查看用户详细信息」— 模拟 SQL 查询
-- 用法：将 :user_id 替换为实际 uuid，或在应用层用参数绑定
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 仅查注册填写信息（与前端「查看」弹窗当前行为一致：只查 talent_details）
-- -----------------------------------------------------------------------------
SELECT *
FROM talent_details
WHERE user_id = :user_id;
-- 示例：WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';


-- -----------------------------------------------------------------------------
-- 2. 按邮箱查某用户的 talent_details（管理员输入邮箱时用）
-- -----------------------------------------------------------------------------
SELECT td.*
FROM talent_details td
JOIN auth.users au ON au.id = td.user_id
WHERE au.email = :email;
-- 示例：WHERE au.email = 'user@example.com';


-- -----------------------------------------------------------------------------
-- 3. 单用户完整详细信息（一次查询：auth + user_profiles + talent_details + 达人/企业）
--    适合后台「用户详情」接口或报表
-- -----------------------------------------------------------------------------
SELECT
  au.id AS user_id,
  au.email,
  au.created_at AS auth_created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  up.user_type,
  up.phone,
  up.avatar_url AS profile_avatar_url,
  up.created_at AS profile_created_at,
  td.id AS talent_details_id,
  td.email AS talent_email,
  td.country,
  td.contact_information,
  td.avatar_url AS talent_avatar_url,
  td.talent_types,
  td.talent_data,
  td.created_at AS talent_created_at,
  td.updated_at AS talent_updated_at,
  -- 达人扩展（仅当 user_type = 'influencer' 时有值）
  i.nickname AS influencer_nickname,
  i.real_name AS influencer_real_name,
  i.tiktok_account,
  i.is_approved AS influencer_is_approved,
  i.bio AS influencer_bio,
  i.categories AS influencer_categories,
  i.followers_count,
  i.hourly_rate,
  i.status AS influencer_status,
  -- 企业扩展（仅当 user_type = 'company' 时有值）
  c.company_name,
  c.contact_person AS company_contact_person,
  c.industry,
  c.is_verified AS company_is_verified
FROM auth.users au
LEFT JOIN user_profiles up ON up.user_id = au.id
LEFT JOIN talent_details td ON td.user_id = au.id
LEFT JOIN influencers i ON i.user_id = au.id
LEFT JOIN companies c ON c.user_id = au.id
WHERE au.id = :user_id;
-- 示例：WHERE au.id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';


-- -----------------------------------------------------------------------------
-- 4. 按邮箱查单用户完整详细信息
-- -----------------------------------------------------------------------------
SELECT
  au.id AS user_id,
  au.email,
  au.created_at AS auth_created_at,
  au.last_sign_in_at,
  up.user_type,
  up.phone,
  up.avatar_url AS profile_avatar_url,
  td.country,
  td.contact_information,
  td.talent_types,
  td.talent_data,
  td.created_at AS talent_created_at,
  i.nickname AS influencer_nickname,
  i.is_approved AS influencer_is_approved,
  c.company_name,
  c.contact_person AS company_contact_person,
  c.is_verified AS company_is_verified
FROM auth.users au
LEFT JOIN user_profiles up ON up.user_id = au.id
LEFT JOIN talent_details td ON td.user_id = au.id
LEFT JOIN influencers i ON i.user_id = au.id
LEFT JOIN companies c ON c.user_id = au.id
WHERE au.email = :email;


-- -----------------------------------------------------------------------------
-- 5. 仅查 talent_details 部分字段（轻量，用于弹窗展示）
-- -----------------------------------------------------------------------------
SELECT
  id,
  user_id,
  user_type,
  email,
  country,
  contact_information,
  avatar_url,
  talent_types,
  talent_data,
  created_at,
  updated_at
FROM talent_details
WHERE user_id = :user_id;

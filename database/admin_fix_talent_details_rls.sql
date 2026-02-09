-- =============================================================================
-- 修复：用户管理里点击「查看」显示「暂无 talent_details 记录」
-- 原因：前端请求受 RLS 限制，只有 user_profiles.user_type = 'admin' 的账号才能查所有 talent_details
-- 在 SQL 编辑器里能查到，是因为 SQL 编辑器通常用 service role，会绕过 RLS
-- =============================================================================

-- 1. 查看当前哪些账号是管理员（user_profiles 里 user_type = 'admin'）
SELECT up.user_id, au.email, up.user_type, up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.user_id
WHERE up.user_type = 'admin';


-- 2. 把你「登录后台用的邮箱」设为管理员（把下面的邮箱改成你的管理员邮箱后执行）
-- 若该用户已在 user_profiles 中，则改为 admin；若不存在则插入一条
INSERT INTO user_profiles (user_id, user_type, created_at, updated_at)
SELECT id, 'admin', now(), now()
FROM auth.users
WHERE email = '你的管理员邮箱@xxx.com'
ON CONFLICT (user_id) DO UPDATE SET user_type = 'admin', updated_at = now();


-- 3. 示例：若管理员邮箱是 admin@tiklive.pro，执行下面这句即可
-- INSERT INTO user_profiles (user_id, user_type, created_at, updated_at)
-- SELECT id, 'admin', now(), now()
-- FROM auth.users
-- WHERE email = 'admin@tiklive.pro'
-- ON CONFLICT (user_id) DO UPDATE SET user_type = 'admin', updated_at = now();


-- 4. 验证：用你的管理员邮箱查一下，应能看到 user_type = admin
-- SELECT up.user_id, au.email, up.user_type
-- FROM user_profiles up
-- JOIN auth.users au ON au.id = up.user_id
-- WHERE au.email = '你的管理员邮箱@xxx.com';

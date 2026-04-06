-- =============================================================================
-- 删除 influencers 中昵称为「Seed Creator」相关测试行（与 seed_influencers_50 一致）
-- 建议先执行「预览」SELECT，确认行数与名单后再执行 DELETE
-- 注意：若其他表以 influencers.id 为外键且无 ON DELETE CASCADE，可能需先处理子表
-- =============================================================================

-- 预览：即将删除的行
-- SELECT id, nickname, real_name, tiktok_account, bio
-- FROM influencers
-- WHERE nickname ILIKE '%Seed Creator%';

DELETE FROM influencers
WHERE nickname ILIKE '%Seed Creator%';

-- 若还需按 real_name 匹配，可改为：
-- DELETE FROM influencers
-- WHERE nickname ILIKE '%Seed Creator%'
--    OR real_name ILIKE '%Seed Creator%';

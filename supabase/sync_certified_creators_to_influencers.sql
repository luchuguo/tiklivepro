-- =============================================================================
-- 将 certified_creators 中的展示字段反写到关联的 influencers 行
-- 规则与前端 mergeCertifiedCreatorDisplay 一致：仅当认证表侧字段有有效值时才覆盖
-- 在 Supabase SQL Editor 中以 service role / 有足够权限的执行者运行
-- =============================================================================

UPDATE influencers i
SET
  nickname = COALESCE(NULLIF(TRIM(cc.display_nickname), ''), i.nickname),
  avatar_url = CASE
    WHEN cc.avatar_url IS NOT NULL AND trim(cc.avatar_url) <> '' THEN trim(cc.avatar_url)
    ELSE i.avatar_url
  END,
  location = COALESCE(NULLIF(TRIM(cc.country), ''), i.location),
  categories = CASE
    WHEN cc.industry_categories IS NOT NULL AND cardinality(cc.industry_categories) > 0
    THEN cc.industry_categories
    ELSE i.categories
  END,
  hourly_rate = COALESCE(ROUND(cc.listing_price)::integer, i.hourly_rate),
  followers_count = COALESCE(cc.tiktok_followers_count, i.followers_count),
  rating = COALESCE(cc.display_rating::numeric, i.rating),
  updated_at = now()
FROM certified_creators cc
WHERE cc.influencer_id = i.id;

-- 仅同步「当前上架」的认证行时，将上一句 WHERE 改为：
-- WHERE cc.influencer_id = i.id AND cc.is_active = true;

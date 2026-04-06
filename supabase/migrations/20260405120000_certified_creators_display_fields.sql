-- 认证达人表扩展：前台展示字段独立于 influencers，便于导入与运营配置
-- 各字段均为可选；应用中 NULL 表示回退到关联 influencers 的对应字段

ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS display_nickname text;
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS industry_categories text[];
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS listing_price numeric(12, 2);
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS tiktok_followers_count integer;
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS display_rating numeric(3, 2);

COMMENT ON COLUMN certified_creators.display_nickname IS '前台展示昵称，空则使用 influencers.nickname';
COMMENT ON COLUMN certified_creators.avatar_url IS '前台头像 URL，空则使用 influencers.avatar_url';
COMMENT ON COLUMN certified_creators.country IS '国家/地区展示，空则回退 influencers.location';
COMMENT ON COLUMN certified_creators.industry_categories IS '行业/内容分类（与前台筛选一致），空则回退 influencers.categories';
COMMENT ON COLUMN certified_creators.listing_price IS '前台标价（USD），空则回退 influencers.hourly_rate';
COMMENT ON COLUMN certified_creators.tiktok_followers_count IS 'TikTok 粉丝数展示，空则回退 influencers.followers_count';
COMMENT ON COLUMN certified_creators.display_rating IS '展示评分，空则回退 influencers.rating';

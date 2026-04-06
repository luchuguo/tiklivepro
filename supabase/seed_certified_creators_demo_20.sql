-- =============================================================================
-- certified_creators 测试数据（最多 20 条，多样性字段）
--
-- 若报错 column "display_nickname" does not exist：请先执行下面「① 扩展字段」段（幂等，可重复执行），
-- 或直接整文件执行一次即可。
--
-- 其他前置：表 certified_creators 已存在；influencers 中若干条 is_approved = true
-- 说明：从「尚未出现在 certified_creators」的已审核达人中按 id 取前 20 条
-- 清理 demo：DELETE FROM certified_creators WHERE notes LIKE '%[demo-seed]%';
-- =============================================================================

-- ① 扩展字段（与 migrations/20260405120000_certified_creators_display_fields.sql 一致）
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS display_nickname text;
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS industry_categories text[];
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS listing_price numeric(12, 2);
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS tiktok_followers_count integer;
ALTER TABLE certified_creators ADD COLUMN IF NOT EXISTS display_rating numeric(3, 2);

-- ② 插入测试数据
WITH src AS (
  SELECT
    i.id AS influencer_id,
    row_number() OVER (ORDER BY i.id) AS rn
  FROM influencers i
  WHERE i.is_approved = true
    AND NOT EXISTS (
      SELECT 1 FROM certified_creators c WHERE c.influencer_id = i.id
    )
  LIMIT 20
)
INSERT INTO certified_creators (
  influencer_id,
  sort_order,
  notes,
  is_active,
  display_nickname,
  avatar_url,
  country,
  industry_categories,
  listing_price,
  tiktok_followers_count,
  display_rating
)
SELECT
  s.influencer_id,
  (s.rn - 1) * 5,
  '[demo-seed] 测试行 #' || s.rn::text,
  CASE WHEN s.rn IN (6, 12, 18) THEN false ELSE true END,
  -- 展示昵称：风格多样
  (ARRAY[
    'Luna · Beauty Lab',
    'Alex Live SG',
    'Mika ママ',
    'Chef Rio UK',
    'TechBro Mike',
    'FitQueen Ana',
    'HomeStyle Nora',
    'Bookworm Eli',
    'Fashion Zee',
    'Foodie Han',
    'Digital Nomad K',
    'BabyCare Sue',
    'Streetwear J',
    'PlantMom Lena',
    'GamingClip Vic',
    'Travel Vlog Mira',
    'Skincare Doc Ray',
    'Music Live Leo',
    'PetTok Amy',
    'Flash Sale Dan'
  ])[(s.rn - 1) % 20 + 1],
  -- 头像：占位图 + 不同主题色 id（多样性）
  'https://picsum.photos/seed/tkbubu' || s.rn::text || '/400/500',
  (ARRAY[
    'United States',
    'United Kingdom',
    'Japan',
    'Brazil',
    'Germany',
    'France',
    'Indonesia',
    'Philippines',
    'Mexico',
    'Vietnam',
    'Thailand',
    'Malaysia',
    'India',
    'Canada',
    'Australia',
    'Spain',
    'Italy',
    'South Korea',
    'Nigeria',
    'Turkey'
  ])[(s.rn - 1) % 20 + 1],
  -- 行业分类：与前台 Content Type 筛选可匹配（beauty / fashion / food 等关键词）
  CASE (s.rn % 10)
    WHEN 0 THEN ARRAY['beauty', 'skincare', 'makeup']
    WHEN 1 THEN ARRAY['fashion', 'apparel', 'streetwear']
    WHEN 2 THEN ARRAY['food', 'lifestyle', 'cooking']
    WHEN 3 THEN ARRAY['digital', 'tech', 'gadgets']
    WHEN 4 THEN ARRAY['fitness', 'sports', 'wellness']
    WHEN 5 THEN ARRAY['maternal', 'baby', 'family']
    WHEN 6 THEN ARRAY['home', 'decor', 'diy']
    WHEN 7 THEN ARRAY['books', 'education', 'study']
    WHEN 8 THEN ARRAY['fashion', 'luxury']
    ELSE ARRAY['beauty', 'live commerce']
  END,
  -- 标价 USD：从低到高错落
  (150 + (s.rn * 173) % 4800 + (s.rn * s.rn) % 200)::numeric(12, 2),
  -- TikTok 粉丝：不同量级
  CASE
    WHEN s.rn <= 3 THEN 5000 + s.rn * 1200
    WHEN s.rn <= 8 THEN 25000 + s.rn * 8000
    WHEN s.rn <= 14 THEN 120000 + s.rn * 15000
    ELSE 900000 + s.rn * 42000
  END,
  -- 评分：3.6 ~ 5.0
  (3.6 + ((s.rn * 17) % 15) * 0.1)::numeric(3, 2)
FROM src s;

-- 可选：若希望「部分行完全走 influencers 回退」，可手动把若干行的覆盖字段清空，例如：
-- UPDATE certified_creators SET display_nickname = NULL, listing_price = NULL WHERE notes LIKE '%[demo-seed]%' AND sort_order::text LIKE '%0';

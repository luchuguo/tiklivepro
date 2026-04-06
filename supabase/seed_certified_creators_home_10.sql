-- =============================================================================
-- 认证达人 Home & Decor 共 10 条（sort_order 41–50）
-- 绑定：尚未出现在 certified_creators 的前 10 个 influencers（按 id 排序）
-- 执行后建议再运行：certified_creators_show_all.sql
-- =============================================================================

WITH raw AS (
  SELECT * FROM (VALUES
    (41, 'WilliamMunozATL',  'https://cdn.imgos.cn/vip/2026/04/06/69d34ceb286c0.jpg', 'USA', 150, 34300,  4.2),
    (42, 'Dory Azar',        'https://cdn.imgos.cn/vip/2026/04/06/69d34ceaa3096.jpg', 'USA', 310, 117500, 4.7),
    (43, 'Cam Smith',        'https://cdn.imgos.cn/vip/2026/04/06/69d34ceaaca70.jpg', 'USA', 180, 47300,  4.3),
    (44, 'GetShelfHelp',     'https://cdn.imgos.cn/vip/2026/04/06/69d34ceaeff1c.jpg', 'USA', 190, 53600,  4.4),
    (45, 'Wahid Noori',      'https://cdn.imgos.cn/vip/2026/04/06/69d34ceb3762c.jpg', 'USA', 170, 43700,  4.2),
    (46, 'SM Interiors',     'https://cdn.imgos.cn/vip/2026/04/06/69d34ceaa33d2.jpg', 'USA', 230, 76600,  4.5),
    (47, 'Country Builder',  'https://cdn.imgos.cn/vip/2026/04/06/69d34ceaa1ded.jpg', 'USA', 260, 92100,  4.6),
    (48, 'alexhomedecor',    'https://cdn.imgos.cn/vip/2026/04/06/69d34ceb452b6.jpg', 'USA', 80,  3500,   3.8),
    (49, 'hillaryyadamek',   'https://cdn.imgos.cn/vip/2026/04/06/69d34ceb4b450.jpg', 'USA', 160, 38200,  4.2),
    (50, 'Jonathan Casique', 'https://cdn.imgos.cn/vip/2026/04/06/69d34ceb3bf9a.jpg', 'USA', 150, 34200,  4.1)
  ) AS t(sort_order, display_nickname, avatar_url, country, listing_price, tiktok_followers_count, display_rating)
),
candidates AS (
  SELECT
    i.id AS influencer_id,
    row_number() OVER (ORDER BY i.id) AS rn
  FROM influencers i
  WHERE NOT EXISTS (
    SELECT 1 FROM certified_creators c WHERE c.influencer_id = i.id
  )
  LIMIT 10
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
  c.influencer_id,
  r.sort_order,
  '[seed-home] row ' || r.sort_order::text,
  true,
  r.display_nickname,
  r.avatar_url,
  r.country,
  ARRAY['home', 'decor']::text[],
  r.listing_price::numeric(12, 2),
  r.tiktok_followers_count,
  r.display_rating::numeric(3, 2)
FROM raw r
JOIN candidates c ON c.rn = (r.sort_order - 40)
ON CONFLICT (influencer_id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  notes = EXCLUDED.notes,
  is_active = EXCLUDED.is_active,
  display_nickname = EXCLUDED.display_nickname,
  avatar_url = EXCLUDED.avatar_url,
  country = EXCLUDED.country,
  industry_categories = EXCLUDED.industry_categories,
  listing_price = EXCLUDED.listing_price,
  tiktok_followers_count = EXCLUDED.tiktok_followers_count,
  display_rating = EXCLUDED.display_rating,
  updated_at = now();

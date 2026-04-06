-- =============================================================================
-- 认证达人 Books & Education 共 10 条（sort_order 21–30）
-- 绑定：尚未出现在 certified_creators 的前 10 个 influencers（按 id 排序）
-- 执行后建议再运行：certified_creators_show_all.sql
-- =============================================================================

WITH raw AS (
  SELECT * FROM (VALUES
    (21, 'Sorril',               'https://cdn.imgos.cn/vip/2026/04/05/69d2309c6c24f.jpg',  'USA', 260, 93800,  4.6),
    (22, 'Fina like Fairy',      'https://cdn.imgos.cn/vip/2026/04/05/69d2309c71083.jpg',  'USA', 255, 93700,  4.5),
    (23, 'Finding Family',       'https://cdn.imgos.cn/vip/2026/04/05/69d2309c55acd.jpg',  'USA', 220, 74200,  4.4),
    (24, 'Brii Pree',            'https://cdn.imgos.cn/vip/2026/04/05/69d2309bea7cf.jpg',  'USA', 250, 93500,  4.6),
    (25, 'Chairsh',              'https://cdn.imgos.cn/vip/2026/04/05/69d2309cb2a39.jpg',  'USA', 290, 109100, 4.7),
    (26, 'barefootmamamn',       'https://cdn.imgos.cn/vip/2026/04/05/69d2309cbc859.jpg',  'USA', 320, 138100, 4.8),
    (27, 'Jazz Robertson',       'https://cdn.imgos.cn/vip/2026/04/05/69d2309cb8503.jpg',  'USA', 180, 52900,  4.3),
    (28, 'Jazz Slowly Silver',   'https://cdn.imgos.cn/vip/2026/04/05/69d2309cc67f3.jpg',  'USA', 150, 38500,  4.2),
    (29, 'JayTay',               'https://cdn.imgos.cn/vip/2026/04/05/69d2309cb3fa3.jpg',  'USA', 270, 104400, 4.7),
    (30, 'Elizabeth Lackey',     'https://cdn.imgos.cn/vip/2026/04/05/69d2309cc49a0.jpg',  'USA', 120, 28300,  4.1)
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
  '[seed-books] row ' || r.sort_order::text,
  true,
  r.display_nickname,
  r.avatar_url,
  r.country,
  ARRAY['books', 'education']::text[],
  r.listing_price::numeric(12, 2),
  r.tiktok_followers_count,
  r.display_rating::numeric(3, 2)
FROM raw r
JOIN candidates c ON c.rn = (r.sort_order - 20)
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

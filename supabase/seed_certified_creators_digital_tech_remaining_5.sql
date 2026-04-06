-- =============================================================================
-- 在已有 5 条认证数据基础上，再插入剩余 5 条（第 6–10 行）
-- 整段为【单条】 INSERT … SELECT，避免编辑器只执行第一句导致语法错误
-- 执行成功后，请再单独执行一次：certified_creators_show_all.sql（统一 is_approved 等）
-- =============================================================================

WITH raw AS (
  SELECT * FROM (VALUES
    (6,  'Dima Codes',         'https://cdn.imgos.cn/vip/2026/04/05/69d22810a51d2.jpg',  'USA', 210, 68100,  4.60),
    (7,  'Chicago Data Nerd',  'https://cdn.imgos.cn/vip/2026/04/05/69d22810beb53.jpg',  'USA', 190, 51200,  4.30),
    (8,  'Mateo',              'https://cdn.imgos.cn/vip/2026/04/05/69d228108b5c6.jpg',  'USA', 170, 41800,  4.20),
    (9,  'danny behar',        'https://cdn.imgos.cn/vip/2026/04/05/69d22810a4d2c.jpg',  'USA', 175, 44100,  4.30),
    (10, 'Andre Najee',        'https://cdn.imgos.cn/vip/2026/04/05/69d22810af5ca.jpg',  'USA', 185, 46700,  4.40)
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
  LIMIT 5
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
  '[seed-digital-tech] row ' || r.sort_order::text,
  true,
  r.display_nickname,
  r.avatar_url,
  r.country,
  ARRAY['digital', 'tech']::text[],
  r.listing_price::numeric(12, 2),
  r.tiktok_followers_count,
  r.display_rating::numeric(3, 2)
FROM raw r
JOIN candidates c ON c.rn = (r.sort_order - 5)
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

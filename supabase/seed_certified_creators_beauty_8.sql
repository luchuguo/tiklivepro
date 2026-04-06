-- =============================================================================
-- 认证达人 Beauty & Skincare 共 8 条（sort_order 11–18）
-- 绑定：尚未出现在 certified_creators 的前 8 个 influencers（按 id 排序）
-- 执行后建议再运行：certified_creators_show_all.sql
-- =============================================================================

WITH raw AS (
  SELECT * FROM (VALUES
    (11, 'Dani Nicole',          'https://cdn.imgos.cn/vip/2026/04/05/69d22e6654853.jpg',  'USA', 295, 102200, 4.72),
    (12, 'Emma Freece',          'https://cdn.imgos.cn/vip/2026/04/05/69d22e664117d.jpg',  'USA', 260, 80500,  4.65),
    (13, 'luznunez.z',           'https://cdn.imgos.cn/vip/2026/04/05/69d22e66578f4.jpg',  'USA', 270, 81600,  4.68),
    (14, 'Luley',                'https://cdn.imgos.cn/vip/2026/04/05/69d22e6588c06.jpg',  'USA', 310, 118700, 4.80),
    (15, 'Megan Lombardi',       'https://cdn.imgos.cn/vip/2026/04/05/69d22e6627301.jpg',  'USA', 305, 116000, 4.78),
    (16, 'Briana Pelaez',        'https://cdn.imgos.cn/vip/2026/04/05/69d22e66d1703.jpg',  'USA', 300, 116000, 4.75),
    (17, 'Nikki Roth',           'https://cdn.imgos.cn/vip/2026/04/05/69d22e668442a.jpg',  'USA', 220, 59900,  4.45),
    (18, 'alexandria shekian',   'https://cdn.imgos.cn/vip/2026/04/05/69d22e66a52bc.jpg',  'USA', 235, 66700,  4.55)
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
  LIMIT 8
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
  '[seed-beauty] row ' || r.sort_order::text,
  true,
  r.display_nickname,
  r.avatar_url,
  r.country,
  ARRAY['beauty', 'skincare']::text[],
  r.listing_price::numeric(12, 2),
  r.tiktok_followers_count,
  r.display_rating::numeric(3, 2)
FROM raw r
JOIN candidates c ON c.rn = (r.sort_order - 10)
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

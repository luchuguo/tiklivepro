-- =============================================================================
-- 认证达人 Maternal & Baby 共 10 条（sort_order 51–60）
-- 绑定：尚未出现在 certified_creators 的前 10 个 influencers（按 id 排序）
-- 执行后建议再运行：certified_creators_show_all.sql
-- =============================================================================

WITH raw AS (
  SELECT * FROM (VALUES
    (51, 'Cheyenne',         'https://cdn.imgos.cn/vip/2026/04/06/69d34e3f3802e.jpg', 'USA', 120, 15700,  4.1),
    (52, 'Momofom',          'https://cdn.imgos.cn/vip/2026/04/06/69d34e3f6f83f.jpg', 'USA', 280, 104400, 4.6),
    (53, 'havyna scott',     'https://cdn.imgos.cn/vip/2026/04/06/69d34e3f804f2.jpg', 'USA', 110, 13900,  4.0),
    (54, 'thesulschifamily', 'https://cdn.imgos.cn/vip/2026/04/06/69d34e3fb0945.jpg', 'USA', 250, 86900,  4.5),
    (55, 'DeLeesa',          'https://cdn.imgos.cn/vip/2026/04/06/69d34e3f9f0bf.jpg', 'USA', 200, 58000,  4.4),
    (56, 'This Is Usss',     'https://cdn.imgos.cn/vip/2026/04/06/69d34e3fcf6eb.jpg', 'USA', 380, 185100, 4.8),
    (57, 'Krystal Dunn',     'https://cdn.imgos.cn/vip/2026/04/06/69d34e3fa09d3.jpg', 'USA', 350, 125100, 4.7),
    (58, 'kollycrew',        'https://cdn.imgos.cn/vip/2026/04/06/69d34e3fc9062.jpg', 'USA', 330, 120900, 4.7),
    (59, 'Clayton Grimm',    'https://cdn.imgos.cn/vip/2026/04/06/69d34e3fcbe3a.jpg', 'USA', 490, 417100, 4.9),
    (60, 'Maggie',           'https://cdn.imgos.cn/vip/2026/04/06/69d34e3fc733f.jpg', 'USA', 200, 57700,  4.4)
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
  '[seed-maternal] row ' || r.sort_order::text,
  true,
  r.display_nickname,
  r.avatar_url,
  r.country,
  ARRAY['maternal', 'baby']::text[],
  r.listing_price::numeric(12, 2),
  r.tiktok_followers_count,
  r.display_rating::numeric(3, 2)
FROM raw r
JOIN candidates c ON c.rn = (r.sort_order - 50)
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

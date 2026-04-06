-- =============================================================================
-- 认证达人 Fashion & Apparel 共 10 条（sort_order 31–40）
-- 第 39 行原数据解析失败，已用占位昵称与 0 数值，可在后台改
-- 绑定：尚未出现在 certified_creators 的前 10 个 influencers（按 id 排序）
-- 执行后建议再运行：certified_creators_show_all.sql
-- =============================================================================

WITH raw AS (
  SELECT * FROM (VALUES
    (31, 'Carla Nelson',    'https://cdn.imgos.cn/vip/2026/04/05/69d23264adc98.jpg', 'USA', 270, 89700,  4.6),
    (32, 'Sidney Ray',      'https://cdn.imgos.cn/vip/2026/04/05/69d232652104d.jpg', 'USA', 250, 84400,  4.5),
    (33, 'Avri Lauren',     'https://cdn.imgos.cn/vip/2026/04/05/69d232653aefb.jpg', 'USA', 320, 125400, 4.8),
    (34, 'mrhbfashion',     'https://cdn.imgos.cn/vip/2026/04/05/69d23265361ed.jpg', 'USA', 260, 87200,  4.6),
    (35, 'Maddy Jewell',    'https://cdn.imgos.cn/vip/2026/04/05/69d23264d0101.jpg', 'USA', 230, 76700,  4.4),
    (36, 'Deana',           'https://cdn.imgos.cn/vip/2026/04/05/69d23264c59c4.jpg', 'USA', 210, 69000,  4.3),
    (37, 'Cvrrent',         'https://cdn.imgos.cn/vip/2026/04/05/69d2326523950.jpg', 'USA', 290, 102700, 4.7),
    (38, 'Stayfly',         'https://cdn.imgos.cn/vip/2026/04/05/69d2326531d82.jpg', 'USA', 310, 114600, 4.8),
    (39, 'Fashion Creator 39', 'https://cdn.imgos.cn/vip/2026/04/05/69d23265407f4.jpg', 'USA', 0,   0,      0.0),
    (40, 'Cjay Syre',       'https://cdn.imgos.cn/vip/2026/04/05/69d23265495a1.jpg', 'USA', 300, 111700, 4.7)
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
  '[seed-fashion] row ' || r.sort_order::text,
  true,
  r.display_nickname,
  r.avatar_url,
  r.country,
  ARRAY['fashion', 'apparel']::text[],
  NULLIF(r.listing_price, 0)::numeric(12, 2),
  NULLIF(r.tiktok_followers_count, 0)::integer,
  NULLIF(r.display_rating, 0)::numeric(3, 2)
FROM raw r
JOIN candidates c ON c.rn = (r.sort_order - 30)
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

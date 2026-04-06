-- =============================================================================
-- 批量写入 10 条认证达人展示数据（Digital & Tech / USA）
-- 前置：已执行 certified_creators 扩展字段迁移；库内存在 is_approved = true 的 influencers
--
-- 【方式 A】自动：取「尚未在 certified_creators」中的前 10 个达人，按 id 排序与下面 10 行数据一一对应
-- 【方式 B】手动：若需指定达人，改用文件末尾「方式 B」并填入 10 个 influencer_id
-- =============================================================================

-- —— 0）清空认证相关表（会删除全部认证记录与 Portfolio；若未创建 certified_creator_portfolio 请先注释掉对应行）——
DELETE FROM certified_creator_portfolio;
DELETE FROM certified_creators;

-- —— 方式 A：自动绑定（可直接运行；若不足 10 个空闲达人则只插入能匹配的行）——

WITH raw AS (
  SELECT * FROM (VALUES
    (1,  'itsjayesco',         'https://cdn.imgos.cn/vip/2026/04/05/69d2281080571.jpg',  'USA', 288, 83700,  4.75),
    (2,  'Kierra',             'https://cdn.imgos.cn/vip/2026/04/05/69d2281084ecc.jpg',  'USA', 168, 34800,  4.69),
    (3,  'Heaven',             'https://cdn.imgos.cn/vip/2026/04/05/69d2281075df0.jpg',  'USA', 233, 104300, 4.50),
    (4,  'Alex',               'https://cdn.imgos.cn/vip/2026/04/05/69d2281067baa.jpg',  'USA', 180, 39000,  4.40),
    (5,  'Uma Abu',            'https://cdn.imgos.cn/vip/2026/04/05/69d22810c019e.jpg',  'USA', 250, 90000,  4.70),
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
  WHERE i.is_approved = true
    AND NOT EXISTS (SELECT 1 FROM certified_creators c WHERE c.influencer_id = i.id)
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
JOIN candidates c ON c.rn = r.sort_order
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

-- =============================================================================
-- 方式 B：手动指定 10 个 influencer_id（把下面 uuid 换成你库里的真实 ID 后单独执行）
-- =============================================================================
/*
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
) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 1,  '[seed-digital-tech] 1',  true, 'itsjayesco',        'https://cdn.imgos.cn/vip/2026/04/05/69d2281080571.jpg',  'USA', ARRAY['digital','tech'], 288, 83700,  4.75),
  ('00000000-0000-0000-0000-000000000002'::uuid, 2,  '[seed-digital-tech] 2',  true, 'Kierra',            'https://cdn.imgos.cn/vip/2026/04/05/69d2281084ecc.jpg',  'USA', ARRAY['digital','tech'], 168, 34800,  4.69),
  ('00000000-0000-0000-0000-000000000003'::uuid, 3,  '[seed-digital-tech] 3',  true, 'Heaven',            'https://cdn.imgos.cn/vip/2026/04/05/69d2281075df0.jpg',  'USA', ARRAY['digital','tech'], 233, 104300, 4.50),
  ('00000000-0000-0000-0000-000000000004'::uuid, 4,  '[seed-digital-tech] 4',  true, 'Alex',              'https://cdn.imgos.cn/vip/2026/04/05/69d2281067baa.jpg',  'USA', ARRAY['digital','tech'], 180, 39000,  4.40),
  ('00000000-0000-0000-0000-000000000005'::uuid, 5,  '[seed-digital-tech] 5',  true, 'Uma Abu',           'https://cdn.imgos.cn/vip/2026/04/05/69d22810c019e.jpg',  'USA', ARRAY['digital','tech'], 250, 90000,  4.70),
  ('00000000-0000-0000-0000-000000000006'::uuid, 6,  '[seed-digital-tech] 6',  true, 'Dima Codes',        'https://cdn.imgos.cn/vip/2026/04/05/69d22810a51d2.jpg',  'USA', ARRAY['digital','tech'], 210, 68100,  4.60),
  ('00000000-0000-0000-0000-000000000007'::uuid, 7,  '[seed-digital-tech] 7',  true, 'Chicago Data Nerd', 'https://cdn.imgos.cn/vip/2026/04/05/69d22810beb53.jpg',  'USA', ARRAY['digital','tech'], 190, 51200,  4.30),
  ('00000000-0000-0000-0000-000000000008'::uuid, 8,  '[seed-digital-tech] 8',  true, 'Mateo',             'https://cdn.imgos.cn/vip/2026/04/05/69d228108b5c6.jpg',  'USA', ARRAY['digital','tech'], 170, 41800,  4.20),
  ('00000000-0000-0000-0000-000000000009'::uuid, 9,  '[seed-digital-tech] 9',  true, 'danny behar',       'https://cdn.imgos.cn/vip/2026/04/05/69d22810a4d2c.jpg',  'USA', ARRAY['digital','tech'], 175, 44100,  4.30),
  ('00000000-0000-0000-0000-000000000010'::uuid, 10, '[seed-digital-tech] 10', true, 'Andre Najee',       'https://cdn.imgos.cn/vip/2026/04/05/69d22810af5ca.jpg',  'USA', ARRAY['digital','tech'], 185, 46700,  4.40)
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
*/

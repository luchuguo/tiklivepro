-- =============================================================================
-- 插入 50 条 influencers 测试数据（无 user_id，不依赖 auth.users）
-- 依赖：influencers.user_id 可为 NULL（默认迁移即为可选）
-- 标记：bio 含 [seed-50]，删除示例：DELETE FROM influencers WHERE bio LIKE '%[seed-50]%';
-- =============================================================================

INSERT INTO influencers (
  user_id,
  nickname,
  real_name,
  tiktok_account,
  followers_count,
  categories,
  hourly_rate,
  experience_years,
  bio,
  avatar_url,
  is_verified,
  is_approved,
  rating,
  total_reviews,
  total_live_count,
  avg_views,
  location,
  tags,
  status
)
SELECT
  NULL::uuid AS user_id,
  'Seed Creator ' || n AS nickname,
  'Demo User ' || n AS real_name,
  '@seed_creator_' || n AS tiktok_account,
  (8000 + (n * 7919) % 1200000)::integer AS followers_count,
  CASE (n - 1) % 8
    WHEN 0 THEN ARRAY['beauty', 'skincare']::text[]
    WHEN 1 THEN ARRAY['fashion', 'apparel']::text[]
    WHEN 2 THEN ARRAY['food', 'lifestyle']::text[]
    WHEN 3 THEN ARRAY['digital', 'tech']::text[]
    WHEN 4 THEN ARRAY['fitness', 'sports']::text[]
    WHEN 5 THEN ARRAY['maternal', 'baby']::text[]
    WHEN 6 THEN ARRAY['home', 'decor']::text[]
    ELSE ARRAY['books', 'education']::text[]
  END AS categories,
  (120 + (n * 97) % 480)::integer AS hourly_rate,
  (1 + (n % 8))::decimal AS experience_years,
  '[seed-50] Auto-generated test influencer #' || n AS bio,
  'https://picsum.photos/seed/tk-inf-' || n || '/400/400' AS avatar_url,
  (n % 4 <> 0) AS is_verified,
  true AS is_approved,
  (3.5 + ((n * 13) % 15) * 0.1)::decimal AS rating,
  (n * 3) % 200 AS total_reviews,
  (n * 2) % 150 AS total_live_count,
  (5000 + (n * 997) % 80000)::integer AS avg_views,
  (ARRAY[
    'Los Angeles, USA',
    'London, UK',
    'Tokyo, Japan',
    'São Paulo, Brazil',
    'Berlin, Germany',
    'Jakarta, Indonesia',
    'Manila, Philippines',
    'Mexico City, Mexico'
  ])[(n - 1) % 8 + 1] AS location,
  ARRAY['seed', 'test']::text[] AS tags,
  'active'::text AS status
FROM generate_series(1, 50) AS n;

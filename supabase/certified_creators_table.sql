-- =============================================================================
-- 认证达人表 certified_creators（可单独在 Supabase SQL Editor 中执行）
-- 依赖：public.influencers、public.user_profiles、函数 update_updated_at_column()
-- =============================================================================

CREATE TABLE IF NOT EXISTS certified_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  -- 前台展示覆盖字段（均可空；空则回退 influencers）
  display_nickname text,
  avatar_url text,
  country text,
  industry_categories text[],
  listing_price numeric(12, 2),
  tiktok_followers_count integer,
  display_rating numeric(3, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certified_creators_influencer_id_key UNIQUE (influencer_id)
);

CREATE INDEX IF NOT EXISTS idx_certified_creators_active_sort
  ON certified_creators (is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_certified_creators_influencer_id
  ON certified_creators (influencer_id);

DROP TRIGGER IF EXISTS update_certified_creators_updated_at ON certified_creators;
CREATE TRIGGER update_certified_creators_updated_at
  BEFORE UPDATE ON certified_creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE certified_creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active certified_creators" ON certified_creators;
DROP POLICY IF EXISTS "Admins read all certified_creators" ON certified_creators;
DROP POLICY IF EXISTS "Admins insert certified_creators" ON certified_creators;
DROP POLICY IF EXISTS "Admins update certified_creators" ON certified_creators;
DROP POLICY IF EXISTS "Admins delete certified_creators" ON certified_creators;

CREATE POLICY "Public read active certified_creators"
  ON certified_creators
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins read all certified_creators"
  ON certified_creators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins insert certified_creators"
  ON certified_creators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins update certified_creators"
  ON certified_creators
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins delete certified_creators"
  ON certified_creators
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

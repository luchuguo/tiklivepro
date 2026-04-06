-- =============================================================================
-- certified_creator_portfolio — 认证达人 Portfolio 图片表
-- 依赖：certified_creators、user_profiles、update_updated_at_column()
-- 可与 migrations/20260406120000_certified_creator_portfolio.sql 二选一执行（内容一致）
-- =============================================================================

CREATE TABLE IF NOT EXISTS certified_creator_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certified_creator_id uuid NOT NULL REFERENCES certified_creators(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  caption text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certified_creator_portfolio_cert_sort
  ON certified_creator_portfolio (certified_creator_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_certified_creator_portfolio_active
  ON certified_creator_portfolio (certified_creator_id, is_active);

DROP TRIGGER IF EXISTS update_certified_creator_portfolio_updated_at ON certified_creator_portfolio;
CREATE TRIGGER update_certified_creator_portfolio_updated_at
  BEFORE UPDATE ON certified_creator_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE certified_creator_portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active portfolio" ON certified_creator_portfolio;
DROP POLICY IF EXISTS "Admins read all portfolio" ON certified_creator_portfolio;
DROP POLICY IF EXISTS "Admins insert portfolio" ON certified_creator_portfolio;
DROP POLICY IF EXISTS "Admins update portfolio" ON certified_creator_portfolio;
DROP POLICY IF EXISTS "Admins delete portfolio" ON certified_creator_portfolio;

CREATE POLICY "Public read active portfolio"
  ON certified_creator_portfolio
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM certified_creators cc
      WHERE cc.id = certified_creator_portfolio.certified_creator_id
        AND cc.is_active = true
    )
  );

CREATE POLICY "Admins read all portfolio"
  ON certified_creator_portfolio
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins insert portfolio"
  ON certified_creator_portfolio
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins update portfolio"
  ON certified_creator_portfolio
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

CREATE POLICY "Admins delete portfolio"
  ON certified_creator_portfolio
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

COMMENT ON TABLE certified_creator_portfolio IS '认证达人 Portfolio 图片；关联 certified_creators.id';

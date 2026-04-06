/*
  # 认证达人登记表 certified_creators

  - 每条记录对应一名达人（influencers），用于前台「Certified Creator」专区与后台管理
  - 支持排序、备注、启用/停用；批量导入使用 influencer_id 关联

  部署：在 Supabase SQL Editor 执行本文件，或 supabase db push
*/

CREATE TABLE IF NOT EXISTS certified_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
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

-- 可重复执行：先删除同名策略再创建
DROP POLICY IF EXISTS "Public read active certified_creators" ON certified_creators;
DROP POLICY IF EXISTS "Admins read all certified_creators" ON certified_creators;
DROP POLICY IF EXISTS "Admins insert certified_creators" ON certified_creators;
DROP POLICY IF EXISTS "Admins update certified_creators" ON certified_creators;
DROP POLICY IF EXISTS "Admins delete certified_creators" ON certified_creators;

-- 匿名与登录用户：仅可读「启用」的认证记录（供前台 / 公开 API）
CREATE POLICY "Public read active certified_creators"
  ON certified_creators
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 管理员：可读全部记录（含停用）
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

COMMENT ON TABLE certified_creators IS '认证达人登记：关联 influencers，前台仅展示 is_active=true';

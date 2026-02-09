-- =============================================================================
-- talent_details 表：存储注册页面所有填写信息（可单独在 Supabase SQL 编辑器中执行）
-- =============================================================================

-- 若项目中已有 update_updated_at_column() 可跳过此函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 表：注册填写信息
CREATE TABLE IF NOT EXISTS talent_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('influencer', 'company')),

  -- 通用信息（注册页基础信息）
  email text NOT NULL,
  country text,
  contact_information text,
  avatar_url text,

  -- 达人：选中的才能类型
  talent_types text[] DEFAULT '{}',
  -- 达人：各类型表单完整数据（与注册页 TalentQuestionForm 一致）
  talent_data jsonb DEFAULT '{}',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_talent_details_user_id ON talent_details(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_details_user_type ON talent_details(user_type);
CREATE INDEX IF NOT EXISTS idx_talent_details_created_at ON talent_details(created_at);
CREATE INDEX IF NOT EXISTS idx_talent_details_email ON talent_details(email);

-- 注释
COMMENT ON TABLE talent_details IS '注册页所有填写信息：通用项 + 达人多才能类型表单数据';
COMMENT ON COLUMN talent_details.talent_data IS '达人各类型表单：live-host(categories,host_styles,achievement,portfolio*), account-manager(operation_categories,success_cases), video-editor(editing_software,editing_styles)';

-- 更新时间触发器
DROP TRIGGER IF EXISTS update_talent_details_updated_at ON talent_details;
CREATE TRIGGER update_talent_details_updated_at
  BEFORE UPDATE ON talent_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE talent_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own talent_details" ON talent_details;
CREATE POLICY "Users can view own talent_details"
  ON talent_details FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own talent_details" ON talent_details;
CREATE POLICY "Users can insert own talent_details"
  ON talent_details FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own talent_details" ON talent_details;
CREATE POLICY "Users can update own talent_details"
  ON talent_details FOR UPDATE USING (auth.uid() = user_id);

-- 管理员可查看所有用户的 talent_details（后台用户管理「查看」弹窗用）
DROP POLICY IF EXISTS "Admins can view all talent_details" ON talent_details;
CREATE POLICY "Admins can view all talent_details"
  ON talent_details FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'admin')
  );

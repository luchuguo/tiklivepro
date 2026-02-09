/*
  # 创建 talent_details 表
  
  存储注册页面所有填写信息，一条记录对应一个注册用户。
  - 通用字段：邮箱、用户类型、国家、联系方式、头像等
  - 达人用户：talent_types 为选中的类型数组，talent_data 为各类型表单的完整数据（含 experience/categories/styles/portfolio 等）
  - 企业用户：仅使用通用字段，talent_types 与 talent_data 为空
*/

-- 表：注册填写信息（与现有注册页表单一一对应）
CREATE TABLE IF NOT EXISTS talent_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('influencer', 'company')),
  
  -- 通用信息（注册页「Fill in Basic Information」）
  email text NOT NULL,
  country text,
  contact_information text,
  avatar_url text,
  
  -- 达人专属：选中的才能类型（如 live-host, account-manager, video-editor）
  talent_types text[] DEFAULT '{}',
  -- 达人专属：按类型存储的完整表单数据（与 TalentQuestionForm 字段一致）
  -- 结构示例：{ "live-host": { "experience", "categories", "styles", "achievement", "portfolio", "portfolio_files" }, "account-manager": { ... }, "video-editor": { ... } }
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
COMMENT ON COLUMN talent_details.user_id IS '对应用户 auth.users.id';
COMMENT ON COLUMN talent_details.user_type IS 'influencer=达人/creator, company=企业';
COMMENT ON COLUMN talent_details.email IS '注册时填写的邮箱';
COMMENT ON COLUMN talent_details.country IS '国家（可选，达人填写）';
COMMENT ON COLUMN talent_details.contact_information IS '联系方式，如 Telegram/WhatsApp';
COMMENT ON COLUMN talent_details.avatar_url IS '头像/Logo 图片 URL';
COMMENT ON COLUMN talent_details.talent_types IS '达人选中的才能类型数组，如 [''live-host'',''video-editor'']';
COMMENT ON COLUMN talent_details.talent_data IS '达人各类型表单数据：experience/categories/styles/achievement/portfolio/portfolio_files 等';

-- 更新时间触发器（复用项目已有函数）
CREATE TRIGGER update_talent_details_updated_at
  BEFORE UPDATE ON talent_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE talent_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own talent_details"
  ON talent_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own talent_details"
  ON talent_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own talent_details"
  ON talent_details FOR UPDATE
  USING (auth.uid() = user_id);

-- 管理员可查看全部（需与现有 admin 判定一致，此处按 user_profiles.user_type = 'admin' 示例，若无 admin_profiles 可删或改为 service_role）
-- CREATE POLICY "Admins can view all talent_details"
--   ON talent_details FOR SELECT
--   USING (
--     EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'admin')
--   );

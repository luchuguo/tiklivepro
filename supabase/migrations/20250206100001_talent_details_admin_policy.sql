-- 管理员可查看所有用户的 talent_details（后台用户管理「查看」时用）
DROP POLICY IF EXISTS "Admins can view all talent_details" ON talent_details;
CREATE POLICY "Admins can view all talent_details"
  ON talent_details FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'admin')
  );

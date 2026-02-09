-- =============================================================================
-- 修复：管理员在用户管理点击「查看」时能正确拉取 talent_details
-- 通过 RPC（SECURITY DEFINER）在服务端校验管理员身份后返回数据，避免受 RLS 或 profile 缓存影响
-- =============================================================================

-- 管理员按 user_id 查询单条 talent_details（仅当当前用户为 admin 时返回）
CREATE OR REPLACE FUNCTION get_talent_details_for_admin(target_user_id uuid)
RETURNS SETOF talent_details
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 仅当当前登录用户在 user_profiles 中为 admin 时允许查询
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND user_type = 'admin'
  ) THEN
    RETURN;  -- 非管理员直接返回空
  END IF;

  RETURN QUERY
  SELECT t.*
  FROM talent_details t
  WHERE t.user_id = target_user_id;
END;
$$;

-- 仅允许已认证用户调用
GRANT EXECUTE ON FUNCTION get_talent_details_for_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_talent_details_for_admin(uuid) TO service_role;

COMMENT ON FUNCTION get_talent_details_for_admin(uuid) IS '管理员查看用户详情时拉取 talent_details；仅 admin 可得到数据，非 admin 返回空';

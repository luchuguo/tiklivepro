-- =============================================================================
-- 让认证达人列表「尽量全部显示」：前台会跳过 is_approved = false 的达人
-- 本脚本：① 启用所有认证行 ② 将出现在 certified_creators 里的达人一律标为已审核
-- 在 Supabase SQL Editor 中执行即可
-- =============================================================================

-- 1) 认证表全部启用（前台只读 is_active = true）
UPDATE certified_creators
SET is_active = true,
    updated_at = now()
WHERE is_active IS DISTINCT FROM true;

-- 2) 凡在认证名单中的达人，一律设为已审核（与前台 CertifiedCreatorPage 逻辑一致）
UPDATE influencers i
SET
  is_approved = true,
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM certified_creators c WHERE c.influencer_id = i.id
);

-- （可选）若你希望库里「所有达人」都在前台达人池里可搜，可解开下面注释（慎用）
-- UPDATE influencers SET is_approved = true, updated_at = now();

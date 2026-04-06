-- 诊断：一次只执行本文件（或按需复制其中一条）
-- 若「空闲达人数」为 0，无法再插 5 条认证数据，需先增加 influencers 行

SELECT COUNT(*) AS certified_rows FROM certified_creators;

SELECT COUNT(*) AS free_influencers
FROM influencers i
WHERE NOT EXISTS (
  SELECT 1 FROM certified_creators c WHERE c.influencer_id = i.id
);

SELECT i.id, i.nickname, i.is_approved
FROM influencers i
WHERE NOT EXISTS (
  SELECT 1 FROM certified_creators c WHERE c.influencer_id = i.id
)
ORDER BY i.id
LIMIT 10;

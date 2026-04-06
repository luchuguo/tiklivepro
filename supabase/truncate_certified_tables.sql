-- =============================================================================
-- 清空认证达人相关表（仅数据，不删表结构）
-- 顺序：先 certified_creator_portfolio（子表），再 certified_creators（父表）
-- 若尚未执行 portfolio 建表 SQL，请注释掉第一行，只执行 DELETE certified_creators
-- =============================================================================

DELETE FROM certified_creator_portfolio;
DELETE FROM certified_creators;

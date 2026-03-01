-- 删除物料价格历史表
-- 简化系统，只使用materials表的last_price字段

-- 删除外键约束
ALTER TABLE material_price_histories 
DROP FOREIGN KEY IF EXISTS material_price_histories_ibfk_1,
DROP FOREIGN KEY IF EXISTS material_price_histories_ibfk_2,
DROP FOREIGN KEY IF EXISTS material_price_histories_ibfk_3,
DROP FOREIGN KEY IF EXISTS material_price_histories_ibfk_4;

-- 删除表
DROP TABLE IF EXISTS material_price_histories;


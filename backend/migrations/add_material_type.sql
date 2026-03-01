-- 为物料表添加物料类型字段
-- 物料类型枚举：unknown(未知)、manual(手动录入)、quotation(报价单录入)

ALTER TABLE materials
ADD COLUMN material_type VARCHAR(20) DEFAULT 'unknown' COMMENT '物料类型：unknown(未知)、manual(手动录入)、quotation(报价单录入)' AFTER source;

-- 将现有物料设置为未知类型
UPDATE materials SET material_type = 'unknown' WHERE material_type IS NULL OR material_type = '';


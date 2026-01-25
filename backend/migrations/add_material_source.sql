-- 为物料表添加来源字段
-- 用于记录物料的来源，如报价单对应的供应商名称

ALTER TABLE materials
ADD COLUMN source VARCHAR(200) COMMENT '来源（如：报价单对应的供应商名称）' AFTER remark;


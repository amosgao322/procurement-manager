-- 为 materials 表添加 updated_by 字段
-- 用于记录更新物料信息的用户

ALTER TABLE materials
ADD COLUMN updated_by INT COMMENT '更新人ID' AFTER created_by;


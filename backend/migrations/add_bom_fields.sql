-- BOM表新增字段迁移脚本
-- 执行时间：2024年
-- 说明：为BOM表和BOM明细表添加新字段

-- 1. 为boms表添加新字段
ALTER TABLE boms 
ADD COLUMN customer_name VARCHAR(200) COMMENT '客户名称' AFTER remark,
ADD COLUMN date DATETIME COMMENT '日期' AFTER customer_name,
ADD COLUMN version VARCHAR(50) COMMENT '版本号' AFTER date,
ADD COLUMN sales_channel VARCHAR(100) COMMENT '销售渠道' AFTER version,
ADD COLUMN prepared_by VARCHAR(100) COMMENT '制单人' AFTER sales_channel,
ADD COLUMN pricing_reviewer VARCHAR(100) COMMENT '核价人' AFTER prepared_by;

-- 2. 更新boms表的status字段默认值为中文
UPDATE boms SET status = '草稿' WHERE status = 'draft';
UPDATE boms SET status = '生效' WHERE status = 'active';
UPDATE boms SET status = '归档' WHERE status = 'archived';

-- 3. 为bom_items表添加新字段
ALTER TABLE bom_items
ADD COLUMN material_category VARCHAR(100) COMMENT '物料类别' AFTER remark,
ADD COLUMN material_grade VARCHAR(100) COMMENT '材质/牌号' AFTER material_category,
ADD COLUMN unit_weight DECIMAL(15, 2) COMMENT '单重（kg）' AFTER material_grade,
ADD COLUMN total_weight DECIMAL(15, 2) COMMENT '总重（kg）' AFTER unit_weight,
ADD COLUMN brand_manufacturer VARCHAR(200) COMMENT '品牌/厂家' AFTER total_weight,
ADD COLUMN standard_number VARCHAR(200) COMMENT '标准号/图床' AFTER brand_manufacturer,
ADD COLUMN surface_treatment VARCHAR(100) COMMENT '表面处理' AFTER standard_number;


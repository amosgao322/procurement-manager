-- 物料库管理与价格历史迁移脚本
-- 为 Material 表添加价格有效性状态、最近价格等字段
-- 创建 MaterialPriceHistory 表用于沉淀历史价格数据

-- 1. 为 materials 表添加新字段
ALTER TABLE materials
ADD COLUMN price_status VARCHAR(20) DEFAULT 'pending' COMMENT '价格有效性状态：pending/valid/expired/abnormal' AFTER is_active,
ADD COLUMN status_reason TEXT COMMENT '状态原因（异常/过期时记录）' AFTER price_status,
ADD COLUMN currency VARCHAR(10) DEFAULT 'CNY' COMMENT '币种' AFTER status_reason,
ADD COLUMN last_price DECIMAL(15, 4) COMMENT '最近价格（用于快速展示与默认估算）' AFTER currency;

-- 2. 将现有物料的状态设为 valid（假设已有数据都是有效的）
UPDATE materials SET price_status = 'valid' WHERE price_status IS NULL OR price_status = '';

-- 3. 创建物料价格历史表
CREATE TABLE IF NOT EXISTS material_price_histories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL COMMENT '物料ID',
    supplier_id INT COMMENT '供应商ID',
    quotation_id INT COMMENT '报价单ID',
    quotation_item_id INT COMMENT '报价明细ID',
    source VARCHAR(20) NOT NULL DEFAULT 'quotation' COMMENT '来源：quotation/manual',
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT '币种',
    unit_price DECIMAL(15, 4) NOT NULL COMMENT '单价',
    quantity DECIMAL(15, 4) COMMENT '数量（可选，用于追溯）',
    captured_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '采集时间',
    INDEX idx_material_id (material_id),
    INDEX idx_supplier_id (supplier_id),
    INDEX idx_quotation_id (quotation_id),
    INDEX idx_quotation_item_id (quotation_item_id),
    INDEX idx_captured_at (captured_at),
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
    FOREIGN KEY (quotation_item_id) REFERENCES quotation_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料价格历史表';


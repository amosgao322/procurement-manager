"""
物料模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric
from sqlalchemy.sql import func
from app.core.database import Base


class Material(Base):
    """物料表"""
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True, comment="物料编码")
    name = Column(String(200), nullable=False, index=True, comment="物料名称")
    specification = Column(String(500), comment="规格型号")
    unit = Column(String(20), comment="单位")
    category = Column(String(50), comment="物料类别")
    brand = Column(String(100), comment="品牌")
    # legacy 字段：历史上存放“参考价/标准价”，字符串不便统计，后续建议迁移到 last_price 与价格历史表
    standard_price = Column(String(50), comment="标准价格（参考，legacy）")

    # 价格有效性状态：pending(待确认)/valid(有效)/expired(过期)/abnormal(异常)
    price_status = Column(String(20), default="pending", nullable=False, index=True, comment="价格状态")
    status_reason = Column(String(500), comment="状态原因/说明")
    currency = Column(String(10), default="CNY", nullable=False, comment="币种")
    last_price = Column(Numeric(15, 4), comment="最近一次单价（用于快速展示/兜底估算）")
    remark = Column(Text, comment="备注")
    source = Column(String(200), comment="来源（如：报价单对应的供应商名称）")
    material_type = Column(String(20), default="unknown", nullable=False, comment="物料类型：unknown(未知)、manual(手动录入)、quotation(报价单录入)")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_by = Column(Integer, comment="创建人ID")
    updated_by = Column(Integer, comment="更新人ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")


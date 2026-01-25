"""
BOM清单模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class BOM(Base):
    """BOM清单表"""
    __tablename__ = "boms"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True, comment="BOM编码")
    name = Column(String(200), nullable=False, index=True, comment="BOM名称")
    product_name = Column(String(200), comment="产品名称")
    description = Column(Text, comment="描述")
    status = Column(String(20), default="草稿", comment="状态：草稿、生效、归档")
    total_amount = Column(Numeric(15, 2), comment="总金额")
    remark = Column(Text, comment="备注")
    customer_name = Column(String(200), comment="客户名称")
    date = Column(DateTime(timezone=True), comment="日期")
    version = Column(String(50), comment="版本号")
    sales_channel = Column(String(100), comment="销售渠道")
    prepared_by = Column(String(100), comment="制单人")
    pricing_reviewer = Column(String(100), comment="核价人")
    created_by = Column(Integer, comment="创建人ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关联关系
    items = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")


class BOMItem(Base):
    """BOM明细表"""
    __tablename__ = "bom_items"
    
    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("boms.id"), nullable=False, comment="BOM ID")
    sequence = Column(String(20), comment="序号")
    material_name = Column(String(200), nullable=False, comment="设备/物料名称")
    specification = Column(String(500), comment="规格型号")
    unit = Column(String(20), comment="单位")
    quantity = Column(Numeric(15, 2), nullable=False, comment="数量")
    unit_price = Column(Numeric(15, 2), comment="单价")
    total_price = Column(Numeric(15, 2), comment="总价（数量×单价）")
    remark = Column(Text, comment="备注")
    material_category = Column(String(100), comment="物料类别")
    material_grade = Column(String(100), comment="材质/牌号")
    unit_weight = Column(Numeric(15, 2), comment="单重（kg）")
    total_weight = Column(Numeric(15, 2), comment="总重（kg）")
    brand_manufacturer = Column(String(200), comment="品牌/厂家")
    standard_number = Column(String(200), comment="标准号/图床")
    surface_treatment = Column(String(100), comment="表面处理")
    sort_order = Column(Integer, default=0, comment="排序")
    created_by = Column(Integer, comment="创建人ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    
    # 关联关系
    bom = relationship("BOM", back_populates="items")


"""
报价单模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Quotation(Base):
    """报价单表"""
    __tablename__ = "quotations"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True, comment="报价单编号")
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, comment="供应商ID")
    bom_id = Column(Integer, ForeignKey("boms.id"), comment="关联BOM ID")
    title = Column(String(200), nullable=False, comment="报价单标题")
    quotation_date = Column(DateTime(timezone=True), comment="报价日期")
    valid_until = Column(DateTime(timezone=True), comment="有效期至")
    total_amount = Column(Numeric(15, 2), comment="总金额")
    currency = Column(String(10), default="CNY", comment="币种")
    payment_terms = Column(String(200), comment="付款条件")
    delivery_terms = Column(String(200), comment="交货条件")
    delivery_days = Column(Integer, comment="交货天数")
    status = Column(String(20), default="draft", comment="状态：draft-草稿, submitted-已提交, approved-已审批, rejected-已拒绝")
    approval_comment = Column(Text, comment="审批意见")
    approved_by = Column(Integer, comment="审批人ID")
    approved_at = Column(DateTime(timezone=True), comment="审批时间")
    remark = Column(Text, comment="备注")
    created_by = Column(Integer, comment="创建人ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关联关系
    supplier = relationship("Supplier", back_populates="quotations")
    bom = relationship("BOM", foreign_keys=[bom_id])
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")


class QuotationItem(Base):
    """报价明细表"""
    __tablename__ = "quotation_items"
    
    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False, comment="报价单ID")
    sequence = Column(String(20), comment="序号")
    material_name = Column(String(200), nullable=False, comment="物料名称")
    specification = Column(String(500), comment="规格型号")
    unit = Column(String(20), comment="单位")
    quantity = Column(Numeric(15, 2), nullable=False, comment="数量")
    unit_price = Column(Numeric(15, 2), nullable=False, comment="单价")
    total_price = Column(Numeric(15, 2), comment="总价")
    brand = Column(String(100), comment="品牌")
    delivery_days = Column(Integer, comment="交货天数")
    remark = Column(Text, comment="备注")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    
    # 关联关系
    quotation = relationship("Quotation", back_populates="items")


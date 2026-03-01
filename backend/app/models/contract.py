"""
合同模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Contract(Base):
    """合同表"""
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True, comment="合同编号")
    title = Column(String(200), nullable=False, comment="合同标题")
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, comment="供应商ID")
    bom_id = Column(Integer, ForeignKey("boms.id"), comment="关联BOM ID")
    quotation_id = Column(Integer, ForeignKey("quotations.id"), comment="关联报价单ID")
    contract_type = Column(String(50), comment="合同类型")
    sign_date = Column(DateTime(timezone=True), comment="签订日期")
    start_date = Column(DateTime(timezone=True), comment="生效日期")
    end_date = Column(DateTime(timezone=True), comment="到期日期")
    total_amount = Column(Numeric(15, 2), comment="合同总金额")
    currency = Column(String(10), default="CNY", comment="币种")
    payment_terms = Column(Text, comment="付款条件")
    delivery_terms = Column(Text, comment="交货条件")
    status = Column(String(20), default="draft", comment="状态：draft-草稿, active-生效, completed-已完成, terminated-已终止")
    file_path = Column(String(500), comment="合同文件路径")
    remark = Column(Text, comment="备注")
    created_by = Column(Integer, comment="创建人ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关联关系
    supplier = relationship("Supplier")
    bom = relationship("BOM")
    quotation = relationship("Quotation")


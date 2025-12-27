"""
供应商模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Supplier(Base):
    """供应商表"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True, comment="供应商编码")
    name = Column(String(200), nullable=False, index=True, comment="供应商名称")
    contact_person = Column(String(50), comment="联系人")
    contact_phone = Column(String(20), comment="联系电话")
    contact_email = Column(String(100), comment="联系邮箱")
    address = Column(String(500), comment="地址")
    tax_id = Column(String(50), comment="税号")
    bank_name = Column(String(200), comment="开户银行")
    bank_account = Column(String(50), comment="银行账号")
    credit_rating = Column(String(20), comment="信用等级")
    remark = Column(Text, comment="备注")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_by = Column(Integer, comment="创建人ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关联关系
    quotations = relationship("Quotation", back_populates="supplier")


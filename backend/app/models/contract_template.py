"""
合同模板模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class ContractTemplate(Base):
    """合同模板表"""
    __tablename__ = "contract_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, comment="模板名称")
    description = Column(Text, comment="模板描述")
    file_path = Column(String(500), nullable=False, comment="模板文件路径")
    file_name = Column(String(200), nullable=False, comment="模板文件名")
    file_size = Column(Integer, comment="文件大小（字节）")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_by = Column(Integer, comment="创建人ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")


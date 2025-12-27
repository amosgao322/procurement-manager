"""
物料模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
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
    standard_price = Column(String(50), comment="标准价格（参考）")
    remark = Column(Text, comment="备注")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_by = Column(Integer, comment="创建人ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")


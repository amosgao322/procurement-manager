"""
操作日志模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class OperationLog(Base):
    """操作日志表"""
    __tablename__ = "operation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True, comment="操作用户ID")
    username = Column(String(50), comment="用户名")
    operation = Column(String(50), nullable=False, index=True, comment="操作类型（create, update, delete, approve, reject等）")
    resource = Column(String(50), nullable=False, index=True, comment="资源类型（bom, supplier, quotation, contract等）")
    resource_id = Column(Integer, comment="资源ID")
    resource_code = Column(String(50), comment="资源编码")
    description = Column(Text, comment="操作描述")
    old_data = Column(JSON, comment="变更前数据")
    new_data = Column(JSON, comment="变更后数据")
    ip_address = Column(String(50), comment="IP地址")
    user_agent = Column(String(500), comment="用户代理")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, comment="操作时间")


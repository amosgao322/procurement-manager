"""
用户、角色、权限模型
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


# 用户角色关联表
user_role_table = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)

# 角色权限关联表
role_permission_table = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)

# 用户权限关联表（直接为用户分配权限，叠加在角色权限之上）
user_permission_table = Table(
    'user_permissions',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    password_hash = Column(String(255), nullable=False, comment="密码哈希")
    real_name = Column(String(50), nullable=True, comment="真实姓名")
    email = Column(String(100), comment="邮箱")
    phone = Column(String(20), comment="手机号")
    is_active = Column(Boolean, default=True, comment="是否激活")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关联关系
    roles = relationship("Role", secondary=user_role_table, back_populates="users")
    permissions = relationship("Permission", secondary=user_permission_table, back_populates="users")


class Role(Base):
    """角色表"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, comment="角色名称")
    code = Column(String(50), unique=True, nullable=False, comment="角色代码")
    description = Column(String(255), comment="角色描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    
    # 关联关系
    users = relationship("User", secondary=user_role_table, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permission_table, back_populates="roles")


class Permission(Base):
    """权限表"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, comment="权限名称")
    code = Column(String(100), unique=True, nullable=False, comment="权限代码")
    resource = Column(String(50), nullable=False, comment="资源（如：contract, quotation）")
    action = Column(String(50), nullable=False, comment="操作（如：create, approve, reject）")
    description = Column(String(255), comment="权限描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    
    # 关联关系
    roles = relationship("Role", secondary=role_permission_table, back_populates="permissions")
    users = relationship("User", secondary=user_permission_table, back_populates="permissions")


# 注意：UserRole 和 RolePermission 使用 Table 对象定义（见上方）
# 如果将来需要额外字段，可以创建对应的类并定义 __tablename__


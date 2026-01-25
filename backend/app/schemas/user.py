"""
用户管理相关的 Schema
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


class UserCreate(BaseModel):
    """创建用户请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, description="密码")
    real_name: Optional[str] = Field(None, max_length=50, description="真实姓名")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, max_length=20, description="手机号")
    role_codes: List[str] = Field(default_factory=list, description="角色代码列表")
    permission_codes: List[str] = Field(default_factory=list, description="权限代码列表")


class UserUpdate(BaseModel):
    """更新用户请求"""
    real_name: Optional[str] = Field(None, max_length=50, description="真实姓名")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, max_length=20, description="手机号")
    is_active: Optional[bool] = Field(None, description="是否激活")
    role_codes: Optional[List[str]] = Field(None, description="角色代码列表")
    permission_codes: Optional[List[str]] = Field(None, description="权限代码列表")


class UserPasswordUpdate(BaseModel):
    """更新密码请求"""
    password: str = Field(..., min_length=6, description="新密码")


class RoleInfo(BaseModel):
    """角色信息"""
    id: int
    code: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class PermissionInfo(BaseModel):
    """权限信息"""
    id: int
    code: str
    name: str
    resource: str
    action: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class UserDetail(BaseModel):
    """用户详细信息"""
    id: int
    username: str
    real_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    roles: List[RoleInfo] = []
    permissions: List[PermissionInfo] = []

    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    """用户列表项"""
    id: int
    username: str
    real_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    roles: List[str] = []

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """用户列表响应"""
    total: int
    items: List[UserListItem]


class RoleDetail(BaseModel):
    """角色详细信息"""
    id: int
    code: str
    name: str
    description: Optional[str] = None
    permissions: List[PermissionInfo] = []
    created_at: datetime

    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    """角色列表响应"""
    items: List[RoleInfo]


class PermissionListResponse(BaseModel):
    """权限列表响应"""
    items: List[PermissionInfo]


class AssignRolesRequest(BaseModel):
    """分配角色请求"""
    role_codes: List[str] = Field(..., description="角色代码列表")


class AssignPermissionsRequest(BaseModel):
    """分配权限请求（给角色）"""
    permission_codes: List[str] = Field(..., description="权限代码列表")


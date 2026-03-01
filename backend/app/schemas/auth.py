"""
认证相关的 Schema
"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional


class LoginRequest(BaseModel):
    """登录请求"""
    username: str
    password: str


class TokenResponse(BaseModel):
    """Token响应"""
    access_token: str
    token_type: str = "bearer"


class UserInfo(BaseModel):
    """用户信息"""
    id: int
    username: str
    real_name: Optional[str] = None
    email: Optional[str] = None
    roles: List[str] = []
    permissions: List[str] = []  # 权限代码列表

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """登录响应"""
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


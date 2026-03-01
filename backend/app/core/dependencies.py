"""
依赖注入
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.utils.auth import decode_access_token
from typing import List, Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """获取当前登录用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用"
        )
    
    # 确保加载关联关系（角色和权限）
    # SQLAlchemy 会自动延迟加载，但为了确保数据完整，我们可以显式访问
    _ = user.roles  # 触发角色加载
    _ = user.permissions  # 触发权限加载
    
    return user


def require_permission(permission_code: str):
    """权限检查装饰器（工厂函数）"""
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        # 获取用户的所有权限（角色权限 + 直接分配的权限）
        user_permissions = set()
        
        # 从角色获取权限
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.code)
        
        # 从直接分配的权限获取
        for perm in current_user.permissions:
            user_permissions.add(perm.code)
        
        # 检查是否有权限
        if permission_code not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"无权限执行此操作，需要权限: {permission_code}"
            )
        
        return current_user
    
    return permission_checker


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """要求管理员权限"""
    # 检查用户是否有管理员角色
    role_codes = {role.code for role in current_user.roles}
    if "admin" not in role_codes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="此操作需要管理员权限"
        )
    return current_user

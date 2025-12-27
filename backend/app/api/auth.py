"""
认证相关API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo
from app.utils.auth import verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """用户登录"""
    # 查找用户
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 验证密码
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 检查用户是否激活
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用"
        )
    
    # 创建访问令牌
    access_token = create_access_token(data={"sub": user.username})
    
    # 获取用户角色
    role_names = [role.name for role in user.roles]
    
    # 返回响应
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            username=user.username,
            real_name=user.real_name,
            email=user.email,
            roles=role_names
        )
    )


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    role_names = [role.name for role in current_user.roles]
    
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        real_name=current_user.real_name,
        email=current_user.email,
        roles=role_names
    )


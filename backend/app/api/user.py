"""
用户管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_permission
from app.models.user import User, Role, Permission
from app.schemas.user import (
    UserCreate, UserUpdate, UserPasswordUpdate,
    UserDetail, UserListItem, UserListResponse,
    RoleInfo, RoleDetail, RoleListResponse,
    PermissionInfo, PermissionListResponse,
    AssignRolesRequest, AssignPermissionsRequest
)
from app.utils.auth import get_password_hash

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("", response_model=UserListResponse)
async def get_users(
    skip: int = Query(0, ge=0, description="跳过条数"),
    limit: int = Query(100, ge=1, le=1000, description="返回条数"),
    search: Optional[str] = Query(None, description="搜索关键词（用户名、真实姓名）"),
    role_code: Optional[str] = Query(None, description="按角色筛选"),
    is_active: Optional[bool] = Query(None, description="按激活状态筛选"),
    current_user: User = Depends(require_permission("user:view")),
    db: Session = Depends(get_db)
):
    """获取用户列表（需要user:view权限）"""
    query = db.query(User)
    
    # 搜索过滤
    if search:
        query = query.filter(
            (User.username.contains(search)) |
            (User.real_name.contains(search))
        )
    
    # 角色过滤
    if role_code:
        query = query.join(User.roles).filter(Role.code == role_code)
    
    # 激活状态过滤
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # 获取总数
    total = query.count()
    
    # 分页查询
    users = query.offset(skip).limit(limit).all()
    
    items = []
    for user in users:
        items.append(UserListItem(
            id=user.id,
            username=user.username,
            real_name=user.real_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            created_at=user.created_at,
            roles=[role.name for role in user.roles]
        ))
    
    return UserListResponse(total=total, items=items)


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """获取用户详情（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return UserDetail(
        id=user.id,
        username=user.username,
        real_name=user.real_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[RoleInfo(
            id=role.id,
            code=role.code,
            name=role.name,
            description=role.description
        ) for role in user.roles],
        permissions=[PermissionInfo(
            id=perm.id,
            code=perm.code,
            name=perm.name,
            resource=perm.resource,
            action=perm.action,
            description=perm.description
        ) for perm in user.permissions]
    )


@router.post("", response_model=UserDetail, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """创建用户（仅管理员）"""
    # 检查用户名是否已存在
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 创建用户
    new_user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        real_name=user_data.real_name,
        email=user_data.email,
        phone=user_data.phone,
        is_active=True
    )
    db.add(new_user)
    db.flush()
    
    # 分配角色
    if user_data.role_codes:
        roles = db.query(Role).filter(Role.code.in_(user_data.role_codes)).all()
        if len(roles) != len(user_data.role_codes):
            # 检查哪些角色代码不存在
            found_codes = {role.code for role in roles}
            missing_codes = set(user_data.role_codes) - found_codes
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"以下角色不存在: {', '.join(missing_codes)}"
            )
        new_user.roles = roles
    
    # 分配权限
    if user_data.permission_codes:
        permissions = db.query(Permission).filter(Permission.code.in_(user_data.permission_codes)).all()
        if len(permissions) != len(user_data.permission_codes):
            found_codes = {perm.code for perm in permissions}
            missing_codes = set(user_data.permission_codes) - found_codes
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"以下权限不存在: {', '.join(missing_codes)}"
            )
        new_user.permissions = permissions
    
    db.commit()
    db.refresh(new_user)
    
    return UserDetail(
        id=new_user.id,
        username=new_user.username,
        real_name=new_user.real_name,
        email=new_user.email,
        phone=new_user.phone,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at,
        roles=[RoleInfo(
            id=role.id,
            code=role.code,
            name=role.name,
            description=role.description
        ) for role in new_user.roles]
    )


@router.put("/{user_id}", response_model=UserDetail)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """更新用户信息（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 更新基本信息
    if user_data.real_name is not None:
        user.real_name = user_data.real_name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.phone is not None:
        user.phone = user_data.phone
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    # 更新角色
    if user_data.role_codes is not None:
        roles = db.query(Role).filter(Role.code.in_(user_data.role_codes)).all()
        if len(roles) != len(user_data.role_codes):
            found_codes = {role.code for role in roles}
            missing_codes = set(user_data.role_codes) - found_codes
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"以下角色不存在: {', '.join(missing_codes)}"
            )
        user.roles = roles
    
    # 更新权限
    if user_data.permission_codes is not None:
        permissions = db.query(Permission).filter(Permission.code.in_(user_data.permission_codes)).all()
        if len(permissions) != len(user_data.permission_codes):
            found_codes = {perm.code for perm in permissions}
            missing_codes = set(user_data.permission_codes) - found_codes
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"以下权限不存在: {', '.join(missing_codes)}"
            )
        user.permissions = permissions
    
    db.commit()
    db.refresh(user)
    
    return UserDetail(
        id=user.id,
        username=user.username,
        real_name=user.real_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[RoleInfo(
            id=role.id,
            code=role.code,
            name=role.name,
            description=role.description
        ) for role in user.roles],
        permissions=[PermissionInfo(
            id=perm.id,
            code=perm.code,
            name=perm.name,
            resource=perm.resource,
            action=perm.action,
            description=perm.description
        ) for perm in user.permissions]
    )


@router.put("/{user_id}/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_user_password(
    user_id: int,
    password_data: UserPasswordUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """重置用户密码（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    user.password_hash = get_password_hash(password_data.password)
    db.commit()


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """删除用户（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 不能删除自己
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己的账号"
        )
    
    db.delete(user)
    db.commit()


@router.put("/{user_id}/roles", response_model=UserDetail)
async def assign_roles(
    user_id: int,
    roles_data: AssignRolesRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """为用户分配角色（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 查找角色
    roles = db.query(Role).filter(Role.code.in_(roles_data.role_codes)).all()
    if len(roles) != len(roles_data.role_codes):
        found_codes = {role.code for role in roles}
        missing_codes = set(roles_data.role_codes) - found_codes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"以下角色不存在: {', '.join(missing_codes)}"
        )
    
    user.roles = roles
    db.commit()
    db.refresh(user)
    
    return UserDetail(
        id=user.id,
        username=user.username,
        real_name=user.real_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[RoleInfo(
            id=role.id,
            code=role.code,
            name=role.name,
            description=role.description
        ) for role in user.roles],
        permissions=[PermissionInfo(
            id=perm.id,
            code=perm.code,
            name=perm.name,
            resource=perm.resource,
            action=perm.action,
            description=perm.description
        ) for perm in user.permissions]
    )


# 角色管理API
@router.get("/roles/list", response_model=RoleListResponse)
async def get_roles(
    current_user: User = Depends(require_permission("user:view")),
    db: Session = Depends(get_db)
):
    """获取所有角色列表（需要user:view权限）"""
    roles = db.query(Role).all()
    return RoleListResponse(
        items=[RoleInfo(
            id=role.id,
            code=role.code,
            name=role.name,
            description=role.description
        ) for role in roles]
    )


@router.get("/roles/{role_id}", response_model=RoleDetail)
async def get_role(
    role_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """获取角色详情（仅管理员）"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在"
        )
    
    return RoleDetail(
        id=role.id,
        code=role.code,
        name=role.name,
        description=role.description,
        permissions=[PermissionInfo(
            id=perm.id,
            code=perm.code,
            name=perm.name,
            resource=perm.resource,
            action=perm.action,
            description=perm.description
        ) for perm in role.permissions],
        created_at=role.created_at
    )


@router.put("/roles/{role_id}/permissions", response_model=RoleDetail)
async def assign_permissions_to_role(
    role_id: int,
    permissions_data: AssignPermissionsRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """为角色分配权限（仅管理员）"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在"
        )
    
    # 查找权限
    permissions = db.query(Permission).filter(
        Permission.code.in_(permissions_data.permission_codes)
    ).all()
    if len(permissions) != len(permissions_data.permission_codes):
        found_codes = {perm.code for perm in permissions}
        missing_codes = set(permissions_data.permission_codes) - found_codes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"以下权限不存在: {', '.join(missing_codes)}"
        )
    
    role.permissions = permissions
    db.commit()
    db.refresh(role)
    
    return RoleDetail(
        id=role.id,
        code=role.code,
        name=role.name,
        description=role.description,
        permissions=[PermissionInfo(
            id=perm.id,
            code=perm.code,
            name=perm.name,
            resource=perm.resource,
            action=perm.action,
            description=perm.description
        ) for perm in role.permissions],
        created_at=role.created_at
    )


# 权限管理API
@router.get("/permissions/list", response_model=PermissionListResponse)
async def get_permissions(
    current_user: User = Depends(require_permission("user:view")),
    db: Session = Depends(get_db)
):
    """获取所有权限列表（需要user:view权限）"""
    permissions = db.query(Permission).all()
    return PermissionListResponse(
        items=[PermissionInfo(
            id=perm.id,
            code=perm.code,
            name=perm.name,
            resource=perm.resource,
            action=perm.action,
            description=perm.description
        ) for perm in permissions]
    )


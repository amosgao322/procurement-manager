"""
数据库初始化脚本
用于创建表结构和初始化基础数据
"""
from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.models import User, Role, Permission
from app.utils.auth import get_password_hash

# 导入所有模型以确保表被创建
from app.models import (
    User, Role, Permission,
    Supplier, Material,
    BOM, BOMItem,
    Quotation, QuotationItem,
    Contract, ContractTemplate,
    OperationLog
)


def init_database():
    """初始化数据库：创建所有表"""
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成")


def init_base_data(db: Session):
    """初始化基础数据：角色、权限、管理员账户"""
    
    # 1. 创建权限
    permissions_data = [
        # BOM权限
        {"code": "bom:create", "name": "BOM创建", "resource": "bom", "action": "create"},
        {"code": "bom:update", "name": "BOM修改", "resource": "bom", "action": "update"},
        {"code": "bom:delete", "name": "BOM删除", "resource": "bom", "action": "delete"},
        {"code": "bom:view", "name": "BOM查看", "resource": "bom", "action": "view"},
        
        # 供应商权限
        {"code": "supplier:create", "name": "供应商创建", "resource": "supplier", "action": "create"},
        {"code": "supplier:update", "name": "供应商修改", "resource": "supplier", "action": "update"},
        {"code": "supplier:delete", "name": "供应商删除", "resource": "supplier", "action": "delete"},
        {"code": "supplier:view", "name": "供应商查看", "resource": "supplier", "action": "view"},

        # 物料库权限
        {"code": "material:create", "name": "物料创建", "resource": "material", "action": "create"},
        {"code": "material:update", "name": "物料修改", "resource": "material", "action": "update"},
        {"code": "material:delete", "name": "物料删除", "resource": "material", "action": "delete"},
        {"code": "material:view", "name": "物料查看", "resource": "material", "action": "view"},
        {"code": "material:manage_prices", "name": "物料价格维护", "resource": "material", "action": "manage_prices"},
        
        # 报价权限
        {"code": "quotation:create", "name": "报价单创建", "resource": "quotation", "action": "create"},
        {"code": "quotation:update", "name": "报价单修改", "resource": "quotation", "action": "update"},
        {"code": "quotation:delete", "name": "报价单删除", "resource": "quotation", "action": "delete"},
        {"code": "quotation:view", "name": "报价单查看", "resource": "quotation", "action": "view"},
        {"code": "quotation:submit", "name": "报价单提交", "resource": "quotation", "action": "submit"},
        {"code": "quotation:approve", "name": "报价单审批", "resource": "quotation", "action": "approve"},
        {"code": "quotation:reject", "name": "报价单拒绝", "resource": "quotation", "action": "reject"},
        
        # 合同权限
        {"code": "contract:create", "name": "合同创建", "resource": "contract", "action": "create"},
        {"code": "contract:update", "name": "合同修改", "resource": "contract", "action": "update"},
        {"code": "contract:delete", "name": "合同删除", "resource": "contract", "action": "delete"},
        {"code": "contract:view", "name": "合同查看", "resource": "contract", "action": "view"},
        
        # 用户管理权限
        {"code": "user:create", "name": "用户创建", "resource": "user", "action": "create"},
        {"code": "user:update", "name": "用户修改", "resource": "user", "action": "update"},
        {"code": "user:delete", "name": "用户删除", "resource": "user", "action": "delete"},
        {"code": "user:view", "name": "用户查看", "resource": "user", "action": "view"},
        {"code": "user:manage_roles", "name": "用户角色管理", "resource": "user", "action": "manage_roles"},
        {"code": "user:manage_permissions", "name": "用户权限管理", "resource": "user", "action": "manage_permissions"},
    ]
    
    for perm_data in permissions_data:
        existing = db.query(Permission).filter(Permission.code == perm_data["code"]).first()
        if not existing:
            permission = Permission(**perm_data)
            db.add(permission)
    
    db.commit()
    print("权限数据初始化完成")
    
    # 2. 创建角色
    roles_data = [
        {
            "code": "admin",
            "name": "管理员",
            "description": "系统管理员，拥有所有权限，可以创建和管理用户账号",
            "permissions": [p["code"] for p in permissions_data]
        },
        {
            "code": "purchaser",
            "name": "采购员",
            "description": "采购人员，可以创建BOM、报价单、合同",
            "permissions": [
                "bom:create", "bom:update", "bom:view",
                "supplier:create", "supplier:update", "supplier:view",
                "material:create", "material:update", "material:view", "material:manage_prices",
                "quotation:create", "quotation:update", "quotation:view", "quotation:submit",
                "contract:create", "contract:update", "contract:view"
            ]
        },
        {
            "code": "technician",
            "name": "技术员",
            "description": "技术人员，可以创建和管理BOM",
            "permissions": [
                "bom:create", "bom:update", "bom:view",
                "supplier:view",
                "material:view",
                "quotation:view",
                "contract:view"
            ]
        }
    ]
    
    for role_data in roles_data:
        existing = db.query(Role).filter(Role.code == role_data["code"]).first()
        if existing:
            role = existing
        else:
            role = Role(
                code=role_data["code"],
                name=role_data["name"],
                description=role_data["description"]
            )
            db.add(role)
            db.flush()
        
        # 分配权限
        for perm_code in role_data["permissions"]:
            permission = db.query(Permission).filter(Permission.code == perm_code).first()
            if permission and permission not in role.permissions:
                role.permissions.append(permission)
    
    db.commit()
    print("角色数据初始化完成")
    
    # 3. 创建默认管理员账户
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            password_hash=get_password_hash("admin123"),  # 默认密码，首次登录后应修改
            real_name="系统管理员",
            email="admin@example.com",
            is_active=True
        )
        db.add(admin_user)
        db.flush()
        
        # 分配管理员角色
        admin_role = db.query(Role).filter(Role.code == "admin").first()
        if admin_role:
            admin_user.roles.append(admin_role)
        
        db.commit()
        print("管理员账户创建完成 (用户名: admin, 密码: admin123)")
    else:
        print("管理员账户已存在")


if __name__ == "__main__":
    import sys
    from pathlib import Path
    
    # 添加 backend 目录到 Python 路径
    backend_dir = Path(__file__).parent.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from app.core.database import SessionLocal
    
    print("开始初始化数据库...")
    init_database()
    
    db = SessionLocal()
    try:
        init_base_data(db)
        print("数据库初始化完成！")
    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


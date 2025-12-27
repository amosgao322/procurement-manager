"""
密码哈希格式迁移脚本
将数据库中 passlib 格式的密码哈希转换为纯 bcrypt 格式（可选）
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.utils.auth import verify_password, get_password_hash


def migrate_user_password(db: Session, user: User, new_password: str = None):
    """
    迁移单个用户的密码哈希格式
    
    Args:
        db: 数据库会话
        user: 用户对象
        new_password: 新密码（如果提供，将使用新密码；否则保持原密码不变）
    """
    if new_password:
        # 使用新密码
        user.password_hash = get_password_hash(new_password)
        db.commit()
        print(f"用户 {user.username} 的密码已更新为新格式")
    else:
        # 保持原密码，但需要验证旧格式是否仍然可用
        # 这里只是检查，不实际修改
        print(f"用户 {user.username} 的密码格式保持不变（兼容模式）")


def check_password_formats(db: Session):
    """检查数据库中所有用户的密码哈希格式"""
    users = db.query(User).all()
    passlib_format = 0
    bcrypt_format = 0
    
    for user in users:
        if user.password_hash.startswith('$2'):
            # passlib 格式
            passlib_format += 1
        else:
            bcrypt_format += 1
    
    print(f"数据库中共有 {len(users)} 个用户")
    print(f"  - Passlib 格式: {passlib_format}")
    print(f"  - Bcrypt 格式: {bcrypt_format}")


def reset_admin_password(db: Session, new_password: str = "admin123"):
    """重置管理员密码"""
    admin = db.query(User).filter(User.username == "admin").first()
    if admin:
        admin.password_hash = get_password_hash(new_password)
        db.commit()
        print(f"管理员密码已重置为: {new_password}")
    else:
        print("未找到管理员用户")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        print("=" * 50)
        print("密码格式检查")
        print("=" * 50)
        check_password_formats(db)
        
        print("\n" + "=" * 50)
        print("重置管理员密码（可选）")
        print("=" * 50)
        # 取消下面的注释来重置管理员密码
        # reset_admin_password(db, "admin123")
        
    finally:
        db.close()


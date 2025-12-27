"""
认证工具
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码（兼容 passlib 格式和纯 bcrypt 格式）"""
    try:
        # 确保密码是字节类型
        if isinstance(plain_password, str):
            plain_password = plain_password.encode('utf-8')
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        
        # 检查是否是 passlib 格式（以 $2a$, $2b$, $2y$ 开头）
        if hashed_password.startswith(b'$2'):
            # passlib 格式：$2b$12$salt+hash
            # 直接使用 bcrypt 验证（bcrypt 可以验证 passlib 格式）
            return bcrypt.checkpw(plain_password, hashed_password)
        else:
            # 纯 bcrypt 格式
            return bcrypt.checkpw(plain_password, hashed_password)
    except Exception as e:
        # 如果验证失败，尝试使用 passlib（向后兼容）
        try:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            if isinstance(plain_password, bytes):
                plain_password = plain_password.decode('utf-8')
            if isinstance(hashed_password, bytes):
                hashed_password = hashed_password.decode('utf-8')
            return pwd_context.verify(plain_password, hashed_password)
        except:
            return False


def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    # 直接使用 bcrypt 库
    if not isinstance(password, str):
        password = str(password)
    # 生成 salt 并哈希密码
    salt = bcrypt.gensalt()
    password_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(password_bytes, salt)
    # 返回字符串格式（passlib 兼容格式）
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """解码访问令牌"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


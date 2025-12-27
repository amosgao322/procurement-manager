"""
供应商相关的 Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SupplierBase(BaseModel):
    """供应商基础模型"""
    code: str
    name: str
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    credit_rating: Optional[str] = None
    remark: Optional[str] = None


class SupplierCreate(SupplierBase):
    """创建供应商"""
    pass


class SupplierUpdate(BaseModel):
    """更新供应商"""
    name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    credit_rating: Optional[str] = None
    remark: Optional[str] = None
    is_active: Optional[bool] = None


class Supplier(SupplierBase):
    """供应商响应"""
    id: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SupplierListResponse(BaseModel):
    """供应商列表响应"""
    items: list[Supplier]
    total: int


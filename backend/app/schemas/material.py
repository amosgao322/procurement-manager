"""
物料相关 Schema
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class MaterialBase(BaseModel):
    code: Optional[str] = None
    name: str
    specification: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None

    # legacy
    standard_price: Optional[str] = None

    price_status: Optional[str] = "pending"  # pending/valid/expired/abnormal
    status_reason: Optional[str] = None
    currency: Optional[str] = "CNY"
    last_price: Optional[Decimal] = None

    remark: Optional[str] = None
    source: Optional[str] = None  # 来源（如：报价单对应的供应商名称）
    is_active: Optional[bool] = True


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    standard_price: Optional[str] = None
    price_status: Optional[str] = None
    status_reason: Optional[str] = None
    currency: Optional[str] = None
    last_price: Optional[Decimal] = None
    remark: Optional[str] = None
    source: Optional[str] = None
    is_active: Optional[bool] = None
    updated_by: Optional[int] = None


class Material(MaterialBase):
    id: int
    material_type: Optional[str] = None  # 物料类型：unknown(未知)、manual(手动录入)、quotation(报价单录入)
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MaterialListResponse(BaseModel):
    items: List[Material]
    total: int
    page: int
    page_size: int



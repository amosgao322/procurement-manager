"""
合同相关的 Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ContractBase(BaseModel):
    """合同基础模型"""
    code: str
    title: str
    supplier_id: int
    quotation_id: Optional[int] = None
    bom_id: Optional[int] = None
    contract_type: Optional[str] = None
    sign_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_amount: Optional[Decimal] = None
    currency: Optional[str] = "CNY"
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    status: Optional[str] = "draft"
    remark: Optional[str] = None


class ContractCreate(ContractBase):
    """创建合同"""
    pass


class ContractUpdate(BaseModel):
    """更新合同"""
    title: Optional[str] = None
    contract_type: Optional[str] = None
    sign_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_amount: Optional[Decimal] = None
    currency: Optional[str] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None


class Contract(ContractBase):
    """合同响应"""
    id: int
    file_path: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ContractListResponse(BaseModel):
    """合同列表响应"""
    items: list[Contract]
    total: int


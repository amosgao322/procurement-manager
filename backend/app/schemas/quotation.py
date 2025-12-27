"""
报价相关的 Schema
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class QuotationItemBase(BaseModel):
    """报价明细基础模型"""
    sequence: Optional[str] = None
    material_name: str
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    total_price: Optional[Decimal] = None
    brand: Optional[str] = None
    delivery_days: Optional[int] = None
    remark: Optional[str] = None


class QuotationItemCreate(QuotationItemBase):
    """创建报价明细"""
    pass


class QuotationItem(QuotationItemBase):
    """报价明细响应"""
    id: int
    quotation_id: int
    
    class Config:
        from_attributes = True


class QuotationBase(BaseModel):
    """报价基础模型"""
    code: str
    supplier_id: int
    bom_id: Optional[int] = None
    title: str
    quotation_date: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    currency: Optional[str] = "CNY"
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    delivery_days: Optional[int] = None
    remark: Optional[str] = None


class QuotationCreate(QuotationBase):
    """创建报价单"""
    items: List[QuotationItemCreate] = []


class QuotationUpdate(BaseModel):
    """更新报价单"""
    title: Optional[str] = None
    quotation_date: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    currency: Optional[str] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    delivery_days: Optional[int] = None
    remark: Optional[str] = None
    items: Optional[List[QuotationItemCreate]] = None


class ApprovalRequest(BaseModel):
    """审批请求"""
    comment: Optional[str] = None


class BomSimple(BaseModel):
    """BOM简单信息"""
    id: int
    code: str
    name: str
    
    class Config:
        from_attributes = True


class SupplierSimple(BaseModel):
    """供应商简单信息"""
    id: int
    code: str
    name: str
    
    class Config:
        from_attributes = True


class Quotation(QuotationBase):
    """报价单响应"""
    id: int
    status: str
    total_amount: Optional[Decimal] = None
    approval_comment: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[QuotationItem] = []
    bom: Optional[BomSimple] = None
    supplier: Optional[SupplierSimple] = None
    
    class Config:
        from_attributes = True


class QuotationListResponse(BaseModel):
    """报价单列表响应"""
    items: List[Quotation]
    total: int
    page: int
    page_size: int

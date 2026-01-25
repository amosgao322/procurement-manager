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
    code: Optional[str] = None  # 编码可选，为空时自动生成
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


# ========== 询比价对比相关 Schema ==========

class QuotationBasicInfo(BaseModel):
    """报价单基本信息（用于对比）"""
    id: int
    code: str
    supplier_id: int
    supplier_name: str
    supplier_code: Optional[str] = None
    credit_rating: Optional[str] = None  # 供应商信用等级
    total_amount: Optional[Decimal] = None
    status: str
    quotation_date: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    delivery_days: Optional[int] = None
    delivery_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    currency: Optional[str] = "CNY"
    
    class Config:
        from_attributes = True


class ComparisonItemCell(BaseModel):
    """明细项对比单元格"""
    quotation_id: int
    quotation_code: str
    supplier_name: str
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    brand: Optional[str] = None
    delivery_days: Optional[int] = None
    remark: Optional[str] = None
    matched: bool = True  # 是否匹配到BOM物料


class ComparisonItemRow(BaseModel):
    """明细项对比行"""
    bom_item_id: int
    sequence: Optional[str] = None
    material_name: str
    specification: Optional[str] = None
    unit: Optional[str] = None
    bom_quantity: Decimal
    cells: List[ComparisonItemCell]  # 每个报价单的对比数据


class QuotationComparisonResponse(BaseModel):
    """报价单对比响应"""
    bom_id: int
    bom_code: str
    bom_name: str
    quotations: List[QuotationBasicInfo]  # 参与对比的报价单基本信息
    item_rows: List[ComparisonItemRow]  # 明细项对比行
    unmatched_quotations: dict  # 未匹配的报价单物料 {quotation_id: [items]}
    best_markers: dict  # 最优标记信息
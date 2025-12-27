"""
BOM相关的 Schema
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class BOMItemBase(BaseModel):
    """BOM明细基础模型"""
    sequence: Optional[str] = None
    material_name: str
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: Decimal
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None
    remark: Optional[str] = None


class BOMItemCreate(BOMItemBase):
    """创建BOM明细"""
    pass


class BOMItem(BOMItemBase):
    """BOM明细响应"""
    id: int
    bom_id: int
    
    class Config:
        from_attributes = True


class BOMBase(BaseModel):
    """BOM基础模型"""
    code: str
    name: str
    product_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "draft"
    remark: Optional[str] = None


class BOMCreate(BOMBase):
    """创建BOM"""
    items: List[BOMItemCreate] = []


class BOMUpdate(BaseModel):
    """更新BOM"""
    name: Optional[str] = None
    product_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None
    items: Optional[List[BOMItemCreate]] = None


class BOM(BOMBase):
    """BOM响应"""
    id: int
    total_amount: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[BOMItem] = []
    
    class Config:
        from_attributes = True


class BOMListResponse(BaseModel):
    """BOM列表响应"""
    items: List[BOM]
    total: int
    page: int
    page_size: int


class ExcelImportError(BaseModel):
    """Excel导入错误"""
    row: int
    field: str
    message: str


class ExcelImportResponse(BaseModel):
    """Excel导入响应"""
    success: bool
    bom_id: Optional[int] = None
    bom_code: Optional[str] = None
    bom_name: Optional[str] = None
    items_count: int = 0
    errors: List[ExcelImportError] = []
    error_count: int = 0


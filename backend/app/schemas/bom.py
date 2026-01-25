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
    material_category: Optional[str] = None
    material_grade: Optional[str] = None
    unit_weight: Optional[Decimal] = None
    total_weight: Optional[Decimal] = None
    brand_manufacturer: Optional[str] = None
    standard_number: Optional[str] = None
    surface_treatment: Optional[str] = None


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
    status: Optional[str] = "草稿"
    remark: Optional[str] = None
    customer_name: Optional[str] = None
    date: Optional[datetime] = None
    version: Optional[str] = None
    sales_channel: Optional[str] = None
    prepared_by: Optional[str] = None
    pricing_reviewer: Optional[str] = None


class BOMCreate(BOMBase):
    """创建BOM"""
    code: Optional[str] = None  # 创建时可选，如果为空则自动生成
    items: List[BOMItemCreate] = []


class BOMUpdate(BaseModel):
    """更新BOM"""
    name: Optional[str] = None
    product_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None
    customer_name: Optional[str] = None
    date: Optional[datetime] = None
    version: Optional[str] = None
    sales_channel: Optional[str] = None
    prepared_by: Optional[str] = None
    pricing_reviewer: Optional[str] = None
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


class PriceStatistics(BaseModel):
    """价格统计信息"""
    average: Decimal
    max: Decimal
    min: Decimal
    count: int
    latest_price: Optional[Decimal] = None
    latest_date: Optional[datetime] = None


class MaterialMatchInfo(BaseModel):
    """物料匹配信息"""
    material_id: int
    material_code: str
    material_name: str
    specification: Optional[str] = None
    matched: bool = True


class BOMItemPriceHistoryItem(BaseModel):
    """BOM明细项当前价格记录"""
    id: int
    unit_price: Decimal
    currency: str
    source: str
    material_type: Optional[str] = None  # 物料类型：unknown/manual/quotation
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    quotation_id: Optional[int] = None
    quotation_code: Optional[str] = None
    material_code: Optional[str] = None
    price_status: Optional[str] = None  # 物料价格状态：pending/valid/expired/abnormal
    status_note: Optional[str] = None  # 状态备注（用于标注是否纳入成本核算）
    quantity: Optional[Decimal] = None
    captured_at: Optional[datetime] = None


class BOMItemPriceHistoryResponse(BaseModel):
    """BOM明细项当前价格响应"""
    item_id: int
    material_name: str
    specification: Optional[str] = None
    material_match: Optional[MaterialMatchInfo] = None
    price_history: List[BOMItemPriceHistoryItem] = []
    statistics: Optional[PriceStatistics] = None


class BOMItemCostInfo(BaseModel):
    """BOM明细项成本信息"""
    item_id: int
    sequence: Optional[str] = None
    material_name: str
    specification: Optional[str] = None
    quantity: Decimal
    unit: Optional[str] = None
    matched: bool
    material_id: Optional[int] = None
    cost_price: Optional[Decimal] = None  # 成本价（历史价格平均值）
    cost_total: Optional[Decimal] = None  # 成本小计（数量 × 成本价）
    price_history_count: int = 0
    match_status: str  # "已匹配" 或 "未匹配"


class PriceSourceStat(BaseModel):
    """价格来源统计"""
    source_type: str  # manual/quotation/unknown
    count: Decimal
    total_amount: Decimal
    percentage: Decimal  # 成本占比 (0-100)


class BOMCostAnalysisResponse(BaseModel):
    """BOM成本分析响应"""
    bom_id: int
    bom_code: str
    bom_name: str
    total_cost: Decimal  # 总成本价
    items_count: int  # 明细项总数
    matched_count: int  # 已匹配物料数
    unmatched_count: int  # 未匹配物料数
    items: List[BOMItemCostInfo] = []
    total_price_history_count: int = 0  # 总历史价格记录数
    price_source_stats: List[PriceSourceStat] = []  # 价格来源统计
    unmatched_items: List[BOMItemCostInfo] = []  # 未匹配物料清单
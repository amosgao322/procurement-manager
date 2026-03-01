"""
合同模板相关的 Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ContractTemplateBase(BaseModel):
    """合同模板基础模型"""
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True


class ContractTemplateCreate(ContractTemplateBase):
    """创建合同模板"""
    pass


class ContractTemplateUpdate(BaseModel):
    """更新合同模板"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ContractTemplate(ContractTemplateBase):
    """合同模板响应"""
    id: int
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ContractTemplateListResponse(BaseModel):
    """合同模板列表响应"""
    items: list[ContractTemplate]
    total: int


class GenerateContractRequest(BaseModel):
    """生成合同请求"""
    quotation_id: int
    template_id: int
    contract_code: str
    contract_title: Optional[str] = None
    sign_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


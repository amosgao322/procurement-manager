"""
数据库模型
"""
from app.models.user import User, Role, Permission
from app.models.supplier import Supplier
from app.models.material import Material
from app.models.bom import BOM, BOMItem
from app.models.quotation import Quotation, QuotationItem
from app.models.contract import Contract
from app.models.contract_template import ContractTemplate
from app.models.log import OperationLog

__all__ = [
    "User", "Role", "Permission",
    "Supplier",
    "Material",
    "BOM", "BOMItem",
    "Quotation", "QuotationItem",
    "Contract",
    "ContractTemplate",
    "OperationLog"
]


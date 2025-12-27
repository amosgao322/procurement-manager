"""
合同管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from pathlib import Path
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.contract import Contract
from app.models.contract_template import ContractTemplate
from app.models.quotation import Quotation, QuotationItem
from app.models.supplier import Supplier
from app.schemas.contract import ContractCreate, ContractUpdate, Contract as ContractSchema, ContractListResponse
from app.schemas.contract_template import GenerateContractRequest
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.contract_template import ContractTemplateProcessor

router = APIRouter(prefix="/contracts", tags=["合同管理"])


@router.get("", response_model=ContractListResponse)
async def get_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取合同列表"""
    query = db.query(Contract)
    
    # 搜索
    if keyword:
        query = query.filter(Contract.code.like(f"%{keyword}%"))
    
    # 总数
    total = query.count()
    
    # 分页
    contracts = query.order_by(Contract.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return ContractListResponse(
        items=contracts,
        total=total
    )


@router.get("/{contract_id}", response_model=ContractSchema)
async def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取合同详情"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    return contract


@router.post("", response_model=ContractSchema)
async def create_contract(
    contract_data: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建合同"""
    # 检查编码是否已存在
    existing = db.query(Contract).filter(Contract.code == contract_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="合同编码已存在")
    
    contract = Contract(
        code=contract_data.code,
        title=contract_data.title,
        supplier_id=contract_data.supplier_id,
        quotation_id=contract_data.quotation_id,
        bom_id=contract_data.bom_id,
        contract_type=contract_data.contract_type,
        sign_date=contract_data.sign_date,
        start_date=contract_data.start_date,
        end_date=contract_data.end_date,
        total_amount=contract_data.total_amount,
        currency=contract_data.currency,
        payment_terms=contract_data.payment_terms,
        delivery_terms=contract_data.delivery_terms,
        status=contract_data.status,
        remark=contract_data.remark,
        created_by=current_user.id
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.put("/{contract_id}", response_model=ContractSchema)
async def update_contract(
    contract_id: int,
    contract_data: ContractUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新合同"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    
    # 更新字段
    update_data = contract_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)
    
    db.commit()
    db.refresh(contract)
    return contract


@router.post("/generate", response_model=ContractSchema)
async def generate_contract(
    request: GenerateContractRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """根据报价单和模板生成合同"""
    # 获取报价单
    quotation = db.query(Quotation).options(
        joinedload(Quotation.supplier),
        joinedload(Quotation.bom),
        joinedload(Quotation.items)
    ).filter(Quotation.id == request.quotation_id).first()
    
    if not quotation:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    # 检查报价单状态
    if quotation.status != "approved":
        raise HTTPException(status_code=400, detail="只有已审批通过的报价单才能生成合同")
    
    # 获取模板
    template = db.query(ContractTemplate).filter(ContractTemplate.id == request.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="合同模板不存在")
    
    if not template.is_active:
        raise HTTPException(status_code=400, detail="合同模板已禁用")
    
    # 检查模板文件是否存在
    if not Path(template.file_path).exists():
        raise HTTPException(status_code=404, detail="模板文件不存在")
    
    # 准备填充数据
    supplier = quotation.supplier
    items_data = []
    for item in quotation.items:
        items_data.append({
            'sequence': item.sequence or '',
            'material_name': item.material_name,
            'specification': item.specification or '',
            'unit': item.unit or '',
            'quantity': float(item.quantity) if item.quantity else 0,
            'unit_price': float(item.unit_price) if item.unit_price else 0,
            'total_price': float(item.total_price) if item.total_price else 0,
        })
    
    data = {
        'supplier_name': supplier.name if supplier else '',
        'supplier_code': supplier.code if supplier else '',
        'supplier_contact': supplier.contact_person if supplier else '',
        'supplier_phone': supplier.contact_phone if supplier else '',
        'supplier_email': supplier.contact_email if supplier else '',
        'supplier_address': supplier.address if supplier else '',
        'supplier_tax_id': supplier.tax_id if supplier else '',
        'supplier_bank_name': supplier.bank_name if supplier else '',
        'supplier_bank_account': supplier.bank_account if supplier else '',
        'quotation_code': quotation.code,
        'quotation_title': quotation.title,
        'quotation_date': quotation.quotation_date,
        'quotation_valid_until': quotation.valid_until,
        'total_amount': float(quotation.total_amount) if quotation.total_amount else 0,
        'currency': quotation.currency or 'CNY',
        'payment_terms': quotation.payment_terms or '',
        'delivery_terms': quotation.delivery_terms or '',
        'delivery_days': quotation.delivery_days or '',
        'contract_code': request.contract_code,
        'contract_title': request.contract_title or quotation.title,
        'sign_date': request.sign_date,
        'start_date': request.start_date,
        'end_date': request.end_date,
        'items': items_data,
    }
    
    # 生成合同文档
    contract_dir = Path("uploads/contracts")
    contract_dir.mkdir(parents=True, exist_ok=True)
    
    output_filename = f"{request.contract_code}_{int(datetime.now().timestamp())}.docx"
    output_path = contract_dir / output_filename
    
    try:
        ContractTemplateProcessor.generate_contract(
            template_path=template.file_path,
            output_path=str(output_path),
            data=data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成合同文档失败: {str(e)}")
    
    # 创建合同记录
    contract = Contract(
        code=request.contract_code,
        title=request.contract_title or quotation.title,
        supplier_id=quotation.supplier_id,
        quotation_id=quotation.id,
        bom_id=quotation.bom_id,
        contract_type=None,
        sign_date=request.sign_date,
        start_date=request.start_date,
        end_date=request.end_date,
        total_amount=quotation.total_amount,
        currency=quotation.currency or 'CNY',
        payment_terms=quotation.payment_terms,
        delivery_terms=quotation.delivery_terms,
        status='draft',
        file_path=str(output_path),
        remark=None,
        created_by=current_user.id
    )
    
    db.add(contract)
    db.commit()
    db.refresh(contract)
    
    return contract


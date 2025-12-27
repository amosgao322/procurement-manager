"""
供应商管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.core.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, Supplier as SupplierSchema, SupplierListResponse
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/suppliers", tags=["供应商管理"])


@router.get("", response_model=SupplierListResponse)
async def get_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取供应商列表"""
    query = db.query(Supplier)
    
    # 搜索
    if keyword:
        query = query.filter(
            or_(
                Supplier.code.like(f"%{keyword}%"),
                Supplier.name.like(f"%{keyword}%")
            )
        )
    
    # 总数
    total = query.count()
    
    # 分页
    suppliers = query.order_by(Supplier.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return SupplierListResponse(
        items=suppliers,
        total=total
    )


@router.get("/{supplier_id}", response_model=SupplierSchema)
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取供应商详情"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    return supplier


@router.post("", response_model=SupplierSchema)
async def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建供应商"""
    # 检查编码是否已存在
    existing = db.query(Supplier).filter(Supplier.code == supplier_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="供应商编码已存在")
    
    supplier = Supplier(
        code=supplier_data.code,
        name=supplier_data.name,
        contact_person=supplier_data.contact_person,
        contact_phone=supplier_data.contact_phone,
        contact_email=supplier_data.contact_email,
        address=supplier_data.address,
        tax_id=supplier_data.tax_id,
        bank_name=supplier_data.bank_name,
        bank_account=supplier_data.bank_account,
        credit_rating=supplier_data.credit_rating,
        remark=supplier_data.remark,
        created_by=current_user.id
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.put("/{supplier_id}", response_model=SupplierSchema)
async def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新供应商"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    
    # 更新字段
    update_data = supplier_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除供应商"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    
    db.delete(supplier)
    db.commit()
    return {"message": "删除成功"}


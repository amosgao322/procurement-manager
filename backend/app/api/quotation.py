"""
报价管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from app.core.database import get_db
from app.models.quotation import Quotation, QuotationItem
from app.models.supplier import Supplier
from app.models.bom import BOM
from app.schemas.quotation import QuotationCreate, QuotationUpdate, Quotation as QuotationSchema, QuotationListResponse, ApprovalRequest, QuotationBasicInfo
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.services.material_ingest import ingest_quotation_items_to_materials, update_material_status_by_quotation

router = APIRouter(prefix="/quotations", tags=["报价管理"])


def generate_quotation_code(db: Session) -> str:
    """
    自动生成报价单编码
    格式：Q + 日期(YYYYMMDD) + 序号(001, 002...)
    例如：Q20250101-001
    """
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"Q{today}"
    
    # 查询今天已生成的报价单（编码格式为 Q日期-序号）
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_quotations = db.query(Quotation).filter(
        Quotation.code.like(f"{prefix}-%"),
        Quotation.created_at >= today_start
    ).all()
    
    # 提取已有的序号
    existing_sequences = []
    for q in today_quotations:
        try:
            # 编码格式：Q20250101-001，提取序号部分
            if q.code.startswith(prefix + "-"):
                seq_str = q.code[len(prefix) + 1:]
                seq = int(seq_str)
                existing_sequences.append(seq)
        except (ValueError, IndexError):
            continue
    
    # 生成序号（从001开始，找到第一个未使用的序号）
    sequence = 1
    while sequence in existing_sequences:
        sequence += 1
    
    code = f"{prefix}-{sequence:03d}"
    
    # 双重检查：确保编码唯一（防止并发情况）
    while db.query(Quotation).filter(Quotation.code == code).first():
        sequence += 1
        code = f"{prefix}-{sequence:03d}"
    
    return code


@router.get("", response_model=QuotationListResponse)
async def get_quotations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    title: Optional[str] = None,
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
    status_in: Optional[str] = None,  # 支持多个状态，用逗号分隔，如 "approved,rejected"
    created_at_start: Optional[str] = None,
    created_at_end: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取报价单列表"""
    query = db.query(Quotation).options(
        joinedload(Quotation.supplier),
        joinedload(Quotation.bom),
        joinedload(Quotation.items)
    )
    
    # 搜索 - 关键字搜索编码
    if keyword:
        query = query.filter(Quotation.code.like(f"%{keyword}%"))
    
    # 标题搜索
    if title:
        query = query.filter(Quotation.title.like(f"%{title}%"))
    
    # 供应商筛选
    if supplier_id:
        query = query.filter(Quotation.supplier_id == supplier_id)
    
    # 状态筛选
    if status:
        query = query.filter(Quotation.status == status)
    elif status_in:
        # 支持多个状态筛选
        status_list = [s.strip() for s in status_in.split(',')]
        from sqlalchemy import or_
        query = query.filter(or_(*[Quotation.status == s for s in status_list]))
    
    # 创建时间范围筛选
    if created_at_start:
        try:
            start_date = datetime.fromisoformat(created_at_start.replace('Z', '+00:00'))
            query = query.filter(Quotation.created_at >= start_date)
        except ValueError:
            pass
    if created_at_end:
        try:
            end_date = datetime.fromisoformat(created_at_end.replace('Z', '+00:00'))
            query = query.filter(Quotation.created_at <= end_date)
        except ValueError:
            pass
    
    # 总数
    total = query.count()
    
    # 分页
    quotations = query.order_by(Quotation.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return QuotationListResponse(
        items=quotations,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{quotation_id}", response_model=QuotationSchema)
async def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取报价单详情"""
    quotation = db.query(Quotation).options(
        joinedload(Quotation.supplier),
        joinedload(Quotation.bom),
        joinedload(Quotation.items)
    ).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    # 直接返回，Pydantic 会自动处理关联数据
    return quotation


@router.post("", response_model=QuotationSchema)
async def create_quotation(
    quotation_data: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建报价单"""
    # 如果编码为空，自动生成
    code = quotation_data.code
    if not code or code.strip() == "":
        code = generate_quotation_code(db)
    
    # 检查编码是否已存在
    existing = db.query(Quotation).filter(Quotation.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="报价单编码已存在")
    
    # 创建报价单
    quotation = Quotation(
        code=code,
        supplier_id=quotation_data.supplier_id,
        bom_id=quotation_data.bom_id,
        title=quotation_data.title,
        quotation_date=quotation_data.quotation_date,
        valid_until=quotation_data.valid_until,
        currency=quotation_data.currency,
        payment_terms=quotation_data.payment_terms,
        delivery_terms=quotation_data.delivery_terms,
        delivery_days=quotation_data.delivery_days,
        status="draft",
        remark=quotation_data.remark,
        created_by=current_user.id
    )
    db.add(quotation)
    db.flush()
    
    # 创建明细
    total_amount = Decimal("0")
    for item_data in quotation_data.items:
        total_price = item_data.quantity * item_data.unit_price
        total_amount += total_price
        item = QuotationItem(
            quotation_id=quotation.id,
            sequence=item_data.sequence,
            material_name=item_data.material_name,
            specification=item_data.specification,
            unit=item_data.unit,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=total_price,
            brand=item_data.brand,
            delivery_days=item_data.delivery_days,
            remark=item_data.remark
        )
        db.add(item)
    
    quotation.total_amount = total_amount

    # 先 flush 确保 quotation_items 拿到 id，再自动入库（同一事务）
    db.flush()
    ingest_quotation_items_to_materials(db, quotation.id)

    db.commit()
    db.refresh(quotation)
    return quotation


@router.put("/{quotation_id}", response_model=QuotationSchema)
async def update_quotation(
    quotation_id: int,
    quotation_data: QuotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新报价单"""
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    # 只有草稿状态才能编辑
    if quotation.status != "draft":
        raise HTTPException(status_code=400, detail="只有草稿状态的报价单才能编辑")
    
    # 更新字段
    update_data = quotation_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != 'items':
            setattr(quotation, field, value)
    
    # 更新明细
    if quotation_data.items is not None:
        # 删除旧明细
        db.query(QuotationItem).filter(QuotationItem.quotation_id == quotation_id).delete()
        
        # 添加新明细
        total_amount = Decimal("0")
        for item_data in quotation_data.items:
            total_price = item_data.quantity * item_data.unit_price
            total_amount += total_price
            item = QuotationItem(
                quotation_id=quotation.id,
                sequence=item_data.sequence,
                material_name=item_data.material_name,
                specification=item_data.specification,
                unit=item_data.unit,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=total_price,
                brand=item_data.brand,
                delivery_days=item_data.delivery_days,
                remark=item_data.remark
            )
            db.add(item)
        
        quotation.total_amount = total_amount
    
    db.commit()
    db.refresh(quotation)
    return quotation


@router.post("/{quotation_id}/submit", response_model=QuotationSchema)
async def submit_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """提交报价单"""
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    if quotation.status != "draft":
        raise HTTPException(status_code=400, detail="只有草稿状态的报价单才能提交")
    
    quotation.status = "submitted"
    db.commit()
    db.refresh(quotation)
    return quotation


@router.post("/{quotation_id}/approve", response_model=QuotationSchema)
async def approve_quotation(
    quotation_id: int,
    approval_data: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """审批通过报价单"""
    import traceback
    import sys
    
    try:
        print(f"\n[APPROVE] 开始审批: quotation_id={quotation_id}", flush=True)
        
        quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
        if not quotation:
            raise HTTPException(status_code=404, detail="报价单不存在")
        
        print(f"[APPROVE] 当前状态: {quotation.status}", flush=True)
        
        if quotation.status != "submitted":
            raise HTTPException(status_code=400, detail="只有已提交状态的报价单才能审批")
        
        from datetime import datetime, timezone
        quotation.status = "approved"
        quotation.approval_comment = approval_data.comment
        quotation.approved_by = current_user.id
        quotation.approved_at = datetime.now(timezone.utc)

        # 审批通过：关联物料价格状态变为有效
        update_material_status_by_quotation(
            db,
            quotation_id=quotation_id,
            new_status="valid",
            reason=f"由报价单{quotation.code}审批通过自动置为有效",
        )
        
        print(f"[APPROVE] 准备提交数据库", flush=True)
        db.commit()
        print(f"[APPROVE] 数据库提交成功", flush=True)
        
        db.refresh(quotation)
        print(f"[APPROVE] 刷新成功", flush=True)
        
        # 重新加载关联数据以正确序列化
        print(f"[APPROVE] 开始加载关联数据", flush=True)
        quotation = db.query(Quotation).options(
            joinedload(Quotation.supplier),
            joinedload(Quotation.bom),
            joinedload(Quotation.items)
        ).filter(Quotation.id == quotation_id).first()
        print(f"[APPROVE] 关联数据加载成功", flush=True)
        
        print(f"[APPROVE] 准备返回数据", flush=True)
        return quotation
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"""
{'='*80}
【审批接口错误】
路径: POST /quotations/{quotation_id}/approve
错误类型: {type(e).__name__}
错误消息: {str(e)}
堆栈跟踪:
{traceback.format_exc()}
{'='*80}
"""
        print(error_msg, flush=True)
        print(error_msg, file=sys.stderr, flush=True)
        traceback.print_exc()
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"审批失败: {str(e)}")


@router.post("/{quotation_id}/reject", response_model=QuotationSchema)
async def reject_quotation(
    quotation_id: int,
    approval_data: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """拒绝报价单"""
    import traceback
    import sys
    
    try:
        print(f"\n[REJECT] 开始拒绝: quotation_id={quotation_id}", flush=True)
        
        quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
        if not quotation:
            raise HTTPException(status_code=404, detail="报价单不存在")
        
        print(f"[REJECT] 当前状态: {quotation.status}", flush=True)
        
        if quotation.status != "submitted":
            raise HTTPException(status_code=400, detail="只有已提交状态的报价单才能拒绝")
        
        from datetime import datetime, timezone
        quotation.status = "rejected"
        quotation.approval_comment = approval_data.comment
        quotation.approved_by = current_user.id
        quotation.approved_at = datetime.now(timezone.utc)

        # 审批拒绝：关联物料价格状态变为无效（用 expired 表达“无效”）
        update_material_status_by_quotation(
            db,
            quotation_id=quotation_id,
            new_status="expired",
            reason=f"由报价单{quotation.code}审批拒绝自动置为无效",
        )
        
        print(f"[REJECT] 准备提交数据库", flush=True)
        db.commit()
        print(f"[REJECT] 数据库提交成功", flush=True)
        
        db.refresh(quotation)
        print(f"[REJECT] 刷新成功", flush=True)
        
        # 重新加载关联数据以正确序列化
        print(f"[REJECT] 开始加载关联数据", flush=True)
        quotation = db.query(Quotation).options(
            joinedload(Quotation.supplier),
            joinedload(Quotation.bom),
            joinedload(Quotation.items)
        ).filter(Quotation.id == quotation_id).first()
        print(f"[REJECT] 关联数据加载成功", flush=True)
        
        print(f"[REJECT] 准备返回数据", flush=True)
        return quotation
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"""
{'='*80}
【拒绝接口错误】
路径: POST /quotations/{quotation_id}/reject
错误类型: {type(e).__name__}
错误消息: {str(e)}
堆栈跟踪:
{traceback.format_exc()}
{'='*80}
"""
        print(error_msg, flush=True)
        print(error_msg, file=sys.stderr, flush=True)
        traceback.print_exc()
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"拒绝失败: {str(e)}")


@router.delete("/{quotation_id}")
async def delete_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("quotation:delete"))
):
    """删除报价单（需要quotation:delete权限）"""
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    # 只有草稿状态的报价单才能删除
    if quotation.status != "draft":
        raise HTTPException(status_code=400, detail="只有草稿状态的报价单才能删除")
    
    db.delete(quotation)
    db.commit()
    return {"message": "删除成功"}


@router.get("/by-bom/{bom_id}", response_model=List[QuotationBasicInfo])
async def get_quotations_by_bom(
    bom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取BOM关联的报价单列表"""
    # 验证BOM存在
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM不存在")
    
    # 查询该BOM关联的所有报价单（排除已拒绝的）
    quotations = db.query(Quotation).options(
        joinedload(Quotation.supplier)
    ).filter(
        Quotation.bom_id == bom_id,
        Quotation.status != "rejected"  # 排除已拒绝的报价单
    ).order_by(Quotation.created_at.desc()).all()
    
    # 转换为基本信息
    result = []
    for q in quotations:
        result.append(QuotationBasicInfo(
            id=q.id,
            code=q.code,
            supplier_id=q.supplier_id,
            supplier_name=q.supplier.name if q.supplier else "",
            supplier_code=q.supplier.code if q.supplier else None,
            credit_rating=q.supplier.credit_rating if q.supplier else None,
            total_amount=q.total_amount,
            status=q.status,
            quotation_date=q.quotation_date,
            valid_until=q.valid_until,
            delivery_days=q.delivery_days,
            delivery_terms=q.delivery_terms,
            payment_terms=q.payment_terms,
            currency=q.currency
        ))
    
    return result


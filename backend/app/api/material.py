"""
物料库管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from decimal import Decimal
from datetime import datetime
import json
import os

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.material import Material
from app.schemas.material import (
    MaterialCreate,
    MaterialUpdate,
    Material as MaterialSchema,
    MaterialListResponse,
)


router = APIRouter(prefix="/materials", tags=["物料库管理"])

# Debug logging setup
DEBUG_LOG_PATH = r"d:\dream-start\code\procurement-manager\.cursor\debug.log"

def _log_debug(location: str, message: str, data: dict, hypothesis_id: str = "A"):
    """Write debug log to file"""
    try:
        log_entry = {
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data,
            "timestamp": int(datetime.now().timestamp() * 1000)
        }
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
    except Exception:
        pass  # Silently fail if logging fails


def generate_material_code(db: Session) -> str:
    """
    自动生成物料编码
    格式：M + 日期(YYYYMMDD) + 序号(001, 002...)
    例如：M20250101-001
    """
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"M{today}"
    
    # 查询今天已生成的物料（编码格式为 M日期-序号）
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_materials = db.query(Material).filter(
        Material.code.like(f"{prefix}-%"),
        Material.created_at >= today_start
    ).all()
    
    # 提取已有的序号
    existing_sequences = []
    for m in today_materials:
        try:
            # 编码格式：M20250101-001，提取序号部分
            if m.code and m.code.startswith(prefix + "-"):
                seq_str = m.code[len(prefix) + 1:]
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
    while db.query(Material).filter(Material.code == code).first():
        sequence += 1
        code = f"{prefix}-{sequence:03d}"
    
    return code


@router.get("", response_model=MaterialListResponse)
async def list_materials(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    price_status: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取物料列表"""
    query = db.query(Material)
    
    if keyword:
        query = query.filter(
            or_(
                Material.code.like(f"%{keyword}%"),
                Material.name.like(f"%{keyword}%"),
                Material.specification.like(f"%{keyword}%"),
                Material.brand.like(f"%{keyword}%"),
            )
        )
    if price_status:
        query = query.filter(Material.price_status == price_status)
    if is_active is not None:
        query = query.filter(Material.is_active == is_active)

    total = query.count()
    items = (
        query.order_by(Material.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return MaterialListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{material_id}", response_model=MaterialSchema)
async def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="物料不存在")
    return material


@router.post("", response_model=MaterialSchema)
async def create_material(
    data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 如果没有提供编码，自动生成
    material_code = data.code
    if not material_code:
        material_code = generate_material_code(db)
    
    # 检查编码是否已存在
    existing = db.query(Material).filter(Material.code == material_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="物料编码已存在")

    material = Material(
        code=material_code,
        name=data.name,
        specification=data.specification,
        unit=data.unit,
        category=data.category,
        brand=data.brand,
        standard_price=data.standard_price,
        price_status=data.price_status or "pending",
        status_reason=data.status_reason,
        currency=data.currency or "CNY",
        last_price=data.last_price,
        remark=data.remark,
        source=data.source,
        material_type="manual",  # 通过新建物料接口创建，标记为手动录入
        is_active=True if data.is_active is None else data.is_active,
        created_by=current_user.id,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.put("/{material_id}", response_model=MaterialSchema)
async def update_material(
    material_id: int,
    data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="物料不存在")

    update_data = data.dict(exclude_unset=True)
    # code 变更需要校验唯一
    if "code" in update_data and update_data["code"] != material.code:
        exists = db.query(Material).filter(Material.code == update_data["code"]).first()
        if exists:
            raise HTTPException(status_code=400, detail="物料编码已存在")

    # 排除material_type字段，物料类型由系统自动判断，不允许用户修改
    update_data.pop("material_type", None)

    for k, v in update_data.items():
        setattr(material, k, v)
    
    # 设置更新人
    material.updated_by = current_user.id

    db.commit()
    db.refresh(material)
    return material


# #region agent log
@router.delete("/{material_id}")
async def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除物料"""
    _log_debug("material.py:delete_material", "DELETE endpoint called", {"material_id": material_id}, "A")
    
    material = db.query(Material).filter(Material.id == material_id).first()
    _log_debug("material.py:delete_material", "Material query result", {"found": material is not None, "material_id": material_id}, "A")
    
    if not material:
        _log_debug("material.py:delete_material", "Material not found, raising 404", {"material_id": material_id}, "A")
        raise HTTPException(status_code=404, detail="物料不存在")
    
    _log_debug("material.py:delete_material", "Before delete", {"material_id": material_id, "code": material.code}, "A")
    
    db.delete(material)
    db.commit()
    
    _log_debug("material.py:delete_material", "After delete and commit", {"material_id": material_id}, "A")
    
    return {"message": "删除成功"}
# #endregion



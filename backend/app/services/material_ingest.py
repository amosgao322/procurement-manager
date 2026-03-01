"""
从报价明细自动入库物料
"""
from __future__ import annotations

import hashlib
from decimal import Decimal
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.material import Material
from app.models.quotation import Quotation, QuotationItem

DEBUG_LOG_PATH = r"d:\dream-start\code\procurement-manager\.cursor\debug.log"


def _log(hypothesis_id: str, location: str, message: str, data: dict, run_id: str = "run1") -> None:
    # #region agent log
    try:
        import json
        from datetime import datetime
        payload = {
            "sessionId": "debug-session",
            "runId": run_id,
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data,
            "timestamp": int(datetime.now().timestamp() * 1000),
        }
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:
        pass
    # #endregion


def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def _remove_all_spaces(s: Optional[str]) -> Optional[str]:
    """去除字符串中的所有空格"""
    if s is None:
        return None
    return s.replace(" ", "").replace("\t", "").replace("\n", "").replace("\r", "") or None


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


def upsert_material_from_quotation_item(
    db: Session,
    quotation: Quotation,
    item: QuotationItem,
) -> Material:
    """
    报价单生成物料：不做主物料去重（即使 name/spec/unit/brand 相同也创建新物料记录），
    让物料库能完整展示历史明细来源。
    """
    # 去除所有空格（包括中间的空格）
    name = _remove_all_spaces(item.material_name) or ""
    spec = _remove_all_spaces(item.specification)
    unit = _remove_all_spaces(item.unit)
    brand = _remove_all_spaces(item.brand)

    # 使用统一的物料编码生成逻辑（M日期-序号格式）
    material_code = generate_material_code(db)

    # 获取供应商名称作为来源
    supplier_name = None
    if quotation.supplier_id:
        from app.models.supplier import Supplier
        supplier = db.query(Supplier).filter(Supplier.id == quotation.supplier_id).first()
        if supplier:
            supplier_name = supplier.name

    material = Material(
        code=material_code,
        name=name,
        specification=spec,
        unit=unit,
        brand=brand,
        is_active=True,
        # 报价生成物料：初始状态为待确认，需审批通过后才有效
        price_status="pending",
        currency=quotation.currency or "CNY",
        last_price=item.unit_price,
        source=supplier_name,  # 记录供应商名称作为来源
        material_type="quotation",  # 通过报价单接口生成，标记为报价单录入
        created_by=quotation.created_by,
    )
    db.add(material)
    db.flush()

    _log(
        "S1",
        "material_ingest.py:upsert_material_from_quotation_item",
        "create material from quotation item (no-dedupe)",
        {
            "quotation_id": getattr(quotation, "id", None),
            "quotation_item_id": getattr(item, "id", None),
            "material_id": getattr(material, "id", None),
            "material_code": getattr(material, "code", None),
            "price_status_set_to": getattr(material, "price_status", None),
        },
    )

    return material


def ingest_quotation_items_to_materials(db: Session, quotation_id: int) -> int:
    """
    将指定报价单的报价明细写入物料库。
    返回写入的物料记录条数。
    """
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        return 0

    items = db.query(QuotationItem).filter(QuotationItem.quotation_id == quotation_id).all()
    count = 0
    for item in items:
        material = upsert_material_from_quotation_item(db, quotation, item)
        count += 1
    _log(
        "S1",
        "material_ingest.py:ingest_quotation_items_to_materials",
        "ingest finished",
        {"quotation_id": quotation_id, "materials_added": count},
    )
    return count


def update_material_status_by_quotation(db: Session, quotation_id: int, new_status: str, reason: str) -> int:
    """
    根据报价单关联的物料更新状态。
    通过报价单的创建时间和创建人来匹配物料（物料是在报价单创建时通过 ingest_quotation_items_to_materials 生成的）。
    new_status: pending/valid/expired/abnormal
    """
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        return 0
    
    # 通过报价单的创建时间和创建人来匹配物料
    # 物料是在报价单创建时通过 ingest_quotation_items_to_materials 生成的
    # 匹配逻辑：创建人相同，且创建时间在报价单创建时间前后5分钟内
    from datetime import timedelta
    
    if not quotation.created_at:
        return 0
    
    time_start = quotation.created_at - timedelta(minutes=5)
    time_end = quotation.created_at + timedelta(minutes=5)
    
    query = db.query(Material).filter(
        Material.price_status == "pending",  # 报价生成的物料初始状态为 pending
        Material.created_at >= time_start,
        Material.created_at <= time_end,
    )
    
    if quotation.created_by:
        query = query.filter(Material.created_by == quotation.created_by)
    
    materials = query.all()
    
    if not materials:
        _log(
            "S2",
            "material_ingest.py:update_material_status_by_quotation",
            "no materials linked to quotation",
            {"quotation_id": quotation_id, "new_status": new_status, "quotation_created_at": str(quotation.created_at)},
            run_id="post-fix",
        )
        return 0

    material_ids = [m.id for m in materials]
    updated = (
        db.query(Material)
        .filter(Material.id.in_(material_ids))
        .update({"price_status": new_status, "status_reason": reason}, synchronize_session=False)
    )
    db.commit()
    
    _log(
        "S2",
        "material_ingest.py:update_material_status_by_quotation",
        "materials status updated by quotation",
        {"quotation_id": quotation_id, "material_ids_count": len(material_ids), "updated": updated, "new_status": new_status},
        run_id="post-fix",
    )
    return int(updated or 0)



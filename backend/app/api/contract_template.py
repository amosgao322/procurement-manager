"""
合同模板管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Form
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from pathlib import Path
from datetime import datetime
import os
import shutil
from app.core.database import get_db
from app.models.contract_template import ContractTemplate
from app.schemas.contract_template import (
    ContractTemplateCreate, 
    ContractTemplateUpdate, 
    ContractTemplate as ContractTemplateSchema, 
    ContractTemplateListResponse
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/contract-templates", tags=["合同模板管理"])

# 模板文件存储目录
TEMPLATE_DIR = Path("uploads/contract_templates")
TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)


@router.get("", response_model=ContractTemplateListResponse)
async def get_contract_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取合同模板列表"""
    query = db.query(ContractTemplate)
    
    # 搜索
    if keyword:
        query = query.filter(ContractTemplate.name.like(f"%{keyword}%"))
    
    # 状态筛选
    if is_active is not None:
        query = query.filter(ContractTemplate.is_active == is_active)
    
    # 总数
    total = query.count()
    
    # 分页
    templates = query.order_by(ContractTemplate.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return ContractTemplateListResponse(
        items=templates,
        total=total
    )


@router.get("/{template_id}", response_model=ContractTemplateSchema)
async def get_contract_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取合同模板详情"""
    template = db.query(ContractTemplate).filter(ContractTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="合同模板不存在")
    return template


@router.post("", response_model=ContractTemplateSchema)
async def create_contract_template(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建合同模板（上传模板文件）"""
    import sys
    print(f"[DEBUG] 收到上传请求: name={name}, description={description}, filename={file.filename}", file=sys.stderr, flush=True)
    
    # 验证文件类型
    if not file.filename or not file.filename.endswith(('.docx', '.doc')):
        raise HTTPException(status_code=400, detail="仅支持上传 .docx 或 .doc 格式的模板文件")
    
    # 检查名称是否已存在
    existing = db.query(ContractTemplate).filter(ContractTemplate.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="模板名称已存在")
    
    # 保存文件
    file_ext = Path(file.filename).suffix
    file_name = f"{name}_{int(datetime.now().timestamp())}{file_ext}"
    file_path = TEMPLATE_DIR / file_name
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 获取文件大小
    file_size = file_path.stat().st_size
    
    # 创建模板记录
    template = ContractTemplate(
        name=name,
        description=description,
        file_path=str(file_path),
        file_name=file.filename,
        file_size=file_size,
        created_by=current_user.id
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.put("/{template_id}", response_model=ContractTemplateSchema)
async def update_contract_template(
    template_id: int,
    template_data: ContractTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新合同模板"""
    template = db.query(ContractTemplate).filter(ContractTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="合同模板不存在")
    
    # 检查名称是否重复
    if template_data.name and template_data.name != template.name:
        existing = db.query(ContractTemplate).filter(ContractTemplate.name == template_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="模板名称已存在")
    
    # 更新字段
    update_data = template_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}")
async def delete_contract_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除合同模板"""
    template = db.query(ContractTemplate).filter(ContractTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="合同模板不存在")
    
    # 删除文件
    if template.file_path and os.path.exists(template.file_path):
        try:
            os.remove(template.file_path)
        except Exception:
            pass
    
    db.delete(template)
    db.commit()
    return {"message": "删除成功"}


@router.post("/{template_id}/upload", response_model=ContractTemplateSchema)
async def upload_template_file(
    template_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新合同模板文件"""
    template = db.query(ContractTemplate).filter(ContractTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="合同模板不存在")
    
    # 验证文件类型
    if not file.filename.endswith(('.docx', '.doc')):
        raise HTTPException(status_code=400, detail="仅支持上传 .docx 或 .doc 格式的模板文件")
    
    # 删除旧文件
    if template.file_path and os.path.exists(template.file_path):
        try:
            os.remove(template.file_path)
        except Exception:
            pass
    
    # 保存新文件
    file_ext = Path(file.filename).suffix
    file_name = f"{template.name}_{int(datetime.now().timestamp())}{file_ext}"
    file_path = TEMPLATE_DIR / file_name
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 更新模板记录
    template.file_path = str(file_path)
    template.file_name = file.filename
    template.file_size = file_path.stat().st_size
    
    db.commit()
    db.refresh(template)
    return template


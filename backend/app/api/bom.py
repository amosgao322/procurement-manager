"""
BOM管理API
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from io import BytesIO
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter
from decimal import Decimal
import os
import re
from datetime import datetime
try:
    import xlrd
    HAS_XLRD = True
except ImportError:
    HAS_XLRD = False
from app.core.database import get_db
from app.models.bom import BOM, BOMItem
from app.schemas.bom import BOMCreate, BOMUpdate, BOM as BOMSchema, BOMListResponse, ExcelImportResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/boms", tags=["BOM管理"])


@router.get("", response_model=BOMListResponse)
async def get_boms(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取BOM列表"""
    query = db.query(BOM).options(joinedload(BOM.items))
    
    # 搜索
    if keyword:
        query = query.filter(
            or_(
                BOM.code.like(f"%{keyword}%"),
                BOM.name.like(f"%{keyword}%")
            )
        )
    
    # 总数
    total = query.count()
    
    # 分页
    boms = query.order_by(BOM.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return BOMListResponse(
        items=boms,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{bom_id}", response_model=BOMSchema)
async def get_bom(
    bom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取BOM详情"""
    bom = db.query(BOM).options(joinedload(BOM.items)).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM不存在")
    return bom


@router.post("", response_model=BOMSchema)
async def create_bom(
    bom_data: BOMCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建BOM"""
    try:
        # 检查编码是否已存在
        existing = db.query(BOM).filter(BOM.code == bom_data.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="BOM编码已存在")
        
        # 创建BOM
        bom = BOM(
            code=bom_data.code,
            name=bom_data.name,
            product_name=bom_data.product_name,
            description=bom_data.description,
            status=bom_data.status,
            remark=bom_data.remark,
            created_by=current_user.id
        )
        db.add(bom)
        db.flush()
        
        # 创建明细
        total_amount = Decimal("0")
        for item_data in bom_data.items:
            item = BOMItem(
                bom_id=bom.id,
                sequence=item_data.sequence,
                material_name=item_data.material_name,
                specification=item_data.specification,
                unit=item_data.unit,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.total_price or (item_data.quantity * item_data.unit_price if item_data.unit_price else None),
                remark=item_data.remark
            )
            if item.total_price:
                total_amount += item.total_price
            db.add(item)
        
        bom.total_amount = total_amount
        db.commit()
        db.refresh(bom)
        return bom
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建BOM失败: {str(e)}")


@router.put("/{bom_id}", response_model=BOMSchema)
async def update_bom(
    bom_id: int,
    bom_data: BOMUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新BOM"""
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM不存在")
    
    # 更新字段
    if bom_data.name is not None:
        bom.name = bom_data.name
    if bom_data.product_name is not None:
        bom.product_name = bom_data.product_name
    if bom_data.description is not None:
        bom.description = bom_data.description
    if bom_data.status is not None:
        bom.status = bom_data.status
    if bom_data.remark is not None:
        bom.remark = bom_data.remark
    
    # 更新明细
    if bom_data.items is not None:
        # 删除旧明细
        db.query(BOMItem).filter(BOMItem.bom_id == bom_id).delete()
        
        # 添加新明细
        total_amount = Decimal("0")
        for item_data in bom_data.items:
            item = BOMItem(
                bom_id=bom.id,
                sequence=item_data.sequence,
                material_name=item_data.material_name,
                specification=item_data.specification,
                unit=item_data.unit,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.total_price or (item_data.quantity * item_data.unit_price if item_data.unit_price else None),
                remark=item_data.remark
            )
            if item.total_price:
                total_amount += item.total_price
            db.add(item)
        
        bom.total_amount = total_amount
    
    db.commit()
    db.refresh(bom)
    return bom


@router.delete("/{bom_id}")
async def delete_bom(
    bom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除BOM"""
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM不存在")
    
    db.delete(bom)
    db.commit()
    return {"message": "删除成功"}


@router.get("/{bom_id}/export")
async def export_bom(
    bom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """导出BOM为Excel"""
    bom = db.query(BOM).options(joinedload(BOM.items)).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM不存在")
    
    # 创建Excel工作簿
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "BOM清单"
    
    # 设置标题样式
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=12)
    title_font = Font(bold=True, size=14)
    
    # BOM基本信息
    row = 1
    ws.merge_cells(f'A{row}:D{row}')
    cell = ws.cell(row=row, column=1, value=f"BOM清单 - {bom.name}")
    cell.font = title_font
    cell.alignment = Alignment(horizontal="center", vertical="center")
    
    row += 2
    ws.cell(row=row, column=1, value="BOM编码:").font = Font(bold=True)
    ws.cell(row=row, column=2, value=bom.code)
    row += 1
    ws.cell(row=row, column=1, value="BOM名称:").font = Font(bold=True)
    ws.cell(row=row, column=2, value=bom.name)
    row += 1
    if bom.product_name:
        ws.cell(row=row, column=1, value="产品名称:").font = Font(bold=True)
        ws.cell(row=row, column=2, value=bom.product_name)
        row += 1
    if bom.description:
        ws.cell(row=row, column=1, value="描述:").font = Font(bold=True)
        ws.cell(row=row, column=2, value=bom.description)
        row += 1
    ws.cell(row=row, column=1, value="状态:").font = Font(bold=True)
    ws.cell(row=row, column=2, value=bom.status)
    row += 1
    if bom.total_amount:
        ws.cell(row=row, column=1, value="总金额:").font = Font(bold=True)
        ws.cell(row=row, column=2, value=float(bom.total_amount))
        row += 1
    
    # 明细表头
    row += 2
    headers = ["序号", "设备/物料名称", "规格型号", "单位", "数量", "单价", "总价", "备注"]
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=row, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # 明细数据
    row += 1
    for item in bom.items:
        ws.cell(row=row, column=1, value=item.sequence or "")
        ws.cell(row=row, column=2, value=item.material_name)
        ws.cell(row=row, column=3, value=item.specification or "")
        ws.cell(row=row, column=4, value=item.unit or "")
        ws.cell(row=row, column=5, value=float(item.quantity) if item.quantity else "")
        ws.cell(row=row, column=6, value=float(item.unit_price) if item.unit_price else "")
        ws.cell(row=row, column=7, value=float(item.total_price) if item.total_price else "")
        ws.cell(row=row, column=8, value=item.remark or "")
        row += 1
    
    # 设置列宽
    column_widths = [10, 30, 30, 10, 12, 12, 12, 30]
    for col, width in enumerate(column_widths, start=1):
        ws.column_dimensions[get_column_letter(col)].width = width
    
    # 保存到内存
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    # 简化文件名，避免中文编码问题
    safe_filename = f"BOM_{bom.code}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"'
        }
    )


@router.post("/import", response_model=ExcelImportResponse)
async def import_bom(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """导入BOM Excel文件"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail=f"不支持的文件格式。当前文件: {file.filename}，只支持 .xlsx 或 .xls 格式的Excel文件"
        )
    
    # 读取Excel文件
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(
                status_code=400, 
                detail="文件内容为空。请确保文件已正确上传且文件大小不为0"
            )
        
        # 检查文件大小
        file_size = len(contents)
        if file_size < 100:  # Excel文件最小应该有几KB
            raise HTTPException(
                status_code=400,
                detail=f"文件大小异常（{file_size}字节），可能不是有效的Excel文件。请检查文件是否损坏"
            )
        
        # 检查文件签名（Magic Number）
        # Excel文件的签名：.xlsx文件以PK开头（ZIP格式），.xls文件以特定字节开头
        if file.filename.endswith('.xlsx'):
            if not contents.startswith(b'PK'):
                raise HTTPException(
                    status_code=400,
                    detail="文件格式错误：.xlsx文件应该以ZIP格式开头。可能的原因：1) 文件损坏 2) 文件被重命名但格式不正确 3) 文件不是真正的Excel文件"
                )
        elif file.filename.endswith('.xls'):
            # .xls文件的签名检查
            if contents[:8] != b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1':
                raise HTTPException(
                    status_code=400,
                    detail="文件格式错误：.xls文件格式不正确。可能的原因：1) 文件损坏 2) 文件被重命名但格式不正确 3) 文件不是真正的Excel文件"
                )
        
        # 尝试加载工作簿
        try:
            if file.filename.endswith('.xls'):
                # .xls格式需要使用xlrd库
                if not HAS_XLRD:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "系统不支持.xls格式文件。\n\n"
                            "解决方案：\n"
                            "1. 在Excel中打开文件，选择'文件' -> '另存为'\n"
                            "2. 在'文件类型'中选择'Excel工作簿(*.xlsx)'\n"
                            "3. 保存后使用新的.xlsx文件导入\n\n"
                            f"当前文件：{file.filename}\n"
                            "提示：.xls是旧版Excel格式，建议转换为.xlsx格式以获得更好的兼容性"
                        )
                    )
                # 使用xlrd读取.xls文件，然后转换为openpyxl格式
                try:
                    xls_book = xlrd.open_workbook(file_contents=contents)
                    # 创建一个新的openpyxl工作簿
                    wb = openpyxl.Workbook()
                    ws = wb.active
                    ws.title = xls_book.sheet_names()[0] if xls_book.sheet_names() else "Sheet1"
                    
                    # 读取第一个工作表
                    xls_sheet = xls_book.sheet_by_index(0)
                    
                    # 将数据复制到openpyxl工作表
                    for row_idx in range(xls_sheet.nrows):
                        for col_idx in range(xls_sheet.ncols):
                            cell_value = xls_sheet.cell_value(row_idx, col_idx)
                            # 处理日期类型
                            if xls_sheet.cell_type(row_idx, col_idx) == xlrd.XL_CELL_DATE:
                                try:
                                    date_tuple = xlrd.xldate_as_tuple(cell_value, xls_book.datemode)
                                    cell_value = datetime(*date_tuple[:6])
                                except:
                                    pass  # 如果日期转换失败，保持原值
                            ws.cell(row=row_idx + 1, column=col_idx + 1, value=cell_value)
                except Exception as xls_error:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"无法读取.xls格式文件。\n\n"
                            f"错误信息：{str(xls_error)}\n"
                            f"文件：{file.filename}\n\n"
                            "建议：\n"
                            "1. 在Excel中打开文件，确认文件可以正常打开\n"
                            "2. 如果文件可以打开，选择'文件' -> '另存为' -> 保存为.xlsx格式\n"
                            "3. 使用转换后的.xlsx文件导入\n"
                            "4. 检查文件是否损坏"
                        )
                    )
            else:
                # .xlsx格式使用openpyxl直接读取
                wb = openpyxl.load_workbook(BytesIO(contents), data_only=True)
        except HTTPException:
            raise
        except Exception as e:
            error_msg = str(e)
            # 提供更详细的错误信息
            if "File contains no valid workbook part" in error_msg:
                detail_msg = (
                    "Excel文件格式错误：文件中没有有效的工作簿部分。\n"
                    "可能的原因：\n"
                    "1. 文件损坏或不完整\n"
                    "2. 文件不是真正的Excel文件（可能是CSV或其他格式被重命名）\n"
                    "3. 文件是用不兼容的软件创建的\n"
                    "4. 文件在传输过程中损坏\n\n"
                    f"技术细节：{error_msg}\n"
                    f"文件大小：{file_size} 字节\n"
                    f"文件名：{file.filename}"
                )
            elif "BadZipFile" in error_msg or "zipfile" in error_msg.lower():
                detail_msg = (
                    "ZIP文件格式错误：.xlsx文件实际上是ZIP压缩包，但ZIP格式不正确。\n"
                    "可能的原因：\n"
                    "1. 文件损坏\n"
                    "2. 文件不是真正的.xlsx文件\n"
                    "3. 文件在传输过程中损坏\n\n"
                    f"技术细节：{error_msg}"
                )
            else:
                detail_msg = (
                    f"无法读取Excel文件。\n"
                    f"错误类型：{type(e).__name__}\n"
                    f"错误信息：{error_msg}\n"
                    f"文件大小：{file_size} 字节\n"
                    f"文件名：{file.filename}\n\n"
                    "建议：\n"
                    "1. 确认文件是使用Microsoft Excel或兼容软件创建的\n"
                    "2. 尝试在Excel中打开文件，确认文件可以正常打开\n"
                    "3. 如果文件可以打开，尝试另存为新文件后再导入"
                )
            raise HTTPException(status_code=400, detail=detail_msg)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"读取文件时发生未知错误：{str(e)}\n文件：{file.filename if file.filename else '未知'}"
        )
    ws = wb.active
    
    success_count = 0
    error_count = 0
    errors = []
    
    # 查找BOM基本信息（通常在文件开头）
    bom_code = None
    bom_name = None
    product_name = None
    description = None
    status = "draft"
    
    # 查找明细表头行
    header_row = None
    for row_idx, row in enumerate(ws.iter_rows(values_only=True), start=1):
        row_values = [str(cell).strip() if cell else "" for cell in row]
        # 查找BOM编码
        if "BOM编码" in str(row_values[0]) if row_values else False:
            bom_code = str(row_values[1]) if len(row_values) > 1 else None
        if "BOM名称" in str(row_values[0]) if row_values else False:
            bom_name = str(row_values[1]) if len(row_values) > 1 else None
        if "产品名称" in str(row_values[0]) if row_values else False:
            product_name = str(row_values[1]) if len(row_values) > 1 else None
        if "描述" in str(row_values[0]) if row_values else False:
            description = str(row_values[1]) if len(row_values) > 1 else None
        
        # 查找表头行（包含"序号"、"设备"等关键词）
        # 检查是否包含表头关键词（放宽条件，支持更多表头格式）
        row_str = " ".join(row_values).upper()
        keywords = ["序号", "设备", "物料", "名称", "规格", "单位", "数量", "单价", "总价"]
        keyword_count = sum(1 for keyword in keywords if keyword in row_str)
        # 至少包含2个关键词才认为是表头
        if keyword_count >= 2:
            header_row = row_idx
            break
    
    # 如果没有找到BOM编码或名称，尝试从文件名生成
    if not bom_code:
        # 从文件名提取编码（去除扩展名和特殊字符）
        filename_base = os.path.splitext(file.filename)[0]
        filename_base = os.path.basename(filename_base)  # 去除路径
        # 提取文件名中的编码部分（如果有数字和字母组合）
        code_match = re.search(r'[A-Z0-9]+', filename_base.upper())
        if code_match:
            bom_code = f"BOM_{code_match.group()}"
        else:
            # 使用时间戳生成编码
            bom_code = f"BOM_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    if not bom_name:
        # 从文件名提取名称
        filename_base = os.path.splitext(file.filename)[0]
        # 去除路径和扩展名
        bom_name = os.path.basename(filename_base)
        # 清理文件名（去除特殊字符，保留中文、字母、数字）
        bom_name = re.sub(r'[^\w\u4e00-\u9fa5]+', '_', bom_name)
        if not bom_name or bom_name == file.filename or len(bom_name) < 2:
            bom_name = f"BOM清单_{datetime.now().strftime('%Y%m%d')}"
    
    # 检查BOM编码是否已存在
    existing_bom = db.query(BOM).filter(BOM.code == bom_code).first()
    if existing_bom:
        # 如果编码已存在，添加时间戳后缀
        bom_code = f"{bom_code}_{datetime.now().strftime('%H%M%S')}"
    
    # 读取明细数据
    items = []
    if header_row:
        for row_idx, row in enumerate(ws.iter_rows(min_row=header_row + 1, values_only=True), start=header_row + 1):
            row_values = [cell if cell is not None else "" for cell in row]
            # 跳过空行
            if not any(row_values[:7]):  # 前7列都为空则跳过
                continue
            
            try:
                sequence = str(row_values[0]).strip() if len(row_values) > 0 and row_values[0] else ""
                material_name = str(row_values[1]).strip() if len(row_values) > 1 and row_values[1] else ""
                
                # 跳过基础信息行（产品名称、描述、状态、总金额等）
                # 定义基础信息标签列表
                info_labels = ["产品名称", "描述", "状态", "总金额", "BOM编码", "BOM名称", "备注"]
                
                # 1. 物料名称为空则跳过
                if not material_name:
                    continue
                
                # 2. 检查物料名称列是否是基础信息标签（最严格的检查）
                if material_name.strip() in info_labels:
                    continue
                
                # 3. 检查第一列（序号列）是否是基础信息标签
                if sequence and sequence.strip() in info_labels:
                    continue
                
                # 4. 检查前几列是否包含基础信息关键词（不区分大小写）
                row_str = " ".join([str(v) for v in row_values[:3] if v]).lower()
                for label in info_labels:
                    if label.lower() in row_str:
                        continue
                
                # 5. 检查序号是否为数字（基础信息行的序号通常不是数字）
                # 真正的明细行，序号应该是数字（1, 2, 3...）
                if sequence:
                    # 去除序号中的空格、点号、逗号等后检查是否为数字
                    seq_clean = sequence.strip().replace('.', '').replace(',', '').replace(' ', '').replace('-', '')
                    if seq_clean and not seq_clean.isdigit():
                        # 如果序号不是数字，可能是基础信息行，跳过
                        continue
                
                # 6. 额外检查：如果数量为0或空，且物料名称看起来像基础信息，跳过
                # 基础信息行的数量通常是0或空，且物料名称是标签
                qty_val = row_values[4] if len(row_values) > 4 else None
                if qty_val is None or (isinstance(qty_val, (int, float)) and float(qty_val) == 0):
                    # 如果数量为0或空，检查物料名称是否包含基础信息关键词
                    material_lower = material_name.lower()
                    if any(label.lower() in material_lower for label in info_labels):
                        continue
                    # 或者物料名称完全匹配基础信息标签
                    if material_name.strip() in info_labels:
                        continue
                
                specification = str(row_values[2]).strip() if len(row_values) > 2 and row_values[2] else ""
                unit = str(row_values[3]).strip() if len(row_values) > 3 and row_values[3] else ""
                
                # 解析数量
                quantity = Decimal("0")
                if len(row_values) > 4 and row_values[4] is not None:
                    qty_str = str(row_values[4]).strip()
                    if qty_str:
                        try:
                            # 清理字符串：去除空格、逗号等
                            qty_str = qty_str.replace(',', '').replace(' ', '')
                            quantity = Decimal(qty_str)
                        except (ValueError, TypeError, Exception) as e:
                            raise ValueError(f"数量字段格式错误（第5列）：'{row_values[4]}'，无法转换为数字")
                
                # 解析单价
                unit_price = None
                if len(row_values) > 5 and row_values[5] is not None:
                    price_str = str(row_values[5]).strip()
                    if price_str:
                        try:
                            # 清理字符串：去除空格、逗号、货币符号等
                            price_str = price_str.replace(',', '').replace(' ', '').replace('￥', '').replace('$', '').replace('¥', '')
                            unit_price = Decimal(price_str)
                        except (ValueError, TypeError, Exception) as e:
                            raise ValueError(f"单价字段格式错误（第6列）：'{row_values[5]}'，无法转换为数字")
                
                # 解析总价
                total_price = None
                if len(row_values) > 6 and row_values[6] is not None:
                    total_str = str(row_values[6]).strip()
                    if total_str:
                        try:
                            # 清理字符串：去除空格、逗号、货币符号等
                            total_str = total_str.replace(',', '').replace(' ', '').replace('￥', '').replace('$', '').replace('¥', '')
                            total_price = Decimal(total_str)
                        except (ValueError, TypeError, Exception) as e:
                            raise ValueError(f"总价字段格式错误（第7列）：'{row_values[6]}'，无法转换为数字")
                
                remark = str(row_values[7]).strip() if len(row_values) > 7 and row_values[7] else ""
                
                # 如果没有总价，计算总价
                if not total_price and quantity and unit_price:
                    total_price = quantity * unit_price
                
                items.append({
                    "sequence": sequence,
                    "material_name": material_name,
                    "specification": specification,
                    "unit": unit,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "total_price": total_price,
                    "remark": remark
                })
            except Exception as e:
                # 提取更详细的错误信息
                error_msg = str(e)
                if "数量字段格式错误" in error_msg or "单价字段格式错误" in error_msg or "总价字段格式错误" in error_msg:
                    error_detail = error_msg
                else:
                    # 尝试识别是哪个字段的问题
                    error_detail = f"解析错误: {error_msg}"
                    # 检查具体是哪个字段
                    if len(row_values) > 4 and row_values[4]:
                        try:
                            Decimal(str(row_values[4]).strip().replace(',', ''))
                        except:
                            error_detail = f"数量字段格式错误（第5列）：'{row_values[4]}'，无法转换为数字"
                    elif len(row_values) > 5 and row_values[5]:
                        try:
                            Decimal(str(row_values[5]).strip().replace(',', ''))
                        except:
                            error_detail = f"单价字段格式错误（第6列）：'{row_values[5]}'，无法转换为数字"
                    elif len(row_values) > 6 and row_values[6]:
                        try:
                            Decimal(str(row_values[6]).strip().replace(',', ''))
                        except:
                            error_detail = f"总价字段格式错误（第7列）：'{row_values[6]}'，无法转换为数字"
                
                errors.append({
                    "row": row_idx,
                    "field": "数据解析",
                    "message": error_detail
                })
                error_count += 1
    
    if not items:
        if not header_row:
            raise HTTPException(
                status_code=400, 
                detail=(
                    "未找到有效的明细数据。\n\n"
                    "可能的原因：\n"
                    "1. 文件中没有找到表头行（应包含'序号'、'设备名称'、'规格型号'等列）\n"
                    "2. 表头行格式不符合要求\n"
                    "3. 数据行全部为空\n\n"
                    f"文件：{file.filename}\n"
                    f"总行数：{ws.max_row}\n\n"
                    "建议：\n"
                    "1. 确认文件包含表头行，表头应包含：序号、设备名称/物料名称、规格型号、单位、数量等列\n"
                    "2. 确认表头行下方有数据行\n"
                    "3. 检查数据行是否为空"
                )
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"未找到有效的明细数据。\n\n"
                    f"表头行：第{header_row}行\n"
                    f"已扫描行数：{ws.max_row - header_row}\n\n"
                    "可能的原因：\n"
                    "1. 表头行下方没有数据\n"
                    "2. 数据行的物料名称为空（第2列）\n"
                    "3. 数据格式不正确\n\n"
                    f"文件：{file.filename}\n\n"
                    "建议：\n"
                    "1. 确认表头行下方有数据\n"
                    "2. 确认数据行的第2列（物料名称）不为空\n"
                    "3. 检查数据格式是否正确"
                )
            )
    
    # 创建BOM
    try:
        bom = BOM(
            code=bom_code,
            name=bom_name,
            product_name=product_name,
            description=description,
            status=status,
            created_by=current_user.id
        )
        db.add(bom)
        db.flush()
        
        # 创建明细
        total_amount = Decimal("0")
        for item_data in items:
            item = BOMItem(
                bom_id=bom.id,
                sequence=item_data["sequence"],
                material_name=item_data["material_name"],
                specification=item_data["specification"],
                unit=item_data["unit"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                total_price=item_data["total_price"],
                remark=item_data["remark"]
            )
            if item.total_price:
                total_amount += item.total_price
            db.add(item)
        
        bom.total_amount = total_amount
        db.commit()
        db.refresh(bom)  # 刷新对象以获取最新数据
        success_count = 1
        
        # 获取实际值，确保类型正确
        # 在 refresh 后，这些属性应该是实际值，但为了确保类型正确，我们显式获取
        bom_id_value = getattr(bom, 'id', None)
        bom_code_value = getattr(bom, 'code', None)
        bom_name_value = getattr(bom, 'name', None)
        
        # 确保返回的数据类型正确，避免序列化错误
        return ExcelImportResponse(
            success=True,
            bom_id=bom_id_value,
            bom_code=bom_code_value,
            bom_name=bom_name_value,
            items_count=len(items),
            errors=errors,
            error_count=error_count
        )
        
    except HTTPException as e:
        raise
    except Exception as e:
        # 记录详细错误信息，包括堆栈跟踪
        import traceback
        error_trace = traceback.format_exc()
        # 打印完整的错误堆栈到控制台
        print(f"\n{'='*80}")
        print(f"BOM导入错误详情:")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误消息: {str(e)}")
        print(f"文件: {file.filename if file else '未知'}")
        print(f"用户: {current_user.username}")
        print(f"\n完整堆栈跟踪:")
        print(error_trace)
        print(f"{'='*80}\n")
        
        raise HTTPException(
            status_code=500,
            detail=f"导入失败: {str(e)}"
        )

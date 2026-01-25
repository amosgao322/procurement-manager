"""
Excel处理工具
"""
import pandas as pd
from typing import List, Dict, Tuple
from openpyxl import load_workbook


def parse_bom_excel(file_path: str) -> Tuple[List[Dict], List[str]]:
    """
    解析BOM Excel文件
    返回: (数据列表, 错误信息列表)
    
    Excel格式参考：
    序号 | 物料名称 | 规格型号 | 单位 | 数量 | 单价 | 总价 | 备注
    """
    errors = []
    data = []
    
    try:
        # 使用pandas读取Excel
        df = pd.read_excel(file_path, sheet_name=0)
        
        # 检查必需的列
        required_columns = ['序号', '物料名称', '单位', '数量']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            errors.append(f"缺少必需的列: {', '.join(missing_columns)}")
            return data, errors
        
        # 清理数据：删除空行
        df = df.dropna(subset=['物料名称'])
        
        # 遍历每一行
        for idx, row in df.iterrows():
            try:
                item = {
                    'sequence': str(row.get('序号', '')).strip() if pd.notna(row.get('序号')) else '',
                    'material_name': str(row.get('物料名称', '')).strip(),
                    'specification': str(row.get('规格型号', '')).strip() if pd.notna(row.get('规格型号')) else '',
                    'unit': str(row.get('单位', '')).strip() if pd.notna(row.get('单位')) else '',
                    'quantity': _safe_float(row.get('数量'), errors, idx+2, '数量'),
                    'unit_price': _safe_float(row.get('单价'), errors, idx+2, '单价') if '单价' in df.columns else None,
                    'total_price': _safe_float(row.get('总价'), errors, idx+2, '总价') if '总价' in df.columns else None,
                    'remark': str(row.get('备注', '')).strip() if pd.notna(row.get('备注')) else '',
                }
                
                # 验证必填字段
                if not item['material_name']:
                    errors.append(f"第{idx+2}行: 物料名称不能为空")
                    continue
                
                if item['quantity'] is None or item['quantity'] <= 0:
                    errors.append(f"第{idx+2}行: 数量必须大于0")
                    continue
                
                # 如果总价为空但数量和单价都有，计算总价
                if item['total_price'] is None and item['unit_price'] is not None and item['quantity'] is not None:
                    item['total_price'] = float(item['quantity']) * float(item['unit_price'])
                
                data.append(item)
                
            except Exception as e:
                errors.append(f"第{idx+2}行处理失败: {str(e)}")
                continue
        
        if not data and not errors:
            errors.append("未找到有效数据")
            
    except Exception as e:
        errors.append(f"文件读取失败: {str(e)}")
    
    return data, errors


def _safe_float(value, errors: List[str], row_num: int, field_name: str):
    """安全转换为浮点数"""
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        errors.append(f"第{row_num}行: {field_name}格式错误，应为数字")
        return None


def export_bom_to_excel(bom_data: List[Dict], output_path: str):
    """导出BOM数据到Excel"""
    df = pd.DataFrame(bom_data)
    df.columns = ['序号', '物料名称', '规格型号', '单位', '数量', '单价', '总价', '备注']
    df.to_excel(output_path, index=False, engine='openpyxl')


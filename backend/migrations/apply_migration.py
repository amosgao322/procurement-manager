"""
数据库迁移脚本执行工具
用于执行SQL迁移脚本
"""
import sys
from pathlib import Path

# 添加 backend 目录到 Python 路径
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.database import engine
from sqlalchemy import text


def apply_migration():
    """执行迁移脚本"""
    sql_file = Path(__file__).parent / "add_bom_fields.sql"
    
    if not sql_file.exists():
        print(f"错误：找不到迁移文件 {sql_file}")
        return
    
    print(f"读取迁移文件: {sql_file}")
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # 分割SQL语句（按分号分割，但保留注释）
    statements = []
    current_statement = ""
    for line in sql_content.split('\n'):
        line = line.strip()
        if not line or line.startswith('--'):
            continue
        current_statement += line + '\n'
        if line.endswith(';'):
            statements.append(current_statement.strip())
            current_statement = ""
    
    if current_statement.strip():
        statements.append(current_statement.strip())
    
    print(f"找到 {len(statements)} 条SQL语句")
    
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            for i, statement in enumerate(statements, 1):
                if statement:
                    print(f"执行第 {i} 条SQL语句...")
                    conn.execute(text(statement))
            trans.commit()
            print("✅ 迁移成功完成！")
        except Exception as e:
            trans.rollback()
            print(f"❌ 迁移失败: {e}")
            raise


if __name__ == "__main__":
    print("=" * 60)
    print("BOM表字段迁移脚本")
    print("=" * 60)
    print()
    print("此脚本将为BOM表和BOM明细表添加以下新字段：")
    print("BOM表：客户名称、日期、版本号、销售渠道、制单人、核价人")
    print("BOM明细表：物料类别、材质/牌号、单重、总重、品牌/厂家、标准号/图床、表面处理")
    print()
    print("同时会将状态字段的英文值转换为中文值")
    print()
    response = input("是否继续执行迁移？(y/n): ")
    if response.lower() != 'y':
        print("已取消")
        sys.exit(0)
    
    print()
    apply_migration()


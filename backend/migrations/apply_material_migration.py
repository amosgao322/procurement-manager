"""
物料库字段迁移脚本执行工具
用于执行SQL迁移脚本，为 materials 表添加新字段并创建 material_price_histories 表
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
    sql_file = Path(__file__).parent / "add_material_fields_and_history.sql"
    
    if not sql_file.exists():
        print(f"错误：找不到迁移文件 {sql_file}")
        return False
    
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
                    print(f"SQL: {statement[:100]}...")  # 只打印前100个字符
                    conn.execute(text(statement))
            trans.commit()
            print("[SUCCESS] 迁移成功完成！")
            return True
        except Exception as e:
            trans.rollback()
            print(f"[ERROR] 迁移失败: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    print("=" * 60)
    print("物料库字段迁移脚本")
    print("=" * 60)
    print()
    print("此脚本将为 materials 表添加以下新字段：")
    print("  - price_status: 价格有效性状态")
    print("  - status_reason: 状态原因")
    print("  - currency: 币种")
    print("  - last_price: 最近价格")
    print()
    print("同时将创建 material_price_histories 表用于存储价格历史")
    print()
    
    # 支持非交互式执行（通过命令行参数 --yes）
    auto_confirm = len(sys.argv) > 1 and sys.argv[1] == '--yes'
    if not auto_confirm:
        try:
            response = input("是否继续执行迁移？(y/n): ")
            if response.lower() != 'y':
                print("已取消")
                sys.exit(0)
        except EOFError:
            print("非交互式环境，使用 --yes 参数自动确认")
            sys.exit(1)
    
    print()
    success = apply_migration()
    if success:
        print("\n[SUCCESS] 迁移完成！现在可以重启后端服务并测试物料库功能。")
    else:
        print("\n[ERROR] 迁移失败，请检查错误信息并修复后重试。")
        sys.exit(1)


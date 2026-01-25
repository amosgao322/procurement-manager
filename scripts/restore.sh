#!/bin/bash
# 数据恢复脚本
# 使用方法: ./restore.sh [备份文件路径]

set -e

# 配置变量
APP_DIR="/opt/procurement-manager"
DB_NAME="procurement_manager"
DB_USER="procurement_user"
DB_PASSWORD=""  # 从.env文件读取或手动设置

# 读取数据库密码（从.env文件）
if [ -f "$APP_DIR/backend/.env" ]; then
    DB_PASSWORD=$(grep MYSQL_PASSWORD "$APP_DIR/backend/.env" | cut -d '=' -f2 | tr -d ' ')
fi

# 如果密码为空，提示输入
if [ -z "$DB_PASSWORD" ]; then
    echo "请输入数据库密码:"
    read -s DB_PASSWORD
fi

# 检查参数
if [ -z "$1" ]; then
    echo "使用方法: $0 <备份文件路径>"
    echo ""
    echo "示例:"
    echo "  $0 /opt/procurement-manager/backups/db_backup_20240101_120000.sql.gz"
    echo "  $0 /opt/procurement-manager/backups/files_backup_20240101_120000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "=========================================="
echo "数据恢复 - $(date)"
echo "=========================================="
echo "备份文件: $BACKUP_FILE"
echo ""

# 确认操作
read -p "警告: 此操作将覆盖现有数据，是否继续? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

# 判断备份类型
if [[ "$BACKUP_FILE" == *"db_backup"* ]]; then
    # 恢复数据库
    echo "正在恢复数据库..."
    
    # 解压（如果是压缩文件）
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        TEMP_FILE="/tmp/db_restore_$(date +%s).sql"
        gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
        mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$TEMP_FILE"
        rm "$TEMP_FILE"
    else
        mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$BACKUP_FILE"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✓ 数据库恢复完成"
    else
        echo "✗ 数据库恢复失败"
        exit 1
    fi
    
elif [[ "$BACKUP_FILE" == *"files_backup"* ]]; then
    # 恢复文件
    echo "正在恢复上传文件..."
    
    # 备份当前文件（以防万一）
    BACKUP_CURRENT="/tmp/uploads_backup_$(date +%s).tar.gz"
    if [ -d "$APP_DIR/backend/uploads" ]; then
        tar -czf "$BACKUP_CURRENT" -C "$APP_DIR/backend" uploads/
        echo "当前文件已备份到: $BACKUP_CURRENT"
    fi
    
    # 恢复文件
    tar -xzf "$BACKUP_FILE" -C "$APP_DIR/backend"
    chmod -R 755 "$APP_DIR/backend/uploads"
    
    if [ $? -eq 0 ]; then
        echo "✓ 文件恢复完成"
    else
        echo "✗ 文件恢复失败"
        exit 1
    fi
else
    echo "错误: 无法识别备份文件类型"
    echo "备份文件名应包含 'db_backup' 或 'files_backup'"
    exit 1
fi

echo ""
echo "=========================================="
echo "恢复完成 - $(date)"
echo "=========================================="
echo ""
echo "注意: 如果恢复了数据库，可能需要重启后端服务:"
echo "  sudo systemctl restart procurement-api"


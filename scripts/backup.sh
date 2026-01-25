#!/bin/bash
# 数据库和文件备份脚本
# 使用方法: ./backup.sh

set -e

# 配置变量
BACKUP_DIR="/opt/procurement-manager/backups"
APP_DIR="/opt/procurement-manager"
DB_NAME="procurement_manager"
DB_USER="procurement_user"
DB_PASSWORD=""  # 从.env文件读取或手动设置
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 读取数据库密码（从.env文件）
if [ -f "$APP_DIR/backend/.env" ]; then
    DB_PASSWORD=$(grep MYSQL_PASSWORD "$APP_DIR/backend/.env" | cut -d '=' -f2 | tr -d ' ')
fi

# 如果密码为空，提示输入
if [ -z "$DB_PASSWORD" ]; then
    echo "请输入数据库密码:"
    read -s DB_PASSWORD
fi

echo "=========================================="
echo "开始备份 - $(date)"
echo "=========================================="

# 1. 备份数据库
echo "正在备份数据库..."
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$DB_BACKUP_FILE"

if [ $? -eq 0 ]; then
    # 压缩数据库备份
    gzip "$DB_BACKUP_FILE"
    echo "✓ 数据库备份完成: ${DB_BACKUP_FILE}.gz"
else
    echo "✗ 数据库备份失败"
    exit 1
fi

# 2. 备份上传文件
echo "正在备份上传文件..."
FILES_BACKUP_FILE="$BACKUP_DIR/files_backup_$DATE.tar.gz"
tar -czf "$FILES_BACKUP_FILE" -C "$APP_DIR/backend" uploads/

if [ $? -eq 0 ]; then
    echo "✓ 文件备份完成: $FILES_BACKUP_FILE"
else
    echo "✗ 文件备份失败"
    exit 1
fi

# 3. 清理旧备份（保留最近30天）
echo "正在清理旧备份..."
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "✓ 已清理超过 $RETENTION_DAYS 天的旧备份"

# 4. 显示备份信息
echo ""
echo "=========================================="
echo "备份完成 - $(date)"
echo "=========================================="
echo "数据库备份: ${DB_BACKUP_FILE}.gz"
echo "文件备份: $FILES_BACKUP_FILE"
echo "备份大小:"
du -h "$BACKUP_DIR"/*_backup_* | tail -2
echo ""


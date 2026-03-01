#!/bin/bash
# Docker 部署脚本
# 使用方法: ./deploy.sh [version]

set -e

VERSION=${1:-latest}
CONTAINER_NAME="procurement-manager"
IMAGE_NAME="procurement-manager"

echo "=========================================="
echo "开始部署采购管理系统"
echo "=========================================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "警告: .env 文件不存在，将使用默认配置"
    echo "建议创建 .env 文件并配置数据库连接信息"
fi

# 构建镜像
echo ""
echo "步骤 1/4: 构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:${VERSION} .

if [ $? -ne 0 ]; then
    echo "错误: 镜像构建失败"
    exit 1
fi

echo "✓ 镜像构建成功"

# 停止旧容器（如果存在）
echo ""
echo "步骤 2/4: 停止旧容器..."
if docker ps -a | grep -q ${CONTAINER_NAME}; then
    docker stop ${CONTAINER_NAME} > /dev/null 2>&1 || true
    docker rm ${CONTAINER_NAME} > /dev/null 2>&1 || true
    echo "✓ 旧容器已停止并删除"
else
    echo "✓ 没有运行中的旧容器"
fi

# 创建必要的目录
echo ""
echo "步骤 3/4: 创建必要的目录..."
mkdir -p backend/uploads/contract_templates
chmod -R 755 backend/uploads
echo "✓ 目录创建完成"

# 启动新容器
echo ""
echo "步骤 4/4: 启动新容器..."

if [ -f .env ]; then
    # 使用 .env 文件
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p 80:80 \
        --env-file .env \
        -v $(pwd)/backend/uploads:/app/uploads \
        -v $(pwd)/logs:/app/logs \
        ${IMAGE_NAME}:${VERSION}
else
    # 使用环境变量（需要手动设置）
    echo "警告: 未找到 .env 文件，请确保已设置环境变量"
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p 80:80 \
        -e MYSQL_HOST=${MYSQL_HOST:-localhost} \
        -e MYSQL_PORT=${MYSQL_PORT:-3306} \
        -e MYSQL_USER=${MYSQL_USER:-root} \
        -e MYSQL_PASSWORD=${MYSQL_PASSWORD:-password} \
        -e MYSQL_DATABASE=${MYSQL_DATABASE:-procurement_manager} \
        -e SECRET_KEY=${SECRET_KEY:-change-me} \
        -e CORS_ORIGINS=${CORS_ORIGINS:-'["http://localhost"]'} \
        -v $(pwd)/backend/uploads:/app/uploads \
        -v $(pwd)/logs:/app/logs \
        ${IMAGE_NAME}:${VERSION}
fi

if [ $? -ne 0 ]; then
    echo "错误: 容器启动失败"
    exit 1
fi

echo "✓ 容器启动成功"

# 等待服务启动
echo ""
echo "等待服务启动..."
sleep 10

# 检查健康状态
echo ""
echo "检查服务健康状态..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✓ 服务运行正常"
else
    echo "警告: 健康检查失败，请查看日志: docker logs ${CONTAINER_NAME}"
fi

# 显示容器信息
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "容器名称: ${CONTAINER_NAME}"
echo "镜像版本: ${IMAGE_NAME}:${VERSION}"
echo ""
echo "常用命令:"
echo "  查看日志: docker logs -f ${CONTAINER_NAME}"
echo "  停止服务: docker stop ${CONTAINER_NAME}"
echo "  重启服务: docker restart ${CONTAINER_NAME}"
echo "  查看状态: docker ps | grep ${CONTAINER_NAME}"
echo ""
echo "访问地址: http://localhost"
echo "健康检查: http://localhost/health"
echo ""

























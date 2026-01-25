# 多阶段构建 Dockerfile
# 阶段1: 前端构建
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm install --legacy-peer-deps

# 复制前端源代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 阶段2: 后端运行环境
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制后端依赖文件
COPY backend/requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# 复制后端源代码
COPY backend/ ./

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# 复制 Nginx 配置
COPY docker/nginx.conf /etc/nginx/sites-available/default

# 创建必要的目录
RUN mkdir -p /app/uploads/contract_templates && \
    chmod -R 755 /app/uploads

# 创建启动脚本
RUN echo '#!/bin/bash\n\
set -e\n\
# 启动 Nginx\n\
service nginx start\n\
# 初始化数据库（如果需要）\n\
if [ "$INIT_DB" = "true" ]; then\n\
    echo "初始化数据库..."\n\
    python -m app.core.init_db || true\n\
fi\n\
# 启动后端服务\n\
cd /app && exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 --access-logfile - --error-logfile - app.main:app' > /app/start.sh && \
    chmod +x /app/start.sh

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# 启动命令
CMD ["/app/start.sh"]


# Docker 快速开始指南

## 🚀 5 分钟快速部署

### 前提条件

- ✅ 已安装 Docker Desktop（Windows/Mac）或 Docker（Linux）
- ✅ 已准备好 MySQL 数据库（本地或远程）

### 步骤1：构建镜像（本地）

```bash
# 在项目根目录执行
docker build -t procurement-manager:latest .
```

**预计时间**：5-10 分钟（首次构建）

### 步骤2：创建环境变量文件

创建 `.env` 文件：

```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的密码
MYSQL_DATABASE=procurement_manager
SECRET_KEY=你的JWT密钥（使用 openssl rand -hex 32 生成）
CORS_ORIGINS=["http://localhost:8080"]
INIT_DB=true
```

### 步骤3：运行容器

```bash
# 使用 docker-compose（推荐）
docker-compose up -d

# 或使用 docker run
docker run -d \
  --name procurement-manager \
  -p 8080:80 \
  --env-file .env \
  procurement-manager:latest
```

### 步骤4：访问应用

打开浏览器访问：`http://localhost:8080`

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

### 步骤5：查看日志

```bash
# 使用 docker-compose
docker-compose logs -f

# 或使用 docker
docker logs -f procurement-manager
```

---

## 📦 部署到生产服务器

### 方式A：镜像导出/导入（推荐）

#### 1. 本地导出镜像

```bash
docker save procurement-manager:latest > procurement-manager.tar
```

#### 2. 传输到服务器

```bash
# Windows PowerShell
scp procurement-manager.tar ubuntu@你的服务器IP:/tmp/
```

#### 3. 服务器上导入并运行

```bash
# SSH 登录服务器
ssh ubuntu@你的服务器IP

# 安装 Docker（如果还没安装）
curl -fsSL https://get.docker.com | sh

# 导入镜像
docker load < /tmp/procurement-manager.tar

# 创建 .env 文件
cat > .env << 'EOF'
MYSQL_HOST=你的数据库地址
MYSQL_PORT=3306
MYSQL_USER=你的数据库用户
MYSQL_PASSWORD=你的数据库密码
MYSQL_DATABASE=procurement_manager
SECRET_KEY=你的JWT密钥
CORS_ORIGINS=["https://gaohuaiyu.vip","http://gaohuaiyu.vip"]
INIT_DB=true
EOF

# 创建上传目录
mkdir -p backend/uploads
chmod -R 755 backend/uploads

# 运行容器
docker run -d \
  --name procurement-manager \
  --restart unless-stopped \
  -p 80:80 \
  --env-file .env \
  -v $(pwd)/backend/uploads:/app/uploads \
  procurement-manager:latest

# 查看日志
docker logs -f procurement-manager
```

### 方式B：在服务器上直接构建

```bash
# SSH 登录服务器
ssh ubuntu@你的服务器IP

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 克隆代码
cd /var/www
git clone https://github.com/amosgao322/procurement-manager.git
cd procurement-manager

# 创建 .env 文件（同上）

# 构建镜像
docker build -t procurement-manager:latest .

# 运行容器（同上）
docker-compose up -d
```

---

## 🔄 更新应用

### 方式A：使用镜像导出/导入

```bash
# 1. 本地构建新镜像
docker build -t procurement-manager:v1.1.0 .

# 2. 导出镜像
docker save procurement-manager:v1.1.0 > procurement-manager-v1.1.0.tar

# 3. 传输到服务器
scp procurement-manager-v1.1.0.tar ubuntu@你的服务器IP:/tmp/

# 4. 在服务器上更新
ssh ubuntu@你的服务器IP
docker load < /tmp/procurement-manager-v1.1.0.tar
docker stop procurement-manager
docker rm procurement-manager
docker run -d \
  --name procurement-manager \
  --restart unless-stopped \
  -p 80:80 \
  --env-file .env \
  -v $(pwd)/backend/uploads:/app/uploads \
  procurement-manager:v1.1.0
```

### 方式B：使用 Git + 重新构建

```bash
# 在服务器上
cd /var/www/procurement-manager
git pull
docker build -t procurement-manager:latest .
docker-compose down
docker-compose up -d
```

---

## 🛠️ 常用命令

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs -f procurement-manager

# 停止容器
docker stop procurement-manager

# 启动容器
docker start procurement-manager

# 重启容器
docker restart procurement-manager

# 删除容器
docker rm procurement-manager

# 进入容器（调试用）
docker exec -it procurement-manager /bin/bash

# 查看容器资源使用
docker stats procurement-manager
```

---

## ❓ 常见问题

### Q1: 构建镜像时网络超时？

**A**: 使用国内镜像源或配置代理

### Q2: 容器启动后无法连接数据库？

**A**: 检查环境变量和数据库连接配置

### Q3: 前端页面空白？

**A**: 检查容器日志：`docker logs procurement-manager`

### Q4: 文件上传失败？

**A**: 检查上传目录权限和挂载配置

---

## 📚 详细文档

查看完整文档：`docs/docker_deployment.md`

---

**提示**：首次部署建议先在本地测试，确认无误后再部署到生产环境。


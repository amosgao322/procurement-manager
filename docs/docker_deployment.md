# Docker 容器化部署指南

## 目录

1. [Docker 简介](#docker-简介)
2. [准备工作](#准备工作)
3. [本地构建和测试](#本地构建和测试)
4. [推送到远程服务器](#推送到远程服务器)
5. [生产环境部署](#生产环境部署)
6. [更新和回滚](#更新和回滚)
7. [常见问题](#常见问题)
8. [最佳实践](#最佳实践)

---

## Docker 简介

### 什么是 Docker？

Docker 是一种容器化技术，可以将应用程序及其依赖打包成一个独立的容器，实现"一次构建，到处运行"。

### 为什么使用 Docker？

- ✅ **环境一致性**：开发、测试、生产环境完全一致
- ✅ **部署简单**：服务器只需安装 Docker，无需安装 Python、Node.js 等
- ✅ **更新方便**：拉取新镜像即可，无需重新安装依赖
- ✅ **隔离性好**：容器之间互不影响
- ✅ **回滚容易**：切换镜像版本即可

---

## 准备工作

### 1. 安装 Docker（本地开发环境）

#### Windows

1. 下载 Docker Desktop：https://www.docker.com/products/docker-desktop/
2. 安装并启动 Docker Desktop
3. 验证安装：
```bash
docker --version
docker-compose --version
```

#### macOS

```bash
# 使用 Homebrew 安装
brew install --cask docker

# 或下载 Docker Desktop
# https://www.docker.com/products/docker-desktop/
```

#### Linux (Ubuntu/Debian)

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组（避免每次使用 sudo）
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 验证安装
docker --version
```

### 2. 准备项目文件

确保项目包含以下文件：
- `Dockerfile` - Docker 镜像构建文件
- `docker-compose.yml` - Docker Compose 编排文件（可选）
- `.dockerignore` - Docker 构建忽略文件
- `docker/nginx.conf` - Nginx 配置文件

---

## 本地构建和测试

### 步骤1：构建 Docker 镜像

在项目根目录执行：

```bash
# 构建镜像（首次构建可能需要 5-10 分钟）
docker build -t procurement-manager:latest .

# 查看构建的镜像
docker images | grep procurement-manager
```

**构建过程说明**：
- 第一阶段：使用 Node.js 构建前端（生成 `dist/` 目录）
- 第二阶段：使用 Python 运行后端，并复制前端构建产物

### 步骤2：创建环境变量文件（可选）

创建 `.env` 文件（用于 docker-compose）：

```bash
# .env 文件
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的数据库密码
MYSQL_DATABASE=procurement_manager
SECRET_KEY=你的JWT密钥（使用 openssl rand -hex 32 生成）
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
INIT_DB=false
```

### 步骤3：本地测试运行

#### 方式A：使用 docker run（直接运行）

```bash
docker run -d \
  --name procurement-manager-test \
  -p 8080:80 \
  -e MYSQL_HOST=localhost \
  -e MYSQL_PORT=3306 \
  -e MYSQL_USER=root \
  -e MYSQL_PASSWORD=Gg1936279628 \
  -e MYSQL_DATABASE=procurement_manager \
  -e SECRET_KEY=你的JWT密钥 \
  -e CORS_ORIGINS='["http://localhost:8080"]' \
  -e INIT_DB=true \
  procurement-manager:latest
```
GRANT ALL PRIVILEGES ON procurement_manager.* TO 'root'@'%' IDENTIFIED BY 'Gg1936279628';

**参数说明**：
- `-d`: 后台运行
- `--name`: 容器名称
- `-p 8080:80`: 端口映射（本地8080 → 容器80）
- `-e`: 环境变量
- `host.docker.internal`: Windows/Mac 访问宿主机 MySQL 的特殊地址

#### 方式B：使用 docker-compose（推荐）

```bash
# 使用 docker-compose 运行
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 步骤4：验证运行

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs procurement-manager-test

# 或使用 docker-compose
docker-compose logs -f app

# 测试访问
curl http://localhost:8080/api/v1/health
```

在浏览器访问：`http://localhost:8080`

### 步骤5：停止测试容器

```bash
# 停止并删除容器
docker stop procurement-manager-test
docker rm procurement-manager-test

# 或使用 docker-compose
docker-compose down
```

---

## 推送到远程服务器

### 方式A：使用 Docker 镜像导出/导入（推荐，简单）

#### 步骤1：在本地导出镜像

```bash
# 导出镜像为 tar 文件
docker save procurement-manager:latest > procurement-manager.tar

# 查看文件大小（通常几百MB到几GB）
ls -lh procurement-manager.tar
```

#### 步骤2：传输到服务器

**使用 SCP（推荐）**：

```bash
# Windows PowerShell
scp procurement-manager.tar ubuntu@你的服务器IP:/tmp/

# Linux/Mac
scp procurement-manager.tar ubuntu@你的服务器IP:/tmp/
```

**使用 WinSCP（图形化工具）**：
1. 下载 WinSCP：https://winscp.net/
2. 连接服务器
3. 拖拽 `procurement-manager.tar` 到 `/tmp/` 目录

#### 步骤3：在服务器上导入镜像

```bash
# SSH 登录服务器
ssh ubuntu@你的服务器IP

# 导入镜像
docker load < /tmp/procurement-manager.tar

# 验证镜像
docker images | grep procurement-manager

# 清理临时文件
rm /tmp/procurement-manager.tar
```

### 方式B：使用 Docker Registry（适合频繁更新）

#### 步骤1：推送到 Docker Hub（需要注册账号）

```bash
# 登录 Docker Hub
docker login

# 标记镜像
docker tag procurement-manager:latest 你的用户名/procurement-manager:latest

# 推送镜像
docker push 你的用户名/procurement-manager:latest
```

#### 步骤2：在服务器上拉取镜像

```bash
# 登录 Docker Hub
docker login

# 拉取镜像
docker pull 你的用户名/procurement-manager:latest
```

### 方式C：在服务器上直接构建（如果代码在 Git 仓库）

```bash
# SSH 登录服务器
ssh ubuntu@你的服务器IP

# 克隆代码
cd /var/www
git clone https://github.com/amosgao322/procurement-manager.git
cd procurement-manager

# 构建镜像
docker build -t procurement-manager:latest .
```

---

## 生产环境部署

### 步骤1：在服务器上安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

### 步骤2：准备部署目录

```bash
# 创建部署目录
sudo mkdir -p /var/www/procurement-manager
sudo chown -R $USER:$USER /var/www/procurement-manager
cd /var/www/procurement-manager

# 如果使用镜像导入方式，镜像已经导入，跳过此步
# 如果使用 Git 方式，克隆代码：
git clone https://github.com/amosgao322/procurement-manager.git .
```

### 步骤3：创建环境变量文件

```bash
cd /var/www/procurement-manager

# 创建 .env 文件
cat > .env << 'EOF'
MYSQL_HOST=你的数据库地址
MYSQL_PORT=3306
MYSQL_USER=你的数据库用户
MYSQL_PASSWORD=你的数据库密码
MYSQL_DATABASE=procurement_manager
SECRET_KEY=你的JWT密钥（使用 openssl rand -hex 32 生成）
CORS_ORIGINS=["https://gaohuaiyu.vip","http://gaohuaiyu.vip"]
INIT_DB=true
EOF

# 编辑 .env 文件，填入实际值
nano .env
```

### 步骤4：创建上传目录

```bash
# 创建上传目录
mkdir -p backend/uploads/contract_templates
chmod -R 755 backend/uploads
```

### 步骤5：运行容器
sudo ufw allow 443/tcp
```

### 步骤8：配置域名和 HTTPS（可选）

如果需要配置域名和 HTTPS，可以使用 Nginx 反向代理或直接在容器中配置。

---

## 更新和回滚

### 更新应用

#### 方式A：使用镜像导出/导入

```bash
# 1. 在本地构建新镜像
docker build -t procurement-manager:v1.1.0 .

# 2. 导出新镜像
docker save procurement-manager:v1.1.0 > procurement-manager-v1.1.0.tar

# 3. 传输到服务器
scp procurement-manager-v1.1.0.tar ubuntu@你的服务器IP:/tmp/

# 4. 在服务器上导入
ssh ubuntu@你的服务器IP
docker load < /tmp/procurement-manager-v1.1.0.tar

# 5. 停止旧容器
docker stop procurement-manager
docker rm procurement-manager

# 6. 启动新容器（使用上面的 docker run 或 docker-compose 命令）
docker run -d \
  --name procurement-manager \
  --restart unless-stopped \
  -p 80:80 \
  --env-file .env \
  -v $(pwd)/backend/uploads:/app/uploads \
  procurement-manager:v1.1.0
```

#### 方式B：使用 Git + 重新构建

```bash
# 1. 在服务器上拉取最新代码
cd /var/www/procurement-manager
git pull

# 2. 重新构建镜像
docker build -t procurement-manager:latest .

# 3. 停止旧容器
docker-compose down

# 4. 启动新容器
docker-compose up -d
```

### 回滚到旧版本

```bash
# 1. 停止当前容器
docker stop procurement-manager
docker rm procurement-manager

# 2. 启动旧版本镜像（假设旧版本标签为 v1.0.0）
docker run -d \
  --name procurement-manager \
  --restart unless-stopped \
  -p 80:80 \
  --env-file .env \
  -v $(pwd)/backend/uploads:/app/uploads \
  procurement-manager:v1.0.0
```

---

## 常用 Docker 命令

### 镜像管理

```bash
# 查看所有镜像
docker images

# 删除镜像
docker rmi procurement-manager:latest

# 查看镜像详细信息
docker inspect procurement-manager:latest
```

### 容器管理

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 停止容器
docker stop procurement-manager

# 启动容器
docker start procurement-manager

# 重启容器
docker restart procurement-manager

# 删除容器
docker rm procurement-manager

# 强制删除运行中的容器
docker rm -f procurement-manager
```

### 日志和调试

```bash
# 查看容器日志
docker logs procurement-manager

# 实时查看日志
docker logs -f procurement-manager

# 查看最近 100 行日志
docker logs --tail 100 procurement-manager

# 进入容器内部（调试用）
docker exec -it procurement-manager /bin/bash

# 查看容器资源使用情况
docker stats procurement-manager
```

### Docker Compose 命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 构建镜像
docker-compose build

# 重新构建并启动
docker-compose up -d --build
```

---

## 常见问题

### 问题1：构建镜像时网络超时

**解决方案**：
```bash
# 使用国内镜像源（在 Dockerfile 中添加）
# 或在构建时使用代理
docker build --build-arg HTTP_PROXY=http://代理地址 --build-arg HTTPS_PROXY=http://代理地址 -t procurement-manager:latest .
```

### 问题2：容器启动后无法连接数据库

**检查清单**：
1. 检查环境变量是否正确
2. 检查数据库是否允许远程连接
3. 检查防火墙和安全组配置
4. 查看容器日志：`docker logs procurement-manager`

### 问题3：前端页面空白或 404

**解决方案**：
```bash
# 检查前端构建是否成功
docker exec -it procurement-manager ls -la /app/frontend/dist

# 检查 Nginx 配置
docker exec -it procurement-manager cat /etc/nginx/sites-available/default

# 重启容器
docker restart procurement-manager
```

### 问题4：文件上传失败

**解决方案**：
```bash
# 检查上传目录权限
docker exec -it procurement-manager ls -la /app/uploads

# 检查目录挂载
docker inspect procurement-manager | grep Mounts

# 确保挂载目录存在且有权限
mkdir -p backend/uploads
chmod -R 755 backend/uploads
```

### 问题5：容器内存不足

**解决方案**：
```bash
# 查看容器资源使用
docker stats procurement-manager

# 限制容器内存使用（在 docker run 中添加）
docker run -d --memory="512m" --name procurement-manager ...
```

### 问题6：端口被占用

**解决方案**：
```bash
# 查看端口占用
sudo netstat -tlnp | grep 80

# 停止占用端口的进程或使用其他端口
docker run -d -p 8080:80 ...
```

---

## 最佳实践

### 1. 镜像版本管理

```bash
# 使用版本标签而不是 latest
docker build -t procurement-manager:v1.0.0 .
docker build -t procurement-manager:v1.1.0 .

# 保留多个版本以便回滚
docker tag procurement-manager:v1.0.0 procurement-manager:backup
```

### 2. 数据持久化

```bash
# 使用 volume 挂载重要数据
-v $(pwd)/backend/uploads:/app/uploads
-v $(pwd)/logs:/app/logs

# 或使用命名 volume
docker volume create procurement-uploads
-v procurement-uploads:/app/uploads
```

### 3. 环境变量管理

```bash
# 使用 .env 文件而不是硬编码
--env-file .env

# 敏感信息使用 secrets（生产环境）
docker secret create mysql_password ./mysql_password.txt
```

### 4. 健康检查

```bash
# 在 Dockerfile 中已配置健康检查
# 可以手动检查
docker inspect --format='{{.State.Health.Status}}' procurement-manager
```

### 5. 日志管理

```bash
# 配置日志轮转（在 docker run 中添加）
--log-driver json-file \
--log-opt max-size=10m \
--log-opt max-file=3
```

### 6. 资源限制

```bash
# 限制 CPU 和内存
docker run -d \
  --cpus="1.0" \
  --memory="512m" \
  --name procurement-manager ...
```

### 7. 安全建议

- ✅ 不要在镜像中硬编码密码
- ✅ 使用非 root 用户运行容器（如果需要）
- ✅ 定期更新基础镜像
- ✅ 扫描镜像漏洞：`docker scan procurement-manager:latest`

---

## 总结

使用 Docker 部署的优势：

1. **简化部署**：服务器只需 Docker，无需安装各种环境
2. **快速更新**：拉取新镜像即可，无需重新安装依赖
3. **环境一致**：开发、测试、生产环境完全一致
4. **易于回滚**：切换镜像版本即可

**推荐工作流程**：

1. 本地开发 → 测试
2. 构建镜像 → 本地测试
3. 导出镜像 → 传输到服务器
4. 导入镜像 → 运行容器
5. 验证部署 → 完成

**更新流程**：

1. 修改代码 → 构建新镜像
2. 导出镜像 → 传输到服务器
3. 停止旧容器 → 启动新容器
4. 验证更新 → 完成

---

## 附录

### A. 完整的部署脚本示例

创建 `deploy.sh`：

```bash
#!/bin/bash
set -e

echo "开始部署..."

# 1. 构建镜像
echo "构建镜像..."
docker build -t procurement-manager:latest .

# 2. 停止旧容器
echo "停止旧容器..."
docker stop procurement-manager || true
docker rm procurement-manager || true

# 3. 启动新容器
echo "启动新容器..."
docker run -d \
  --name procurement-manager \
  --restart unless-stopped \
  -p 80:80 \
  --env-file .env \
  -v $(pwd)/backend/uploads:/app/uploads \
  procurement-manager:latest

# 4. 等待服务启动
echo "等待服务启动..."
sleep 10

# 5. 检查健康状态
echo "检查健康状态..."
curl -f http://localhost/health || exit 1

echo "部署完成！"
```

使用：
```bash
chmod +x deploy.sh
./deploy.sh
```

### B. 监控脚本示例

创建 `monitor.sh`：

```bash
#!/bin/bash

# 检查容器状态
if ! docker ps | grep -q procurement-manager; then
    echo "警告：容器未运行！"
    docker start procurement-manager
fi

# 检查健康状态
if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "警告：健康检查失败！"
    docker restart procurement-manager
fi
```

添加到 crontab：
```bash
# 每 5 分钟检查一次
*/5 * * * * /path/to/monitor.sh
```

---

**文档版本**：v1.0.0  
**最后更新**：2024年


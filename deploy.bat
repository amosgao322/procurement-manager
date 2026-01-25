@echo off
REM Docker 部署脚本 (Windows)
REM 使用方法: deploy.bat [version]

setlocal enabledelayedexpansion

set VERSION=%1
if "%VERSION%"=="" set VERSION=latest

set CONTAINER_NAME=procurement-manager
set IMAGE_NAME=procurement-manager

echo ==========================================
echo 开始部署采购管理系统
echo ==========================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

REM 构建镜像
echo 步骤 1/4: 构建 Docker 镜像...
docker build -t %IMAGE_NAME%:%VERSION% .
if errorlevel 1 (
    echo 错误: 镜像构建失败
    pause
    exit /b 1
)
echo ✓ 镜像构建成功
echo.

REM 停止旧容器
echo 步骤 2/4: 停止旧容器...
docker ps -a | findstr %CONTAINER_NAME% >nul 2>&1
if not errorlevel 1 (
    docker stop %CONTAINER_NAME% >nul 2>&1
    docker rm %CONTAINER_NAME% >nul 2>&1
    echo ✓ 旧容器已停止并删除
) else (
    echo ✓ 没有运行中的旧容器
)
echo.

REM 创建目录
echo 步骤 3/4: 创建必要的目录...
if not exist "backend\uploads\contract_templates" mkdir "backend\uploads\contract_templates"
echo ✓ 目录创建完成
echo.

REM 启动新容器
echo 步骤 4/4: 启动新容器...
if exist .env (
    docker run -d --name %CONTAINER_NAME% --restart unless-stopped -p 80:80 --env-file .env -v "%CD%\backend\uploads:/app/uploads" %IMAGE_NAME%:%VERSION%
) else (
    echo 警告: 未找到 .env 文件，请确保已设置环境变量
    docker run -d --name %CONTAINER_NAME% --restart unless-stopped -p 80:80 -e MYSQL_HOST=localhost -e MYSQL_PORT=3306 -e MYSQL_USER=root -e MYSQL_PASSWORD=password -e MYSQL_DATABASE=procurement_manager -e SECRET_KEY=change-me -v "%CD%\backend\uploads:/app/uploads" %IMAGE_NAME%:%VERSION%
)

if errorlevel 1 (
    echo 错误: 容器启动失败
    pause
    exit /b 1
)
echo ✓ 容器启动成功
echo.

REM 等待服务启动
echo 等待服务启动...
timeout /t 10 /nobreak >nul

echo ==========================================
echo 部署完成！
echo ==========================================
echo.
echo 容器名称: %CONTAINER_NAME%
echo 镜像版本: %IMAGE_NAME%:%VERSION%
echo.
echo 常用命令:
echo   查看日志: docker logs -f %CONTAINER_NAME%
echo   停止服务: docker stop %CONTAINER_NAME%
echo   重启服务: docker restart %CONTAINER_NAME%
echo.
echo 访问地址: http://localhost
echo.

pause


















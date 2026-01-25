# Docker 修复脚本
# 用于修复 Docker Desktop Linux Engine 连接问题

$logPath = ".cursor\debug.log"
$sessionId = "debug-session"
$runId = "docker-fix-$(Get-Date -Format 'yyyyMMddHHmmss')"

function Write-DebugLog {
    param(
        [string]$hypothesisId,
        [string]$location,
        [string]$message,
        [hashtable]$data
    )
    
    $logEntry = @{
        sessionId = $sessionId
        runId = $runId
        hypothesisId = $hypothesisId
        location = $location
        message = $message
        data = $data
        timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    } | ConvertTo-Json -Compress
    
    Add-Content -Path $logPath -Value $logEntry
}

Write-Host "=== Docker 修复开始 ===" -ForegroundColor Cyan

# 步骤 1: 重启 Docker Desktop 服务
Write-Host "`n[步骤 1] 重启 Docker Desktop 服务..." -ForegroundColor Yellow
try {
    $service = Get-Service -Name "com.docker.service" -ErrorAction Stop
    Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:重启服务" -message "开始重启服务" -data @{serviceName=$service.Name; currentStatus=$service.Status}
    
    if ($service.Status -eq 'Running') {
        Restart-Service -Name "com.docker.service" -Force
        Write-Host "服务已重启" -ForegroundColor Green
        Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:重启服务" -message "服务重启成功" -data @{success=$true}
    } else {
        Start-Service -Name "com.docker.service"
        Write-Host "服务已启动" -ForegroundColor Green
        Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:启动服务" -message "服务启动成功" -data @{success=$true}
    }
    
    # 等待服务稳定
    Start-Sleep -Seconds 5
} catch {
    Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:重启服务异常" -message "重启服务失败" -data @{error=$_.Exception.Message}
    Write-Host "重启服务时出错: $($_.Exception.Message)" -ForegroundColor Red
}

# 步骤 2: 检查 Docker Desktop 是否正在运行，如果没有则启动
Write-Host "`n[步骤 2] 检查 Docker Desktop 应用程序..." -ForegroundColor Yellow
try {
    $desktopProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    if (-not $desktopProcess) {
        Write-Host "Docker Desktop 未运行，尝试启动..." -ForegroundColor Yellow
        Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:启动Desktop" -message "Docker Desktop未运行" -data @{}
        
        $desktopPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $desktopPath) {
            Start-Process -FilePath $desktopPath
            Write-Host "Docker Desktop 启动命令已执行，请等待启动完成..." -ForegroundColor Green
            Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:启动Desktop" -message "启动命令已执行" -data @{path=$desktopPath}
            Write-Host "等待 30 秒让 Docker Desktop 完全启动..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
        } else {
            Write-Host "未找到 Docker Desktop 可执行文件" -ForegroundColor Red
            Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:启动Desktop" -message "未找到可执行文件" -data @{path=$desktopPath}
        }
    } else {
        Write-Host "Docker Desktop 正在运行" -ForegroundColor Green
        Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:检查Desktop" -message "Docker Desktop正在运行" -data @{processCount=$desktopProcess.Count}
    }
} catch {
    Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:检查Desktop异常" -message "检查Desktop时出错" -data @{error=$_.Exception.Message}
    Write-Host "检查 Docker Desktop 时出错: $($_.Exception.Message)" -ForegroundColor Red
}

# 步骤 3: 验证修复
Write-Host "`n[步骤 3] 验证 Docker 连接..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker 连接成功！" -ForegroundColor Green
        Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:验证修复" -message "修复成功" -data @{success=$true; exitCode=0}
        
        # 显示 Docker 信息摘要
        $serverVersion = docker version --format '{{.Server.Version}}' 2>&1
        Write-Host "Docker 服务器版本: $serverVersion" -ForegroundColor Cyan
    } else {
        $errorOutput = $dockerInfo | Out-String
        Write-Host "❌ Docker 连接仍然失败" -ForegroundColor Red
        Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:验证修复" -message "修复失败" -data @{error=$errorOutput; exitCode=$LASTEXITCODE}
        Write-Host $errorOutput
        
        Write-Host "`n建议的后续操作:" -ForegroundColor Yellow
        Write-Host "1. 手动打开 Docker Desktop 应用程序" -ForegroundColor White
        Write-Host "2. 在 Docker Desktop 设置中检查 WSL 2 集成是否启用" -ForegroundColor White
        Write-Host "3. 如果问题持续，尝试重启计算机" -ForegroundColor White
        Write-Host "4. 检查 Windows 功能中是否启用了 WSL 和虚拟机平台" -ForegroundColor White
    }
} catch {
    Write-DebugLog -hypothesisId "B" -location "fix_docker.ps1:验证修复异常" -message "验证时出错" -data @{error=$_.Exception.Message}
    Write-Host "验证时出错: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 修复完成 ===" -ForegroundColor Cyan


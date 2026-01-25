# Docker 诊断脚本
# 用于检查 Docker 安装和运行状态

$logPath = ".cursor\debug.log"
$sessionId = "debug-session"
$runId = "docker-check-$(Get-Date -Format 'yyyyMMddHHmmss')"

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

Write-Host "=== Docker 诊断开始 ===" -ForegroundColor Cyan

# 假设 A: Docker Desktop 服务未运行
Write-Host "`n[假设A] 检查 Docker Desktop 服务状态..." -ForegroundColor Yellow
try {
    $dockerService = Get-Service -Name "*docker*" -ErrorAction SilentlyContinue
    if ($dockerService) {
        $serviceStatus = $dockerService | Select-Object Name, Status | ConvertTo-Json -Compress
        Write-DebugLog -hypothesisId "A" -location "check_docker.ps1:检查服务" -message "Docker服务状态" -data @{services=$serviceStatus}
        Write-Host "找到 Docker 服务:" -ForegroundColor Green
        $dockerService | Format-Table Name, Status, DisplayName
    } else {
        Write-DebugLog -hypothesisId "A" -location "check_docker.ps1:检查服务" -message "未找到Docker服务" -data @{}
        Write-Host "未找到 Docker 服务" -ForegroundColor Red
    }
} catch {
    Write-DebugLog -hypothesisId "A" -location "check_docker.ps1:检查服务异常" -message "检查服务时出错" -data @{error=$_.Exception.Message}
    Write-Host "检查服务时出错: $($_.Exception.Message)" -ForegroundColor Red
}

# 假设 B: Docker 命令无法连接守护进程
Write-Host "`n[假设B] 检查 Docker 守护进程连接..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-DebugLog -hypothesisId "B" -location "check_docker.ps1:检查版本" -message "Docker版本命令结果" -data @{output=$dockerVersion.ToString()}
    Write-Host "Docker 版本: $dockerVersion" -ForegroundColor Green
} catch {
    Write-DebugLog -hypothesisId "B" -location "check_docker.ps1:检查版本异常" -message "获取版本失败" -data @{error=$_.Exception.Message}
    Write-Host "无法获取 Docker 版本: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-DebugLog -hypothesisId "B" -location "check_docker.ps1:检查info" -message "Docker守护进程连接成功" -data @{success=$true}
        Write-Host "Docker 守护进程连接正常" -ForegroundColor Green
    } else {
        $errorOutput = $dockerInfo | Out-String
        Write-DebugLog -hypothesisId "B" -location "check_docker.ps1:检查info" -message "Docker守护进程连接失败" -data @{error=$errorOutput; exitCode=$LASTEXITCODE}
        Write-Host "Docker 守护进程连接失败:" -ForegroundColor Red
        Write-Host $errorOutput
    }
} catch {
    Write-DebugLog -hypothesisId "B" -location "check_docker.ps1:检查info异常" -message "检查info时出错" -data @{error=$_.Exception.Message}
    Write-Host "检查 Docker 信息时出错: $($_.Exception.Message)" -ForegroundColor Red
}

# 假设 C: Docker Desktop 进程未运行
Write-Host "`n[假设C] 检查 Docker Desktop 进程..." -ForegroundColor Yellow
try {
    $dockerProcesses = Get-Process -Name "*docker*" -ErrorAction SilentlyContinue
    if ($dockerProcesses) {
        $processInfo = $dockerProcesses | Select-Object Name, Id, StartTime | ConvertTo-Json -Compress
        Write-DebugLog -hypothesisId "C" -location "check_docker.ps1:检查进程" -message "找到Docker进程" -data @{processes=$processInfo}
        Write-Host "找到 Docker 相关进程:" -ForegroundColor Green
        $dockerProcesses | Format-Table Name, Id, StartTime -AutoSize
    } else {
        Write-DebugLog -hypothesisId "C" -location "check_docker.ps1:检查进程" -message "未找到Docker进程" -data @{}
        Write-Host "未找到 Docker Desktop 进程" -ForegroundColor Red
    }
} catch {
    Write-DebugLog -hypothesisId "C" -location "check_docker.ps1:检查进程异常" -message "检查进程时出错" -data @{error=$_.Exception.Message}
    Write-Host "检查进程时出错: $($_.Exception.Message)" -ForegroundColor Red
}

# 假设 D: WSL 2 后端问题（Windows 特定）
Write-Host "`n[假设D] 检查 WSL 2 状态（Windows Docker Desktop 需要）..." -ForegroundColor Yellow
try {
    $wslStatus = wsl --status 2>&1
    Write-DebugLog -hypothesisId "D" -location "check_docker.ps1:检查WSL" -message "WSL状态" -data @{output=$wslStatus.ToString()}
    Write-Host "WSL 状态:" -ForegroundColor Green
    Write-Host $wslStatus
} catch {
    Write-DebugLog -hypothesisId "D" -location "check_docker.ps1:检查WSL异常" -message "检查WSL失败" -data @{error=$_.Exception.Message}
    Write-Host "无法检查 WSL 状态（可能未安装）: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 假设 E: Docker API 版本不兼容
Write-Host "`n[假设E] 检查 Docker API 版本..." -ForegroundColor Yellow
try {
    $dockerVersionFull = docker version --format '{{.Server.Version}}' 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-DebugLog -hypothesisId "E" -location "check_docker.ps1:检查API版本" -message "Docker服务器版本" -data @{version=$dockerVersionFull.ToString()}
        Write-Host "Docker 服务器版本: $dockerVersionFull" -ForegroundColor Green
    } else {
        $errorOutput = $dockerVersionFull | Out-String
        Write-DebugLog -hypothesisId "E" -location "check_docker.ps1:检查API版本" -message "无法获取服务器版本" -data @{error=$errorOutput; exitCode=$LASTEXITCODE}
        Write-Host "无法获取 Docker 服务器版本:" -ForegroundColor Red
        Write-Host $errorOutput
    }
} catch {
    Write-DebugLog -hypothesisId "E" -location "check_docker.ps1:检查API版本异常" -message "检查版本时出错" -data @{error=$_.Exception.Message}
    Write-Host "检查版本时出错: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 诊断完成，日志已保存到 $logPath ===" -ForegroundColor Cyan
Write-Host "`n建议操作:" -ForegroundColor Yellow
Write-Host "1. 如果 Docker Desktop 未运行，请启动 Docker Desktop" -ForegroundColor White
Write-Host "2. 如果服务已停止，尝试重启 Docker Desktop" -ForegroundColor White
Write-Host "3. 检查 Docker Desktop 设置中的 WSL 2 集成是否启用" -ForegroundColor White
Write-Host "4. 如果问题持续，尝试重启计算机" -ForegroundColor White


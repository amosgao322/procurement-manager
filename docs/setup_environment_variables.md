# 配置全局环境变量指南

## Node.js 环境变量配置

### 方法一：通过 PowerShell（需要管理员权限）

1. **以管理员身份运行 PowerShell**
   - 右键点击 PowerShell
   - 选择"以管理员身份运行"

2. **执行以下命令添加 Node.js 到系统 PATH**：
   ```powershell
   $nodePath = "C:\Program Files\nodejs"
   $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
   $newPath = $currentPath + ";$nodePath"
   [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
   ```

3. **刷新当前会话的环境变量**：
   ```powershell
   $env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```

4. **验证**：
   ```powershell
   node --version
   npm --version
   ```

### 方法二：通过图形界面（推荐，更安全）

1. **打开系统属性**
   - 按 `Win + R`，输入 `sysdm.cpl`，回车
   - 或右键"此电脑" → "属性" → "高级系统设置"rr

2. **编辑环境变量**
   - 点击"环境变量"按钮
   - 在"系统变量"区域找到 `Path` 变量
   - 点击"编辑"

3. **添加 Node.js 路径**
   - 点击"新建"
   - 输入：`C:\Program Files\nodejs`
   - 点击"确定"保存所有对话框

4. **重启 PowerShell**
   - 关闭所有 PowerShell 窗口
   - 重新打开新的 PowerShell 窗口
   - 验证：`node --version` 和 `npm --version`

### 方法三：创建 PowerShell 配置文件（临时方案）

如果无法修改系统环境变量，可以创建 PowerShell 配置文件：

1. **检查配置文件是否存在**：
   ```powershell
   Test-Path $PROFILE
   ```

2. **如果不存在，创建配置文件**：
   ```powershell
   New-Item -Path $PROFILE -Type File -Force
   ```

3. **编辑配置文件**：
   ```powershell
   notepad $PROFILE
   ```

4. **添加以下内容**：
   ```powershell
   # 添加 Node.js 到 PATH
   $env:PATH += ";C:\Program Files\nodejs"
   ```

5. **保存并重新加载**：
   ```powershell
   . $PROFILE
   ```

## 验证配置

配置完成后，在新的 PowerShell 窗口中运行：

```powershell
node --version
npm --version
```

如果都能正常显示版本号，说明配置成功。

## 常见问题

### 问题1：修改后新窗口仍然无法识别

**解决方案**：
- 确保以管理员权限修改了系统环境变量
- 完全关闭并重新打开 PowerShell（不要只是刷新）
- 或者重启计算机

### 问题2：权限不足

**解决方案**：
- 使用图形界面方法（方法二）
- 或者以管理员身份运行 PowerShell

### 问题3：路径不存在

**解决方案**：
- 确认 Node.js 安装路径：`Test-Path "C:\Program Files\nodejs\node.exe"`
- 如果路径不同，替换为实际安装路径

## 推荐方案

**推荐使用方法二（图形界面）**，因为：
- 不需要管理员权限（如果 Node.js 安装时已添加到 PATH）
- 更直观，不容易出错
- 可以同时查看和管理所有环境变量



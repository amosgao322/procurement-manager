# Node.js 安装指南

## Windows 系统安装 Node.js

### 方法一：官方安装包（推荐）

1. **访问 Node.js 官网**
   - 打开浏览器访问：https://nodejs.org/
   - 下载 LTS（长期支持）版本（推荐）

2. **运行安装程序**
   - 双击下载的 `.msi` 安装包
   - 按照安装向导完成安装
   - **重要**：安装时确保勾选 "Add to PATH" 选项

3. **验证安装**
   打开新的 PowerShell 窗口，运行：
   ```powershell
   node --version
   npm --version
   ```

### 方法二：使用 winget（Windows 10/11）

如果您使用的是 Windows 10/11，可以使用 winget 包管理器：

```powershell
winget install OpenJS.NodeJS.LTS
```

### 方法三：使用 Chocolatey

如果您已安装 Chocolatey：

```powershell
choco install nodejs-lts
```

## 安装完成后

1. **重启 PowerShell 或命令提示符**
   - 关闭当前窗口
   - 重新打开 PowerShell

2. **验证安装**
   ```powershell
   node --version
   npm --version
   ```

3. **配置 npm 镜像（可选，加速下载）**
   ```powershell
   npm config set registry https://registry.npmmirror.com
   ```

4. **安装前端依赖**
   ```powershell
   cd frontend
   npm install
   ```

## 常见问题

### 问题1：安装后仍然无法识别命令

**解决方案**：
- 重启 PowerShell/命令提示符
- 检查环境变量 PATH 是否包含 Node.js 安装路径（通常是 `C:\Program Files\nodejs\`）
- 如果 PATH 中没有，手动添加到系统环境变量

### 问题2：权限问题

如果遇到权限错误，可以：
- 以管理员身份运行 PowerShell
- 或者使用 `npm install --global` 时添加 `--force` 参数

### 问题3：网络问题

如果 npm install 很慢或失败：
- 使用国内镜像：`npm config set registry https://registry.npmmirror.com`
- 或使用 cnpm：`npm install -g cnpm --registry=https://registry.npmmirror.com`

## 推荐版本

- **Node.js**: 18.x LTS 或 20.x LTS
- **npm**: 随 Node.js 一起安装（通常 9.x 或 10.x）

## 下一步

安装完 Node.js 后，继续前端项目的安装：

```powershell
cd frontend
npm install
npm run dev
```


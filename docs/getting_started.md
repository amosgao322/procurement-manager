# 快速启动指南

## 环境要求

- Python 3.9+
- MySQL 8.0+
- Node.js 16+ (前端开发时使用)
- VS Code 或其他支持 Python 的 IDE（推荐安装 Pylance 扩展）

> 💡 **IDE 配置提示**：如果遇到 Python 函数跳转不工作的问题，请参考 [IDE 配置指南](ide_setup.md)

## 第一步：数据库准备

1. 创建MySQL数据库：
```sql
CREATE DATABASE procurement_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改数据库配置：
复制 `backend/.env.example` 为 `backend/.env`，并修改数据库连接信息：
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=procurement_manager
```

## 第二步：后端环境搭建

1. 进入后端目录：
```bash
cd backend
```

2. 创建虚拟环境（推荐）：
```bash
# Windows
# 如果 python 命令不可用，尝试以下替代方案：
# 方案1：使用 py 启动器（推荐）
py -m venv venv
venv\Scripts\activate


```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 初始化数据库：
```bash
# Windows（如果 python 不可用，使用 py）
py app/core/init_db.py

# Linux/Mac
python3 app/core/init_db.py
```
这将创建所有数据表，并初始化：
- 权限数据
- 角色数据（管理员、采购、审批人、财务、普通用户）
- 默认管理员账户（用户名：admin，密码：admin123）

5. 启动后端服务：
```bash
# 重要：必须在 backend 目录下运行
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**注意**：如果不在 `backend` 目录下运行，会出现 `ModuleNotFoundError: No module named 'app'` 错误。

后端API文档访问地址：http://localhost:8000/docs

## 第三步：前端环境搭建（后续开发）

前端代码将在后续开发阶段创建。

## 当前完成的工作

✅ 项目架构设计
✅ 数据库模型设计
✅ 基础框架搭建
✅ 用户权限模型
✅ 数据库初始化脚本
✅ Excel处理工具（BOM导入）

## 下一步开发计划

1. 用户认证API（登录、token验证）
2. 权限中间件完善
3. BOM管理API（CRUD + Excel导入）
4. 供应商管理API
5. 报价管理API（含审批流程）
6. 合同管理API
7. 询比价功能
8. 操作日志记录
9. 前端界面开发

## 默认账户信息

- 用户名：`admin`
- 密码：`admin123`
- 角色：管理员（拥有所有权限）

⚠️ **注意**：首次登录后请立即修改密码！

## 权限说明

系统预设了以下角色：
- **管理员（admin）**：拥有所有权限
- **采购（purchaser）**：可以创建/修改BOM、报价单、合同
- **审批人（approver）**：可以审批/拒绝报价单
- **财务（finance）**：可以创建/查看合同和报价
- **普通用户（user）**：只能查看

## 常见问题

### 1. 数据库连接失败
- 检查MySQL服务是否启动
- 检查`.env`文件中的数据库配置是否正确
- 确认数据库用户有创建表的权限

### 2. Python 未找到（Windows）
如果提示 "Python was not found; run without arguments to install from the Microsoft Store"，说明系统中没有安装 Python 或 Python 未正确配置。

**问题诊断：**
```powershell
# 检查 Python 是否真的安装了
where.exe python
# 如果返回 C:\Users\...\WindowsApps\python.exe，这只是一个占位符，不是真正的 Python
```

**解决方案：**

**方案1：安装 Python（推荐）**
1. 访问 [python.org/downloads](https://www.python.org/downloads/) 下载 Python 3.9 或更高版本
2. 运行安装程序时，**务必勾选** "Add Python to PATH" 选项
3. 选择 "Install Now" 或自定义安装路径
4. 安装完成后，**重启 PowerShell 或命令提示符**
5. 验证安装：
   ```powershell
   python --version
   # 应该显示 Python 3.x.x
   ```

**方案2：禁用 Windows Store 应用执行别名（如果已安装 Python）**
如果已经安装了 Python 但仍然出现此错误：
1. 打开 Windows 设置（Win + I）
2. 搜索 "应用执行别名" 或 "App execution aliases"
3. 找到 "python.exe" 和 "python3.exe"
4. **关闭**这两个开关
5. 重启 PowerShell

**方案3：使用 Python 启动器（如果已安装）**
如果系统中有 Python 启动器（py.exe），可以尝试：
```powershell
py --version  # 检查是否可用
py -m venv venv
py -m pip install -r requirements.txt
```

**方案4：使用完整路径**
如果 Python 已安装但未添加到 PATH：
```powershell
# 常见安装路径：
# C:\Python39\python.exe
# C:\Users\用户名\AppData\Local\Programs\Python\Python39\python.exe
# C:\Program Files\Python39\python.exe

# 使用完整路径创建虚拟环境
C:\Python39\python.exe -m venv venv
```

**验证安装：**
安装完成后，运行以下命令验证：
```powershell
python --version
python -m pip --version
```

### 3. 导入依赖失败
- 确认Python版本为3.9+
- 使用虚拟环境隔离依赖
- 国内用户可以使用清华源：`pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`

### 4. 端口被占用
- 修改启动命令中的端口：`--port 8001`
- 或关闭占用端口的程序


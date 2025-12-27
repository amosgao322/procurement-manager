# 采购管理系统 (Procurement Manager) - 轻量级ERP系统

## 项目简介

为小型环境污染检测设备制作厂商开发的轻量级ERP系统，主要功能包括：
- BOM清单管理
- 供应商管理
- 报价单管理（含审批流程）
- 合同管理
- 询比价功能（多维度权重计算）
- 操作日志审计

## 技术栈

### 后端
- Python 3.9+
- FastAPI
- SQLAlchemy (ORM)
- MySQL 8.0+
- JWT认证
- pandas/openpyxl (Excel处理)

### 前端
- React 18
- TypeScript
- Ant Design 5
- Axios

## 项目结构

```
procurement-manager/
├── backend/              # 后端代码
│   ├── app/
│   │   ├── api/         # API路由
│   │   ├── core/        # 核心配置
│   │   ├── models/      # 数据库模型
│   │   ├── schemas/     # Pydantic模型
│   │   ├── services/    # 业务逻辑
│   │   ├── utils/       # 工具函数
│   │   └── main.py      # 应用入口
│   ├── requirements.txt
│   └── alembic/         # 数据库迁移
├── frontend/             # 前端代码
│   ├── src/
│   │   ├── components/  # 组件
│   │   ├── pages/       # 页面
│   │   ├── services/    # API服务
│   │   ├── utils/       # 工具函数
│   │   └── App.tsx
│   └── package.json
└── docs/                 # 文档

```

## 快速开始

### 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动，并自动代理后端API请求到 `http://localhost:8000`

## 数据库设计

主要数据表：
- users (用户表)
- roles (角色表)
- user_roles (用户角色关联)
- permissions (权限表)
- suppliers (供应商表)
- materials (物料表)
- boms (BOM清单表)
- bom_items (BOM明细表)
- quotations (报价单表)
- quotation_items (报价明细表)
- contracts (合同表)
- operation_logs (操作日志表)

## 开发计划

详见开发文档。


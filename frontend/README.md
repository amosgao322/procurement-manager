# 采购管理系统 - 前端

## 技术栈

- React 18
- TypeScript
- Ant Design 5
- Vite
- React Router
- Axios

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

前端将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
frontend/
├── src/
│   ├── components/      # 公共组件
│   ├── layouts/         # 布局组件
│   ├── pages/           # 页面组件
│   │   ├── Bom/         # BOM管理
│   │   ├── Supplier/    # 供应商管理
│   │   ├── Quotation/   # 报价管理
│   │   ├── Contract/    # 合同管理
│   │   └── Comparison/  # 询比价
│   ├── services/        # API服务
│   ├── types/           # TypeScript类型定义
│   ├── utils/           # 工具函数
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 入口文件
├── public/              # 静态资源
└── package.json
```

## 功能模块

### 1. 用户认证
- 登录/登出
- Token管理
- 路由守卫

### 2. BOM管理
- BOM列表查询
- BOM详情查看
- Excel导入/导出
- BOM创建/编辑/删除

### 3. 供应商管理
- 供应商列表
- 供应商创建/编辑/删除

### 4. 报价管理
- 报价单列表
- 报价单详情
- 报价单提交/审批/拒绝

### 5. 合同管理
- 合同列表
- 合同创建/编辑

### 6. 询比价
- 基于BOM的比价分析
- 多供应商对比

## API配置

前端通过代理访问后端API，代理配置在 `vite.config.ts` 中：

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

确保后端服务运行在 `http://localhost:8000`

## 环境要求

- Node.js 16+
- npm 或 yarn


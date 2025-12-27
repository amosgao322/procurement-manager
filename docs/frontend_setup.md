# 前端开发指南

## 项目概述

前端使用 React + TypeScript + Ant Design 构建，采用 Vite 作为构建工具。

## 技术栈

- **React 18**: UI框架
- **TypeScript**: 类型安全
- **Ant Design 5**: UI组件库
- **Vite**: 构建工具
- **React Router**: 路由管理
- **Axios**: HTTP客户端
- **Day.js**: 日期处理

## 项目结构

```
frontend/
├── src/
│   ├── components/          # 公共组件
│   │   └── PrivateRoute.tsx # 路由守卫
│   ├── layouts/             # 布局组件
│   │   └── MainLayout.tsx   # 主布局（菜单、头部）
│   ├── pages/               # 页面组件
│   │   ├── Login/           # 登录页
│   │   ├── Bom/             # BOM管理
│   │   │   ├── List.tsx    # BOM列表
│   │   │   └── Detail.tsx  # BOM详情
│   │   ├── Supplier/        # 供应商管理
│   │   ├── Quotation/       # 报价管理
│   │   ├── Contract/        # 合同管理
│   │   └── Comparison/      # 询比价
│   ├── services/            # API服务
│   │   └── api.ts           # API接口封装
│   ├── types/               # TypeScript类型定义
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   ├── auth.ts         # 认证工具
│   │   └── request.ts      # Axios封装
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 入口文件
├── public/                 # 静态资源
├── index.html              # HTML模板
├── package.json            # 依赖配置
├── vite.config.ts          # Vite配置
└── tsconfig.json           # TypeScript配置
```

## 核心功能

### 1. 认证系统

- **登录**: `/pages/Login/index.tsx`
- **Token管理**: `utils/auth.ts`
- **路由守卫**: `components/PrivateRoute.tsx`

### 2. API服务层

所有API调用封装在 `services/api.ts` 中，包括：
- 认证API (`authApi`)
- BOM API (`bomApi`)
- 供应商API (`supplierApi`)
- 报价API (`quotationApi`)
- 合同API (`contractApi`)
- 询比价API (`comparisonApi`)

### 3. 路由配置

路由定义在 `App.tsx` 中：
- `/login` - 登录页
- `/boms` - BOM列表
- `/boms/:id` - BOM详情
- `/suppliers` - 供应商列表
- `/quotations` - 报价单列表
- `/quotations/:id` - 报价单详情
- `/contracts` - 合同列表
- `/comparison` - 询比价

### 4. 主布局

`MainLayout` 组件提供：
- 侧边栏菜单
- 顶部导航栏
- 用户信息下拉菜单
- 退出登录功能

## 开发指南

### 添加新页面

1. 在 `src/pages/` 下创建新目录和组件
2. 在 `App.tsx` 中添加路由配置
3. 在 `MainLayout.tsx` 中添加菜单项（如需要）
4. 在 `services/api.ts` 中添加对应的API方法

### 添加新API

1. 在 `services/api.ts` 中添加API方法
2. 在 `types/index.ts` 中添加类型定义
3. 在页面组件中调用API

### 样式规范

- 使用 Ant Design 组件库的样式
- 自定义样式使用 CSS 文件
- 遵循 Ant Design 的设计规范

## 环境配置

### 开发环境

前端默认运行在 `http://localhost:3000`，通过 Vite 代理访问后端API。

代理配置在 `vite.config.ts` 中：
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

### 生产环境

构建命令：
```bash
npm run build
```

构建产物在 `dist/` 目录，需要配置 Web 服务器（如 Nginx）来提供静态文件服务。

## 常见问题

### 1. 端口冲突

如果 3000 端口被占用，可以在 `vite.config.ts` 中修改 `server.port`。

### 2. API请求失败

- 确保后端服务运行在 `http://localhost:8000`
- 检查后端CORS配置是否允许前端域名
- 检查浏览器控制台的网络请求

### 3. 类型错误

确保所有API响应的类型定义在 `types/index.ts` 中正确声明。

## 下一步开发

待实现的功能：
- [ ] BOM新建/编辑表单
- [ ] 供应商新建/编辑表单
- [ ] 报价单新建/编辑表单
- [ ] 合同新建/编辑表单
- [ ] 操作日志页面
- [ ] 权限控制细化
- [ ] 数据导出功能增强
- [ ] 响应式布局优化


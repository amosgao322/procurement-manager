# API设计文档

## 基础信息

- Base URL: `/api/v1`
- 认证方式: Bearer Token (JWT)
- 数据格式: JSON

## 认证相关 API

### POST /api/v1/auth/login
用户登录

**请求体：**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "real_name": "系统管理员",
    "roles": ["管理员"]
  }
}
```

### GET /api/v1/auth/me
获取当前用户信息

**Headers:**
```
Authorization: Bearer {token}
```

## BOM管理 API

### GET /api/v1/boms
获取BOM列表

**查询参数：**
- page: 页码（默认1）
- page_size: 每页数量（默认20）
- keyword: 搜索关键词（编码、名称）
- status: 状态筛选

### GET /api/v1/boms/{id}
获取BOM详情（包含明细）

### POST /api/v1/boms
创建BOM

**请求体：**
```json
{
  "code": "BOM001",
  "name": "设备A BOM清单",
  "product_name": "设备A",
  "items": [
    {
      "sequence": "1",
      "material_name": "堵头",
      "specification": "DN15, 304不锈钢",
      "unit": "套",
      "quantity": 9,
      "unit_price": 2.5,
      "remark": ""
    }
  ]
}
```

### PUT /api/v1/boms/{id}
更新BOM

### DELETE /api/v1/boms/{id}
删除BOM

### POST /api/v1/boms/import
导入BOM（Excel文件）

**Content-Type:** multipart/form-data

**Form Data:**
- file: Excel文件

**响应：**
```json
{
  "success": true,
  "bom_id": 1,
  "total_rows": 50,
  "success_rows": 48,
  "errors": [
    {
      "row": 3,
      "field": "数量",
      "message": "数量必须大于0"
    }
  ]
}
```

### GET /api/v1/boms/{id}/export
导出BOM（Excel文件）

## 供应商管理 API

### GET /api/v1/suppliers
获取供应商列表

### GET /api/v1/suppliers/{id}
获取供应商详情

### POST /api/v1/suppliers
创建供应商

### PUT /api/v1/suppliers/{id}
更新供应商

### DELETE /api/v1/suppliers/{id}
删除供应商

## 报价管理 API

### GET /api/v1/quotations
获取报价单列表

### GET /api/v1/quotations/{id}
获取报价单详情

### POST /api/v1/quotations
创建报价单

### PUT /api/v1/quotations/{id}
更新报价单

### POST /api/v1/quotations/{id}/submit
提交报价单（状态：draft -> submitted）

**权限要求：** quotation:submit

### POST /api/v1/quotations/{id}/approve
审批通过报价单（状态：submitted -> approved）

**权限要求：** quotation:approve

**请求体：**
```json
{
  "comment": "审批通过"
}
```

### POST /api/v1/quotations/{id}/reject
拒绝报价单（状态：submitted -> rejected）

**权限要求：** quotation:reject

**请求体：**
```json
{
  "comment": "价格偏高"
}
```

## 合同管理 API

### GET /api/v1/contracts
获取合同列表

### GET /api/v1/contracts/{id}
获取合同详情

### POST /api/v1/contracts
创建合同

**权限要求：** contract:create

### PUT /api/v1/contracts/{id}
更新合同

## 询比价 API

### POST /api/v1/boms/{bom_id}/request-quotation
基于BOM生成询价请求

### GET /api/v1/boms/{bom_id}/compare-quotations
比价分析（多个报价单对比）

**响应：**
```json
{
  "bom_id": 1,
  "comparisons": [
    {
      "material_name": "堵头",
      "suppliers": [
        {
          "supplier_id": 1,
          "supplier_name": "供应商A",
          "unit_price": 2.5,
          "delivery_days": 7,
          "score": 85.5
        }
      ],
      "recommended_supplier_id": 1
    }
  ],
  "total_score": {
    "supplier_1": 88.5,
    "supplier_2": 82.3
  }
}
```

## 操作日志 API

### GET /api/v1/logs
获取操作日志列表

**查询参数：**
- user_id: 用户ID
- resource: 资源类型
- operation: 操作类型
- start_date: 开始日期
- end_date: 结束日期


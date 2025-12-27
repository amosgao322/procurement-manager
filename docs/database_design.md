# 数据库设计文档

## 概述

本文档描述采购管理系统的数据库设计，包括所有数据表的结构、字段说明和关系设计。

## 表结构设计

### 1. 用户权限相关表

#### users (用户表)
- 存储系统用户信息
- 主要字段：用户名、密码哈希、真实姓名、邮箱、手机号

#### roles (角色表)
- 存储系统角色定义
- 预设角色：
  - 管理员（admin）
  - 采购（purchaser）
  - 财务（finance）
  - 审批人（approver）
  - 普通用户（user）

#### permissions (权限表)
- 存储权限定义
- 权限代码格式：resource:action
- 例如：
  - contract:create (合同创建)
  - quotation:approve (报价审批)
  - quotation:reject (报价拒绝)

#### user_roles (用户角色关联表)
- 多对多关系：用户-角色

#### role_permissions (角色权限关联表)
- 多对多关系：角色-权限

### 2. 基础数据表

#### suppliers (供应商表)
- 供应商基本信息
- 包含：编码、名称、联系方式、地址、税号、银行信息等

#### materials (物料表)
- 物料基本信息（可选，用于标准化物料管理）
- 如果BOM中使用的是物料编码，需要关联此表

### 3. BOM相关表

#### boms (BOM清单表)
- BOM主表
- 包含：编码、名称、产品名称、状态、总金额等

#### bom_items (BOM明细表)
- BOM明细项
- 对应Excel中的每一行数据
- 字段与Excel列对应：序号、设备名称、规格型号、单位、数量、单价、总价、备注

### 4. 报价相关表

#### quotations (报价单表)
- 报价单主表
- 包含：编号、供应商、关联BOM、报价日期、有效期、总金额、状态、审批信息等
- 状态：draft(草稿) -> submitted(已提交) -> approved(已审批)/rejected(已拒绝)

#### quotation_items (报价明细表)
- 报价明细项
- 对应BOM中的每个物料
- 包含：物料信息、单价、数量、总价、品牌、交货天数等

### 5. 合同表

#### contracts (合同表)
- 合同主表
- 关联供应商、BOM、报价单
- 包含：编号、标题、签订日期、金额、付款条件、状态等

### 6. 日志表

#### operation_logs (操作日志表)
- 记录所有关键操作
- 包含：用户、操作类型、资源类型、资源ID、变更前后数据、IP地址等

## 关系说明

1. User <-> Role: 多对多
2. Role <-> Permission: 多对多
3. Supplier -> Quotation: 一对多
4. BOM -> BOMItem: 一对多
5. BOM -> Quotation: 一对多（可选）
6. Quotation -> QuotationItem: 一对多
7. Supplier -> Contract: 一对多
8. BOM -> Contract: 一对多（可选）
9. Quotation -> Contract: 一对多（可选）

## 索引设计

- 所有主键自动创建索引
- 外键字段创建索引
- 常用查询字段创建索引：
  - users.username
  - suppliers.code, suppliers.name
  - boms.code, boms.name
  - quotations.code, quotations.status, quotations.supplier_id
  - contracts.code, contracts.supplier_id
  - operation_logs.user_id, operation_logs.resource, operation_logs.created_at


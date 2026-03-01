import request from '@/utils/request';
import type {
  LoginRequest,
  LoginResponse,
  User,
  UserDetail,
  UserCreate,
  UserUpdate,
  UserListResponse,
  RoleListResponse,
  PermissionListResponse,
  Bom,
  BomListResponse,
  Supplier,
  Quotation,
  Contract,
  ContractTemplate,
  QuotationComparisonResponse,
  QuotationBasicInfo,
  GenerateContractRequest,
  PaginationParams,
  ExcelImportResponse,
  Material,
  MaterialListResponse,
  BOMItemPriceHistoryResponse,
  BOMCostAnalysisResponse,
} from '@/types';

// 认证API
export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return request.post('/auth/login', data);
  },
  getCurrentUser: (): Promise<User> => {
    return request.get('/auth/me');
  },
};

// BOM API
export const bomApi = {
  getList: (params?: PaginationParams & {
    product_name?: string;
    status?: string;
    customer_name?: string;
    prepared_by?: string;
    created_at_start?: string;
    created_at_end?: string;
  }): Promise<BomListResponse> => {
    return request.get('/boms', { params });
  },
  getById: (id: number): Promise<Bom> => {
    return request.get(`/boms/${id}`);
  },
  create: (data: Bom): Promise<Bom> => {
    return request.post('/boms', data);
  },
  update: (id: number, data: Partial<Bom>): Promise<Bom> => {
    return request.put(`/boms/${id}`, data);
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/boms/${id}`);
  },
  import: (file: File): Promise<ExcelImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/boms/import', formData, {
      headers: {
        // 不设置Content-Type，让浏览器自动设置，包括boundary
      },
    });
  },
  export: (id: number, itemIds: number[]): Promise<Blob> => {
    return request.post(`/boms/${id}/export`, itemIds, {
      responseType: 'blob',
    });
  },
  getItemPriceHistory: (bomId: number, itemId: number): Promise<BOMItemPriceHistoryResponse> => {
    return request.get(`/boms/${bomId}/items/${itemId}/price-history`);
  },
  calculateCost: (bomId: number): Promise<BOMCostAnalysisResponse> => {
    return request.post(`/boms/${bomId}/calculate-cost`);
  },
};

// 供应商API
export const supplierApi = {
  getList: (params?: PaginationParams): Promise<{ items: Supplier[]; total: number }> => {
    return request.get('/suppliers', { params });
  },
  getById: (id: number): Promise<Supplier> => {
    return request.get(`/suppliers/${id}`);
  },
  create: (data: Supplier): Promise<Supplier> => {
    return request.post('/suppliers', data);
  },
  update: (id: number, data: Partial<Supplier>): Promise<Supplier> => {
    return request.put(`/suppliers/${id}`, data);
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/suppliers/${id}`);
  },
};

// 报价API
export const quotationApi = {
  getList: (params?: PaginationParams & { 
    status?: string; 
    status_in?: string;
    title?: string;
    supplier_id?: number;
    created_at_start?: string;
    created_at_end?: string;
  }): Promise<{ items: Quotation[]; total: number; page: number; page_size: number }> => {
    return request.get('/quotations', { params });
  },
  getById: (id: number): Promise<Quotation> => {
    return request.get(`/quotations/${id}`);
  },
  create: (data: Quotation): Promise<Quotation> => {
    return request.post('/quotations', data);
  },
  update: (id: number, data: Partial<Quotation>): Promise<Quotation> => {
    return request.put(`/quotations/${id}`, data);
  },
  submit: (id: number): Promise<Quotation> => {
    return request.post(`/quotations/${id}/submit`);
  },
  approve: (id: number, comment?: string): Promise<Quotation> => {
    return request.post(`/quotations/${id}/approve`, { comment });
  },
  reject: (id: number, comment?: string): Promise<Quotation> => {
    return request.post(`/quotations/${id}/reject`, { comment });
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/quotations/${id}`);
  },
};

// 合同API
export const contractApi = {
  getList: (params?: PaginationParams): Promise<{ items: Contract[]; total: number }> => {
    return request.get('/contracts', { params });
  },
  getById: (id: number): Promise<Contract> => {
    return request.get(`/contracts/${id}`);
  },
  create: (data: Contract): Promise<Contract> => {
    return request.post('/contracts', data);
  },
  update: (id: number, data: Partial<Contract>): Promise<Contract> => {
    return request.put(`/contracts/${id}`, data);
  },
  generate: (data: GenerateContractRequest): Promise<Contract> => {
    return request.post('/contracts/generate', data);
  },
};

// 合同模板API
export const contractTemplateApi = {
  getList: (params?: PaginationParams & { is_active?: boolean }): Promise<{ items: ContractTemplate[]; total: number }> => {
    return request.get('/contract-templates', { params });
  },
  getById: (id: number): Promise<ContractTemplate> => {
    return request.get(`/contract-templates/${id}`);
  },
  create: (formData: FormData): Promise<ContractTemplate> => {
    return request.post('/contract-templates', formData);
  },
  update: (id: number, data: Partial<ContractTemplate>): Promise<ContractTemplate> => {
    return request.put(`/contract-templates/${id}`, data);
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/contract-templates/${id}`);
  },
  uploadFile: (id: number, formData: FormData): Promise<ContractTemplate> => {
    return request.post(`/contract-templates/${id}/upload`, formData);
  },
};

// 询比价API
export const comparisonApi = {
  requestQuotation: (bomId: number): Promise<any> => {
    return request.post(`/boms/${bomId}/request-quotation`);
  },
  compareQuotations: (bomId: number): Promise<QuotationComparisonResponse> => {
    return request.get(`/boms/${bomId}/compare-quotations`);
  },
  getQuotationsByBom: (bomId: number): Promise<QuotationBasicInfo[]> => {
    return request.get(`/quotations/by-bom/${bomId}`);
  },
  exportComparison: (bomId: number): Promise<Blob> => {
    return request.post(`/boms/${bomId}/compare-quotations/export`, {}, {
      responseType: 'blob',
    });
  },
};

// 用户管理API
export const userApi = {
  getList: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    role_code?: string;
    is_active?: boolean;
  }): Promise<UserListResponse> => {
    return request.get('/users', { params });
  },
  getById: (id: number): Promise<UserDetail> => {
    return request.get(`/users/${id}`);
  },
  create: (data: UserCreate): Promise<UserDetail> => {
    return request.post('/users', data);
  },
  update: (id: number, data: UserUpdate): Promise<UserDetail> => {
    return request.put(`/users/${id}`, data);
  },
  updatePassword: (id: number, password: string): Promise<void> => {
    return request.put(`/users/${id}/password`, { password });
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/users/${id}`);
  },
  assignRoles: (id: number, roleCodes: string[]): Promise<UserDetail> => {
    return request.put(`/users/${id}/roles`, { role_codes: roleCodes });
  },
  getRoles: (): Promise<RoleListResponse> => {
    return request.get('/users/roles/list');
  },
  getRole: (id: number): Promise<any> => {
    return request.get(`/users/roles/${id}`);
  },
  assignPermissionsToRole: (roleId: number, permissionCodes: string[]): Promise<any> => {
    return request.put(`/users/roles/${roleId}/permissions`, { permission_codes: permissionCodes });
  },
  getPermissions: (): Promise<PermissionListResponse> => {
    return request.get('/users/permissions/list');
  },
};

// 物料库API
export const materialApi = {
  getList: (params?: PaginationParams & { price_status?: string }): Promise<MaterialListResponse> => {
    return request.get('/materials', { params });
  },
  getById: (id: number): Promise<Material> => {
    return request.get(`/materials/${id}`);
  },
  create: (data: Material): Promise<Material> => {
    return request.post('/materials', data);
  },
  update: (id: number, data: Partial<Material>): Promise<Material> => {
    return request.put(`/materials/${id}`, data);
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/materials/${id}`);
  },
};


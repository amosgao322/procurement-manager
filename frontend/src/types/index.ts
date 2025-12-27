// 用户相关类型
export interface User {
  id: number;
  username: string;
  real_name: string;
  email?: string;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// BOM相关类型
export interface BomItem {
  id?: number;
  sequence: string;
  material_name: string;
  specification?: string;
  unit?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  remark?: string;
}

export interface Bom {
  id?: number;
  code: string;
  name: string;
  product_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  items?: BomItem[];
}

export interface BomListResponse {
  items: Bom[];
  total: number;
  page: number;
  page_size: number;
}

// 供应商相关类型
export interface Supplier {
  id?: number;
  name: string;
  code?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  tax_id?: string;
  bank_name?: string;
  bank_account?: string;
  credit_rating?: SupplierRating;
  remark?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 报价相关类型
export interface QuotationItem {
  id?: number;
  sequence: string;
  material_name: string;
  specification?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  remark?: string;
}

export interface Quotation {
  id?: number;
  code: string;
  bom_id: number;
  supplier_id: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  total_amount?: number;
  delivery_days?: number;
  valid_until?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
  bom?: Bom;
  supplier?: Supplier;
  items?: QuotationItem[];
}

// 合同相关类型
export interface Contract {
  id?: number;
  code: string;
  title: string;
  supplier_id: number;
  quotation_id?: number;
  bom_id?: number;
  contract_type?: string;
  sign_date?: string;
  start_date?: string;
  end_date?: string;
  total_amount?: number;
  currency?: string;
  payment_terms?: string;
  delivery_terms?: string;
  status?: string;
  remark?: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
  supplier?: Supplier;
  quotation?: Quotation;
  bom?: Bom;
}

// 合同模板相关类型
export interface ContractTemplate {
  id?: number;
  name: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GenerateContractRequest {
  quotation_id: number;
  template_id: number;
  contract_code: string;
  contract_title?: string;
  sign_date?: string;
  start_date?: string;
  end_date?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  keyword?: string;
}

export interface ExcelImportResponse {
  success: boolean;
  bom_id: number;
  total_rows: number;
  success_rows: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}


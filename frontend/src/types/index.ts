// 用户相关类型
export interface User {
  id: number;
  username: string;
  real_name?: string;
  email?: string;
  phone?: string;
  roles: string[];
  permissions?: string[];  // 权限代码列表
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserDetail extends Omit<User, 'roles' | 'permissions'> {
  roles: RoleInfo[];
  permissions?: PermissionInfo[];
}

export interface RoleInfo {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface PermissionInfo {
  id: number;
  code: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UserCreate {
  username: string;
  password: string;
  real_name: string;
  email?: string;
  phone?: string;
  role_codes: string[];
}

export interface UserUpdate {
  real_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  role_codes?: string[];
}

export interface UserListResponse {
  total: number;
  items: UserListItem[];
}

export interface UserListItem {
  id: number;
  username: string;
  real_name: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  roles: string[];
}

export interface RoleListResponse {
  items: RoleInfo[];
}

export interface PermissionListResponse {
  items: PermissionInfo[];
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
  material_category?: string;
  material_grade?: string;
  unit_weight?: number;
  total_weight?: number;
  brand_manufacturer?: string;
  standard_number?: string;
  surface_treatment?: string;
}

export interface Bom {
  id?: number;
  code: string;
  name: string;
  product_name?: string;
  description?: string;
  status?: string;
  remark?: string;
  customer_name?: string;
  date?: string;
  version?: string;
  sales_channel?: string;
  prepared_by?: string;
  pricing_reviewer?: string;
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
export type SupplierRating = '优秀' | '良好' | '一般' | '较差' | '差';

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
  brand?: string;
  delivery_days?: number;
  remark?: string;
}

export interface Quotation {
  id?: number;
  code: string;
  bom_id: number;
  supplier_id: number;
  title?: string;
  quotation_date?: string;
  currency?: string;
  payment_terms?: string;
  delivery_terms?: string;
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
  bom_id?: number;
  bom_code?: string;
  bom_name?: string;
  items_count: number;
  error_count: number;
  total_rows?: number;
  success_rows?: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// 物料相关类型
export type MaterialPriceStatus = 'pending' | 'valid' | 'expired' | 'abnormal';
export type MaterialType = 'unknown' | 'manual' | 'quotation';  // 物料类型：unknown(未知)、manual(手动录入)、quotation(报价单录入)

export interface Material {
  id?: number;
  code?: string;
  name: string;
  specification?: string;
  unit?: string;
  category?: string;
  brand?: string;
  standard_price?: string;  // 保留兼容，但建议用 last_price
  price_status?: MaterialPriceStatus;
  status_reason?: string;
  currency?: string;
  last_price?: number;
  remark?: string;
  source?: string;  // 来源（如：报价单对应的供应商名称）
  material_type?: MaterialType;  // 物料类型：unknown(未知)、manual(手动录入)、quotation(报价单录入)
  is_active?: boolean;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialPriceHistory {
  id?: number;
  material_id: number;
  supplier_id?: number;
  quotation_id?: number;
  quotation_item_id?: number;
  source: 'quotation' | 'manual';
  currency: string;
  unit_price: number;
  quantity?: number;
  captured_at?: string;
}

export interface MaterialListResponse {
  items: Material[];
  total: number;
  page: number;
  page_size: number;
}

// BOM历史价格和成本分析相关类型
export interface PriceStatistics {
  average: number;
  max: number;
  min: number;
  count: number;
  latest_price?: number;
  latest_date?: string;
}

export interface MaterialMatchInfo {
  material_id: number;
  material_code: string;
  material_name: string;
  specification?: string;
  matched: boolean;
}

export interface BOMItemPriceHistoryItem {
  id: number;
  unit_price: number;
  currency: string;
  source: string;
  material_type?: string;
  supplier_id?: number;
  supplier_name?: string;
  quotation_id?: number;
  quotation_code?: string;
  material_code?: string;
  price_status?: string;
  status_note?: string;
  quantity?: number;
  captured_at?: string;
}

export interface BOMItemPriceHistoryResponse {
  item_id: number;
  material_name: string;
  specification?: string;
  material_match?: MaterialMatchInfo;
  price_history: BOMItemPriceHistoryItem[];
  statistics?: PriceStatistics;
}

export interface BOMItemCostInfo {
  item_id: number;
  sequence?: string;
  material_name: string;
  specification?: string;
  quantity: number;
  unit?: string;
  matched: boolean;
  material_id?: number;
  cost_price?: number;
  cost_total?: number;
  price_history_count: number;
  match_status: string;
}

export interface PriceSourceStat {
  source_type: string;
  count: number;
  total_amount: number;
  percentage: number;
}

export interface BOMCostAnalysisResponse {
  bom_id: number;
  bom_code: string;
  bom_name: string;
  total_cost: number;
  items_count: number;
  matched_count: number;
  unmatched_count: number;
  items: BOMItemCostInfo[];
  total_price_history_count: number;
  price_source_stats?: PriceSourceStat[];
  unmatched_items?: BOMItemCostInfo[];
}

// 询比价对比相关类型
export interface QuotationBasicInfo {
  id: number;
  code: string;
  supplier_id: number;
  supplier_name: string;
  supplier_code?: string;
  credit_rating?: string;  // 供应商信用等级
  total_amount?: number;
  status: string;
  quotation_date?: string;
  valid_until?: string;
  delivery_days?: number;
  delivery_terms?: string;
  payment_terms?: string;
  currency?: string;
}

export interface ComparisonItemCell {
  quotation_id: number;
  quotation_code: string;
  supplier_name: string;
  unit_price?: number;
  total_price?: number;
  quantity?: number;
  brand?: string;
  delivery_days?: number;
  remark?: string;
  matched: boolean;
}

export interface ComparisonItemRow {
  bom_item_id: number;
  sequence?: string;
  material_name: string;
  specification?: string;
  unit?: string;
  bom_quantity: number;
  cells: ComparisonItemCell[];
}

export interface QuotationComparisonResponse {
  bom_id: number;
  bom_code: string;
  bom_name: string;
  quotations: QuotationBasicInfo[];
  item_rows: ComparisonItemRow[];
  unmatched_quotations: Record<number, any[]>;
  best_markers: {
    lowest_total_price?: number;
    shortest_delivery_days?: number;
    longest_valid_until?: number;
    item_lowest_price: Record<number, number>;
  };
}



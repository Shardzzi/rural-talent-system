import { Request } from 'express';

// 用户相关类型定义
export interface User {
  id: number;
  username: string;
  password?: string;
  email: string;
  role: 'admin' | 'user';
  person_id?: number | null;
  is_active?: number;
  created_at: string;
  updated_at: string;
}

// 人员信息类型定义
export interface Person {
  id: number;
  name: string;
  age: number;
  gender: '男' | '女' | '其他';
  phone?: string;
  email?: string;
  address?: string;
  id_number?: string;
  education_level?: string;
  major?: string;
  work_experience?: string;
  skills?: string;
  current_status?: string;
  employment_intention?: string;
  salary_expectation?: number;
  contact_preference?: string;
  notes?: string;
  is_employed?: boolean;
  employer_info?: string;
  created_at: string;
  updated_at: string;
}

// 认证相关类型
export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 请求扩展类型
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: 'admin' | 'user';
    personId?: number | null;
  };
}

// 日志相关类型
export interface LogData {
  [key: string]: any;
}

// 数据库操作类型
export interface DatabaseResult {
  changes?: number;
  lastID?: number;
}

// 分页参数
export interface PaginationParams {
  page?: number; // default 1
  limit?: number; // default 20, max 100
  sortBy?: string; // whitelist: name, age, education_level, created_at
  sortOrder?: 'asc' | 'desc'; // default 'asc'
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 搜索参数
export interface SearchParams extends PaginationParams {
  name?: string;
  age_min?: number;
  age_max?: number;
  minAge?: number;
  maxAge?: number;
  gender?: string;
  education_level?: string;
  current_status?: string;
  is_employed?: boolean;
  skill?: string;
  crop?: string;
  employment_status?: string;
}

// JWT载荷类型
export interface JWTPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
  personId?: number | null;
  iat?: number;
  exp?: number;
}

// 用户人员信息类型（用于认证响应）
export interface UserPersonInfo extends User {
  personId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  personInfo?: {
    id: number;
    name: string;
    age?: number;
    gender?: string;
    email?: string;
    phone?: string;
    address?: string;
    education_level?: string;
    political_status?: string;
  };
}

// 数据库连接配置
export interface DatabaseConfig {
  database: string;
  driver?: string;
}

// 请求体类型
export interface PersonCreateRequest {
  name: string;
  age: number;
  gender: '男' | '女' | '其他';
  phone?: string;
  email?: string;
  address?: string;
  id_number?: string;
  education_level?: string;
  major?: string;
  work_experience?: string;
  skills?: string;
  current_status?: string;
  employment_intention?: string;
  salary_expectation?: number;
  contact_preference?: string;
  notes?: string;
  is_employed?: boolean;
  employer_info?: string;
}

export interface PersonUpdateRequest extends Partial<PersonCreateRequest> {
  id: number;
}

// MySQL ResultSetHeader (from mysql2/promise)
export interface ResultSetHeader {
  affectedRows: number;
  insertId: number;
  warningStatus: number;
}

// 人员详情（包含关联信息）
export interface PersonWithDetails extends Person {
  rural_profile?: Record<string, unknown> | null;
  cooperation_intentions?: Record<string, unknown> | null;
  talent_skills?: Record<string, unknown>[];
}

// 人员完整档案（包含农村信息、技能、合作意向）
export interface PersonFullProfile {
  [key: string]: unknown;
  ruralProfile?: Record<string, unknown> | null;
  skills?: Record<string, unknown>[];
  cooperation?: Record<string, unknown> | null;
}

// 批量操作类型
export interface BatchDeleteRequest {
  ids: number[];
}

export interface BatchUpdateRequest {
  ids: number[];
  updates: Record<string, unknown>;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportPreviewRow {
  rowIndex: number;
  data: Record<string, unknown>;
  errors: string[];
  valid: boolean;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: ImportError[];
}

// 用户-人员关联查询结果
export interface UserPersonRow {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
  person_id: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  name?: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  education_level?: string;
  political_status?: string;
  employment_status?: string;
  [key: string]: unknown;
}

// 收藏相关类型
export interface Favorite {
  id: number;
  user_id: number;
  person_id: number;
  notes: string;
  created_at: string;
  person?: Person;
}

export interface FavoriteWithPerson extends Favorite {
  person_name: string;
  person_age: number;
  person_gender: string;
  person_education_level?: string;
  person_address?: string;
}

// 通知相关类型
export interface NotificationItem {
  id: number;
  user_id: number;
  type: 'system' | 'favorite' | 'import' | 'audit' | 'info';
  title: string;
  content: string;
  is_read: boolean;
  link: string;
  created_at: string;
}

// 审计日志相关类型
export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  resource_type: string;
  resource_id: number | null;
  details: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogFilter {
  action?: string;
  resource_type?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

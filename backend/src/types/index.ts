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
  gender: 'male' | 'female' | 'other';
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
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  gender: 'male' | 'female' | 'other';
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

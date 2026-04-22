import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

type RetriableAxiosConfig = {
  _retry?: boolean
  headers?: Record<string, string>
}

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

axios.defaults.timeout = 15000

axios.interceptors.response.use(
  response => response,
  async error => {
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        ElMessage.error('网络请求超时，请检查网络连接后重试')
      } else {
        ElMessage.error('网络连接失败，请检查网络设置')
      }
      return Promise.reject(error)
    }

    const status = error.response.status
    const originalConfig = (error.config || {}) as RetriableAxiosConfig

    if (status === 401 && !originalConfig._retry && !String(error.config?.url || '').includes('/api/auth/refresh')) {
      originalConfig._retry = true

      try {
        const authStore = useAuthStore()

        if (!authStore.refreshToken) {
          throw new Error('缺少刷新令牌')
        }

        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = authStore.refreshAccessToken().finally(() => {
            isRefreshing = false
          })
        }

        const newToken = await refreshPromise
        originalConfig.headers = {
          ...(originalConfig.headers || {}),
          Authorization: `Bearer ${newToken}`
        }

        return axios(originalConfig)
      } catch (refreshError) {
        const authStore = useAuthStore()
        authStore.handleRefreshFailure()
        ElMessage.error('登录已过期，请重新登录')
        return Promise.reject(refreshError)
      }
    }

    switch (status) {
      case 401:
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
        ElMessage.error('登录已过期，请重新登录')
        setTimeout(() => {
          window.location.hash = '#/login'
          if (window.location.hash === '#/login') {
            window.location.reload()
          }
        }, 500)
        break
      case 403:
        ElMessage.error('权限不足，无法执行此操作')
        break
      case 500:
        ElMessage.error('服务器内部错误，请稍后重试')
        break
      default:
        ElMessage.error(error.response.data?.message || `请求失败 (${status})`)
    }
    return Promise.reject(error)
  }
)

// 定义接口类型
interface Person {
  id?: number
  name: string
  age: number
  gender: string
  phone: string
  education: string
  skills: string
  workExperience: string
  address: string
  createdAt?: string
  updatedAt?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface LoginData {
  username: string
  password: string
}

interface AuthResponse {
  token: string
  user: {
    id: number
    username: string
    role: string
  }
}

interface EducationStat {
  education_level: string
  count: number
}

interface AgeDistStat {
  age_range: string
  count: number
}

interface GenderDistStat {
  gender: string
  count: number
}

interface TopSkillStat {
  skill_name: string
  count: number
}

interface SkillCategoryStat {
  category: string
  count: number
}

interface CooperationStat {
  strong: number
  moderate: number
  weak: number
  total: number
}

interface RecentRegistrationStat {
  last7Days: number
  last30Days: number
  total: number
}

interface AgricultureStat {
  avgFarmingYears: number
  totalCrops: number
  popularCrops: unknown[]
  breedingTypes: unknown[]
}

interface Statistics {
  totalTalents: number
  avgAge: number
  totalSkills: number
  cooperation: CooperationStat
  skillsCategory: SkillCategoryStat[]
  topSkills: TopSkillStat[]
  agriculture: AgricultureStat
  education: EducationStat[]
  ageDistribution: AgeDistStat[]
  genderDistribution: GenderDistStat[]
  recentRegistrations: RecentRegistrationStat
}

interface SearchCriteria {
  skills?: string
  education?: string
  minAge?: number
  maxAge?: number
  gender?: string
  address?: string
  employment_status?: string
}

// 人员信息管理 API 服务
class PersonService {
  // 获取所有人员
  async getPersons(): Promise<Person[]> {
    const response = await axios.get('/api/persons')
    return response.data.data || response.data
  }

  // 分页获取人员
  async getPersonsPaginated(params: { page: number; limit: number; sortBy?: string; sortOrder?: string }): Promise<PaginatedResponse<Person>> {
    const response = await axios.get('/api/persons', { params })
    return response.data
  }

  // 创建新人员
  async createPerson(personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Person>> {
    const response = await axios.post('/api/persons', personData)
    return response.data
  }

  // 更新人员信息
  async updatePerson(id: number, personData: Partial<Person>): Promise<ApiResponse<Person>> {
    const response = await axios.put(`/api/persons/${id}`, personData)
    return response.data
  }

  // 删除人员
  async deletePerson(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await axios.delete(`/api/persons/${id}`)
    return response.data
  }

  // 获取数据统计
  async getStatistics(): Promise<Statistics> {
    const response = await axios.get('/api/statistics')
    return response.data.data || response.data
  }

  // 获取技能库统计
  async getSkillsLibraryStats(): Promise<any> {
    const response = await axios.get('/api/skills-library-stats')
    return response.data
  }

  // 获取人员详细信息
  async getPersonDetails(id: number): Promise<ApiResponse<Person>> {
    const response = await axios.get(`/api/persons/${id}/details`)
    return response.data
  }

  // 搜索人才
  async searchTalents(searchCriteria: SearchCriteria): Promise<ApiResponse<Person[]>> {
    const response = await axios.get('/api/search', { params: searchCriteria })
    return response.data
  }

  // 分页搜索人才
  async searchTalentsPaginated(searchCriteria: SearchCriteria & { page: number; limit: number }): Promise<PaginatedResponse<Person>> {
    const response = await axios.get('/api/search', { params: searchCriteria })
    return response.data
  }

  // 批量删除
  async batchDelete(ids: number[]): Promise<{ success: boolean; data: { deletedCount: number }; message?: string }> {
    const response = await axios.post('/api/batch/delete', { ids })
    return response.data
  }

  // 批量更新
  async batchUpdate(ids: number[], updates: Record<string, unknown>): Promise<{ success: boolean; data: { updatedCount: number }; message?: string }> {
    const response = await axios.put('/api/batch/update', { ids, updates })
    return response.data
  }

  // 上传导入文件
  async uploadImport(file: File): Promise<{ success: boolean; data: { sessionId: string; totalRows: number; validRows: number; invalidRows: number } }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post('/api/import/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  // 获取导入预览
  async previewImport(sessionId: string): Promise<{ success: boolean; data: { totalRows: number; validRows: number; invalidRows: number; previews: Array<{ rowIndex: number; data: Record<string, unknown>; errors: string[]; valid: boolean }> } }> {
    const response = await axios.post('/api/import/preview', { sessionId })
    return response.data
  }

  // 确认导入
  async confirmImport(sessionId: string): Promise<{ success: boolean; data: { success: number; failed: number; errors?: Array<{ row: number; field: string; message: string }> }; message?: string }> {
    const response = await axios.post('/api/import/confirm', { sessionId })
    return response.data
  }

  // 下载导入模板
  async downloadTemplate(): Promise<Blob> {
    const response = await axios.get('/api/import/template', { responseType: 'blob' })
    return response.data as Blob
  }

  // 用户登录
  async login(loginData: LoginData): Promise<AuthResponse> {
    const response = await axios.post('/api/auth/login', loginData)
    return response.data
  }

  // 用户注册
  async register(userData: LoginData): Promise<AuthResponse> {
    const response = await axios.post('/api/auth/register', userData)
    return response.data
  }

  // === 收藏相关 API ===
  async getFavorites(): Promise<unknown> {
    const response = await axios.get('/api/favorites')
    return response.data
  }

  async addFavorite(personId: number, notes?: string): Promise<unknown> {
    const response = await axios.post(`/api/favorites/${personId}`, { notes })
    return response.data
  }

  async removeFavorite(personId: number): Promise<unknown> {
    const response = await axios.delete(`/api/favorites/${personId}`)
    return response.data
  }

  async updateFavoriteNotes(personId: number, notes: string): Promise<unknown> {
    const response = await axios.put(`/api/favorites/${personId}`, { notes })
    return response.data
  }

  // === 通知相关 API ===
  async getNotifications(params?: { page?: number; limit?: number }): Promise<unknown> {
    const response = await axios.get('/api/notifications', { params })
    return response.data
  }

  async getUnreadNotificationCount(): Promise<unknown> {
    const response = await axios.get('/api/notifications/unread-count')
    return response.data
  }

  async markNotificationRead(id: number): Promise<unknown> {
    const response = await axios.put(`/api/notifications/${id}/read`)
    return response.data
  }

  async markAllNotificationsRead(): Promise<unknown> {
    const response = await axios.put('/api/notifications/read-all')
    return response.data
  }

  async deleteNotification(id: number): Promise<unknown> {
    const response = await axios.delete(`/api/notifications/${id}`)
    return response.data
  }

  // 验证token
  async verifyToken(): Promise<{ valid: boolean; user?: unknown }> {
    try {
      const response = await axios.get('/api/auth/verify')
      return response.data
    } catch (error) {
      return { valid: false }
    }
  }
}

export default new PersonService()

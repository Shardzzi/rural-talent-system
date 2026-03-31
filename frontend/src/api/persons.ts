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

interface Statistics {
  totalPersons: number
  skillCategories: number
  averageAge: number
  educationDistribution: Record<string, number>
  skillsDistribution: Record<string, number>
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

interface Statistics {
  totalPersons: number
  totalSkills: number
  totalExperience: number
  [key: string]: any
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
    try {
      const response = await axios.get('/api/persons')
      return response.data.data || response.data
    } catch (error) {
      throw error
    }
  }

  // 创建新人员
  async createPerson(personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Person>> {
    try {
      const response = await axios.post('/api/persons', personData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 更新人员信息
  async updatePerson(id: number, personData: Partial<Person>): Promise<ApiResponse<Person>> {
    try {
      const response = await axios.put(`/api/persons/${id}`, personData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 删除人员
  async deletePerson(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await axios.delete(`/api/persons/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 获取数据统计
  async getStatistics(): Promise<Statistics> {
    try {
      const response = await axios.get('/api/statistics')
      return response.data.data || response.data
    } catch (error) {
      throw error
    }
  }

  // 获取技能库统计
  async getSkillsLibraryStats(): Promise<any> {
    try {
      const response = await axios.get('/api/skills-library-stats')
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 获取人员详细信息
  async getPersonDetails(id: number): Promise<ApiResponse<Person>> {
    try {
      const response = await axios.get(`/api/persons/${id}/details`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 搜索人才
  async searchTalents(searchCriteria: SearchCriteria): Promise<ApiResponse<Person[]>> {
    const response = await axios.get('/api/search', { params: searchCriteria })
    return response.data
  }

  // 用户登录
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post('/api/auth/login', loginData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 用户注册
  async register(userData: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post('/api/auth/register', userData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 验证token
  async verifyToken(): Promise<{ valid: boolean; user?: any }> {
    try {
      const response = await axios.get('/api/auth/verify')
      return response.data
    } catch (error) {
      return { valid: false }
    }
  }
}

export default new PersonService()

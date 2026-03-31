import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// 定义类型
interface User {
  id: number
  username: string
  role: string
  person_id?: number  // 添加可选的person_id字段
}

interface AuthData {
  token: string
  refreshToken?: string
  user: User
}

interface LoginData {
  username: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token') || null)
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken') || null)
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))
  const isGuest = ref<boolean>(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')
  const userRole = computed(() => {
    if (isGuest.value) return 'guest'
    return user.value?.role || null
  })

  // 设置认证信息
  const setAuth = (authData: AuthData) => {
    token.value = authData.token
    refreshToken.value = authData.refreshToken || refreshToken.value
    user.value = authData.user
    isGuest.value = false
    
    localStorage.setItem('token', authData.token)
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken)
    }
    localStorage.setItem('user', JSON.stringify(authData.user))
    
    // 设置API默认请求头
    if (axios.defaults) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`
    }
  }

  // 清除认证信息
  const clearAuth = () => {
    token.value = null
    refreshToken.value = null
    user.value = null
    isGuest.value = false
    
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    // 清除API请求头
    if (axios.defaults) {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // 设置游客模式
  const setGuest = () => {
    clearAuth()
    isGuest.value = true
  }

  // 登录
  const login = async (credentials: LoginData) => {
    try {
      const response = await axios.post('/api/auth/login', credentials)
      const result = response.data

      if (!result.success) {
        throw new Error(result.message || '登录失败')
      }

      setAuth(result.data)
      return result.data
    } catch (error) {
      const err = error as Error
      throw new Error(err.message || '登录失败，请检查网络连接')
    }
  }

  // 注册
  const register = async (userData: LoginData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      const result = response.data

      if (!result.success) {
        throw new Error(result.message || '注册失败')
      }

      return result.data
    } catch (error) {
      const err = error as Error
      throw new Error(err.message || '注册失败，请检查网络连接')
    }
  }

  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await axios.post('/api/auth/logout')
      }
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      clearAuth()
    }
  }

  const refreshAccessToken = async (): Promise<string> => {
    if (!refreshToken.value) {
      throw new Error('刷新令牌不存在')
    }

    const response = await axios.post('/api/auth/refresh', null, {
      headers: {
        Authorization: `Bearer ${refreshToken.value}`
      }
    })

    const result = response.data
    if (!result.success || !result.data?.token) {
      throw new Error(result.message || '刷新令牌失败')
    }

    token.value = result.data.token
    refreshToken.value = result.data.refreshToken || refreshToken.value
    localStorage.setItem('token', token.value)
    if (refreshToken.value) {
      localStorage.setItem('refreshToken', refreshToken.value)
    }

    if (axios.defaults) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }

    return token.value
  }

  const handleRefreshFailure = () => {
    clearAuth()
    if (window.location.hash !== '#/login') {
      window.location.hash = '#/login'
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      if (!token.value) {
        throw new Error('未登录')
      }

      const response = await axios.get('/api/auth/me')
      const result = response.data

      if (!result.success) {
        throw new Error(result.message || '获取用户信息失败')
      }

      user.value = result.data
      localStorage.setItem('user', JSON.stringify(result.data))
      
      return result.data
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  // 修改密码
  const changePassword = async (passwordData: any) => {
    try {
      if (!token.value) {
        throw new Error('未登录')
      }

      const response = await axios.put('/api/auth/change-password', passwordData)
      const result = response.data

      if (!result.success) {
        throw new Error(result.message || '密码修改失败')
      }

      return result
    } catch (error) {
      const err = error as Error
      throw new Error(err.message || '密码修改失败，请检查网络连接')
    }
  }

  // 将person与用户关联
  const linkPersonToUser = async (personId: any) => {
    try {
      const response = await axios.put('/api/auth/link-person', { personId })
      const result = response.data
      
      if (!result.success) {
        throw new Error(result.message || '关联个人信息失败')
      }
      
      if (user.value) {
        user.value.person_id = personId
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      
      return result
    } catch (error) {
      throw error
    }
  }

  // 初始化（检查token有效性）
  const init = async () => {
    if (token.value) {
      try {
        await getCurrentUser()
        // 设置API默认请求头
        if (axios.defaults) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        }
      } catch (error) {
        console.warn('Token validation failed:', error)
        clearAuth()
      }
    }
  }

  // 初始化认证状态
  const initializeAuth = () => {
    // 从localStorage恢复认证状态
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        refreshToken.value = storedRefreshToken
        user.value = JSON.parse(storedUser)
        
        // 设置API默认请求头
        if (axios.defaults) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        }
      } catch (error) {
        clearAuth()
      }
    }
  }

  return {
    // 状态
    token,
    refreshToken,
    user,
    isGuest,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    isUser,
    userRole,
    
    // 方法
    setAuth,
    clearAuth,
    setGuest,
    login,
    register,
    logout,
    refreshAccessToken,
    handleRefreshFailure,
    getCurrentUser,
    changePassword,
    linkPersonToUser,
    initializeAuth,
    init
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/persons'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const isGuest = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')
  const userRole = computed(() => {
    if (isGuest.value) return 'guest'
    return user.value?.role || null
  })

  // 设置认证信息
  const setAuth = (authData) => {
    token.value = authData.token
    user.value = authData.user
    isGuest.value = false
    
    localStorage.setItem('token', authData.token)
    localStorage.setItem('user', JSON.stringify(authData.user))
    
    // 设置API默认请求头
    if (api.defaults) {
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`
    }
  }

  // 清除认证信息
  const clearAuth = () => {
    token.value = null
    user.value = null
    isGuest.value = false
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 清除API请求头
    if (api.defaults) {
      delete api.defaults.headers.common['Authorization']
    }
  }

  // 设置游客模式
  const setGuest = () => {
    clearAuth()
    isGuest.value = true
  }

  // 登录
  const login = async (credentials) => {
    try {
      const response = await fetch('http://localhost:8083/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '登录失败')
      }

      setAuth(result.data)
      return result.data
    } catch (error) {
      throw new Error(error.message || '登录失败，请检查网络连接')
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:8083/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '注册失败')
      }

      return result.data
    } catch (error) {
      throw new Error(error.message || '注册失败，请检查网络连接')
    }
  }

  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await fetch('http://localhost:8083/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      clearAuth()
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      if (!token.value) {
        throw new Error('未登录')
      }

      const response = await fetch('http://localhost:8083/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '获取用户信息失败')
      }

      user.value = result.data
      localStorage.setItem('user', JSON.stringify(result.data))
      
      return result.data
    } catch (error) {
      // 如果获取用户信息失败，可能是token过期，清除认证信息
      clearAuth()
      throw error
    }
  }

  // 修改密码
  const changePassword = async (passwordData) => {
    try {
      if (!token.value) {
        throw new Error('未登录')
      }

      const response = await fetch('http://localhost:8083/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '密码修改失败')
      }

      return result
    } catch (error) {
      throw new Error(error.message || '密码修改失败，请检查网络连接')
    }
  }

  // 将person与用户关联
  const linkPersonToUser = async (personId) => {
    try {
      // 修复：使用fetch或者axios.put而不是api.put
      const response = await fetch('http://localhost:8083/api/auth/link-person', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ personId }) // 修正参数名为personId
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '关联个人信息失败');
      }
      
      // 更新用户信息中的person_id
      if (user.value) {
        user.value.person_id = personId
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      
      console.log('✅ 用户关联person成功:', result)
      return result
    } catch (error) {
      console.error('❌ 用户关联person失败:', error)
      throw error
    }
  }

  // 初始化（检查token有效性）
  const init = async () => {
    if (token.value) {
      try {
        await getCurrentUser()
        // 设置API默认请求头
        if (api.defaults) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
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
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        
        // 设置API默认请求头
        if (api.defaults) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        }
        
        console.log('✅ 认证状态已恢复:', user.value)
      } catch (error) {
        console.error('❌ 恢复认证状态失败:', error)
        clearAuth()
      }
    }
  }

  return {
    // 状态
    token,
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
    getCurrentUser,
    changePassword,
    linkPersonToUser,
    initializeAuth,
    init
  }
})

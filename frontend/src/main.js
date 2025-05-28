import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import axios from 'axios'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 配置 axios
axios.defaults.baseURL = 'http://localhost:8083'
axios.defaults.headers.common['Content-Type'] = 'application/json'

// 添加请求拦截器 - 自动添加认证token
axios.interceptors.request.use(
  config => {
    // 从localStorage获取token并添加到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log('🚀 发送API请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
      params: config.params,
      hasAuth: !!token
    })
    return config
  },
  error => {
    console.error('❌ 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 添加响应拦截器
axios.interceptors.response.use(
  response => {
    console.log('✅ API响应成功:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    })
    return response
  },
  error => {
    console.error('❌ API响应错误:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    })
    return Promise.reject(error)
  }
)

// 注册 Pinia 状态管理
app.use(pinia)

// 注册 Vue Router
app.use(router)

// 注册 Element Plus
app.use(ElementPlus, {
  locale: zhCn,
  // 添加全局配置以避免 teleport 相关问题
  size: 'default',
  zIndex: 3000,
})

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局错误处理 - 特别处理 Element Plus 和 ResizeObserver 错误
app.config.errorHandler = (err, instance, info) => {
  if (err.message && (
    err.message.includes('ResizeObserver') ||
    err.message.includes('getComputedStyle') ||
    err.message.includes('parameter 1 is not of type \'Element\'')
  )) {
    // 静默处理这些已知的浏览器兼容性问题
    console.debug('🔇 已静默处理浏览器兼容性错误:', err.message)
    return
  }
  
  // 其他错误正常处理
  console.error('🚨 Vue应用错误:', {
    error: err,
    info: info,
    instance: instance
  })
}

// 全局捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', event => {
  if (event.reason && event.reason.message && (
    event.reason.message.includes('ResizeObserver') ||
    event.reason.message.includes('getComputedStyle') ||
    event.reason.message.includes('parameter 1 is not of type \'Element\'')
  )) {
    console.debug('🔇 已静默处理浏览器兼容性 Promise 错误')
    event.preventDefault()
    return
  }
  console.error('🚨 未处理的 Promise 拒绝:', event.reason)
})

// 全局捕获 ResizeObserver 错误
const originalResizeObserver = window.ResizeObserver
if (originalResizeObserver) {
  window.ResizeObserver = class extends originalResizeObserver {
    constructor(callback) {
      super((entries, observer) => {
        // 使用 requestAnimationFrame 来避免循环
        window.requestAnimationFrame(() => {
          try {
            callback(entries, observer)
          } catch (error) {
            if (error.message && (
              error.message.includes('ResizeObserver loop limit exceeded') ||
              error.message.includes('ResizeObserver loop completed with undelivered notifications')
            )) {
              console.debug('🔇 已静默处理 ResizeObserver 错误:', error.message)
              return
            }
            throw error
          }
        })
      })
    }
  }
}

// 额外的错误拦截 - 包括 Element Plus 相关错误
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('ResizeObserver') ||
    event.message.includes('getComputedStyle') ||
    event.message.includes('parameter 1 is not of type \'Element\'')
  )) {
    console.debug('🔇 已拦截浏览器兼容性全局错误')
    event.preventDefault()
    return
  }
})

app.config.globalProperties.$http = axios

app.mount('#app')

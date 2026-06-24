import { createApp } from 'vue'
// Element Plus 按需导入
import {
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElForm,
  ElFormItem,
  ElDialog,
  ElCard,
  ElRow,
  ElCol,
  ElTable,
  ElTableColumn,
  ElTag,
  ElIcon,
  ElPageHeader,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElContainer,
  ElHeader,
  ElMain,
  ElAside,
  ElMenu,
  ElMenuItem,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElAvatar,
  ElMessage,
  ElInputNumber,
  ElAlert,
  ElDivider,
  ElPopconfirm,
  ElPagination,
  ElEmpty,
  ElTimeline,
  ElTimelineItem,
  ElLoading,
  ElConfigProvider,
  ElUpload,
  ElSteps,
  ElStep,
  ElProgress,
  ElResult,
  ElCollapse,
  ElCollapseItem,
  ElDrawer,
  ElSlider,
  ElSwitch,
  ElTabs,
  ElTabPane,
  ElBadge,
  ElPopover,
  ElScrollbar,
  ElTooltip,
  ElCheckbox,
  ElDescriptions,
  ElDescriptionsItem
} from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/index.css'
import 'element-plus/dist/index.css'
import axios from 'axios'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 配置 axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || ''
axios.defaults.headers.common['Content-Type'] = 'application/json'

// 注册 Pinia 状态管理
app.use(pinia)

// 注册 Vue Router
app.use(router)

// 注册 Element Plus 组件
const components = [
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElForm,
  ElFormItem,
  ElDialog,
  ElCard,
  ElRow,
  ElCol,
  ElTable,
  ElTableColumn,
  ElTag,
  ElIcon,
  ElPageHeader,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElContainer,
  ElHeader,
  ElMain,
  ElAside,
  ElMenu,
  ElMenuItem,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElAvatar,
  ElInputNumber,
  ElAlert,
  ElDivider,
  ElPopconfirm,
  ElPagination,
  ElEmpty,
  ElTimeline,
  ElTimelineItem,
  ElConfigProvider,
  ElUpload,
  ElSteps,
  ElStep,
  ElProgress,
  ElResult,
  ElCollapse,
  ElCollapseItem,
  ElDrawer,
  ElSlider,
  ElSwitch,
  ElTabs,
  ElTabPane,
  ElBadge,
  ElPopover,
  ElScrollbar,
  ElTooltip,
  ElCheckbox,
  ElDescriptions,
  ElDescriptionsItem
]

components.forEach(component => {
  app.use(component)
})

// 注册 v-loading 指令
app.directive('loading', ElLoading.directive)

// 全局挂载 ElMessage
app.config.globalProperties.$message = ElMessage

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局错误处理 - 特别处理 Element Plus 和 ResizeObserver 错误
app.config.errorHandler = (err, instance, info) => {
  const error = err as Error
  if (error.message && (
    error.message.includes('ResizeObserver') ||
    error.message.includes('getComputedStyle') ||
    error.message.includes('parameter 1 is not of type \'Element\'')
  )) {
    // 静默处理这些已知的浏览器兼容性问题
    console.debug('🔇 已静默处理浏览器兼容性错误:', error.message)
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
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        // 使用 requestAnimationFrame 来避免循环
        window.requestAnimationFrame(() => {
          try {
            callback(entries, observer)
          } catch (error) {
            const err = error as Error
            if (err.message && (
              err.message.includes('ResizeObserver loop limit exceeded') ||
              err.message.includes('ResizeObserver loop completed with undelivered notifications')
            )) {
              console.debug('🔇 已静默处理 ResizeObserver 错误:', err.message)
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

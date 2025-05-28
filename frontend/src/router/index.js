import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由组件
const LoginForm = () => import('@/components/LoginForm.vue')
const AdminDashboard = () => import('@/views/AdminDashboard.vue')
const UserDashboard = () => import('@/views/UserDashboard.vue')
const GuestView = () => import('@/views/GuestView.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: GuestView,
    meta: {
      title: '数字乡村人才信息系统'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
    meta: { 
      requiresGuest: true,
      title: '登录 - 数字乡村人才信息系统'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminDashboard,
    meta: { 
      requiresAuth: true, 
      requiresAdmin: true,
      title: '管理员控制台 - 数字乡村人才信息系统'
    }
  },
  {
    path: '/user',
    name: 'User',
    component: UserDashboard,
    meta: { 
      requiresAuth: true,
      title: '用户中心 - 数字乡村人才信息系统'
    }
  },
  {
    path: '/guest',
    name: 'Guest',
    component: GuestView,
    meta: {
      title: '人才信息浏览 - 数字乡村人才信息系统'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 如果是首次访问且有token，尝试验证用户信息
  if (authStore.token && !authStore.user && to.name !== 'Login') {
    try {
      await authStore.init()
    } catch (error) {
      console.warn('Authentication check failed:', error)
    }
  }

  // 检查访客页面权限
  if (to.meta.requiresGuest) {
    if (authStore.isAuthenticated) {
      // 已登录用户重定向到对应的仪表板
      if (authStore.isAdmin) {
        next('/admin')
      } else {
        next('/user')
      }
      return
    }
  }

  // 检查登录权限
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
  }

  // 检查管理员权限
  if (to.meta.requiresAdmin) {
    if (!authStore.isAdmin) {
      // 非管理员重定向到用户页面或登录页面
      if (authStore.isAuthenticated) {
        next('/user')
      } else {
        next('/login')
      }
      return
    }
  }

  next()
})

export default router

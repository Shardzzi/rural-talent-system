import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'
import { clearStateForNavigation } from '@/composables/useStatePreservation'

// 扩展路由元信息类型
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresAdmin?: boolean;
    title?: string;
    breadcrumb?: Array<{ title: string; path?: string }>;
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/GuestView.vue'),
        meta: {
          title: '数字乡村人才信息系统',
          breadcrumb: [{ title: '首页' }]
        }
      },
      {
        path: 'talents',
        name: 'Talents',
        component: () => import('@/views/GuestView.vue'),
        meta: {
          title: '人才库 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '人才库' }]
        }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/AdminDashboard.vue'),
        meta: { 
          requiresAuth: true, 
          requiresAdmin: true,
          title: '管理后台 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '管理后台' }]
        }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/UserDashboard.vue'),
        meta: { 
          requiresAuth: true,
          title: '个人中心 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '个人中心' }]
        }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/AdminDashboard.vue'),
        meta: { 
          requiresAuth: true, 
          title: '数据分析 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '数据分析' }]
        }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/StatisticsDashboard.vue'),
        meta: { 
          requiresAuth: true,
          requiresAdmin: true,
          title: '统计面板 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '统计面板' }]
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/UserDashboard.vue'),
        meta: { 
          requiresAuth: true,
          title: '我的 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '我的' }]
        }
      },
      {
        path: 'guest',
        name: 'Guest',
        component: () => import('@/views/GuestView.vue'),
        meta: {
          title: '人才信息浏览 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '人才库' }]
        }
      },
      {
        path: 'compare',
        name: 'Compare',
        component: () => import('@/components/comparison/TalentComparison.vue'),
        meta: {
          requiresAuth: true,
          title: '人才对比 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '人才对比' }]
        }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/NotificationCenter.vue'),
        meta: {
          requiresAuth: true,
          title: '通知中心 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '通知中心' }]
        }
      },
      {
        path: 'favorites',
        name: 'Favorites',
        component: () => import('@/components/favorites/FavoriteList.vue'),
        meta: {
          requiresAuth: true,
          title: '我的收藏 - 数字乡村人才信息系统',
          breadcrumb: [{ title: '我的收藏' }]
        }
      }
    ]
  },
  {
    path: '/bigscreen',
    name: 'BigScreen',
    component: () => import('@/views/BigScreenView.vue'),
    meta: {
      title: '数字乡村人才信息大数据平台'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/components/LoginForm.vue'),
    meta: { 
      requiresGuest: true,
      title: '登录 - 数字乡村人才信息系统'
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
router.beforeEach(async (to, _from, next) => {
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

router.beforeEach((to, from) => {
  clearStateForNavigation(from.name, to.name)
})

export default router

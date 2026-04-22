<template>
  <!-- Desktop Sidebar -->
  <el-aside 
    v-if="!isMobile"
    :width="collapsed ? '64px' : '240px'" 
    class="sidebar-desktop"
    role="navigation"
    aria-label="主导航"
  >
    <div class="sidebar-logo">
      <el-icon :size="24" class="logo-icon"><HomeFilled /></el-icon>
      <span v-show="!collapsed" class="logo-text">数字乡村人才</span>
    </div>
    
    <el-menu
      :default-active="activeRoute"
      class="sidebar-menu"
      :collapse="collapsed"
      :collapse-transition="false"
    >
      <template v-for="item in menuItems" :key="item.path">
        <el-menu-item 
          v-if="item.show(authStore.user?.role)" 
          :index="item.path"
          :aria-current="activeRoute === item.path ? 'page' : undefined"
          @click="handleMenuClick(item)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>
            <span>{{ item.title }}</span>
            <el-icon v-if="item.authRequired && !authStore.isAuthenticated" class="lock-icon"><Lock /></el-icon>
          </template>
        </el-menu-item>
      </template>
    </el-menu>

    <div class="sidebar-footer">
      <el-button class="collapse-btn" link @click="$emit('toggle')">
        <el-icon :size="18">
          <Expand v-if="collapsed" />
          <Fold v-else />
        </el-icon>
      </el-button>
    </div>
  </el-aside>

  <!-- Mobile Drawer -->
  <el-drawer
    v-else
    :model-value="!collapsed"
    @update:model-value="(val: boolean) => $emit('update:collapsed', !val)"
    direction="ltr"
    size="240px"
    class="sidebar-drawer"
    :with-header="false"
  >
    <div class="sidebar-logo">
      <el-icon :size="24" class="logo-icon"><HomeFilled /></el-icon>
      <span class="logo-text">数字乡村人才</span>
    </div>
    
    <el-menu
      :default-active="activeRoute"
      class="sidebar-menu"
    >
      <template v-for="item in menuItems" :key="item.path">
        <el-menu-item 
          v-if="item.show(authStore.user?.role)" 
          :index="item.path"
          :aria-current="activeRoute === item.path ? 'page' : undefined"
          @click="handleMenuClick(item)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>
            <span>{{ item.title }}</span>
            <el-icon v-if="item.authRequired && !authStore.isAuthenticated" class="lock-icon"><Lock /></el-icon>
          </template>
        </el-menu-item>
      </template>
    </el-menu>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { 
  HomeFilled, 
  User, 
  DataAnalysis, 
  Setting, 
  Lock,
  Expand,
  Fold,
  UserFilled
} from '@element-plus/icons-vue'

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle', 'update:collapsed'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const activeRoute = computed(() => {
  if (route.path === '/' || route.path === '/guest') return '/talents'
  if (route.path === '/user') return '/profile'
  return route.path
})

// Menu definitions
const menuItems = [
  {
    path: '/talents',
    title: '人才库',
    icon: User,
    authRequired: false,
    show: (_role?: string) => true
  },
  {
    path: '/analytics',
    title: '数据分析',
    icon: DataAnalysis,
    authRequired: true,
    show: (_role?: string) => true // Visible to all, but requires auth check on click
  },
  {
    path: '/profile',
    title: '我的',
    icon: UserFilled,
    authRequired: true,
    show: (_role?: string) => true // Visible to all, but requires auth check on click
  },
  {
    path: '/admin',
    title: '管理后台',
    icon: Setting,
    authRequired: true,
    show: (role?: string) => role === 'admin'
  }
]

const handleMenuClick = (item: any) => {
  if (item.authRequired && !authStore.isAuthenticated) {
    ElMessage.warning('请先登录以访问此功能')
    router.push('/login')
    if (isMobile.value) {
      emit('update:collapsed', true)
    }
    return
  }
  
  router.push(item.path)
  
  if (isMobile.value) {
    emit('update:collapsed', true)
  }
}
</script>

<style scoped>
.sidebar-desktop {
  background-color: #ffffff;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: var(--color-primary);
  background: var(--color-primary-light-9);
  overflow: hidden;
  white-space: nowrap;
}

.logo-icon {
  flex-shrink: 0;
}

.logo-text {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 240px;
}

.el-menu-item.is-active {
  background-color: var(--color-primary-light-9);
  color: var(--color-primary);
  border-right: 3px solid var(--color-primary);
}

.lock-icon {
  margin-left: auto;
  opacity: 0.5;
}

.sidebar-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--color-border-light);
  background-color: #fafafa;
}

.collapse-btn {
  width: 100%;
  height: 100%;
  color: var(--color-text-secondary);
}

.collapse-btn:hover {
  color: var(--color-primary);
  background-color: var(--color-primary-light-9);
}

/* Override default drawer padding */
:deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
}
</style>
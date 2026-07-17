<template>
  <!-- Desktop Sidebar -->
  <el-aside 
    v-if="!isMobile"
    :width="collapsed ? '76px' : '248px'"
    class="sidebar-desktop"
    role="navigation"
    aria-label="主导航"
  >
    <div class="sidebar-logo">
      <span class="logo-mark">
        <el-icon :size="22" class="logo-icon"><HomeFilled /></el-icon>
      </span>
      <span v-show="!collapsed" class="logo-copy">
        <strong class="logo-text">乡村人才</strong>
        <small class="logo-subtitle">RURAL TALENT</small>
      </span>
    </div>

    <div v-show="!collapsed" class="nav-caption">平台导航</div>
    
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
      <span v-show="!collapsed" class="version-label">数字乡村 · v4.0</span>
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
      <span class="logo-mark">
        <el-icon :size="22" class="logo-icon"><HomeFilled /></el-icon>
      </span>
      <span class="logo-copy">
        <strong class="logo-text">乡村人才</strong>
        <small class="logo-subtitle">RURAL TALENT</small>
      </span>
    </div>
    <div class="nav-caption">平台导航</div>
    
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
  background:
    radial-gradient(circle at 12% 88%, rgba(215, 161, 79, 0.12), transparent 16rem),
    var(--color-sidebar);
  border-right: 0;
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  z-index: 10;
  box-shadow: 10px 0 32px rgba(16, 45, 36, 0.08);
}

.sidebar-logo {
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.025);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  white-space: nowrap;
}

.logo-mark {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  color: var(--color-sidebar-deep);
  background: var(--color-accent);
  border-radius: 14px 14px 14px 5px;
  box-shadow: 0 8px 20px rgba(7, 26, 20, 0.28);
}

.logo-icon {
  flex-shrink: 0;
}

.logo-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.logo-subtitle {
  color: rgba(255, 255, 255, 0.52);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.nav-caption {
  padding: 24px 24px 10px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.sidebar-menu {
  flex: 1;
  padding: 0 10px;
  border-right: none;
  overflow-y: auto;
  background: transparent;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 248px;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  margin: 5px 0;
  color: rgba(255, 255, 255, 0.68);
  border-radius: 12px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.el-menu-item.is-active {
  color: var(--color-sidebar-deep);
  background: #f8f4e8;
  border-right: 0;
  box-shadow: 0 8px 18px rgba(7, 26, 20, 0.18);
}

.lock-icon {
  margin-left: auto;
  opacity: 0.5;
}

.sidebar-footer {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(0, 0, 0, 0.08);
}

.version-label {
  color: rgba(255, 255, 255, 0.38);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.collapse-btn {
  width: 60px;
  height: 60px;
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
}

.collapse-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.08);
}

/* Override default drawer padding */
:deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-sidebar);
}

:deep(.sidebar-drawer) {
  --el-drawer-bg-color: var(--color-sidebar);
}

:deep(.sidebar-drawer .el-menu) {
  background: transparent;
}
</style>

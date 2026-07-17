<template>
  <el-header class="header-bar" role="banner">
    <a href="#main-content" class="skip-link">跳转到主要内容</a>
    <div class="header-left">
      <el-button 
        class="mobile-menu-btn" 
        link 
        @click="$emit('toggle-sidebar')"
        v-if="isMobile"
      >
        <el-icon :size="24"><Menu /></el-icon>
      </el-button>

      <div v-if="isMobile" class="mobile-brand">
        <span class="mobile-brand-mark"></span>
        <span>乡村人才</span>
      </div>
      
      <div class="page-context" v-if="!isMobile">
        <span class="context-label">工作空间</span>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbs"
              :key="index"
              :to="item.path ? { path: item.path } : undefined"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>
    
    <div class="header-right">
      <el-tooltip content="引导教程" placement="bottom" :hide-after="0">
        <el-button link class="action-btn" @click="handleStartTour">
          <el-icon :size="20"><Compass /></el-icon>
        </el-button>
      </el-tooltip>

      <el-tooltip content="无障碍设置" placement="bottom" :hide-after="0">
        <el-button link class="action-btn" @click="handleOpenA11ySettings">
          <el-icon :size="20"><SetUp /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="帮助中心" placement="bottom" :hide-after="0">
        <el-button link class="action-btn" @click="handleOpenHelp">
          <el-icon :size="20"><QuestionFilled /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-dropdown
        v-if="authStore.isAuthenticated"
        trigger="click"
        :teleported="true"
        popper-class="user-menu-popper"
        @command="handleCommand"
      >
        <div class="user-profile" aria-label="用户菜单">
          <el-avatar :size="32" class="user-avatar">
            {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
          </el-avatar>
          <div class="user-info" v-if="!isMobile">
            <span class="user-name">{{ authStore.user?.username }}</span>
            <el-tag
              :type="authStore.user?.role === 'admin' ? 'danger' : 'primary'"
              size="small"
              effect="plain"
              class="role-badge"
            >
              {{ authStore.user?.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </div>
          <el-icon class="dropdown-icon"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <template v-else>
        <el-button type="primary" class="login-button" @click="$router.push('/login')">
          登录平台
        </el-button>
      </template>
    </div>

    <AccessibilitySettings ref="a11ySettingsRef" />
    <HelpCenter ref="helpCenterRef" />
  </el-header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { 
  Menu, 
  QuestionFilled, 
  CaretBottom, 
  User, 
  SwitchButton,
  SetUp,
  Compass
} from '@element-plus/icons-vue'
import AccessibilitySettings from '@/components/common/AccessibilitySettings.vue'
import HelpCenter from '@/components/common/HelpCenter.vue'
import { startOnboarding, shouldShowOnboarding } from '@/utils/onboarding'

const emit = defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isMobile = ref(false)
const a11ySettingsRef = ref<InstanceType<typeof AccessibilitySettings> | null>(null)
const helpCenterRef = ref<InstanceType<typeof HelpCenter> | null>(null)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  if (shouldShowOnboarding() && authStore.isAuthenticated) {
    const role = (authStore.userRole ?? 'guest') as 'admin' | 'user' | 'guest'
    setTimeout(() => {
      startOnboarding(role)
    }, 1000)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const breadcrumbs = computed(() => {
  const metaBreadcrumb = (route.meta.breadcrumb as Array<{ title: string; path?: string }> | undefined) ?? []
  const homeBreadcrumb = { title: '首页', path: '/' }

  if (!metaBreadcrumb.length) {
    return [homeBreadcrumb]
  }

  if (metaBreadcrumb.length === 1 && metaBreadcrumb[0]?.title === '首页') {
    return [homeBreadcrumb]
  }

  const firstBreadcrumb = metaBreadcrumb[0]?.path
    ? metaBreadcrumb[0]
    : homeBreadcrumb

  const normalized = firstBreadcrumb.path === '/'
    ? metaBreadcrumb.map((item, index) => (index === 0 ? { ...item, path: '/' } : item))
    : [homeBreadcrumb, ...metaBreadcrumb]

  return normalized
})

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await authStore.logout()
      ElMessage.success('退出登录成功')
      router.push('/')
    } catch (error) {
      console.error('退出登录失败:', error)
      ElMessage.error('退出登录失败')
    }
  } else if (command === 'profile') {
    router.push('/user')
  }
}

const handleOpenA11ySettings = () => {
  a11ySettingsRef.value?.open()
}

const handleOpenHelp = () => {
  helpCenterRef.value?.open()
}

const handleStartTour = () => {
  const role = (authStore.userRole ?? 'guest') as 'admin' | 'user' | 'guest'
  startOnboarding(role)
}
</script>

<style scoped>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.2s;
  text-decoration: none;
  font-size: var(--font-size-base);
  border-radius: 0 0 var(--radius-sm) 0;
}

.skip-link:focus {
  top: 0;
}

.header-bar {
  height: 76px;
  background-color: rgba(255, 254, 251, 0.94);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-lg);
  box-shadow: 0 8px 24px rgba(24, 40, 32, 0.035);
  backdrop-filter: blur(18px);
  z-index: 9;
  position: relative;
}

@media screen and (max-width: 768px) {
  .header-bar {
    height: 60px;
    padding: 0 12px;
  }
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.mobile-menu-btn {
  width: 38px;
  height: 38px;
  margin-right: 8px;
  color: var(--color-primary-dark-2);
  border-radius: var(--radius-md);
  background: var(--color-primary-light-9);
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary-dark-2);
  font-weight: 700;
}

.mobile-brand-mark {
  width: 8px;
  height: 20px;
  border-radius: 99px;
  background: var(--color-accent);
}

.page-context {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.context-label {
  color: var(--color-text-placeholder);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.header-right {
  gap: 10px;
}

.action-btn {
  width: 38px;
  height: 38px;
  margin: 0 !important;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.action-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-light-9);
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  min-height: 44px;
  padding: 4px 9px 4px 5px;
  border: 1px solid transparent;
  border-radius: 14px;
  transition: all var(--transition-fast);
}

.user-profile:hover {
  background-color: var(--color-surface-soft);
  border-color: var(--color-border-light);
}

.user-avatar {
  background-color: var(--color-primary);
  color: white;
  font-weight: bold;
  box-shadow: 0 0 0 4px var(--color-primary-light-9);
}

.user-info {
  display: flex;
  flex-direction: column;
  margin-left: 10px;
  margin-right: 4px;
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.role-badge {
  margin-top: 2px;
  transform: scale(0.9);
  transform-origin: left;
}

.dropdown-icon {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-left: 4px;
}

.login-button {
  height: 40px;
  padding: 0 20px;
  border-radius: var(--radius-md);
}

@media screen and (max-width: 560px) {
  .header-right {
    gap: 5px;
  }

  .action-btn {
    display: none;
  }

  .login-button {
    height: 36px;
    padding: 0 14px;
  }
}

</style>

<!-- Global styles for teleported dropdown (cannot be scoped) -->
<style>
.user-menu-popper {
  z-index: 3000 !important;
}

.user-menu-popper .el-dropdown-menu__item:last-child {
  color: var(--el-color-danger);
}
</style>

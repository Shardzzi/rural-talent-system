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
      
      <div class="breadcrumb" v-if="!isMobile">
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
      
      <template v-if="authStore.isAuthenticated">
        <el-dropdown trigger="click" @command="handleCommand">
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
              <el-dropdown-item divided command="logout" class="text-danger">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
      <template v-else>
        <el-button type="primary" @click="$router.push('/login')">
          登录
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
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-lg);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.04);
  z-index: 9;
  position: relative;
}

@media screen and (max-width: 768px) {
  .header-bar {
    padding: 0 var(--spacing-sm);
  }
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.mobile-menu-btn {
  margin-right: 12px;
  color: var(--color-text-regular);
}

.breadcrumb {
  margin-left: 8px;
}

.header-right {
  gap: var(--spacing-md);
}

.action-btn {
  color: var(--color-text-regular);
}

.action-btn:hover {
  color: var(--color-primary);
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.user-profile:hover {
  background-color: var(--color-bg-page);
}

.user-avatar {
  background-color: var(--color-primary-light-3);
  color: white;
  font-weight: bold;
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

.text-danger {
  color: var(--color-danger);
}
</style>

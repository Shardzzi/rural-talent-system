<template>
  <el-config-provider :locale="locale">
    <div id="app">
      <!-- 登录页面：全屏显示，不包含 header 和 main 容器 -->
      <template v-if="isLoginPage">
        <router-view />
      </template>

      <!-- 其他页面：带 header 和 main 容器 -->
      <el-container v-else>
        <el-header class="app-header">
          <div class="header-content">
            <div class="header-left">
              <div class="app-logo">
                <el-icon :size="24"><HomeFilled /></el-icon>
              </div>
              <h1 class="app-title">数字乡村人才信息系统</h1>
            </div>
            <div class="header-actions" v-if="authStore.isAuthenticated">
              <span class="user-info">
                <el-icon><User /></el-icon>
                <span class="user-name">{{ authStore.user.username }}</span>
                <el-tag :type="authStore.user.role === 'admin' ? 'danger' : 'primary'" size="small" effect="dark">
                  {{ authStore.user.role === 'admin' ? '管理员' : '用户' }}
                </el-tag>
              </span>
              <el-button @click="handleLogout" type="danger" size="small" plain>
                <el-icon><SwitchIcon /></el-icon>
                退出登录
              </el-button>
            </div>
            <div class="header-actions" v-else>
              <el-button type="primary" size="small" @click="$router.push('/login')">
                <el-icon><User /></el-icon>
                登录
              </el-button>
            </div>
          </div>
        </el-header>
        <el-main>
          <!-- 调试面板切换按钮 -->
          <div class="debug-toggle" v-if="isDev">
            <el-button @click="showDebug = !showDebug" type="info" size="small" plain>
              {{ showDebug ? '隐藏调试面板' : '显示调试面板' }}
            </el-button>
          </div>
          
          <!-- 调试面板 -->
          <DebugPanel v-if="showDebug && isDev" />
        
          <!-- 路由视图 -->
          <router-view v-if="!showDebug" />
        </el-main>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { Switch as SwitchIcon, HomeFilled, User } from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'
import DebugPanel from './components/DebugPanel.vue'

export default {
  name: 'App',
  components: {
    DebugPanel,
    SwitchIcon,
    HomeFilled,
    User
  },
  setup() {
    const showDebug = ref(false)
    const authStore = useAuthStore()
    const router = useRouter()
    const route = useRoute()
    const locale = zhCn
    const isDev = import.meta.env.DEV
    
    // 判断是否为登录页面
    const isLoginPage = computed(() => route.name === 'Login')
    
    // 初始化认证状态
    authStore.initializeAuth()
    
    const handleLogout = async () => {
      try {
        await authStore.logout()
        ElMessage.success('退出登录成功')
        window.location.href = '/'
      } catch (error) {
        console.error('退出登录失败:', error)
        ElMessage.error('退出登录失败')
        window.location.href = '/'
      }
    }
    
    return {
      showDebug,
      authStore,
      handleLogout,
      locale,
      isLoginPage,
      isDev
    }
  }
}
</script>

<style>
/* ===== 全局应用样式 ===== */

/* Header 样式 - 渐变设计 */
.app-header {
  background: linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 50%, #3b8ccb 100%);
  color: white;
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.user-name {
  font-weight: 500;
}

.debug-toggle {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  min-height: 100vh;
  padding: 0;
}

.el-main {
  padding: 24px;
  width: 100%;
  margin: 0 auto;
}

/* 移动端响应式适配 */
@media screen and (max-width: 768px) {
  .el-main {
    padding: 12px;
  }
  .app-title {
    font-size: 15px;
  }
  .user-info {
    display: none;
  }
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f5f7fa;
  color: #333333;
  overflow-x: hidden;
  overflow-y: auto;
}

/* Element Plus 组件自定义样式 */
.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

/* 错误提示容器 */
#error-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
  
  #error-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 卡片通用动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.el-card {
  border-radius: 10px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

/* 通用工具类 */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.p-2 {
  padding: 8px;
}

.p-4 {
  padding: 16px;
}
</style>

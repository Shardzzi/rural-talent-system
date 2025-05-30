<template>
  <el-config-provider :locale="locale">
    <div id="app">
      <el-container>
        <el-header>
          <div class="header-content">
            <h1>数字乡村人才信息系统</h1>
            <div class="header-actions" v-if="authStore.isAuthenticated">
              <span class="user-info">
                欢迎，{{ authStore.user.username }}
                <el-tag :type="authStore.user.role === 'admin' ? 'danger' : 'primary'" size="small">
                  {{ authStore.user.role === 'admin' ? '管理员' : '用户' }}
                </el-tag>
              </span>
              <el-button @click="handleLogout" type="danger" size="small">
                <el-icon><SwitchIcon /></el-icon>
                退出登录
              </el-button>
            </div>
          </div>
        </el-header>
        <el-main>
          <!-- 调试面板切换按钮 -->
          <div class="debug-toggle">
            <el-button @click="showDebug = !showDebug" type="info" size="small">
              {{ showDebug ? '隐藏调试面板' : '显示调试面板' }}
            </el-button>
          </div>
          
          <!-- 调试面板 -->
          <DebugPanel v-if="showDebug" />
        
        <!-- 路由视图 -->
        <router-view v-if="!showDebug" />
      </el-main>
    </el-container>
  </div>
  </el-config-provider>
</template>

<script>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { Switch as SwitchIcon } from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import DebugPanel from './components/DebugPanel.vue'

export default {
  name: 'App',
  components: {
    DebugPanel,
    SwitchIcon
  },
  setup() {
    const showDebug = ref(false)
    const authStore = useAuthStore()
    const router = useRouter()
    const locale = zhCn
    
    // 初始化认证状态
    authStore.initializeAuth()
    
    const handleLogout = async () => {
      try {
        await authStore.logout()
        ElMessage.success('退出登录成功')
        router.push('/')
      } catch (error) {
        console.error('退出登录失败:', error)
        ElMessage.error('退出登录失败')
      }
    }
    
    return {
      showDebug,
      authStore,
      handleLogout,
      locale
    }
  }
}
</script>

<style>
/* 全局应用样式 */
.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-content h1 {
  margin: 0;
  font-size: 20px;
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

.el-header h1 {
  margin: 0;
  padding: 15px 0;
  width: 100%;
}

.el-main {
  padding: 20px;
  max-width: 1440px;
  margin: 0 auto;
}

/* 移动端响应式适配 */
@media screen and (max-width: 768px) {
  .el-main {
    padding: 10px;
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
  background-color: #ffffff;
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
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
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

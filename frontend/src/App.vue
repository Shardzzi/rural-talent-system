  <template>
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
              <el-icon><Switch /></el-icon>
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
</template>

<script>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Switch } from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import DebugPanel from './components/DebugPanel.vue'

export default {
  name: 'App',
  components: {
    DebugPanel,
    Switch
  },
  setup() {
    const showDebug = ref(false)
    const authStore = useAuthStore()
    const router = useRouter()
    
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
      handleLogout
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
</style>

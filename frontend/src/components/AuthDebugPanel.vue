<template>
  <div class="auth-debug-panel" v-if="showDebug">
    <div class="debug-header">
      <h4>🔍 认证状态调试面板</h4>
      <el-button size="small" @click="togglePanel">
        {{ isExpanded ? '收起' : '展开' }}
      </el-button>
    </div>
    
    <div v-if="isExpanded" class="debug-content">
      <div class="debug-section">
        <h5>当前状态</h5>
        <div class="status-item">
          <span class="label">认证状态:</span>
          <el-tag :type="authStore.isAuthenticated ? 'success' : 'danger'">
            {{ authStore.isAuthenticated ? '已登录' : '未登录' }}
          </el-tag>
        </div>
        <div class="status-item">
          <span class="label">用户角色:</span>
          <el-tag :type="getRoleType(authStore.userRole)">
            {{ authStore.userRole || '无' }}
          </el-tag>
        </div>
        <div class="status-item">
          <span class="label">Token状态:</span>
          <el-tag :type="authStore.token ? 'success' : 'info'">
            {{ authStore.token ? '已设置' : '未设置' }}
          </el-tag>
        </div>
      </div>

      <div class="debug-section">
        <h5>用户信息</h5>
        <pre>{{ userInfo }}</pre>
      </div>

      <div class="debug-section">
        <h5>localStorage</h5>
        <pre>{{ localStorageInfo }}</pre>
      </div>

      <div class="debug-section">
        <h5>状态变化日志</h5>
        <div class="log-container">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
        <el-button size="small" @click="clearLogs">清除日志</el-button>
      </div>

      <div class="debug-section">
        <h5>快捷操作</h5>
        <el-button size="small" @click="refreshStatus">刷新状态</el-button>
        <el-button size="small" @click="testLogin">测试登录</el-button>
        <el-button size="small" @click="testLogout">测试登出</el-button>
      </div>
      
      <div class="debug-section" v-if="!authStore.isAdmin">
        <h5>API权限提示</h5>
        <div class="api-permission-tip">
          <el-alert
            title="部分API需要管理员权限"
            type="warning"
            :closable="false"
            show-icon
            description="如需测试获取统计数据API，请使用管理员账号登录后再测试。"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'AuthDebugPanel',
  setup() {
    const authStore = useAuthStore()
    const showDebug = ref(process.env.NODE_ENV === 'development')
    const isExpanded = ref(false)
    const logs = ref([])

    const userInfo = computed(() => {
      return JSON.stringify(authStore.user, null, 2)
    })

    const localStorageInfo = computed(() => {
      return JSON.stringify({
        token: localStorage.getItem('token') ? '已设置' : null,
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
      }, null, 2)
    })

    const addLog = (message) => {
      logs.value.unshift({
        time: new Date().toLocaleTimeString(),
        message
      })
      // 保持最新的20条日志
      if (logs.value.length > 20) {
        logs.value = logs.value.slice(0, 20)
      }
    }

    const getRoleType = (role) => {
      switch (role) {
        case 'admin': return 'danger'
        case 'user': return 'primary'
        case 'guest': return 'warning'
        default: return 'info'
      }
    }

    const togglePanel = () => {
      isExpanded.value = !isExpanded.value
    }

    const clearLogs = () => {
      logs.value = []
    }

    const refreshStatus = () => {
      addLog('手动刷新状态')
      // 强制重新计算computed值
      authStore.initializeAuth()
    }

    const testLogin = async () => {
      try {
        await authStore.login({
          username: 'admin',
          password: 'admin123'
        })
        addLog('测试登录成功')
      } catch (error) {
        addLog('测试登录失败: ' + error.message)
      }
    }

    const testLogout = async () => {
      try {
        await authStore.logout()
        addLog('测试登出成功 - 即将刷新页面')
        // 调试面板也刷新页面确保状态一致
        setTimeout(() => {
          window.location.href = '/'
        }, 1000) // 延迟1秒让用户看到日志消息
      } catch (error) {
        addLog('测试登出失败: ' + error.message)
      }
    }

    // 监听认证状态变化
    watch(() => authStore.isAuthenticated, (newValue, oldValue) => {
      addLog(`认证状态变化: ${oldValue} → ${newValue}`)
    })

    watch(() => authStore.user, (newValue, oldValue) => {
      addLog(`用户信息变化: ${oldValue?.username || '无'} → ${newValue?.username || '无'}`)
    }, { deep: true })

    watch(() => authStore.userRole, (newValue, oldValue) => {
      addLog(`用户角色变化: ${oldValue || '无'} → ${newValue || '无'}`)
    })

    onMounted(() => {
      addLog('调试面板已加载')
    })

    return {
      authStore,
      showDebug,
      isExpanded,
      logs,
      userInfo,
      localStorageInfo,
      getRoleType,
      togglePanel,
      clearLogs,
      refreshStatus,
      testLogin,
      testLogout
    }
  }
}
</script>

<style scoped>
.auth-debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  max-width: 400px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  font-size: 12px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 8px 8px 0 0;
}

.debug-header h4 {
  margin: 0;
  font-size: 14px;
}

.debug-content {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.debug-section h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #606266;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.label {
  font-weight: 500;
}

pre {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  max-height: 100px;
  overflow-y: auto;
  margin: 0;
}

.log-container {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 4px;
  margin-bottom: 8px;
}

.log-item {
  display: block;
  padding: 2px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 10px;
}

.log-time {
  color: #909399;
  margin-right: 8px;
}

.log-message {
  color: #303133;
}

.api-permission-tip {
  margin-top: 8px;
}
</style>

<template>
  <div class="debug-panel">
    <h2>🔍 API调试面板</h2>
    
    <div class="test-section">
      <h3>连接状态</h3>
      <div class="status-grid">
        <div class="status-item" :class="{'success': backendStatus, 'error': !backendStatus}">
          <span>后端服务:</span>
          <span>{{ backendStatus ? '✅ 正常' : '❌ 离线' }}</span>
        </div>
        <div class="status-item" :class="{'success': dataLoaded, 'error': !dataLoaded}">
          <span>数据加载:</span>
          <span>{{ dataLoaded ? '✅ 完成' : '❌ 失败' }}</span>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>API测试结果</h3>
      <div class="test-results">
        <div v-for="result in testResults" :key="result.name" 
             class="test-result" :class="{'success': result.success, 'error': !result.success}">
          <strong>{{ result.name }}</strong>
          <div>{{ result.message }}</div>
          <div v-if="result.data" class="result-data">
            数据: {{ formatData(result.data) }}
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>实时日志</h3>
      <div class="logs-container">
        <div v-for="(log, index) in logs" :key="index" 
             class="log-entry" :class="log.type">
          <span class="timestamp">{{ log.timestamp }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <el-button @click="runTests" :loading="testing">重新测试</el-button>
      <el-button @click="clearLogs">清空日志</el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import personService from '../api/persons'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'DebugPanel',
  setup() {
    const authStore = useAuthStore()
    const backendStatus = ref(false)
    const dataLoaded = ref(false)
    const testing = ref(false)
    const testResults = ref([])
    const logs = ref([])

    // 添加日志的函数
    const addLog = (message, type = 'info') => {
      logs.value.push({
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
      })
      console.log(`[DEBUG] ${message}`)
    }

    // 格式化数据显示
    const formatData = (data) => {
      if (Array.isArray(data)) {
        return `数组 (${data.length} 项)`
      } else if (typeof data === 'object') {
        return `对象 (${Object.keys(data).length} 属性)`
      }
      return String(data)
    }

    // 运行API测试
    const runTests = async () => {
      testing.value = true
      testResults.value = []
      addLog('🚀 开始运行API测试')

      const tests = [
        {
          name: '健康检查',
          test: async () => {
            const response = await fetch('http://localhost:8083/api/health')
            const data = await response.json()
            return data
          }
        },
        {
          name: '获取人员列表',
          test: async () => {
            return await personService.getPersons()
          }
        },
        {
          name: '获取统计数据',
          test: async () => {
            // 检查用户是否已登录且是管理员
            if (authStore.isAuthenticated && authStore.isAdmin) {
              return await personService.getStatistics()
            } else {
              throw new Error('需要管理员权限。请先以管理员身份登录后再测试此API。')
            }
          },
          requiresAdmin: true
        },
        {
          name: '获取人员详情',
          test: async () => {
            return await personService.getPersonDetails(1)
          }
        }
      ]

      let allSuccess = true

      for (const test of tests) {
        // 如果需要管理员权限但用户不是管理员，添加说明
        if (test.requiresAdmin && !(authStore.isAuthenticated && authStore.isAdmin)) {
          addLog(`📋 测试: ${test.name} (需要管理员权限)`)
        } else {
          addLog(`📋 测试: ${test.name}`)
        }
        try {
          const result = await test.test()
          
          testResults.value.push({
            name: test.name,
            success: true,
            message: '测试成功',
            data: result
          })
          
          addLog(`✅ ${test.name} 成功`, 'success')
          
          if (test.name === '健康检查') {
            backendStatus.value = true
          }
          if (test.name === '获取人员列表') {
            dataLoaded.value = true
          }
        }        catch (error) {
          allSuccess = false
          
          // 为需要管理员权限的API提供更友好的消息
          let errorMessage = error.message || '测试失败'
          let isAuthError = error.response?.status === 401 || errorMessage.includes('权限')
          
          const displayMessage = test.requiresAdmin && isAuthError ? 
                       '需要管理员权限。请先以管理员身份登录后再测试此API。' : 
                       errorMessage
                       
          testResults.value.push({
            name: test.name,
            success: false,
            message: displayMessage,
            data: null
          })
          
          addLog(`❌ ${test.name} 失败: ${displayMessage}`, 'error')
        }
      }

      if (allSuccess) {
        addLog('🎉 所有测试通过！', 'success')
      } else {
        addLog('⚠️ 部分测试失败', 'warning')
      }

      testing.value = false
    }

    // 清空日志
    const clearLogs = () => {
      logs.value = []
    }

    // 组件挂载时自动运行测试
    onMounted(() => {
      addLog('🚀 DebugPanel 组件已挂载')
      runTests()
    })

    return {
      backendStatus,
      dataLoaded,
      testing,
      testResults,
      logs,
      runTests,
      clearLogs,
      formatData
    }
  }
}
</script>

<style scoped>
.debug-panel {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.test-section {
  margin: 20px 0;
  padding: 15px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-section h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-radius: 4px;
  border: 2px solid;
}

.status-item.success {
  background: #e8f5e9;
  border-color: #4caf50;
}

.status-item.error {
  background: #ffebee;
  border-color: #f44336;
}


.test-result {
  padding: 10px;
  border-radius: 4px;
  border: 2px solid;
  margin-bottom: 10px;
}

.test-result.success {
  background: #e8f5e9;
  border-color: #4caf50;
}

.test-result.error {
  background: #ffebee;
  border-color: #f44336;
}

.result-data {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  background: #1e1e1e;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-entry {
  display: flex;
  margin-bottom: 5px;
}

.log-entry.info .message {
  color: #fff;
}

.log-entry.success .message {
  color: #4caf50;
}

.log-entry.error .message {
  color: #f44336;
}

.log-entry.warning .message {
  color: #ff9800;
}

.timestamp {
  color: #888;
  margin-right: 10px;
  min-width: 80px;
}

.actions {
  margin-top: 20px;
  text-align: center;
}

.actions .el-button {
  margin: 0 10px;
}
</style>

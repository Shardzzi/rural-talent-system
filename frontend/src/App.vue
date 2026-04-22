<template>
  <el-config-provider :locale="locale">
    <div id="app">
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
    </div>
  </el-config-provider>
</template>

<script>
import { ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useAuthStore } from './stores/auth'
import DebugPanel from './components/DebugPanel.vue'

export default {
  name: 'App',
  components: {
    DebugPanel
  },
  setup() {
    const showDebug = ref(false)
    const authStore = useAuthStore()
    const locale = zhCn
    const isDev = import.meta.env.DEV
    
    // 初始化认证状态
    authStore.initializeAuth()
    
    return {
      showDebug,
      locale,
      isDev
    }
  }
}
</script>

<style>
/* ===== 全局应用样式 ===== */

.debug-toggle {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
}

#app {
  font-family: var(--font-family-display);
  min-height: 100vh;
  padding: 0;
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: var(--font-family-display);
  background-color: var(--color-bg-page);
  color: var(--color-text-primary);
  overflow-x: hidden;
  overflow-y: auto;
}

/* Element Plus 组件自定义样式 */
.el-button--primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.el-button--primary:hover {
  background-color: var(--color-primary-light-3);
  border-color: var(--color-primary-light-3);
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

/* ===== Element Plus 响应式工具类 ===== */
@media only screen and (max-width: 767px) {
  .hidden-xs-only {
    display: none !important;
  }
}

@media only screen and (min-width: 768px) and (max-width: 991px) {
  .hidden-sm-only {
    display: none !important;
  }
}

@media only screen and (max-width: 991px) {
  .hidden-sm-and-down {
    display: none !important;
  }
}

@media only screen and (min-width: 992px) and (max-width: 1199px) {
  .hidden-md-only {
    display: none !important;
  }
}

@media only screen and (max-width: 1199px) {
  .hidden-md-and-down {
    display: none !important;
  }
}

@media only screen and (min-width: 1200px) and (max-width: 1919px) {
  .hidden-lg-only {
    display: none !important;
  }
}

@media only screen and (max-width: 1919px) {
  .hidden-lg-and-down {
    display: none !important;
  }
}

@media only screen and (min-width: 1920px) {
  .hidden-xl-only {
    display: none !important;
  }
}
</style>
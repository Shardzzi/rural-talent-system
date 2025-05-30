import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // 开发服务器配置
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true
      }
    }
  },
  
  // 别名配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  // 构建配置
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600, // 提高警告阈值到600KB
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // 手动代码分割配置
        manualChunks: {
          // Vue核心库
          'vue-vendor': ['vue', 'vue-router'],
          // UI组件库
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          // 状态管理和HTTP库
          'utils': ['pinia', 'axios'],
          // 其他第三方库
          'vendor': ['core-js']
        }
      }
    }
  },
  
  // TypeScript配置
  esbuild: {
    target: 'es2015'
  }
})

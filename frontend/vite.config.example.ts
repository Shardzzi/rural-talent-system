import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Vite配置示例 - 可替换当前Vue CLI配置
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
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  
  // TypeScript配置
  esbuild: {
    target: 'es2015'
  }
})

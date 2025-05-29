module.exports = {
  transpileDependencies: [],
  // 指定 TypeScript 入口点
  pages: {
    index: {
      entry: 'src/main.ts',
      template: 'public/index.html',
      filename: 'index.html',
      title: '数字乡村人才信息系统'
    }
  },
  devServer: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true
      }
    }
  },
  configureWebpack: {
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json']
    }
  },
  chainWebpack: (config) => {
    // 禁用 ESLint 检查以避免 TypeScript 语法错误
    config.plugins.delete('eslint')
    
    // 添加对 TypeScript 文件的处理
    config.module
      .rule('ts')
      .test(/\.ts$/)
      .exclude
        .add(/node_modules/)
        .end()
      .use('babel-loader')
        .loader('babel-loader')
        .options({
          presets: [
            '@vue/cli-plugin-babel/preset'
          ]
        })
        .end()
  }
}
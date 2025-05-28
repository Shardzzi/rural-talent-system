module.exports = {
  transpileDependencies: [],
  devServer: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true
      }
    }
  },
  chainWebpack: (config) => {
    config.plugin('eslint').tap((args) => {
      if (args[0] && args[0].extensions) {
        delete args[0].extensions;
      }
      return args;
    });
  }
}
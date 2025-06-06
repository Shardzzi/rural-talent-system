// pnpm hooks 文件 - 高级依赖管理配置
module.exports = {
  hooks: {
    readPackage(pkg, context) {
      // 统一版本管理
      if (pkg.name === 'rural-talent-system-backend' || pkg.name === 'rural-talent-system-frontend') {
        // 确保 TypeScript 版本一致
        if (pkg.devDependencies?.typescript) {
          pkg.devDependencies.typescript = '^5.8.3';
        }
        
        // 确保 @types/node 版本一致
        if (pkg.devDependencies?.['@types/node']) {
          pkg.devDependencies['@types/node'] = '^22.15.30';
        }
      }
      
      // 日志记录依赖变更
      if (pkg.name.includes('rural-talent-system')) {
        context.log(`处理包: ${pkg.name}@${pkg.version}`);
      }
      
      return pkg;
    }
  }
};

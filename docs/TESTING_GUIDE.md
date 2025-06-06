# 测试指南

## 🧪 测试系统概览

本项目包含完整的测试套件，确保系统稳定性和功能正确性。测试系统采用模块化设计，支持不同类型的测试场景。

## 📋 测试分类

### 🏥 健康检查测试
**文件**: `simple-verification.js`

**功能**:
- ✅ 检查服务端口状态 (后端8083、前端8081)
- ✅ 验证数据库连接和表结构
- ✅ 测试API端点可访问性
- ✅ 统计数据库记录数量

**运行方式**:
```bash
pnpm test                           # 默认运行健康检查
pnpm --filter rural-talent-system-test test:health      # 明确运行健康检查
```

### 🔗 系统集成测试
**文件**: `test_system_integration.js`

**功能**:
- 🔐 用户注册和登录流程测试
- 📝 人员信息CRUD操作测试
- 🛡️ API权限控制验证
- 🔄 完整业务流程测试

**运行方式**:
```bash
pnpm --filter rural-talent-system-test test:integration
```

### 👥 双用户权限测试
**文件**: `test_dual_user_features.js`

**功能**:
- 👑 管理员权限验证
- 👤 普通用户权限验证
- 🔒 数据脱敏功能测试
- ⚖️ 权限边界测试

**运行方式**:
```bash
pnpm --filter rural-talent-system-test test:permissions
```

### 🎯 完整测试套件
**文件**: `run-tests.sh`

**功能**:
- 🔄 按顺序运行所有测试
- 📊 生成测试报告
- ⚠️ 错误处理和重试机制

**运行方式**:
```bash
pnpm --filter rural-talent-system-test test:all
# 或直接在test目录运行
cd test && ./run-tests.sh all
```

## 🚀 快速开始

### 前置条件
确保系统服务正在运行：
```bash
# 启动所有服务
./start-all.sh

# 或开发模式启动
./dev-start.sh
```

### 运行测试
```bash
# 1. 快速健康检查
pnpm test

# 2. 运行所有测试
pnpm --filter rural-talent-system-test test:all

# 3. 运行特定测试
pnpm --filter rural-talent-system-test test:health        # 健康检查
pnpm --filter rural-talent-system-test test:integration   # 集成测试
pnpm --filter rural-talent-system-test test:permissions   # 权限测试
```

## 📊 测试输出说明

### ✅ 成功标识
- `✅` - 测试通过
- `🎉` - 所有测试完成
- `💡` - 提示信息

### ❌ 失败标识
- `❌` - 测试失败
- `⚠️` - 警告信息
- `🔧` - 需要修复

### 📈 统计信息
测试会显示：
- 数据库记录统计
- API响应时间
- 服务状态检查结果

## 🛠️ 自定义测试

### 添加新测试
1. 在 `test/` 目录创建新的测试文件
2. 更新 `test/package.json` 添加新的脚本
3. 如需要，更新 `run-tests.sh` 包含新测试

### 测试模板
```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:8083';

async function myTest() {
    console.log('🧪 开始自定义测试...');
    
    try {
        // 测试逻辑
        const response = await axios.get(`${BASE_URL}/api/test`);
        console.log('✅ 测试通过');
        return true;
    } catch (error) {
        console.log('❌ 测试失败:', error.message);
        return false;
    }
}

// 运行测试
myTest().then(success => {
    process.exit(success ? 0 : 1);
});
```

## 🔧 故障排除

### 常见问题

#### 1. 服务未启动
```
❌ 后端服务 (端口 8083) 未运行
```
**解决方案**:
```bash
./start-all.sh  # 或 ./dev-start.sh
```

#### 2. 数据库连接失败
```
❌ 数据库文件不存在或无法访问
```
**解决方案**:
- 检查 `backend/data/persons.db` 文件是否存在
- 确保后端服务正常启动

#### 3. API无响应
```
❌ API端点无响应
```
**解决方案**:
```bash
# 检查后端日志
tail -f logs/backend.log

# 重启后端服务
pnpm backend:dev
```

### 调试模式
添加详细日志输出：
```bash
DEBUG=true pnpm --filter rural-talent-system-test test:all
```

## 📈 持续集成

### GitHub Actions (示例)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
```

## 📖 相关文档

- [项目启动指南](STARTUP_GUIDE.md) - 服务启动说明
- [pnpm 使用指南](PNPM_GUIDE.md) - 包管理器使用
- [贡献指南](CONTRIBUTING.md) - 开发贡献流程

---

**更新时间**: 2025年6月6日  
**测试框架版本**: v2.0.0

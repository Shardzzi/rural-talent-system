# 数字乡村人才信息系统 - 测试套件

## 📋 概述

这是一个优化后的测试套件，包含系统的核心功能测试。所有测试都经过精简和整合，去除了重复和冗余的测试脚本。

## 🧪 测试脚本

### 核心测试脚本
1. **`simple-verification.js`** - 系统健康检查
   - 检查服务端口状态
   - 验证数据库连接和表结构
   - 测试API端点可访问性
   - 提供快速的系统状态概览

2. **`test_system_integration.js`** - 完整系统集成测试
   - 用户注册和登录流程
   - 人员信息CRUD操作
   - 用户与人员信息关联
   - 权限控制验证

3. **`test_dual_user_features.js`** - 双用户权限测试
   - 管理员和普通用户的权限区别
   - 跨用户访问控制
   - 角色特定功能验证

## 🚀 快速使用

### 方法一：使用自动化脚本（推荐）
```bash
# 给脚本执行权限
chmod +x run-tests.sh

# 运行完整测试套件
./run-tests.sh all

# 运行特定测试
./run-tests.sh health        # 系统健康检查
./run-tests.sh integration   # 系统集成测试  
./run-tests.sh permissions   # 权限功能测试
```

### 方法二：使用npm命令
```bash
# 运行所有测试
npm run test:all

# 运行特定测试
npm run verify              # 系统健康检查
npm run test:integration    # 系统集成测试
npm run test:permissions    # 权限功能测试
```

### 方法三：直接运行脚本
```bash
node simple-verification.js       # 健康检查
node test_system_integration.js   # 集成测试
node test_dual_user_features.js   # 权限测试
```

## ⚙️ 测试环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- 后端服务运行在 http://localhost:8083
- 前端服务运行在 http://localhost:8081 (可选)

## 📊 测试详情

### 1. 系统健康检查 (`simple-verification.js`)
**目的**: 快速验证系统基础设施状态

**检查项目**:
- ✅ 服务端口监听状态 (8083, 8081)
- ✅ 数据库文件存在性
- ✅ 数据表结构完整性
- ✅ 基础数据统计
- ✅ API端点可访问性

**适用场景**:
- 系统启动后的快速验证
- 部署后的基础检查
- 故障排除的第一步

### 2. 系统集成测试 (`test_system_integration.js`)
**目的**: 验证系统核心业务流程

**测试流程**:
1. 用户注册
2. 用户登录
3. 获取用户信息
4. 创建人员信息
5. 关联用户和人员信息
6. 验证关联结果
7. 游客权限测试
8. 权限控制验证

**覆盖功能**:
- 完整的认证流程
- CRUD操作
- 数据关联
- 权限控制

### 3. 双用户权限测试 (`test_dual_user_features.js`)
**目的**: 验证不同用户角色的权限区别

**测试内容**:
- 管理员权限功能
- 普通用户权限限制
- 跨用户数据访问控制
- 角色特定的API端点

**对比项目**:
- 用户档案获取
- 人员列表访问
- 人员详情查看
- 系统统计访问

## 🔧 故障排除

### 常见问题

**Q: 测试失败，提示连接错误**
A: 请确保后端服务正在运行：
```bash
cd ../backend && npm run dev
```

**Q: 权限测试失败**
A: 检查数据库中是否存在测试用户：
- 管理员: admin/admin123
- 测试用户: testuser/test123

**Q: API测试返回403错误**
A: 确认后端服务正常启动：
- 确认后端服务正常启动
- 检查API路由配置
- 查看后端日志输出

## 📈 测试优化

### v2.0 版本改进
- ✅ 删除了12个重复的测试脚本
- ✅ 保留3个核心测试脚本
- ✅ 简化了运行脚本逻辑
- ✅ 优化了package.json配置
- ✅ 统一了测试输出格式

### 保留的3个核心测试
1. **健康检查** - 快速系统状态验证
2. **集成测试** - 完整业务流程测试
3. **权限测试** - 用户角色功能测试

## 📝 维护说明

- 测试脚本使用Node.js原生功能和axios库
- 所有测试都有详细的控制台输出
- 测试失败时会显示具体的错误信息
- 支持独立运行，也支持批量执行

## 🔄 持续改进

如需添加新的测试功能，建议：
1. 在现有测试脚本中扩展相关功能
2. 避免创建功能重复的新脚本
3. 保持测试的简洁性和可维护性
4. 更新相应的文档说明
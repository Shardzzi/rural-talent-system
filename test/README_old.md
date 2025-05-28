# 数字乡村人才信息系统 - 测试套件

本文件夹包含了数字乡村人才信息系统的所有测试脚本和验证工具。

## 文件结构

```
test/
├── package.json              # 测试套件的依赖配置
├── package-lock.json         # 锁定的依赖版本
├── run-tests.sh             # 测试运行脚本
├── README.md                # 本说明文件
├── node_modules/            # 测试依赖
├── test_auth_simple.js      # 认证功能测试
├── test_detailed_features.js # 详细功能测试
├── test_dual_user_features.js # 双用户对比测试
├── test_fixed_features.js   # 修复功能测试
├── test_system_integration.js # 系统集成测试
├── test-frontend-api.js     # 前端API测试
├── simple-verification.js   # 简单验证测试
└── verify-json-conversion.js # JSON转换验证
```

## 快速开始

### 1. 安装依赖
```bash
cd test
npm install
```

### 2. 启动服务
在运行测试之前，确保后端服务正在运行：
```bash
cd ../backend
npm start
```

可选：启动前端服务（用于前端相关测试）：
```bash
cd ../frontend
npm run serve
```

### 3. 运行测试

#### 使用便捷脚本（推荐）
```bash
# 运行所有测试
./run-tests.sh all

# 运行特定测试
./run-tests.sh auth
./run-tests.sh features
./run-tests.sh dual-user
```

#### 使用npm命令
```bash
# 运行所有测试
npm run test:all

# 运行特定测试
npm run test:auth         # 认证功能测试
npm run test:features     # 详细功能测试
npm run test:dual-user    # 双用户对比测试
npm run test:fixed        # 修复功能测试
npm run test:integration  # 系统集成测试
npm run test:frontend-api # 前端API测试
npm run verify:simple     # 简单验证
npm run verify:json       # JSON转换验证
```

#### 直接运行单个测试文件
```bash
node test_auth_simple.js
node test_detailed_features.js
node test_dual_user_features.js
```

## 测试说明

### 🔐 认证功能测试 (test_auth_simple.js)
- 测试管理员登录
- 验证认证头传递
- 检查基础人员信息获取

### 🔧 详细功能测试 (test_detailed_features.js)
- 测试农村特色信息获取
- 测试合作意向信息
- 测试技能信息
- 验证数据脱敏功能

### 👥 双用户对比测试 (test_dual_user_features.js)
- 对比管理员和普通用户权限
- 验证数据脱敏效果
- 测试权限控制机制

### 🔨 修复功能测试 (test_fixed_features.js)
- 验证已修复的功能
- 测试人员详情查看
- 检查权限控制

### 🔗 系统集成测试 (test_system_integration.js)
- 全系统功能测试
- API集成验证
- 数据一致性检查

### 🌐 前端API测试 (test-frontend-api.js)
- 前端与后端API对接测试
- 界面功能验证

### ✔️ 验证测试
- **simple-verification.js**: 基础功能验证
- **verify-json-conversion.js**: JSON数据格式转换验证

## 测试数据

测试使用以下预设账户：

### 管理员账户
- 用户名: `admin`
- 密码: `admin123`
- 权限: 可查看所有详细信息，包括完整联系方式

### 普通用户账户
- 用户名: `user1`
- 密码: `password123`
- 权限: 查看脱敏后的信息

## 常见问题

### Q: 测试失败，提示连接错误
A: 请确保后端服务正在运行：
```bash
cd ../backend && npm start
```

### Q: 前端测试失败
A: 请确保前端服务正在运行：
```bash
cd ../frontend && npm run serve
```

### Q: 权限测试失败
A: 检查数据库中是否存在测试用户，如果不存在会自动创建。

### Q: 农村特色信息无法获取
A: 确保数据库中存在测试数据，系统会在初始化时自动创建。

## 开发说明

### 添加新测试
1. 在test文件夹中创建新的测试文件
2. 按照现有格式编写测试代码
3. 在package.json中添加对应的npm脚本
4. 更新run-tests.sh脚本

### 测试文件命名规范
- `test_*.js` - 功能测试文件
- `verify_*.js` - 验证工具文件
- 使用下划线分隔单词
- 文件名要清晰表达测试目的

### 代码规范
- 使用async/await处理异步操作
- 适当的错误处理和日志输出
- 清晰的测试步骤说明
- 统一的输出格式（使用✅、❌、⚠️等图标）

## 测试环境

- Node.js >= 14.0.0
- npm >= 6.0.0
- 后端服务运行在 http://localhost:8083
- 前端服务运行在 http://localhost:8081 (可选)

## 更新日志

- 2025-05-27: 创建测试套件
- 2025-05-27: 添加认证和功能测试
- 2025-05-27: 完善双用户对比测试
- 2025-05-27: 整理测试文件结构

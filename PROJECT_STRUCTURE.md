# 数字乡村人才信息系统 - 项目结构文档

## 📁 项目目录结构

```
person-info-nodejs/                    # 项目根目录
├── 📋 项目文档
│   ├── README.md                      # 项目主要说明文档
│   ├── IMPLEMENTATION_PLAN.md         # 实施计划文档
│   ├── PROJECT_STRUCTURE.md          # 项目结构文档 (本文件)
│   └── 数字乡村人才信息系统项目文档.md  # 详细项目文档
│
├── 🛠️ 开发配置
│   ├── person-info-nodejs.code-workspace  # VS Code工作区配置
│   ├── install_nvm.sh                     # NVM安装脚本
│   ├── setup.bat                          # Windows安装脚本
│   └── start-dev.bat                      # Windows开发启动脚本
│
├── 🖥️ 后端 (backend/)
│   ├── app.js                         # 主应用入口文件
│   ├── package.json                   # 后端依赖配置
│   ├── config/
│   │   └── logger.js                  # 日志配置
│   ├── controllers/                   # 控制器层
│   │   ├── authController.js          # 认证控制器
│   │   └── personController.js        # 人员信息控制器
│   ├── data/
│   │   └── persons.db                 # SQLite数据库文件
│   ├── logs/                          # 日志文件目录
│   │   ├── combined.log               # 综合日志
│   │   └── error.log                  # 错误日志
│   ├── middleware/                    # 中间件
│   │   ├── auth.js                    # 认证中间件
│   │   ├── errorHandler.js            # 错误处理中间件
│   │   └── validation.js              # 数据验证中间件
│   ├── migrations/                    # 数据库迁移
│   │   └── convert_to_json.js         # JSON转换迁移脚本
│   ├── routes/                        # 路由层
│   │   ├── authRoutes.js              # 认证路由
│   │   └── personRoutes.js            # 人员信息路由
│   └── services/                      # 服务层
│       └── databaseService.js         # 数据库服务
│
├── 🎨 前端 (frontend/)
│   ├── package.json                   # 前端依赖配置
│   ├── vue.config.js                  # Vue配置文件
│   ├── babel.config.js                # Babel配置
│   ├── jsconfig.json                  # JavaScript配置
│   ├── public/                        # 静态资源目录
│   │   ├── index.html                 # 主HTML文件
│   │   ├── favicon.ico                # 网站图标
│   │   ├── debug-test.html            # 调试测试页面
│   │   └── test.html                  # 测试页面
│   └── src/                           # 源代码目录
│       ├── App.vue                    # 主应用组件
│       ├── main.js                    # 应用入口文件
│       ├── api/                       # API接口层
│       │   └── persons.js             # 人员信息API
│       ├── assets/                    # 静态资源
│       │   └── logo.png               # 项目Logo
│       ├── components/                # 组件库
│       │   ├── DebugPanel.vue         # 调试面板组件
│       │   ├── LoginForm.vue          # 登录表单组件
│       │   ├── PersonDetailDialog.vue # 人员详情对话框
│       │   ├── PersonForm.vue         # 人员表单组件
│       │   ├── PersonFormDialog.vue   # 人员表单对话框
│       │   ├── PersonList.vue         # 人员列表组件
│       │   ├── PersonTable.vue        # 人员表格组件
│       │   ├── RuralTalentForm.vue    # 农村人才表单
│       │   ├── RuralTalentManager.vue # 农村人才管理器
│       │   ├── SearchBox.vue          # 搜索框组件
│       │   └── TalentDetailView.vue   # 人才详情视图
│       ├── router/                    # 路由配置
│       │   └── index.js               # 路由定义
│       ├── stores/                    # 状态管理
│       │   └── auth.js                # 认证状态管理
│       └── views/                     # 页面视图
│           ├── AdminDashboard.vue     # 管理员仪表板
│           ├── AdminDashboard_new.vue # 新版管理员仪表板
│           ├── GuestView.vue          # 访客视图
│           └── UserDashboard.vue      # 用户仪表板
│
├── 🧪 测试 (test/)
│   ├── README.md                      # 测试说明文档
│   ├── package.json                   # 测试依赖配置
│   ├── run-tests.sh                   # 自动化测试脚本
│   ├── simple-verification.js         # 简单验证测试
│   ├── test-frontend-api.js           # 前端API测试
│   ├── test_auth_simple.js            # 认证功能测试
│   ├── test_detailed_features.js      # 详细功能测试
│   ├── test_dual_user_features.js     # 双用户功能测试
│   ├── test_fixed_features.js         # 修复功能测试
│   ├── test_system_integration.js     # 系统集成测试
│   └── verify-json-conversion.js      # JSON转换验证
│
└── 📊 报告 (report/)
    ├── CLEANUP_REPORT.md               # 清理报告
    ├── COMPONENT_REFACTOR_REPORT.md    # 组件重构报告
    ├── DUAL_USER_TEST_REPORT.md        # 双用户测试报告
    ├── DUAL_USER_TEST_SUCCESS_REPORT.md # 双用户测试成功报告
    ├── FEATURE_FIX_COMPLETION_REPORT.md # 功能修复完成报告
    ├── FINAL_ACCEPTANCE_REPORT.md      # 最终验收报告
    ├── FRONTEND_DEBUG_REPORT.md        # 前端调试报告
    ├── FRONTEND_INTEGRATION_TEST_REPORT.md # 前端集成测试报告
    ├── IMPLEMENTATION_PLAN_UPDATE_REPORT.md # 实施计划更新报告
    ├── JSON_ARRAY_CONVERSION_COMPLETION_REPORT.md # JSON数组转换完成报告
    ├── MIGRATION_REPORT.md             # 迁移报告
    ├── PROJECT_COMPLETION_REPORT.md    # 项目完成报告
    ├── PROJECT_STRUCTURE_REORGANIZATION_REPORT.md # 项目结构重组报告
    ├── SYSTEM_COMPLETION_REPORT.md     # 系统完成报告
    └── SYSTEM_INTEGRATION_TEST_REPORT.md # 系统集成测试报告
```

## 📈 项目统计

- **总目录数**: 20个
- **总文件数**: 84个
- **代码文件**: ~50个
- **文档文件**: 19个 (Markdown格式)
- **测试文件**: 8个
- **配置文件**: 7个

## 🔧 技术栈

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite
- **认证**: JWT (JSON Web Tokens)
- **日志**: Winston
- **开发工具**: Nodemon

### 前端
- **框架**: Vue.js 3
- **UI库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vue CLI
- **包管理**: npm/pnpm

### 开发工具
- **代码编辑器**: VS Code
- **版本控制**: Git
- **测试**: Node.js 原生测试
- **文档**: Markdown

## 📋 核心功能模块

### 1. 用户认证系统
- 用户登录/注册
- JWT令牌管理
- 权限控制 (管理员/普通用户)

### 2. 人员信息管理
- 基本信息录入/编辑
- 农村特色信息管理
- 技能特长记录
- 合作意向管理

### 3. 数据展示系统
- 人员列表展示
- 详细信息查看
- 搜索和筛选功能

### 4. 管理功能
- 管理员仪表板
- 数据统计和分析
- 用户权限管理

## 🚀 快速启动

### 开发环境启动
```bash
# 启动后端 (端口: 3001)
cd backend && npm run dev

# 启动前端 (端口: 8080)
cd frontend && npm run serve
```

### 测试运行
```bash
cd test && chmod +x run-tests.sh && ./run-tests.sh
```

## 📁 最近重组说明

项目在最新迭代中进行了重要的结构重组：

1. **测试文件集中管理**: 所有测试相关文件移至 `/test` 目录
2. **报告文件分类存放**: 所有项目报告文件移至 `/report` 目录
3. **独立测试环境**: 测试目录拥有独立的 `package.json` 和依赖管理
4. **自动化测试脚本**: 提供了 `run-tests.sh` 脚本用于批量测试执行

这种结构重组提高了项目的可维护性和可扩展性，使得开发、测试和文档管理更加清晰有序。

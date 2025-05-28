# 数字乡村人才信息系统 - 完整项目文档

## 📖 项目概述

### 项目背景
随着乡村振兴战略的深入实施，农村人才资源的有效配置和合理利用成为关键因素。传统的人才管理方式存在信息分散、匹配效率低、服务精准度不足等问题。本系统旨在通过数字化手段，构建农村人才信息数据库，促进人才与产业、项目的精准对接，为乡村振兴提供人才支撑。

### 项目定位
- **服务对象**: 农村居民、合作社、农业企业、政府部门
- **核心价值**: 盘活农村人力资源，促进产业发展，助力乡村振兴
- **技术特点**: 轻量化、易部署、本地化、可扩展
- **项目版本**: v2.1.0
- **状态**: 🟢 活跃开发中

## 🏗️ 系统架构

### 技术栈
```
前端: Vue 3 + Element Plus + Pinia
后端: Node.js + Express + SQLite
数据库: SQLite (轻量化部署)
认证: JWT token认证
部署: 本地化部署，支持村、镇、县多级应用
```

### 架构特点
- **前后端分离**: Vue.js (前端) + Express.js (后端)
- **数据存储**: SQLite数据库，轻量级部署
- **认证机制**: JWT令牌认证，支持管理员和普通用户
- **模块化设计**: 清晰的MVC架构，易于维护和扩展

## 📁 项目结构

```
rural-talent-system/
├── 📋 项目文档
│   ├── README.md                      # 项目主要说明文档
│   ├── PROJECT_DOCUMENTATION.md       # 完整项目文档 (本文件)
│   ├── PROJECT_OVERVIEW.md           # 项目概览报告
│   └── STARTUP_GUIDE.md              # 启动指南
│
├── 🛠️ 启动脚本
│   ├── start-all.sh                  # 一键启动脚本
│   ├── stop-all.sh                   # 停止服务脚本
│   ├── restart-all.sh                # 重启服务脚本
│   ├── dev-start.sh                  # 开发模式启动
│   └── clean-logs.sh                 # 清理日志脚本
│
├── 🖥️ backend/                       # Node.js + Express 后端
│   ├── app.js                         # 主应用入口文件
│   ├── config/                        # 配置文件
│   │   └── logger.js                  # 日志配置
│   ├── controllers/                   # 控制器层
│   │   ├── authController.js          # 认证控制器
│   │   └── personController.js        # 人员信息控制器
│   ├── data/                          # 数据文件
│   │   └── persons.db                 # SQLite数据库文件
│   ├── middleware/                    # 中间件
│   │   ├── auth.js                    # 认证中间件
│   │   ├── errorHandler.js            # 错误处理中间件
│   │   └── validation.js              # 数据验证中间件
│   ├── routes/                        # 路由定义
│   │   ├── authRoutes.js              # 认证路由
│   │   └── personRoutes.js            # 人员信息路由
│   └── services/                      # 服务层
│       └── databaseService.js         # 数据库服务
│
├── 🎨 frontend/                       # Vue 3 前端界面
│   ├── src/                          # 源代码
│   │   ├── components/               # 可复用组件
│   │   │   ├── LoginForm.vue         # 登录表单
│   │   │   ├── PersonDetailDialog.vue # 人员详情对话框
│   │   │   ├── PersonFormDialog.vue  # 人员表单对话框
│   │   │   └── RuralTalentManager.vue # 农村人才管理器
│   │   ├── views/                    # 页面视图
│   │   │   ├── AdminDashboard.vue    # 管理员仪表板
│   │   │   ├── UserDashboard.vue     # 用户仪表板
│   │   │   └── GuestView.vue         # 访客视图
│   │   ├── stores/                   # 状态管理
│   │   │   └── auth.js               # 认证状态管理
│   │   └── api/                      # API接口
│   │       └── persons.js            # 人员信息API
│   └── public/                       # 静态资源
│
├── 🧪 test/                          # 测试脚本和工具
│   ├── run-tests.sh                  # 自动化测试脚本
│   ├── simple-verification.js        # 系统健康检查
│   ├── test_system_integration.js    # 系统集成测试
│   └── test_dual_user_features.js    # 双用户权限测试
│
├── 📊 report/                        # 项目报告和文档
│   ├── PROJECT_COMPLETION_REPORT.md  # 项目完成报告
│   ├── SYSTEM_INTEGRATION_TEST_REPORT.md # 系统集成测试报告
│   └── FINAL_ACCEPTANCE_REPORT.md    # 最终验收报告
│
└── 📦 日志文件                       # 运行时日志
    ├── logs/backend.log              # 后端服务日志
    └── logs/frontend.log             # 前端服务日志
```

## 🚀 核心功能特性

### 👥 用户管理系统
- ✅ 用户注册/登录功能
- ✅ JWT令牌认证
- ✅ 角色权限控制 (管理员/普通用户)
- ✅ 会话状态管理

### 📋 人员信息管理
- ✅ 基本个人信息录入 (姓名、年龄、联系方式等)
- ✅ 农村特色信息管理 (种植年限、主要作物、种植规模等)
- ✅ 技能特长记录 (专业技能、认证等级等)
- ✅ 合作意向管理 (合作类型、投资能力、偏好规模等)
- ✅ 信息搜索和筛选

### 🎛️ 管理界面
- ✅ 管理员仪表板
- ✅ 用户仪表板
- ✅ 访客浏览界面
- ✅ 详细信息查看对话框
- ✅ 响应式设计支持

### 🔐 权限控制与数据安全
- ✅ 三级权限控制：管理员、普通用户、访客
- ✅ 数据脱敏功能：访客和普通用户看到脱敏后的信息
- ✅ 敏感信息保护：手机号、身份证号等敏感信息权限控制

## 🚀 快速启动

### 📋 启动脚本

| 脚本名称 | 功能描述 | 使用场景 |
|---------|---------|---------|
| `start-all.sh` | 一键启动前后端服务 | 生产环境/演示 |
| `stop-all.sh` | 停止所有服务 | 停止服务 |
| `restart-all.sh` | 重启所有服务 | 重新加载配置 |
| `dev-start.sh` | 开发模式启动（带日志） | 开发调试 |

### 🔧 使用方法

#### 1. 生产/演示模式启动
```bash
# 给脚本执行权限
chmod +x start-all.sh

# 一键启动
./start-all.sh

# 停止服务
./stop-all.sh

# 重启服务
./restart-all.sh
```

#### 2. 开发模式启动
```bash
# 开发模式（带实时日志输出）
./dev-start.sh

# 按 Ctrl+C 停止
```

### 📊 服务地址

启动成功后，可以通过以下地址访问：

- **前端应用**: http://localhost:8081
- **后端API**: http://localhost:8083
- **API测试**: http://localhost:8083/api/persons

### 🔐 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|-----|-------|------|------|
| 管理员 | `admin` | `admin123` | 管理员权限，可查看完整信息 |
| 普通用户 | `Shard` | `Zqclfk123` | 普通用户权限，查看脱敏信息 |

## 🧪 测试系统

### 测试覆盖
本项目包含完整的测试套件，确保系统稳定性：

#### 核心测试脚本
1. **`simple-verification.js`** - 系统健康检查
   - 检查服务端口状态
   - 验证数据库连接和表结构
   - 测试API端点可访问性

2. **`test_system_integration.js`** - 系统集成测试
   - 用户注册和登录流程
   - 人员信息CRUD操作
   - 权限控制验证

3. **`test_dual_user_features.js`** - 双用户权限测试
   - 管理员和普通用户的权限区别
   - 数据脱敏功能验证

### 运行测试
```bash
# 进入测试目录
cd test

# 运行所有测试
./run-tests.sh all

# 运行特定测试
./run-tests.sh health        # 系统健康检查
./run-tests.sh integration   # 系统集成测试
./run-tests.sh permissions   # 权限功能测试
```

## 📊 项目状态

### ✅ 已完成功能
- **用户认证系统**: 注册、登录、权限控制
- **人员信息管理**: 完整的CRUD操作
- **权限控制**: 三级权限体系
- **数据脱敏**: 敏感信息保护
- **前端界面**: 响应式设计，三种角色界面
- **测试系统**: 完整的自动化测试套件

### 🔄 待优化功能
- **文件上传**: 头像、证书等文件上传功能
- **数据导入导出**: 批量数据管理
- **高级筛选**: 多条件组合筛选
- **数据可视化**: 统计图表展示
- **邮箱验证**: 用户邮箱验证功能

## 🔧 技术实现

### 数据库设计
使用SQLite数据库，包含以下主要表：
- `users` - 用户账户表
- `persons` - 人员基础信息表
- `rural_talent_profile` - 农村特色信息表
- `talent_skills` - 技能特长表
- `cooperation_intentions` - 合作意向表

### API设计
RESTful API设计，主要端点：
- `/api/auth/*` - 认证相关API
- `/api/persons/*` - 人员信息API
- `/api/statistics` - 统计信息API

### 前端架构
- **Vue 3**: 渐进式JavaScript框架
- **Element Plus**: UI组件库
- **Pinia**: 状态管理
- **Vue Router**: 路由管理

## 📈 部署建议

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- SQLite3

### 部署步骤
1. 克隆项目到服务器
2. 安装依赖：`npm install`
3. 配置环境变量
4. 启动服务：`./start-all.sh`

### 安全建议
- 修改默认管理员密码
- 配置HTTPS证书
- 设置防火墙规则
- 定期备份数据库

## 📞 支持与维护

### 技术支持
- 项目遵循MIT开源协议
- 支持社区贡献和反馈
- 提供详细的开发文档

### 维护计划
- 定期更新依赖包
- 持续优化性能
- 扩展新功能模块
- 提升用户体验

## 📄 许可证与免责声明

### 开源许可证
本项目采用 [MIT许可证](LICENSE) 开源，允许自由使用、修改和分发。

### AI生成代码声明
本项目部分代码使用AI工具辅助生成，所有代码均经过人工审查和测试。请查看 [AI生成代码免责声明](AI_DISCLAIMER.md) 了解详细信息。

### 重要提醒
- ⚠️ 生产环境使用前请仔细阅读免责声明
- ⚠️ 建议在部署前进行充分测试
- ⚠️ 涉及个人信息处理需遵循相关法律法规
- ⚠️ 推荐定期备份数据库和配置文件

---

**项目状态**: 已完成核心功能开发，可投入生产使用  
**文档更新**: 2025年5月29日  
**版本**: v2.1.0  
**许可证**: MIT License

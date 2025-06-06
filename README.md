# 数字乡村人才信息系统

[![Version](https://img.shields.io/badge/version-v2.2.1-blue.svg)](https://github.com/Shardzzi/rural-talent-system)
[![Status](https://img.shields.io/badge/status-production--ready-green.svg)](https://github.com/Shardzzi/rural-talent-system)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)
[![Performance](https://img.shields.io/badge/performance-98%25_optimized-brightgreen.svg)](docs/PROJECT_OPTIMIZATION_REPORT.md)

> 🌾 **助力乡村振兴的智能人才信息管理平台**  
> 现代化全栈架构 • 生产就绪 • 98%性能优化 • TypeScript全栈

## 📖 项目概述

### 🎯 项目背景
随着乡村振兴战略的深入实施，农村人才资源的有效配置和合理利用成为关键因素。传统的人才管理方式存在信息分散、匹配效率低、服务精准度不足等问题。本系统旨在通过数字化手段，构建农村人才信息数据库，促进人才与产业、项目的精准对接，为乡村振兴提供人才支撑。

### ⚡ 核心亮点
- **🚀 超快性能**: 主包体积减少98%，首屏加载 < 1秒
- **🔒 安全可靠**: 三级权限控制 + 数据脱敏保护
- **💻 现代技术**: TypeScript全栈 + Vue3 + Express
- **💻 PC端优化**: 专为桌面环境设计，流畅的用户体验
- **🛠️ 易部署**: 一键启动脚本，简单快速

### 📊 项目定位
| 维度 | 详情 |
|-----|------|
| **服务对象** | 农村居民、合作社、农业企业、政府部门 |
| **核心价值** | 盘活农村人力资源，促进产业发展，助力乡村振兴 |
| **技术特点** | 轻量化、易部署、本地化、可扩展 |
| **项目版本** | v2.2.1 |
| **项目状态** | 🟢 生产就绪 (已完成性能优化) |

## 🚀 快速开始

### ⚡ 一键启动
```bash
# 克隆项目
git clone https://github.com/Shardzzi/rural-talent-system.git
cd rural-talent-system

# 一键启动（推荐）
./start-all.sh
```

### 📊 访问地址
启动成功后，可以通过以下地址访问：

- **🌐 前端应用**: http://localhost:8081 (优化后加载速度 < 1秒)
- **⚙️ 后端API**: http://localhost:8083
- **🔍 API测试**: http://localhost:8083/api/persons

### 🔐 测试账号
| 角色 | 用户名 | 密码 | 权限说明 |
|-----|-------|------|---------|
| 管理员 | `admin` | `admin123` | 管理员权限，可查看完整信息并管理系统 |
| 普通用户 | `testuser` | `test123` | 普通用户权限，可查看完整信息但只能编辑自己的资料 |

### 📋 启动脚本说明
| 脚本名称 | 功能描述 | 使用场景 |
|---------|---------|---------|
| `start-all.sh` | 一键启动前后端服务 | 生产环境/演示 |
| `dev-start.sh` | 开发模式启动（支持自动重启） | 开发调试 |
| `stop-all.sh` | 停止所有服务 | 停止服务 |
| `restart-all.sh` | 重启所有服务 | 重新加载配置 |

> 💡 **详细启动指南**: 查看 [启动指南](docs/STARTUP_GUIDE.md) 获取完整的启动脚本说明和故障排除指南

## 🏗️ 系统架构

### 💻 技术栈概览
```
前端: Vue 3 + Element Plus + TypeScript + Vite
后端: Node.js + Express + TypeScript + SQLite
认证: JWT + bcrypt 密码加密
构建: pnpm + 代码分割 + 按需加载
部署: 一键脚本部署
```

### ⚡ 性能特性 (v2.2.1)
- **🚀 超快加载**: 主包体积减少98%，首屏 < 1秒
- **📦 智能分包**: Vue、Element Plus、业务代码独立打包
- **🔧 TypeScript**: 全栈类型安全和开发体验
- **💻 PC端优化**: 专为桌面环境设计，流畅体验

> 📖 **详细架构**: 查看 [技术架构文档](docs/TECHNICAL_ARCHITECTURE.md) 了解完整的架构设计、数据流、安全机制和性能优化

```
rural-talent-system/
├── 📋 项目文档
│   ├── README.md                      # 项目主要说明文档
│   └── docs/                          # 详细文档目录
│       ├── STARTUP_GUIDE.md           # 启动指南
│       ├── CONTRIBUTING.md            # 贡献指南
│       ├── AI_DISCLAIMER.md           # AI 代码免责声明
│       ├── IMPLEMENTATION_PLAN.md     # 实现计划
│       └── report/                    # 项目报告
│           ├── PROJECT_COMPLETION_REPORT.md      # 项目完成报告
│           ├── PROJECT_OPTIMIZATION_REPORT.md    # 性能优化报告
│           ├── SYSTEM_INTEGRATION_TEST_REPORT.md # 系统集成测试报告
│           └── FINAL_ACCEPTANCE_REPORT.md        # 最终验收报告
│
├── 🛠️ 启动脚本
│   ├── start-all.sh                  # 一键启动脚本
│   ├── stop-all.sh                   # 停止服务脚本
│   ├── restart-all.sh                # 重启服务脚本
│   ├── dev-start.sh                  # 开发模式启动
│   └── clean-logs.sh                 # 清理日志脚本
│
├── 🖥️ backend/                       # Node.js + Express + TypeScript 后端
│   ├── src/                           # TypeScript 源代码目录 (v2.2.1重构)
│   │   ├── app.ts                     # 主应用入口文件
│   │   ├── config/                    # 配置文件
│   │   │   └── logger.ts                  # 日志配置
│   │   ├── controllers/                   # 控制器层
│   │   │   ├── authController.ts          # 认证控制器
│   │   │   └── personController.ts        # 人员信息控制器
│   │   ├── middleware/                    # 中间件
│   │   │   ├── auth.ts                    # 认证中间件
│   │   │   ├── errorHandler.ts            # 错误处理中间件
│   │   │   └── validation.ts              # 数据验证中间件
│   │   ├── routes/                        # 路由定义
│   │   │   ├── authRoutes.ts              # 认证路由
│   │   │   └── personRoutes.ts            # 人员信息路由
│   │   ├── services/                      # 服务层
│   │   │   └── databaseService.ts         # 数据库服务
│   │   └── types/                         # TypeScript 类型定义
│   │       └── index.ts                   # 通用类型定义
│   ├── data/                          # 数据文件
│   │   └── persons.db                 # SQLite数据库文件
│
├── 🎨 frontend/                       # Vue 3 + TypeScript 前端界面
│   ├── vite.config.ts                 # Vite 构建配置 (v2.2.1优化)
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
└── 📦 日志文件                       # 运行时日志
    ├── logs/backend.log              # 后端服务日志
    └── logs/frontend.log             # 前端服务日志
```

## 🚀 核心功能特性

### ⚡ 性能特性 (v2.2.1 新增)
- ✅ **超快启动**: 主包体积从1.17MB减少到22.7KB (减少98%)
- ✅ **按需加载**: Element Plus组件按需导入，减少51%体积
- ✅ **代码分割**: 智能分包策略，框架与业务代码分离
- ✅ **本地化**: 完整的中文界面和国际化支持
- ✅ **类型安全**: 全面的TypeScript支持和类型检查

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
- ✅ 基于Element Plus的PC端界面设计

### 🔐 权限控制与数据安全
- ✅ 三级权限控制：管理员、普通用户、访客
- ✅ 数据脱敏功能：访客看到脱敏后的信息，登录用户看到完整信息
- ✅ 操作权限控制：普通用户只能修改自己绑定的人员信息
- ✅ 敏感信息保护：未登录用户无法查看敏感信息

## 📁 项目结构

## 🛠️ 开发工具与测试

### 📦 依赖管理 (pnpm)
本项目使用 pnpm 作为包管理器，提供极快的安装速度、严格的依赖管理和优秀的 Monorepo 支持。

#### 🚀 快速开始
```bash
# 安装所有依赖
pnpm install

# 启动开发环境
pnpm dev

# 运行测试
pnpm test
```

> 📖 **详细指南**: 查看 [pnpm 使用指南](docs/PNPM_GUIDE.md) 了解完整的命令列表、工作区配置和最佳实践

### 🧪 测试系统
本项目包含完整的测试套件，支持健康检查、系统集成测试和权限验证。

#### 🚀 快速测试
```bash
# 系统健康检查
pnpm test

# 运行所有测试
pnpm --filter rural-talent-system-test test:all

# 特定测试类型
pnpm --filter rural-talent-system-test test:health        # 健康检查
pnpm --filter rural-talent-system-test test:integration   # 集成测试
pnpm --filter rural-talent-system-test test:permissions   # 权限测试
```

> 📖 **详细指南**: 查看 [测试指南](docs/TESTING_GUIDE.md) 了解完整的测试分类、运行方式和故障排除

## 📊 项目状态

### ✅ 已完成功能
- **用户认证系统**: 注册、登录、权限控制
- **人员信息管理**: 完整的CRUD操作
- **权限控制**: 三级权限体系 (修复权限控制一致性问题)
- **数据脱敏**: 敏感信息保护
- **前端界面**: PC端界面设计，基于Element Plus组件库
- **测试系统**: 完整的自动化测试套件 (v2.0优化)
- **性能优化**: 代码分割、按需加载、构建优化 (v2.2.1)
- **架构重构**: TypeScript化、模块化改进 (v2.2.1)
- **国际化**: 完整的中文本地化支持 (v2.2.1)
- **依赖管理**: 使用 pnpm 工作区管理，提升开发体验和性能

### 🔄 待优化功能
- **响应式设计**: 移动端和平板设备适配优化
- **Docker部署**: 容器化部署支持
- **文件上传**: 头像、证书等文件上传功能
- **数据导入导出**: 批量数据管理
- **高级筛选**: 多条件组合筛选
- **数据可视化**: 统计图表展示
- **邮箱验证**: 用户邮箱验证功能

## 🔧 技术实现详情

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

> 📖 **详细架构**: 查看 [技术架构文档](docs/TECHNICAL_ARCHITECTURE.md) 了解完整的数据库设计、API规范和前端架构

## 🚀 部署指南

### 🏃‍♂️ 快速部署
```bash
# 生产环境部署
git clone https://github.com/Shardzzi/rural-talent-system.git
cd rural-talent-system
./start-all.sh
```

### 📋 环境要求
- **Node.js**: 20.x LTS (推荐)
- **pnpm**: 8.15.0+
- **系统**: Linux/macOS (推荐)

> 📖 **完整部署**: 查看 [部署指南](docs/DEPLOYMENT_GUIDE.md) 了解详细的部署步骤、环境配置、反向代理设置和生产环境优化

## 📞 支持与维护

### 🛠️ 技术支持
- 项目遵循 [MIT开源协议](LICENSE) 
- 支持社区贡献和反馈
- 提供详细的开发文档
- 持续更新和维护

### 🔄 维护计划
- 定期更新依赖包
- 持续优化性能
- 扩展新功能模块
- 提升用户体验

### 📚 文档资源
| 文档类型 | 链接 | 说明 |
|---------|------|------|
| 启动指南 | [STARTUP_GUIDE.md](docs/STARTUP_GUIDE.md) | 详细启动说明和故障排除 |
| 技术架构 | [TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md) | 完整架构设计和技术选型 |
| 部署指南 | [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | 生产环境部署和运维 |
| 测试指南 | [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) | 测试分类和运行方式 |
| pnpm指南 | [PNPM_GUIDE.md](docs/PNPM_GUIDE.md) | 包管理器使用和最佳实践 |

## 📄 许可证与免责声明

### 📜 开源许可证
本项目采用 [MIT许可证](LICENSE) 开源，允许自由使用、修改和分发。

### 🤖 AI生成代码声明
本项目部分代码使用AI工具辅助生成，所有代码均经过人工审查和测试。请查看 [AI生成代码免责声明](docs/AI_DISCLAIMER.md) 了解详细信息。

### ⚠️ 重要提醒
- **生产环境使用前请仔细阅读免责声明**
- **建议在部署前进行充分测试**
- **涉及个人信息处理需遵循相关法律法规**
- **推荐定期备份数据库和配置文件**

---

## 📊 项目信息

| 项目信息 | 详情 |
|---------|------|
| **项目状态** | ✅ 生产就绪 - 已完成全面性能优化和权限控制修复 |
| **文档更新** | 2025年6月7日 |
| **版本** | v2.2.1 |
| **性能提升** | 主包体积减少98%，加载速度提升62% |
| **管理工具** | pnpm 工作区架构 |
| **许可证** | MIT License |

[![Star History Chart](https://api.star-history.com/svg?repos=Shardzzi/rural-talent-system&type=Date)](https://star-history.com/#Shardzzi/rural-talent-system&Date)

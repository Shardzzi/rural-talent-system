# 项目结构说明

**数字乡村人才信息系统**
**版本**: v3.1
**更新时间**: 2026年4月2日

## 📁 标准化项目结构

```
rural-talent-system/                     # 项目根目录
│
├── 📄 核心文档
│   ├── README.md                        # 项目说明文档
│   ├── API_REFERENCE.md                 # API参考文档 (v3.0新增)
│   ├── PROJECT_SUMMARY.md               # 项目总结和成果展示
│   ├── PROJECT_STRUCTURE.md             # 项目结构说明 (本文件)
│   ├── CLAUDE.md                        # Claude AI 开发指南
│   ├── DOCKER_README.md                 # Docker 部署详细指南
│   └── LICENSE                          # 开源协议 (可选)
│
├── 🐳 Docker 容器化
│   ├── docker/                          # Docker 配置目录
│   │   ├── docker-compose.yml           # 开发环境编排文件
│   │   └── docker-compose.prod.yml      # 生产环境编排文件
│   ├── backend/Dockerfile               # 后端容器构建文件
│   ├── frontend/Dockerfile              # 前端容器构建文件
│   ├── docker-compose.yml               # 兼容性入口文件
│   └── deploy.sh                        # 部署入口脚本
│
├── 📜 部署和管理脚本
│   └── scripts/                         # 脚本目录
│       ├── docker-deploy.sh             # Docker 部署管理脚本
│       └── quick-docker-start.sh        # 快速启动交互脚本
│
├── 🗄️ 数据库配置
│   └── database/                        # 数据库相关配置
│       ├── init.sql                     # MySQL 初始化脚本
│       ├── my.cnf                       # MySQL 配置文件
│       └── migrate-data.js              # 数据迁移工具
│
├── 🌐 Web 服务器配置
│   └── nginx/                           # Nginx 配置目录
│       ├── nginx.conf                   # 主 Nginx 配置 (生产)
│       └── conf.d/
│           └── default.conf             # 默认站点配置
│
├── 🚀 后端应用
│   └── backend/                         # Node.js 后端服务
│       ├── src/
│       │   ├── controllers/             # 控制器层
│       │   │   ├── authController.ts    # 认证控制器
│       │   │   └── personController.ts  # 人员管理控制器
│       │   ├── services/                # 服务层
│       │   │   ├── databaseService.ts   # SQLite 数据库服务
│       │   │   ├── mysqlService.ts      # MySQL 数据库服务
│       │   │   └── dbServiceFactory.ts  # 数据库服务工厂
│       │   ├── middleware/              # 中间件
│       │   ├── routes/                  # 路由定义
│       │   ├── types/                   # TypeScript 类型定义
│       │   ├── config/                  # 配置文件
│       │   └── app.ts                   # 应用入口
│       ├── package.json                 # 后端依赖配置
│       ├── tsconfig.json                # TypeScript 配置
│       └── Dockerfile                   # 容器构建配置
│
├── 🎨 前端应用
│   └── frontend/                        # Vue 3 前端应用
│       ├── src/
│       │   ├── views/                   # 页面视图
│       │   │   └── AdminDashboard.vue   # 管理员仪表板
│       │   ├── components/              # 可复用组件
│       │   ├── stores/                  # Pinia 状态管理
│       │   ├── api/                     # API 服务层
│       │   ├── utils/                   # 工具函数
│       │   └── main.ts                  # 前端入口
│       ├── package.json                 # 前端依赖配置
│       ├── vite.config.ts               # Vite 构建配置
│       ├── nginx.conf                   # 容器内 Nginx 配置
│       └── Dockerfile                   # 容器构建配置
│
├── 🧪 测试套件
│   └── test/                            # 测试文件目录
│       ├── simple-verification.js       # 系统健康检查
│       ├── test_system_integration.js   # 系统集成测试
│       ├── test_dual_user_features.js   # 双用户权限测试
│       ├── test_all_endpoints.js        # 全部22个端点测试 (T14)
│       ├── test_error_handling.js       # 错误处理测试 (T15)
│       ├── test_edge_cases.js           # 边界情况测试 (T15)
│       ├── test_auth_permissions.js     # 认证权限测试 (T16)
│       └── test_search_pagination.js    # 搜索分页测试 (T17)
│
├── ⚙️ 项目配置
│   ├── package.json                     # 根项目配置
│   ├── pnpm-workspace.yaml             # pnpm 工作空间配置
│   ├── pnpm-lock.yaml                  # 依赖锁定文件
│   ├── .gitignore                      # Git 忽略文件
│   └── .env.example                     # 环境变量模板
│
├── 📁 运行时目录 (Git 忽略)
│   ├── data/                           # 数据目录
│   │   └── mysql/                      # MySQL 数据文件
│   ├── logs/                           # 日志目录
│   │   ├── mysql/                      # MySQL 日志
│   │   ├── nginx/                      # Nginx 日志
│   │   └── backend/                    # 后端日志
│   ├── ssl/                            # SSL 证书目录
│   ├── backups/                        # 备份目录
│   └── node_modules/                   # 依赖包目录
│
└── 🔧 构建产物 (Git 忽略)
    ├── backend/dist/                    # 后端构建输出
    ├── frontend/dist/                   # 前端构建输出
    └── .docker/                        # Docker 构建缓存
```

## 🚀 快速开始

### 1. 环境准备
```bash
# 安装依赖
pnpm install

# 复制环境变量配置
cp .env.example .env
```

### 2. 快速部署
```bash
# 交互式部署 (推荐)
./deploy.sh start

# 或者直接启动开发环境
./deploy.sh dev

# 启动生产环境
./deploy.sh prod
```

### 3. 服务管理
```bash
# 查看服务状态
./deploy.sh status

# 查看服务日志
./deploy.sh logs

# 停止服务
./deploy.sh stop

# 重启服务
./deploy.sh restart
```

## 📋 目录说明

### 核心文档
- **README.md**: 项目概述和基本使用说明
- **PROJECT_SUMMARY.md**: 详细的项目成果和技术总结
- **DOCKER_README.md**: 完整的Docker部署指南
- **CLAUDE.md**: Claude AI开发助手的使用指南

### Docker 配置
- **docker/**: 统一的Docker配置文件管理
- **scripts/**: 自动化部署和管理脚本
- **nginx/**: 生产级Nginx配置，支持HTTPS和负载均衡

### 应用代码
- **backend/**: Express.js + TypeScript 后端服务
- **frontend/**: Vue 3 + TypeScript + Element Plus 前端应用

### 配置文件
- **database/**: MySQL初始化和配置脚本
- **test/**: 完整的测试套件，包含健康检查和权限测试

## 🛠️ 开发工作流

### 本地开发
```bash
# 启动开发环境
pnpm dev

# 或者分别启动服务
pnpm backend:dev    # 后端开发服务 (端口 8083)
pnpm frontend:dev   # 前端开发服务 (端口 8081)
```

### Docker 开发
```bash
# 使用Docker开发环境
docker-compose -f docker/docker-compose.yml up -d

# 查看日志
docker-compose -f docker/docker-compose.yml logs -f
```

### 生产部署
```bash
# 生产环境部署
./deploy.sh prod

# 或者使用详细脚本
./scripts/docker-deploy.sh -e production -a start
```

## 🔧 维护和监控

### 数据备份
```bash
# 备份数据
./deploy.sh backup

# 恢复数据
./deploy.sh restore
```

### 系统清理
```bash
# 清理未使用的Docker资源
./deploy.sh clean

# 清理node_modules
pnpm clean
```

### 日志管理
- **后端日志**: `logs/backend/`
- **Nginx日志**: `logs/nginx/`
- **MySQL日志**: `logs/mysql/`

## 📞 技术支持

详细的部署和使用说明请参考：
- [DOCKER_README.md](./DOCKER_README.md) - 完整部署指南
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 项目成果总结
- [CLAUDE.md](./CLAUDE.md) - 开发助手指南

---

**项目团队**: 数字乡村人才信息系统项目团队
**维护时间**: 2026年4月1日
**版本**: v3.0 (生产就绪版本)
# pnpm 使用指南

## 📦 关于 pnpm

### 🚀 pnpm 优势
本项目使用 pnpm 作为包管理器，相比传统的 npm 有以下优势：

- **🚀 极快的安装速度**: 通过硬链接和内容寻址存储
- **💾 节省磁盘空间**: 全局存储，避免重复安装同一包的不同版本
- **🔒 严格的依赖管理**: 防止幽灵依赖问题，确保依赖关系清晰
- **🏢 优秀的 Monorepo 支持**: 原生支持工作区，便于多包项目管理

## 📋 常用 pnpm 命令

### 📦 依赖管理
```bash
pnpm install                          # 安装所有依赖 (根目录执行)
pnpm install:all                      # 安装所有工作区依赖
pnpm --filter rural-talent-system-backend add express     # 为后端添加依赖
pnpm --filter rural-talent-system-frontend add vue        # 为前端添加依赖
```

### 🚀 开发与构建
```bash
pnpm dev                              # 并行启动所有开发服务
pnpm backend:dev                      # 仅启动后端开发服务
pnpm frontend:dev                     # 仅启动前端开发服务
pnpm build                            # 并行构建所有项目
pnpm start                            # 启动生产服务
```

### 🔍 代码质量
```bash
pnpm lint                             # 运行所有 linting 检查
pnpm type-check                       # TypeScript 类型检查
pnpm test                             # 运行所有测试
```

### 📊 依赖分析
```bash
pnpm deps:check                       # 检查过时的依赖
pnpm deps:update                      # 更新依赖
pnpm deps:audit                       # 安全审计
pnpm deps:size                        # 查看依赖大小
pnpm workspace:graph                  # 显示工作区包列表和依赖
```

### 🧹 清理
```bash
pnpm clean                            # 清理所有构建产物和依赖
pnpm deps:clean-cache                 # 清理 pnpm 缓存
```

### 🧪 测试相关
```bash
pnpm test                             # 运行完整测试套件
pnpm --filter rural-talent-system-test test:health        # 系统健康检查
pnpm --filter rural-talent-system-test test:integration   # 系统集成测试
pnpm --filter rural-talent-system-test test:permissions   # 权限功能测试
```

## ⚙️ Monorepo 工作区配置

项目使用 `pnpm-workspace.yaml` 配置工作区：
```yaml
packages:
  - 'backend'
  - 'frontend'  
  - 'test'
```

### 工作区包名映射
| 目录 | 包名 | 说明 |
|------|------|------|
| `backend/` | `rural-talent-system-backend` | 后端服务 |
| `frontend/` | `rural-talent-system-frontend` | 前端应用 |
| `test/` | `rural-talent-system-test` | 测试套件 |

## 🔧 高级用法

### 过滤器语法
```bash
# 在特定工作区执行命令
pnpm --filter <package-name> <command>

# 在所有工作区执行命令
pnpm -r <command>

# 并行执行
pnpm --parallel -r <command>
```

### 依赖管理最佳实践
```bash
# 查看某个包的依赖原因
pnpm deps:why <package-name>

# 删除未使用的依赖
pnpm deps:prune

# 去重依赖
pnpm deps:dedupe

# 安全审计
pnpm audit --audit-level moderate
```

## 🚨 常见问题

### 1. 依赖安装失败
```bash
# 清理缓存后重新安装
pnpm deps:clean-cache
pnpm install
```

### 2. 幽灵依赖问题
pnpm 的严格模式可能会发现之前隐藏的依赖问题：
```bash
# 明确安装缺失的依赖
pnpm --filter <workspace> add <missing-package>
```

### 3. 性能优化
```bash
# 查看依赖大小
pnpm deps:size

# 分析过时依赖
pnpm deps:check
```

## 📖 相关文档

- [项目启动指南](STARTUP_GUIDE.md) - 详细的项目启动说明
- [贡献指南](CONTRIBUTING.md) - 开发贡献流程
- [主要说明文档](../README.md) - 项目总体概述

---

**更新时间**: 2025年6月6日  
**适用版本**: pnpm@8.15.0+

# 🚀 启动脚本使用指南

本项目提供了多个启动脚本，适用于不同的开发和部署场景。

## 📋 脚本列表

### 🎯 生产模式
- **`./start-all.sh`** - 生产模式启动 (构建 TypeScript + 启动服务)
- **`./stop-all.sh`** - 停止所有服务
- **`./restart-all.sh`** - 重启所有服务

### 🛠️ 开发模式
- **`./dev-start.sh`** - 开发模式启动 (支持文件监听和自动重启) **推荐**

### 🧹 维护工具
- **`./clean-logs.sh`** - 清理日志文件

## 📖 详细说明

### 生产模式 (`./start-all.sh`)
```bash
./start-all.sh
```
- ✅ 自动安装依赖
- ✅ 构建 TypeScript 项目 (`npm run build`)
- ✅ 启动编译后的 JavaScript 版本
- ✅ 性能优化，适合生产环境
- 📍 后端：http://localhost:8083
- 📍 前端：http://localhost:8081

### 开发模式 (`./dev-start.sh`) **推荐**
```bash
./dev-start.sh
```
- ✅ 自动安装依赖
- ✅ 直接运行 TypeScript 源码
- ✅ **自动监听文件变化并重启后端**
- ✅ 前端热重载
- 🎯 **最佳开发体验**
- 📍 后端：http://localhost:8083
- 📍 前端：http://localhost:8081

### 停止服务 (`./stop-all.sh`)
```bash
./stop-all.sh
```
- ✅ 停止所有前端和后端服务
- ✅ 清理进程 ID 文件
- ✅ 通过端口查找并停止遗留进程

## 🔄 常用操作流程

### 首次启动 (开发)
```bash
# 克隆项目后首次启动
./dev-start.sh
```

### 日常开发
```bash
# 启动开发环境 (支持自动重启)
./dev-start.sh

# 停止服务
# 按 Ctrl+C 或运行：
./stop-all.sh
```

### 生产部署
```bash
# 构建并启动生产版本
./start-all.sh

# 停止服务
./stop-all.sh

# 重启服务
./restart-all.sh
```

## 📊 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 8083 | REST API 服务 |
| 前端应用 | 8081 | Vue.js Web 应用 |

## 📝 日志文件

- `logs/backend.log` - 后端服务日志
- `logs/frontend.log` - 前端构建日志
- `backend/logs/` - 详细的后端应用日志

## 🔧 故障排除

### 端口被占用
```bash
# 检查端口占用
lsof -i :8083  # 后端
lsof -i :8081  # 前端

# 强制停止
./stop-all.sh
```

### 依赖问题
```bash
# 重新安装依赖
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### TypeScript 编译错误
```bash
# 检查 TypeScript 编译
cd backend && npm run build
```

## 🎯 推荐工作流

1. **开发时使用**: `./dev-start.sh` - 最佳开发体验
2. **测试部署时使用**: `./start-all.sh` - 验证生产构建
3. **生产环境使用**: `./start-all.sh` - 性能优化版本

---

**💡 提示**: 所有脚本都会自动检查并安装依赖，首次运行可能需要较长时间。

# Docker 部署指南

## 概述

本指南提供了农村人才信息系统的完整 Docker 部署解决方案。系统支持开发环境和生产环境的容器化部署。

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 4GB 可用磁盘空间

### 一键启动

```bash
# 开发环境（推荐）
./deploy.sh dev

# 生产环境（需要配置 .env 文件）
./deploy.sh prod
```

## 📁 Docker 配置文件

### 项目结构

```
rural-talent-system/
├── docker-compose.dev.yml          # 开发环境配置
├── docker-compose.yml              # 完整开发环境（包含MySQL）
├── docker-compose.prod.yml         # 生产环境配置
├── .dockerignore                    # Docker构建忽略文件
├── backend/
│   ├── Dockerfile                  # 生产环境后端
│   └── Dockerfile.dev             # 开发环境后端
├── frontend/
│   ├── Dockerfile                  # 生产环境前端
│   └── Dockerfile.dev             # 开发环境前端
└── scripts/
    └── docker-deploy.sh            # Docker部署脚本
```

## 🔧 环境配置

### 1. 开发环境

#### 简化版开发环境
使用 `docker-compose.dev.yml`，仅包含应用服务，SQLite 数据库：

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**特性：**
- 🟢 轻量级，仅包含前后端服务
- 🟢 SQLite 数据库，无需额外配置
- 🟢 热重载支持
- 🟢 适合开发和测试

**访问地址：**
- 前端: http://localhost:8081
- 后端: http://localhost:8083

#### 完整版开发环境
使用 `docker/docker-compose.yml`，包含 MySQL 和 phpMyAdmin：

```bash
docker-compose -f docker/docker-compose.yml up --build
```

**特性：**
- 🟢 MySQL 8.0 数据库
- 🟢 phpMyAdmin 数据库管理工具
- 🟢 完整的生产环境模拟
- 🟡 需要更多资源

**访问地址：**
- 前端: http://localhost:8081
- 后端: http://localhost:8083
- phpMyAdmin: http://localhost:8080

### 2. 生产环境

使用 `docker/docker-compose.prod.yml`，包含完整的 production 优化：

```bash
# 创建环境配置文件
cp .env.example .env

# 编辑配置
vim .env

# 启动生产环境
docker-compose -f docker/docker-compose.prod.yml up --build -d
```

**特性：**
- 🟢 Nginx 反向代理
- 🟢 SSL 证书支持
- 🟢 性能优化配置
- 🟢 健康检查和自动重启
- 🟢 资源限制和负载均衡

## 🛠️ Dockerfile 详细说明

### 后端 Dockerfile.dev

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY backend/package*.json ./
COPY pnpm-lock.yaml ./
RUN mkdir -p /app/data
RUN pnpm install --prefer-frozen-lockfile --prod
COPY backend/src ./src
COPY backend/dist ./dist
EXPOSE 8083
CMD ["node", "dist/app.js"]
```

**特点：**
- 使用 Alpine Linux 减少镜像大小
- 预编译 TypeScript 为 JavaScript
- 仅安装生产依赖
- 支持 SQLite 数据库

### 前端 Dockerfile.dev

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY frontend/package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --prefer-frozen-lockfile
COPY frontend/ ./
EXPOSE 3000
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"]
```

**特点：**
- 开发模式，支持热重载
- Vite 开发服务器
- 监听所有网络接口

## 🔍 管理命令

### 容器管理

```bash
# 查看容器状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend

# 重启服务
docker-compose -f docker-compose.dev.yml restart

# 停止服务
docker-compose -f docker-compose.dev.yml down

# 停止并删除卷
docker-compose -f docker-compose.dev.yml down -v
```

### 调试和故障排除

```bash
# 进入容器
docker-compose -f docker-compose.dev.yml exec backend sh
docker-compose -f docker-compose.dev.yml exec frontend sh

# 查看容器资源使用
docker stats

# 查看容器详细信息
docker inspect rural-talent-backend-dev
```

## 📊 性能优化

### 1. 镜像优化

- 使用多阶段构建减少最终镜像大小
- 利用 Docker 层缓存提高构建速度
- 使用 `.dockerignore` 减少构建上下文

### 2. 运行时优化

- 设置适当的资源限制
- 使用健康检查确保服务可用性
- 配置自动重启策略

### 3. 网络优化

- 使用自定义网络隔离服务
- 配置适当的端口映射
- 利用 DNS 服务发现

## 🚨 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :8081
netstat -tulpn | grep :8083

# 修改 docker-compose.yml 中的端口映射
ports:
  - "8081:8081"  # 改为 "8082:8081"
```

#### 2. 容器启动失败
```bash
# 查看详细错误日志
docker-compose -f docker-compose.dev.yml logs --tail=50

# 重新构建镜像
docker-compose -f docker-compose.dev.yml build --no-cache
```

#### 3. 数据库连接问题
```bash
# 检查数据库容器状态
docker-compose -f docker-compose.dev.yml ps

# 验证网络连接
docker-compose -f docker-compose.dev.yml exec backend ping mysql
```

#### 4. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER ./backend/data
sudo chmod -R 755 ./backend/data
```

### 日志分析

#### 应用日志
```bash
# 实时查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 查看最近的错误
docker-compose -f docker-compose.dev.yml logs --tail=100 | grep ERROR
```

#### 系统日志
```bash
# Docker 守护进程日志
sudo journalctl -u docker.service

# 容器系统事件
docker events
```

## 🔐 安全考虑

### 1. 镜像安全
- 使用官方基础镜像
- 定期更新基础镜像
- 扫描镜像漏洞

### 2. 运行时安全
- 使用非 root 用户运行容器
- 限制容器资源使用
- 配置网络隔离

### 3. 数据安全
- 加密敏感配置信息
- 使用 Docker secrets
- 定期备份数据

## 📈 监控和维护

### 1. 健康检查
所有服务都配置了健康检查：

```bash
# 查看健康状态
docker-compose -f docker-compose.dev.yml ps
```

### 2. 日志管理
- 配置日志轮转
- 使用结构化日志
- 集中日志收集

### 3. 备份策略
```bash
# 备份数据库
docker-compose -f docker/docker-compose.yml exec mysql \
  mysqldump -u rural_app -p rural_talent_system > backup.sql

# 备份数据卷
docker run --rm -v rural-talent-system_mysql_data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/mysql-data.tar.gz -C /data .
```

## 🌐 网络配置

### 开发环境
```yaml
networks:
  rural-talent-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
```

### 生产环境
```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 后端网络不暴露到外部
```

## 📚 参考资料

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Node.js 最佳实践](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Vue.js Docker 部署](https://vuejs.org/guide/deployment.html)

## 🤝 贡献

如果您发现文档错误或有改进建议，请提交 Issue 或 Pull Request。

---

**最后更新**: 2025年11月26日
**版本**: 1.0.0
**维护者**: 数字乡村人才信息系统项目团队
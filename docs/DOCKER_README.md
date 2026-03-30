# 农村人才管理系统 Docker 部署指南

## 📋 概述

本项目现已支持 Docker 容器化部署，提供了完整的容器化解决方案，包括前端、后端、数据库和反向代理的完整部署。

## 🆕 新功能特性

### 1. Docker 容器化部署
- ✅ 完整的容器化架构
- ✅ 支持开发和生产环境
- ✅ 一键部署和管理
- ✅ 数据持久化和备份
- ✅ 负载均衡和监控

### 2. 数据库升级
- ✅ SQLite 到 MySQL 数据迁移
- ✅ 数据库连接池优化
- ✅ 支持两种数据库切换

### 3. 响应式UI优化
- ✅ 移动端适配优化
- ✅ 响应式表格和表单
- ✅ 触摸友好的交互设计
- ✅ 自适应布局

## 🚀 快速开始

### 方式一：快速启动脚本

```bash
# 克隆项目
git clone <repository-url>
cd rural-talent-system

# 运行快速启动脚本
./quick-docker-start.sh
```

### 方式二：使用部署脚本

```bash
# 开发环境部署
./docker-deploy.sh

# 生产环境部署
./docker-deploy.sh -e production
```

### 方式三：手动部署

```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 项目结构

```
rural-talent-system/
├── 🐳 Docker 配置
│   ├── backend/Dockerfile          # 后端容器配置
│   ├── frontend/Dockerfile         # 前端容器配置
│   ├── docker-compose.yml          # 开发环境编排
│   ├── docker-compose.prod.yml     # 生产环境编排
│   └── nginx/                      # Nginx 配置
│
├── 🗄️ 数据库
│   ├── database/init.sql           # MySQL 初始化脚本
│   ├── database/my.cnf             # MySQL 配置文件
│   └── database/migrate-data.js    # 数据迁移脚本
│
├── 🔧 部署脚本
│   ├── docker-deploy.sh            # 完整部署脚本
│   └── quick-docker-start.sh       # 快速启动脚本
│
└── 📄 配置文件
    ├── .env.example                # 环境变量模板
    └── DOCKER_README.md           # Docker 使用指南
```

## ⚙️ 环境配置

### 开发环境

无需额外配置，使用默认设置即可。

### 生产环境

1. **复制环境变量文件**
   ```bash
   cp .env.example .env
   ```

2. **编辑环境变量**
   ```bash
   nano .env
   ```

3. **必要配置项**
   ```bash
   # 数据库密码
   MYSQL_ROOT_PASSWORD=your_secure_password
   MYSQL_PASSWORD=your_secure_app_password

   # JWT 密钥
   JWT_SECRET=your_jwt_secret_key_at_least_32_characters

   # Redis 密码（可选）
   REDIS_PASSWORD=your_redis_password
   ```

## 🔧 常用命令

### 部署管理

```bash
# 查看服务状态
./docker-deploy.sh status

# 启动服务
./docker-deploy.sh start

# 停止服务
./docker-deploy.sh stop

# 重启服务
./docker-deploy.sh restart

# 查看日志
./docker-deploy.sh logs

# 清理资源
./docker-deploy.sh clean
```

### 数据库管理

```bash
# 备份数据库
./docker-deploy.sh backup

# 恢复数据库
./docker-deploy.sh restore backup_file.sql

# 数据迁移（从 SQLite 到 MySQL）
./docker-deploy.sh migrate
```

### 开发环境

```bash
# 构建并启动开发环境
docker-compose up -d --build

# 查看实时日志
docker-compose logs -f

# 停止并删除容器
docker-compose down -v
```

## 🌐 访问地址

### 开发环境

- **前端应用**: http://localhost:8081
- **后端API**: http://localhost:8083
- **数据库管理**: http://localhost:8080 (phpMyAdmin)
- **健康检查**: http://localhost:8083/api/health

### 生产环境

- **前端应用**: http://localhost (HTTP)
- **前端应用**: https://localhost (HTTPS，需配置SSL证书)
- **后端API**: http://localhost/api
- **健康检查**: http://localhost/health

## 📱 UI 响应式功能

### 移动端优化

1. **响应式布局**
   - 桌面端（≥1200px）：完整功能显示
   - 平板端（768px-1199px）：布局调整
   - 手机端（<768px）：移动端优化界面

2. **表格优化**
   - 展开行显示详细信息
   - 移动端隐藏部分列
   - 下拉菜单操作按钮
   - 触摸友好的按钮尺寸

3. **搜索表单**
   - 可展开的高级筛选
   - 响应式表单布局
   - 移动端优化的按钮排列

### 测试账号

- **管理员**: admin / admin123
- **普通用户**: testuser / test123

## 🔍 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :8081

   # 修改 docker-compose.yml 中的端口映射
   ports:
     - "8082:8081"  # 改为其他端口
   ```

2. **数据库连接失败**
   ```bash
   # 检查 MySQL 容器状态
   docker-compose ps mysql

   # 查看 MySQL 日志
   docker-compose logs mysql

   # 重启数据库容器
   docker-compose restart mysql
   ```

3. **前端构建失败**
   ```bash
   # 重新构建前端容器
   docker-compose build --no-cache frontend

   # 清理 Docker 缓存
   docker system prune -f
   ```

4. **权限问题**
   ```bash
   # 检查目录权限
   ls -la logs/ data/

   # 修复权限
   sudo chown -R $USER:$USER logs/ data/
   ```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# 实时查看日志
docker-compose logs -f backend
```

### 数据持久化

```bash
# 数据备份
docker-compose exec mysql mysqldump \
  -u rural_app -p rural_talent_system > backup.sql

# 数据恢复
docker-compose exec -T mysql mysql \
  -u rural_app -p rural_talent_system < backup.sql

# 查看数据卷
docker volume ls
docker volume inspect rural-talent-system_mysql_data
```

## 🔒 安全配置

### 生产环境安全

1. **SSL 证书配置**
   ```bash
   # 创建 SSL 目录
   mkdir -p ssl

   # 放置证书文件
   cp cert.pem ssl/
   cp key.pem ssl/
   ```

2. **防火墙配置**
   ```bash
   # 只开放必要端口
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **定期更新**
   ```bash
   # 更新镜像
   docker-compose pull
   docker-compose up -d
   ```

## 📊 监控和维护

### 健康检查

所有服务都配置了健康检查，可以通过以下方式查看状态：

```bash
# 查看容器健康状态
docker-compose ps

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' container_name
```

### 性能监控

生产环境包含了基础的监控功能：

- **Watchtower**: 自动更新容器
- **健康检查**: 自动检测服务状态
- **日志管理**: 结构化日志输出

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📞 技术支持

如遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 提交新的 Issue 并提供详细信息

---

## 📝 更新日志

### v2.2.1 (2025-11-26)
- ✨ 新增 Docker 容器化部署
- ✨ 新增 MySQL 数据库支持
- ✨ 新增响应式UI优化
- 🔧 优化移动端用户体验
- 🐛 修复已知问题
- 📚 完善文档和部署指南

---

**数字乡村人才信息系统项目团队**
*技术支持: [项目地址]*
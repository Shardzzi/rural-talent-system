# 部署指南

## 🚀 部署概览

数字乡村人才信息系统支持多种部署方式，从开发测试到生产环境，提供灵活的部署选择。

## 📋 环境要求

### 基础要求
| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| **Node.js** | 16.0.0+ | 20.x LTS | JavaScript运行环境 |
| **pnpm** | 8.0.0+ | 8.15.0+ | 包管理器 |
| **操作系统** | - | Linux/macOS | Windows也支持但推荐Unix系统 |
| **内存** | 512MB | 1GB+ | 根据数据量调整 |
| **磁盘空间** | 500MB | 2GB+ | 包含依赖和日志 |

### 可选组件
- **反向代理**: Nginx、Apache (生产环境推荐)
- **进程管理**: PM2、systemd (生产环境推荐)
- **SSL证书**: Let's Encrypt、商业证书

## 🏠 本地开发部署

### 1. 快速启动
```bash
# 克隆项目
git clone <repository-url>
cd rural-talent-system

# 安装依赖
pnpm install

# 启动开发服务
pnpm dev
```

### 2. 开发环境配置
```bash
# 复制环境变量文件
cp .env.example .env

# 编辑配置 (可选)
nano .env
```

**默认配置**:
- 前端地址: http://localhost:8081
- 后端地址: http://localhost:8083
- 数据库: backend/data/persons.db

### 3. 开发工具
```bash
# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 运行测试
pnpm test
```

## 🏢 生产环境部署

### 方式一: 直接部署

#### 1. 环境准备
```bash
# 安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm@latest

# 创建部署用户
sudo useradd -m -s /bin/bash rural-talent
sudo usermod -aG sudo rural-talent
```

#### 2. 项目部署
```bash
# 切换到部署用户
sudo su - rural-talent

# 克隆项目
git clone <repository-url> /opt/rural-talent-system
cd /opt/rural-talent-system

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 设置环境变量
cp .env.example .env
nano .env  # 配置生产环境变量
```

#### 3. 生产环境配置
```bash
# .env 文件示例
NODE_ENV=production
PORT=8083
FRONTEND_PORT=8081
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_PATH=/opt/rural-talent-system/backend/data/persons.db
LOG_LEVEL=info
```

#### 4. 启动服务
```bash
# 使用 PM2 管理进程
npm install -g pm2

# 启动后端
pm2 start backend/src/app.ts --name rural-backend --interpreter=ts-node

# 启动前端 (如果需要独立前端服务)
pm2 start "pnpm frontend:start" --name rural-frontend

# 保存 PM2 配置
pm2 save
pm2 startup
```

### 方式二: Docker 部署

#### 1. 创建 Dockerfile
```dockerfile
# 多阶段构建
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-*.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm build

# 生产镜像
FROM node:20-alpine AS runtime

WORKDIR /app
RUN npm install -g pnpm

COPY package*.json pnpm-*.yaml ./
RUN pnpm install --prod

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/data ./backend/data

EXPOSE 8083 8081

CMD ["pnpm", "start"]
```

#### 2. 构建和运行
```bash
# 构建镜像
docker build -t rural-talent-system .

# 运行容器
docker run -d \
  --name rural-talent \
  -p 8081:8081 \
  -p 8083:8083 \
  -v /opt/rural-data:/app/backend/data \
  rural-talent-system
```

#### 3. Docker Compose (推荐)
```yaml
# docker-compose.yml
version: '3.8'

services:
  rural-talent:
    build: .
    ports:
      - "8081:8081"
      - "8083:8083"
    volumes:
      - ./data:/app/backend/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - rural-talent
    restart: unless-stopped
```

## 🌐 反向代理配置

### Nginx 配置示例
```nginx
# /etc/nginx/sites-available/rural-talent
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # 前端静态文件
    location / {
        root /opt/rural-talent-system/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 系统服务配置

### Systemd 服务配置
```ini
# /etc/systemd/system/rural-talent.service
[Unit]
Description=Rural Talent System
After=network.target

[Service]
Type=simple
User=rural-talent
WorkingDirectory=/opt/rural-talent-system
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=rural-talent
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启用服务:
```bash
sudo systemctl enable rural-talent
sudo systemctl start rural-talent
sudo systemctl status rural-talent
```

## 📊 监控和维护

### 日志管理
```bash
# 查看实时日志
tail -f logs/backend.log

# 日志轮转配置
sudo nano /etc/logrotate.d/rural-talent
```

### 性能监控
```bash
# 使用 PM2 监控
pm2 monit

# 系统资源监控
htop
df -h
free -h
```

### 数据备份
```bash
# 数据库备份脚本
#!/bin/bash
BACKUP_DIR="/backup/rural-talent"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /opt/rural-talent-system/backend/data/persons.db \
   $BACKUP_DIR/persons_$DATE.db

# 保留最近30天的备份
find $BACKUP_DIR -name "persons_*.db" -mtime +30 -delete
```

## 🔒 安全配置

### 防火墙设置
```bash
# UFW 配置
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### SSL 证书 (Let's Encrypt)
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 安全加固
```bash
# 修改默认管理员密码
# 在应用中完成

# 设置文件权限
chmod 600 .env
chmod 644 backend/data/persons.db
chown -R rural-talent:rural-talent /opt/rural-talent-system
```

## 🚨 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查看端口占用
sudo netstat -tlnp | grep :8083
sudo lsof -i :8083

# 杀死进程
sudo kill -9 <PID>
```

#### 2. 数据库权限问题
```bash
# 修复数据库权限
sudo chown rural-talent:rural-talent backend/data/persons.db
sudo chmod 644 backend/data/persons.db
```

#### 3. 依赖安装失败
```bash
# 清理缓存
pnpm store prune
rm -rf node_modules
pnpm install
```

### 健康检查
```bash
# API 健康检查
curl http://localhost:8083/api/health

# 服务状态检查
sudo systemctl status rural-talent
```

## 📈 性能优化

### 生产环境优化
- 启用 gzip 压缩
- 配置 CDN (可选)
- 数据库索引优化
- 静态资源缓存

### 扩展建议
- **水平扩展**: 负载均衡多实例
- **数据库升级**: SQLite → PostgreSQL
- **缓存层**: 添加 Redis
- **微服务**: 按模块拆分

## 📖 相关文档

- [启动指南](STARTUP_GUIDE.md) - 开发环境快速启动
- [技术架构](TECHNICAL_ARCHITECTURE.md) - 系统架构详解
- [pnpm 指南](PNPM_GUIDE.md) - 包管理器使用
- [测试指南](TESTING_GUIDE.md) - 测试系统说明

---

**部署指南版本**: v1.0.0  
**更新时间**: 2025年6月6日  
**适用环境**: 开发/测试/生产

# 多阶段构建：构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10.33.0

# 复制 workspace 配置和依赖文件
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY test/package.json ./test/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制前端源代码
COPY frontend/ ./frontend/

# 构建前端应用
RUN pnpm --filter rural-talent-system-frontend build

# 生产阶段：使用 Nginx 提供静态文件服务
FROM nginx:alpine

# 复制自定义 nginx 配置
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制构建结果到 nginx
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# 创建非 root 用户
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# 创建 nginx 运行时需要的目录
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# 切换到非 root 用户
USER nginx

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

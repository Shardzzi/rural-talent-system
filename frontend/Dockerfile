# 多阶段构建：构建阶段
FROM node:20-alpine as builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY frontend/package*.json ./
COPY pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --prefer-frozen-lockfile

# 复制源代码
COPY frontend/ ./

# 构建前端应用
RUN pnpm build

# 生产阶段：使用 Nginx 提供静态文件服务
FROM nginx:alpine

# 复制自定义 nginx 配置
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制构建结果到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

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
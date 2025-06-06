#!/bin/bash

# 数字乡村人才信息系统 - 开发模式启动脚本
echo "🛠️  启动开发模式 (支持文件监听和自动重启)..."

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${BLUE}📦 检查依赖...${NC}"
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 依赖检查完成${NC}"

# 创建日志目录
mkdir -p logs

echo -e "${GREEN}🔥 启动开发服务器（支持自动重启）...${NC}"
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 使用trap捕获Ctrl+C信号
trap 'echo -e "\n${YELLOW}停止所有服务...${NC}"; kill $(jobs -p) 2>/dev/null; exit' INT

# 启动后端（支持文件监听）
echo -e "${BLUE}启动后端服务器 (TypeScript 监听模式)...${NC}"
pnpm backend:watch &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端（后台运行）
echo -e "${BLUE}启动前端服务器...${NC}"
pnpm frontend:dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

echo -e "${GREEN}✅ 服务启动完成！${NC}"
echo -e "   🌐 前端: http://localhost:8081"
echo -e "   🔧 后端: http://localhost:8083"
echo ""
echo -e "${YELLOW}💡 开发提示：${NC}"
echo -e "   • 前端支持Vite热重载，修改代码会自动刷新"
echo -e "   • 后端支持自动重启，修改 TypeScript 文件会自动重启服务"
echo -e "   • 按 Ctrl+C 停止所有服务"
echo ""

# 等待用户按Ctrl+C
wait

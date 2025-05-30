#!/bin/bash

# 数字乡村人才信息系统 - 开发模式启动脚本
echo "🛠️  启动开发模式 (带实时日志)..."

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${BLUE}📦 检查依赖...${NC}"
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}安装后端依赖...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}安装前端依赖...${NC}"
    cd frontend && npm install && cd ..
fi

# 创建日志目录
mkdir -p logs

echo -e "${GREEN}🔥 启动开发服务器（带实时日志输出）...${NC}"
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 使用trap捕获Ctrl+C信号
trap 'echo -e "\n${YELLOW}停止所有服务...${NC}"; kill $(jobs -p) 2>/dev/null; exit' INT

# 启动后端（后台运行）
echo -e "${BLUE}启动后端服务器 (TypeScript 开发模式)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端（后台运行）
echo -e "${BLUE}启动前端服务器...${NC}"
cd frontend
npm run serve &
FRONTEND_PID=$!
cd ..

# 等待前端启动
sleep 5

echo -e "${GREEN}✅ 服务启动完成！${NC}"
echo -e "   🌐 前端: http://localhost:8081"
echo -e "   🔧 后端: http://localhost:8083"
echo ""
echo -e "${YELLOW}💡 开发提示：${NC}"
echo -e "   • 前端支持热重载，修改代码会自动刷新"
echo -e "   • 后端使用 ts-node，修改 TypeScript 文件需要重启"
echo -e "   • 按 Ctrl+C 停止所有服务"
echo ""

# 等待用户按Ctrl+C
wait

#!/bin/bash

# 数字乡村人才信息系统 - 一键启动脚本
echo "🚀 启动数字乡村人才信息系统..."

# 检查是否在正确的目录
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 检查依赖安装情况...${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm 未安装，请先安装 pnpm${NC}"
    echo -e "${YELLOW}💡 安装方式: npm install -g pnpm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 和 pnpm 已安装${NC}"

# 安装所有依赖
echo -e "${YELLOW}📦 安装项目依赖...${NC}"
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 所有依赖安装完成${NC}"

# 构建所有项目
echo -e "${YELLOW}🔨 构建项目...${NC}"
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 项目构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 项目构建成功${NC}"

# 创建日志目录
mkdir -p logs

echo -e "${BLUE}🔥 启动服务器...${NC}"

# 启动后端服务器
echo -e "${YELLOW}启动后端服务器 (端口 8083)...${NC}"
pnpm backend:start > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端进程 ID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:8083/api/persons > /dev/null; then
    echo -e "${GREEN}✅ 后端服务器启动成功 (http://localhost:8083)${NC}"
else
    echo -e "${RED}❌ 后端服务器启动失败${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端服务器（静态文件服务）
echo -e "${YELLOW}启动前端服务器 (端口 8081)...${NC}"
pnpm frontend:start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端进程 ID: $FRONTEND_PID"

# 等待前端启动
sleep 5

# 检查前端是否启动成功
if curl -s http://localhost:8081 > /dev/null; then
    echo -e "${GREEN}✅ 前端服务器启动成功 (http://localhost:8081)${NC}"
else
    echo -e "${YELLOW}⚠️  前端服务器可能仍在启动中...${NC}"
fi

# 保存进程ID到文件
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo -e "${GREEN}🎉 系统启动完成！${NC}"
echo -e "${BLUE}📱 访问地址：${NC}"
echo -e "   🌐 前端应用: ${GREEN}http://localhost:8081${NC}"
echo -e "   🔧 后端API:  ${GREEN}http://localhost:8083${NC}"
echo -e "   📊 API文档:  ${GREEN}http://localhost:8083/api/persons${NC}"
echo ""
echo -e "${YELLOW}💡 使用说明：${NC}"
echo -e "   • 测试账号 - 管理员: admin / admin123"
echo -e "   • 测试账号 - 用户: testuser / test123"
echo -e "   • 日志文件: logs/backend.log, logs/frontend.log"
echo -e "   • 停止服务: ./stop-all.sh"
echo ""
echo -e "${BLUE}🔍 实时日志监控：${NC}"
echo -e "   后端日志: tail -f logs/backend.log"
echo -e "   前端日志: tail -f logs/frontend.log"

#!/bin/bash

# 数字乡村人才信息系统 - 停止脚本
echo "🛑 停止数字乡村人才信息系统..."

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 读取保存的进程ID
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止后端服务器 (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        echo -e "${GREEN}✅ 后端服务器已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  后端服务器进程不存在${NC}"
    fi
    rm -f .backend.pid
else
    echo -e "${YELLOW}未找到后端进程ID，尝试通过端口停止...${NC}"
    # 通过端口查找并停止进程
    BACKEND_PID=$(lsof -ti:8083)
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ 通过端口 8083 停止了后端服务器${NC}"
    fi
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止前端服务器 (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ 前端服务器已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  前端服务器进程不存在${NC}"
    fi
    rm -f .frontend.pid
else
    echo -e "${YELLOW}未找到前端进程ID，尝试通过端口停止...${NC}"
    # 通过端口查找并停止进程
    FRONTEND_PID=$(lsof -ti:8081)
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ 通过端口 8081 停止了前端服务器${NC}"
    fi
fi

# 额外清理：停止所有可能的node进程（谨慎使用）
echo -e "${YELLOW}清理残留的Node.js进程...${NC}"
pkill -f "npm.*serve" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "node.*app.js" 2>/dev/null || true

echo -e "${GREEN}🎉 所有服务已停止${NC}"

# 显示端口占用情况
echo -e "${BLUE}📊 端口占用检查：${NC}"
if lsof -i:8081 > /dev/null 2>&1; then
    echo -e "${RED}⚠️  端口 8081 仍被占用：${NC}"
    lsof -i:8081
else
    echo -e "${GREEN}✅ 端口 8081 已释放${NC}"
fi

if lsof -i:8083 > /dev/null 2>&1; then
    echo -e "${RED}⚠️  端口 8083 仍被占用：${NC}"
    lsof -i:8083
else
    echo -e "${GREEN}✅ 端口 8083 已释放${NC}"
fi

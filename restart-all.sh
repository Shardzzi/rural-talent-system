#!/bin/bash

# 数字乡村人才信息系统 - 重启脚本
echo "🔄 重启数字乡村人才信息系统..."

# 设置颜色输出
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}步骤 1: 停止现有服务...${NC}"
./stop-all.sh

echo ""
echo -e "${YELLOW}步骤 2: 等待 3 秒...${NC}"
sleep 3

echo ""
echo -e "${YELLOW}步骤 3: 启动服务...${NC}"
./start-all.sh

echo -e "${GREEN}🎉 重启完成！${NC}"

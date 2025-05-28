#!/bin/bash

# 清理日志脚本
echo "🧹 清理日志文件..."

# 创建logs目录（如果不存在）
mkdir -p logs

# 清空或创建日志文件
> logs/frontend.log
> logs/backend.log
> backend/logs/combined.log
> backend/logs/error.log

echo "✅ 日志文件已清理"
echo "📁 日志文件位置："
echo "   - logs/frontend.log"
echo "   - logs/backend.log"  
echo "   - backend/logs/combined.log"
echo "   - backend/logs/error.log"

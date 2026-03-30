#!/bin/bash

# 农村人才管理系统 Docker 快速启动脚本

echo "🚀 农村人才管理系统 Docker 快速启动"
echo "=================================="

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 选择环境
echo "请选择环境："
echo "1) 开发环境 (推荐用于测试和开发)"
echo "2) 生产环境 (推荐用于正式部署)"
read -p "请输入选择 (1-2): " choice

case $choice in
    1)
        echo "🔧 启动开发环境..."
        ./scripts/docker-deploy.sh -e development start
        ;;
    2)
        echo "🏭 启动生产环境..."
        if [ ! -f ".env" ]; then
            echo "📋 首次部署生产环境，请配置环境变量："
            cp .env.example .env
            echo "✅ 已创建 .env 文件，请编辑后重新运行"
            echo "📝 编辑命令: nano .env"
            exit 1
        fi
        ./scripts/docker-deploy.sh -e production start
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "✅ 启动完成！"
echo ""
echo "📊 查看服务状态: ./deploy.sh status"
echo "📜 查看日志: ./deploy.sh logs"
echo "🛑 停止服务: ./deploy.sh stop"
echo ""
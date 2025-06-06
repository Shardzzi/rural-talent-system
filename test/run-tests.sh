#!/bin/bash

# 数字乡村人才信息系统测试运行脚本 (优化版)
# 使用方法: ./run-tests.sh [test-type]
# test-type: all, health, integration, permissions

cd "$(dirname "$0")"

echo "================================================"
echo "  数字乡村人才信息系统 - 测试套件 v2.0"
echo "================================================"
echo ""

# 检查后端服务是否运行
echo "🔍 检查后端服务状态..."
if curl -s http://localhost:8083/api/persons > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常 (http://localhost:8083)"
else
    echo "❌ 后端服务未运行或无法访问"
    echo "💡 请先启动后端服务: cd .. && pnpm --filter rural-talent-system-backend run dev"
    echo "💡 或者使用: cd .. && ./dev-start.sh"
    echo "💡 或检查端口是否正确 (应为 8083)"
    exit 1
fi

# 检查前端服务是否运行
echo "🔍 检查前端服务状态..."
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "✅ 前端服务运行正常 (http://localhost:8081)"
else
    echo "⚠️  前端服务未运行"
    echo "💡 如需完整测试，请启动前端服务: cd .. && pnpm --filter rural-talent-system-frontend run dev"
fi

echo ""
echo "================================================"

# 根据参数运行不同的测试
case "${1:-all}" in
    "health")
        echo "🏥 运行系统健康检查..."
        node simple-verification.js
        ;;
    "integration")
        echo "🔗 运行系统集成测试..."
        node test_system_integration.js
        ;;
    "permissions")
        echo "👥 运行权限功能测试..."
        node test_dual_user_features.js
        ;;
    "all")
        echo "🎯 运行完整测试套件..."
        echo ""
        echo "1️⃣  系统健康检查"
        node simple-verification.js
        echo ""
        echo "⏳ 等待2秒后继续..."
        sleep 2
        echo "2️⃣  系统集成测试"
        node test_system_integration.js
        echo ""
        echo "⏳ 等待2秒后继续..."
        sleep 2
        echo "3️⃣  权限功能测试"
        node test_dual_user_features.js
        echo ""
        echo "✅ 所有测试完成"
        ;;
    *)
        echo "❌ 未知测试类型: $1"
        echo ""
        echo "可用的测试类型:"
        echo "  all          - 运行完整测试套件"
        echo "  health       - 系统健康检查"
        echo "  integration  - 系统集成测试"
        echo "  permissions  - 权限功能测试"
        echo ""
        echo "使用示例:"
        echo "  ./run-tests.sh all"
        echo "  ./run-tests.sh health"
        echo "  ./run-tests.sh integration"
        echo "  ./run-tests.sh permissions"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "  测试完成!"
echo "================================================"

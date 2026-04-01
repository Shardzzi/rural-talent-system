#!/bin/bash

# 数字乡村人才信息系统测试运行脚本 (优化版)
# 使用方法: ./run-tests.sh [test-type]
# test-type: all, health, integration, permissions, endpoints, errors, edge-cases, auth, search

cd "$(dirname "$0")"

echo "================================================"
echo "  数字乡村人才信息系统 - 测试套件 v3.0"
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

run_test() {
    node "$1"
}

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
    "endpoints")
        echo "🛣️  运行所有端点测试..."
        node test_all_endpoints.js
        ;;
    "errors")
        echo "🛡️  运行错误处理测试..."
        node test_error_handling.js
        ;;
    "edge-cases")
        echo "🧩 运行边缘情况测试..."
        node test_edge_cases.js
        ;;
    "auth")
        echo "🔐 运行身份验证权限测试..."
        node test_auth_permissions.js
        ;;
    "search")
        echo "🔍 运行搜索和分页测试..."
        node test_search_pagination.js
        ;;
    "all")
        echo "运行完整测试套件..."
        run_test "simple-verification.js"
        run_test "test_system_integration.js"
        run_test "test_dual_user_features.js"
        run_test "test_all_endpoints.js"
        run_test "test_error_handling.js"
        run_test "test_edge_cases.js"
        run_test "test_auth_permissions.js"
        run_test "test_search_pagination.js"
        ;;
    *)
        echo "❌ 未知测试类型: $1"
        echo ""
        echo "可用的测试类型:"
        echo "  all          - 运行完整测试套件"
        echo "  health       - 系统健康检查"
        echo "  integration  - 系统集成测试"
        echo "  permissions  - 权限功能测试"
        echo "  endpoints    - 所有端点测试"
        echo "  errors       - 错误处理测试"
        echo "  edge-cases   - 边缘情况测试"
        echo "  auth         - 身份验证权限测试"
        echo "  search       - 搜索和分页测试"
        echo ""
        echo "使用示例:"
        echo "  ./run-tests.sh all"
        echo "  ./run-tests.sh health"
        echo "  ./run-tests.sh endpoints"
        echo "  ./run-tests.sh errors"
        echo "  ./run-tests.sh edge-cases"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "  测试完成!"
echo "================================================"

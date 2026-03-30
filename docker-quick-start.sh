#!/bin/bash

# 农村人才管理系统 Docker 快速启动脚本
# 简化版 Docker 开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="农村人才管理系统"
VERSION="v2.2.1"

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$PROJECT_NAME Docker 快速启动${NC}"
    echo -e "${BLUE}版本: $VERSION${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: Docker 未安装${NC}"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}错误: Docker Compose 未安装${NC}"
        exit 1
    fi

    # 设置 Docker Compose 命令
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        DOCKER_COMPOSE="docker compose"
    fi

    echo -e "${GREEN}✓ Docker 环境检查完成${NC}"
}

build_and_start() {
    echo -e "${YELLOW}正在构建并启动服务...${NC}"

    # 构建并启动服务
    $DOCKER_COMPOSE -f docker-compose.dev.yml up --build -d

    echo -e "${GREEN}✓ 服务启动完成${NC}"
}

wait_for_services() {
    echo -e "${YELLOW}等待服务启动...${NC}"

    # 等待服务启动
    sleep 10

    # 检查服务状态
    if $DOCKER_COMPOSE -f docker-compose.dev.yml ps | grep -q "Up"; then
        echo -e "${GREEN}✓ 服务运行正常${NC}"
    else
        echo -e "${RED}✗ 服务启动失败${NC}"
        $DOCKER_COMPOSE -f docker-compose.dev.yml logs --tail=20
        exit 1
    fi
}

show_status() {
    echo ""
    echo -e "${BLUE}=== 服务状态 ===${NC}"
    $DOCKER_COMPOSE -f docker-compose.dev.yml ps
    echo ""
}

show_access_info() {
    echo -e "${BLUE}=== 访问信息 ===${NC}"
    echo -e "${GREEN}🌐 前端应用: http://localhost:8081${NC}"
    echo -e "${GREEN}⚙️ 后端 API: http://localhost:8083${NC}"
    echo -e "${GREEN}❤️ 健康检查: http://localhost:8083/api/health${NC}"
    echo ""
    echo -e "${BLUE}=== 测试账号 ===${NC}"
    echo -e "${GREEN}👤 管理员: admin / admin123${NC}"
    echo -e "${GREEN}👥 普通用户: testuser / test123${NC}"
    echo ""
    echo -e "${YELLOW}管理命令:${NC}"
    echo -e "${GREEN}  查看日志: $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f${NC}"
    echo -e "${GREEN}  停止服务: $DOCKER_COMPOSE -f docker-compose.dev.yml down${NC}"
    echo -e "${GREEN}  重启服务: $DOCKER_COMPOSE -f docker-compose.dev.yml restart${NC}"
    echo ""
}

show_logs_on_error() {
    echo -e "${RED}=== 错误日志 ===${NC}"
    $DOCKER_COMPOSE -f docker-compose.dev.yml logs --tail=50
}

# 主程序
main() {
    case "${1:-start}" in
        "start")
            print_header
            check_docker
            build_and_start
            wait_for_services
            show_status
            show_access_info
            ;;
        "stop")
            echo -e "${YELLOW}停止服务...${NC}"
            $DOCKER_COMPOSE -f docker-compose.dev.yml down
            echo -e "${GREEN}✓ 服务已停止${NC}"
            ;;
        "restart")
            echo -e "${YELLOW}重启服务...${NC}"
            $DOCKER_COMPOSE -f docker-compose.dev.yml restart
            echo -e "${GREEN}✓ 服务已重启${NC}"
            show_access_info
            ;;
        "logs")
            echo -e "${YELLOW}显示日志...${NC}"
            $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            echo "用法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  start    启动服务 (默认)"
            echo "  stop     停止服务"
            echo "  restart  重启服务"
            echo "  logs     查看日志"
            echo "  status   查看状态"
            echo "  help     显示帮助"
            ;;
        *)
            echo -e "${RED}未知命令: $1${NC}"
            echo "使用 '$0 help' 查看可用命令"
            exit 1
            ;;
    esac
}

# 错误处理
trap 'echo -e "${RED}启动失败，查看错误信息:${NC}"; show_logs_on_error; exit 1' ERR

# 运行主程序
main "$@"
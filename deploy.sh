#!/bin/bash

# 农村人才管理系统 - 部署入口脚本
# 数字乡村人才信息系统项目团队
# 版本: v2.2.1

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 检查脚本文件
check_scripts() {
    if [ ! -f "scripts/docker-deploy.sh" ]; then
        print_error "找不到部署脚本: scripts/docker-deploy.sh"
        exit 1
    fi

    if [ ! -f "scripts/quick-docker-start.sh" ]; then
        print_error "找不到快速启动脚本: scripts/quick-docker-start.sh"
        exit 1
    fi
}

# 显示使用帮助
show_help() {
    cat << EOF
农村人才管理系统部署脚本

用法: $0 [选项]

选项:
    start       启动服务 (交互式)
    dev         启动开发环境
    prod        启动生产环境
    stop        停止所有服务
    restart     重启服务
    status      查看服务状态
    logs        查看日志
    backup      备份数据
    restore     恢复数据
    clean       清理系统
    help        显示此帮助信息

示例:
    $0 start           # 交互式启动
    $0 dev             # 启动开发环境
    $0 prod            # 启动生产环境
    $0 status          # 查看服务状态

更多信息请查看:
    - docs/DOCKER_README.md: 完整的Docker部署指南
    - docs/PROJECT_SUMMARY.md: 项目总结文档
    - CLAUDE.md: Claude AI开发助手指南

EOF
}

# 主函数
main() {
    print_header "农村人才管理系统部署脚本 v2.2.1"

    # 检查依赖
    check_docker
    check_scripts

    # 设置脚本权限
    chmod +x scripts/*.sh

    case "${1:-help}" in
        "start")
            print_message "启动交互式部署..."
            ./scripts/quick-docker-start.sh
            ;;
        "dev")
            print_message "启动开发环境..."
            ./scripts/docker-deploy.sh -e development start
            ;;
        "prod")
            print_message "启动生产环境..."
            ./scripts/docker-deploy.sh -e production start
            ;;
        "stop")
            print_message "停止所有服务..."
            ./scripts/docker-deploy.sh -e development stop
            ;;
        "restart")
            print_message "重启服务..."
            ./scripts/docker-deploy.sh -e development restart
            ;;
        "status")
            print_message "查看服务状态..."
            ./scripts/docker-deploy.sh -e development status
            ;;
        "logs")
            print_message "查看服务日志..."
            ./scripts/docker-deploy.sh -e development logs
            ;;
        "backup")
            print_message "备份数据..."
            ./scripts/docker-deploy.sh -e development backup
            ;;
        "restore")
            print_message "恢复数据..."
            ./scripts/docker-deploy.sh -e development restore
            ;;
        "clean")
            print_message "清理系统..."
            ./scripts/docker-deploy.sh -e development clean
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
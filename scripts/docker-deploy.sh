#!/bin/bash

# 农村人才管理系统 Docker 一键部署脚本
# 支持开发环境和生产环境部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本信息
SCRIPT_NAME="农村人才管理系统 Docker 部署脚本"
VERSION="1.0.0"
AUTHOR="数字乡村人才信息系统项目团队"

# 项目配置
PROJECT_NAME="rural-talent-system"
COMPOSE_FILE="docker/docker-compose.yml"
COMPOSE_PROD_FILE="docker/docker-compose.prod.yml"

# 默认设置
DEFAULT_ENV="development"
DEFAULT_ACTION="deploy"

# 函数定义
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$SCRIPT_NAME${NC}"
    echo -e "${BLUE}版本: $VERSION${NC}"
    echo -e "${BLUE}作者: $AUTHOR${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_usage() {
    echo "用法: $0 [选项] [命令]"
    echo ""
    echo "选项:"
    echo "  -e, --env ENVIRONMENT    设置环境 (development|production) [默认: $DEFAULT_ENV]"
    echo "  -h, --help              显示帮助信息"
    echo "  -v, --version           显示版本信息"
    echo ""
    echo "命令:"
    echo "  deploy                  部署应用 (默认)"
    echo "  start                   启动服务"
    echo "  stop                    停止服务"
    echo "  restart                 重启服务"
    echo "  logs                    查看日志"
    echo "  status                  查看服务状态"
    echo "  clean                   清理容器和数据卷"
    echo "  backup                  备份数据库"
    echo "  restore                 恢复数据库"
    echo "  migrate                 数据迁移"
    echo ""
    echo "示例:"
    echo "  $0                      # 开发环境部署"
    echo "  $0 -e production       # 生产环境部署"
    echo "  $0 start               # 启动服务"
    echo "  $0 logs                # 查看日志"
}

print_version() {
    echo "$SCRIPT_NAME v$VERSION"
}

check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: Docker 未安装${NC}"
        exit 1
    fi

    # 检查 Docker Compose (支持新旧语法)
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}错误: Docker Compose 未安装或不可用${NC}"
        echo -e "${YELLOW}请确保已正确安装 Docker 或启用 Docker Desktop WSL 集成${NC}"
        exit 1
    fi

    # 设置 Docker Compose 命令
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        DOCKER_COMPOSE="docker compose"
    fi

    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}警告: pnpm 未安装，将使用 npm${NC}"
    fi

    echo -e "${GREEN}✓ 依赖检查完成${NC}"
}

setup_environment() {
    local env=$1

    echo -e "${YELLOW}设置环境: $env${NC}"

    if [ "$env" = "production" ]; then
        # 检查 .env 文件
        if [ ! -f ".env" ]; then
            echo -e "${RED}错误: 生产环境需要 .env 配置文件${NC}"
            echo -e "${YELLOW}请复制 .env.example 为 .env 并填入实际配置${NC}"
            exit 1
        fi

        export COMPOSE_FILE="$COMPOSE_PROD_FILE"
        export ENVIRONMENT="production"

        # 创建必要的目录
        mkdir -p ssl backups logs/{nginx,mysql,backend} data/{mysql,redis}

        echo -e "${GREEN}✓ 生产环境配置完成${NC}"
    else
        export COMPOSE_FILE="$COMPOSE_FILE"
        export ENVIRONMENT="development"

        # 创建必要的目录
        mkdir -p logs/{nginx,mysql,backend} data/mysql

        echo -e "${GREEN}✓ 开发环境配置完成${NC}"
    fi
}

deploy_application() {
    echo -e "${YELLOW}开始部署应用...${NC}"

    # 构建镜像
    echo -e "${BLUE}构建 Docker 镜像...${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_FILE build

    # 启动服务
    echo -e "${BLUE}启动服务...${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_FILE up -d

    # 等待服务启动
    echo -e "${BLUE}等待服务启动...${NC}"
    sleep 30

    # 检查服务状态
    check_services_status

    echo -e "${GREEN}✓ 应用部署完成${NC}"
}

start_services() {
    echo -e "${YELLOW}启动服务...${NC}"

    # 检查服务是否已经存在
    if ! $DOCKER_COMPOSE -f $COMPOSE_FILE ps -q | grep -q .; then
        echo -e "${BLUE}容器不存在，正在创建和启动服务...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE up -d
    else
        echo -e "${BLUE}启动已存在的容器...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE start
    fi

    echo -e "${GREEN}✓ 服务启动完成${NC}"
}

stop_services() {
    echo -e "${YELLOW}停止服务...${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_FILE stop
    echo -e "${GREEN}✓ 服务停止完成${NC}"
}

restart_services() {
    echo -e "${YELLOW}重启服务...${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_FILE restart
    echo -e "${GREEN}✓ 服务重启完成${NC}"
}

show_logs() {
    echo -e "${YELLOW}显示服务日志...${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f
}

show_status() {
    echo -e "${YELLOW}服务状态:${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_FILE ps
    echo ""
    check_services_status
}

check_services_status() {
    local services=("mysql" "backend" "frontend")

    for service in "${services[@]}"; do
        local status=$($DOCKER_COMPOSE -f $COMPOSE_FILE ps -q $service | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")

        if [ "$status" = "healthy" ]; then
            echo -e "${GREEN}✓ $service: 健康${NC}"
        elif [ "$status" = "unhealthy" ]; then
            echo -e "${RED}✗ $service: 不健康${NC}"
        elif [ "$status" = "starting" ]; then
            echo -e "${YELLOW}⚠ $service: 启动中${NC}"
        else
            local container_status=$($DOCKER_COMPOSE -f $COMPOSE_FILE ps $service | awk 'NR>1 {print $NF}')
            if [ "$container_status" = "Up" ]; then
                echo -e "${GREEN}✓ $service: 运行中${NC}"
            else
                echo -e "${RED}✗ $service: 停止${NC}"
            fi
        fi
    done
}

clean_resources() {
    echo -e "${YELLOW}清理资源...${NC}"
    read -p "这将删除所有容器、镜像和数据卷，确定吗？ (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $DOCKER_COMPOSE -f $COMPOSE_FILE down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}✓ 资源清理完成${NC}"
    else
        echo -e "${YELLOW}取消清理操作${NC}"
    fi
}

backup_database() {
    echo -e "${YELLOW}备份数据库...${NC}"

    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="backups/rural_talent_backup_$timestamp.sql"

    mkdir -p backups

    $DOCKER_COMPOSE -f $COMPOSE_FILE exec mysql mysqldump \
        -u rural_app -p${MYSQL_PASSWORD:-rural_password_2024} \
        rural_talent_system > $backup_file

    echo -e "${GREEN}✓ 数据库备份完成: $backup_file${NC}"
}

restore_database() {
    echo -e "${YELLOW}恢复数据库...${NC}"

    local backup_file=$1

    if [ -z "$backup_file" ]; then
        echo "用法: $0 restore <backup_file>"
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}错误: 备份文件不存在: $backup_file${NC}"
        exit 1
    fi

    $DOCKER_COMPOSE -f $COMPOSE_FILE exec -T mysql mysql \
        -u rural_app -p${MYSQL_PASSWORD:-rural_password_2024} \
        rural_talent_system < $backup_file

    echo -e "${GREEN}✓ 数据库恢复完成${NC}"
}

migrate_data() {
    echo -e "${YELLOW}执行数据迁移...${NC}"

    if [ -f "backend/data/persons.db" ]; then
        echo -e "${BLUE}发现 SQLite 数据文件，开始迁移...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE exec backend node database/migrate-data.js
        echo -e "${GREEN}✓ 数据迁移完成${NC}"
    else
        echo -e "${YELLOW}未找到 SQLite 数据文件，跳过迁移${NC}"
    fi
}

show_access_info() {
    echo ""
    echo -e "${BLUE}=== 访问信息 ===${NC}"

    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${GREEN}🌐 前端应用: http://localhost${NC}"
        echo -e "${GREEN}🔒 HTTPS 应用: https://localhost${NC}"
    else
        echo -e "${GREEN}🌐 前端应用: http://localhost:8081${NC}"
        echo -e "${GREEN}📊 数据库管理: http://localhost:8080${NC}"
    fi

    echo -e "${GREEN}⚙️ 后端 API: http://localhost:8083${NC}"
    echo -e "${GREEN}❤️ 健康检查: http://localhost:8083/api/health${NC}"
    echo ""
    echo -e "${BLUE}=== 测试账号 ===${NC}"
    echo -e "${GREEN}👤 管理员: admin / admin123${NC}"
    echo -e "${GREEN}👥 普通用户: testuser / test123${NC}"
    echo ""
}

# 主程序
main() {
    local env=$DEFAULT_ENV
    local action=$DEFAULT_ACTION

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                env="$2"
                shift 2
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            -v|--version)
                print_version
                exit 0
                ;;
            deploy|start|stop|restart|logs|status|clean|backup|restore|migrate)
                action="$1"
                shift
                ;;
            *)
                echo -e "${RED}未知选项: $1${NC}"
                print_usage
                exit 1
                ;;
        esac
    done

    # 验证环境参数
    if [[ ! "$env" =~ ^(development|production)$ ]]; then
        echo -e "${RED}错误: 无效的环境 '$env'${NC}"
        print_usage
        exit 1
    fi

    print_header

    # 检查依赖
    check_dependencies

    # 设置环境
    setup_environment "$env"

    # 执行命令
    case $action in
        deploy)
            deploy_application
            show_access_info
            ;;
        start)
            start_services
            show_access_info
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            show_access_info
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        clean)
            clean_resources
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database "$2"
            ;;
        migrate)
            migrate_data
            ;;
        *)
            echo -e "${RED}未知命令: $action${NC}"
            print_usage
            exit 1
            ;;
    esac

    echo -e "${GREEN}操作完成！${NC}"
}

# 运行主程序
main "$@"
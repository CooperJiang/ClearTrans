#!/bin/bash

# ========================================================================
# Next.js 项目部署脚本 - 优化版本
# ========================================================================
# 
# 主要优化功能：
# 1. 智能排除构建缓存：自动排除 .next/cache 目录，通常可减少 200MB+ 的包体积
# 2. 精确文件复制：仅复制生产环境必需的文件，排除日志、临时文件等
# 3. 可配置缓存清理：支持 --clean-cache / --no-clean-cache 选项
# 4. 优化效果展示：显示优化前后的包大小对比
# 5. 智能目录复制：避免重复复制，使用 rsync 排除不需要的文件
#
# 被排除的文件/目录：
# - .next/cache/          (构建缓存，通常 200MB+)
# - .next/**/*.log        (构建日志文件)
# - .next/**/webpack-*    (Webpack临时文件)
# - 开发依赖包            (仅安装生产依赖)
#
# 使用方法：
#   ./deploy.sh deploy                    # 默认启用缓存清理
#   ./deploy.sh --no-clean-cache deploy   # 保留缓存文件
#   ./deploy.sh --clean-cache deploy      # 强制清理缓存
# ========================================================================

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # 无颜色

# 默认配置
APP_NAME="nextjs-app"
REMOTE_USER="root"
REMOTE_HOST=""
REMOTE_PORT="22"
REMOTE_DIR="/opt/nextjs-app"
SSH_KEY=""
NODE_VERSION="18"  # Node.js版本
PM2_NAME="nextjs-app"  # PM2进程名称
AUTO_CLEAN_CACHE="true"  # 自动清理构建缓存以减少部署包大小

# 配置文件
CONFIG_FILE="deploy.conf"

# 读取配置文件（如果存在）
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# 交互式菜单
show_interactive_menu() {
    local selected=0
    local options=(
        "🚀 部署应用 (完整部署)"
        "🔄 重启应用"
        "📊 查看状态"
        "📝 查看日志"
        "⏹️  停止应用"
        "🔧 环境变量更新 (仅更新env)"
        "⚙️  设置服务器环境"
        "🔨 配置部署参数"
        "❓ 帮助信息"
        "❌ 退出"
    )
    local actions=(
        "deploy"
        "restart"
        "status"
        "logs"
        "stop"
        "env-update"
        "setup"
        "config"
        "help"
        "exit"
    )
    
    # 隐藏光标
    tput civis
    
    while true; do
        clear
        echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║${NC}           ${CYAN}🚀 Next.js 项目部署管理工具 🚀${NC}             ${BLUE}║${NC}"
        echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
        echo
        echo -e "${YELLOW}📋 当前配置:${NC}"
        echo -e "   ${PURPLE}应用名称:${NC} ${APP_NAME}"
        echo -e "   ${PURPLE}远程主机:${NC} ${REMOTE_HOST:-🔴 未配置}"
        echo -e "   ${PURPLE}远程用户:${NC} ${REMOTE_USER}"
        echo -e "   ${PURPLE}部署目录:${NC} ${REMOTE_DIR}"
        echo -e "   ${PURPLE}PM2进程名:${NC} ${PM2_NAME}"
        echo -e "   ${PURPLE}Node.js版本:${NC} ${NODE_VERSION}"
        echo
        echo -e "${BLUE}🎯 请使用 ${GREEN}↑↓${NC} 键选择，${GREEN}Enter${NC} 确认：${NC}"
        echo
        
        # 显示菜单选项
        for i in "${!options[@]}"; do
            if [ $i -eq $selected ]; then
                echo -e "  ${GREEN}▶${NC} ${options[i]}"
            else
                echo -e "    ${options[i]}"
            fi
        done
        
        echo
        echo -e "${CYAN}💡 提示: 首次使用请先执行 '配置部署参数' 和 '设置服务器环境'${NC}"
        
        # 读取键盘输入
        read -rsn1 key
        
        # 处理特殊键（方向键等）
        if [[ $key == $'\x1b' ]]; then
            read -rsn2 key
            case $key in
                '[A') # 上箭头
                    ((selected--))
                    if [ $selected -lt 0 ]; then
                        selected=$((${#options[@]} - 1))
                    fi
                    ;;
                '[B') # 下箭头
                    ((selected++))
                    if [ $selected -ge ${#options[@]} ]; then
                        selected=0
                    fi
                    ;;
            esac
        elif [[ $key == "" ]]; then
            # Enter键被按下
            break
        fi
    done
    
    # 恢复光标
    tput cnorm
    
    local chosen_action="${actions[selected]}"
    clear
    echo -e "${GREEN}✅ 选择了: ${options[selected]}${NC}"
    echo
    
    # 执行选择的操作
    case "$chosen_action" in
        "deploy")
            echo -e "${GREEN}🚀 开始完整部署应用...${NC}"
            deploy_app
            ;;
        "restart")
            echo -e "${YELLOW}🔄 开始重启应用...${NC}"
            restart_app
            ;;
        "status")
            echo -e "${BLUE}📊 查看应用状态...${NC}"
            check_status
            ;;
        "logs")
            echo -e "${BLUE}📝 查看应用日志...${NC}"
            echo -n "请输入要查看的日志行数 [100]: "
            read log_lines
            log_lines=${log_lines:-100}
            view_logs "$log_lines"
            ;;
        "stop")
            echo -e "${YELLOW}⏹️ 停止应用...${NC}"
            stop_app
            ;;
        "env-update")
            echo -e "${CYAN}🔧 更新环境变量...${NC}"
            update_env_only
            ;;
        "setup")
            echo -e "${YELLOW}⚙️  设置远程服务器环境...${NC}"
            setup_remote
            ;;
        "config")
            echo -e "${BLUE}🔨 配置部署参数...${NC}"
            configure
            ;;
        "help")
            show_help
            echo
            echo -e "${YELLOW}按任意键返回菜单...${NC}"
            read -n 1
            show_interactive_menu
            return
            ;;
        "exit")
            echo -e "${GREEN}👋 退出部署脚本${NC}"
            exit 0
            ;;
    esac
    
    echo
    echo -e "${YELLOW}✨ 操作完成，按任意键返回菜单...${NC}"
    read -n 1
    show_interactive_menu
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}📖 Next.js 部署脚本帮助${NC}"
    echo
    echo -e "用法: $0 [选项] [命令]"
    echo
    echo "命令:"
    echo "  deploy         🚀 构建并部署Next.js应用到远程服务器"
    echo "  restart        🔄 重启远程服务器上的应用"
    echo "  stop           ⏹️  停止远程服务器上的应用"
    echo "  status         📊 检查远程服务器上的应用状态"
    echo "  logs           📝 查看远程服务器上的应用日志"
    echo "  env-update     🔧 仅更新环境变量文件并重启服务"
    echo "  setup          ⚙️  设置远程服务器环境（安装Node.js、PM2等）"
    echo "  config         🔨 配置部署参数"
    echo "  help           ❓ 显示帮助信息"
    echo
    echo "选项:"
    echo "  -h, --host         指定远程主机地址"
    echo "  -u, --user         指定远程用户名"
    echo "  -p, --port         指定SSH端口"
    echo "  -d, --dir          指定远程部署目录"
    echo "  -n, --name         指定应用名称（同时设置PM2进程名）"
    echo "  -k, --key          指定SSH密钥路径"
    echo "  --node-version     指定Node.js版本"
    echo "  --pm2-name         指定PM2进程名称"
    echo "  --clean-cache      启用缓存清理（默认，减少部署包大小）"
    echo "  --no-clean-cache   禁用缓存清理（保留所有文件，调试用）"
    echo
    echo "示例:"
    echo "  $0                           # 启动交互式菜单"
    echo "  $0 config                    # 配置部署参数"
    echo "  $0 deploy                    # 部署应用（默认清理缓存）"
    echo "  $0 --no-clean-cache deploy   # 部署应用（保留缓存文件）"
    echo "  $0 -h 192.168.1.100 deploy   # 部署到指定服务器"
    echo "  $0 status                    # 查看应用状态"
    echo "  $0 logs 500                  # 查看最后500行日志"
    echo "  $0 restart                   # 重启应用"
    echo
    echo "部署流程说明:"
    echo "  🔸 完整部署 (deploy): 本地构建 → 打包 → 上传 → 安装依赖 → 启动"
    echo "  🔸 环境变量更新 (env-update): 仅上传env文件 → 重启应用"
    echo
    echo "💡 提示: 首次使用建议先运行 '$0 config' 配置部署参数"
}

# 保存配置到文件
save_config() {
    cat > "$CONFIG_FILE" << EOF
# Next.js 部署配置文件
APP_NAME="$APP_NAME"
REMOTE_USER="$REMOTE_USER"
REMOTE_HOST="$REMOTE_HOST"
REMOTE_PORT="$REMOTE_PORT"
REMOTE_DIR="$REMOTE_DIR"
SSH_KEY="$SSH_KEY"
NODE_VERSION="$NODE_VERSION"
PM2_NAME="$PM2_NAME"
EOF
    echo -e "${GREEN}✅ 配置已保存到 $CONFIG_FILE${NC}"
}

# SSH/SCP命令构建
build_ssh_cmd() {
    local CMD="ssh"
    
    if [ -n "$SSH_KEY" ]; then
        CMD="$CMD -i $SSH_KEY"
    fi
    
    CMD="$CMD -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_HOST}"
    echo "$CMD"
}

build_scp_cmd() {
    local CMD="scp"
    
    if [ -n "$SSH_KEY" ]; then
        CMD="$CMD -i $SSH_KEY"
    fi
    
    CMD="$CMD -P $REMOTE_PORT"
    echo "$CMD"
}

# 检查必要参数
check_required_params() {
    local MISSING=""
    
    if [ -z "$REMOTE_HOST" ]; then
        MISSING="$MISSING\n  - 远程主机地址 (-h, --host)"
    fi
    
    if [ -z "$REMOTE_USER" ]; then
        MISSING="$MISSING\n  - 远程用户名 (-u, --user)"
    fi
    
    if [ -n "$MISSING" ]; then
        echo -e "${RED}❌ 错误: 缺少必要参数:${NC}$MISSING"
        echo -e "${YELLOW}💡 提示: 使用 '$0 config' 配置部署参数${NC}"
        return 1
    fi
    
    return 0
}

# 显示安装进度的函数
run_with_progress() {
    local cmd="$1"
    local desc="$2"
    local log_file="/tmp/deploy_install.log"
    
    echo -e "${BLUE}$desc${NC}"
    echo -e "${YELLOW}📦 正在执行，请稍候...${NC}"
    
    # 显示进度动画
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    
    # 在后台执行命令
    eval "$cmd" > "$log_file" 2>&1 &
    local pid=$!
    
    # 显示进度动画
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %10 ))
        printf "\r${CYAN}${spin:$i:1} 正在处理中...${NC}"
        sleep 0.1
    done
    
    # 等待命令完成
    wait $pid
    local exit_code=$?
    
    printf "\r"
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $desc 完成${NC}"
        # 显示最后几行输出
        if [ -f "$log_file" ]; then
            tail -5 "$log_file" | while read line; do
                echo -e "${CYAN}   $line${NC}"
            done
        fi
    else
        echo -e "${RED}❌ $desc 失败${NC}"
        if [ -f "$log_file" ]; then
            echo -e "${RED}错误信息:${NC}"
            tail -10 "$log_file" | while read line; do
                echo -e "${RED}   $line${NC}"
            done
        fi
        rm -f "$log_file"
        return $exit_code
    fi
    
    rm -f "$log_file"
    return 0
}

# 检查本地项目
check_local_project() {
    echo -e "${BLUE}🔍 检查本地Next.js项目...${NC}"
    
    # 检查package.json是否存在
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 错误: 未找到 package.json，请在Next.js项目根目录执行此脚本${NC}"
        return 1
    fi
    
    # 检查是否是Next.js项目
    if ! grep -q "next" package.json; then
        echo -e "${RED}❌ 错误: 这似乎不是一个Next.js项目${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Next.js项目检查通过${NC}"
    
    # 安装依赖
    echo -e "${BLUE}📦 检查项目依赖...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  未找到node_modules，正在安装依赖...${NC}"
        
        if command -v pnpm &> /dev/null; then
            echo -e "${BLUE}使用 pnpm 安装依赖...${NC}"
            if ! run_with_progress "pnpm install" "pnpm install"; then
                echo -e "${RED}❌ 依赖安装失败${NC}"
                return 1
            fi
        elif command -v yarn &> /dev/null; then
            echo -e "${BLUE}使用 yarn 安装依赖...${NC}"
            if ! run_with_progress "yarn install" "yarn install"; then
                echo -e "${RED}❌ 依赖安装失败${NC}"
                return 1
            fi
        elif command -v npm &> /dev/null; then
            echo -e "${BLUE}使用 npm 安装依赖...${NC}"
            if ! run_with_progress "npm install" "npm install"; then
                echo -e "${RED}❌ 依赖安装失败${NC}"
                return 1
            fi
        else
            echo -e "${RED}❌ 错误: 未找到npm、yarn或pnpm，无法安装依赖${NC}"
            return 1
        fi
    fi
    
    # 构建项目
    echo -e "${BLUE}🏗️  构建Next.js项目...${NC}"
    
    if command -v pnpm &> /dev/null && [ -f "pnpm-lock.yaml" ]; then
        echo -e "${BLUE}使用 pnpm 构建...${NC}"
        if ! run_with_progress "pnpm run build" "pnpm run build"; then
            echo -e "${RED}❌ 项目构建失败${NC}"
            return 1
        fi
    elif command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
        echo -e "${BLUE}使用 yarn 构建...${NC}"
        if ! run_with_progress "yarn build" "yarn build"; then
            echo -e "${RED}❌ 项目构建失败${NC}"
            return 1
        fi
    elif command -v npm &> /dev/null; then
        echo -e "${BLUE}使用 npm 构建...${NC}"
        if ! run_with_progress "npm run build" "npm run build"; then
            echo -e "${RED}❌ 项目构建失败${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ 错误: 无法找到包管理器${NC}"
        return 1
    fi
    
    # 检查构建产物
    if [ ! -d ".next" ]; then
        echo -e "${RED}❌ 错误: 构建完成但未找到.next目录${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ 项目构建成功${NC}"
    
    # 可选：清理构建缓存以减少部署包大小
    echo -e "${BLUE}🧹 优化构建产物...${NC}"
    
    # 显示当前.next目录大小
    if [ -d ".next" ]; then
        local next_size_before=$(du -sh ".next" 2>/dev/null | cut -f1 || echo "未知")
        echo -e "${CYAN}   构建产物大小: $next_size_before${NC}"
        
        # 显示缓存目录大小
        if [ -d ".next/cache" ]; then
            local cache_size=$(du -sh ".next/cache" 2>/dev/null | cut -f1 || echo "未知")
            echo -e "${YELLOW}   其中缓存大小: $cache_size${NC}"
            
            # 询问是否清理缓存（自动模式下默认清理）
            if [ "$AUTO_CLEAN_CACHE" = "true" ]; then
                echo -e "${BLUE}   自动清理缓存以减少部署包大小...${NC}"
                rm -rf ".next/cache" 2>/dev/null || true
                
                # 显示清理后的大小
                local next_size_after=$(du -sh ".next" 2>/dev/null | cut -f1 || echo "未知")
                echo -e "${GREEN}   ✓ 缓存已清理，当前大小: $next_size_after${NC}"
            else
                echo -e "${YELLOW}   💡 提示: 缓存目录将在打包时自动排除${NC}"
            fi
        fi
        
        # 清理其他不必要的文件
        echo -e "${BLUE}   清理其他临时文件...${NC}"
        find ".next" -name "*.log" -delete 2>/dev/null || true
        find ".next" -name "webpack-*" -type d -exec rm -rf {} + 2>/dev/null || true
        
        echo -e "${GREEN}   ✓ 构建产物优化完成${NC}"
    fi
    
    # 创建部署包
    echo -e "${BLUE}📦 创建部署包...${NC}"
    
    # 创建临时目录
    DEPLOY_TEMP_DIR="./deploy_package"
    rm -rf "$DEPLOY_TEMP_DIR"
    mkdir -p "$DEPLOY_TEMP_DIR"
    
    # 复制必要文件
    echo -e "${BLUE}📁 复制项目文件...${NC}"
    
    # 复制基本文件
    cp package.json "$DEPLOY_TEMP_DIR/"
    
    # 复制lock文件（如果存在）
    [ -f "package-lock.json" ] && cp package-lock.json "$DEPLOY_TEMP_DIR/"
    [ -f "yarn.lock" ] && cp yarn.lock "$DEPLOY_TEMP_DIR/"
    [ -f "pnpm-lock.yaml" ] && cp pnpm-lock.yaml "$DEPLOY_TEMP_DIR/"
    
    # 复制Next.js配置文件（如果存在）
    [ -f "next.config.js" ] && cp next.config.js "$DEPLOY_TEMP_DIR/"
    [ -f "next.config.mjs" ] && cp next.config.mjs "$DEPLOY_TEMP_DIR/"
    [ -f "next.config.ts" ] && cp next.config.ts "$DEPLOY_TEMP_DIR/"
    
    # 复制构建产物（优化：排除缓存和不必要的文件）
    echo -e "${BLUE}📁 复制构建产物（排除缓存文件）...${NC}"
    
    # 创建.next目录
    mkdir -p "$DEPLOY_TEMP_DIR/.next"
    
    # 复制必要的.next文件和目录，排除缓存
    if [ -d ".next" ]; then
        # 为了确保稳定性，优先使用安全复制模式
        echo -e "${BLUE}使用安全复制模式（确保包含所有必需文件）...${NC}"
        
        # 安全模式：复制整个.next目录但排除缓存
        if command -v rsync >/dev/null 2>&1; then
            echo -e "${GREEN}使用rsync安全复制（排除缓存）...${NC}"
            rsync -av --exclude='cache/' --exclude='*.log' --exclude='trace' --exclude='webpack-hmr' \
                ".next/" "$DEPLOY_TEMP_DIR/.next/" 2>/dev/null
        else
            echo -e "${GREEN}使用cp安全复制...${NC}"
            cp -r ".next/"* "$DEPLOY_TEMP_DIR/.next/" 2>/dev/null
            # 删除缓存目录和不必要文件，但保留webpack-runtime.js
            rm -rf "$DEPLOY_TEMP_DIR/.next/cache" 2>/dev/null || true
            rm -rf "$DEPLOY_TEMP_DIR/.next/trace" 2>/dev/null || true
            find "$DEPLOY_TEMP_DIR/.next" -name "*.log" -delete 2>/dev/null || true
            # 只删除webpack临时目录，不删除webpack-runtime.js等运行时文件
            find "$DEPLOY_TEMP_DIR/.next" -name "webpack-hmr" -type d -exec rm -rf {} + 2>/dev/null || true
        fi
        
        # 验证关键文件是否存在
        echo -e "${BLUE}🔍 验证关键文件...${NC}"
        local missing_files=()
        local required_files=(
            "BUILD_ID"
            "build-manifest.json"
            "package.json"
        )
        
        for file in "${required_files[@]}"; do
            if [ -f "$DEPLOY_TEMP_DIR/.next/$file" ]; then
                echo -e "${GREEN}✓${NC} $file"
            else
                echo -e "${RED}❌${NC} $file (缺失)"
                missing_files+=("$file")
            fi
        done
        
        # 检查必需目录
        local required_dirs=("static" "server")
        for dir in "${required_dirs[@]}"; do
            if [ -d "$DEPLOY_TEMP_DIR/.next/$dir" ]; then
                echo -e "${GREEN}✓${NC} $dir/"
            else
                echo -e "${RED}❌${NC} $dir/ (缺失)"
                missing_files+=("$dir/")
            fi
        done
        
        if [ ${#missing_files[@]} -gt 0 ]; then
            echo -e "${RED}❌ 错误: 关键文件缺失，请检查构建状态${NC}"
            echo -e "${YELLOW}缺失文件: ${missing_files[*]}${NC}"
            return 1
        fi
        
        # 显示排除的缓存目录大小（用于统计）
        if [ -d ".next/cache" ]; then
            local cache_size=$(du -sh ".next/cache" 2>/dev/null | cut -f1 || echo "未知")
            echo -e "${YELLOW}⚠️  已排除缓存目录 .next/cache (大小: $cache_size)${NC}"
        fi
        
        # 统计被排除的文件
        local excluded_files=$(find .next -name "*.log" -o -path "*/cache/*" -o -path "*/trace/*" -o -name "webpack-hmr" 2>/dev/null | wc -l || echo "0")
        
        # 显示优化结果
        echo -e "${CYAN}📝 部署包优化结果:${NC}"
        echo -e "${CYAN}   ✓ 已排除 .next/cache/ 目录 (构建缓存)${NC}"
        echo -e "${CYAN}   ✓ 已排除 $excluded_files 个缓存/日志文件${NC}"
        echo -e "${CYAN}   ✓ 保留所有运行时必需文件 (包括webpack-runtime.js)${NC}"
    else
        echo -e "${RED}❌ 错误: .next目录不存在${NC}"
        return 1
    fi
    
    # 复制public目录（如果存在）
    [ -d "public" ] && cp -r public "$DEPLOY_TEMP_DIR/"
    
    # 复制环境变量文件（部署环境优先使用.env文件）
    [ -f ".env.production" ] && cp .env.production "$DEPLOY_TEMP_DIR/"
    [ -f ".env" ] && cp .env "$DEPLOY_TEMP_DIR/"
    # 注意：.env.local 通常用于本地开发，不应该部署到生产环境
    
    # 创建ecosystem.config.js文件（PM2配置）
    cat > "$DEPLOY_TEMP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '${PM2_NAME}',
    script: 'npm',
    args: 'start',
    cwd: '${REMOTE_DIR}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
      // PORT 从环境变量文件中读取，不在这里硬编码
    },
    error_file: '${REMOTE_DIR}/logs/err.log',
    out_file: '${REMOTE_DIR}/logs/out.log',
    log_file: '${REMOTE_DIR}/logs/combined.log',
    time: true
  }]
}
EOF
    
    # 打包
    DEPLOY_PACKAGE="./deploy_package.tar.gz"
    echo -e "${BLUE}📦 正在打包...${NC}"
    if tar -czf "$DEPLOY_PACKAGE" -C "$DEPLOY_TEMP_DIR" . >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 部署包已创建: $DEPLOY_PACKAGE${NC}"
        
        # 显示包大小和优化效果
        local package_size=$(du -h "$DEPLOY_PACKAGE" | cut -f1)
        local package_size_bytes=$(du -b "$DEPLOY_PACKAGE" | cut -f1)
        
        echo -e "${CYAN}📏 最终部署包大小: $package_size${NC}"
        
        # 计算和显示优化效果
        if [ -d ".next/cache" ]; then
            local cache_size_bytes=$(du -sb ".next/cache" 2>/dev/null | cut -f1 || echo "0")
            local original_size_bytes=$((package_size_bytes + cache_size_bytes))
            local original_size=$(numfmt --to=iec --suffix=B $original_size_bytes 2>/dev/null || echo "计算失败")
            local saved_size=$(numfmt --to=iec --suffix=B $cache_size_bytes 2>/dev/null || echo "计算失败")
            local saved_percent=$(( cache_size_bytes * 100 / original_size_bytes ))
            
            echo
            echo -e "${GREEN}🎉 部署包优化效果:${NC}"
            echo -e "${CYAN}   📦 优化前大小: $original_size${NC}"
            echo -e "${CYAN}   📦 优化后大小: $package_size${NC}"
            echo -e "${CYAN}   💾 节省空间: $saved_size (${saved_percent}%)${NC}"
            echo -e "${CYAN}   ⚡ 上传速度提升: ~${saved_percent}%${NC}"
        else
            echo -e "${YELLOW}   💡 提示: 构建缓存已在构建时清理${NC}"
        fi
        
        # 清理临时目录
        rm -rf "$DEPLOY_TEMP_DIR"
        
        return 0
    else
        echo -e "${RED}❌ 创建部署包失败${NC}"
        return 1
    fi
}

# 环境变量更新功能
update_env_only() {
    echo -e "${CYAN}🔧 仅更新环境变量文件...${NC}"
    
    if ! check_required_params; then
        return 1
    fi
    
    # 检查本地是否有部署环境的环境变量文件
    local env_files=()
    [ -f ".env.production" ] && env_files+=(".env.production")
    [ -f ".env" ] && env_files+=(".env")
    # 注意：.env.local 用于本地开发，不应该部署到生产环境
    
    if [ ${#env_files[@]} -eq 0 ]; then
        echo -e "${RED}❌ 未找到部署环境的环境变量文件 (.env, .env.production)${NC}"
        echo -e "${YELLOW}💡 提示: .env.local 仅用于本地开发，不会被部署${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📁 找到以下环境变量文件:${NC}"
    for file in "${env_files[@]}"; do
        echo -e "   ${GREEN}✓${NC} $file"
    done
    
    local SSH_CMD=$(build_ssh_cmd)
    local SCP_CMD=$(build_scp_cmd)
    
    # 上传环境变量文件
    echo -e "${BLUE}📤 上传环境变量文件...${NC}"
    for file in "${env_files[@]}"; do
        echo -e "${CYAN}   上传 $file...${NC}"
        if ! $SCP_CMD "$file" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/; then
            echo -e "${RED}❌ $file 上传失败${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}✅ 环境变量文件上传完成${NC}"
    
    # 重启应用
    echo -e "${BLUE}🔄 重启应用以应用新的环境变量...${NC}"
    if $SSH_CMD "pm2 restart $PM2_NAME"; then
        echo -e "${GREEN}✅ 应用重启成功，新的环境变量已生效${NC}"
        
        # 显示应用状态
        echo -e "${BLUE}📊 应用状态:${NC}"
        $SSH_CMD "pm2 show $PM2_NAME | head -20"
    else
        echo -e "${RED}❌ 应用重启失败${NC}"
        return 1
    fi
}

# 配置参数
configure() {
    echo -e "${BLUE}🔨 配置Next.js部署参数${NC}"
    echo
    
    # 读取应用名称
    read -p "$(echo -e ${CYAN}应用名称${NC}) [$APP_NAME]: " input
    if [ -n "$input" ]; then APP_NAME="$input"; fi
    
    # 读取远程主机
    read -p "$(echo -e ${CYAN}远程主机地址${NC}) [$REMOTE_HOST]: " input
    if [ -n "$input" ]; then REMOTE_HOST="$input"; fi
    
    # 读取远程用户
    read -p "$(echo -e ${CYAN}远程用户名${NC}) [$REMOTE_USER]: " input
    if [ -n "$input" ]; then REMOTE_USER="$input"; fi
    
    # 读取SSH端口
    read -p "$(echo -e ${CYAN}SSH端口${NC}) [$REMOTE_PORT]: " input
    if [ -n "$input" ]; then REMOTE_PORT="$input"; fi
    
    # 读取远程目录
    read -p "$(echo -e ${CYAN}远程部署目录${NC}) [$REMOTE_DIR]: " input
    if [ -n "$input" ]; then
        # 确保是绝对路径
        if [[ "$input" != /* ]]; then
            echo -e "${YELLOW}⚠️  警告: 您输入的不是绝对路径，将自动修正${NC}"
            input="/$input"
        fi
        REMOTE_DIR="$input"
    fi
    
    # 读取SSH密钥
    read -p "$(echo -e ${CYAN}SSH密钥路径${NC}) (留空使用密码) [$SSH_KEY]: " input
    if [ -n "$input" ]; then SSH_KEY="$input"; fi
    
    # 读取Node.js版本
    read -p "$(echo -e ${CYAN}Node.js版本${NC}) [$NODE_VERSION]: " input
    if [ -n "$input" ]; then NODE_VERSION="$input"; fi
    
    # 读取PM2进程名
    read -p "$(echo -e ${CYAN}PM2进程名称${NC}) [$PM2_NAME]: " input
    if [ -n "$input" ]; then PM2_NAME="$input"; fi
    
    # 保存配置
    save_config
    
    echo -e "${GREEN}✅ 配置完成!${NC}"
    echo -e "使用 '$0 deploy' 部署应用"
}

# 设置远程服务器环境
setup_remote() {
    echo -e "${YELLOW}⚙️  正在设置远程服务器环境...${NC}"
    
    if ! check_required_params; then
        return 1
    fi
    
    local SSH_CMD=$(build_ssh_cmd)
    
    # 创建目录结构
    echo -e "${BLUE}📁 创建目录结构...${NC}"
    if ! $SSH_CMD "mkdir -p $REMOTE_DIR/logs"; then
        echo -e "${RED}❌ 创建目录结构失败${NC}"
        return 1
    fi
    
    # 检查Node.js是否已安装
    echo -e "${BLUE}🔍 检查Node.js安装情况...${NC}"
    NODE_CHECK=$($SSH_CMD "node --version 2>/dev/null || echo 'not_installed'")
    
    if [ "$NODE_CHECK" = "not_installed" ]; then
        echo -e "${YELLOW}⚠️  Node.js未安装，正在安装...${NC}"
        
        # 安装Node.js (使用NodeSource仓库)
        echo -e "${BLUE}📦 使用NodeSource仓库安装Node.js ${NODE_VERSION}...${NC}"
        $SSH_CMD "curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - && sudo apt-get install -y nodejs" || {
            echo -e "${YELLOW}⚠️  使用NodeSource仓库安装失败，尝试使用snap安装...${NC}"
            $SSH_CMD "sudo snap install node --classic" || {
                echo -e "${RED}❌ Node.js安装失败，请手动安装${NC}"
                return 1
            }
        }
        
        # 再次检查安装
        NODE_CHECK=$($SSH_CMD "node --version 2>/dev/null || echo 'failed'")
        if [ "$NODE_CHECK" = "failed" ]; then
            echo -e "${RED}❌ Node.js安装验证失败${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ Node.js已安装: $NODE_CHECK${NC}"
    
    # 检查PM2是否已安装
    echo -e "${BLUE}🔍 检查PM2安装情况...${NC}"
    PM2_CHECK=$($SSH_CMD "pm2 --version 2>/dev/null || echo 'not_installed'")
    
    if [ "$PM2_CHECK" = "not_installed" ]; then
        echo -e "${YELLOW}⚠️  PM2未安装，正在安装...${NC}"
        if ! $SSH_CMD "npm install -g pm2"; then
            echo -e "${RED}❌ PM2安装失败${NC}"
            return 1
        fi
        
        # 再次检查安装
        PM2_CHECK=$($SSH_CMD "pm2 --version 2>/dev/null || echo 'failed'")
        if [ "$PM2_CHECK" = "failed" ]; then
            echo -e "${RED}❌ PM2安装验证失败${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ PM2已安装: $PM2_CHECK${NC}"
    
    echo -e "${GREEN}🎉 远程服务器环境设置完成!${NC}"
    return 0
}

# 部署应用
deploy_app() {
    echo -e "${YELLOW}🚀 正在部署Next.js应用...${NC}"
    
    if ! check_required_params; then
        return 1
    fi
    
    # 检查并构建本地项目
    if ! check_local_project; then
        return 1
    fi
    
    local SSH_CMD=$(build_ssh_cmd)
    local SCP_CMD=$(build_scp_cmd)
    
    # 停止现有应用
    echo -e "${BLUE}⏹️  停止现有应用...${NC}"
    $SSH_CMD "pm2 stop $PM2_NAME 2>/dev/null || echo '应用未运行'"
    $SSH_CMD "pm2 delete $PM2_NAME 2>/dev/null || echo '应用未在PM2中'"
    
    # 完全清空旧文件但保留node_modules和logs（加速部署）
    echo -e "${BLUE}🧹 完全清空旧文件（仅保留node_modules和logs）...${NC}"
    $SSH_CMD "if [ -d \"$REMOTE_DIR\" ]; then 
        cd \"$REMOTE_DIR\" && 
        # 删除所有文件和目录，但保留node_modules和logs
        find . -maxdepth 1 ! -name '.' ! -name 'node_modules' ! -name 'logs' -exec rm -rf {} + 2>/dev/null || true &&
        # 清理隐藏文件（如.env, .next等），但保留.和..
        find . -maxdepth 1 -name '.*' ! -name '.' ! -name '..' -exec rm -rf {} + 2>/dev/null || true
    fi"
    
    # 确保目录和日志目录存在
    echo -e "${BLUE}📁 准备应用目录...${NC}"
    $SSH_CMD "mkdir -p $REMOTE_DIR/logs"
    
    # 上传部署包
    echo -e "${BLUE}📤 上传部署包...${NC}"
    local DEPLOY_PACKAGE="./deploy_package.tar.gz"
    
    # 显示上传进度
    echo -e "${CYAN}正在上传，请稍候...${NC}"
    if ! $SCP_CMD "$DEPLOY_PACKAGE" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/package.tar.gz; then
        echo -e "${RED}❌ 部署包上传失败${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ 部署包上传成功${NC}"
    
    # 解压部署包
    echo -e "${BLUE}📦 解压部署包...${NC}"
    if ! $SSH_CMD "cd $REMOTE_DIR && tar -xzf package.tar.gz && rm package.tar.gz"; then
        echo -e "${RED}❌ 解压部署包失败${NC}"
        return 1
    fi
    
    # 安装生产依赖（仅安装运行时需要的依赖，排除开发依赖）
    echo -e "${BLUE}📦 安装生产依赖...${NC}"
    INSTALL_CMD=""
    if $SSH_CMD "[ -f \"$REMOTE_DIR/pnpm-lock.yaml\" ]"; then
        INSTALL_CMD="cd $REMOTE_DIR && pnpm install --prod --frozen-lockfile --ignore-scripts"
        echo -e "${CYAN}使用 pnpm 安装生产依赖（排除开发依赖）...${NC}"
    elif $SSH_CMD "[ -f \"$REMOTE_DIR/yarn.lock\" ]"; then
        INSTALL_CMD="cd $REMOTE_DIR && yarn install --production --frozen-lockfile --ignore-scripts"
        echo -e "${CYAN}使用 yarn 安装生产依赖（排除开发依赖）...${NC}"
    else
        INSTALL_CMD="cd $REMOTE_DIR && npm ci --only=production --ignore-scripts"
        echo -e "${CYAN}使用 npm 安装生产依赖（排除开发依赖）...${NC}"
    fi
    
    # 在远程服务器上显示安装进度
    if ! $SSH_CMD "$INSTALL_CMD"; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ 依赖安装成功${NC}"
    
    # 启动应用
    echo -e "${BLUE}🚀 启动应用...${NC}"
    if ! $SSH_CMD "cd $REMOTE_DIR && pm2 start ecosystem.config.js"; then
        echo -e "${RED}❌ 应用启动失败${NC}"
        return 1
    fi
    
    # 清理Nginx代理缓存
    echo -e "${BLUE}🧹 清理Nginx代理缓存...${NC}"
    if ! $SSH_CMD "rm -rf /www/server/nginx/proxy_cache_dir/*"; then
        echo -e "${YELLOW}⚠️  Nginx代理缓存清理失败，但这不影响本次部署。${NC}"
    else
        echo -e "${GREEN}✅ Nginx代理缓存已清空${NC}"
    fi
    
    # 设置PM2开机自启
    echo -e "${BLUE}⚙️  设置PM2开机自启...${NC}"
    $SSH_CMD "pm2 save && pm2 startup 2>/dev/null | grep 'sudo' | bash || echo '开机自启设置可能需要手动执行'"
    
    # 清理本地临时文件
    rm -f "$DEPLOY_PACKAGE"
    
    # 查看状态
    echo -e "${BLUE}📊 应用状态:${NC}"
    $SSH_CMD "pm2 show $PM2_NAME"
    
    echo -e "${GREEN}🎉 部署完成!${NC}"
    echo -e "${CYAN}应用已部署到: $REMOTE_HOST:$REMOTE_DIR${NC}"
    echo -e "${CYAN}PM2进程名: $PM2_NAME${NC}"
}

# 重启应用
restart_app() {
    if ! check_required_params; then
        return 1
    fi
    
    local SSH_CMD=$(build_ssh_cmd)
    echo -e "${YELLOW}🔄 重启应用: $PM2_NAME${NC}"
    if $SSH_CMD "pm2 restart $PM2_NAME"; then
        echo -e "${GREEN}✅ 应用重启成功${NC}"
    else
        echo -e "${RED}❌ 应用重启失败${NC}"
        return 1
    fi
}

# 停止应用
stop_app() {
    if ! check_required_params; then
        return 1
    fi
    
    local SSH_CMD=$(build_ssh_cmd)
    echo -e "${YELLOW}⏹️  停止应用: $PM2_NAME${NC}"
    if $SSH_CMD "pm2 stop $PM2_NAME"; then
        echo -e "${GREEN}✅ 应用已停止${NC}"
    else
        echo -e "${RED}❌ 停止应用失败${NC}"
        return 1
    fi
}

# 查看应用状态
check_status() {
    if ! check_required_params; then
        return 1
    fi
    
    local SSH_CMD=$(build_ssh_cmd)
    echo -e "${YELLOW}📊 应用状态:${NC}"
    $SSH_CMD "pm2 show $PM2_NAME"
    echo
    echo -e "${YELLOW}📊 所有PM2进程:${NC}"
    $SSH_CMD "pm2 list"
}

# 查看应用日志
view_logs() {
    if ! check_required_params; then
        return 1
    fi
    
    local SSH_CMD=$(build_ssh_cmd)
    local LINES=${1:-100}
    
    echo -e "${YELLOW}📝 应用日志 (最后 $LINES 行):${NC}"
    $SSH_CMD "pm2 logs $PM2_NAME --lines $LINES"
}

# 处理命令行参数
process_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            -h|--host)
                REMOTE_HOST="$2"
                shift 2
                ;;
            -u|--user)
                REMOTE_USER="$2"
                shift 2
                ;;
            -p|--port)
                REMOTE_PORT="$2"
                shift 2
                ;;
            -d|--dir)
                REMOTE_DIR="$2"
                shift 2
                ;;
            -n|--name)
                APP_NAME="$2"
                PM2_NAME="$2"  # 同时更新PM2进程名
                shift 2
                ;;
            -k|--key)
                SSH_KEY="$2"
                shift 2
                ;;
            --node-version)
                NODE_VERSION="$2"
                shift 2
                ;;
            --pm2-name)
                PM2_NAME="$2"
                shift 2
                ;;
            --clean-cache)
                AUTO_CLEAN_CACHE="true"
                echo -e "${GREEN}✅ 启用缓存清理（减少部署包大小）${NC}"
                shift
                ;;
            --no-clean-cache)
                AUTO_CLEAN_CACHE="false"
                echo -e "${YELLOW}⚠️  禁用缓存清理（保留所有文件）${NC}"
                shift
                ;;
            deploy|restart|stop|status|logs|setup|config|env-update|help)
                local COMMAND="$1"
                shift
                
                # 处理logs命令的参数
                if [ "$COMMAND" = "logs" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
                    local LOGS_LINES="$1"
                    shift
                else
                    local LOGS_LINES=100
                fi
                
                # 执行相应命令
                case "$COMMAND" in
                    deploy)
                        deploy_app
                        ;;
                    restart)
                        restart_app
                        ;;
                    stop)
                        stop_app
                        ;;
                    status)
                        check_status
                        ;;
                    logs)
                        view_logs "$LOGS_LINES"
                        ;;
                    setup)
                        setup_remote
                        ;;
                    config)
                        configure
                        ;;
                    env-update)
                        update_env_only
                        ;;
                    help)
                        show_help
                        ;;
                esac
                return
                ;;
            *)
                echo -e "${RED}❌ 错误: 未知选项或命令 $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# 主函数
main() {
    # 如果没有命令行参数，显示交互式菜单
    if [ $# -eq 0 ]; then
        show_interactive_menu
        exit 0
    fi
    
    process_args "$@"
}

# 执行主函数
main "$@" 
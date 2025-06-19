# 部署指南

专为 Next.js SSR 项目设计的一键部署脚本。

## ✨ 特性

- 🚀 **一键部署**: 自动构建、打包并部署到远程服务器
- 🔧 **环境变量更新**: 支持仅更新环境变量文件并重启服务
- 📦 **智能包管理**: 自动检测并使用 pnpm、yarn 或 npm
- 🎯 **交互式菜单**: 友好的用户界面，支持键盘导航
- 🔄 **PM2 管理**: 使用 PM2 进行进程管理，支持开机自启
- ⚡ **快速部署**: 保留node_modules，避免重复下载依赖

## 🚀 快速开始

### 1. 配置环境变量
```bash
# 复制配置示例
cp env.example .env

# 编辑生产环境配置
# .env (生产环境) - 会被部署到服务器
# .env.local (本地开发) - 不会被部署
```

### 2. 配置部署参数
```bash
./deploy.sh config
```

### 3. 设置服务器环境
```bash
./deploy.sh setup
```

### 4. 部署应用
```bash
./deploy.sh deploy
```

## 📋 可用命令

### 交互式菜单
```bash
./deploy.sh
```

### 命令行操作
```bash
./deploy.sh deploy         # 完整部署
./deploy.sh env-update     # 仅更新环境变量
./deploy.sh restart        # 重启应用
./deploy.sh status         # 查看状态
./deploy.sh logs           # 查看日志
./deploy.sh stop           # 停止应用
./deploy.sh config         # 配置参数
```

## 🔧 环境变量配置

### 文件说明
- **`.env`** - 生产环境配置（会被部署）
- **`.env.local`** - 本地开发配置（不会被部署）
- **`env.example`** - 配置示例（可提交到git）

### 配置示例
```bash
# .env (生产环境)
PORT=6888
DATABASE_URL=postgresql://prod_server:5432/prod_db

# .env.local (本地开发)
PORT=3000
DATABASE_URL=postgresql://localhost:5432/dev_db
```

## 🎯 部署流程

1. 🔍 检查本地 Next.js 项目
2. 🏗️ 构建项目 (`npm run build`)
3. 📦 创建部署包
4. ⏹️ 停止远程应用
5. 🧹 清理旧文件（保留node_modules）
6. 📤 上传部署包
7. 📦 安装/更新生产依赖
8. 🚀 启动应用

## 📚 参数说明

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `-h, --host` | 远程主机地址 | - |
| `-u, --user` | SSH 用户名 | root |
| `-p, --port` | SSH 端口 | 22 |
| `-d, --dir` | 远程部署目录 | /opt/nextjs-app |
| `-k, --key` | SSH 密钥路径 | - |

## 💡 使用提示

- 首次使用先配置参数: `./deploy.sh config`
- 环境变量修改后使用: `./deploy.sh env-update`
- 建议将 `.env` 和 `.env.local` 添加到 `.gitignore` 
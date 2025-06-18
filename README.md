# Easy-Tran AI翻译工具

一个基于Next.js和OpenAI GPT的现代化翻译工具，支持多种AI模型和灵活的配置选项。

## 功能特性

- 🤖 支持多种OpenAI模型 (GPT-4o, GPT-4o Mini, GPT-3.5 Turbo)
- 🔒 双模式支持：服务端模式（安全）+ 客户端模式（灵活）
- 📝 文件上传翻译 (.txt, .md)
- 🎙️ 语音朗读功能
- 📋 一键复制结果
- 💾 本地配置保存
- 🎨 现代化UI设计
- 📱 响应式布局

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd easy-tran
npm install
```

### 2. 环境配置

创建 `.env.local` 文件（推荐使用服务端模式）：

```bash
# 必需：您的 OpenAI API 密钥
OPENAI_API_KEY=sk-your-openai-api-key-here

# 可选配置
OPENAI_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.3
```

### 3. 启动应用

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

应用将在 http://localhost:8888 启动

## 环境变量说明

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `OPENAI_API_KEY` | 是* | - | OpenAI API 密钥 |
| `OPENAI_BASE_URL` | 否 | https://api.openai.com | API 基础URL |
| `OPENAI_MODEL` | 否 | gpt-4o-mini | 默认AI模型 |
| `OPENAI_MAX_TOKENS` | 否 | 4096 | 最大Token数 |
| `OPENAI_TEMPERATURE` | 否 | 0.3 | AI温度参数 |

*注：如果未配置服务端环境变量，用户可以在客户端模式下使用自己的API密钥

## 使用模式

### 服务端模式（推荐）
- 配置服务端环境变量后，用户无需提供API密钥
- 最高安全性，API密钥完全隐藏
- 适合公开部署

### 客户端模式
- 用户在设置中输入自己的API密钥
- 密钥通过HTTPS安全传输到服务端
- 适合个人使用或需要自定义配置的场景

## 部署

### Vercel部署

1. Fork本仓库
2. 在Vercel中导入项目
3. 配置环境变量：
   ```
   OPENAI_API_KEY=your-api-key
   ```
4. 部署完成

### Docker部署

```bash
# 构建镜像
docker build -t easy-tran .

# 运行容器
docker run -p 8888:8888 -e OPENAI_API_KEY=your-api-key easy-tran
```

### 自托管

1. 构建项目：`npm run build`
2. 配置环境变量
3. 启动：`npm start`

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 代码检查
npm run lint

# 构建项目
npm run build
```

## 技术栈

- **前端框架**: Next.js 15
- **UI框架**: Tailwind CSS 4
- **语言**: TypeScript
- **AI服务**: OpenAI GPT API
- **部署**: Vercel/Docker

## 许可证

MIT License

## 贡献

欢迎提交Issues和Pull Requests来改进项目！

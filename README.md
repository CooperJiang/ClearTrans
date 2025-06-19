<div align="center">

# 🌐 Clear Trans

**智能翻译工具 | AI-Powered Translation Tool**

一个基于 Next.js 构建的现代化智能翻译平台，支持多种 AI 翻译服务

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[🌐 在线体验](https://your-demo-url.com) | [📖 文档](https://your-docs-url.com) | [🐛 问题反馈](https://github.com/your-username/clear-trans/issues)

</div>

## ✨ 特性

🎯 **智能翻译**
- 支持 100+ 语言互译
- 基于AI模型进行翻译
- 智能语言检测，自动识别源语言

🛠️ **灵活配置**
- 支持自定义 API 密钥和接口地址
- 服务端/客户端双模式部署
- 可自定义系统提示词和翻译参数

🎨 **现代化界面**
- 响应式设计，支持移动端和桌面端
- 简洁直观的用户界面
- 实时翻译状态反馈

⚡ **高性能**
- 基于 Next.js 15 构建
- 服务端渲染 (SSR) 支持
- 优化的网络请求和缓存策略

🔒 **安全可靠**
- API 密钥本地存储
- 支持自定义翻译服务接口
- 开源透明，隐私保护

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm、yarn 或 pnpm 包管理器

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/clear-trans.git
cd clear-trans

# 安装依赖
npm install
# 或
yarn install
# 或
pnpm install

# 配置环境变量
cp env.example .env.local

# 编辑 .env.local 文件，添加你的 API 配置
# OPENAI_API_KEY=your_openai_api_key
# OPENAI_BASE_URL=https://api.openai.com/v1

# 启动开发服务器
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 [http://localhost:8888](http://localhost:8888) 查看应用。

### 生产部署

请参考 [部署指南](./DEPLOYMENT.md) 了解详细的部署步骤。

## 🔧 配置说明

### 环境变量

创建 `.env.local` 文件进行本地配置：

```bash
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# 应用端口
PORT=8888

# 可选：自定义模型
OPENAI_MODEL=gpt-4o-mini
```

### 支持的翻译服务

当前版本支持以下翻译服务：

- **OpenAI GPT 系列**
  - GPT-4o-mini (推荐)
  - GPT-3.5-turbo
  - GPT-4
  - 其他兼容 OpenAI API 的服务

- **自定义接口**
  - 支持任何兼容 OpenAI API 格式的翻译服务
  - 可配置自定义 Base URL

## 📚 使用说明

### 基本使用

1. **选择语言**: 在语言选择器中设置源语言和目标语言
2. **输入文本**: 在左侧文本框中输入需要翻译的内容
3. **开始翻译**: 点击翻译按钮或使用快捷键
4. **查看结果**: 翻译结果将显示在右侧文本框中

### 高级功能

- **自动语言检测**: 源语言选择"自动检测"可智能识别输入语言
- **批量翻译**: 支持多段落文本的批量翻译
- **格式保持**: 自动保持原文的段落格式和结构
- **快捷操作**: 支持键盘快捷键和快速操作按钮

### 配置管理

点击右上角的设置按钮可以：

- 配置 API 密钥和接口地址
- 自定义翻译模型和参数
- 调整系统提示词
- 选择服务端/客户端模式

## 🛠️ 开发

### 项目结构

```
clear-trans/
├── public/                 # 静态资源
├── src/
│   ├── app/               # Next.js 应用路由
│   │   ├── api/           # API 路由
│   │   ├── globals.css    # 全局样式
│   │   ├── layout.tsx     # 根布局
│   │   └── page.tsx       # 主页面
│   ├── components/        # React 组件
│   │   ├── InputArea.tsx      # 输入区域组件
│   │   ├── OutputArea.tsx     # 输出区域组件
│   │   ├── LanguageSelector.tsx # 语言选择器
│   │   ├── ConfigSidebar.tsx    # 配置侧边栏
│   │   └── ...               # 其他组件
│   └── services/          # 服务层
│       └── translateService.ts # 翻译服务
├── env.example            # 环境变量示例
├── next.config.ts         # Next.js 配置
├── package.json           # 项目依赖
├── tailwind.config.js     # Tailwind CSS 配置
└── tsconfig.json          # TypeScript 配置
```

### 技术栈

- **前端框架**: Next.js 15.3.3
- **UI 库**: React 19.0.0
- **样式**: Tailwind CSS 4.0
- **语言**: TypeScript 5.0
- **状态管理**: React Hooks
- **HTTP 客户端**: Fetch API

### 开发指南

1. **代码规范**: 使用 ESLint 进行代码检查
2. **类型安全**: 全面使用 TypeScript 类型定义
3. **组件化**: 采用模块化组件设计
4. **响应式**: 支持各种屏幕尺寸

## 🤝 贡献

我们欢迎所有形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 贡献指南

- 提交代码前请确保通过所有测试
- 遵循现有的代码风格
- 为新功能添加相应的文档
- 保持提交信息清晰明确

## 📝 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

感谢以下优秀的开源项目：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用程序优先的 CSS 框架
- [React](https://reactjs.org/) - 用户界面库
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 类型扩展

## 📞 联系我们

- **项目主页**: [GitHub Repository](https://github.com/your-username/clear-trans)
- **问题反馈**: [GitHub Issues](https://github.com/your-username/clear-trans/issues)
- **功能建议**: [GitHub Discussions](https://github.com/your-username/clear-trans/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐️！**

Made with ❤️ by [Your Team Name]

</div>

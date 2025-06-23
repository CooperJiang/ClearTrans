<div align="center">

# 🌐 Clear Trans

**现代化 AI 翻译工具**

一个极简、高效的智能翻译平台，支持 OpenAI 和 Gemini 双引擎

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)

[🌐 在线体验](https://translate.mmmss.com/) | [🐛 问题反馈](https://github.com/CooperJiang/ClearTrans/issues)

</div>

## ✨ 核心特性

🎯 **双引擎驱动**  
支持 OpenAI 和 Google Gemini 模型，智能翻译 100+ 语言

🛠️ **灵活部署**  
服务端/客户端双模式，支持自定义 API 密钥和接口地址

🎨 **极简设计**  
现代化界面，响应式布局，专注用户体验

🔊 **语音合成**  
内置 TTS 功能，支持多种语音模型和风格控制

⚡ **实时翻译**  
流式输出，即时反馈，高效处理长文本

🔒 **隐私安全**  
本地存储配置，开源透明，数据安全可控

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm/yarn/pnpm

### 本地部署

```bash
# 克隆项目
git clone https://github.com/CooperJiang/ClearTrans.git
cd ClearTrans

# 安装依赖
npm install

# 配置环境变量
cp env.example .env.local

# 启动服务
npm run dev
```

访问 [http://localhost:8888](http://localhost:8888) 开始使用

### 环境配置

创建 `.env.local` 文件：

```bash
# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# Gemini 配置  
GEMINI_API_KEY=your_gemini_api_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# 应用端口
PORT=8888
```

## 🎛️ 使用指南

### 基础功能
1. **语言选择** - 支持自动检测源语言
2. **文本翻译** - 输入文本，一键翻译
3. **语音播放** - 点击播放按钮听取翻译结果
4. **历史记录** - 自动保存翻译历史

### 高级设置
- **模型切换** - OpenAI 与 Gemini 自由选择
- **参数调节** - 自定义温度、Token 限制等
- **语音配置** - 多种声音、语速、风格选项
- **部署模式** - 服务端或客户端模式切换

## 🔧 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **AI 服务**: OpenAI API + Google Gemini API

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 开源协议

基于 [MIT License](LICENSE) 开源协议

---

<div align="center">

**如果觉得有用，请给个 ⭐️ 支持一下！**

</div>

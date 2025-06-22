# 🌟 Gemini AI 集成指南

## 概述

Clear Trans 现已完整支持 Google Gemini AI 模型，为用户提供更多翻译选择。您可以在 OpenAI 和 Gemini 之间自由切换，享受不同AI模型的独特优势。

## 🆕 新增功能

### 1. 多AI提供商支持
- **OpenAI GPT 系列**：成熟稳定，功能全面
- **Google Gemini**：新一代AI，性能强劲

### 2. Gemini模型支持

#### 翻译模型（用于文本翻译）
- **Gemini 2.0 Flash**：最新版本，性能优异，适合日常翻译（推荐）
- **Gemini 2.0 Flash Lite**：轻量版本，速度更快，适合简单翻译
- **Gemini 2.5 Flash**：高性能版本，适合复杂文本翻译
- **Gemini 2.5 Pro**：专业版本，质量最高，适合专业翻译

#### TTS语音合成模型（用于语音朗读）
- **Gemini 2.5 Flash TTS**：速度快，性价比高
- **Gemini 2.5 Pro TTS**：质量更高，速度稍慢

### 3. Gemini TTS语音合成
- **30种独特语音**：涵盖明亮、坚定、活力、温和等多种风格
- **24种语言支持**：包括中文、英文、日文、韩文等
- **双格式输出**：支持MP3和WAV格式
- **风格控制**：通过自然语言控制语音风格和情感

## 🚀 使用方法

### 配置Gemini API

1. **获取API密钥**
   - 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
   - 创建新的API密钥
   - 复制密钥备用

2. **在Clear Trans中配置**
   - 点击右上角设置按钮
   - 选择"Google Gemini"作为AI服务提供商
   - 选择"客户端模式"
   - 输入您的Gemini API密钥
   - 选择合适的Gemini模型

### 环境变量配置（服务端模式）

在 `.env.local` 或 `.env` 文件中添加：

```bash
# Gemini API 配置
GEMINI_API_KEY=AIzaSy-your-gemini-api-key-here
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-2.5-flash-preview-tts

# 服务端Gemini配置（可选）
SERVER_GEMINI_API_KEY=AIzaSy-your-server-gemini-api-key-here
SERVER_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
SERVER_GEMINI_MODEL=gemini-2.5-flash-preview-tts
```

## 🎯 功能对比

| 功能 | OpenAI | Gemini |
|------|--------|--------|
| 翻译质量 | 优秀 | 优秀 |
| 响应速度 | 快 | 快 |
| 翻译模型数量 | 3种 | 4种 |
| 流式翻译 | ✅ | ✅ |
| TTS语音数量 | 19种 | 30种 |
| TTS模型数量 | 3种 | 2种 |
| 语音风格控制 | 指令式 | 自然语言 |
| 输出格式 | WAV | WAV/MP3 |
| 成本 | 按token计费 | 按token计费 |

## 🎵 Gemini TTS 语音类型

### 明亮系列
- **Zephyr**：明亮清新的声音
- **Autonoe**：明亮温和的声音

### 坚定系列
- **Kore**：坚定有力的声音
- **Orus**：坚定沉稳的声音
- **Alnilam**：坚定自信的声音

### 活力系列
- **Puck**：活泼生动的声音
- **Fenrir**：兴奋充满活力的声音
- **Laomedeia**：活泼愉快的声音
- **Sadachbia**：活泼开朗的声音

### 轻松系列
- **Aoede**：轻松自然的声音
- **Umbriel**：轻松舒缓的声音
- **Callirrhoe**：轻松优雅的声音
- **Zubenelgenubi**：随意轻松的声音

### 其他系列
- **清晰系列**：Erinome、Iapetus
- **信息系列**：Charon、Rasalgethi
- **年轻系列**：Leda
- **温和系列**：Enceladus、Achernar、Vindemiatrix、Sulafat
- **平滑系列**：Algieba、Despina
- **特色系列**：Algenib、Gacrux、Schedar、Achird、Sadaltager、Pulcherrima

## 🌍 支持的语言

- 中文(简体) - zh-CN
- 英语(美国) - en-US
- 日语(日本) - ja-JP
- 韩语(韩国) - ko-KR
- 阿拉伯语(埃及) - ar-EG
- 德语(德国) - de-DE
- 西班牙语(美国) - es-US
- 法语(法国) - fr-FR
- 印地语(印度) - hi-IN
- 印尼语(印度尼西亚) - id-ID
- 意大利语(意大利) - it-IT
- 葡萄牙语(巴西) - pt-BR
- 俄语(俄国) - ru-RU
- 荷兰语(荷兰) - nl-NL
- 波兰语(波兰) - pl-PL
- 泰语(泰国) - th-TH
- 土耳其语(土耳其) - tr-TR
- 越南语(越南) - vi-VN
- 罗马尼亚语(罗马尼亚) - ro-RO
- 乌克兰语(乌克兰) - uk-UA
- 孟加拉语(孟加拉) - bn-BD
- 马拉地语(印度) - mr-IN
- 泰米尔语(印度) - ta-IN
- 泰卢固语(印度) - te-IN

## 🎛️ 高级功能

### 风格控制示例

**情感控制**：
- 开心：`用开心、兴奋的语调说`
- 悲伤：`用悲伤、低沉的语调说`
- 严肃：`用严肃、正式的语调说`

**语速控制**：
- 慢速：`慢慢地说`
- 快速：`快速地说`
- 正常：`用正常的语速说`

**音调控制**：
- 高音调：`用高音调说`
- 低音调：`用低音调说`
- 变化音调：`用有变化的音调说`

### 批量处理

Gemini支持批量文本处理，适合：
- 大量文档翻译
- 多段落内容处理
- 批量语音合成

## 🔧 技术架构

### 新增组件

1. **GeminiAdapter** (`src/services/translation/geminiAdapter.ts`)
   - Gemini API 适配器
   - 支持普通翻译和流式翻译

2. **MultiProviderTranslateService** (`src/services/translation/multiProviderTranslateService.ts`)
   - 多提供商翻译服务
   - 统一的API接口

3. **Gemini常量配置** (`src/constants/gemini.ts`)
   - 模型列表
   - 语音配置
   - 语言支持

### API 路由扩展

- `/api/translate` - 支持provider参数选择AI提供商
- `/api/translate/stream` - 流式翻译支持多提供商

### 类型系统

新增类型定义：
- `AIProvider`：AI服务提供商类型
- `GeminiModel`：Gemini模型类型
- `GeminiTTSVoice`：Gemini语音类型
- `TranslationConfig`：联合类型配置

## 🚨 注意事项

1. **API密钥安全**
   - 密钥存储在本地，不会上传到服务器
   - 使用HTTPS传输，保证安全性

2. **费用控制**
   - Gemini按使用量计费，请合理使用
   - 建议设置API使用限制

3. **网络要求**
   - 需要稳定的网络连接
   - 某些地区可能需要代理访问

4. **模型限制**
   - 不同模型有不同的token限制
   - 流式翻译可能有延迟

## 🐛 故障排除

### 常见问题

1. **"Gemini API error: 403"**
   - 检查API密钥是否正确
   - 确认API密钥有足够权限

2. **"No candidates returned"**
   - 内容可能触发安全过滤
   - 尝试修改输入内容

3. **流式翻译中断**
   - 检查网络连接
   - 重新尝试翻译

### 联系支持

如遇到问题，请：
1. 检查浏览器控制台错误信息
2. 查看API密钥和网络配置
3. 通过GitHub Issues反馈问题

## 🎉 总结

Gemini集成为Clear Trans带来了：
- ✅ 更多AI模型选择
- ✅ 丰富的语音合成选项
- ✅ 先进的风格控制功能
- ✅ 高质量的翻译体验

立即体验Gemini的强大功能，享受新一代AI翻译服务！ 
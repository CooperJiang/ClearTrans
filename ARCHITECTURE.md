# Clear Trans 架构设计文档

## 项目概述

Clear Trans 是一个现代化的AI翻译平台，支持多种AI提供商（OpenAI、Gemini），集成了文本翻译和语音合成（TTS）功能。

## 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **后端**: Next.js API 路由
- **样式**: Tailwind CSS
- **状态管理**: React Hooks + Context API
- **存储**: 本地安全存储（SecureStorage）

## 核心架构

### 1. 多提供商适配器架构

#### 基础适配器接口 (`BaseTranslationAdapter`)
```typescript
abstract class BaseTranslationAdapter {
  abstract translate(request: TranslationRequest): Promise<TranslationResponse>;
  abstract *translateStream(request: TranslationRequest): AsyncGenerator<StreamChunk>;
}
```

#### OpenAI 适配器 (`OpenAIAdapter`)
- **模型类型**: 
  - 翻译模型: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
  - TTS模型: `tts-1`, `tts-1-hd`
- **特点**:
  - 原生支持真正的流式翻译
  - 标准的 OpenAI API 格式
  - 成熟的错误处理机制

#### Gemini 适配器系统

##### 1. 原生 Gemini 适配器 (`GeminiAdapter`)
- **模型类型**:
  - 翻译模型: `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-pro`
  - TTS模型: `gemini-2.5-flash-preview-tts`, `gemini-2.5-pro-preview-tts`
- **特点**:
  - 使用原生 Gemini API 格式
  - 智能流式检测和回退机制
  - 支持30种语音类型和24种语言

##### 2. Gemini OpenAI 兼容适配器 (`GeminiOpenAIAdapter`)
- **特点**:
  - 使用 Gemini 官方 OpenAI 兼容接口
  - 自动检测真正的流式 vs 伪流式
  - 智能分块算法，模拟流式效果

### 2. 流式翻译架构

#### 流式检测机制
```typescript
// 检测是否为真正的流式
const timeDiff = currentTime - lastChunkTime;
if (timeDiff > 50 && chunkIndex > 1) {
  isRealStream = true;
}
```

#### 智能回退策略
- **真正流式**: 直接输出每个数据块
- **伪流式**: 使用智能分块算法模拟流式效果
  - 按句子分块（标点符号分割）
  - 按词汇分块（备选方案）
  - 模拟网络延迟（80-120ms）

#### 前端流式处理
- 使用 `flushSync()` 强制立即DOM更新
- 使用 `requestAnimationFrame` 确保渲染
- 实时更新计数器和进度指示

### 3. 语音合成（TTS）架构

#### OpenAI TTS
- **模型**: `tts-1` (标准), `tts-1-hd` (高质量)
- **语音选项**: 6种语音（alloy, echo, fable, onyx, nova, shimmer）
- **格式**: MP3, WAV, FLAC, AAC
- **特点**: 简单直接，质量稳定

#### Gemini TTS
- **模型**: 
  - `gemini-2.5-flash-preview-tts` (速度优先)
  - `gemini-2.5-pro-preview-tts` (质量优先)
- **语音选项**: 30种语音，分为10个类别
  - 明亮 (Bright): Puck, Charon, Kore, Fenrir
  - 坚定 (Determined): Aoede, Titan, Rhea, Aura
  - 活力 (Energetic): Dione, Ganymede, Adrastea
  - 等等...
- **语言支持**: 24种语言
- **格式**: MP3, WAV
- **特点**: 语音选择丰富，支持自然语言风格控制

### 4. 配置管理架构

#### 安全存储 (`SecureStorage`)
- 客户端安全存储API密钥
- 支持多提供商配置
- 配置版本兼容性处理

#### 配置结构
```typescript
interface TranslateConfig {
  // 通用配置
  provider: 'openai' | 'gemini';
  useServerSide: boolean;
  streamTranslation: boolean;
  
  // OpenAI 配置
  apiKey: string;
  baseURL: string;
  model: string;
  
  // Gemini 配置
  geminiApiKey: string;
  geminiBaseURL: string;
  geminiModel: string;
  
  // TTS 配置
  ttsProvider: 'openai' | 'gemini';
  openaiTTSModel: string;
  openaiTTSVoice: string;
  geminiTTSModel: string;
  geminiTTSVoice: string;
}
```

### 5. API 路由架构

#### 翻译接口
- `/api/translate` - 普通翻译
- `/api/translate/stream` - 流式翻译

#### TTS 接口
- `/api/tts` - 语音合成

#### 统一处理流程
1. 参数验证和配置解析
2. 适配器工厂创建对应适配器
3. 调用适配器方法
4. 统一错误处理和响应格式

### 6. 语言处理架构

#### 语言映射系统
- 支持100+种语言
- 中文显示名 ↔ 英文API名映射
- 分类管理（常用、字母分类）

#### 智能语言检测
- 自动检测输入文本语言
- 智能推荐目标语言
- 支持语言自动切换

### 7. 错误处理和重试机制

#### 分层错误处理
1. **适配器层**: API错误、网络错误
2. **服务层**: 配置错误、参数错误
3. **UI层**: 用户友好的错误提示

#### 智能重试
- 网络错误自动重试
- 配置问题引导用户修复
- 服务商切换建议

## 性能优化

### 1. 流式翻译优化
- React 批处理绕过（`flushSync`）
- 智能滚动和用户交互检测
- 内存高效的流式处理

### 2. 缓存机制
- 翻译结果本地缓存
- 历史记录智能管理
- 配置持久化

### 3. 网络优化
- 并行API调用
- 请求去重
- 连接复用

## 扩展性设计

### 1. 新AI提供商接入
1. 实现 `BaseTranslationAdapter` 接口
2. 在 `AdapterFactory` 中注册
3. 添加配置项和UI组件

### 2. 新功能模块
- 插件化架构支持
- Hook系统扩展
- 主题和样式定制

## 安全考虑

### 1. API密钥安全
- 客户端加密存储
- 服务端代理模式
- 密钥泄露检测

### 2. 数据隐私
- 本地优先处理
- 可选的云端同步
- 用户数据控制

## 监控和日志

### 1. 性能监控
- 翻译延迟跟踪
- 流式性能分析
- 错误率统计

### 2. 用户体验监控
- 操作流程分析
- 功能使用统计
- 用户反馈收集

---

这个架构设计确保了 Clear Trans 的可扩展性、性能和用户体验，同时保持了代码的可维护性和模块化。 
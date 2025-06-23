export interface TranslationHistory {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
  model: string;
  duration: number;
  tokensUsed?: number;
}

// AI服务提供商类型
export type AIProvider = 'openai' | 'gemini';

// OpenAI模型类型
export type OpenAIModel = 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';

// Gemini模型类型
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-preview-04-17';

// 统一的模型类型
export type AIModel = OpenAIModel | GeminiModel;

// 基础配置接口
interface BaseTranslationConfig {
  provider: AIProvider;
  maxTokens: number;
  systemMessage: string;
  useServerSide: boolean;
  streamTranslation: boolean;
}

// OpenAI配置
export interface OpenAIConfig extends BaseTranslationConfig {
  provider: 'openai';
  apiKey: string;
  baseURL?: string;
  model: OpenAIModel;
}

// Gemini配置
export interface GeminiConfig extends BaseTranslationConfig {
  provider: 'gemini';
  geminiApiKey: string;
  geminiBaseURL?: string;
  geminiModel: GeminiModel;
}

// 联合类型配置
export type TranslationConfig = OpenAIConfig | GeminiConfig;

export interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface TranslationResponse {
  translatedText: string;
  success: boolean;
  error?: string;
  code?: string;
  duration?: number;
  tokensUsed?: number;
}

// 兼容性别名
export type TranslateConfig = TranslationConfig;
export type TranslateRequest = TranslationRequest;
export type TranslateResponse = TranslationResponse;
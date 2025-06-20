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

export interface TranslationConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens: number;
  systemMessage: string;
  useServerSide: boolean;
}

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
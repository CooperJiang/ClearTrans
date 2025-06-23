/**
 * 类型定义统一导出
 */

// 翻译相关类型
export type {
  TranslationHistory,
  TranslationConfig,
  TranslationRequest,
  TranslationResponse,
  OpenAIModel,
  GeminiModel,
  AIModel,
  OpenAIConfig,
  GeminiConfig,
  // 兼容性别名
  TranslateConfig,
  TranslateRequest,
  TranslateResponse,
} from './translation';

// 语言相关类型
export type {
  Language,
  LanguageCategory,
  LanguageCode,
  LanguageDetectionResult,
  LanguageSelectorProps,
  LanguageCardProps,
  LanguageContextType,
} from './language';

// 配置相关类型
export type {
  UserPreferences,
  AppSettings,
  ApiUsageStats,
  ConfigSidebarProps,
  ServerConfigDialogProps,
} from './config';

// TTS 相关类型
export type {
  TTSProvider,
  TTSVoice,
  TTSModel,
  TTSPlaybackState,
  TTSSettings,
  OpenAITTSVoice,
  GeminiTTSVoice,
  OpenAITTSModel,
  GeminiTTSModel,
  GeminiLanguage,
  TTSFormat,
  OpenAITTSSettings,
  GeminiTTSSettings,
} from './tts';

// 通用UI类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  autoClose?: boolean;
}

export interface SidebarProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

export type AIProvider = 'openai' | 'gemini'; 
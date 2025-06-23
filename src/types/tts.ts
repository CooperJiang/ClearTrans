/**
 * TTS (Text-to-Speech) 相关类型定义
 */

// AI服务提供商类型（从translation.ts导入）
export type TTSProvider = 'openai' | 'gemini';

// OpenAI TTS 支持的基础语音类型
export type TTSVoiceBasic = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// OpenAI TTS 支持的高级语音类型（仅限 gpt-4o-mini-tts 模型）
export type TTSVoiceAdvanced = 
  | 'coral' | 'verse' | 'ballad' | 'ash' | 'sage' | 'amuch' | 'aster' | 'brook' 
  | 'clover' | 'dan' | 'elan' | 'marilyn' | 'meadow' | 'jazz' | 'rio' 
  | 'megan-wetherall' | 'jade-hardy' | 'megan-wetherall-2025-03-07' | 'jade-hardy-2025-03-07';

// OpenAI所有支持的语音类型
export type OpenAITTSVoice = TTSVoiceBasic | TTSVoiceAdvanced;

// Gemini TTS 支持的语音类型（30种）
export type GeminiTTSVoice = 
  // 明亮系列
  | 'Zephyr' | 'Autonoe'
  // 坚定系列
  | 'Kore' | 'Orus' | 'Alnilam'
  // 活力系列
  | 'Puck' | 'Fenrir' | 'Laomedeia' | 'Sadachbia'
  // 轻松系列
  | 'Aoede' | 'Umbriel' | 'Callirrhoe' | 'Zubenelgenubi'
  // 清晰系列
  | 'Erinome' | 'Iapetus'
  // 信息系列
  | 'Charon' | 'Rasalgethi'
  // 年轻系列
  | 'Leda'
  // 温和系列
  | 'Enceladus' | 'Achernar' | 'Vindemiatrix' | 'Sulafat'
  // 平滑系列
  | 'Algieba' | 'Despina'
  // 特色系列
  | 'Algenib' | 'Gacrux' | 'Schedar' | 'Achird' | 'Sadaltager' | 'Pulcherrima';

// 所有支持的语音类型
export type TTSVoice = OpenAITTSVoice | GeminiTTSVoice;

// OpenAI TTS 支持的模型
export type OpenAITTSModel = 'tts-1' | 'tts-1-hd' | 'gpt-4o-mini-tts';

// Gemini TTS 支持的模型
export type GeminiTTSModel = 'gemini-2.5-flash-preview-tts' | 'gemini-2.5-pro-preview-tts';

// 所有TTS模型类型
export type TTSModel = OpenAITTSModel | GeminiTTSModel;

// Gemini支持的语言代码
export type GeminiLanguage = 
  | 'ar-EG' | 'de-DE' | 'en-US' | 'es-US' | 'fr-FR' | 'hi-IN' 
  | 'id-ID' | 'it-IT' | 'ja-JP' | 'ko-KR' | 'pt-BR' | 'ru-RU'
  | 'nl-NL' | 'pl-PL' | 'th-TH' | 'tr-TR' | 'vi-VN' | 'ro-RO'
  | 'uk-UA' | 'bn-BD' | 'mr-IN' | 'ta-IN' | 'te-IN' | 'zh-CN';

// TTS 输出格式
export type TTSFormat = 'wav' | 'mp3';

// 基础TTS配置
interface BaseTTSSettings {
  provider: TTSProvider;
  enabled: boolean;
  useServerSide: boolean;
  speed: number; // 0.25 - 4.0
}

// OpenAI TTS配置
export interface OpenAITTSSettings extends BaseTTSSettings {
  provider: 'openai';
  voice: OpenAITTSVoice;
  model: OpenAITTSModel;
  apiKey?: string;
  baseURL?: string;
  voiceInstructions?: string; // 仅适用于 gpt-4o-mini-tts 模型
}

// Gemini TTS配置
export interface GeminiTTSSettings extends BaseTTSSettings {
  provider: 'gemini';
  voice: GeminiTTSVoice;
  model: GeminiTTSModel;
  geminiApiKey?: string;
  geminiBaseURL?: string;
  language?: GeminiLanguage;
  format?: TTSFormat;
  stylePrompt?: string; // Gemini风格控制
}

// 联合类型TTS配置
export type TTSSettings = OpenAITTSSettings | GeminiTTSSettings;

// TTS 播放状态
export interface TTSPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentText?: string;
  error?: string;
  duration?: number;
}

// TTS 历史记录
export interface TTSHistory {
  id: string;
  text: string;
  provider: TTSProvider;
  voice: TTSVoice;
  model: TTSModel;
  speed: number;
  timestamp: number;
  duration: number;
  audioUrl?: string;
  voiceInstructions?: string;
  stylePrompt?: string;
  language?: string;
  format?: TTSFormat;
}

// 语音合成统计
export interface TTSUsageStats {
  totalRequests: number;
  totalCharacters: number;
  totalDuration: number;
  lastUsed?: number;
  favoriteVoice?: TTSVoice;
} 
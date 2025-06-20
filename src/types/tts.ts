/**
 * TTS (Text-to-Speech) 相关类型定义
 */

// OpenAI TTS 支持的基础语音类型
export type TTSVoiceBasic = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// OpenAI TTS 支持的高级语音类型（仅限 gpt-4o-mini-tts 模型）
export type TTSVoiceAdvanced = 
  | 'coral' | 'verse' | 'ballad' | 'ash' | 'sage' | 'amuch' | 'aster' | 'brook' 
  | 'clover' | 'dan' | 'elan' | 'marilyn' | 'meadow' | 'jazz' | 'rio' 
  | 'megan-wetherall' | 'jade-hardy' | 'megan-wetherall-2025-03-07' | 'jade-hardy-2025-03-07';

// 所有支持的语音类型
export type TTSVoice = TTSVoiceBasic | TTSVoiceAdvanced;

// OpenAI TTS 支持的模型
export type TTSModel = 'tts-1' | 'tts-1-hd' | 'gpt-4o-mini-tts';

// TTS 配置
export interface TTSSettings {
  voice: TTSVoice;
  model: TTSModel;
  speed: number; // 0.25 - 4.0
  enabled: boolean;
  useServerSide: boolean;
  apiKey?: string;
  baseURL?: string;
  voiceInstructions?: string; // 仅适用于 gpt-4o-mini-tts 模型
}

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
  voice: TTSVoice;
  model: TTSModel;
  speed: number;
  timestamp: number;
  duration: number;
  audioUrl?: string;
  voiceInstructions?: string;
}

// 语音合成统计
export interface TTSUsageStats {
  totalRequests: number;
  totalCharacters: number;
  totalDuration: number;
  lastUsed?: number;
  favoriteVoice?: TTSVoice;
} 
/**
 * Gemini AI 相关常量配置
 */

import type { GeminiModel } from '@/types/translation';
import type { GeminiTTSVoice, GeminiTTSModel, GeminiLanguage } from '@/types/tts';

// Gemini 翻译模型配置
export const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  {
    value: 'gemini-2.5-flash-preview-04-17',
    label: 'gemini-2.5-flash-preview-04-17',
    description: '最新版本，性能优异，适合日常翻译'
  },
  {
    value: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash (推荐)',
    description: '最新版本，性能优异，适合日常翻译'
  },
  {
    value: 'gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash Lite',
    description: '轻量版本，速度更快，适合简单翻译'
  },
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: '高性能版本，适合复杂文本翻译'
  },
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: '专业版本，质量最高，适合专业翻译'
  }
];

// Gemini TTS 模型配置
export const GEMINI_TTS_MODELS: { value: GeminiTTSModel; label: string; description: string }[] = [
  {
    value: 'gemini-2.5-flash-preview-tts',
    label: 'Flash TTS',
    description: '速度快，性价比高'
  },
  {
    value: 'gemini-2.5-pro-preview-tts',
    label: 'Pro TTS',
    description: '质量更高，速度稍慢'
  }
];

// Gemini TTS 语音配置（30种语音）
export const GEMINI_VOICES: { value: GeminiTTSVoice; label: string; category: string; description: string }[] = [
  // 明亮系列
  { value: 'Zephyr', label: 'Zephyr', category: '明亮', description: '明亮清新的声音' },
  { value: 'Autonoe', label: 'Autonoe', category: '明亮', description: '明亮温和的声音' },
  
  // 坚定系列
  { value: 'Kore', label: 'Kore', category: '坚定', description: '坚定有力的声音' },
  { value: 'Orus', label: 'Orus', category: '坚定', description: '坚定沉稳的声音' },
  { value: 'Alnilam', label: 'Alnilam', category: '坚定', description: '坚定自信的声音' },
  
  // 活力系列
  { value: 'Puck', label: 'Puck', category: '活力', description: '活泼生动的声音' },
  { value: 'Fenrir', label: 'Fenrir', category: '活力', description: '兴奋充满活力的声音' },
  { value: 'Laomedeia', label: 'Laomedeia', category: '活力', description: '活泼愉快的声音' },
  { value: 'Sadachbia', label: 'Sadachbia', category: '活力', description: '活泼开朗的声音' },
  
  // 轻松系列
  { value: 'Aoede', label: 'Aoede', category: '轻松', description: '轻松自然的声音' },
  { value: 'Umbriel', label: 'Umbriel', category: '轻松', description: '轻松舒缓的声音' },
  { value: 'Callirrhoe', label: 'Callirrhoe', category: '轻松', description: '轻松优雅的声音' },
  { value: 'Zubenelgenubi', label: 'Zubenelgenubi', category: '轻松', description: '随意轻松的声音' },
  
  // 清晰系列
  { value: 'Erinome', label: 'Erinome', category: '清晰', description: '清晰明了的声音' },
  { value: 'Iapetus', label: 'Iapetus', category: '清晰', description: '清晰准确的声音' },
  
  // 信息系列
  { value: 'Charon', label: 'Charon', category: '信息', description: '信息丰富的声音' },
  { value: 'Rasalgethi', label: 'Rasalgethi', category: '信息', description: '信息准确的声音' },
  
  // 年轻系列
  { value: 'Leda', label: 'Leda', category: '年轻', description: '年轻活力的声音' },
  
  // 温和系列
  { value: 'Enceladus', label: 'Enceladus', category: '温和', description: '轻柔温和的声音' },
  { value: 'Achernar', label: 'Achernar', category: '温和', description: '柔和亲切的声音' },
  { value: 'Vindemiatrix', label: 'Vindemiatrix', category: '温和', description: '温和友善的声音' },
  { value: 'Sulafat', label: 'Sulafat', category: '温和', description: '温暖和谐的声音' },
  
  // 平滑系列
  { value: 'Algieba', label: 'Algieba', category: '平滑', description: '平滑流畅的声音' },
  { value: 'Despina', label: 'Despina', category: '平滑', description: '平滑优美的声音' },
  
  // 特色系列
  { value: 'Algenib', label: 'Algenib', category: '特色', description: '沙哑独特的声音' },
  { value: 'Gacrux', label: 'Gacrux', category: '特色', description: '成熟稳重的声音' },
  { value: 'Schedar', label: 'Schedar', category: '特色', description: '平稳可靠的声音' },
  { value: 'Achird', label: 'Achird', category: '特色', description: '友好亲和的声音' },
  { value: 'Sadaltager', label: 'Sadaltager', category: '特色', description: '博学智慧的声音' },
  { value: 'Pulcherrima', label: 'Pulcherrima', category: '特色', description: '前卫时尚的声音' }
];

// Gemini 支持的语言配置
export const GEMINI_LANGUAGES: { value: GeminiLanguage; label: string; nativeName: string }[] = [
  { value: 'zh-CN', label: '中文(简体)', nativeName: '中文' },
  { value: 'en-US', label: '英语(美国)', nativeName: 'English' },
  { value: 'ja-JP', label: '日语(日本)', nativeName: '日本語' },
  { value: 'ko-KR', label: '韩语(韩国)', nativeName: '한국어' },
  { value: 'ar-EG', label: '阿拉伯语(埃及)', nativeName: 'العربية' },
  { value: 'de-DE', label: '德语(德国)', nativeName: 'Deutsch' },
  { value: 'es-US', label: '西班牙语(美国)', nativeName: 'Español' },
  { value: 'fr-FR', label: '法语(法国)', nativeName: 'Français' },
  { value: 'hi-IN', label: '印地语(印度)', nativeName: 'हिन्दी' },
  { value: 'id-ID', label: '印尼语(印度尼西亚)', nativeName: 'Bahasa Indonesia' },
  { value: 'it-IT', label: '意大利语(意大利)', nativeName: 'Italiano' },
  { value: 'pt-BR', label: '葡萄牙语(巴西)', nativeName: 'Português' },
  { value: 'ru-RU', label: '俄语(俄国)', nativeName: 'Русский' },
  { value: 'nl-NL', label: '荷兰语(荷兰)', nativeName: 'Nederlands' },
  { value: 'pl-PL', label: '波兰语(波兰)', nativeName: 'Polski' },
  { value: 'th-TH', label: '泰语(泰国)', nativeName: 'ไทย' },
  { value: 'tr-TR', label: '土耳其语(土耳其)', nativeName: 'Türkçe' },
  { value: 'vi-VN', label: '越南语(越南)', nativeName: 'Tiếng Việt' },
  { value: 'ro-RO', label: '罗马尼亚语(罗马尼亚)', nativeName: 'Română' },
  { value: 'uk-UA', label: '乌克兰语(乌克兰)', nativeName: 'Українська' },
  { value: 'bn-BD', label: '孟加拉语(孟加拉)', nativeName: 'বাংলা' },
  { value: 'mr-IN', label: '马拉地语(印度)', nativeName: 'मराठी' },
  { value: 'ta-IN', label: '泰米尔语(印度)', nativeName: 'தமிழ்' },
  { value: 'te-IN', label: '泰卢固语(印度)', nativeName: 'తెలుగు' }
];

// 语音类别配置
export const VOICE_CATEGORIES = [
  { value: '明亮', label: '明亮', description: '清新亮丽的声音风格' },
  { value: '坚定', label: '坚定', description: '有力稳重的声音风格' },
  { value: '活力', label: '活力', description: '充满活力的声音风格' },
  { value: '轻松', label: '轻松', description: '轻松自然的声音风格' },
  { value: '清晰', label: '清晰', description: '清晰准确的声音风格' },
  { value: '信息', label: '信息', description: '信息丰富的声音风格' },
  { value: '年轻', label: '年轻', description: '年轻活力的声音风格' },
  { value: '温和', label: '温和', description: '温和亲切的声音风格' },
  { value: '平滑', label: '平滑', description: '平滑流畅的声音风格' },
  { value: '特色', label: '特色', description: '独特个性的声音风格' }
];

// TTS 输出格式配置
export const TTS_FORMATS = [
  { value: 'wav' as const, label: 'WAV', description: '无损音质，文件较大' },
  { value: 'mp3' as const, label: 'MP3', description: '压缩格式，文件较小' }
];

// 默认配置
export const DEFAULT_GEMINI_CONFIG = {
  provider: 'gemini' as const,
  geminiApiKey: '',
  geminiBaseURL: 'https://generativelanguage.googleapis.com/v1beta',
  geminiModel: 'gemini-2.0-flash' as GeminiModel,
  maxTokens: 4096,
  systemMessage: 'You are a professional translator.',
  useServerSide: true,
  streamTranslation: false
};

// 默认Gemini TTS配置
export const DEFAULT_GEMINI_TTS_CONFIG = {
  provider: 'gemini' as const,
  voice: 'Kore' as GeminiTTSVoice,
  model: 'gemini-2.5-flash-preview-tts' as GeminiTTSModel,
  speed: 1.0,
  enabled: true,
  useServerSide: true,
  language: 'zh-CN' as GeminiLanguage,
  format: 'mp3' as const,
  stylePrompt: ''
}; 
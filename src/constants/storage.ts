// 存储键名常量
export const STORAGE_KEYS = {
  // 翻译配置
  TRANSLATION_CONFIG: 'translationConfig',
  
  // 语言选择
  SOURCE_LANGUAGE: 'sourceLanguage',
  TARGET_LANGUAGE: 'targetLanguage',
  LANGUAGE_DISPLAY_MODE: 'languageDisplayMode',
  
  // 翻译历史
  TRANSLATION_HISTORY: 'translationHistory',
  
  // 用户偏好
  USER_PREFERENCES: 'userPreferences',
  
  // API统计
  API_USAGE_STATS: 'apiUsageStats',
  
  // 应用设置
  APP_SETTINGS: 'appSettings',
  
  // TTS 设置
  TTS_SETTINGS: 'ttsSettings',
  TTS_HISTORY: 'ttsHistory',
} as const;

// 存储过期时间（分钟）
export const STORAGE_EXPIRY = {
  // 永不过期
  NEVER: undefined,
  
  // 短期缓存（1小时）
  SHORT_TERM: 60,
  
  // 中期缓存（1天）
  MEDIUM_TERM: 24 * 60,
  
  // 长期缓存（1周）
  LONG_TERM: 7 * 24 * 60,
  
  // API缓存（30分钟）
  API_CACHE: 30,
} as const;

// 存储大小限制
export const STORAGE_LIMITS = {
  // 单条翻译历史最大长度
  MAX_TRANSLATION_TEXT_LENGTH: 10000,
  
  // 翻译历史最大条数
  MAX_HISTORY_ITEMS: 100,
  
  // 缓存最大条数
  MAX_CACHE_ITEMS: 50,
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  translation: {
    apiKey: '',
    baseURL: '',
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    systemMessage: `You are a professional {{to}} native translator who needs to fluently translate text into {{to}}.

## Translation Rules
1. Output only the translated content, without explanations or additional content
2. The returned translation must maintain exactly the same number of paragraphs and format as the original text
3. If the text contains HTML tags, consider where the tags should be placed in the translation while maintaining fluency
4. For content that should not be translated (such as proper nouns, code, etc.), keep the original text
5. If input contains %%, use %% in your output, if input has no %%, don't use %% in your output

## OUTPUT FORMAT:
- **Single paragraph input** → Output translation directly (no separators, no extra text)
- **Multi-paragraph input** → Use line break as paragraph separator between translations`,
    useServerSide: true,
    streamTranslation: false,
  },
  
  userPreferences: {
    theme: 'light' as const,
    language: 'zh-CN' as const,
    autoSave: true,
    showHistory: true,
    enableShortcuts: true,
  },
  
  appSettings: {
    maxHistoryItems: 100,
    enableAnalytics: false,
    autoTranslate: false,
    soundEnabled: true,
  },
} as const; 
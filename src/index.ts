/**
 * Clear Trans 核心模块统一导出
 * 为开源项目提供清晰的API接口
 */

// 组件
export * from './components';

// Hooks（排除与组件重复的导出）
export { useTranslation } from './hooks';
export type { UseTranslationReturn } from './hooks';

// 服务
export * from './services/translation';
export * from './services/storage';
export * from './services/tts';

// 类型定义
export * from './types';

// 常量
export * from './constants';

// 工具函数（具体导出避免冲突）
export {
  truncateText,
  countCharacters,
  countWords,
  isEmpty,
  cleanText,
  splitTextIntoChunks,
  detectTextLanguage,
  detectLanguage,
  suggestTargetLanguage,
  detectAndSuggestTarget,
  validateApiKey,
  validateUrl,
  validateTextLength,
  validateLanguageCode,
  validateNumberRange,
  validateTranslationConfig,
  formatDate,
  formatFileSize,
  formatCost,
  debounce,
  throttle
} from './utils';

// 配置
export * from './config/env'; 
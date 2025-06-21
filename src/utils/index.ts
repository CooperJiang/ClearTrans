/**
 * 工具函数统一导出
 */

// 文本处理工具
export {
  truncateText,
  countCharacters,
  countWords,
  isEmpty,
  cleanText,
  splitTextIntoChunks,
  detectTextLanguage,
} from './helpers/textUtils';

// 语言检测工具
export {
  detectLanguage,
  suggestTargetLanguage,
  detectAndSuggestTarget,
  type LanguageDetectionResult,
} from './languageDetector';

// 验证器工具
export {
  validateApiKey,
  validateUrl,
  validateTextLength,
  validateLanguageCode,
  validateNumberRange,
  validateTranslationConfig,
} from './validators';

// 格式化工具
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`;
};

// 防抖函数
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}; 
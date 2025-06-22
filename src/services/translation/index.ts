/**
 * 翻译服务统一导出
 */

// 导出多提供商翻译服务
export {
  initTranslateService,
  getTranslateService,
  translateText,
  translateTextStream,
  DEFAULT_SYSTEM_MESSAGE
} from './multiProviderTranslateService';

// 导出类型
export type { TranslateConfig, TranslateRequest, TranslateResponse } from '@/types'; 
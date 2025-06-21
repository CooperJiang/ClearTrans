/**
 * 翻译服务统一导出
 */

export {
  initTranslateService,
  getTranslateService,
  translateText,
  translateTextStream,
  DEFAULT_SYSTEM_MESSAGE,
} from './translateService';

// 导出类型
export type { TranslateConfig, TranslateRequest, TranslateResponse } from '@/types'; 
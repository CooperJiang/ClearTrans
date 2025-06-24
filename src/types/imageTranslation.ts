/**
 * 图片翻译相关类型定义
 */

export interface ImageTranslationHistory {
  id: string;
  originalImageUrl: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
  model: string;
  duration: number;
  imageSize: {
    width: number;
    height: number;
  };
  fileSize: number;
  fileName: string;
}

export interface ImageTranslationResult {
  translatedText: string;
  duration: number;
}

export interface ImageUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface ImageTranslationState {
  isTranslating: boolean;
  currentImage: ImagePreview | null;
  result: ImageTranslationResult | null;
  error: string | null;
  progress: ImageUploadProgress | null;
}
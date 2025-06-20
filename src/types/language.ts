/**
 * 语言相关类型定义
 */

export interface Language {
  code: string;
  name: string;
  flag: string;
  category: string;
  englishName: string;
}

export interface LanguageCategory {
  [key: string]: Language[];
}

export type LanguageCode = string;

export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

export interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageSelect: (language: Language) => void;
  excludeAuto?: boolean;
  disabled?: boolean;
}

export interface LanguageCardProps {
  selectedLanguage: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface LanguageContextType {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  getTargetLanguageName: () => string;
  getSourceLanguageName: () => string;
  swapLanguages: () => void;
  isHydrated: boolean;
} 
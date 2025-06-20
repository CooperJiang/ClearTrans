/**
 * 语言选择相关的自定义Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { SecureStorage, STORAGE_KEYS } from '../services/storage';
import { getAdvancedLanguageName } from '../constants/languages';

export interface UseLanguageReturn {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  getTargetLanguageName: () => string;
  getSourceLanguageName: () => string;
  swapLanguages: () => void;
  isHydrated: boolean;
}

export const useLanguage = (): UseLanguageReturn => {
  const [sourceLanguage, setSourceLanguageState] = useState('auto');
  const [targetLanguage, setTargetLanguageState] = useState('zh');
  const [isHydrated, setIsHydrated] = useState(false);

  // 客户端水合后从存储中恢复状态
  useEffect(() => {
    const savedSourceLanguage = SecureStorage.get(STORAGE_KEYS.SOURCE_LANGUAGE, 'auto') || 'auto';
    const savedTargetLanguage = SecureStorage.get(STORAGE_KEYS.TARGET_LANGUAGE, 'zh') || 'zh';
    
    setSourceLanguageState(savedSourceLanguage);
    setTargetLanguageState(savedTargetLanguage);
    setIsHydrated(true);
  }, []);

  const setSourceLanguage = useCallback((lang: string) => {
    setSourceLanguageState(lang);
    SecureStorage.set(STORAGE_KEYS.SOURCE_LANGUAGE, lang);
  }, []);

  const setTargetLanguage = useCallback((lang: string) => {
    setTargetLanguageState(lang);
    SecureStorage.set(STORAGE_KEYS.TARGET_LANGUAGE, lang);
  }, []);

  const getTargetLanguageName = useCallback(() => {
    return getAdvancedLanguageName(targetLanguage || 'zh');
  }, [targetLanguage]);

  const getSourceLanguageName = useCallback(() => {
    return getAdvancedLanguageName(sourceLanguage || 'auto');
  }, [sourceLanguage]);

  const swapLanguages = useCallback(() => {
    if (sourceLanguage !== 'auto') {
      // 正常交换：源语言和目标语言互换
      const tempSource = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(tempSource);
    } else {
      // 如果源语言是自动检测，则：
      // 1. 将当前目标语言设为新的源语言
      // 2. 将中文设为新的目标语言（如果当前目标语言已经是中文，则设为英文）
      const newSourceLanguage = targetLanguage;
      const newTargetLanguage = targetLanguage === 'zh' ? 'en' : 'zh';
      setSourceLanguage(newSourceLanguage);
      setTargetLanguage(newTargetLanguage);
    }
  }, [sourceLanguage, targetLanguage, setSourceLanguage, setTargetLanguage]);

  return {
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    getTargetLanguageName,
    getSourceLanguageName,
    swapLanguages,
    isHydrated,
  };
}; 
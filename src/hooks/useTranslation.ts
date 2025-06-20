/**
 * 翻译相关的自定义Hook
 */

import { useState, useCallback } from 'react';
import { translateText } from '../services/translation';
import { TranslationHistory } from '../types';
import { SecureStorage, STORAGE_KEYS } from '../services/storage';

export interface UseTranslationReturn {
  isTranslating: boolean;
  translate: (text: string, targetLanguage?: string, sourceLanguage?: string) => Promise<void>;
  translationResult: { text: string; duration: number } | null;
  error: string | null;
  history: TranslationHistory[];
  clearHistory: () => void;
}

export const useTranslation = (): UseTranslationReturn => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{ text: string; duration: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationHistory[]>(() => {
    return SecureStorage.get(STORAGE_KEYS.TRANSLATION_HISTORY, []) || [];
  });

  const saveToHistory = useCallback((item: TranslationHistory) => {
    setHistory(prev => {
      const newHistory = [item, ...prev.slice(0, 99)]; // 保留最近100条
      SecureStorage.set(STORAGE_KEYS.TRANSLATION_HISTORY, newHistory);
      return newHistory;
    });
  }, []);

  const translate = useCallback(async (text: string, targetLanguage?: string, sourceLanguage?: string) => {
    if (!text.trim()) {
      setError('请输入要翻译的文本');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setTranslationResult(null);

    const startTime = Date.now();

    try {
      const result = await translateText(text, targetLanguage, sourceLanguage);
      const duration = Date.now() - startTime;

      if (result.success && result.data) {
        const translationData = { text: result.data, duration };
        setTranslationResult(translationData);

        // 保存到历史记录
        const historyItem: TranslationHistory = {
          id: Date.now().toString(),
          sourceText: text,
          translatedText: result.data,
          sourceLanguage: sourceLanguage || 'auto',
          targetLanguage: targetLanguage || 'zh',
          timestamp: Date.now(),
          model: 'gpt-4o-mini', // 这里可以从配置中获取
          duration,
        };
        saveToHistory(historyItem);
      } else {
        setError(result.error || '翻译失败');
      }
    } catch {
      setError('翻译过程中发生错误');
    } finally {
      setIsTranslating(false);
    }
  }, [saveToHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    SecureStorage.remove(STORAGE_KEYS.TRANSLATION_HISTORY);
  }, []);

  return {
    isTranslating,
    translate,
    translationResult,
    error,
    history,
    clearHistory,
  };
}; 
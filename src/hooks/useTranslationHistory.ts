/**
 * 翻译历史管理Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { TranslationHistory } from '@/types';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage';
import { STORAGE_LIMITS } from '@/constants/storage';
import { getAdvancedLanguageName } from '@/constants/languages';

export interface UseTranslationHistoryReturn {
  history: TranslationHistory[];
  isLoading: boolean;
  addToHistory: (item: Omit<TranslationHistory, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  getHistoryStats: () => {
    totalCount: number;
    totalCharacters: number;
    todayCount: number;
    averageDuration: number;
  };
  searchHistory: (query: string) => TranslationHistory[];
  getHistoryByLanguagePair: (sourceLanguage: string, targetLanguage: string) => TranslationHistory[];
}

export const useTranslationHistory = (): UseTranslationHistoryReturn => {
  const [history, setHistory] = useState<TranslationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：从存储中加载历史记录
  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedHistory = SecureStorage.get<TranslationHistory[]>(STORAGE_KEYS.TRANSLATION_HISTORY, []) || [];
        // 按时间戳降序排序（最新的在前）
        const sortedHistory = savedHistory.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedHistory);
      } catch (error) {
        console.error('Failed to load translation history:', error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // 保存历史记录到存储
  const saveHistoryToStorage = useCallback((newHistory: TranslationHistory[]) => {
    try {
      // 限制历史记录数量
      const limitedHistory = newHistory.slice(0, STORAGE_LIMITS.MAX_HISTORY_ITEMS);
      
      // 添加调试信息
      console.log('Saving translation history:', {
        count: limitedHistory.length,
        latest: limitedHistory[0]?.sourceText?.substring(0, 50) + '...'
      });
      
      SecureStorage.set(STORAGE_KEYS.TRANSLATION_HISTORY, limitedHistory);
      return limitedHistory;
    } catch (error) {
      console.error('Failed to save translation history:', error);
      // 如果存储失败，至少保持内存中的状态
      return newHistory;
    }
  }, []);

  // 添加到历史记录
  const addToHistory = useCallback((item: Omit<TranslationHistory, 'id' | 'timestamp'>) => {
    try {
      // 验证必要字段
      if (!item.sourceText || !item.translatedText) {
        console.warn('Skipping empty translation record');
        return;
      }

      // 验证文本长度
      if (item.sourceText.length > STORAGE_LIMITS.MAX_TRANSLATION_TEXT_LENGTH ||
          item.translatedText.length > STORAGE_LIMITS.MAX_TRANSLATION_TEXT_LENGTH) {
        console.warn('Translation text too long, not saving to history');
        return;
      }

      const newItem: TranslationHistory = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      console.log('Adding translation to history:', {
        sourceText: newItem.sourceText.substring(0, 50) + '...',
        translatedText: newItem.translatedText.substring(0, 50) + '...',
        languages: `${newItem.sourceLanguage} -> ${newItem.targetLanguage}`
      });

      setHistory(prev => {
        const newHistory = [newItem, ...prev];
        saveHistoryToStorage(newHistory);
        return newHistory;
      });
    } catch (error) {
      console.error('Failed to add translation to history:', error);
    }
  }, [saveHistoryToStorage]);

  // 从历史记录中删除
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      saveHistoryToStorage(newHistory);
      return newHistory;
    });
  }, [saveHistoryToStorage]);

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setHistory([]);
    SecureStorage.remove(STORAGE_KEYS.TRANSLATION_HISTORY);
  }, []);

  // 获取历史统计信息
  const getHistoryStats = useCallback(() => {
    const totalCount = history.length;
    const totalCharacters = history.reduce((sum, item) => sum + item.sourceText.length + item.translatedText.length, 0);
    
    // 今天的记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    const todayCount = history.filter(item => item.timestamp >= todayTimestamp).length;
    
    // 平均翻译时间
    const totalDuration = history.reduce((sum, item) => sum + item.duration, 0);
    const averageDuration = totalCount > 0 ? totalDuration / totalCount : 0;

    return {
      totalCount,
      totalCharacters,
      todayCount,
      averageDuration,
    };
  }, [history]);

  // 搜索历史记录
  const searchHistory = useCallback((query: string): TranslationHistory[] => {
    if (!query.trim()) return history;
    
    const lowerQuery = query.toLowerCase();
    return history.filter(item => 
      item.sourceText.toLowerCase().includes(lowerQuery) ||
      item.translatedText.toLowerCase().includes(lowerQuery) ||
      getAdvancedLanguageName(item.sourceLanguage).toLowerCase().includes(lowerQuery) ||
      getAdvancedLanguageName(item.targetLanguage).toLowerCase().includes(lowerQuery)
    );
  }, [history]);

  // 根据语言对筛选历史记录
  const getHistoryByLanguagePair = useCallback((sourceLanguage: string, targetLanguage: string): TranslationHistory[] => {
    return history.filter(item => 
      item.sourceLanguage === sourceLanguage && item.targetLanguage === targetLanguage
    );
  }, [history]);

  return {
    history,
    isLoading,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryStats,
    searchHistory,
    getHistoryByLanguagePair,
  };
}; 
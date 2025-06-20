'use client';

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import AdvancedLanguageSelector, { allLanguages } from './AdvancedLanguageSelector';
import { getAdvancedLanguageName } from '@/constants/languages';
import LanguageCard from './LanguageCard';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage';

// 语言代码到语言名称的映射
export const getLanguageName = (code: string): string => {
  return getAdvancedLanguageName(code);
};

// 创建语言选择器上下文
interface LanguageContextType {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  getTargetLanguageName: () => string;
  isHydrated: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('zh');
  const [isHydrated, setIsHydrated] = useState(false);

  // 客户端水合后从存储中恢复状态
  useEffect(() => {
    const savedSourceLanguage = SecureStorage.get(STORAGE_KEYS.SOURCE_LANGUAGE, 'auto') || 'auto';
    const savedTargetLanguage = SecureStorage.get(STORAGE_KEYS.TARGET_LANGUAGE, 'zh') || 'zh';
    
    setSourceLanguage(savedSourceLanguage);
    setTargetLanguage(savedTargetLanguage);
    setIsHydrated(true);
  }, []);

  const getTargetLanguageName = () => getLanguageName(targetLanguage || 'zh');

  // 保存源语言
  const handleSetSourceLanguage = (lang: string) => {
    setSourceLanguage(lang);
    SecureStorage.set(STORAGE_KEYS.SOURCE_LANGUAGE, lang);
  };

  // 保存目标语言
  const handleSetTargetLanguage = (lang: string) => {
    setTargetLanguage(lang);
    SecureStorage.set(STORAGE_KEYS.TARGET_LANGUAGE, lang);
  };

  return (
    <LanguageContext.Provider value={{
      sourceLanguage,
      targetLanguage,
      setSourceLanguage: handleSetSourceLanguage,
      setTargetLanguage: handleSetTargetLanguage,
      getTargetLanguageName,
      isHydrated
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

interface LanguageSelectorProps {
  onLanguageChange?: (sourceLanguage: string, targetLanguage: string) => void;
}

export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { 
    sourceLanguage, 
    targetLanguage, 
    setSourceLanguage, 
    setTargetLanguage,
    isHydrated
  } = useContext(LanguageContext)!;

  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const sourceButtonRef = useRef<HTMLDivElement>(null);
  const targetButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onLanguageChange && isHydrated) {
      onLanguageChange(sourceLanguage, targetLanguage);
    }
  }, [sourceLanguage, targetLanguage, onLanguageChange, isHydrated]);

  const handleSwapLanguages = () => {
    if (sourceLanguage !== 'auto') {
      // 检查是否为相同语言
      if (sourceLanguage === targetLanguage) {
        // 相同语言时，优先设置为中文和英文的组合
        if (sourceLanguage === 'zh') {
          // 如果当前都是中文，则设置为中文->英文
          setTargetLanguage('en');
        } else if (sourceLanguage === 'en') {
          // 如果当前都是英文，则设置为英文->中文
          setTargetLanguage('zh');
        } else {
          // 其他语言，设置为该语言->中文
          setTargetLanguage('zh');
        }
      } else {
        // 正常交换：源语言和目标语言互换
        const tempSource = sourceLanguage;
        setSourceLanguage(targetLanguage);
        setTargetLanguage(tempSource);
      }
    } else {
      // 如果源语言是自动检测，则：
      // 1. 将当前目标语言设为新的源语言
      // 2. 将中文设为新的目标语言（如果当前目标语言已经是中文，则设为英文）
      const newSourceLanguage = targetLanguage;
      const newTargetLanguage = targetLanguage === 'zh' ? 'en' : 'zh';
      setSourceLanguage(newSourceLanguage);
      setTargetLanguage(newTargetLanguage);
    }
  };

  const handleSourceLanguageSelect = (language: typeof allLanguages[0]) => {
    setSourceLanguage(language.code);
  };

  const handleTargetLanguageSelect = (language: typeof allLanguages[0]) => {
    setTargetLanguage(language.code);
  };

  // 在水合完成前显示骨架屏，避免闪烁
  if (!isHydrated) {
    return (
      <div className="relative flex items-center p-4 border-b border-gray-100">
        {/* 左侧源语言骨架屏 */}
        <div className="flex items-center space-x-4 relative">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg border border-gray-200 animate-pulse">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="flex flex-col gap-1">
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
              <div className="w-12 h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* 中间交换按钮骨架屏 */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 border border-gray-200 rounded-lg animate-pulse z-10"></div>
        
        {/* 右侧目标语言骨架屏 */}
        <div className="flex items-center space-x-4 relative ml-auto">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg border border-gray-200 animate-pulse">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="flex flex-col gap-1">
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
              <div className="w-12 h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex items-center p-4 border-b border-gray-100">
        {/* 左侧源语言 */}
        <div className="flex items-center space-x-4 relative" ref={sourceButtonRef}>
          <LanguageCard
            selectedLanguage={sourceLanguage}
            onClick={() => setShowSourceSelector(true)}
          />
          {/* 源语言选择器 */}
          <AdvancedLanguageSelector
            isOpen={showSourceSelector}
            onClose={() => setShowSourceSelector(false)}
            onSelect={handleSourceLanguageSelect}
            selectedLanguage={sourceLanguage}
            excludeAuto={false}
            triggerRef={sourceButtonRef}
          />
        </div>
        
        {/* 中间交换按钮 - 绝对定位始终居中 */}
        <button 
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-500 border border-gray-200 rounded-lg p-2 transition-all duration-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md z-10"
          onClick={handleSwapLanguages}
          title={
            sourceLanguage === 'auto' 
              ? '切换到目标语言并设置为中文翻译' 
              : sourceLanguage === targetLanguage
                ? '相同语言时优化为常用语言组合'
                : '交换源语言和目标语言'
          }
        >
          <i className="fas fa-exchange-alt text-xs"></i>
        </button>
        
        {/* 右侧目标语言 */}
        <div className="flex items-center space-x-4 relative ml-auto" ref={targetButtonRef}>
          <LanguageCard
            selectedLanguage={targetLanguage}
            onClick={() => setShowTargetSelector(true)}
          />
          {/* 目标语言选择器 */}
          <AdvancedLanguageSelector
            isOpen={showTargetSelector}
            onClose={() => setShowTargetSelector(false)}
            onSelect={handleTargetLanguageSelect}
            selectedLanguage={targetLanguage}
            excludeAuto={true}
            triggerRef={targetButtonRef}
            position="right"
          />
        </div>
      </div>
    </>
  );
} 
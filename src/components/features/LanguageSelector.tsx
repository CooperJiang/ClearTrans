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
    // 简化逻辑，直接设置默认值并完成水合
    setSourceLanguage('auto');
    setTargetLanguage('zh');
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
      <div className="relative flex items-center justify-center p-4 bg-gray-50/50">
        {/* 骨架屏内容 */}
        <div className="flex items-center absolute left-6">
          <div className="animate-pulse flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-md w-[120px]">
            <div className="w-5 h-5 bg-black/10 rounded-full"></div>
            <div className="h-4 bg-black/10 rounded w-16"></div>
          </div>
        </div>
        <div className="animate-pulse bg-white border border-gray-200/80 rounded-lg w-9 h-9"></div>
        <div className="flex items-center absolute right-6">
          <div className="animate-pulse flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-md w-[120px]">
            <div className="w-5 h-5 bg-black/10 rounded-full"></div>
            <div className="h-4 bg-black/10 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex items-center justify-center p-4 bg-gray-50/50">
        <div className="flex items-center absolute left-6" ref={sourceButtonRef}>
          <LanguageCard
            selectedLanguage={sourceLanguage}
            onClick={() => setShowSourceSelector(true)}
          />
          <AdvancedLanguageSelector
            isOpen={showSourceSelector}
            onClose={() => setShowSourceSelector(false)}
            onSelect={handleSourceLanguageSelect}
            selectedLanguage={sourceLanguage}
            excludeAuto={false}
            triggerRef={sourceButtonRef}
          />
        </div>
        
        <button 
          className="bg-white hover:bg-gray-100 text-gray-500 hover:text-blue-600 border border-gray-200/80 hover:border-gray-300 rounded-lg p-2 transition-all duration-200 hover:shadow-sm hover:scale-105 z-10 group"
          onClick={handleSwapLanguages}
          title="交换源语言和目标语言"
        >
          <svg 
            className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
            />
          </svg>
        </button>
        
        <div className="flex items-center absolute right-6" ref={targetButtonRef}>
          <LanguageCard
            selectedLanguage={targetLanguage}
            onClick={() => setShowTargetSelector(true)}
          />
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
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import CustomSelect from './CustomSelect';

const languages = [
  { code: 'auto', name: '自动检测', flag: '🌍' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

const targetLanguages = languages.filter(lang => lang.code !== 'auto');

// 语言代码到语言名称的映射
export const getLanguageName = (code: string): string => {
  const language = languages.find(lang => lang.code === code);
  return language ? language.name : code;
};

// 创建语言选择器上下文
interface LanguageContextType {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  getTargetLanguageName: () => string;
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

  const getTargetLanguageName = () => getLanguageName(targetLanguage);

  return (
    <LanguageContext.Provider value={{
      sourceLanguage,
      targetLanguage,
      setSourceLanguage,
      setTargetLanguage,
      getTargetLanguageName
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
    setTargetLanguage 
  } = useLanguage();

  useEffect(() => {
    if (onLanguageChange) {
      onLanguageChange(sourceLanguage, targetLanguage);
    }
  }, [sourceLanguage, targetLanguage, onLanguageChange]);

  const handleSwapLanguages = () => {
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
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex items-center space-x-4">
        <CustomSelect
          value={sourceLanguage}
          onChange={setSourceLanguage}
          options={languages}
          placeholder="选择源语言"
        />
      </div>
      
      <button 
        className="bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg p-2 transition-colors hover-lift"
        onClick={handleSwapLanguages}
        title={sourceLanguage === 'auto' ? '切换到目标语言并设置为中文翻译' : '交换源语言和目标语言'}
      >
        <i className="fas fa-exchange-alt text-sm"></i>
      </button>
      
      <div className="flex items-center space-x-4">
        <CustomSelect
          value={targetLanguage}
          onChange={setTargetLanguage}
          options={targetLanguages}
          placeholder="选择目标语言"
        />
      </div>
    </div>
  );
} 
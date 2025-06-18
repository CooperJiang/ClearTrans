'use client';

import { useState } from 'react';
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

export default function LanguageSelector() {
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');

  const handleSwapLanguages = () => {
    if (sourceLanguage !== 'auto') {
      setTargetLanguage(sourceLanguage);
      setSourceLanguage(targetLanguage);
    }
  };

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-100">
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
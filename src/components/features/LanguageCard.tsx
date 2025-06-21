'use client';

import React from 'react';
import { allLanguages } from '@/constants/languages';

interface LanguageCardProps {
  selectedLanguage: string;
  onClick: () => void;
  className?: string;
}

export default function LanguageCard({ selectedLanguage, onClick, className = '' }: LanguageCardProps) {
  const langInfo = selectedLanguage === 'auto'
    ? { name: '自动检测', flag: '🌐' }
    : allLanguages.find(lang => lang.code === selectedLanguage);

  // Render a consistent card, whether a language is found or not
  const languageName = langInfo ? langInfo.name : '选择语言';
  const flag = langInfo ? langInfo.flag : '❓';

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-md cursor-pointer transition-all duration-200 ${className}`}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        <span className="text-sm">{flag}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate">
          {languageName}
        </div>
      </div>
      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
} 
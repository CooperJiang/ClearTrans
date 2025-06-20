'use client';

import React from 'react';
import { allLanguages } from '@/constants/languages';

interface LanguageCardProps {
  selectedLanguage: string;
  onClick: () => void;
  className?: string;
}

export default function LanguageCard({ selectedLanguage, onClick, className = '' }: LanguageCardProps) {
  // 查找当前选中的语言信息
  const currentLanguage = allLanguages.find(lang => lang.code === selectedLanguage);
  
  if (!currentLanguage) {
    return (
      <div
        onClick={onClick}
        className={`group flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded-lg cursor-pointer transition-all duration-200 min-w-[90px] shadow-sm hover:shadow-md ${className}`}
      >
        <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center">
          <i className="fas fa-globe text-gray-400 text-xs"></i>
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 group-hover:text-indigo-600 transition-colors">
            选择语言
          </div>
        </div>
        <i className="fas fa-chevron-down text-gray-400 text-xs group-hover:text-indigo-500 transition-colors"></i>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2 bg-white hover:bg-indigo-50 rounded-lg cursor-pointer transition-all duration-200 min-w-[90px] shadow-sm hover:shadow-md border border-gray-100 hover:border-indigo-200 ${className}`}
    >
      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-indigo-100">
        <span className="text-sm">{currentLanguage.flag}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors truncate">
          {currentLanguage.name}
        </div>
      </div>
      <i className="fas fa-chevron-down text-gray-400 text-xs group-hover:text-indigo-600 transition-all transform group-hover:scale-110"></i>
    </div>
  );
} 
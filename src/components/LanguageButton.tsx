'use client';

import React from 'react';
import { allLanguages } from './AdvancedLanguageSelector';

interface LanguageButtonProps {
  selectedLanguage: string;
  onClick: () => void;
  className?: string;
}

export default function LanguageButton({ selectedLanguage, onClick, className = '' }: LanguageButtonProps) {
  // 查找当前选中的语言信息
  const currentLanguage = allLanguages.find(lang => lang.code === selectedLanguage);
  
  if (!currentLanguage) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-md hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer group border border-gray-200/60 shadow-sm hover:shadow-md ${className}`}
      >
        <span className="text-gray-500 text-sm">选择语言</span>
        <i className="fas fa-chevron-down ml-1.5 text-gray-400 text-xs group-hover:text-blue-500 transition-colors"></i>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center px-3 py-1.5 bg-gradient-to-r from-white to-gray-50 rounded-md hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer group border border-gray-200/60 shadow-sm hover:shadow-md min-w-[100px] ${className}`}
    >
      <span className="text-base mr-1.5">{currentLanguage.flag}</span>
      <div className="flex-1 text-left">
        <div className="font-medium text-gray-700 text-sm truncate group-hover:text-blue-700 transition-colors">{currentLanguage.name}</div>
      </div>
      <i className="fas fa-chevron-down ml-1.5 text-gray-400 text-xs group-hover:text-blue-500 transition-colors"></i>
    </div>
  );
} 
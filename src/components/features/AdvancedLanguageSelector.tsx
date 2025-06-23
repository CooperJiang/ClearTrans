'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWindowSize } from 'react-use';
import { 
  allLanguages, 
  getLanguagesByCategory, 
  alphabetOrder
} from '@/constants/languages';
import type { Language } from '@/types';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage';

// 全局语言显示模式状态管理
let globalDisplayMode = SecureStorage.get(STORAGE_KEYS.LANGUAGE_DISPLAY_MODE, 'all');
const displayModeListeners = new Set<(mode: string) => void>();

const useSharedDisplayMode = () => {
  const [displayMode, setDisplayMode] = useState(globalDisplayMode);

  useEffect(() => {
    const listener = (mode: string) => {
      setDisplayMode(mode);
    };
    displayModeListeners.add(listener);
    
    return () => {
      displayModeListeners.delete(listener);
    };
  }, []);

  const updateDisplayMode = (mode: string) => {
    globalDisplayMode = mode;
    SecureStorage.set(STORAGE_KEYS.LANGUAGE_DISPLAY_MODE, mode);
    displayModeListeners.forEach(listener => listener(mode));
  };

  return [displayMode, updateDisplayMode] as const;
};

interface AdvancedLanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (language: Language) => void;
  selectedLanguage?: string;
  excludeAuto?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
  position?: 'left' | 'right';
}

export default function AdvancedLanguageSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedLanguage, 
  excludeAuto = false,
  triggerRef,
  position = 'left'
}: AdvancedLanguageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useSharedDisplayMode();
  const [activeAlphabet, setActiveAlphabet] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [isPositionReady, setIsPositionReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const alphabetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { height } = useWindowSize();

  // 计算动态高度 - 更紧凑
  const calculateMaxHeight = () => {
    const minHeight = 350;
    const maxHeight = 550;
    const availableHeight = height - 200; // 留出200px的边距
    return Math.min(Math.max(minHeight, availableHeight), maxHeight);
  };
  
  // 计算位置的函数
  const calculatePosition = useCallback(() => {
    if (!triggerRef?.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const popoverHeight = 500; // 预估高度

    let top = triggerRect.bottom + 8;
    let left = position === 'left' 
      ? triggerRect.left 
      : triggerRect.right - 700; // 700是popover宽度

    // 检查是否超出视窗底部
    if (top + popoverHeight > viewportHeight) {
      top = triggerRect.top - popoverHeight - 8;
    }

    // 检查是否超出视窗左右边界
    if (left < 8) {
      left = 8;
    } else if (left + 700 > window.innerWidth - 8) {
      left = window.innerWidth - 700 - 8;
    }

    setPopoverPosition({ top, left });
  }, [triggerRef, position]);

  useEffect(() => {
    if (isOpen) {
      // 立即计算位置
      calculatePosition();
      setIsPositionReady(true);
      
      // 确保弹窗先以缩小状态渲染，然后开始动画
      setIsAnimating(false);
      setTimeout(() => {
        setIsAnimating(true);
      }, 50);
      
      if (searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 200);
      }
    } else {
      // 关闭时先播放动画，然后隐藏
      setIsAnimating(false);
      setTimeout(() => {
        setIsPositionReady(false);
        setSearchTerm('');
        setActiveAlphabet('');
      }, 250); // 等待动画完成
    }
  }, [isOpen, calculatePosition]);

  // 监听窗口变化和滚动事件
  useEffect(() => {
    if (!isOpen) return;

    const handlePositionUpdate = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handlePositionUpdate);
    window.addEventListener('scroll', handlePositionUpdate, true);

    return () => {
      window.removeEventListener('resize', handlePositionUpdate);
      window.removeEventListener('scroll', handlePositionUpdate, true);
    };
  }, [isOpen, calculatePosition]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const filteredLanguages = allLanguages.filter(lang => {
    if (excludeAuto && lang.code === 'auto') return false;
    
    // 根据activeTab过滤语言
    if (activeTab === 'en') {
      // EN模式：只显示英文名称
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return lang.englishName.toLowerCase().includes(term) || lang.code.toLowerCase().includes(term);
    } else {
      // 中文模式：显示中文名称
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        lang.name.toLowerCase().includes(term) ||
        lang.englishName.toLowerCase().includes(term) ||
        lang.code.toLowerCase().includes(term)
      );
    }
  });

  const categorizedLanguages = getLanguagesByCategory();

  // 切换显示模式并保存状态
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // 滚动到指定字母
  const scrollToAlphabet = (letter: string) => {
    setActiveAlphabet(letter);
    const element = alphabetRefs.current[letter];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 根据当前语言生成顶部标签
  const getTopLanguages = () => {
    const currentLang = allLanguages.find(lang => lang.code === selectedLanguage);
    const topLangs = [
      allLanguages.find(lang => lang.code === 'zh'),
      allLanguages.find(lang => lang.code === 'en'),
    ].filter(Boolean);

    // 如果当前选中的语言不在前两个中，则添加到列表
    if (currentLang && !topLangs.find(lang => lang?.code === currentLang.code)) {
      topLangs.push(currentLang);
    }

    return topLangs as Language[];
  };

  const topLanguages = getTopLanguages();
  const maxHeight = calculateMaxHeight();

  const popoverContent = (
    <div 
      ref={popoverRef}
      className={`fixed w-[700px] bg-white rounded-lg shadow-2xl border-0 z-[9999] flex flex-col overflow-hidden backdrop-blur-sm transform transition-all duration-300 ease-out ${
        isAnimating 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 -translate-y-2'
      }`}
      style={{ 
        top: `${popoverPosition.top}px`,
        left: `${popoverPosition.left}px`,
        height: `${maxHeight}px`,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* 顶部语言标签 */}
      <div className="flex items-center border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 shadow-sm">
        {topLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => {
              onSelect(lang);
              onClose();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md mr-2 transition-all duration-200 ${
              selectedLanguage === lang.code
                ? 'bg-indigo-100 text-indigo-700 shadow-md transform scale-105 border-0'
                : 'bg-white/80 text-gray-600 hover:bg-blue-50 hover:shadow-md border border-gray-200/60 hover:border-blue-200'
            }`}
          >
            <span className="text-sm">{lang.flag}</span>
            <span>{activeTab === 'en' ? lang.englishName : lang.name}</span>
          </button>
        ))}
        
        {/* 右侧切换按钮 */}
        <div className="ml-auto flex items-center">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button 
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${activeTab === 'all' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
              onClick={() => handleTabChange('all')}
            >
              中
            </button>
            <button 
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${activeTab === 'en' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
              onClick={() => handleTabChange('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* 搜索框 - 底部线条高亮设计 */}
      <div className="px-4 py-3 border-b border-gray-100/60 bg-gradient-to-r from-blue-50/20 to-gray-50/40">
        <div className="relative">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i className="fas fa-search text-sm"></i>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={activeTab === 'en' ? 'Search Languages' : '搜索语言'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-transparent focus:outline-none transition-all duration-300 text-gray-700 placeholder-gray-400"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              boxShadow: 'none',
              borderRadius: '0',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderBottom = '2px solid #60a5fa';
              e.target.style.outline = 'none';
              e.target.style.boxShadow = 'none';
            }}
            onBlur={(e) => {
              e.target.style.borderBottom = '1px solid #e5e7eb';
            }}
          />
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧语言列表 */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
          {searchTerm ? (
            // 搜索结果
            filteredLanguages.length > 0 ? (
              <div className="grid grid-cols-6 gap-2">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelect(lang);
                      onClose();
                    }}
                    className={`flex items-center gap-1.5 p-2 text-sm text-left rounded-md hover:shadow-md transition-all duration-200 ${
                      selectedLanguage === lang.code 
                        ? 'bg-indigo-100 text-indigo-700 shadow-md transform scale-105 border-0' 
                        : 'bg-white/70 text-gray-700 hover:bg-blue-50 border border-gray-200/60 hover:border-blue-200 backdrop-blur-sm'
                    }`}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <span className="flex-1 truncate">{activeTab === 'en' ? lang.englishName : lang.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <i className="fas fa-search text-gray-400 text-xl"></i>
                </div>
                <p className="text-gray-500 text-sm">
                  {activeTab === 'en' ? 'No languages found' : '未找到相关语言'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {activeTab === 'en' ? 'Try different keywords' : '尝试其他关键词'}
                </p>
              </div>
            )
          ) : (
            // 分类显示
            <div>
              {/* 常用语言 */}
              {!excludeAuto && (
                <div className="mb-6">
                  <div className="grid grid-cols-6 gap-2">
                    {categorizedLanguages.common?.filter(lang => !excludeAuto || lang.code !== 'auto').map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onSelect(lang);
                          onClose();
                        }}
                        className={`flex items-center gap-1.5 p-2 text-sm text-left rounded-md hover:shadow-md transition-all duration-200 ${
                          selectedLanguage === lang.code 
                            ? 'bg-indigo-100 text-indigo-700 shadow-md transform scale-105 border-0' 
                            : 'bg-white/70 text-gray-700 hover:bg-blue-50 border border-gray-200/60 hover:border-blue-200 backdrop-blur-sm'
                        }`}
                      >
                        <span className="text-sm">{lang.flag}</span>
                        <span className="flex-1 truncate">{activeTab === 'en' ? lang.englishName : lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 字母分类 */}
              {alphabetOrder.map(letter => {
                const languagesInCategory = categorizedLanguages[letter];
                if (!languagesInCategory || languagesInCategory.length === 0) return null;

                return (
                  <div 
                    key={letter} 
                    className="mb-6"
                    ref={el => { alphabetRefs.current[letter] = el; }}
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-3 sticky top-0 bg-gradient-to-r from-white via-white to-white/90 py-2 backdrop-blur-sm border-b border-gray-100/50">
                      {letter}
                    </h3>
                    <div className="grid grid-cols-6 gap-2">
                      {languagesInCategory.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            onSelect(lang);
                            onClose();
                          }}
                          className={`flex items-center gap-1.5 p-2 text-sm text-left rounded-md hover:shadow-md transition-all duration-200 ${
                            selectedLanguage === lang.code 
                              ? 'bg-indigo-100 text-indigo-700 shadow-md transform scale-105 border-0' 
                              : 'bg-white/70 text-gray-700 hover:bg-blue-50 border border-gray-200/60 hover:border-blue-200 backdrop-blur-sm'
                          }`}
                        >
                          <span className="text-sm">{lang.flag}</span>
                          <span className="flex-1 truncate">{activeTab === 'en' ? lang.englishName : lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 右侧字母索引 */}
        {!searchTerm && (
          <div className="w-14 bg-gradient-to-b from-blue-50/40 to-gray-50/60 border-l border-gray-200/60 overflow-y-auto backdrop-blur-sm">
            <div className="py-4 px-1">
              {alphabetOrder.map(letter => {
                const hasLanguages = categorizedLanguages[letter] && categorizedLanguages[letter].length > 0;
                if (!hasLanguages) return null;

                return (
                  <button
                    key={letter}
                    onClick={() => scrollToAlphabet(letter)}
                    className={`w-full py-1.5 mb-0.5 text-xs font-semibold transition-all duration-200 rounded-md hover:shadow-md ${
                      activeAlphabet === letter 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-110' 
                        : 'text-gray-600 hover:bg-white/70 hover:text-blue-600 hover:shadow-sm'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen || typeof window === 'undefined' || !isPositionReady) return null;

  return createPortal(popoverContent, document.body);
}

// 导出函数给其他组件使用  
export { allLanguages };

/**
 * 翻译历史侧边栏组件
 */

'use client';

import React, { useState, useMemo } from 'react';
import { TranslationHistory } from '@/types';
import { getAdvancedLanguageName } from '@/constants/languages';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useTranslationHistory } from '@/hooks/useTranslationHistory';
import { toast } from '@/components/ui/Toast';
import CustomSelect from '@/components/ui/CustomSelect';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface TranslationHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// 历史记录项组件
const HistoryItem: React.FC<{
  item: TranslationHistory;
  onDelete: (id: string) => void;
  onReuse: (sourceText: string) => void;
}> = ({ item, onDelete, onReuse }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const handleReuse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReuse(item.sourceText);
  };

  const handleCopy = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  // 格式化时间
  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.timestamp), { 
        addSuffix: true, 
        locale: zhCN 
      });
    } catch {
      return '时间未知';
    }
  }, [item.timestamp]);

  // 截断长文本
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-all duration-200 cursor-pointer">
      <div onClick={() => setIsExpanded(!isExpanded)}>
        {/* 头部信息 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
              {getAdvancedLanguageName(item.sourceLanguage)}
            </span>
            <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
              {getAdvancedLanguageName(item.targetLanguage)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-400">{timeAgo}</span>
            <button
              onClick={handleDelete}
              className="text-red-400 hover:text-red-600 p-0.5 rounded transition-colors"
              title="删除记录"
            >
              <i className="fas fa-trash text-xs"></i>
            </button>
          </div>
        </div>

        {/* 原文 */}
        <div className="mb-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-medium text-blue-600">原文</span>
            <button
              onClick={(e) => handleCopy(item.sourceText, e)}
              className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition-colors"
              title="复制原文"
            >
              <i className="fas fa-copy text-xs"></i>
            </button>
          </div>
          <div className="bg-blue-50 border-l-3 border-blue-300 pl-2 py-1 rounded-r">
            <p className="text-sm text-blue-800 leading-relaxed">
              {isExpanded ? item.sourceText : truncateText(item.sourceText)}
            </p>
          </div>
        </div>

        {/* 译文 */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-medium text-green-600">译文</span>
            <button
              onClick={(e) => handleCopy(item.translatedText, e)}
              className="text-gray-400 hover:text-green-600 p-0.5 rounded transition-colors"
              title="复制译文"
            >
              <i className="fas fa-copy text-xs"></i>
            </button>
          </div>
          <div className="bg-green-50 border-l-3 border-green-300 pl-2 py-1 rounded-r">
            <p className="text-sm text-green-800 leading-relaxed">
              {isExpanded ? item.translatedText : truncateText(item.translatedText)}
            </p>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span>
              <i className="fas fa-clock mr-1"></i>
              {(item.duration / 1000).toFixed(1)}s
            </span>
            <span>
              <i className="fas fa-robot mr-1"></i>
              {item.model}
            </span>
          </div>
          <button
            onClick={handleReuse}
            className="text-blue-500 hover:text-blue-700 font-medium transition-colors text-xs"
            title="重新使用此翻译"
          >
            <i className="fas fa-redo mr-1"></i>
            重用
          </button>
        </div>
      </div>
    </div>
  );
};

// 统计信息组件
const HistoryStats: React.FC<{ stats: { totalCount: number; totalCharacters: number; todayCount: number; averageDuration: number; } }> = ({ stats }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
      <i className="fas fa-chart-bar mr-2 text-blue-500"></i>
      统计信息
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-lg font-bold text-blue-600">{stats.totalCount}</div>
        <div className="text-xs text-gray-600">总翻译数</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-green-600">{stats.todayCount}</div>
        <div className="text-xs text-gray-600">今日翻译</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-purple-600">
          {(stats.totalCharacters / 1000).toFixed(1)}K
        </div>
        <div className="text-xs text-gray-600">总字符数</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-orange-600">
          {(stats.averageDuration / 1000).toFixed(1)}s
        </div>
        <div className="text-xs text-gray-600">平均耗时</div>
      </div>
    </div>
  </div>
);

export default function TranslationHistorySidebar({ isOpen, onClose }: TranslationHistorySidebarProps) {
  const {
    history,
    isLoading,
    removeFromHistory,
    clearHistory,
    getHistoryStats,
    searchHistory,
  } = useTranslationHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // 过滤和搜索历史记录
  const filteredHistory = useMemo(() => {
    let filtered = searchQuery ? searchHistory(searchQuery) : history;
    
    if (filterLanguage !== 'all') {
      filtered = filtered.filter(item => 
        item.sourceLanguage === filterLanguage || item.targetLanguage === filterLanguage
      );
      
      // 添加调试信息
      console.log('Language filter applied:', {
        filterLanguage,
        originalCount: history.length,
        filteredCount: filtered.length,
        sampleItems: filtered.slice(0, 2).map(item => ({
          sourceLanguage: item.sourceLanguage,
          targetLanguage: item.targetLanguage
        }))
      });
    }
    
    return filtered;
  }, [history, searchQuery, filterLanguage, searchHistory]);

  // 获取统计信息
  const stats = useMemo(() => getHistoryStats(), [getHistoryStats]);

  // 获取所有使用过的语言
  const usedLanguages = useMemo(() => {
    const languages = new Set<string>();
    history.forEach(item => {
      languages.add(item.sourceLanguage);
      languages.add(item.targetLanguage);
    });
    return Array.from(languages).filter(lang => lang !== 'auto').sort();
  }, [history]);

  // 构建语言选择器选项
  const languageOptions = useMemo(() => {
    const options = [
      { code: 'all', name: '所有语言', flag: '🌐' }
    ];
    
    usedLanguages.forEach(lang => {
      options.push({
        code: lang,
        name: getAdvancedLanguageName(lang),
        flag: '🌍' // 默认flag，可以根据需要优化
      });
    });
    
    return options;
  }, [usedLanguages]);

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除翻译记录',
      message: '确定要删除这条翻译记录吗？此操作不可撤销。',
      onConfirm: () => {
        removeFromHistory(id);
        toast.success('已删除翻译记录');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: '清空翻译历史',
      message: '确定要清空所有翻译历史吗？此操作将删除所有记录且不可撤销。',
      onConfirm: () => {
        clearHistory();
        toast.success('已清空翻译历史');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleReuse = (sourceText: string) => {
    // 这里应该触发重新翻译，暂时先复制到剪贴板
    navigator.clipboard.writeText(sourceText).then(() => {
      toast.success('原文已复制到剪贴板，请粘贴到输入框');
      onClose();
    }).catch(() => {
      toast.error('复制失败');
    });
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`fixed inset-0 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'var(--overlay-background)' }}
        onClick={onClose}
      />

      {/* 侧边栏 */}
      <div
        className={`fixed right-0 top-0 h-full w-[32rem] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-2">
              <i className="fas fa-history text-blue-500 text-sm"></i>
              <h2 className="text-sm font-semibold text-gray-800">翻译历史</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-white/50 transition-all"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>

          {/* 搜索和筛选 */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索翻译内容..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>

            {/* 语言筛选 */}
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <CustomSelect
                  value={filterLanguage}
                  onChange={(value) => setFilterLanguage(value)}
                  options={languageOptions}
                  placeholder="选择语言"
                />
              </div>
              
              {/* 清空按钮 */}
              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-2 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors text-sm"
                  title="清空所有历史"
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  加载中...
                </div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <i className="fas fa-history text-4xl mb-4 text-gray-300"></i>
                <h3 className="text-lg font-medium mb-2">
                  {history.length === 0 ? '暂无翻译历史' : '未找到匹配的记录'}
                </h3>
                <p className="text-sm text-center">
                  {history.length === 0 
                    ? '开始翻译后，历史记录将显示在这里' 
                    : '尝试调整搜索条件或筛选设置'
                  }
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* 统计信息 */}
                {history.length > 0 && <HistoryStats stats={stats} />}
                
                {/* 历史记录列表 */}
                {filteredHistory.map(item => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onReuse={handleReuse}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 底部信息 */}
          {history.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                共 {history.length} 条记录 • 显示 {filteredHistory.length} 条
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmButtonColor="red"
      />
    </>
  );
} 
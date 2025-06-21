'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';
import { useTTS } from '@/hooks/useTTS';

interface OutputAreaProps {
  translationResult: { text: string; duration: number } | null;
  isTranslating?: boolean;
}

export default function OutputArea({ translationResult, isTranslating = false }: OutputAreaProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [lastTranslationResult, setLastTranslationResult] = useState<{ text: string; duration: number } | null>(null);
  const { error } = useToast();
  const { playbackState, speak, stop, settings } = useTTS();
  
  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const previousTextLength = useRef(0);

  // 保存最新的翻译结果
  useEffect(() => {
    if (translationResult?.text) {
      setLastTranslationResult(translationResult);
    }
  }, [translationResult]);

  // 决定显示哪个翻译结果（当前的或上一次的）
  const displayResult = translationResult || lastTranslationResult;

  // 检测用户是否主动滚动
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const currentScrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // 检测向上滚动
    if (currentScrollTop < lastScrollTop.current - 5) { // 5px 阈值避免误触
      setAutoScrollEnabled(false);
      
      // 清除之前的定时器
      if (userScrollTimeout.current) {
        clearTimeout(userScrollTimeout.current);
      }
      
      // 5秒后重新启用自动滚动（如果用户没有继续滚动）
      userScrollTimeout.current = setTimeout(() => {
        // 如果用户滚动到底部附近，重新启用自动滚动
        if (scrollHeight - currentScrollTop - clientHeight < 100) {
          setAutoScrollEnabled(true);
        }
      }, 5000);
    }
    
    // 如果用户滚动到底部附近，重新启用自动滚动
    if (scrollHeight - currentScrollTop - clientHeight < 50) {
      setAutoScrollEnabled(true);
    }
    
    lastScrollTop.current = currentScrollTop;
  };

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [autoScrollEnabled]);

  // 监听翻译结果变化，实现智能滚动
  useEffect(() => {
    if (displayResult?.text) {
      const currentTextLength = displayResult.text.length;
      
      // 在流式翻译时，文本增长就滚动
      if (isTranslating && currentTextLength > previousTextLength.current) {
        // 延迟滚动，让DOM更新
        setTimeout(scrollToBottom, 50);
      }
      // 翻译完成时也滚动一次
      else if (!isTranslating && previousTextLength.current > 0) {
        setTimeout(scrollToBottom, 50);
      }
      
      previousTextLength.current = currentTextLength;
    }
    
    // 翻译开始时重置状态
    if (isTranslating && !displayResult) {
      setAutoScrollEnabled(true);
      previousTextLength.current = 0;
    }
  }, [displayResult, isTranslating, scrollToBottom]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (userScrollTimeout.current) {
        clearTimeout(userScrollTimeout.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (displayResult?.text) {
      try {
        await navigator.clipboard.writeText(displayResult.text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000);
      } catch {
        error('复制失败');
      }
    }
  };

  const handleSpeak = async () => {
    if (!displayResult?.text) return;

    if (playbackState.isPlaying) {
      stop();
      return;
    }

    try {
      const result = await speak(displayResult.text);
      if (!result.success) {
        console.error('TTS failed:', result.error);
        error(result.error || '语音合成失败');
      } else {
        console.log('TTS started successfully');
      }
    } catch (err) {
      console.error('TTS error:', err);
      error('语音合成过程中发生错误');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-y border-gray-200/50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <i className="fas fa-language mr-2 text-emerald-500"></i>
          翻译结果
          {isTranslating && (
            <div className="ml-3 flex items-center text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mr-2"></div>
              <span className="text-xs">正在翻译...</span>
            </div>
          )}
        </h2>
        <div className="flex items-center space-x-1">
          {settings.enabled && (
            <Button
              onClick={handleSpeak}
              disabled={!displayResult?.text || playbackState.isLoading}
              variant="secondary"
              size="sm"
              className="!bg-gray-50 !border-gray-200 !shadow-sm hover:!bg-gray-100 transition-all duration-200 !px-3 !py-1.5 !text-xs"
            >
              {playbackState.isLoading ? (
                <i className="fas fa-spinner fa-spin text-emerald-500 mr-1"></i>
              ) : (
                <i className={`fas ${playbackState.isPlaying ? 'fa-stop text-red-500' : 'fa-volume-up text-emerald-500'} mr-1`}></i>
              )}
              {playbackState.isLoading ? '生成中' : playbackState.isPlaying ? '停止' : '朗读'}
            </Button>
          )}
          <Button
            onClick={handleCopy}
            disabled={!displayResult?.text}
            variant="secondary"
            size="sm"
            className="!bg-gray-50 !border-gray-200 !shadow-sm hover:!bg-gray-100 transition-all duration-200 !px-3 !py-1.5 !text-xs"
          >
            <i className={`fas ${isCopied ? 'fa-check text-emerald-600' : 'fa-copy text-emerald-500'} mr-1`}></i>
            复制
          </Button>
        </div>
      </div>
      
      <div className="flex-1 border-l border-gray-200 bg-gray-50/30 min-h-0 flex flex-col">
        <div className="flex-1 w-full p-6 min-h-0">
          {displayResult ? (
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-6 overflow-y-auto enhanced-scrollbar"
              >
                <div className="translation-result-enhanced whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
                  {displayResult.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-lg border border-blue-200">
                  <i className="fas fa-language text-4xl text-blue-500"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">等待翻译</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">输入内容后点击翻译，AI生成的结果将在这里显示</p>
                <div className="flex items-center justify-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200 mt-4">
                  <i className="fas fa-robot mr-2 text-blue-500"></i>
                  <span>AI驱动 • 智能理解上下文</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-400 font-medium">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
            <span>AI智能翻译 • 高质量输出</span>
            {isTranslating && !autoScrollEnabled && (
              <>
                <span className="mx-3">•</span>
                <button
                  onClick={() => setAutoScrollEnabled(true)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  恢复自动滚动
                </button>
              </>
            )}
          </div>
          {displayResult && (
            <span className="text-xs text-gray-400">
              {displayResult.duration}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTTS } from '@/hooks/useTTS';

interface OutputAreaProps {
  translationResult: { text: string; duration: number } | null;
  isTranslating?: boolean;
}

export default function OutputArea({ translationResult, isTranslating = false }: OutputAreaProps) {
  const [displayText, setDisplayText] = useState('');
  const [lastTranslationResult, setLastTranslationResult] = useState<{ text: string; duration: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const previousTextLength = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  const { error: showError } = useToast();
  const { speak, stop, playbackState, settings } = useTTS();

  // 保存最新的翻译结果
  useEffect(() => {
    if (translationResult?.text) {
      setLastTranslationResult(translationResult);
      
      // 如果是流式翻译，直接更新显示文本
      if (isTranslating) {
        // 使用 requestAnimationFrame 确保 DOM 更新
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        animationFrameRef.current = requestAnimationFrame(() => {
          setDisplayText(translationResult.text);
          setIsAnimating(true);
          setUpdateCount(prev => prev + 1);
          
          // 短暂的动画效果
          setTimeout(() => setIsAnimating(false), 100);
        });
      } else {
        // 翻译完成，直接设置最终文本
        setDisplayText(translationResult.text);
        setIsAnimating(false);
      }
    }
  }, [translationResult, isTranslating]);

  // 决定显示哪个翻译结果（当前的或上一次的）
  const displayResult = translationResult || lastTranslationResult;
  const finalDisplayText = displayText || displayResult?.text || '';

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
    if (finalDisplayText) {
      const currentTextLength = finalDisplayText.length;
      
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
    if (isTranslating && !finalDisplayText) {
      setAutoScrollEnabled(true);
      previousTextLength.current = 0;
      setUpdateCount(0);
    }
  }, [finalDisplayText, isTranslating, scrollToBottom]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (userScrollTimeout.current) {
        clearTimeout(userScrollTimeout.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
        showError('复制失败');
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
        showError(result.error || '语音合成失败');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : '语音合成失败');
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
              <span className="text-xs">正在翻译... ({updateCount} 更新)</span>
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
                className="flex-1 p-6 overflow-y-auto custom-scrollbar"
                onScroll={handleScroll}
              >
                <div 
                  className={`whitespace-pre-wrap text-gray-800 leading-relaxed ${isAnimating ? 'animate-highlight' : ''}`}
                >
                  {finalDisplayText}
                </div>
              </div>
              {displayResult.duration !== undefined && (
                <div className="p-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50 flex justify-between items-center">
                  <span>翻译用时: {displayResult.duration.toFixed(2)}秒</span>
                  <span>{finalDisplayText.length} 字符</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-400">
              翻译结果将显示在这里
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
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { translateText, initTranslateService } from '@/services/translation';
import { useTranslationHistory } from '@/hooks/useTranslationHistory';
import { useTTS } from '@/hooks/useTTS';
import { useSmartLanguageSwitch } from '@/hooks/useSmartLanguageSwitch';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage/secureStorage';
import { TranslateConfig } from '@/types';
import { flushSync } from 'react-dom';

interface InputAreaProps {
  onTranslate: (result: { text: string; duration: number } | null) => void;
  onTranslationEnd?: () => void;
  isTranslating: boolean;
  onServerNotConfigured?: () => void;
  targetLanguage?: string;
  sourceLanguage?: string;
  setTargetLanguage?: (lang: string) => void;
}

export default function InputArea({ 
  onTranslate, 
  onTranslationEnd,
  isTranslating, 
  onServerNotConfigured, 
  targetLanguage, 
  sourceLanguage,
  setTargetLanguage 
}: InputAreaProps) {
  const { error: showError } = useToast();
  const [text, setText] = useState('');
  const { addToHistory, findCachedTranslation } = useTranslationHistory();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { playbackState, speak, stop, settings } = useTTS();
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  // 添加中断控制器状态
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isStreamTranslating, setIsStreamTranslating] = useState(false);

  // 智能语言切换Hook
  const { handleTextChange: handleSmartLanguageSwitch, justSwitched } = useSmartLanguageSwitch({
    targetLanguage: targetLanguage || 'zh',
    setTargetLanguage: setTargetLanguage || (() => {}),
  });

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Command+Enter (Mac) 或 Ctrl+Enter (Windows/Linux) 触发翻译
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (text.trim() && !isTranslating) {
        handleTranslate();
      }
    }
  };

  // 处理文本输入变化
  const handleTextInputChange = (newText: string) => {
    setText(newText);
    
    // 触发智能语言检测和切换
    handleSmartLanguageSwitch(newText);
  };

  const handleTranslate = async () => {
    if (!text.trim()) {
      showError('请输入要翻译的文本');
      return;
    }

    // 如果正在翻译，则中断当前翻译
    if (isTranslating || isStreamTranslating) {
      if (abortController) {
        abortController.abort();
        setAbortController(null);
        setIsStreamTranslating(false);
        onTranslate(null); // 关闭loading状态
        onTranslationEnd?.(); // 通知主页面翻译结束
        showError('翻译已中断');
        return;
      }
    }

    // 检查历史记录缓存
    const cachedResult = findCachedTranslation(text.trim(), sourceLanguage || 'auto', targetLanguage || 'zh');
    if (cachedResult) {
      // 直接使用缓存结果
      onTranslate({ 
        text: cachedResult.translatedText, 
        duration: cachedResult.duration 
      });
      
      // 移除缓存提示，用户无感知使用缓存
      return;
    }

    // 检查是否存在翻译配置，如果不存在则自动创建默认配置
    if (!SecureStorage.has(STORAGE_KEYS.TRANSLATE_CONFIG)) {
      const defaultConfig: TranslateConfig = {
        provider: 'openai',
        apiKey: '',
        baseURL: '',
        model: 'gpt-4o-mini',
        maxTokens: 4096,
        systemMessage: `You are a professional {{to}} native translator who needs to fluently translate text into {{to}}.

### Translation Rules:
1. Accurately and fluently translate content into {{to}}
2. Maintain the original meaning and tone
3. Consider cultural context appropriately
4. Use natural expressions and avoid machine translation patterns
5. Keep proper nouns, numbers, and special symbols unchanged unless translation is needed

### Multi-paragraph Translation Format:
If input has multiple paragraphs, output format should be:

Translation A

Translation B

Translation C

Translation D

### Single paragraph Input:
Single paragraph content

### Single paragraph Output:
Direct translation without separators`,
        useServerSide: true,
        streamTranslation: false
      };
      
      // 保存默认配置到 SecureStorage
      SecureStorage.set(STORAGE_KEYS.TRANSLATE_CONFIG, defaultConfig);
      
      // 初始化翻译服务
      initTranslateService(defaultConfig);
    }

    // 获取当前配置
    const config = SecureStorage.get<TranslateConfig>(STORAGE_KEYS.TRANSLATE_CONFIG);
    const useStreamTranslation = config?.streamTranslation || false;

    // 创建新的中断控制器
    const controller = new AbortController();
    setAbortController(controller);

    onTranslate(null); // 开始翻译
    const startTime = Date.now();
    
    try {
      if (useStreamTranslation) {
        // 使用流式翻译
        setIsStreamTranslating(true);
        const { translateTextStream } = await import('@/services/translation');
        
        await translateTextStream(
          text,
          targetLanguage,
          sourceLanguage,
          // onProgress: 实时更新翻译内容
          (delta: string, fullContent: string) => {
            // 检查是否已被中断
            if (controller.signal.aborted) return;
            
            // 使用 flushSync 强制立即更新 DOM，避免 React 批处理
            flushSync(() => {
              onTranslate({ text: fullContent, duration: Date.now() - startTime });
            });
          },
          // onComplete: 翻译完成
          (fullContent: string, duration: number) => {
            // 检查是否已被中断
            if (controller.signal.aborted) return;
            
            setIsStreamTranslating(false);
            setAbortController(null);
            onTranslate({ text: fullContent, duration });
            onTranslationEnd?.(); // 通知主页面翻译结束
            
            // 保存到历史记录
            try {
              let currentModel = 'gpt-4o-mini';
              if (config && (config as any).model) {
                currentModel = (config as any).model;
              }

              addToHistory({
                sourceText: text,
                translatedText: fullContent,
                sourceLanguage: sourceLanguage || 'auto',
                targetLanguage: targetLanguage || 'zh',
                model: currentModel,
                duration,
              });
            } catch (historyError) {
              console.error('Failed to save translation history:', historyError);
            }
          },
          // onError: 处理错误
          (error: string, code?: string) => {
            // 检查是否是用户主动中断
            if (controller.signal.aborted) return;
            
            setIsStreamTranslating(false);
            setAbortController(null);
            onTranslate(null); // 关闭loading
            onTranslationEnd?.(); // 通知主页面翻译结束
            
            if (code === 'SERVER_NOT_CONFIGURED') {
              showError('🔧 服务端未配置默认模型，请稍等...');
              setTimeout(() => {
                onServerNotConfigured?.();
              }, 1500);
            } else {
              showError(error || '流式翻译失败，请重试');
            }
          },
          controller.signal
        );
      } else {
        // 使用普通翻译
        const result = await translateText(text, targetLanguage, sourceLanguage);
        const duration = Date.now() - startTime;
        
        // 检查是否已被中断
        if (controller.signal.aborted) return;
        
        setAbortController(null);
        
        if (result.success && result.data) {
          onTranslate({ text: result.data, duration });
          onTranslationEnd?.(); // 通知主页面翻译结束
          
          // 保存到历史记录
          try {
            let currentModel = 'gpt-4o-mini';
            if (config && (config as any).model) {
              currentModel = (config as any).model;
            }
            
            addToHistory({
              sourceText: text,
              translatedText: result.data,
              sourceLanguage: sourceLanguage || 'auto',
              targetLanguage: targetLanguage || 'zh',
              model: currentModel,
              duration,
            });
          } catch (historyError) {
            console.error('Failed to save translation history:', historyError);
          }
        } else {
          onTranslate(null); // 关闭loading
          onTranslationEnd?.(); // 通知主页面翻译结束
          
          if (result.code === 'SERVER_NOT_CONFIGURED') {
            showError('🔧 服务端未配置默认模型，请稍等...');
            setTimeout(() => {
              onServerNotConfigured?.();
            }, 1500);
          } else {
            showError(result.error || '翻译失败，请重试');
          }
        }
      }
    } catch (error) {
      // 检查是否已被中断
      if (controller.signal.aborted) return;
      
      setIsStreamTranslating(false);
      setAbortController(null);
      onTranslate(null); // 关闭loading
      onTranslationEnd?.(); // 通知主页面翻译结束
      showError(error instanceof Error ? error.message : '翻译失败，请重试');
    }
  };

  const handleClear = () => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSpeak = async () => {
    if (!text.trim()) return;
    
    if (playbackState.isPlaying) {
      // 如果正在播放，则停止
      stop();
      return;
    }
    
    try {
      const result = await speak(text);
      if (!result.success) {
        showError(result.error || '语音合成失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '语音合成失败');
    }
  };

  // 清理中断控制器
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-y border-gray-200/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="fas fa-edit mr-2 text-blue-500"></i>
            输入文本
          </h2>
          <div className="flex items-center space-x-2">
            {settings.enabled && (
              <Button
                onClick={handleSpeak}
                disabled={!text.trim() || playbackState.isLoading}
                variant="secondary"
                size="sm"
                className="!bg-gray-50 !border-gray-200 !shadow-sm hover:!bg-gray-100 transition-all duration-200 !px-3 !py-1.5 !text-xs"
              >
                {playbackState.isLoading ? (
                  <i className="fas fa-spinner fa-spin text-indigo-500 mr-1"></i>
                ) : (
                  <i className={`fas ${playbackState.isPlaying ? 'fa-stop text-red-500' : 'fa-volume-up text-indigo-500'} mr-1`}></i>
                )}
                {playbackState.isLoading ? '生成中' : playbackState.isPlaying ? '停止' : '朗读'}
              </Button>
            )}
            <button
              onClick={handleClear}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-all duration-200"
            >
              <i className="fas fa-trash-alt mr-1.5 text-gray-500"></i>
              清空
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 flex flex-col bg-gray-50/30">
        {/* 统一的输入区域容器 */}
        <div className={`flex-1 flex flex-col border rounded-lg bg-white transition-all duration-500 overflow-hidden relative shadow-sm ${
          justSwitched 
            ? 'border-emerald-300 shadow-emerald-100 shadow-lg' 
            : 'border-gray-200 hover:border-blue-300 focus-within:border-blue-400'
        }`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextInputChange(e.target.value)}
            placeholder="请输入要翻译的文本..."
            className="flex-1 w-full p-6 border-none focus:outline-none resize-none text-gray-800 placeholder-gray-400 bg-transparent transition-all custom-scrollbar text-base leading-relaxed"
            onKeyDown={handleKeyDown}
          />
          
          {/* 语言切换动画指示器 */}
          {justSwitched && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 animate-fade-in-out shadow-sm">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-emerald-600 font-medium">已切换目标语言</span>
            </div>
          )}
          
          {/* 输入区域底部 footer - 缩小高度 */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-500 flex items-center font-medium">
              <i className="fas fa-file-text mr-2 text-gray-400"></i>
              {text.length} 字符
            </span>
            
            <button
              onClick={handleTranslate}
              disabled={!text.trim() || (isTranslating && !abortController)}
              className={`
                relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                transition-all duration-200 shadow-sm hover:shadow-md
                min-w-[80px] h-[32px] justify-center
                ${!text.trim() 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : (isTranslating || isStreamTranslating)
                  ? 'bg-gradient-to-r from-red-400 to-red-500 text-white border border-red-400 hover:from-red-500 hover:to-red-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 border border-blue-500 hover:border-blue-600'
                }
                group focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1
              `}
            >
              {(isTranslating || isStreamTranslating) ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">中断翻译</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <i className="fas fa-language text-sm"></i>
                  <span className="text-sm font-medium">翻译</span>
                  {!text.trim() ? null : (
                    <div className="ml-1 px-1 py-0.5 bg-white/20 rounded text-xs font-medium opacity-75 group-hover:opacity-90 transition-opacity">
                      {isMac ? '⌘' : 'Ctrl'}+↵
                    </div>
                  )}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTTS } from '@/hooks/useTTS';
import type { ImageTranslationResult } from '@/types/imageTranslation';

interface ImageTranslationResultProps {
  result: ImageTranslationResult | null;
  isTranslating: boolean;
  onTranslate: () => void;
  onRetranslate: () => void;
  hasImage: boolean;
  targetLanguage?: string;
  streamTranslatedText?: string;
}

function ImageTranslationResult({
  result,
  isTranslating,
  onTranslate,
  onRetranslate,
  hasImage,
  targetLanguage,
  streamTranslatedText = ''
}: ImageTranslationResultProps) {
  
  const [isCopied, setIsCopied] = useState(false);
  const { error: showError } = useToast();
  const { speak, stop, playbackState, settings } = useTTS();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部当有新的流式内容时
  useEffect(() => {
    if (streamTranslatedText && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamTranslatedText]);

  const getLanguageDisplayName = useCallback((languageCode: string): string => {
    const languageNames: Record<string, string> = {
      'zh': '中文',
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'en': 'English',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'it': '意大利语',
      'pt': '葡萄牙语',
      'ru': '俄语',
      'ar': '阿拉伯语',
      'hi': '印地语',
      'th': '泰语',
      'vi': '越南语'
    };
    return languageNames[languageCode] || languageCode;
  }, []);

  const handleCopy = useCallback(async (text: string) => {
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000);
      } catch {
        showError('复制失败');
      }
    }
  }, [showError]);

  const handleSpeak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    if (playbackState.isPlaying) {
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
  }, [playbackState.isPlaying, stop, speak, showError]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="fas fa-language mr-2 text-emerald-500"></i>
            翻译结果
            {isTranslating && (
              <div className="ml-3 flex items-center text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                <span className="text-xs">翻译中...</span>
              </div>
            )}
          </h2>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={onTranslate}
              variant="primary"
              size="sm"
              disabled={!hasImage || isTranslating}
            >
              <i className="fas fa-language mr-2"></i>
              开始翻译
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50/30 min-h-0 flex flex-col">
        <div className="flex-1 w-full p-4 min-h-0">
          {result || streamTranslatedText || isTranslating ? (
            <div className="h-full bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 flex flex-col overflow-hidden">
              {/* 翻译结果区域 */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 px-4 py-3 border-b border-emerald-100/50 flex items-center justify-between backdrop-blur-sm">
                  <h3 className="text-sm font-semibold text-emerald-700 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                      <i className="fas fa-language text-white text-xs"></i>
                    </div>
                    <div className="flex items-center">
                      <span>翻译结果</span>
                      {targetLanguage && (
                        <span className="ml-3 px-3 py-1 bg-gradient-to-r from-emerald-200 to-emerald-100 text-emerald-800 rounded-full text-xs font-medium shadow-sm">
                          {getLanguageDisplayName(targetLanguage)}
                        </span>
                      )}
                    </div>
                  </h3>
                  <div className="flex items-center space-x-2">
                    {(result?.translatedText || streamTranslatedText) && (
                      <>
                        <Button
                          onClick={() => handleCopy(result?.translatedText || streamTranslatedText)}
                          variant="secondary"
                          size="sm"
                        >
                          <i className={`fas ${isCopied ? 'fa-check text-green-600' : 'fa-copy'} mr-2`}></i>
                          复制
                        </Button>
                        {settings.enabled && (
                          <Button
                            onClick={() => handleSpeak(result?.translatedText || streamTranslatedText)}
                            disabled={playbackState.isLoading}
                            loading={playbackState.isLoading}
                            variant="secondary"
                            size="sm"
                          >
                            <i className="fas fa-volume-up mr-2"></i>
                            朗读
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      onClick={onRetranslate}
                      disabled={!hasImage}
                      variant="secondary"
                      size="sm"
                    >
                      <i className="fas fa-redo mr-2"></i>
                      重新翻译
                    </Button>
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gradient-to-br from-emerald-50/20 to-teal-50/10">
                  {(result?.translatedText || streamTranslatedText) ? (
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
                      {streamTranslatedText || result?.translatedText}
                      {isTranslating && streamTranslatedText && <span className="inline-block w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 ml-1 animate-pulse rounded-full"></span>}
                    </div>
                  ) : isTranslating && !result?.translatedText ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <div className="relative mb-6">
                          <div className="w-16 h-16 border-4 border-emerald-200/60 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-teal-400/60 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '2s'}}></div>
                          <div className="absolute inset-4 w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full animate-pulse mx-auto"></div>
                        </div>
                        <p className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">AI正在翻译中</p>
                        <p className="text-sm text-gray-500">识别图片文字并翻译...</p>
                        <div className="mt-4 flex justify-center space-x-1">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <i className="fas fa-language text-4xl mb-4"></i>
                        <p>暂无翻译结果</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 统计信息 */}
              {result?.translatedText && (
                <div className="border-t border-gray-100 p-3 bg-gray-50/50 flex justify-center">
                  <div className="text-xs text-gray-500 flex items-center space-x-4">
                    <span className="flex items-center">
                      <i className="fas fa-language mr-1 text-emerald-500"></i>
                      译文: {result.translatedText.length} 字符
                    </span>
                    {result.duration && (
                      <span className="flex items-center">
                        <i className="fas fa-clock mr-1 text-gray-400"></i>
                        用时: {result.duration.toFixed(2)}秒
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : !isTranslating ? (
            <div className="h-full flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 text-gray-400">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <i className="fas fa-image text-3xl text-gray-400"></i>
                </div>
                <p className="text-xl font-semibold text-gray-600 mb-3">上传图片开始翻译</p>
                <p className="text-sm text-gray-500 leading-relaxed">支持识别图片中的文字并翻译成多种语言</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 mb-2">正在识别图片文字...</p>
                <p className="text-sm text-gray-500">这可能需要几秒钟时间</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-400 font-medium">
            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
            <span>AI图片识别翻译 • 高精度OCR</span>
          </div>
          {result && (
            <span className="text-xs text-gray-400">
              模型处理时间: {result.duration.toFixed(2)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImageTranslationResult;
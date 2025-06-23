'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTTS } from '@/hooks/useTTS';
import type { ImageTranslationResult } from '@/types/imageTranslation';

interface ImageTranslationResultProps {
  result: ImageTranslationResult | null;
  isTranslating: boolean;
  onTranslate: () => void;
  hasImage: boolean;
  targetLanguage?: string;
}

const ImageTranslationResultComponent = memo(function ImageTranslationResult({
  result,
  isTranslating,
  onTranslate,
  hasImage,
  targetLanguage
}: ImageTranslationResultProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'translated'>('translated');
  const [isCopied, setIsCopied] = useState(false);
  const { error: showError } = useToast();
  const { speak, stop, playbackState, settings } = useTTS();

  const handleCopy = useCallback(async (text: string, type: 'original' | 'translated') => {
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

  const currentText = activeTab === 'original' ? result?.originalText : result?.translatedText;
  const displayText = currentText || '';

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
                <span className="text-xs">识别翻译中...</span>
              </div>
            )}
          </h2>
          
          <div className="flex items-center space-x-2">
            {!isTranslating && hasImage && (
              <Button
                onClick={onTranslate}
                variant="primary"
                size="sm"
                className="!px-3 !py-1.5 !text-xs"
              >
                <i className="fas fa-language mr-1"></i>
                开始翻译
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50/30 min-h-0 flex flex-col">
        <div className="flex-1 w-full p-6 min-h-0">
          {result ? (
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              {/* 标签页 */}
              <div className="border-b border-gray-200 bg-gray-50/50">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('translated')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'translated'
                        ? 'bg-white text-emerald-600 border-b-2 border-emerald-500'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <i className="fas fa-language mr-2"></i>
                    翻译结果
                  </button>
                  <button
                    onClick={() => setActiveTab('original')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'original'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <i className="fas fa-eye mr-2"></i>
                    识别文本
                  </button>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {displayText ? (
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {displayText}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <i className="fas fa-search text-4xl mb-4"></i>
                      <p>
                        {activeTab === 'original' ? '未识别到文本内容' : '暂无翻译结果'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              {displayText && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {settings.enabled && (
                      <Button
                        onClick={() => handleSpeak(displayText)}
                        disabled={playbackState.isLoading}
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
                      onClick={() => handleCopy(displayText, activeTab)}
                      variant="secondary"
                      size="sm"
                      className="!bg-gray-50 !border-gray-200 !shadow-sm hover:!bg-gray-100 transition-all duration-200 !px-3 !py-1.5 !text-xs"
                    >
                      <i className={`fas ${isCopied ? 'fa-check text-emerald-600' : 'fa-copy text-emerald-500'} mr-1`}></i>
                      复制
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    {displayText.length} 字符
                    {result.duration && (
                      <span className="ml-3">
                        用时: {result.duration.toFixed(2)}秒
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : !isTranslating ? (
            <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-400">
              <div className="text-center">
                <i className="fas fa-image text-4xl mb-4"></i>
                <p className="text-lg mb-2">上传图片开始翻译</p>
                <p className="text-sm">支持识别图片中的文字并翻译</p>
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
});

export default ImageTranslationResultComponent;
'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { translateText, initTranslateService } from '@/services/translation';
import { toast } from '@/components/ui/Toast';
import { useTTS } from '@/hooks/useTTS';
import { useTranslationHistory } from '@/hooks/useTranslationHistory';

interface InputAreaProps {
  onTranslate: (result: { text: string; duration: number } | null) => void;
  isTranslating: boolean;
  onServerNotConfigured?: () => void;
  targetLanguage?: string;
  sourceLanguage?: string;
}

export default function InputArea({ onTranslate, isTranslating, onServerNotConfigured, targetLanguage, sourceLanguage }: InputAreaProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { playbackState, speak, stop, settings } = useTTS();
  const { addToHistory } = useTranslationHistory();

  const handleTranslate = async () => {
    if (!text.trim()) {
      toast.error('请输入要翻译的文本');
      return;
    }

    // 检查是否存在翻译配置，如果不存在则自动创建默认配置
    if (!localStorage.getItem('translateConfig')) {
      const defaultConfig = {
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
        useServerSide: true
      };
      
      // 保存默认配置到 localStorage
      localStorage.setItem('translateConfig', JSON.stringify(defaultConfig));
      
      // 初始化翻译服务
      initTranslateService(defaultConfig);
      
      console.log('已自动生成默认翻译配置');
    }

    onTranslate(null); // 开始翻译
    const startTime = Date.now();
    
    try {
      const result = await translateText(text, targetLanguage, sourceLanguage);
      const duration = Date.now() - startTime;
      
      console.log('Translation result:', result); // 调试信息
      
      if (result.success) {
        // 成功：显示结果
        onTranslate({ text: result.data!, duration });
        
        // 保存到历史记录
        try {
          // 从配置中获取当前使用的模型
          const config = localStorage.getItem('translateConfig');
          let currentModel = 'gpt-4o-mini';
          if (config) {
            try {
              const parsedConfig = JSON.parse(config);
              currentModel = parsedConfig.model || 'gpt-4o-mini';
            } catch (error) {
              console.warn('Failed to parse translate config:', error);
            }
          }

          addToHistory({
            sourceText: text,
            translatedText: result.data!,
            sourceLanguage: sourceLanguage || 'auto',
            targetLanguage: targetLanguage || 'zh',
            model: currentModel,
            duration,
          });
        } catch (historyError) {
          console.error('Failed to save translation history:', historyError);
          // 历史记录保存失败不影响翻译功能
        }
      } else {
        // 任何错误都立即关闭loading
        console.log('Error detected, closing loading...'); // 调试信息
        onTranslate(null);
        
        // 然后根据错误类型处理
        if (result.code === 'SERVER_NOT_CONFIGURED') {
          toast.warning('🔧 服务端未配置默认模型，请稍等...');
          // 延迟显示弹窗（loading已经关闭）
          setTimeout(() => {
            onServerNotConfigured?.();
          }, 1500);
        } else {
          // 其他所有错误：显示错误Toast
          toast.error(result.error || '翻译失败，请重试');
        }
      }
    } catch {
      // 网络或其他异常：立即关闭loading并显示错误
      console.log('Exception caught, closing loading...'); // 调试信息
      onTranslate(null);
      toast.error('翻译过程中发生错误，请检查网络连接');
    }
  };

  const handleClear = () => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };



  const handleSpeak = async () => {
    if (!text.trim()) {
      toast.error('请输入要朗读的文本');
      return;
    }

    if (playbackState.isPlaying) {
      stop();
      return;
    }

    try {
      const result = await speak(text);
      if (!result.success) {
        console.error('TTS failed:', result.error);
        toast.error(result.error || '语音合成失败');
      }
    } catch (err) {
      console.error('TTS error:', err);
      toast.error('语音合成过程中发生错误');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
              className="!bg-white/60 !border-white/40 !shadow-sm hover:!bg-white/80 transition-all duration-200 !px-2 !py-1.5 !text-xs"
            >
              {playbackState.isLoading ? (
                <i className="fas fa-spinner fa-spin text-blue-500 mr-1"></i>
              ) : (
                <i className={`fas ${playbackState.isPlaying ? 'fa-stop text-red-500' : 'fa-volume-up text-blue-600'} mr-1`}></i>
              )}
              {playbackState.isLoading ? '生成中' : playbackState.isPlaying ? '停止' : '朗读'}
            </Button>
          )}
          <button
            onClick={handleClear}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-md hover:from-red-100 hover:to-pink-100 hover:border-red-300 transition-all duration-200 hover:shadow-sm"
          >
            <i className="fas fa-trash-alt mr-1.5 text-red-500"></i>
            清空
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 flex flex-col">
        {/* 统一的输入区域容器 */}
        <div className="flex-1 flex flex-col border-2 border-gray-200 rounded-lg bg-white hover:border-indigo-300 transition-all duration-200 input-container-unified overflow-hidden">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请输入要翻译的文本..."
            className="flex-1 w-full p-4 border-none focus:outline-none resize-none text-gray-800 placeholder-gray-400 bg-transparent transition-all custom-scrollbar"
          />
          
          {/* 输入区域底部 footer */}
          <div className="border-t border-gray-100 bg-transparent px-4 py-2 flex justify-between items-center">
            <span className="text-xs text-gray-500 flex items-center">
              <i className="fas fa-file-text mr-1.5 text-gray-400"></i>
              {text.length} 字符
            </span>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleTranslate}
                disabled={!text.trim()}
                loading={isTranslating}
                variant="primary"
                size="md"
                className="shadow-sm"
              >
                <i className="fas fa-language mr-2 text-sm"></i>
                翻译
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
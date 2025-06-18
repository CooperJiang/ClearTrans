'use client';

import { useState } from 'react';
import { useToast } from './Toast';
import Button from './Button';

interface OutputAreaProps {
  translationResult: { text: string; duration: number } | null;
  isTranslating?: boolean;
}

export default function OutputArea({ translationResult, isTranslating = false }: OutputAreaProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { error, success } = useToast();

  const handleCopy = async () => {
    if (translationResult?.text) {
      try {
        await navigator.clipboard.writeText(translationResult.text);
        setIsCopied(true);
        success('已复制到剪贴板');
        setTimeout(() => setIsCopied(false), 1000);
      } catch {
        error('复制失败');
      }
    }
  };

  const handleSpeak = () => {
    if (!translationResult?.text) return;

    if (!('speechSynthesis' in window)) {
      error('您的浏览器不支持语音朗读功能');
      return;
    }

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(translationResult.text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      error('语音朗读失败');
    };

    speechSynthesis.speak(utterance);
  };

  const handleDownload = () => {
    if (!translationResult?.text) return;
    
    const blob = new Blob([translationResult.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('文件下载成功');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-l border-gray-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <i className="fas fa-language mr-2 text-emerald-500"></i>
          翻译结果
        </h2>
        <div className="flex items-center space-x-1">
          <Button
            onClick={handleSpeak}
            disabled={!translationResult?.text}
            variant="secondary"
            size="sm"
            className="!bg-white/60 !border-white/40 !shadow-sm hover:!bg-white/80 transition-all duration-200 !px-2 !py-1.5 !text-xs"
          >
            <i className={`fas ${isSpeaking ? 'fa-stop text-red-500' : 'fa-volume-up text-cyan-600'} mr-1`}></i>
            {isSpeaking ? '停止' : '朗读'}
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!translationResult?.text}
            variant="secondary"
            size="sm"
            className="!bg-white/60 !border-white/40 !shadow-sm hover:!bg-white/80 transition-all duration-200 !px-2 !py-1.5 !text-xs"
          >
            <i className={`fas ${isCopied ? 'fa-check text-emerald-600' : 'fa-copy text-teal-600'} mr-1`}></i>
            复制
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!translationResult?.text}
            variant="secondary"
            size="sm"
            className="!bg-white/60 !border-white/40 !shadow-sm hover:!bg-white/80 transition-all duration-200 !px-2 !py-1.5 !text-xs"
          >
            <i className="fas fa-download mr-1 text-indigo-600"></i>
            下载
          </Button>
        </div>
      </div>
      
      <div className="flex-1 border-l border-gray-200 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/40 min-h-0 flex flex-col">
        <div className="flex-1 w-full p-4 min-h-0">
          {isTranslating ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">正在翻译中</h3>
                <div className="mb-6">
                  <div className="modern-progress-bar mb-3">
                    <div className="modern-progress-fill"></div>
                  </div>
                  <p className="text-sm text-emerald-600 flex items-center justify-center">
                    <i className="fas fa-sparkles mr-2"></i>
                    AI正在智能分析文本并生成高质量翻译
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          ) : translationResult ? (
            <div className="h-full overflow-y-auto enhanced-scrollbar">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100/80 p-6">
                <div className="translation-result-enhanced whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {translationResult.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 rounded-full flex items-center justify-center shadow-lg border border-white/60">
                  <i className="fas fa-language text-4xl text-emerald-500"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">等待翻译</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">输入内容后点击翻译，AI生成的结果将在这里显示</p>
                <div className="flex items-center justify-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 mt-4">
                  <i className="fas fa-robot mr-2 text-emerald-500"></i>
                  <span>AI驱动 • 智能理解上下文</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-100/60 bg-white/50 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mr-2 animate-pulse"></div>
            <span>AI智能翻译 • 高质量输出</span>
          </div>
          {translationResult && (
            <div className="flex items-center text-xs text-gray-500 bg-gray-50/80 px-2 py-1 rounded-full">
              <i className="fas fa-clock mr-1.5 text-gray-400"></i>
              <span>响应时间: {translationResult.duration}ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
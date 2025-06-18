'use client';

import { useState } from 'react';
import { useToast } from './Toast';
import Button from './Button';

interface OutputAreaProps {
  translationResult: { text: string; duration: number } | null;
}

export default function OutputArea({ translationResult }: OutputAreaProps) {
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 border-l border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <i className="fas fa-language mr-2 text-green-500"></i>
          翻译结果
          {translationResult && (
            <span className="ml-2 text-sm text-gray-500">
              ({translationResult.duration}ms)
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-gray-50 rounded-lg p-1">
            <Button
              onClick={handleSpeak}
              disabled={!translationResult?.text}
              variant="secondary"
              size="sm"
              className="!bg-transparent !border-none !shadow-none hover:!bg-white"
            >
              <i className={`fas ${isSpeaking ? 'fa-stop text-red-500' : 'fa-volume-up text-blue-500'} mr-2`}></i>
              {isSpeaking ? '停止' : '朗读'}
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!translationResult?.text}
              variant="secondary"
              size="sm"
              className="!bg-transparent !border-none !shadow-none hover:!bg-white"
            >
              <i className={`fas ${isCopied ? 'fa-check text-green-600' : 'fa-copy text-green-500'} mr-2`}></i>
              复制
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!translationResult?.text}
              variant="secondary"
              size="sm"
              className="!bg-transparent !border-none !shadow-none hover:!bg-white"
            >
              <i className="fas fa-download mr-2 text-purple-500"></i>
              下载
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 border-l border-gray-200">
        <div className="h-full w-full rounded-lg overflow-hidden">
          {translationResult ? (
            <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6 overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center text-sm text-blue-600">
                  <i className="fas fa-check-circle mr-2"></i>
                  <span>翻译完成</span>
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  {translationResult.duration}ms
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                  {translationResult.text}
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-blue-500">
                <i className="fas fa-sparkles mr-2"></i>
                <span>AI智能翻译 • 高质量输出</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <i className="fas fa-language text-2xl text-blue-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">等待翻译</h3>
                <p className="text-sm text-gray-500">翻译结果将在这里显示</p>
                <div className="mt-4 flex items-center justify-center text-xs text-gray-400">
                  <i className="fas fa-robot mr-2"></i>
                  <span>AI驱动 • 智能理解</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
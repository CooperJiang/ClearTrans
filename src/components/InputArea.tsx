'use client';

import { useState, useRef } from 'react';
import { translateText } from '../services/translateService';
import { useToast } from './Toast';
import Button from './Button';

interface InputAreaProps {
  onTranslate: (result: { text: string; duration: number } | null) => void;
  isTranslating: boolean;
}

export default function InputArea({ onTranslate, isTranslating }: InputAreaProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { error } = useToast();

  const handleTranslate = async () => {
    if (!text.trim()) {
      error('请输入要翻译的文本');
      return;
    }

    if (!localStorage.getItem('translateConfig')) {
      error('请先配置翻译设置');
      return;
    }

    onTranslate(null); // 开始翻译
    const startTime = Date.now();
    
    try {
      const result = await translateText(text);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        onTranslate({ text: result.data!, duration });
      } else {
        if (result.code === 'SERVER_NOT_CONFIGURED') {
          error('服务端没有配置默认模型，请在设置中切换到客户端模式并配置您的API密钥');
        } else {
          error(`翻译失败: ${result.error}`);
        }
        onTranslate(null);
      }
    } catch {
      error('翻译过程中发生错误');
      onTranslate(null);
    }
  };

  const handleClear = () => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
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
          <label className="relative inline-flex items-center cursor-pointer group">
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group-hover:shadow-sm">
              <i className="fas fa-cloud-upload-alt mr-2 text-blue-500"></i>
              <span>上传</span>
            </div>
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
          <Button
            onClick={handleClear}
            variant="secondary"
            size="sm"
          >
            <i className="fas fa-trash-alt mr-2"></i>
            清空
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4 flex flex-col">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请输入要翻译的文本..."
          className="flex-1 w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-gray-800 placeholder-gray-400 bg-gray-50 hover:bg-white transition-all"
        />
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            {text.length} 字符
          </span>
          
          <Button
            onClick={handleTranslate}
            disabled={!text.trim()}
            loading={isTranslating}
            variant="primary"
            size="md"
          >
            <i className="fas fa-language mr-2 text-sm"></i>
            翻译
          </Button>
        </div>
      </div>
    </div>
  );
} 
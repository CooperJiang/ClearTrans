'use client';

import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import ImageTranslateService from '@/services/translation/imageTranslateService';
import type { ImagePreview, ImageUploadProgress } from '@/types/imageTranslation';

interface ImageUploadAreaProps {
  onImageSelect: (image: ImagePreview | null) => void;
  onTranslate: (result: { originalText: string; translatedText: string; duration: number } | null) => void;
  currentImage: ImagePreview | null;
}

const ImageUploadArea = memo(function ImageUploadArea({
  onImageSelect,
  onTranslate,
  currentImage
}: ImageUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: showError, success: showSuccess } = useToast();

  const handleFileSelect = useCallback(async (file: File) => {
    // 防止重复处理同一个文件
    if (isProcessing && currentImage?.name === file.name) {
      return;
    }
    
    setIsProcessing(true);
    
    // 验证文件
    const validation = ImageTranslateService.validateImageFile(file);
    if (!validation.valid) {
      showError(validation.error || '文件验证失败');
      setIsProcessing(false);
      return;
    }

    try {
      // 模拟上传进度
      setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });
      
      // 读取文件
      const base64 = await ImageTranslateService.fileToBase64(file);
      
      // 创建图片预览
      const img = new Image();
      img.onload = () => {
        const imagePreview: ImagePreview = {
          file,
          url: base64,
          name: file.name,
          size: file.size,
          type: file.type,
          dimensions: {
            width: img.width,
            height: img.height
          }
        };
        
        setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 });
        setTimeout(() => {
          setUploadProgress(null);
          setIsProcessing(false);
          onImageSelect(imagePreview);
          showSuccess('图片上传成功');
        }, 300);
      };
      
      img.onerror = () => {
        setUploadProgress(null);
        setIsProcessing(false);
        showError('图片加载失败');
      };
      
      img.src = base64;

    } catch (error) {
      setUploadProgress(null);
      setIsProcessing(false);
      showError('文件处理失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [onImageSelect, showError, showSuccess, isProcessing, currentImage?.name]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClear = useCallback(() => {
    onImageSelect(null);
    onTranslate(null);
    setIsProcessing(false); // 重置处理状态
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageSelect, onTranslate]);

  // 处理剪贴板粘贴
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleFileSelect(file);
        }
        break;
      }
    }
  }, [handleFileSelect]);

  // 监听粘贴事件
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="fas fa-camera-retro mr-2 text-blue-500"></i>
            图片识别翻译
          </h2>
          {currentImage && (
            <Button
              onClick={handleClear}
              variant="danger"
              size="sm"
            >
              <i className="fas fa-trash-alt mr-2"></i>
              清除图片
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 bg-gradient-to-br from-blue-50/20 via-transparent to-indigo-50/10">
        {!currentImage ? (
          <div
            className={`
              h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer
              transition-all duration-300 min-h-[400px] relative overflow-hidden
              bg-white/50 backdrop-blur-sm
              ${isDragOver 
                ? 'border-blue-500 bg-gradient-to-br from-blue-100/80 to-indigo-100/60 scale-[1.02] shadow-2xl border-solid' 
                : 'border-gray-300/70 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/60 hover:to-indigo-50/30 hover:shadow-xl hover:scale-[1.01]'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleSelectClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {uploadProgress ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-600 mb-2">上传中...</p>
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {uploadProgress.percentage}%
                </p>
              </div>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 pointer-events-none"></div>
                {isDragOver && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/15 pointer-events-none animate-pulse"></div>
                )}
                <div className="relative z-10 max-w-sm mx-auto">
                  <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${isDragOver ? 'scale-110 shadow-2xl' : ''}`}>
                    <i className={`fas fa-cloud-upload-alt text-3xl text-white transition-all duration-300 ${isDragOver ? 'animate-bounce' : ''}`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">上传图片开始识别</h3>
                  <p className="text-gray-600 text-sm mb-6 text-center leading-relaxed">
                    拖拽图片到此处，点击选择文件，或使用 <kbd className="px-2 py-1 bg-gray-200/80 rounded text-xs font-mono shadow-sm">Ctrl+V</kbd> 粘贴图片
                  </p>
                  
                  <div className="grid grid-cols-3 gap-6 mb-8 text-center">
                    <div className="flex flex-col items-center group">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105">
                        <i className="fas fa-file-image text-green-600"></i>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">多格式支持</span>
                    </div>
                    <div className="flex flex-col items-center group">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105">
                        <i className="fas fa-weight-hanging text-blue-600"></i>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">≤10MB</span>
                    </div>
                    <div className="flex flex-col items-center group">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105">
                        <i className="fas fa-language text-purple-600"></i>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">多语言翻译</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleSelectClick}
                      variant="primary"
                      size="sm"
                    >
                      <i className="fas fa-folder-open mr-2"></i>
                      选择图片文件
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-full bg-white/70 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden shadow-xl">
            <div className="h-full flex flex-col">
              {/* 图片预览区域 */}
              <div className="flex-1 p-6 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-blue-50/20">
                <div className="max-w-full max-h-full group">
                  <img
                    src={currentImage.url}
                    alt={currentImage.name}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              </div>
              
              {/* 图片信息 */}
              <div className="border-t border-white/20 p-4 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center shadow-sm">
                      <i className="fas fa-image text-blue-600 text-lg"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 truncate max-w-[200px]" title={currentImage.name}>
                        {currentImage.name}
                      </p>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <i className="fas fa-weight-hanging mr-1 text-xs"></i>
                          {formatFileSize(currentImage.size)}
                        </span>
                        {currentImage.dimensions && (
                          <span className="flex items-center">
                            <i className="fas fa-expand-arrows-alt mr-1 text-xs"></i>
                            {currentImage.dimensions.width} × {currentImage.dimensions.height}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleSelectClick}
                      variant="secondary"
                      size="sm"
                    >
                      <i className="fas fa-exchange-alt mr-2"></i>
                      更换
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ImageUploadArea;
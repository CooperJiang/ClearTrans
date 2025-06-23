'use client';

import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import ImageTranslateService from '@/services/translation/imageTranslateService';
import type { ImagePreview, ImageUploadProgress } from '@/types/imageTranslation';

interface ImageUploadAreaProps {
  onImageSelect: (image: ImagePreview) => void;
  onTranslate: (result: { originalText: string; translatedText: string; duration: number } | null) => void;
  isTranslating: boolean;
  currentImage: ImagePreview | null;
  targetLanguage?: string;
  sourceLanguage?: string;
}

const ImageUploadArea = memo(function ImageUploadArea({
  onImageSelect,
  onTranslate,
  isTranslating,
  currentImage,
  targetLanguage,
  sourceLanguage
}: ImageUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: showError, success: showSuccess } = useToast();

  const handleFileSelect = useCallback(async (file: File) => {
    // 防止重复处理
    if (isProcessing) {
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
  }, [onImageSelect, showError, showSuccess, isProcessing]);

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
    onImageSelect(null as any);
    onTranslate(null);
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
      <div className="p-4 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="fas fa-image mr-2 text-blue-500"></i>
            图片上传
          </h2>
          {currentImage && (
            <Button
              onClick={handleClear}
              variant="secondary"
              size="sm"
              className="!bg-gray-50 !border-gray-200 !shadow-sm hover:!bg-gray-100 transition-all duration-200 !px-3 !py-1.5 !text-xs"
            >
              <i className="fas fa-trash-alt mr-1.5 text-gray-500"></i>
              清除
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 bg-gray-50/30">
        {!currentImage ? (
          <div
            className={`
              h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer
              transition-all duration-200 min-h-[400px]
              ${isDragOver 
                ? 'border-blue-400 bg-blue-50/50' 
                : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/20'
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
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-cloud-upload-alt text-3xl text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">上传图片进行翻译</h3>
                <p className="text-gray-600 mb-4 text-center max-w-sm">
                  拖拽图片到此处，或点击选择文件
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  支持 JPEG、PNG、GIF、WebP 格式，最大 10MB
                </p>
                <Button 
                  variant="primary"
                  className="!px-6 !py-3"
                >
                  <i className="fas fa-folder-open mr-2"></i>
                  选择图片
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* 图片预览区域 */}
              <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
                <div className="max-w-full max-h-full">
                  <img
                    src={currentImage.url}
                    alt={currentImage.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              </div>
              
              {/* 图片信息 */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-image text-blue-600"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 truncate max-w-[200px]" title={currentImage.name}>
                        {currentImage.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(currentImage.size)}
                        {currentImage.dimensions && (
                          <span className="ml-2">
                            {currentImage.dimensions.width} × {currentImage.dimensions.height}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleSelectClick}
                      variant="secondary"
                      size="sm"
                      className="!px-3 !py-1.5 !text-xs"
                    >
                      <i className="fas fa-exchange-alt mr-1"></i>
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
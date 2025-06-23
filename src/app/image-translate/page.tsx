'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, Footer, FloatingButtons } from '@/components/layout';
import { LanguageSelector, LanguageProvider, useLanguage } from '@/components/features';
import { ConfigSidebar, ServerConfigDialog } from '@/components/features';
import { ToastContainer, useToast, toastManager } from '@/components/ui';
import ImageUploadArea from '@/components/features/ImageUploadArea';
import ImageTranslationResult from '@/components/features/ImageTranslationResult';
import { initImageTranslateService, translateImage } from '@/services/translation/imageTranslateService';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage/secureStorage';
import type { TranslationConfig } from '@/types/translation';
import type { ImagePreview, ImageTranslationResult } from '@/types/imageTranslation';

function ImageTranslatePage() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImagePreview | null>(null);
  const [translationResult, setTranslationResult] = useState<ImageTranslationResult | null>(null);
  const [autoSwitchToClient, setAutoSwitchToClient] = useState(false);
  const [showServerConfigDialog, setShowServerConfigDialog] = useState(false);
  const [lastTranslatedImage, setLastTranslatedImage] = useState<string | null>(null);

  const { toasts, closeToast } = useToast();
  const { sourceLanguage, targetLanguage, setTargetLanguage } = useLanguage();

  // 注册全局loading关闭处理器
  useEffect(() => {
    const unregister = toastManager.registerLoadingHandler(() => {
      setIsTranslating(false);
    });
    return unregister;
  }, []);

  // 初始化图片翻译服务
  useEffect(() => {
    // 检查是否存在翻译配置
    if (!SecureStorage.has(STORAGE_KEYS.TRANSLATE_CONFIG)) {
      const defaultConfig: TranslationConfig = {
        provider: 'openai',
        apiKey: '',
        baseURL: '',
        model: 'gpt-4o', // 图片翻译需要支持vision的模型
        maxTokens: 4096,
        systemMessage: '',
        useServerSide: true,
        streamTranslation: false
      };
      
      SecureStorage.set(STORAGE_KEYS.TRANSLATE_CONFIG, defaultConfig);
    }

    const config = SecureStorage.get<TranslationConfig>(STORAGE_KEYS.TRANSLATE_CONFIG);
    if (config) {
      initImageTranslateService(config);
    }
  }, []);

  const handleImageSelect = useCallback((image: ImagePreview | null) => {
    setCurrentImage(image);
    if (!image) {
      setTranslationResult(null);
      setLastTranslatedImage(null);
    }
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!currentImage || isTranslating) {
      return;
    }

    // 防止重复翻译同一张图片
    if (lastTranslatedImage === currentImage.name) {
      return;
    }

    setIsTranslating(true);
    setTranslationResult(null);

    try {
      const result = await translateImage(
        currentImage.url,
        targetLanguage || 'zh',
        sourceLanguage !== 'auto' ? sourceLanguage : undefined
      );

      if (result.success && result.originalText !== undefined && result.translatedText !== undefined) {
        setTranslationResult({
          originalText: result.originalText,
          translatedText: result.translatedText,
          duration: 0 // 这里可以从API返回中获取实际时间
        });
        setLastTranslatedImage(currentImage.name);
      } else {
        if (result.code === 'SERVER_NOT_CONFIGURED') {
          setShowServerConfigDialog(true);
        } else {
          // showError通过toastManager处理
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [currentImage, targetLanguage, sourceLanguage, isTranslating, lastTranslatedImage]);

  // 自动翻译（当选择图片后）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (currentImage && !isTranslating && lastTranslatedImage !== currentImage.name) {
      // 添加短暂延迟避免重复调用
      timeoutId = setTimeout(() => {
        handleTranslate();
      }, 500);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentImage?.name, lastTranslatedImage]); // 依赖图片名称和上次翻译的图片

  const handleServerNotConfigured = useCallback(() => {
    setShowServerConfigDialog(true);
  }, []);

  const handleConfigClose = useCallback(() => {
    setIsConfigOpen(false);
    setAutoSwitchToClient(false);
    if (isTranslating) {
      setIsTranslating(false);
      setTranslationResult(null);
    }
  }, [isTranslating]);

  const handleConfirmServerConfig = useCallback(() => {
    setShowServerConfigDialog(false);
    setAutoSwitchToClient(true);
    setIsConfigOpen(true);
  }, []);

  const handleCancelServerConfig = useCallback(() => {
    setShowServerConfigDialog(false);
    setIsTranslating(false);
    setTranslationResult(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex flex-col">
      <Header onConfigClick={() => setIsConfigOpen(true)} />
      
      <main className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-6">
        <div className="bg-white/70 backdrop-blur-sm shadow-xl border border-white/20 mx-4 my-6 rounded-2xl overflow-hidden translation-container flex flex-col">
          <LanguageSelector />
          
          <div className="flex flex-1 min-h-0 divide-x divide-gray-200/30">
            <div className="w-1/2 min-w-0 flex flex-col bg-gradient-to-br from-blue-50/30 to-transparent translation-side-panel">
              <ImageUploadArea
                onImageSelect={handleImageSelect}
                onTranslate={setTranslationResult}
                isTranslating={isTranslating}
                currentImage={currentImage}
                targetLanguage={targetLanguage}
                sourceLanguage={sourceLanguage}
              />
            </div>
            <div className="w-1/2 min-w-0 flex flex-col bg-gradient-to-br from-emerald-50/30 to-transparent translation-side-panel">
              <ImageTranslationResult
                result={translationResult}
                isTranslating={isTranslating}
                onTranslate={handleTranslate}
                hasImage={!!currentImage}
                targetLanguage={targetLanguage}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <FloatingButtons onHistoryClick={() => {}} />
      
      <ConfigSidebar 
        isOpen={isConfigOpen}
        onClose={handleConfigClose}
        onConfigSaved={() => {}}
        autoSwitchToClient={autoSwitchToClient}
      />

      <ServerConfigDialog
        isOpen={showServerConfigDialog}
        onClose={handleCancelServerConfig}
        onConfirm={handleConfirmServerConfig}
      />
      
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}

export default function ImageTranslatePageWithProvider() {
  return (
    <LanguageProvider>
      <ImageTranslatePage />
    </LanguageProvider>
  );
}
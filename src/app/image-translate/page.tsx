'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, Footer, FloatingButtons } from '@/components/layout';
import { LanguageSelector, LanguageProvider, useLanguage } from '@/components/features';
import { ConfigSidebar, ServerConfigDialog } from '@/components/features';
import { ToastContainer, useToast, toastManager } from '@/components/ui';
import ImageUploadArea from '@/components/features/ImageUploadArea';
import ImageTranslationResult from '@/components/features/ImageTranslationResult';
import { initImageTranslateService, getImageTranslateService } from '@/services/translation/imageTranslateService';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage/secureStorage';
import type { TranslationConfig } from '@/types/translation';
import type { ImagePreview, ImageTranslationResult as ImageTranslationResultType } from '@/types/imageTranslation';

function ImageTranslatePage() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImagePreview | null>(null);
  const [translationResult, setTranslationResult] = useState<ImageTranslationResultType | null>(null);
  const [streamTranslatedText, setStreamTranslatedText] = useState<string>('');
  const [autoSwitchToClient, setAutoSwitchToClient] = useState(false);
  const [showServerConfigDialog, setShowServerConfigDialog] = useState(false);
  const [lastTranslatedImage, setLastTranslatedImage] = useState<string | null>(null);

  const { toasts, closeToast } = useToast();
  const { sourceLanguage, targetLanguage } = useLanguage();

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
        streamTranslation: true
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
      setStreamTranslatedText('');
    } else {
      // 重置翻译记录，确保新图片能触发翻译
      setLastTranslatedImage(null);
      setTranslationResult(null);
      setStreamTranslatedText('');
    }
  }, []);

  const handleTranslate = useCallback(async (forceTranslate = false) => {
    if (!currentImage) {
      return;
    }

    const translationLanguage = targetLanguage || 'zh';
    const currentKey = currentImage.name + '_' + translationLanguage;
    
    // 检查是否已经翻译过
    if (!forceTranslate && lastTranslatedImage === currentKey) {
      return;
    }

    if (isTranslating && !forceTranslate) {
      return;
    }


    setIsTranslating(true);
    setTranslationResult(null);
    setStreamTranslatedText('');

    try {
      // 每次翻译时重新读取最新配置
      const latestConfig = SecureStorage.get<TranslationConfig>(STORAGE_KEYS.TRANSLATE_CONFIG);
      if (latestConfig) {
        initImageTranslateService(latestConfig);
      }
      
      const service = getImageTranslateService();
      if (!service) {
        throw new Error('Image translation service not initialized');
      }

      const result = await service.translateImage(
        {
          image: currentImage.url,
          targetLanguage: translationLanguage,
          sourceLanguage: sourceLanguage !== 'auto' ? sourceLanguage : undefined
        },
        // 流式进度回调
        (translatedText: string) => {
          // 直接更新流式翻译文本
          setStreamTranslatedText(translatedText);
        }
      );

      if (result.success && result.translatedText !== undefined) {
        setTranslationResult({
          translatedText: result.translatedText,
          duration: 0 // 这里可以从API返回中获取实际时间
        });
        setLastTranslatedImage(currentKey); // 使用计算后的key
        setStreamTranslatedText(''); // 清除流式内容
      } else {
        if (result.code === 'SERVER_NOT_CONFIGURED') {
          setShowServerConfigDialog(true);
        } else {
          // 显示具体的错误信息
          const errorMessage = result.error || '翻译失败，请重试';
          toastManager.error(errorMessage);
        }
      }
    } catch (error) {
      // 处理网络错误或其他异常
      const errorMessage = error instanceof Error ? error.message : '网络连接失败，请检查网络后重试';
      toastManager.error(errorMessage);
    } finally {
      setIsTranslating(false);
    }
  }, [currentImage, targetLanguage, sourceLanguage, isTranslating, lastTranslatedImage]);

  const handleRetranslate = useCallback(async () => {
    if (!currentImage) return;
    await handleTranslate(true); // 强制重新翻译
  }, [currentImage, handleTranslate]);

  // 自动翻译（当选择图片后）
  useEffect(() => {
    if (!currentImage) return;
    
    const timeoutId = setTimeout(() => {
      handleTranslate(); // handleTranslate内部已经有防重复逻辑
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [currentImage, handleTranslate]); // 监听整个currentImage对象
  
  // 当语言切换时触发翻译
  useEffect(() => {
    if (currentImage && translationResult) {
      const timeoutId = setTimeout(() => {
        handleTranslate(); // handleTranslate内部已经有防重复逻辑
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [targetLanguage, currentImage, translationResult, handleTranslate]); // 只依赖目标语言


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
                currentImage={currentImage}
              />
            </div>
            <div className="w-1/2 min-w-0 flex flex-col bg-gradient-to-br from-emerald-50/30 to-transparent translation-side-panel">
              <ImageTranslationResult
                result={translationResult}
                isTranslating={isTranslating}
                onTranslate={handleTranslate}
                onRetranslate={handleRetranslate}
                hasImage={!!currentImage}
                targetLanguage={targetLanguage}
                streamTranslatedText={streamTranslatedText}
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
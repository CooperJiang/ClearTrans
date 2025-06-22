'use client';

import { useState, useEffect } from 'react';
import { Header, Footer, FloatingButtons } from '@/components/layout';
import { 
  LanguageSelector, 
  LanguageProvider, 
  useLanguage,
  InputArea,
  OutputArea,
  ConfigSidebar,
  ServerConfigDialog,
  TranslationHistorySidebar
} from '@/components/features';
import { ToastContainer, useToast, toastManager } from '@/components/ui';

function HomeContent() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{ text: string; duration: number } | null>(null);
  const [autoSwitchToClient, setAutoSwitchToClient] = useState(false);
  const [showServerConfigDialog, setShowServerConfigDialog] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { toasts, closeToast } = useToast();
  const { sourceLanguage, setTargetLanguage, targetLanguage } = useLanguage();

  // 添加语言参数调试日志
  useEffect(() => {
    console.log('🏠 主页面语言参数状态:', {
      sourceLanguage,
      targetLanguage,
      sourceLanguageType: typeof sourceLanguage,
      targetLanguageType: typeof targetLanguage
    });
  }, [sourceLanguage, targetLanguage]);

  // 注册全局loading关闭处理器
  useEffect(() => {
    const unregister = toastManager.registerLoadingHandler(() => {
      console.log('Global loading handler called');
      setIsTranslating(false);
      setTranslationResult(null);
    });
    return unregister;
  }, []);

  const handleTranslate = async (result: { text: string; duration: number } | null) => {
    if (result === null) {
      // 开始翻译 - 只有在没有翻译中时才设置为true
      if (!isTranslating) {
        setIsTranslating(true);
        setTranslationResult(null);
      }
    } else {
      // 翻译完成或更新（流式翻译的中间状态）
      setTranslationResult(result);
      // 注意：这里不立即设置isTranslating为false，因为可能是流式翻译的中间状态
      // isTranslating的状态将由InputArea组件通过额外的信号来控制结束
    }
  };

  // 新增：专门处理翻译状态结束的函数
  const handleTranslationEnd = () => {
    setIsTranslating(false);
  };

  // 处理服务端未配置的情况
  const handleServerNotConfigured = () => {
    setShowServerConfigDialog(true);
  };

  const handleConfigClose = () => {
    setIsConfigOpen(false);
    setAutoSwitchToClient(false);
    // 如果仍在翻译状态，也要重置
    if (isTranslating) {
      setIsTranslating(false);
      setTranslationResult(null);
    }
  };

  const handleConfirmServerConfig = () => {
    setShowServerConfigDialog(false);
    setAutoSwitchToClient(true);
    setIsConfigOpen(true);
  };

  const handleCancelServerConfig = () => {
    setShowServerConfigDialog(false);
    // 取消时重置翻译状态
    setIsTranslating(false);
    setTranslationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex flex-col">
      <Header onConfigClick={() => setIsConfigOpen(true)} />
      
      <main className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-6">
        <div className="bg-white/70 backdrop-blur-sm shadow-xl border border-white/20 mx-4 my-6 rounded-2xl overflow-hidden translation-container flex flex-col">
          <LanguageSelector />
          
          <div className="flex flex-1 min-h-0 divide-x divide-gray-200/30">
            <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-blue-50/30 to-transparent">
              <InputArea 
                onTranslate={handleTranslate}
                onTranslationEnd={handleTranslationEnd}  
                isTranslating={isTranslating}
                onServerNotConfigured={handleServerNotConfigured}
                targetLanguage={targetLanguage}
                sourceLanguage={sourceLanguage}
                setTargetLanguage={setTargetLanguage}
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-emerald-50/30 to-transparent">
              <OutputArea 
                translationResult={translationResult} 
                isTranslating={isTranslating}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <FloatingButtons onHistoryClick={() => setIsHistoryOpen(true)} />
      
      <ConfigSidebar 
        isOpen={isConfigOpen}
        onClose={handleConfigClose}
        onConfigSaved={() => {
          console.log('API配置已保存');
        }}
        autoSwitchToClient={autoSwitchToClient}
      />

      <ServerConfigDialog
        isOpen={showServerConfigDialog}
        onClose={handleCancelServerConfig}
        onConfirm={handleConfirmServerConfig}
      />

      <TranslationHistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}

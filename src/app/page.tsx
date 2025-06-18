'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import LanguageSelector, { LanguageProvider, useLanguage } from '../components/LanguageSelector';
import InputArea from '../components/InputArea';
import OutputArea from '../components/OutputArea';
import FloatingButtons from '../components/FloatingButtons';
import Footer from '../components/Footer';
import ConfigSidebar from '../components/ConfigSidebar';
import ServerConfigDialog from '../components/ServerConfigDialog';
import { ToastContainer, useToast, toastManager } from '../components/Toast';

function HomeContent() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{ text: string; duration: number } | null>(null);
  const [autoSwitchToClient, setAutoSwitchToClient] = useState(false);
  const [showServerConfigDialog, setShowServerConfigDialog] = useState(false);
  const { toasts, closeToast } = useToast();
  const { sourceLanguage, getTargetLanguageName } = useLanguage();

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
    if (result === null && !isTranslating) {
      // 开始翻译
      setIsTranslating(true);
      setTranslationResult(null);
    } else {
      // 翻译完成
      setTranslationResult(result);
      setIsTranslating(false);
    }
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onConfigClick={() => setIsConfigOpen(true)} />
      
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        <div className="bg-white main-shadow mx-6 my-6 rounded-lg overflow-hidden translation-container flex flex-col">
          <LanguageSelector />
          
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <InputArea 
                onTranslate={handleTranslate}
                isTranslating={isTranslating}
                onServerNotConfigured={handleServerNotConfigured}
                targetLanguage={getTargetLanguageName()}
                sourceLanguage={sourceLanguage}
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <OutputArea translationResult={translationResult} isTranslating={isTranslating} />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <FloatingButtons />
      
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

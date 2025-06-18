'use client';

import { useState } from 'react';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import InputArea from '../components/InputArea';
import OutputArea from '../components/OutputArea';
import FloatingButtons from '../components/FloatingButtons';
import Footer from '../components/Footer';
import ConfigSidebar from '../components/ConfigSidebar';
import { ToastContainer, useToast } from '../components/Toast';

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{ text: string; duration: number } | null>(null);
  const { toasts, closeToast } = useToast();

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
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <OutputArea translationResult={translationResult} />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <FloatingButtons />
      
      <ConfigSidebar 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigSaved={() => {
          console.log('API配置已保存');
        }}
      />
      
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}

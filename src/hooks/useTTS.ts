import { useState, useEffect, useCallback } from 'react';
import { speakText, stopSpeaking, isSpeaking, initTTSService } from '@/services/tts';
import type { TTSConfig, TTSResponse } from '@/services/tts';
import type { TTSPlaybackState, TTSSettings, OpenAITTSSettings } from '@/types';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage';

export interface UseTTSReturn {
  // 状态
  playbackState: TTSPlaybackState;
  settings: TTSSettings;
  
  // 操作
  speak: (text: string, config?: TTSConfig) => Promise<TTSResponse>;
  stop: () => void;
  updateSettings: (newSettings: Partial<TTSSettings>) => void;
  
  // 工具函数
  isCurrentlyPlaying: () => boolean;
}

// 默认语音指令
const DEFAULT_VOICE_INSTRUCTIONS = 'As a professional language speaking teacher, you can adapt to various languages. Please read our content in a professional tone.';

const defaultSettings: OpenAITTSSettings = {
  provider: 'openai',
  voice: 'alloy',
  model: 'tts-1',
  speed: 1.0,
  enabled: true,
  useServerSide: false, // 开发环境默认使用客户端模式
  voiceInstructions: DEFAULT_VOICE_INSTRUCTIONS,
};

// 全局事件系统用于同步TTS设置
class TTSEventManager {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }
}

const ttsEventManager = new TTSEventManager();

export const useTTS = (): UseTTSReturn => {
  const [playbackState, setPlaybackState] = useState<TTSPlaybackState>({
    isPlaying: false,
    isLoading: false,
  });

  const [settings, setSettings] = useState<TTSSettings>(defaultSettings);
  const [forceUpdate, setForceUpdate] = useState(0);

  // 停止播放
  const stop = useCallback(() => {
    stopSpeaking();
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false,
      isLoading: false,
      currentText: undefined,
    }));
  }, []);

  // 订阅全局TTS设置变更事件
  useEffect(() => {
    const unsubscribe = ttsEventManager.subscribe(() => {
      // 强制重新读取设置
      const savedSettings = SecureStorage.get<TTSSettings>(STORAGE_KEYS.TTS_SETTINGS);
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
      setForceUpdate(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  // 初始化设置
  useEffect(() => {
    const savedSettings = SecureStorage.get<TTSSettings>(STORAGE_KEYS.TTS_SETTINGS);
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...savedSettings });
    }
  }, [forceUpdate]);

  // 初始化 TTS 服务
  useEffect(() => {
    const ttsConfig: TTSConfig = {
      voice: settings.voice,
      model: settings.model,
      speed: settings.speed,
      useServerSide: settings.useServerSide,
      voiceInstructions: 'voiceInstructions' in settings ? settings.voiceInstructions : undefined,
    };

    // 根据提供商添加对应的API配置
    if (settings.provider === 'openai') {
      ttsConfig.apiKey = 'apiKey' in settings ? settings.apiKey : undefined;
      ttsConfig.baseURL = 'baseURL' in settings ? settings.baseURL : undefined;
    } else if (settings.provider === 'gemini') {
      ttsConfig.geminiApiKey = 'geminiApiKey' in settings ? settings.geminiApiKey : undefined;
      ttsConfig.geminiBaseURL = 'geminiBaseURL' in settings ? settings.geminiBaseURL : undefined;
      ttsConfig.language = 'language' in settings ? settings.language : undefined;
      ttsConfig.format = 'format' in settings ? settings.format : undefined;
      ttsConfig.stylePrompt = 'stylePrompt' in settings ? settings.stylePrompt : undefined;
    }

    initTTSService(ttsConfig);
  }, [settings]);

  // 语音合成
  const speak = useCallback(async (text: string, config?: TTSConfig): Promise<TTSResponse> => {
    if (!settings.enabled) {
      return {
        success: false,
        error: 'TTS is disabled',
      };
    }

    if (!text.trim()) {
      return {
        success: false,
        error: 'Text is empty',
      };
    }

    // 如果正在播放，先停止
    if (playbackState.isPlaying) {
      stop();
    }

    setPlaybackState(prev => ({
      ...prev,
      isLoading: true,
      currentText: text,
      error: undefined,
    }));

    try {
      const mergedConfig: TTSConfig = {
        voice: settings.voice,
        model: settings.model,
        speed: settings.speed,
        useServerSide: settings.useServerSide,
        ...config,
      };

      // 根据提供商添加对应的参数
      if (settings.provider === 'openai') {
        mergedConfig.apiKey = 'apiKey' in settings ? settings.apiKey : undefined;
        mergedConfig.baseURL = 'baseURL' in settings ? settings.baseURL : undefined;
        mergedConfig.voiceInstructions = 'voiceInstructions' in settings ? settings.voiceInstructions : undefined;
      } else if (settings.provider === 'gemini') {
        mergedConfig.geminiApiKey = 'geminiApiKey' in settings ? settings.geminiApiKey : undefined;
        mergedConfig.geminiBaseURL = 'geminiBaseURL' in settings ? settings.geminiBaseURL : undefined;
        mergedConfig.language = 'language' in settings ? settings.language : undefined;
        mergedConfig.format = 'format' in settings ? settings.format : undefined;
        mergedConfig.stylePrompt = 'stylePrompt' in settings ? settings.stylePrompt : undefined;
      }

      const result = await speakText(text, mergedConfig);

      if (result.success) {
        setPlaybackState(prev => ({
          ...prev,
          isLoading: false,
          isPlaying: true,
          duration: result.duration,
          error: undefined,
        }));

        // 注意：播放完成状态会通过监听器自动更新，不需要手动 setTimeout

      } else {
        setPlaybackState(prev => ({
          ...prev,
          isLoading: false,
          isPlaying: false,
          error: result.error,
          currentText: undefined,
        }));
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('TTS speak error:', error);
      
      setPlaybackState(prev => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
        error: errorMessage,
        currentText: undefined,
      }));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [settings, playbackState.isPlaying, stop]);

  // 更新设置
  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings as TTSSettings);
    SecureStorage.set(STORAGE_KEYS.TTS_SETTINGS, updatedSettings);
    
    // 通知所有其他hook实例更新设置
    ttsEventManager.notify();
  }, [settings]);

  // 检查是否正在播放
  const isCurrentlyPlaying = useCallback(() => {
    return isSpeaking();
  }, []);

  // 监听播放状态变化
  useEffect(() => {
    const checkPlaybackStatus = () => {
      const actuallyPlaying = isSpeaking();
      
      // 如果实际播放状态与当前状态不一致，更新状态
      if (playbackState.isPlaying !== actuallyPlaying) {
        
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: actuallyPlaying,
          isLoading: false, // 确保加载状态被清除
          currentText: actuallyPlaying ? prev.currentText : undefined,
          error: actuallyPlaying ? undefined : prev.error, // 播放时清除错误
        }));
      }
    };

    const interval = setInterval(checkPlaybackStatus, 300); // 更频繁的检查
    return () => clearInterval(interval);
  }, [playbackState.isPlaying, playbackState.isLoading]);

  return {
    playbackState,
    settings,
    speak,
    stop,
    updateSettings,
    isCurrentlyPlaying,
  };
}; 
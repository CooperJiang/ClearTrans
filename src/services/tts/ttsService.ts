/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TTS (Text-to-Speech) 服务
 * 支持 OpenAI 和 Gemini TTS API 进行语音合成
 */

import type { TTSVoice, TTSModel, GeminiTTSModel } from '@/types/tts';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage/secureStorage';
import type { TranslateConfig } from '@/types';

export interface TTSConfig {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number; // 0.25 - 4.0
  useServerSide?: boolean;
  // OpenAI 参数
  apiKey?: string;
  baseURL?: string;
  voiceInstructions?: string; // 仅适用于 gpt-4o-mini-tts 模型
  // Gemini 参数
  geminiApiKey?: string;
  geminiBaseURL?: string;
  language?: string;
  format?: 'mp3' | 'wav';
  stylePrompt?: string; // Gemini风格控制
}

export interface TTSRequest {
  text: string;
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number;
  voiceInstructions?: string;
  language?: string;
  format?: 'mp3' | 'wav';
  stylePrompt?: string;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
  duration?: number;
}

// 检测TTS提供商
function detectTTSProvider(model: TTSModel): 'openai' | 'gemini' {
  const geminiModels: GeminiTTSModel[] = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
  return geminiModels.includes(model as GeminiTTSModel) ? 'gemini' : 'openai';
}

class TTSService {
  private defaultConfig: TTSConfig = {
    voice: 'alloy',
    model: 'tts-1',
    speed: 1.0,
    useServerSide: false,
    language: 'zh-CN',
    format: 'mp3'
  };

  private audioCache = new Map<string, string>();
  private currentAudio: HTMLAudioElement | null = null;

  constructor(config?: TTSConfig) {
    if (config) {
      this.defaultConfig = { ...this.defaultConfig, ...config };
    }
  }

  /**
   * 语音合成
   */
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const startTime = Date.now();
    
    try {
      // 合并配置
      const config: TTSConfig = {
        ...this.defaultConfig,
        voice: request.voice || this.defaultConfig.voice,
        model: request.model || this.defaultConfig.model,
        speed: request.speed || this.defaultConfig.speed,
        voiceInstructions: request.voiceInstructions || this.defaultConfig.voiceInstructions,
        language: request.language || this.defaultConfig.language,
        format: request.format || this.defaultConfig.format,
        stylePrompt: request.stylePrompt || this.defaultConfig.stylePrompt,
      };

      // 检查缓存
      const cacheKey = `${request.text}-${config.voice}-${config.model}-${config.speed}`;
      if (this.audioCache.has(cacheKey)) {
        return {
          success: true,
          audioUrl: this.audioCache.get(cacheKey)!,
          duration: Date.now() - startTime,
        };
      }

      // 从存储中获取API密钥
      const savedConfig = SecureStorage.get<TranslateConfig>(STORAGE_KEYS.TRANSLATE_CONFIG);
      const provider = detectTTSProvider(config.model!);
      
      let apiConfig: {
        apiKey?: string;
        baseURL?: string;
        geminiApiKey?: string;
        geminiBaseURL?: string;
      } = {};

      if (provider === 'openai') {
        apiConfig = {
          apiKey: config.apiKey || (savedConfig as any)?.apiKey,
          baseURL: config.baseURL || (savedConfig as any)?.baseURL,
        };
      } else if (provider === 'gemini') {
        apiConfig = {
          geminiApiKey: config.geminiApiKey || (savedConfig as any)?.geminiApiKey,
          geminiBaseURL: config.geminiBaseURL || (savedConfig as any)?.geminiBaseURL,
        };
      }

      // 第一步：POST 请求存储配置，获取 UUID
      const requestBody = {
        text: request.text,
        voice: config.voice,
        model: config.model,
        speed: config.speed,
        voiceInstructions: config.voiceInstructions,
        language: config.language,
        format: config.format,
        stylePrompt: config.stylePrompt,
        userConfig: apiConfig,
      };

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.audioUrl) {
        throw new Error('Failed to get TTS URL');
      }

      // 第二步：使用返回的 audioUrl（包含 UUID）作为音频源
      const audioUrl = result.audioUrl; // 格式: /api/tts/{uuid}

      // 缓存音频 URL
      this.audioCache.set(cacheKey, audioUrl);

      return {
        success: true,
        audioUrl,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      console.error('TTS generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 播放语音
   */
  async playAudio(audioUrl: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // 停止当前播放
      this.stopAudio();

      // 先尝试获取音频信息
      try {
        const headResponse = await fetch(audioUrl, { method: 'HEAD' });
        
        if (!headResponse.ok) {
          throw new Error(`音频URL返回 ${headResponse.status}`);
        }
      } catch (error) {
        console.error('❌ 音频URL检查失败:', error);
        reject(new Error(`Audio URL check failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        return;
      }

      // 创建新的音频元素
      this.currentAudio = new Audio();
      
      // 设置音频属性
      this.currentAudio.preload = 'auto';
      this.currentAudio.volume = 1.0;
      this.currentAudio.crossOrigin = 'anonymous';
      
      // 设置事件处理器
      this.currentAudio.onended = () => {
        resolve();
      };

      this.currentAudio.onerror = (e) => {
        reject(new Error(`Audio playback error: ${e}`));
      };

      // 设置音频源并播放
      this.currentAudio.src = audioUrl;
      
      try {
        await this.currentAudio.play();
      } catch (error) {
        console.error('❌ 音频播放失败:', error);
        reject(new Error(`Audio play failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * 停止播放
   */
  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * 检查是否正在播放
   */
  isPlaying(): boolean {
    return !!(this.currentAudio && !this.currentAudio.paused);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(text: string, config: TTSConfig): string {
    return `${text}-${config.voice}-${config.model}-${config.speed}`;
  }

  /**
   * 合成并播放文本
   */
  async speakText(request: TTSRequest): Promise<TTSResponse> {
    const result = await this.generateSpeech(request);
    
    if (result.success && result.audioUrl) {
      try {
        await this.playAudio(result.audioUrl);
      } catch (error) {
        result.success = false;
        result.error = `播放失败: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
    
    return result;
  }
}

// 单例模式
let ttsServiceInstance: TTSService | null = null;

export const getTTSService = (): TTSService => {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService();
  }
  return ttsServiceInstance;
};

export const initTTSService = (config?: TTSConfig): TTSService => {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService(config);
  } else if (config) {
    ttsServiceInstance = new TTSService(config);
  }
  return ttsServiceInstance;
};

export const speakText = async (text: string, config?: TTSConfig): Promise<TTSResponse> => {
  const service = getTTSService();
  
  const request: TTSRequest = {
    text,
    ...config
  };
  
  return await service.speakText(request);
};

export const stopSpeaking = (): void => {
  const service = getTTSService();
  service.stopAudio();
};

export const isSpeaking = (): boolean => {
  const service = getTTSService();
  return service.isPlaying();
}; 
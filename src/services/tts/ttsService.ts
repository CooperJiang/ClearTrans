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

      console.log('TTS 请求配置:', {
        voice: config.voice,
        model: config.model,
        speed: config.speed,
        provider: detectTTSProvider(config.model!),
        useServerSide: config.useServerSide,
        textLength: request.text.length,
        language: config.language,
        format: config.format,
        hasStylePrompt: !!config.stylePrompt
      });

      // 检查缓存
      const cacheKey = `${request.text}-${config.voice}-${config.model}-${config.speed}`;
      if (this.audioCache.has(cacheKey)) {
        console.log('使用缓存的音频');
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
          apiKey: config.apiKey || savedConfig?.apiKey,
          baseURL: config.baseURL || savedConfig?.baseURL,
        };
      } else if (provider === 'gemini') {
        apiConfig = {
          geminiApiKey: config.geminiApiKey || savedConfig?.geminiApiKey,
          geminiBaseURL: config.geminiBaseURL || savedConfig?.geminiBaseURL,
        };
      }

      console.log('TTS API 配置:', {
        provider,
        hasApiKey: !!(apiConfig.apiKey || apiConfig.geminiApiKey),
        baseURL: apiConfig.baseURL || apiConfig.geminiBaseURL
      });

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

      console.log('发送TTS请求:', {
        ...requestBody,
        text: requestBody.text.substring(0, 50) + (requestBody.text.length > 50 ? '...' : ''),
        userConfig: {
          hasApiKey: !!(apiConfig.apiKey || apiConfig.geminiApiKey),
          baseURL: apiConfig.baseURL || apiConfig.geminiBaseURL
        }
      });

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
    console.log('🎵 开始播放音频:', audioUrl);
    
    return new Promise((resolve, reject) => {
      // 停止当前播放
      this.stopAudio();

      // 创建新的音频元素
      this.currentAudio = new Audio();
      
      // 设置音频属性
      this.currentAudio.preload = 'auto';
      this.currentAudio.volume = 1.0;
      this.currentAudio.crossOrigin = 'anonymous';
      
      // 添加更多调试信息
      this.currentAudio.onloadstart = () => {
        console.log('🎵 音频开始加载');
      };

      this.currentAudio.onloadeddata = () => {
        console.log('🎵 音频数据加载完成');
      };

      this.currentAudio.oncanplay = () => {
        console.log('🎵 音频可以开始播放');
      };

      this.currentAudio.oncanplaythrough = () => {
        console.log('🎵 音频可以流畅播放');
      };

      this.currentAudio.onplay = () => {
        console.log('🎵 音频开始播放');
      };

      this.currentAudio.onplaying = () => {
        console.log('🎵 音频正在播放');
      };

      this.currentAudio.onpause = () => {
        console.log('🎵 音频暂停');
      };
      
      // 事件监听器
      this.currentAudio.onended = () => {
        console.log('🎵 音频播放完成');
        this.currentAudio = null;
        resolve();
      };

      this.currentAudio.onerror = () => {
        const audio = this.currentAudio;
        console.error('❌ 音频播放错误');
        
        if (audio && audio.error) {
          let errorMsg = 'Unknown audio error';
          switch(audio.error.code) {
            case audio.error.MEDIA_ERR_ABORTED:
              errorMsg = 'Audio loading was aborted';
              break;
            case audio.error.MEDIA_ERR_NETWORK:
              errorMsg = 'Network error while loading audio';
              break;
            case audio.error.MEDIA_ERR_DECODE:
              errorMsg = 'Audio decoding error - 音频格式可能不支持';
              break;
            case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = 'Audio source not supported - 音频源不支持';
              break;
          }
          console.error('音频错误详情:', {
            code: audio.error.code,
            message: errorMsg,
            audioSrc: audio.src
          });
          this.currentAudio = null;
          reject(new Error(errorMsg));
        } else {
          console.error('未知音频播放错误');
          this.currentAudio = null;
          reject(new Error('Audio playback failed'));
        }
      };

      // 设置音频源并开始播放
      console.log('🎵 设置音频源:', audioUrl);
      this.currentAudio.src = audioUrl;
      
      // 尝试播放
      this.currentAudio.play()
        .then(() => {
          console.log('🎵 播放请求成功');
        })
        .catch((error) => {
          console.error('❌ 播放失败:', error);
          // 特殊处理自动播放被阻止的情况
          if (error.name === 'NotAllowedError') {
            console.warn('⚠️ 自动播放被浏览器阻止，需要用户交互');
            // 这种情况下不算错误，只是需要用户手动操作
          } else {
            console.error('播放错误详情:', {
              name: error.name,
              message: error.message,
              audioSrc: this.currentAudio?.src
            });
            this.currentAudio = null;
            reject(new Error(`Audio playback failed: ${error.message}`));
          }
        });
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
    return Boolean(this.currentAudio && !this.currentAudio.paused);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    // 释放所有 Blob URL
    for (const url of this.audioCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.audioCache.clear();
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(text: string, config: TTSConfig): string {
    return `${text}-${config.voice}-${config.model}-${config.speed}`;
  }

  /**
   * 语音合成并播放（一步完成）
   */
  async speakText(request: TTSRequest): Promise<TTSResponse> {
    const result = await this.generateSpeech(request);
    
    if (result.success && result.audioUrl) {
      try {
        await this.playAudio(result.audioUrl);
      } catch {
        return {
          ...result,
          success: false,
          error: 'Audio playback failed',
        };
      }
    }

    return result;
  }
}

// 全局 TTS 服务实例
let ttsServiceInstance: TTSService | null = null;

export const getTTSService = (): TTSService => {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService();
  }
  return ttsServiceInstance;
};

export const initTTSService = (config?: TTSConfig): TTSService => {
  const service = getTTSService();
  if (config) {
    service['defaultConfig'] = { ...service['defaultConfig'], ...config };
  }
  return service;
};

// 便捷函数
export const speakText = async (text: string, config?: TTSConfig): Promise<TTSResponse> => {
  const service = getTTSService();
  const request: TTSRequest = {
    text,
    voice: config?.voice,
    model: config?.model,
    speed: config?.speed,
    voiceInstructions: config?.voiceInstructions,
    language: config?.language,
    format: config?.format,
    stylePrompt: config?.stylePrompt,
  };
  return service.speakText(request);
};

export const stopSpeaking = (): void => {
  const service = getTTSService();
  service.stopAudio();
};

export const isSpeaking = (): boolean => {
  const service = getTTSService();
  return service.isPlaying();
}; 
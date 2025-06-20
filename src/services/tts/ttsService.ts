/**
 * TTS (Text-to-Speech) 服务
 * 使用 OpenAI TTS API 进行语音合成
 */

import type { TTSVoice, TTSModel } from '@/types/tts';

export interface TTSConfig {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number; // 0.25 - 4.0
  useServerSide?: boolean;
  apiKey?: string;
  baseURL?: string;
  voiceInstructions?: string; // 仅适用于 gpt-4o-mini-tts 模型
}

export interface TTSRequest {
  text: string;
  config?: TTSConfig;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
  duration?: number;
}

// 默认语音指令
const DEFAULT_VOICE_INSTRUCTIONS = 'As a professional language speaking teacher, you can adapt to various languages. Please read our content in a professional tone.';

class TTSService {
  private defaultConfig: TTSConfig = {
    voice: 'alloy',
    model: 'tts-1',
    speed: 1.0,
    useServerSide: false,
    voiceInstructions: DEFAULT_VOICE_INSTRUCTIONS,
  };

  private audioCache = new Map<string, string>();
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * 生成语音 - 两步流程：先获取 UUID，再使用 UUID 作为音频源
   */
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const startTime = Date.now();
    
    try {
      const config = { ...this.defaultConfig, ...request.config };
      
      // 检查缓存
      const cacheKey = this.getCacheKey(request.text, config);
      if (this.audioCache.has(cacheKey)) {
        return {
          success: true,
          audioUrl: this.audioCache.get(cacheKey)!,
          duration: Date.now() - startTime,
        };
      }

      // 获取 API 配置
      let apiConfig = null;
      
      // 优先使用传入的配置
      if (config.apiKey) {
        apiConfig = {
          apiKey: config.apiKey,
          baseURL: config.baseURL || 'https://api.openai.com',
        };
      } else {
        // 从翻译配置中获取 API 信息
        const translateConfig = localStorage.getItem('translateConfig');
        if (translateConfig) {
          try {
            const parsedConfig = JSON.parse(translateConfig);
            if (parsedConfig.apiKey) {
              apiConfig = {
                apiKey: parsedConfig.apiKey,
                baseURL: parsedConfig.baseURL || 'https://api.openai.com',
              };
            }
          } catch (error) {
            console.error('Failed to parse translate config:', error);
          }
        }
      }

      if (!apiConfig) {
        throw new Error('API key not found. Please configure your OpenAI API key in settings.');
      }

      // 第一步：POST 请求存储配置，获取 UUID
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          voice: config.voice,
          model: config.model,
          speed: config.speed,
          voiceInstructions: config.voiceInstructions,
          userConfig: apiConfig,
        }),
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
    return new Promise((resolve, reject) => {
      // 停止当前播放
      this.stopAudio();

      // 创建新的音频元素
      this.currentAudio = new Audio();
      
      // 设置音频属性
      this.currentAudio.preload = 'auto';
      this.currentAudio.volume = 1.0;
      this.currentAudio.crossOrigin = 'anonymous';
      
      // 事件监听器
      this.currentAudio.onended = () => {
        this.currentAudio = null;
        resolve();
      };

      this.currentAudio.onerror = () => {
        const audio = this.currentAudio;
        
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
              errorMsg = 'Audio decoding error';
              break;
            case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = 'Audio source not supported';
              break;
          }
          this.currentAudio = null;
          reject(new Error(errorMsg));
        } else {
          this.currentAudio = null;
          reject(new Error('Audio playback failed'));
        }
      };

      // 设置音频源并开始播放
      this.currentAudio.src = audioUrl;
      this.currentAudio.play()
        .then(() => {
          // 播放成功
        })
        .catch((error) => {
          // 特殊处理自动播放被阻止的情况
          if (error.name === 'NotAllowedError') {
            // 这种情况下不算错误，只是需要用户手动操作
          } else {
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
  return service.speakText({ text, config });
};

export const stopSpeaking = (): void => {
  const service = getTTSService();
  service.stopAudio();
};

export const isSpeaking = (): boolean => {
  const service = getTTSService();
  return service.isPlaying();
}; 
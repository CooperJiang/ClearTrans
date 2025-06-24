/**
 * 图片翻译服务
 */

import type { TranslationConfig } from '@/types/translation';
import { getUserConfig } from '@/utils/translationUtils';

export interface ImageTranslateRequest {
  image: string; // base64 encoded image
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface ImageTranslateResponse {
  translatedText: string;
  success: boolean;
  error?: string;
  code?: string;
  duration?: number;
}

class ImageTranslateService {
  private config: TranslationConfig;

  constructor(config: TranslationConfig) {
    this.config = config;
  }

  /**
   * 翻译图片中的文本
   */
  async translateImage(request: ImageTranslateRequest, onProgress?: (content: string) => void): Promise<ImageTranslateResponse> {
    const startTime = Date.now();
    
    try {
      // 验证图片格式
      if (!request.image.startsWith('data:image/')) {
        return {
          translatedText: '',
          success: false,
          error: '无效的图片格式，请上传正确的图片文件',
          duration: (Date.now() - startTime) / 1000
        };
      }

      // 构建请求体

      const requestBody = {
        image: request.image,
        targetLanguage: request.targetLanguage,
        sourceLanguage: request.sourceLanguage,
        provider: this.config.provider,
        useServerSide: this.config.useServerSide || false,
        streamTranslation: this.config.streamTranslation || false,
        ...(!this.config.useServerSide && {
          model: this.config.provider === 'openai' 
            ? this.getOpenAIModel() 
            : this.getGeminiModel(),
          userConfig: getUserConfig(this.config)
        })
      };

      const response = await fetch('/api/image-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `请求失败 (${response.status})`;
        
        if (response.status === 400) {
          errorMessage = '请求参数错误，请检查图片格式和大小';
        } else if (response.status === 401) {
          errorMessage = 'API密钥认证失败，请检查您的API密钥';
        } else if (response.status === 403) {
          errorMessage = 'API密钥无效或权限不足，请检查您的API密钥';
        } else if (response.status === 429) {
          errorMessage = 'API请求频率过高，请稍后再试';
        } else if (response.status === 500) {
          errorMessage = '服务器内部错误，请稍后再试';
        } else if (response.status === 502) {
          errorMessage = '网关错误，服务暂时不可用';
        } else if (response.status === 503) {
          errorMessage = '服务暂时不可用，请稍后再试';
        } else if (response.status === 504) {
          errorMessage = '请求超时，请稍后再试';
        }
        
        return {
          translatedText: '',
          success: false,
          error: errorMessage,
          duration: (Date.now() - startTime) / 1000
        };
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/plain') && this.config.streamTranslation) {
        // 处理流式响应
        return this.handleStreamResponse(response, startTime, onProgress);
      } else {
        // 处理非流式响应
        return this.handleNonStreamResponse(response, startTime);
      }

    } catch (error) {
      console.error('Image translation error:', error);
      return {
        translatedText: '',
        success: false,
        error: error instanceof Error ? error.message : '图片翻译失败，请重试',
        duration: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * 处理流式响应
   */
  private async handleStreamResponse(response: Response, startTime: number, onProgress?: (content: string) => void): Promise<ImageTranslateResponse> {
    try {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let translatedContent = '';

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一行可能是不完整的
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const deltaContent = parsed.choices[0].delta.content;
                translatedContent += deltaContent;
                
                // 立即调用进度回调，传递当前累积的翻译内容
                if (onProgress) {
                  onProgress(translatedContent);
                }
              }
            } catch (e) {
              console.warn('Parse error for line:', data, e);
              // 忽略解析错误，继续处理下一行
            }
          }
        }
      }
      
      return {
        translatedText: translatedContent.trim(),
        success: true,
        duration: (Date.now() - startTime) / 1000
      };

    } catch (error) {
      console.error('Stream processing error:', error);
      return {
        translatedText: '',
        success: false,
        error: '流式响应处理失败：' + (error instanceof Error ? error.message : '未知错误'),
        duration: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * 处理非流式响应
   */
  private async handleNonStreamResponse(response: Response, startTime: number): Promise<ImageTranslateResponse> {
    try {
      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        return {
          translatedText: '',
          success: false,
          error: '服务器返回了无效的响应格式',
          duration: (Date.now() - startTime) / 1000
        };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        return {
          translatedText: '',
          success: false,
          error: '服务器返回了无效的JSON格式',
          duration: (Date.now() - startTime) / 1000
        };
      }
      
      // 检查API返回格式
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const translatedText = data.choices[0].message.content.trim();
        
        return {
          translatedText,
          success: true,
          duration: (Date.now() - startTime) / 1000
        };
      }
      
      if (data.error) {
        return {
          translatedText: '',
          success: false,
          error: data.error,
          code: data.code,
          duration: (Date.now() - startTime) / 1000
        };
      }

      return {
        translatedText: '',
        success: false,
        error: '服务器返回了无效的响应格式',
        duration: (Date.now() - startTime) / 1000
      };

    } catch (error) {
      console.error('Non-stream processing error:', error);
      return {
        translatedText: '',
        success: false,
        error: '响应处理失败：' + (error instanceof Error ? error.message : '未知错误'),
        duration: (Date.now() - startTime) / 1000
      };
    }
  }


  /**
   * 获取OpenAI模型（确保支持vision）
   */
  private getOpenAIModel(): string {
    const config = this.config as import('@/types/translation').OpenAIConfig;
    const model = config.model;
    
    // 如果是支持vision的模型，直接使用
    if (model.includes('gpt-4') && (model.includes('vision') || model.includes('gpt-4o'))) {
      return model;
    }
    
    // 否则使用默认的vision模型
    return 'gpt-4o';
  }

  /**
   * 获取Gemini模型
   */
  private getGeminiModel(): string {
    const config = this.config as import('@/types/translation').GeminiConfig;
    return config.geminiModel || 'gemini-2.0-flash';
  }

  /**
   * 验证图片文件
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: '请选择图片文件' };
    }

    // 检查文件大小 (最大10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: '图片文件大小不能超过10MB' };
    }

    // 检查支持的格式
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: '支持的图片格式：JPEG、PNG、GIF、WebP' };
    }

    return { valid: true };
  }

  /**
   * 将文件转换为base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}

// 单例模式
let imageTranslateServiceInstance: ImageTranslateService | null = null;

export const initImageTranslateService = (config: TranslationConfig) => {
  imageTranslateServiceInstance = new ImageTranslateService(config);
  return imageTranslateServiceInstance;
};

export const getImageTranslateService = (): ImageTranslateService | null => {
  return imageTranslateServiceInstance;
};

export const translateImage = async (
  image: string, 
  targetLanguage: string, 
  sourceLanguage?: string
): Promise<{ success: boolean; translatedText?: string; error?: string; code?: string }> => {
  const service = getImageTranslateService();
  if (!service) {
    return { success: false, error: 'Image translation service not initialized' };
  }

  const result = await service.translateImage({ image, targetLanguage, sourceLanguage });
  if (result.success) {
    return { 
      success: true, 
      translatedText: result.translatedText 
    };
  } else {
    return { 
      success: false, 
      error: result.error,
      code: result.code 
    };
  }
};

export default ImageTranslateService;
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
  originalText: string;
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
  async translateImage(request: ImageTranslateRequest): Promise<ImageTranslateResponse> {
    const startTime = Date.now();
    
    try {
      // 验证图片格式
      if (!request.image.startsWith('data:image/')) {
        return {
          originalText: '',
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

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        return {
          originalText: '',
          translatedText: '',
          success: false,
          error: '服务器返回了无效的响应格式',
          duration: (Date.now() - startTime) / 1000
        };
      }

      if (!response.ok) {
        let errorMessage = `请求失败 (${response.status})`;
        
        if (response.status === 403) {
          errorMessage = 'API密钥无效或权限不足，请检查您的API密钥';
        } else if (response.status === 401) {
          errorMessage = 'API密钥认证失败，请检查您的API密钥';
        } else if (response.status === 429) {
          errorMessage = 'API请求频率过高，请稍后再试';
        } else if (response.status === 500) {
          errorMessage = '服务器内部错误，请稍后再试';
        }
        
        return {
          originalText: '',
          translatedText: '',
          success: false,
          error: errorMessage,
          duration: (Date.now() - startTime) / 1000
        };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        return {
          originalText: '',
          translatedText: '',
          success: false,
          error: '服务器返回了无效的JSON格式',
          duration: (Date.now() - startTime) / 1000
        };
      }
      
      // 检查API返回格式
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const content = data.choices[0].message.content;
        const { originalText, translatedText } = this.parseTranslationContent(content);
        
        return {
          originalText,
          translatedText,
          success: true,
          duration: (Date.now() - startTime) / 1000
        };
      }
      
      if (data.error) {
        return {
          originalText: '',
          translatedText: '',
          success: false,
          error: data.error,
          code: data.code,
          duration: (Date.now() - startTime) / 1000
        };
      }

      return {
        originalText: '',
        translatedText: '',
        success: false,
        error: '服务器返回了无效的响应格式',
        duration: (Date.now() - startTime) / 1000
      };

    } catch (error) {
      console.error('Image translation error:', error);
      return {
        originalText: '',
        translatedText: '',
        success: false,
        error: error instanceof Error ? error.message : '图片翻译失败，请重试',
        duration: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * 解析翻译内容
   */
  private parseTranslationContent(content: string): { originalText: string; translatedText: string } {
    try {
      // 如果没有找到文本
      if (content.includes('No text found in the image')) {
        return {
          originalText: '',
          translatedText: '图片中未发现可识别的文本'
        };
      }

      // 尝试解析标准格式
      const originalMatch = content.match(/\*\*Original Text:\*\*\s*\n([\s\S]*?)\n\*\*Translation/);
      const translationMatch = content.match(/\*\*Translation[^:]*:\*\*\s*\n([\s\S]*?)(?:\n\n|$)/);

      if (originalMatch && translationMatch) {
        return {
          originalText: originalMatch[1].trim(),
          translatedText: translationMatch[1].trim()
        };
      }

      // 如果格式不标准，尝试简单分割
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length >= 2) {
        const midPoint = Math.floor(lines.length / 2);
        return {
          originalText: lines.slice(0, midPoint).join('\n').trim(),
          translatedText: lines.slice(midPoint).join('\n').trim()
        };
      }

      // 如果都失败了，返回原始内容作为翻译结果
      return {
        originalText: '',
        translatedText: content.trim()
      };

    } catch (error) {
      console.error('Failed to parse translation content:', error);
      return {
        originalText: '',
        translatedText: content.trim()
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
): Promise<{ success: boolean; originalText?: string; translatedText?: string; error?: string; code?: string }> => {
  const service = getImageTranslateService();
  if (!service) {
    return { success: false, error: 'Image translation service not initialized' };
  }

  const result = await service.translateImage({ image, targetLanguage, sourceLanguage });
  if (result.success) {
    return { 
      success: true, 
      originalText: result.originalText,
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
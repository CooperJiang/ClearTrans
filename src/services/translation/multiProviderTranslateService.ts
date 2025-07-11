/**
 * 支持多种AI提供商的翻译服务
 */

import type { TranslationConfig, TranslationRequest, TranslationResponse } from '@/types/translation';
import { GeminiAdapter } from './geminiAdapter';
import { 
  buildTemplateVariables, 
  buildSystemInstruction, 
  buildTranslationRequestBody,
  isTTSModel,
  getModelFromConfig
} from '@/utils/translationUtils';

const DEFAULT_SYSTEM_MESSAGE = `You are a professional {{to}} native translator who needs to fluently translate text into {{to}}.

## Translation Rules
1. Output only the translated content, without explanations or additional content (such as "Here's the translation:" or "Translation as follows:")
2. The returned translation must maintain exactly the same number of paragraphs and format as the original text
3. If the text contains HTML tags, consider where the tags should be placed in the translation while maintaining fluency
4. For content that should not be translated (such as proper nouns, code, etc.), keep the original text.
5. If input contains %%, use %% in your output, if input has no %%, don't use %% in your 

## OUTPUT FORMAT:
- **Single paragraph input** → Output translation directly (no separators, no extra text)
- **Multi-paragraph input** → Use line break as paragraph separator between translations

## Examples
### Multi-paragraph Input:
Paragraph A

Paragraph B

Paragraph C

Paragraph D

### Multi-paragraph Output:
Translation A

Translation B

Translation C

Translation D

### Single paragraph Input:
Single paragraph content

### Single paragraph Output:
Direct translation without separators`;

class MultiProviderTranslateService {
  private config: TranslationConfig;
  private geminiAdapter?: GeminiAdapter;

  constructor(config: TranslationConfig) {
    this.config = {
      ...config,
      maxTokens: config.maxTokens || 4096,
      systemMessage: config.systemMessage || DEFAULT_SYSTEM_MESSAGE,
      useServerSide: config.useServerSide !== undefined ? config.useServerSide : true,
    };

    // 初始化对应的适配器
    if (config.provider === 'gemini') {
      this.initializeGeminiAdapter();
    }
  }

  private initializeGeminiAdapter() {
    if (this.config.provider === 'gemini') {
      const geminiConfig = this.config as import('@/types/translation').GeminiConfig;
      this.geminiAdapter = new GeminiAdapter({
        apiKey: geminiConfig.geminiApiKey,
        baseURL: geminiConfig.geminiBaseURL,
        model: geminiConfig.geminiModel,
        maxTokens: this.config.maxTokens,
        systemMessage: this.config.systemMessage,
        temperature: 0.3
      });
    }
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    
    try {
      // 验证模型类型
      const model = getModelFromConfig(this.config);
      if (isTTSModel(model)) {
        console.error('❌ 错误：正在使用TTS模型进行翻译！应该使用翻译模型');
        return {
          translatedText: '',
          success: false,
          error: '配置错误：不能使用TTS模型进行翻译，请选择正确的翻译模型',
          duration: (Date.now() - startTime) / 1000
        };
      }

      // 统一走API路由，确保参数正确传递
      return await this.translateViaAPI(request);

    } catch (error) {
      console.error('Translation error:', error);
      return {
        translatedText: '',
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
        duration: (Date.now() - startTime) / 1000
      };
    }
  }

  private async translateViaAPI(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    
    try {
      const templateVariables = buildTemplateVariables(
        request.targetLanguage || 'en',
        request.sourceLanguage,
        request.text
      );

      const systemInstruction = buildSystemInstruction(
        this.config.systemMessage || DEFAULT_SYSTEM_MESSAGE,
        templateVariables
      );

      const requestBody = buildTranslationRequestBody(
        request.text,
        this.config,
        templateVariables,
        systemInstruction
      );

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // 处理响应
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
        } else if (response.status === 404) {
          errorMessage = 'API端点不存在，请检查配置或联系管理员';
        }
        
        return {
          translatedText: '',
          success: false,
          error: errorMessage,
          duration: (Date.now() - startTime) / 1000
        };
      }

      const data = await response.json();
      
      // 检查是否是OpenAI兼容格式
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const translatedText = data.choices[0].message.content;
        
        return {
          translatedText,
          success: true,
          duration: (Date.now() - startTime) / 1000
        };
      }
      
      // 兼容旧格式（如果有的话）
      if (data.translatedText) {
        return {
          translatedText: data.translatedText,
          success: true,
          duration: (Date.now() - startTime) / 1000
        };
      }
      
      if (data.error || data.code) {
        let friendlyError = data.message || data.error || 'Server error';
        
        if (friendlyError.includes('API error')) {
          if (friendlyError.includes('403')) {
            friendlyError = 'API密钥无效或权限不足，请检查您的API密钥';
          } else if (friendlyError.includes('401')) {
            friendlyError = 'API密钥认证失败，请检查您的API密钥';
          } else if (friendlyError.includes('429')) {
            friendlyError = 'API请求频率过高，请稍后再试';
          } else if (friendlyError.includes('500')) {
            friendlyError = 'AI服务器内部错误，请稍后再试';
          } else {
            friendlyError = 'API调用失败，请检查网络连接和API密钥';
          }
        }
        
        return {
          translatedText: '',
          success: false,
          error: friendlyError,
          code: data.code,
          duration: (Date.now() - startTime) / 1000
        };
      }

      // 如果都没有，返回错误
      console.error('❌ 无法解析API响应格式:', data);
      return {
        translatedText: '',
        success: false,
        error: '服务器返回了无效的响应格式',
        duration: (Date.now() - startTime) / 1000
      };

    } catch (error) {
      console.error('API翻译请求失败:', error);
      return {
        translatedText: '',
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
        duration: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * 流式翻译方法
   */
  async streamTranslate(
    request: TranslationRequest,
    onProgress: (delta: string, fullContent: string) => void,
    onComplete: (fullContent: string, duration: number) => void,
    onError: (error: string, code?: string) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    try {
      // 统一走API路由
      return await this.streamTranslateViaAPI(request, onProgress, onComplete, onError, abortSignal);

    } catch (error) {
      console.error('Stream translation error:', error);
      onError(error instanceof Error ? error.message : 'Stream translation failed');
    }
  }

  private async streamTranslateViaAPI(
    request: TranslationRequest,
    onProgress: (delta: string, fullContent: string) => void,
    onComplete: (fullContent: string, duration: number) => void,
    onError: (error: string, code?: string) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (abortSignal?.aborted) {
        return;
      }

      const templateVariables = buildTemplateVariables(
        request.targetLanguage || 'en',
        request.sourceLanguage,
        request.text
      );

      const systemInstruction = buildSystemInstruction(
        this.config.systemMessage || DEFAULT_SYSTEM_MESSAGE,
        templateVariables
      );

      const requestBody = buildTranslationRequestBody(
        request.text,
        this.config,
        templateVariables,
        systemInstruction
      );

      // 使用流式API端点
      const response = await fetch('/api/translate/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 流式翻译API错误:', {
          status: response.status,
          error: errorData.error
        });
        onError(errorData.error || `HTTP ${response.status}`);
        return;
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // 处理换行分隔的数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              if (trimmedLine.startsWith('data: ')) {
                const jsonStr = trimmedLine.slice(6);
                if (jsonStr === '[DONE]') {
                  break;
                }
                
                const data = JSON.parse(jsonStr);
                
                // 统一处理格式 - 现在所有提供商都使用OpenAI兼容格式
                if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                  const delta = data.choices[0].delta.content;
                  fullContent += delta;
                  onProgress(delta, fullContent);
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE line:', trimmedLine, parseError);
            }
          }
        }

        const duration = (Date.now() - startTime) / 1000;
        onComplete(fullContent, duration);

      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onError('Translation cancelled');
      } else {
        console.error('流式翻译错误:', error);
        onError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  }
}

// 单例模式，可以在配置后复用
let translateServiceInstance: MultiProviderTranslateService | null = null;

export const initTranslateService = (config: TranslationConfig) => {
  translateServiceInstance = new MultiProviderTranslateService(config);
  return translateServiceInstance;
};

export const getTranslateService = (): MultiProviderTranslateService | null => {
  return translateServiceInstance;
};

export const translateText = async (text: string, targetLanguage?: string, sourceLanguage?: string): Promise<{ success: boolean; data?: string; error?: string; code?: string }> => {
  const service = getTranslateService();
  if (!service) {
    return { success: false, error: 'Translation service not initialized' };
  }

  const result = await service.translate({ text, targetLanguage, sourceLanguage });
  if (result.success) {
    return { success: true, data: result.translatedText };
  } else {
    if (result.code === 'SERVER_NOT_CONFIGURED') {
      return { 
        success: false, 
        error: result.error,
        code: 'SERVER_NOT_CONFIGURED'
      };
    }
    return { success: false, error: result.error };
  }
};

export const translateTextStream = async (
  text: string, 
  targetLanguage?: string, 
  sourceLanguage?: string,
  onProgress?: (delta: string, fullContent: string) => void,
  onComplete?: (fullContent: string, duration: number) => void,
  onError?: (error: string, code?: string) => void,
  abortSignal?: AbortSignal
): Promise<void> => {
  const service = getTranslateService();
  if (!service) {
    onError?.('Translation service not initialized');
    return;
  }

  await service.streamTranslate(
    { text, targetLanguage, sourceLanguage },
    onProgress || (() => {}),
    onComplete || (() => {}),
    onError || (() => {}),
    abortSignal
  );
};

export type { TranslationConfig, TranslationRequest, TranslationResponse };
export { DEFAULT_SYSTEM_MESSAGE };
export default MultiProviderTranslateService;
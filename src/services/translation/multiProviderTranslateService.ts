/**
 * 支持多种AI提供商的翻译服务
 */

import type { TranslateConfig, TranslateRequest, TranslateResponse } from '@/types';
import { GeminiAdapter } from './geminiAdapter';
import { getLanguageEnglishName } from '@/constants/languages';

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
  private config: TranslateConfig;
  private geminiAdapter?: GeminiAdapter;

  constructor(config: TranslateConfig) {
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
      this.geminiAdapter = new GeminiAdapter({
        apiKey: this.config.geminiApiKey,
        baseURL: this.config.geminiBaseURL,
        model: this.config.geminiModel,
        maxTokens: this.config.maxTokens,
        systemMessage: this.config.systemMessage,
        temperature: 0.3
      });
    }
  }

  // 参数替换辅助函数
  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    const startTime = Date.now();
    
    try {
      // 添加请求日志
      console.log('🔄 开始翻译请求:', {
        provider: this.config.provider,
        model: this.config.provider === 'openai' ? this.config.model : this.config.geminiModel,
        modelType: this.config.provider === 'gemini' ? '翻译模型' : 'OpenAI模型',
        useServerSide: this.config.useServerSide,
        text: request.text.substring(0, 100) + (request.text.length > 100 ? '...' : ''),
        targetLanguage: request.targetLanguage,
        sourceLanguage: request.sourceLanguage
      });

      // 验证Gemini模型类型
      if (this.config.provider === 'gemini') {
        const model = this.config.geminiModel;
        if (model.includes('tts')) {
          console.error('❌ 错误：正在使用TTS模型进行翻译！应该使用翻译模型');
          return {
            translatedText: '',
            success: false,
            error: '配置错误：不能使用TTS模型进行翻译，请选择正确的翻译模型',
            duration: (Date.now() - startTime) / 1000
          };
        }
        console.log('✅ 使用正确的Gemini翻译模型:', model);
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

  private async translateViaAPI(request: TranslateRequest): Promise<TranslateResponse> {
    const startTime = Date.now();
    
    try {
      // 构建提示词模板变量 - 使用英文名称
      const targetLanguageEnglish = getLanguageEnglishName(request.targetLanguage || 'en');
      const sourceLanguageEnglish = request.sourceLanguage && request.sourceLanguage !== 'auto' 
        ? getLanguageEnglishName(request.sourceLanguage) 
        : null;

      const templateVariables: Record<string, string> = {
        to: targetLanguageEnglish,
        text: request.text
      };

      console.log('🌐 普通翻译语言参数转换:', {
        originalTarget: request.targetLanguage,
        targetEnglish: targetLanguageEnglish,
        originalSource: request.sourceLanguage,
        sourceEnglish: sourceLanguageEnglish
      });

      // 替换系统消息中的参数
      const processedSystemMessage = this.replaceTemplateVariables(
        this.config.systemMessage || DEFAULT_SYSTEM_MESSAGE, 
        templateVariables
      );

      // 构建用户输入的prompt - 只包含原文，不包含翻译指令
      const userPrompt = request.text;

      // 构建系统消息 - 包含翻译指令和目标语言
      let systemInstruction = processedSystemMessage;
      if (sourceLanguageEnglish) {
        systemInstruction += `\n\nTranslate the following ${sourceLanguageEnglish} text to ${targetLanguageEnglish}. Output only the translation:`;
      } else {
        systemInstruction += `\n\nTranslate the following text to ${targetLanguageEnglish}. Output only the translation:`;
      }

      // 构建请求体
      const requestBody = {
        text: userPrompt,  // 原文
        provider: this.config.provider,
        model: this.config.provider === 'openai' ? this.config.model : this.config.geminiModel,
        maxTokens: this.config.maxTokens || 4096,
        systemMessage: systemInstruction,  // 包含翻译指令的系统消息
        targetLanguage: targetLanguageEnglish,  // 传递英文名称而不是代码
        useServerSide: this.config.useServerSide || false,
        userConfig: !this.config.useServerSide ? (
          this.config.provider === 'openai' ? {
            apiKey: this.config.apiKey,
            baseURL: this.config.baseURL
          } : {
            geminiApiKey: this.config.geminiApiKey,
            geminiBaseURL: this.config.geminiBaseURL
          }
        ) : undefined
      };

      console.log('📤 修复后的API请求详情:', {
        url: '/api/translate',
        provider: requestBody.provider,
        model: requestBody.model,
        targetLanguage: requestBody.targetLanguage,
        originalTargetCode: request.targetLanguage,
        userPromptLength: requestBody.text.length,
        systemMessageLength: requestBody.systemMessage.length,
        useServerSide: requestBody.useServerSide
      });

      if (this.config.provider === 'gemini') {
        console.log('🔍 Gemini客户端配置检查:', {
          geminiApiKey: this.config.geminiApiKey ? `${this.config.geminiApiKey.substring(0, 10)}...` : 'undefined',
          geminiBaseURL: this.config.geminiBaseURL || '默认URL',
          geminiModel: this.config.geminiModel,
          useServerSide: this.config.useServerSide
        });
      }

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // 添加响应日志
      console.log('📥 API响应状态:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        provider: this.config.provider
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
      
      // 添加响应数据日志
      console.log('📋 API响应数据:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices ? data.choices.length : 0,
        hasMessage: data.choices && data.choices[0] && data.choices[0].message,
        messageContent: data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null,
        rawData: data
      });
      
      // 检查是否是OpenAI兼容格式
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const translatedText = data.choices[0].message.content;
        console.log('✅ 成功解析OpenAI兼容格式响应:', {
          translatedLength: translatedText.length,
          usage: data.usage
        });
        
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
    request: TranslateRequest,
    onProgress: (delta: string, fullContent: string) => void,
    onComplete: (fullContent: string, duration: number) => void,
    onError: (error: string, code?: string) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    try {
      // 添加流式翻译日志
      console.log('🌊 开始流式翻译:', {
        provider: this.config.provider,
        model: this.config.provider === 'openai' ? this.config.model : this.config.geminiModel,
        useServerSide: this.config.useServerSide,
        textLength: request.text.length,
        targetLanguage: request.targetLanguage,
        sourceLanguage: request.sourceLanguage
      });

      // 统一走API路由
      return await this.streamTranslateViaAPI(request, onProgress, onComplete, onError, abortSignal);

    } catch (error) {
      console.error('Stream translation error:', error);
      onError(error instanceof Error ? error.message : 'Stream translation failed');
    }
  }

  private async streamTranslateViaAPI(
    request: TranslateRequest,
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

      // 构建提示词模板变量 - 使用英文名称
      const targetLanguageEnglish = getLanguageEnglishName(request.targetLanguage || 'en');
      const sourceLanguageEnglish = request.sourceLanguage && request.sourceLanguage !== 'auto' 
        ? getLanguageEnglishName(request.sourceLanguage) 
        : null;

      const templateVariables: Record<string, string> = {
        to: targetLanguageEnglish,
        text: request.text
      };

      console.log('🌐 语言参数转换:', {
        originalTarget: request.targetLanguage,
        targetEnglish: targetLanguageEnglish,
        originalSource: request.sourceLanguage,
        sourceEnglish: sourceLanguageEnglish
      });

      // 替换系统消息中的参数
      const processedSystemMessage = this.replaceTemplateVariables(
        this.config.systemMessage || DEFAULT_SYSTEM_MESSAGE, 
        templateVariables
      );

      // 构建用户输入的prompt - 只包含原文，不包含翻译指令
      const userPrompt = request.text;

      // 构建系统消息 - 包含翻译指令和目标语言
      let systemInstruction = processedSystemMessage;
      if (sourceLanguageEnglish) {
        systemInstruction += `\n\nTranslate the following ${sourceLanguageEnglish} text to ${targetLanguageEnglish}. Output only the translation:`;
      } else {
        systemInstruction += `\n\nTranslate the following text to ${targetLanguageEnglish}. Output only the translation:`;
      }

      // 构建请求体
      const requestBody = {
        text: userPrompt,  // 原文
        provider: this.config.provider,
        model: this.config.provider === 'openai' ? this.config.model : this.config.geminiModel,
        maxTokens: this.config.maxTokens || 4096,
        systemMessage: systemInstruction,  // 包含翻译指令的系统消息
        targetLanguage: targetLanguageEnglish,  // 传递英文名称而不是代码
        useServerSide: this.config.useServerSide || false,
        userConfig: !this.config.useServerSide ? (
          this.config.provider === 'openai' ? {
            apiKey: this.config.apiKey,
            baseURL: this.config.baseURL
          } : {
            geminiApiKey: this.config.geminiApiKey,
            geminiBaseURL: this.config.geminiBaseURL
          }
        ) : undefined
      };

      console.log('🌊 流式翻译API请求:', {
        provider: requestBody.provider,
        model: requestBody.model,
        targetLanguage: requestBody.targetLanguage,
        originalTargetCode: request.targetLanguage,
        userPromptLength: requestBody.text.length,
        systemMessageLength: requestBody.systemMessage.length,
        useServerSide: requestBody.useServerSide
      });

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
        console.log('✅ 流式翻译完成:', {
          provider: this.config.provider,
          duration,
          contentLength: fullContent.length
        });
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

  private async streamTranslateWithOpenAI(
    request: TranslateRequest,
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

      // 构建提示词模板变量 - 使用英文名称
      const targetLanguageEnglish = getLanguageEnglishName(request.targetLanguage || 'en');
      const sourceLanguageEnglish = request.sourceLanguage && request.sourceLanguage !== 'auto' 
        ? getLanguageEnglishName(request.sourceLanguage) 
        : null;

      const templateVariables: Record<string, string> = {
        to: targetLanguageEnglish,
        text: request.text
      };

      // 替换系统消息中的参数
      const processedSystemMessage = this.replaceTemplateVariables(
        this.config.systemMessage || DEFAULT_SYSTEM_MESSAGE, 
        templateVariables
      );

      // 构建用户输入的prompt - 只包含原文，不包含翻译指令
      const userPrompt = request.text;

      // 构建系统消息 - 包含翻译指令和目标语言
      let systemInstruction = processedSystemMessage;
      if (sourceLanguageEnglish) {
        systemInstruction += `\n\nTranslate the following ${sourceLanguageEnglish} text to ${targetLanguageEnglish}. Output only the translation:`;
      } else {
        systemInstruction += `\n\nTranslate the following text to ${targetLanguageEnglish}. Output only the translation:`;
      }

      // 构建请求体
      const requestBody = {
        text: userPrompt,  // 原文
        provider: this.config.provider,
        model: this.config.provider === 'openai' ? this.config.model : 'gpt-4o-mini',
        maxTokens: this.config.maxTokens || 4096,
        systemMessage: systemInstruction,  // 包含翻译指令的系统消息
        targetLanguage: targetLanguageEnglish,  // 传递英文名称而不是代码
        useServerSide: this.config.useServerSide || false,
        userConfig: !this.config.useServerSide && this.config.provider === 'openai' ? {
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL
        } : undefined
      };

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
        console.error('OpenAI stream translation error:', error);
        onError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  }
}

// 单例模式，可以在配置后复用
let translateServiceInstance: MultiProviderTranslateService | null = null;

export const initTranslateService = (config: TranslateConfig) => {
  translateServiceInstance = new MultiProviderTranslateService(config);
  return translateServiceInstance;
};

export const getTranslateService = (): MultiProviderTranslateService | null => {
  return translateServiceInstance;
};

export const translateText = async (text: string, targetLanguage?: string, sourceLanguage?: string): Promise<{ success: boolean; data?: string; error?: string; code?: string }> => {
  console.log('📞 translateText函数调用参数:', {
    text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    targetLanguage,
    sourceLanguage,
    targetLanguageType: typeof targetLanguage,
    sourceLanguageType: typeof sourceLanguage
  });

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
  console.log('📞 translateTextStream函数调用参数:', {
    text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    targetLanguage,
    sourceLanguage,
    targetLanguageType: typeof targetLanguage,
    sourceLanguageType: typeof sourceLanguage
  });

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

export type { TranslateConfig, TranslateRequest, TranslateResponse };
export { DEFAULT_SYSTEM_MESSAGE };
export default MultiProviderTranslateService; 
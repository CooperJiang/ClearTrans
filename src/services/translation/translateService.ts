import type { TranslateConfig, TranslateRequest, TranslateResponse } from '@/types';

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

class TranslateService {
  private config: TranslateConfig;

  constructor(config: TranslateConfig) {
    this.config = {
      ...config,
      model: config.model || 'gpt-4o-mini',
      maxTokens: config.maxTokens || 4096,
      systemMessage: config.systemMessage || DEFAULT_SYSTEM_MESSAGE,
      useServerSide: config.useServerSide !== undefined ? config.useServerSide : true,
    };
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
      // 构建提示词模板变量
      const templateVariables: Record<string, string> = {
        to: request.targetLanguage || 'English',
        text: request.text
      };

      // 替换系统消息中的参数
      const processedSystemMessage = this.replaceTemplateVariables(
        this.config.systemMessage || DEFAULT_SYSTEM_MESSAGE, 
        templateVariables
      );

      // 构建用户输入的prompt
      let userPrompt = `Translate to ${templateVariables.to} (output translation only):

${templateVariables.text}`;

      // 如果指定了源语言且不是自动检测，在prompt中明确说明
      if (request.sourceLanguage && request.sourceLanguage !== 'auto') {
        userPrompt = `Translate from ${request.sourceLanguage} to ${templateVariables.to} (output translation only):

${templateVariables.text}`;
      }

      // 构建请求体
      const requestBody: {
        text: string;
        model: string;
        maxTokens: number;
        systemMessage: string;
        targetLanguage?: string;
        useServerSide: boolean;
        userConfig?: {
          apiKey: string;
          baseURL?: string;
        };
      } = {
        text: userPrompt,
        model: this.config.model || 'gpt-4o-mini',
        maxTokens: this.config.maxTokens || 4096,
        systemMessage: processedSystemMessage,
        targetLanguage: request.targetLanguage,
        useServerSide: this.config.useServerSide || false
      };

      // 如果是客户端模式，传递用户的API配置
      if (!this.config.useServerSide) {
        requestBody.userConfig = {
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL
        };
      }

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // 首先检查HTTP状态码
      if (!response.ok) {
        // 处理非200状态码的错误
        let errorMessage = `请求失败 (${response.status})`;
        
        if (response.status === 403) {
          errorMessage = 'API密钥无效或权限不足，请检查您的OpenAI API密钥';
        } else if (response.status === 401) {
          errorMessage = 'API密钥认证失败，请检查您的OpenAI API密钥';
        } else if (response.status === 429) {
          errorMessage = 'API请求频率过高，请稍后再试';
        } else if (response.status === 500) {
          errorMessage = 'OpenAI服务器内部错误，请稍后再试';
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

      // HTTP状态码正常，解析JSON
      const data = await response.json();
      
      // 检查应用层错误（即使状态码是200）
      if (data.error || data.code) {
        console.log('data', data);
        // 提取更友好的错误信息
        let friendlyError = data.message || data.error || 'Server error';
        
        // 处理OpenAI API错误
        if (friendlyError.includes('OpenAI API error')) {
          if (friendlyError.includes('403')) {
            friendlyError = 'API密钥无效或权限不足，请检查您的OpenAI API密钥';
          } else if (friendlyError.includes('401')) {
            friendlyError = 'API密钥认证失败，请检查您的OpenAI API密钥';
          } else if (friendlyError.includes('429')) {
            friendlyError = 'API请求频率过高，请稍后再试';
          } else if (friendlyError.includes('500')) {
            friendlyError = 'OpenAI服务器内部错误，请稍后再试';
          } else {
            // 保留原始错误信息，但去掉技术细节
            friendlyError = 'API调用失败，请检查网络连接和API密钥';
          }
        }
        
        return {
          translatedText: '',
          success: false,
          error: friendlyError,
          code: data.code, // 传递错误代码
          duration: (Date.now() - startTime) / 1000
        };
      }

      // 一切正常，返回翻译结果
      const duration = Date.now() - startTime;
      return {
        translatedText: data.translatedText,
        success: true,
        duration: duration / 1000
      };

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
    const startTime = Date.now();
    
    try {
      // 检查是否已经中断
      if (abortSignal?.aborted) {
        return;
      }

      // 构建提示词模板变量
      const templateVariables: Record<string, string> = {
        to: request.targetLanguage || 'English',
        text: request.text
      };

      // 替换系统消息中的参数
      const processedSystemMessage = this.replaceTemplateVariables(
        this.config.systemMessage || DEFAULT_SYSTEM_MESSAGE, 
        templateVariables
      );

      // 构建用户输入的prompt
      let userPrompt = `Translate to ${templateVariables.to} (output translation only):

${templateVariables.text}`;

      // 如果指定了源语言且不是自动检测，在prompt中明确说明
      if (request.sourceLanguage && request.sourceLanguage !== 'auto') {
        userPrompt = `Translate from ${request.sourceLanguage} to ${templateVariables.to} (output translation only):

${templateVariables.text}`;
      }

      // 构建请求体
      const requestBody: {
        text: string;
        model: string;
        maxTokens: number;
        systemMessage: string;
        targetLanguage?: string;
        useServerSide: boolean;
        userConfig?: {
          apiKey: string;
          baseURL?: string;
        };
      } = {
        text: userPrompt,
        model: this.config.model || 'gpt-4o-mini',
        maxTokens: this.config.maxTokens || 4096,
        systemMessage: processedSystemMessage,
        targetLanguage: request.targetLanguage,
        useServerSide: this.config.useServerSide || false
      };

      // 如果是客户端模式，传递用户的API配置
      if (!this.config.useServerSide) {
        requestBody.userConfig = {
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL
        };
      }

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
          // 检查是否已经中断
          if (abortSignal?.aborted) {
            return;
          }

          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            // 再次检查是否已经中断
            if (abortSignal?.aborted) {
              return;
            }

            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (!data) continue;

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.error) {
                  onError(parsed.error, parsed.code);
                  return;
                }

                if (parsed.done) {
                  const duration = Date.now() - startTime;
                  onComplete(parsed.fullText || fullContent, duration);
                  return;
                }

                if (parsed.delta) {
                  fullContent = parsed.content || fullContent;
                  onProgress(parsed.delta, fullContent);
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        onError('Stream reading error');
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Stream translate error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

// 单例模式，可以在配置后复用
let translateServiceInstance: TranslateService | null = null;

export const initTranslateService = (config: TranslateConfig) => {
  translateServiceInstance = new TranslateService(config);
  return translateServiceInstance;
};

export const getTranslateService = (): TranslateService | null => {
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
    // 检查是否是服务端未配置的错误
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

/**
 * 流式翻译函数
 */
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

export { DEFAULT_SYSTEM_MESSAGE };
export type { TranslateConfig, TranslateRequest, TranslateResponse }; 
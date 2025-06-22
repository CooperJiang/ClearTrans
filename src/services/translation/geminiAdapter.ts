/**
 * Gemini AI 翻译服务适配器
 */

import type { TranslateRequest, TranslateResponse } from '@/types';

// Gemini API 请求接口
interface GeminiGenerateRequest {
  contents: {
    parts: { text: string }[];
  }[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    candidateCount?: number;
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
}

// Gemini API 响应接口
interface GeminiGenerateResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
    finishReason: string;
    index: number;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// Gemini配置接口
export interface GeminiConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}

/**
 * Gemini翻译适配器类
 */
export class GeminiAdapter {
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      maxTokens: 4096,
      temperature: 0.3,
      systemMessage: 'You are a professional translator.',
      ...config
    };
  }

  /**
   * 普通翻译
   */
  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    const startTime = Date.now();

    try {
      // 构建翻译prompt
      const translationPrompt = this.buildTranslationPrompt(request);

      // 构建API请求
      const apiRequest: GeminiGenerateRequest = {
        contents: [
          {
            parts: [{ text: translationPrompt }]
          }
        ],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
          candidateCount: 1
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // 调用Gemini API - 修复URL拼接问题，使用Bearer token认证
      const url = `${this.config.baseURL}/models/${this.config.model}:generateContent`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          translatedText: '',
          success: false,
          error: `Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
          duration: (Date.now() - startTime) / 1000
        };
      }

      const data: GeminiGenerateResponse = await response.json();

      // 检查响应数据
      if (!data.candidates || data.candidates.length === 0) {
        return {
          translatedText: '',
          success: false,
          error: 'No candidates returned from Gemini API',
          duration: (Date.now() - startTime) / 1000
        };
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        return {
          translatedText: '',
          success: false,
          error: 'No content returned from Gemini API',
          duration: (Date.now() - startTime) / 1000
        };
      }

      const translatedText = candidate.content.parts[0].text;

      return {
        translatedText,
        success: true,
        duration: (Date.now() - startTime) / 1000,
        tokensUsed: data.usageMetadata?.totalTokenCount
      };

    } catch (error) {
      console.error('Gemini translation error:', error);
      return {
        translatedText: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * 流式翻译
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
      // 构建翻译prompt
      const translationPrompt = this.buildTranslationPrompt(request);

      // 构建API请求
      const apiRequest: GeminiGenerateRequest = {
        contents: [
          {
            parts: [{ text: translationPrompt }]
          }
        ],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
          candidateCount: 1
        }
      };

      // 调用Gemini Stream API - 修复URL拼接问题，使用Bearer token认证
      const url = `${this.config.baseURL}/models/${this.config.model}:streamGenerateContent`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequest),
        signal: abortSignal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onError(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
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
          
          // 处理换行分隔的JSON数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              const jsonData: GeminiGenerateResponse = JSON.parse(trimmedLine);
              
              if (jsonData.candidates && jsonData.candidates.length > 0) {
                const candidate = jsonData.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                  const delta = candidate.content.parts[0].text;
                  fullContent += delta;
                  onProgress(delta, fullContent);
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse JSON line:', trimmedLine, parseError);
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
        console.error('Gemini stream translation error:', error);
        onError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  }

  /**
   * 构建翻译prompt
   */
  private buildTranslationPrompt(request: TranslateRequest): string {
    const { text, sourceLanguage, targetLanguage } = request;
    
    let prompt = this.config.systemMessage + '\n\n';
    
    if (sourceLanguage && sourceLanguage !== 'auto') {
      prompt += `Translate the following ${sourceLanguage} text to ${targetLanguage}:\n\n`;
    } else {
      prompt += `Translate the following text to ${targetLanguage}:\n\n`;
    }
    
    prompt += text;
    
    return prompt;
  }
}

export default GeminiAdapter; 
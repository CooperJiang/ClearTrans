import { BaseTranslationAdapter, TranslationRequest, TranslationResponse, StreamChunk, AdapterConfig } from './baseAdapter';

/**
 * 使用 Gemini 官方 OpenAI 兼容接口的适配器
 * 基于官方文档: https://ai.google.dev/gemini-api/docs/openai
 */
export class GeminiOpenAIAdapter extends BaseTranslationAdapter {
  constructor(config: AdapterConfig) {
    super(config);
    this.validateConfig();
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    // 使用官方 OpenAI 兼容端点
    const openaiCompatibleURL = this.getOpenAICompatibleURL();
    
    const response = await fetch(`${openaiCompatibleURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: 'system',
            content: request.systemMessage || `You are a professional ${request.targetLanguage || 'English'} native translator.`
          },
          {
            role: 'user',
            content: request.text
          }
        ],
        temperature: request.temperature || this.config.temperature,
        max_tokens: request.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      }
    };
  }

  async *translateStream(request: TranslationRequest): AsyncGenerator<StreamChunk, void, unknown> {
    // 使用官方 OpenAI 兼容端点
    const openaiCompatibleURL = this.getOpenAICompatibleURL();

    const response = await fetch(`${openaiCompatibleURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: 'system',
            content: request.systemMessage || `You are a professional ${request.targetLanguage || 'English'} native translator.`
          },
          {
            role: 'user',
            content: request.text
          }
        ],
        temperature: request.temperature || this.config.temperature,
        max_tokens: request.maxTokens,
        stream: true, // 启用流式
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let chunkIndex = 0;
    let lastChunkTime = Date.now();
    let isRealStream = false;
    let streamBuffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        chunkIndex++;
        const currentTime = Date.now();
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // 如果没有检测到真正的流式，进行智能分块
              if (!isRealStream && streamBuffer) {
                yield* this.simulateStreamFromContent(streamBuffer);
              }
              
              yield {
                content: '',
                isComplete: true,
                usage: {
                  totalTokens: fullContent.length
                }
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              
              if (delta) {
                fullContent += delta;
                streamBuffer += delta;
                
                // 检测是否为真正的流式：如果块之间有时间间隔，认为是真正的流式
                const timeDiff = currentTime - lastChunkTime;
                if (timeDiff > 50 && chunkIndex > 1) {
                  isRealStream = true;
                }
                
                // 如果是真正的流式，立即输出
                if (isRealStream || chunkIndex === 1) {
                  yield {
                    content: delta,
                    isComplete: false
                  };
                  streamBuffer = ''; // 清空缓冲区
                }
                
                lastChunkTime = currentTime;
              }
            } catch (parseError) {
              console.error('Gemini OpenAI兼容流式解析错误:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 从完整内容模拟流式输出
   */
  private async *simulateStreamFromContent(content: string): AsyncGenerator<StreamChunk, void, unknown> {
    // 智能分块
    const chunks = this.intelligentChunk(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      yield {
        content: chunk,
        isComplete: i === chunks.length - 1,
        usage: i === chunks.length - 1 ? {
          totalTokens: content.length
        } : undefined
      };
      
      // 添加小延迟，模拟真实流式体验
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
  }

  /**
   * 智能分块
   */
  private intelligentChunk(text: string): string[] {
    // 如果文本很短，直接返回
    if (text.length < 50) {
      return [text];
    }
    
    // 先尝试按段落分割
    const paragraphs = text.split(/\n\s*\n/);
    if (paragraphs.length > 1) {
      return paragraphs.filter(p => p.trim());
    }
    
    // 按句子分割
    const sentences = text.split(/(?<=[.!?])\s+/);
    if (sentences.length > 1) {
      return sentences.filter(s => s.trim());
    }
    
    // 如果没有明显的句子，按词分割
    return this.wordBasedChunk(text);
  }

  /**
   * 基于词的分块
   */
  private wordBasedChunk(text: string): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    const chunkSize = Math.max(5, Math.ceil(words.length / 5));
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    
    return chunks;
  }

  /**
   * 获取OpenAI兼容URL
   */
  private getOpenAICompatibleURL(): string {
    // 如果baseURL已经包含/openai，直接使用
    if (this.config.baseURL.includes('/openai')) {
      return this.config.baseURL;
    }
    
    // 否则，添加/openai路径
    return this.config.baseURL.replace(/\/+$/, '') + '/openai';
  }
} 
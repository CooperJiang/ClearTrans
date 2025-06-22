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
    console.log('🤖 Gemini OpenAI兼容普通翻译开始:', {
      model: request.model,
      textLength: request.text.length,
      baseURL: this.config.baseURL
    });

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

    console.log('✅ Gemini OpenAI兼容普通翻译完成:', {
      contentLength: content.length,
      usage: data.usage
    });

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
    const requestStartTime = Date.now();
    console.log('🌊 Gemini OpenAI兼容流式翻译开始:', {
      model: request.model,
      textLength: request.text.length,
      baseURL: this.config.baseURL,
      startTime: new Date(requestStartTime).toISOString()
    });

    // 使用官方 OpenAI 兼容端点
    const openaiCompatibleURL = this.getOpenAICompatibleURL();

    const fetchStartTime = Date.now();
    console.log('📡 开始发送请求到服务器:', {
      url: `${openaiCompatibleURL}/chat/completions`,
      fetchStartTime: new Date(fetchStartTime).toISOString()
    });

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

    const responseReceivedTime = Date.now();
    const requestToResponseTime = responseReceivedTime - fetchStartTime;
    console.log('📨 收到服务器响应:', {
      status: response.status,
      responseTime: new Date(responseReceivedTime).toISOString(),
      requestToResponseLatency: `${requestToResponseTime}ms`
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
    let firstChunkTime: number | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        chunkIndex++;
        const currentTime = Date.now();
        
        // 记录第一次收到数据的时间
        if (firstChunkTime === null) {
          firstChunkTime = currentTime;
          const totalLatency = firstChunkTime - requestStartTime;
          const streamStartLatency = firstChunkTime - responseReceivedTime;
          console.log('🎯 收到第一个流式数据块:', {
            firstChunkTime: new Date(firstChunkTime).toISOString(),
            totalLatencyFromRequest: `${totalLatency}ms`,
            streamStartLatency: `${streamStartLatency}ms`,
            chunkIndex
          });
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // 如果没有检测到真正的流式，进行智能分块
              if (!isRealStream && streamBuffer) {
                console.log('🔄 检测到非真正流式，开始智能分块:', {
                  totalLength: streamBuffer.length,
                  chunkCount: chunkIndex,
                  totalTime: `${currentTime - requestStartTime}ms`
                });
                
                yield* this.simulateStreamFromContent(streamBuffer);
              }
              
              const totalDuration = currentTime - requestStartTime;
              console.log('🏁 Gemini OpenAI兼容流式完成:', {
                totalChunks: chunkIndex,
                fullContentLength: fullContent.length,
                isRealStream,
                totalDuration: `${totalDuration}ms`,
                averageChunkInterval: chunkIndex > 1 ? `${totalDuration / (chunkIndex - 1)}ms` : 'N/A'
              });
              
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
                
                const elapsedFromStart = currentTime - requestStartTime;
                console.log(`📦 Gemini OpenAI兼容流式块 ${chunkIndex}:`, {
                  deltaLength: delta.length,
                  fullLength: fullContent.length,
                  timeDiff: `${timeDiff}ms`,
                  elapsedFromStart: `${elapsedFromStart}ms`,
                  isRealStream,
                  deltaPreview: delta.substring(0, 30) + (delta.length > 30 ? '...' : '')
                });
                
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
    console.log('🎭 开始智能分块模拟流式输出:', { contentLength: content.length });
    
    // 智能分块算法
    const chunks = this.intelligentChunk(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      console.log(`📤 模拟流式块 ${i + 1}/${chunks.length}:`, {
        chunkLength: chunk.length,
        content: chunk.substring(0, 30) + (chunk.length > 30 ? '...' : '')
      });
      
      yield {
        content: chunk,
        isComplete: false
      };
      
      // 模拟网络延迟，让用户看到流式效果
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40));
      }
    }
  }

  /**
   * 智能分块算法
   */
  private intelligentChunk(text: string): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/([.。!！?？\n]+)/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > 50 && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    // 如果分块太少，进一步细分
    if (chunks.length < 3 && text.length > 100) {
      return this.wordBasedChunk(text);
    }
    
    return chunks;
  }

  /**
   * 基于词汇的分块
   */
  private wordBasedChunk(text: string): string[] {
    const words = text.split(/(\s+)/);
    const chunks: string[] = [];
    let currentChunk = '';
    const wordsPerChunk = Math.max(3, Math.floor(words.length / 8));
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      currentChunk = words.slice(i, i + wordsPerChunk).join('');
      if (currentChunk.trim()) {
        chunks.push(currentChunk);
      }
    }
    
    return chunks;
  }

  /**
   * 获取 OpenAI 兼容的 URL
   */
  private getOpenAICompatibleURL(): string {
    // 如果用户提供的 baseURL 已经是 OpenAI 兼容格式，直接使用
    if (this.config.baseURL.includes('/openai')) {
      return this.config.baseURL.replace(/\/+$/, ''); // 移除末尾斜杠
    }
    
    // 如果是标准的 Gemini baseURL，转换为 OpenAI 兼容格式
    if (this.config.baseURL.includes('generativelanguage.googleapis.com')) {
      return this.config.baseURL.replace(/\/+$/, '') + '/openai';
    }
    
    // 如果是第三方代理，假设它支持 OpenAI 兼容格式
    return this.config.baseURL.replace(/\/+$/, '') + '/v1';
  }
} 
import { BaseTranslationAdapter, TranslationRequest, TranslationResponse, StreamChunk, AdapterConfig } from './baseAdapter';

export class OpenAIAdapter extends BaseTranslationAdapter {
  constructor(config: AdapterConfig) {
    super(config);
    this.validateConfig();
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    console.log('🤖 OpenAI普通翻译开始:', {
      model: request.model,
      textLength: request.text.length,
      baseURL: this.config.baseURL
    });

    const response = await fetch(`${this.config.baseURL}/v1/chat/completions`, {
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
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
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
    const requestStartTime = Date.now();
    console.log('🌊 OpenAI流式翻译开始:', {
      model: request.model,
      textLength: request.text.length,
      baseURL: this.config.baseURL,
      startTime: new Date(requestStartTime).toISOString()
    });

    const fetchStartTime = Date.now();
    console.log('📡 开始发送请求到OpenAI服务器:', {
      url: `${this.config.baseURL}/v1/chat/completions`,
      fetchStartTime: new Date(fetchStartTime).toISOString()
    });

    const response = await fetch(`${this.config.baseURL}/v1/chat/completions`, {
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
        stream: true,
      }),
    });

    const responseReceivedTime = Date.now();
    const requestToResponseTime = responseReceivedTime - fetchStartTime;
    console.log('📨 收到OpenAI服务器响应:', {
      status: response.status,
      responseTime: new Date(responseReceivedTime).toISOString(),
      requestToResponseLatency: `${requestToResponseTime}ms`
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let chunkIndex = 0;
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
          console.log('🎯 收到第一个OpenAI流式数据块:', {
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
              const totalDuration = currentTime - requestStartTime;
              console.log('🏁 OpenAI流式翻译完成:', {
                totalChunks: chunkIndex,
                fullContentLength: fullContent.length,
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
                
                const elapsedFromStart = currentTime - requestStartTime;
                console.log(`📦 OpenAI流式块 ${chunkIndex}:`, {
                  deltaLength: delta.length,
                  fullLength: fullContent.length,
                  elapsedFromStart: `${elapsedFromStart}ms`,
                  deltaPreview: delta.substring(0, 30) + (delta.length > 30 ? '...' : '')
                });
                
                yield {
                  content: delta,
                  isComplete: false
                };
              }
            } catch (parseError) {
              console.error('OpenAI流式解析错误:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
} 
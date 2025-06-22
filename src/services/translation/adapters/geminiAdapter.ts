import { BaseTranslationAdapter, TranslationRequest, TranslationResponse, StreamChunk, AdapterConfig } from './baseAdapter';

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

export class GeminiAdapter extends BaseTranslationAdapter {
  constructor(config: AdapterConfig) {
    super(config);
    this.validateConfig();
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    console.log('🤖 Gemini普通翻译开始:', {
      model: request.model,
      textLength: request.text.length,
      baseURL: this.config.baseURL
    });

    const prompt = this.buildTranslationPrompt(request.text, request.systemMessage, request.targetLanguage);

    const geminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: request.temperature || this.config.temperature,
        maxOutputTokens: request.maxTokens,
        candidateCount: 1,
        topK: 40,
        topP: 0.95
      }
    };

    const response = await fetch(`${this.config.baseURL}/v1beta/models/${request.model}:generateContent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      content,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      }
    };
  }

  async *translateStream(request: TranslationRequest): AsyncGenerator<StreamChunk, void, unknown> {
    console.log('🌊 Gemini流式翻译开始:', {
      model: request.model,
      textLength: request.text.length,
      baseURL: this.config.baseURL
    });

    const prompt = this.buildTranslationPrompt(request.text, request.systemMessage, request.targetLanguage);

    const geminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: request.temperature || this.config.temperature,
        maxOutputTokens: request.maxTokens,
        candidateCount: 1,
        topK: 40,
        topP: 0.95
      }
    };

    // 尝试使用真正的流式API
    const response = await fetch(`${this.config.baseURL}/v1beta/models/${request.model}:streamGenerateContent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let hasRealStream = false;
    let chunkCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        chunkCount++;

        console.log(`📦 Gemini原始Chunk ${chunkCount}:`, {
          chunkSize: chunk.length,
          bufferSize: buffer.length
        });

        // 解析JSON对象
        const jsonObjects = this.parseJsonObjects(buffer);
        
        for (const { jsonData, remainingBuffer } of jsonObjects) {
          buffer = remainingBuffer;
          
          if (jsonData.candidates && jsonData.candidates.length > 0) {
            const candidate = jsonData.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              const deltaText = candidate.content.parts[0].text || '';
              
              if (deltaText) {
                hasRealStream = true;
                fullContent += deltaText;
                
                console.log('📝 Gemini真正流式块:', {
                  deltaLength: deltaText.length,
                  fullLength: fullContent.length,
                  chunkIndex: chunkCount
                });
                
                yield {
                  content: deltaText,
                  isComplete: false
                };
              }
            }
            
            if (candidate.finishReason) {
              console.log('🏁 Gemini流式完成:', { finishReason: candidate.finishReason });
              yield {
                content: '',
                isComplete: true,
                usage: {
                  totalTokens: fullContent.length
                }
              };
              return;
            }
          }
        }
      }

      // 如果没有真正的流式数据，但有完整内容，则进行智能分块
      if (!hasRealStream && fullContent) {
        console.log('⚠️  Gemini没有真正流式，启用智能分块模拟:', {
          contentLength: fullContent.length,
          willCreateChunks: true
        });

        yield* this.simulateStreamFromContent(fullContent);
      }

    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 解析JSON对象
   */
  private parseJsonObjects(buffer: string): Array<{ jsonData: GeminiResponse; remainingBuffer: string }> {
    const results: Array<{ jsonData: GeminiResponse; remainingBuffer: string }> = [];
    let startIndex = 0;
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            startIndex = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const jsonStr = buffer.substring(startIndex, i + 1);
            
            try {
              const jsonData = JSON.parse(jsonStr) as GeminiResponse;
              results.push({
                jsonData,
                remainingBuffer: buffer.substring(i + 1)
              });
            } catch (parseError) {
              console.warn('⚠️  Gemini JSON解析失败:', parseError);
            }
          }
        }
      }
    }
    
    return results;
  }

  /**
   * 从完整内容模拟流式输出
   */
  private async *simulateStreamFromContent(content: string): AsyncGenerator<StreamChunk, void, unknown> {
    // 智能分块策略
    const chunks = this.intelligentChunking(content);
    
    console.log('🎭 开始智能分块模拟流式:', {
      totalLength: content.length,
      chunksCount: chunks.length,
      chunkSizes: chunks.map(c => c.length)
    });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLast = i === chunks.length - 1;
      
      console.log(`📤 发送模拟流式块 ${i + 1}/${chunks.length}:`, {
        chunkLength: chunk.length,
        isLast
      });
      
      yield {
        content: chunk,
        isComplete: false
      };

      // 添加适当的延迟模拟真实流式
      if (!isLast) {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }
    }

    // 发送完成信号
    yield {
      content: '',
      isComplete: true,
      usage: {
        totalTokens: content.length
      }
    };
  }

  /**
   * 智能分块算法
   */
  private intelligentChunking(content: string): string[] {
    const chunks: string[] = [];
    const minChunkSize = 20;
    const maxChunkSize = 150;
    
    // 按句子分割
    const sentences = content.split(/([.!?。！？]\s*)/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > minChunkSize) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    // 如果分块太少，按词分割
    if (chunks.length < 3) {
      return this.chunkByWords(content, 8, 25);
    }
    
    return chunks;
  }

  /**
   * 按词分块
   */
  private chunkByWords(content: string, minWords: number, maxWords: number): string[] {
    const words = content.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWords) {
      const chunkWords = words.slice(i, i + maxWords);
      chunks.push(chunkWords.join(' '));
    }
    
    return chunks;
  }
} 
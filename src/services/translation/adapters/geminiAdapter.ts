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

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

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
                
                yield {
                  content: deltaText,
                  isComplete: false
                };
              }
            }
            
            if (candidate.finishReason) {
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
            } catch {
              // 解析失败，忽略
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
    // 智能分块
    const chunks = this.intelligentChunking(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      yield {
        content: chunk,
        isComplete: i === chunks.length - 1 ? true : false,
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
   * 智能分块算法
   */
  private intelligentChunking(content: string): string[] {
    // 如果内容很短，直接返回一个块
    if (content.length < 50) {
      return [content];
    }
    
    // 按段落分块
    const paragraphs = content.split(/\n\s*\n/);
    
    // 如果有多个段落，按段落分块
    if (paragraphs.length > 1) {
      return paragraphs.map(p => p.trim()).filter(p => p);
    }
    
    // 如果只有一个段落但很长，按句子分块
    const sentences = content.split(/(?<=[.!?])\s+/);
    if (sentences.length > 1 && content.length > 200) {
      return sentences.map(s => s.trim()).filter(s => s);
    }
    
    // 如果句子也不多，按词分块
    return this.chunkByWords(content, 5, 15);
  }

  /**
   * 按词分块
   */
  private chunkByWords(content: string, minWords: number, maxWords: number): string[] {
    const words = content.split(/\s+/);
    const chunks: string[] = [];
    
    if (words.length <= maxWords) {
      return [content];
    }
    
    let currentChunk: string[] = [];
    
    for (const word of words) {
      currentChunk.push(word);
      
      if (currentChunk.length >= minWords && 
          (currentChunk.length >= maxWords || Math.random() > 0.7)) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    return chunks;
  }
} 
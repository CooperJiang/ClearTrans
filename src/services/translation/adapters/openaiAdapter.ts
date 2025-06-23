import { BaseTranslationAdapter, TranslationRequest, TranslationResponse, StreamChunk, AdapterConfig } from './baseAdapter';

export class OpenAIAdapter extends BaseTranslationAdapter {
  constructor(config: AdapterConfig) {
    super(config);
    this.validateConfig();
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
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

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
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
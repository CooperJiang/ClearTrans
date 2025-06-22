export interface TranslationRequest {
  text: string;
  model: string;
  maxTokens: number;
  systemMessage?: string;
  targetLanguage?: string;
  temperature?: number;
}

export interface TranslationResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AdapterConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export abstract class BaseTranslationAdapter {
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  /**
   * 普通翻译（非流式）
   */
  abstract translate(request: TranslationRequest): Promise<TranslationResponse>;

  /**
   * 流式翻译
   * 返回AsyncGenerator，每次yield一个StreamChunk
   */
  abstract *translateStream(request: TranslationRequest): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * 构建翻译prompt
   */
  protected buildTranslationPrompt(text: string, systemMessage?: string, targetLanguage?: string): string {
    const defaultSystemMessage = `You are a professional ${targetLanguage || 'English'} native translator who needs to fluently translate text into ${targetLanguage || 'English'}.

## Translation Rules
1. Output only the translated content, without explanations or additional content (such as "Here's the translation:" or "Translation as follows:")
2. The returned translation must maintain exactly the same number of paragraphs and format as the original text
3. If the text contains HTML tags, consider where the tags should be placed in the translation while maintaining fluency
4. For content that should not be translated (such as proper nouns, code, etc.), keep the original text.
5. If input contains %%, use %% in your output, if input has no %%, don't use %% in your output

## OUTPUT FORMAT:
- **Single paragraph input** → Output translation directly (no separators, no extra text)
- **Multi-paragraph input** → Use line break as paragraph separator between translations`;

    return (systemMessage || defaultSystemMessage) + '\n\n' + text;
  }

  /**
   * 验证配置
   */
  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }
    if (!this.config.baseURL) {
      throw new Error('Base URL is required');
    }
  }
} 
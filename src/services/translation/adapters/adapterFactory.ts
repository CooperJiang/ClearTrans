import { BaseTranslationAdapter, AdapterConfig } from './baseAdapter';
import { OpenAIAdapter } from './openaiAdapter';
import { GeminiAdapter } from './geminiAdapter';
import { GeminiOpenAIAdapter } from './geminiOpenAIAdapter';

export type AIProvider = 'openai' | 'gemini';

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens: number;
  temperature: number;
  useOpenAICompatible?: boolean;
}

export class AdapterFactory {
  /**
   * 创建适配器实例
   */
  static createAdapter(config: ProviderConfig): BaseTranslationAdapter {
    const adapterConfig: AdapterConfig = {
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature
    };

    switch (config.provider) {
      case 'openai':
        return new OpenAIAdapter(adapterConfig);
      
      case 'gemini':
        if (config.useOpenAICompatible !== false) {
          console.log('🔄 使用 Gemini 官方 OpenAI 兼容接口');
          return new GeminiOpenAIAdapter(adapterConfig);
        } else {
          console.log('🔄 使用原生 Gemini 接口（带智能分块）');
          return new GeminiAdapter(adapterConfig);
        }
      
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * 获取支持的提供商列表
   */
  static getSupportedProviders(): AIProvider[] {
    return ['openai', 'gemini'];
  }

  /**
   * 验证提供商配置
   */
  static validateProviderConfig(config: ProviderConfig): void {
    if (!config.provider) {
      throw new Error('Provider is required');
    }

    if (!this.getSupportedProviders().includes(config.provider)) {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }

    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    if (!config.baseURL) {
      throw new Error('Base URL is required');
    }

    if (!config.model) {
      throw new Error('Model is required');
    }

    if (!config.maxTokens || config.maxTokens <= 0) {
      throw new Error('Max tokens must be a positive number');
    }

    if (config.temperature < 0 || config.temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
  }

  /**
   * 检测是否应该使用 OpenAI 兼容模式
   */
  static shouldUseOpenAICompatible(baseURL: string): boolean {
    if (baseURL.includes('/openai')) {
      return true;
    }
    
    if (baseURL.includes('generativelanguage.googleapis.com')) {
      return true;
    }
    
    return true;
  }
} 
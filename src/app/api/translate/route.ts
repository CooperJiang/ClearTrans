import { NextRequest, NextResponse } from 'next/server';
import { getEnvConfig } from '@/config/env';
import { AdapterFactory, ProviderConfig } from '@/services/translation/adapters/adapterFactory';
import { StreamProcessor } from '@/services/translation/streamProcessor';

// 服务端配置
const SERVER_CONFIG = getEnvConfig().openai;

interface UserConfig {
  apiKey?: string;
  baseURL?: string;
  geminiApiKey?: string;
  geminiBaseURL?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      text, 
      provider = 'openai',
      model, 
      maxTokens = 4096, 
      systemMessage,
      targetLanguage,
      useServerSide = true,
      userConfig 
    } = await request.json();

    console.log('🤖 普通翻译API接收请求:', {
      provider,
      model,
      useServerSide,
      hasUserConfig: !!userConfig,
      textLength: text ? text.length : 0
    });

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    // 构建适配器配置
    const providerConfig = buildProviderConfig({
      provider,
      model,
      maxTokens,
      useServerSide,
      userConfig
    });

    // 验证配置
    AdapterFactory.validateProviderConfig(providerConfig);

    // 创建适配器
    const adapter = AdapterFactory.createAdapter(providerConfig);

    // 使用普通翻译处理器
    const result = await StreamProcessor.processTranslation(adapter, {
      text,
      model,
      maxTokens,
      systemMessage,
      targetLanguage,
      temperature: 0.3
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ 普通翻译API错误:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        type: 'api_error'
      },
      { status: 500 }
    );
  }
}

/**
 * 构建提供商配置
 */
function buildProviderConfig(params: {
  provider: string;
  model: string;
  maxTokens: number;
  useServerSide: boolean;
  userConfig?: UserConfig;
}): ProviderConfig {
  const { provider, model, maxTokens, useServerSide, userConfig } = params;

  let apiKey: string;
  let baseURL: string;

  if (useServerSide) {
    // 使用服务端配置
    if (provider === 'openai') {
      if (!SERVER_CONFIG.apiKey) {
        throw new Error('Server OpenAI configuration not available');
      }
      apiKey = SERVER_CONFIG.apiKey;
      baseURL = SERVER_CONFIG.baseURL;
    } else if (provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Server Gemini configuration not available');
      }
      apiKey = process.env.GEMINI_API_KEY;
      // 使用官方 OpenAI 兼容端点
      baseURL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
    } else {
      throw new Error(`Unsupported server provider: ${provider}`);
    }
  } else {
    // 使用用户配置
    if (provider === 'openai') {
      if (!userConfig?.apiKey) {
        throw new Error('User OpenAI API key is required for client mode');
      }
      apiKey = userConfig.apiKey;
      baseURL = userConfig.baseURL || 'https://api.openai.com';
    } else if (provider === 'gemini') {
      if (!userConfig?.geminiApiKey) {
        throw new Error('User Gemini API key is required for client mode');
      }
      apiKey = userConfig.geminiApiKey;
      // 智能检测用户的 baseURL 格式
      const userBaseURL = userConfig.geminiBaseURL || 'https://generativelanguage.googleapis.com/v1beta';
      
      // 如果用户提供的是原生格式，转换为 OpenAI 兼容格式
      if (!userBaseURL.includes('/openai') && userBaseURL.includes('generativelanguage.googleapis.com')) {
        baseURL = userBaseURL.replace(/\/+$/, '') + '/openai';
        console.log('🔄 自动转换为 OpenAI 兼容端点:', baseURL);
      } else {
        baseURL = userBaseURL;
      }
    } else {
      throw new Error(`Unsupported user provider: ${provider}`);
    }
  }

  const config: ProviderConfig = {
    provider: provider as 'openai' | 'gemini',
    apiKey,
    baseURL,
    model,
    maxTokens,
    temperature: 0.3
  };

  // 对于 Gemini，检测是否应该使用 OpenAI 兼容模式
  if (provider === 'gemini') {
    config.useOpenAICompatible = AdapterFactory.shouldUseOpenAICompatible(baseURL);
    console.log('🔍 Gemini OpenAI兼容模式:', config.useOpenAICompatible ? '启用' : '禁用');
  }

  return config;
} 
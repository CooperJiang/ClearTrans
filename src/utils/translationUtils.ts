/**
 * 翻译相关工具函数
 */

import { getLanguageEnglishName } from '@/constants/languages';
import type { TranslationConfig, OpenAIConfig, GeminiConfig } from '@/types/translation';

export interface TemplateVariables {
  to: string;
  text: string;
  from?: string;
}

/**
 * 安全地获取配置中的模型
 */
export function getModelFromConfig(config: TranslationConfig): string {
  switch (config.provider) {
    case 'openai':
      return (config as OpenAIConfig).model;
    case 'gemini':
      return (config as GeminiConfig).geminiModel;
    default:
      // This should never happen given our type definitions
      throw new Error(`Unsupported provider: ${(config as OpenAIConfig | GeminiConfig).provider}`);
  }
}

/**
 * 替换模板变量
 */
export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

/**
 * 构建模板变量
 */
export function buildTemplateVariables(
  targetLanguage: string,
  sourceLanguage?: string,
  text?: string
): TemplateVariables {
  const targetLanguageEnglish = getLanguageEnglishName(targetLanguage);
  const sourceLanguageEnglish = sourceLanguage && sourceLanguage !== 'auto' 
    ? getLanguageEnglishName(sourceLanguage) 
    : undefined;

  return {
    to: targetLanguageEnglish,
    text: text || '',
    ...(sourceLanguageEnglish && { from: sourceLanguageEnglish })
  };
}

/**
 * 构建系统指令
 */
export function buildSystemInstruction(
  systemMessage: string,
  templateVariables: TemplateVariables
): string {
  const variablesRecord: Record<string, string> = {
    to: templateVariables.to,
    text: templateVariables.text,
    ...(templateVariables.from && { from: templateVariables.from })
  };
  
  const processedSystemMessage = replaceTemplateVariables(systemMessage, variablesRecord);
  
  let instruction = processedSystemMessage;
  if (templateVariables.from) {
    instruction += `\n\nTranslate the following ${templateVariables.from} text to ${templateVariables.to}. Output only the translation:`;
  } else {
    instruction += `\n\nTranslate the following text to ${templateVariables.to}. Output only the translation:`;
  }
  
  return instruction;
}

/**
 * 获取用户配置的安全方法
 */
export function getUserConfig(config: TranslationConfig): Record<string, string> {
  if (config.provider === 'openai') {
    const openaiConfig = config as OpenAIConfig;
    const result: Record<string, string> = {
      apiKey: openaiConfig.apiKey
    };
    if (openaiConfig.baseURL) {
      result.baseURL = openaiConfig.baseURL;
    }
    return result;
  } else if (config.provider === 'gemini') {
    const geminiConfig = config as GeminiConfig;
    const result: Record<string, string> = {
      geminiApiKey: geminiConfig.geminiApiKey
    };
    if (geminiConfig.geminiBaseURL) {
      result.geminiBaseURL = geminiConfig.geminiBaseURL;
    }
    return result;
  }
  return {};
}

/**
 * 验证模型类型是否为TTS模型
 */
export function isTTSModel(model: string): boolean {
  return model.includes('tts');
}

/**
 * 构建翻译请求体
 */
export function buildTranslationRequestBody(
  text: string,
  config: TranslationConfig,
  templateVariables: TemplateVariables,
  systemInstruction: string
) {
  const requestBody: {
    text: string;
    provider: string;
    model?: string;
    maxTokens: number;
    systemMessage: string;
    targetLanguage: string;
    useServerSide: boolean;
    userConfig?: Record<string, string>;
  } = {
    text,
    provider: config.provider,
    maxTokens: config.maxTokens || 4096,
    systemMessage: systemInstruction,
    targetLanguage: templateVariables.to,
    useServerSide: config.useServerSide || false
  };

  // 在客户端模式下传递model参数和用户配置
  if (!config.useServerSide) {
    requestBody.model = getModelFromConfig(config);
    requestBody.userConfig = getUserConfig(config);
  }

  return requestBody;
}
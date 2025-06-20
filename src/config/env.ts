/**
 * 环境变量配置管理
 * 统一管理所有环境变量的读取和默认值
 */

export interface EnvConfig {
  // OpenAI API 配置
  openai: {
    apiKey: string;
    baseURL: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  
  // 应用配置
  app: {
    port: number;
    name: string;
    url: string;
  };
  
  // 功能开关
  features: {
    serverSideTranslation: boolean;
    analytics: boolean;
  };
}

/**
 * 获取环境变量配置
 */
export const getEnvConfig = (): EnvConfig => {
  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      baseURL: process.env.OPENAI_BASE_URL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
    },
    
    app: {
      port: parseInt(process.env.PORT || '8888'),
      name: process.env.NEXT_PUBLIC_APP_NAME || 'Clear Trans',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8888',
    },
    
    features: {
      serverSideTranslation: Boolean(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY),
      analytics: Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID),
    },
  };
};

/**
 * 环境变量验证
 */
export const validateEnvConfig = (): { isValid: boolean; errors: string[] } => {
  const config = getEnvConfig();
  const errors: string[] = [];
  
  // 验证必要的配置
  if (!config.openai.baseURL) {
    errors.push('OPENAI_BASE_URL is required');
  }
  
  if (config.openai.maxTokens <= 0) {
    errors.push('OPENAI_MAX_TOKENS must be a positive number');
  }
  
  if (config.openai.temperature < 0 || config.openai.temperature > 2) {
    errors.push('OPENAI_TEMPERATURE must be between 0 and 2');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 开发环境判断
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test'; 
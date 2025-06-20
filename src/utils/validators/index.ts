/**
 * 验证器工具函数
 */

/**
 * 验证API密钥格式
 */
export const validateApiKey = (apiKey: string): boolean => {
  if (!apiKey) return false;
  
  // OpenAI API Key 格式: sk-开头，长度大于20
  if (apiKey.startsWith('sk-') && apiKey.length > 20) {
    return true;
  }
  
  // 其他格式的API Key也可能有效
  return apiKey.length > 10;
};

/**
 * 验证URL格式
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 验证文本长度
 */
export const validateTextLength = (text: string, maxLength: number = 10000): boolean => {
  return text.length > 0 && text.length <= maxLength;
};

/**
 * 验证语言代码
 */
export const validateLanguageCode = (code: string): boolean => {
  if (!code) return false;
  
  // 语言代码格式: 2-5个字符，可能包含连字符
  return /^[a-z]{2,3}(-[a-z]{2,4})?$/i.test(code) || code === 'auto';
};

/**
 * 验证数字范围
 */
export const validateNumberRange = (num: number, min: number, max: number): boolean => {
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * 验证配置对象
 */
export const validateTranslationConfig = (config: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 类型守卫函数
  const isString = (value: unknown): value is string => typeof value === 'string';
  const isNumber = (value: unknown): value is number => typeof value === 'number';
  const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
  
  if (!isBoolean(config.useServerSide) || (!config.useServerSide && !isString(config.apiKey))) {
    errors.push('API密钥格式无效');
  } else if (!config.useServerSide && isString(config.apiKey) && !validateApiKey(config.apiKey)) {
    errors.push('API密钥格式无效');
  }
  
  if (config.baseURL && (!isString(config.baseURL) || !validateUrl(config.baseURL))) {
    errors.push('API基础URL格式无效');
  }
  
  if (!isNumber(config.maxTokens) || !validateNumberRange(config.maxTokens, 1, 128000)) {
    errors.push('最大Token数量必须在1-128000之间');
  }
  
  if (config.systemMessage && (!isString(config.systemMessage) || config.systemMessage.length > 2000)) {
    errors.push('系统提示词长度不能超过2000字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}; 
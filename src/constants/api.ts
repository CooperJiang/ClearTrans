/**
 * API相关常量配置
 */

// API端点
export const API_ENDPOINTS = {
  TRANSLATE: '/api/translate',
  HEALTH: '/api/health',
  USAGE: '/api/usage',
} as const;

// OpenAI模型配置
export const OPENAI_MODELS = [
  {
    code: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: '性价比最高，响应快速',
    icon: '⚡',
    maxTokens: 128000,
    costPer1KTokens: 0.00015,
    recommended: true,
  },
  {
    code: 'gpt-4o',
    name: 'GPT-4o',
    description: '最新最强模型，理解能力最佳',
    icon: '🧠',
    maxTokens: 128000,
    costPer1KTokens: 0.005,
    recommended: false,
  },
  {
    code: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: '经典模型，稳定可靠',
    icon: '🚀',
    maxTokens: 16385,
    costPer1KTokens: 0.0005,
    recommended: false,
  },
] as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 错误码定义
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // API相关错误
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_KEY_MISSING: 'API_KEY_MISSING',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
  API_RATE_LIMITED: 'API_RATE_LIMITED',
  
  // 服务器错误
  SERVER_NOT_CONFIGURED: 'SERVER_NOT_CONFIGURED',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // 用户输入错误
  TEXT_TOO_LONG: 'TEXT_TOO_LONG',
  TEXT_EMPTY: 'TEXT_EMPTY',
  LANGUAGE_NOT_SUPPORTED: 'LANGUAGE_NOT_SUPPORTED',
} as const;

// 错误消息映射
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNKNOWN_ERROR]: '未知错误，请重试',
  [ERROR_CODES.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ERROR_CODES.TIMEOUT_ERROR]: '请求超时，请重试',
  
  [ERROR_CODES.API_KEY_INVALID]: 'API密钥无效，请检查配置',
  [ERROR_CODES.API_KEY_MISSING]: '请先配置API密钥',
  [ERROR_CODES.API_QUOTA_EXCEEDED]: 'API额度已用完，请检查账户余额',
  [ERROR_CODES.API_RATE_LIMITED]: '请求频率过高，请稍后再试',
  
  [ERROR_CODES.SERVER_NOT_CONFIGURED]: '服务端未配置默认模型',
  [ERROR_CODES.SERVER_ERROR]: '服务器内部错误',
  
  [ERROR_CODES.TEXT_TOO_LONG]: '文本长度超出限制',
  [ERROR_CODES.TEXT_EMPTY]: '请输入要翻译的文本',
  [ERROR_CODES.LANGUAGE_NOT_SUPPORTED]: '不支持的语言类型',
} as const;

// 请求配置
export const REQUEST_CONFIG = {
  // 超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 重试配置
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // 文本长度限制
  MAX_TEXT_LENGTH: 10000,
  MIN_TEXT_LENGTH: 1,
} as const; 
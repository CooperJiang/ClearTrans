/**
 * 配置相关类型定义
 */

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  autoSave: boolean;
  showHistory: boolean;
  enableShortcuts: boolean;
  soundEnabled: boolean;
}

export interface AppSettings {
  maxHistoryItems: number;
  enableAnalytics: boolean;
  autoTranslate: boolean;
  soundEnabled: boolean;
  showTokenUsage: boolean;
  enableCaching: boolean;
}

export interface ApiUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  requestsToday: number;
  tokensToday: number;
  costToday: number;
  lastResetDate: string;
}

export interface ConfigSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
  autoSwitchToClient?: boolean;
}

export interface ServerConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
} 
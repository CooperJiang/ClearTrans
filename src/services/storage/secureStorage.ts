/**
 * 加密存储工具类
 * 对localStorage进行封装，支持数据加密和过期时间设置
 */

// 简单的加密/解密函数
const STORAGE_KEY_PREFIX = 'ct_'; // ClearTrans prefix
const ENCRYPTION_KEY = 'ClearTrans2024';

// 简单的XOR加密
function encrypt(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  // 使用 encodeURIComponent + btoa 来处理中文字符
  return btoa(encodeURIComponent(result));
}

// 简单的XOR解密
function decrypt(encryptedText: string): string {
  try {
    const decoded = decodeURIComponent(atob(encryptedText)); // Base64解码 + decodeURIComponent
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return result;
  } catch {
    return '';
  }
}

// 生成加密的key
function generateStorageKey(key: string): string {
  return STORAGE_KEY_PREFIX + btoa(key);
}

// 存储数据结构
interface StorageData<T> {
  value: T;
  timestamp: number;
  expiry?: number; // 过期时间戳，undefined表示永久
}

export class SecureStorage {
  /**
   * 存储数据
   * @param key 存储键
   * @param value 存储值
   * @param expiryMinutes 过期时间（分钟），undefined表示永久存储
   */
  static set<T>(key: string, value: T, expiryMinutes?: number): void {
    try {
      // 检查是否在浏览器环境
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const now = Date.now();
      const data: StorageData<T> = {
        value,
        timestamp: now,
        expiry: expiryMinutes ? now + expiryMinutes * 60 * 1000 : undefined
      };

      const encryptedData = encrypt(JSON.stringify(data));
      const storageKey = generateStorageKey(key);
      
      localStorage.setItem(storageKey, encryptedData);
    } catch (error) {
      console.warn('Failed to save to storage:', error);
    }
  }

  /**
   * 获取数据
   * @param key 存储键
   * @param defaultValue 默认值
   * @returns 存储的值或默认值
   */
  static get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      // 检查是否在浏览器环境
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return defaultValue;
      }
      
      const storageKey = generateStorageKey(key);
      const encryptedData = localStorage.getItem(storageKey);
      
      if (!encryptedData) {
        return defaultValue;
      }

      const decryptedData = decrypt(encryptedData);
      if (!decryptedData) {
        // 解密失败，删除无效数据
        this.remove(key);
        return defaultValue;
      }

      const data: StorageData<T> = JSON.parse(decryptedData);
      
      // 检查是否过期
      if (data.expiry && Date.now() > data.expiry) {
        this.remove(key);
        return defaultValue;
      }

      return data.value;
    } catch (error) {
      console.warn('Failed to read from storage:', error);
      return defaultValue;
    }
  }

  /**
   * 删除数据
   * @param key 存储键
   */
  static remove(key: string): void {
    try {
      const storageKey = generateStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove from storage:', error);
    }
  }

  /**
   * 检查key是否存在且未过期
   * @param key 存储键
   * @returns 是否存在
   */
  static has(key: string): boolean {
    const value = this.get(key);
    return value !== undefined;
  }

  /**
   * 清除所有应用相关的存储数据
   */
  static clear(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  /**
   * 获取存储的数据大小（字节）
   * @param key 存储键
   * @returns 数据大小
   */
  static getSize(key: string): number {
    try {
      const storageKey = generateStorageKey(key);
      const data = localStorage.getItem(storageKey);
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  }

  /**
   * 获取所有应用相关存储的总大小
   * @returns 总大小（字节）
   */
  static getTotalSize(): number {
    try {
      let totalSize = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            totalSize += new Blob([data]).size;
          }
        }
      }
      
      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   * 迁移旧的 translateConfig 数据到加密存储
   * 这个方法会检查是否存在旧的非加密 translateConfig，如果存在则迁移到加密存储
   */
  static migrateTranslateConfig(): void {
    try {
      // 检查是否在浏览器环境
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      // 检查是否已经有加密的配置
      if (this.has(STORAGE_KEYS.TRANSLATE_CONFIG)) {
        return; // 已经有加密配置，无需迁移
      }

      // 尝试从旧的非加密存储中获取数据
      const oldConfigData = localStorage.getItem('translateConfig');
      if (oldConfigData) {
        try {
          const parsedConfig = JSON.parse(oldConfigData);
          
          // 将旧配置保存到加密存储
          this.set(STORAGE_KEYS.TRANSLATE_CONFIG, parsedConfig);
          
          // 删除旧的非加密数据
          localStorage.removeItem('translateConfig');
          
          console.log('✅ translateConfig 已成功迁移到加密存储');
        } catch (error) {
          console.warn('迁移 translateConfig 时解析失败:', error);
        }
      }
    } catch (error) {
      console.warn('迁移 translateConfig 失败:', error);
    }
  }
}

// 存储键常量
export const STORAGE_KEYS = {
  LANGUAGE_DISPLAY_MODE: 'language_display_mode', // 语言显示模式 (中/EN)
  SOURCE_LANGUAGE: 'source_language',             // 源语言
  TARGET_LANGUAGE: 'target_language',             // 目标语言
  API_CONFIG: 'api_config',                       // API配置
  TRANSLATE_CONFIG: 'translate_config',           // 翻译配置（加密存储）
  TRANSLATION_HISTORY: 'translation_history',     // 翻译历史
  USER_PREFERENCES: 'user_preferences',           // 用户偏好设置
} as const;

export default SecureStorage; 
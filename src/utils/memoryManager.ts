/**
 * 内存管理工具
 * 用于管理临时数据存储，避免内存泄漏
 */

export interface MemoryItem<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
}

export class MemoryManager<T> {
  private store = new Map<string, MemoryItem<T>>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly defaultTTL: number;
  private readonly cleanupInterval: number;

  constructor(defaultTTL: number = 5 * 60 * 1000, cleanupInterval: number = 60 * 1000) {
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = cleanupInterval;
    this.startCleanup();
  }

  /**
   * 设置数据
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.store.set(key, {
      data,
      createdAt: now,
      expiresAt
    });
  }

  /**
   * 获取数据
   */
  get(key: string): T | null {
    const item = this.store.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 删除数据
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    const item = this.store.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 获取存储大小
   */
  size(): number {
    return this.store.size;
  }

  /**
   * 清理过期数据
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 开始自动清理
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * 停止自动清理
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const item of this.store.values()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.store.size,
      valid,
      expired
    };
  }
}

// 创建全局实例
export const globalMemoryManager = new MemoryManager();
'use client';

import { useState, useEffect } from 'react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return 'fas fa-check-circle text-green-500';
      case 'error': return 'fas fa-exclamation-circle text-red-500';
      case 'warning': return 'fas fa-exclamation-triangle text-yellow-500';
      case 'info': return 'fas fa-info-circle text-blue-500';
      default: return 'fas fa-info-circle text-blue-500';
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`${getBgColor()} border rounded-lg p-4 mb-3 shadow-md animate-slide-in-right flex items-center`}>
      <i className={`${getIcon()} mr-3 text-lg`}></i>
      <span className="flex-1 text-sm text-gray-800">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <i className="fas fa-times text-sm"></i>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 space-y-2 max-h-screen overflow-y-auto">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// 全局Toast管理器
class ToastManager {
  private listeners: ((toasts: ToastData[]) => void)[] = [];
  private toasts: ToastData[] = [];
  private loadingHandlers: (() => void)[] = [];

  subscribe(listener: (toasts: ToastData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // 注册loading关闭处理器
  registerLoadingHandler(handler: () => void) {
    this.loadingHandlers.push(handler);
    return () => {
      this.loadingHandlers = this.loadingHandlers.filter(h => h !== handler);
    };
  }

  // 强制关闭所有loading状态
  forceCloseLoading() {

    this.loadingHandlers.forEach(handler => handler());
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }

  showToast(message: string, type: ToastData['type'] = 'info', duration?: number) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toast: ToastData = { id, message, type, duration };
    
    this.toasts = [...this.toasts, toast];
    this.notify();

    // 自动移除
    setTimeout(() => {
      this.removeToast(id);
    }, duration || 3000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  success(message: string, duration?: number) {
    this.showToast(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    // 显示错误时强制关闭loading
    this.forceCloseLoading();
    this.showToast(message, 'error', duration);
  }

  warning(message: string, duration?: number) {
    this.showToast(message, 'warning', duration);
  }

  info(message: string, duration?: number) {
    this.showToast(message, 'info', duration);
  }
}

// 全局实例
export const toastManager = new ToastManager();

// Hook for using toast
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const closeToast = (id: string) => {
    toastManager.removeToast(id);
  };

  return {
    toasts,
    closeToast,
    success: (message: string, duration?: number) => toastManager.success(message, duration),
    error: (message: string, duration?: number) => toastManager.error(message, duration),
    warning: (message: string, duration?: number) => toastManager.warning(message, duration),
    info: (message: string, duration?: number) => toastManager.info(message, duration),
  };
}

// 导出全局方法供JS调用
export const toast = {
  success: (message: string, duration?: number) => toastManager.success(message, duration),
  error: (message: string, duration?: number) => toastManager.error(message, duration),
  warning: (message: string, duration?: number) => toastManager.warning(message, duration),
  info: (message: string, duration?: number) => toastManager.info(message, duration),
}; 
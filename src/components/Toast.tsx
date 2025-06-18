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

// Hook for using toast
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (message: string, type: ToastData['type'] = 'info', duration?: number) => {
    const id = Date.now().toString();
    const toast: ToastData = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
  };

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    closeToast,
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
  };
} 
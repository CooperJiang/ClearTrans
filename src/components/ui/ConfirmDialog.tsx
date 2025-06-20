'use client';

import React, { useState, useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: 'red' | 'blue' | 'green';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  confirmButtonColor = 'red',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // 确保DOM更新后再开始动画
      setTimeout(() => setIsVisible(true), 50);
    } else if (shouldRender) {
      setIsVisible(false);
      // 等待动画完成后再隐藏组件
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const confirmButtonStyles = {
    red: 'bg-red-600 hover:bg-red-700 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white'
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`fixed inset-0 transition-opacity duration-300 z-[60] ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: 'var(--overlay-background)' }}
        onClick={onCancel}
      />

      {/* 对话框 */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className={`bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          {/* 头部 */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                confirmButtonColor === 'red' ? 'bg-red-100' :
                confirmButtonColor === 'blue' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <i className={`fas ${
                  confirmButtonColor === 'red' ? 'fa-exclamation-triangle text-red-600' :
                  confirmButtonColor === 'blue' ? 'fa-info-circle text-blue-600' : 'fa-check-circle text-green-600'
                } text-sm`}></i>
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {title}
              </h3>
            </div>
          </div>

          {/* 内容 */}
          <div className="px-5 py-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>

          {/* 按钮 */}
          <div className="px-5 py-3 border-t border-gray-100 flex justify-end space-x-2.5">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                confirmButtonStyles[confirmButtonColor]
              } ${
                confirmButtonColor === 'red' ? 'focus:ring-red-500' :
                confirmButtonColor === 'blue' ? 'focus:ring-blue-500' : 'focus:ring-green-500'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 
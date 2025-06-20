'use client';

import { ReactNode, useEffect, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  width = 'lg' 
}: SidebarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const widthClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[32rem]',
    xl: 'w-[36rem]'
  };

  // 监听ESC键关闭侧边栏
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      setShouldRender(true);
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
      // 确保DOM更新后再开始动画
      setTimeout(() => setIsVisible(true), 50);
    } else if (shouldRender) {
      setIsVisible(false);
      // 等待动画完成后再隐藏组件
      setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 300);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, shouldRender]);

  if (!shouldRender) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: 'var(--overlay-background)' }}
        onClick={onClose}
      />
      
      {/* 侧边栏 */}
      <div
        className={`fixed right-0 top-0 h-full ${widthClasses[width]} bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 标题栏 - 固定在顶部 */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        )}
        
        {/* 无标题时的关闭按钮 */}
        {!title && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        )}
        
        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* Footer区域 - 固定在底部 */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </>
  );
} 
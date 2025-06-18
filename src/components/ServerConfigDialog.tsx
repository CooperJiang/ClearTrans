import React from 'react';
import Button from './Button';

interface ServerConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ServerConfigDialog({ isOpen, onClose, onConfirm }: ServerConfigDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 transition-opacity"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        {/* 头部 */}
        <div className="p-6 pb-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
              <i className="fas fa-server text-orange-600 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">服务端未配置</h3>
              <p className="text-sm text-gray-500">需要切换到客户端模式</p>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800 leading-relaxed">
              系统检测到服务端没有配置默认的AI模型。为了正常使用翻译功能，我们将为您切换到客户端模式。
            </p>
          </div>

          {/* 步骤说明 */}
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <span>打开配置面板</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <span>自动切换到客户端模式</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <i className="fas fa-key text-blue-600 text-xs"></i>
              </div>
              <span>输入您的OpenAI API密钥</span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            variant="primary"
            size="sm"
          >
            <span className="flex items-center">
              前往配置
              <i className="fas fa-arrow-right ml-2 text-sm"></i>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
} 
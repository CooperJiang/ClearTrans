'use client';

import { useState, useEffect } from 'react';
import { initTranslateService, TranslateConfig, DEFAULT_SYSTEM_MESSAGE } from '../services/translateService';
import CustomSelect from './CustomSelect';
import { useToast } from './Toast';
import Button from './Button';
import Sidebar from './Sidebar';

interface ConfigSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

const modelOptions = [
  { code: 'gpt-4o-mini', name: 'GPT-4o Mini', flag: '⚡' },
  { code: 'gpt-4o', name: 'GPT-4o', flag: '🧠' },
  { code: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', flag: '🚀' },
];

export default function ConfigSidebar({ isOpen, onClose, onConfigSaved }: ConfigSidebarProps) {
  const [config, setConfig] = useState<TranslateConfig>({
    apiKey: '',
    baseURL: '',
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    systemMessage: DEFAULT_SYSTEM_MESSAGE,
    useServerSide: true
  });

  const { error, success } = useToast();

  useEffect(() => {
    // 从localStorage加载保存的配置
    const savedConfig = localStorage.getItem('translateConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({
          ...config,
          ...parsedConfig,
          systemMessage: parsedConfig.systemMessage || DEFAULT_SYSTEM_MESSAGE,
          maxTokens: parsedConfig.maxTokens || 4096,
          useServerSide: parsedConfig.useServerSide !== undefined ? parsedConfig.useServerSide : true
        });
        // 自动初始化服务
        initTranslateService(parsedConfig);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  const handleSave = () => {
    if (!config.useServerSide && !config.apiKey.trim()) {
      error('使用客户端模式时，请输入API Key');
      return;
    }

    // 保存配置到localStorage
    localStorage.setItem('translateConfig', JSON.stringify(config));
    
    // 初始化翻译服务
    initTranslateService(config);
    
    success('配置保存成功');
    onConfigSaved();
    onClose();
  };

  const handleReset = () => {
    if (confirm('确定要重置所有配置吗？')) {
      setConfig({
        apiKey: '',
        baseURL: '',
        model: 'gpt-4o-mini',
        maxTokens: 4096,
        systemMessage: DEFAULT_SYSTEM_MESSAGE,
        useServerSide: true
      });
      localStorage.removeItem('translateConfig');
      success('配置已重置');
    }
  };

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={onClose}
      title="翻译配置"
      width="md"
      footer={
        <div className="flex justify-between items-center">
          <Button
            onClick={handleReset}
            variant="danger"
            size="sm"
          >
            <i className="fas fa-trash-alt mr-2"></i>
            重置配置
          </Button>
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="secondary"
              size="md"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              size="md"
            >
              <i className="fas fa-save mr-2"></i>
              保存配置
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 使用模式选择 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="fas fa-server mr-2 text-indigo-500"></i>
            请求模式
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="useMode"
                checked={config.useServerSide}
                onChange={() => setConfig({ ...config, useServerSide: true })}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-sm text-gray-800">服务端模式</div>
                <div className="text-xs text-gray-500">使用内置API密钥，安全性高，推荐</div>
              </div>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="useMode"
                checked={!config.useServerSide}
                onChange={() => setConfig({ ...config, useServerSide: false })}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-sm text-gray-800">客户端模式</div>
                <div className="text-xs text-gray-500">使用您自己的API密钥</div>
              </div>
            </label>
          </div>
        </div>

        {/* API Key - 仅在客户端模式显示 */}
        {!config.useServerSide && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <i className="fas fa-key mr-2 text-blue-500"></i>
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm bg-gray-50 hover:bg-white transition-all form-input"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <i className="fas fa-shield-alt text-gray-400"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <i className="fas fa-lock mr-1 text-green-500"></i>
              密钥将安全存储在您的设备上
            </p>
          </div>
        )}

        {/* 代理地址 - 仅在客户端模式显示 */}
        {!config.useServerSide && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <i className="fas fa-globe mr-2 text-green-500"></i>
              代理地址 (可选)
            </label>
            <div className="relative">
              <input
                type="text"
                value={config.baseURL}
                onChange={(e) => setConfig({ ...config, baseURL: e.target.value })}
                placeholder="https://api.openai.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-sm bg-gray-50 hover:bg-white transition-all form-input"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <i className="fas fa-link text-gray-400"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <i className="fas fa-info-circle mr-1 text-blue-400"></i>
              留空则使用默认OpenAI API地址
            </p>
          </div>
        )}

        {/* AI模型 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="fas fa-robot mr-2 text-purple-500"></i>
            AI模型
          </label>
          <div className="w-full">
            <CustomSelect
              value={config.model || 'gpt-4o-mini'}
              onChange={(value) => setConfig({ ...config, model: value })}
              options={modelOptions}
              placeholder="选择AI模型"
            />
          </div>
        </div>

        {/* Token数量 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="fas fa-coins mr-2 text-yellow-500"></i>
            最大Token数量
          </label>
          <div className="relative">
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 4096 })}
              min="1000"
              max="8192"
              step="256"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 text-sm bg-gray-50 hover:bg-white transition-all form-input"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <span className="text-xs text-gray-400">tokens</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            建议值：4096 (平衡性能与成本)
          </p>
        </div>

        {/* 系统消息 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="fas fa-comment-dots mr-2 text-pink-500"></i>
            系统提示词
          </label>
          <textarea
            value={config.systemMessage}
            onChange={(e) => setConfig({ ...config, systemMessage: e.target.value })}
            rows={6}
            placeholder="输入自定义的系统提示词..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 text-sm bg-gray-50 hover:bg-white transition-all form-input resize-none"
          />
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            <i className="fas fa-lightbulb mr-1 text-yellow-500"></i>
            自定义AI的翻译风格和行为
          </p>
          <button
            type="button"
            onClick={() => setConfig({ ...config, systemMessage: DEFAULT_SYSTEM_MESSAGE })}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600"
          >
            恢复默认提示词
          </button>
        </div>
      </div>
    </Sidebar>
  );
} 
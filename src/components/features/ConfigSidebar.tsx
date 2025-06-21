'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initTranslateService, DEFAULT_SYSTEM_MESSAGE } from '@/services/translation';
import { TranslateConfig, TTSVoice, TTSModel } from '@/types';
import { CustomSelect, Button, Sidebar, toast } from '@/components/ui';
import { useTTS } from '@/hooks/useTTS';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage/secureStorage';

interface ConfigSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
  autoSwitchToClient?: boolean;
}

const modelOptions = [
  { code: 'gpt-4o-mini', name: 'GPT-4o Mini (推荐)', flag: '⚡' },
  { code: 'gpt-4o', name: 'GPT-4o', flag: '🧠' },
  { code: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', flag: '🚀' }
];

// 基础语音选项（适用于所有模型）
const basicVoiceOptions = [
  { code: 'alloy', name: 'Alloy (中性)', flag: '🎯' },
  { code: 'echo', name: 'Echo (男性)', flag: '🎵' },
  { code: 'fable', name: 'Fable (英式)', flag: '📚' },
  { code: 'onyx', name: 'Onyx (深沉)', flag: '🎭' },
  { code: 'nova', name: 'Nova (女性)', flag: '✨' },
  { code: 'shimmer', name: 'Shimmer (温柔)', flag: '🌟' }
];

// 高级语音选项（仅适用于 gpt-4o-mini-tts 模型）
const advancedVoiceOptions = [
  { code: 'coral', name: 'Coral (珊瑚)', flag: '🪸' },
  { code: 'verse', name: 'Verse (诗意)', flag: '📝' },
  { code: 'ballad', name: 'Ballad (民谣)', flag: '🎶' },
  { code: 'ash', name: 'Ash (灰烬)', flag: '🌫️' },
  { code: 'sage', name: 'Sage (贤者)', flag: '🧙' },
  { code: 'amuch', name: 'Amuch (阿穆奇)', flag: '🌟' },
  { code: 'aster', name: 'Aster (紫菀)', flag: '🌸' },
  { code: 'brook', name: 'Brook (溪流)', flag: '🏞️' },
  { code: 'clover', name: 'Clover (三叶草)', flag: '🍀' },
  { code: 'dan', name: 'Dan (丹)', flag: '👨' },
  { code: 'elan', name: 'Elan (活力)', flag: '⚡' },
  { code: 'marilyn', name: 'Marilyn (玛丽莲)', flag: '👩' },
  { code: 'meadow', name: 'Meadow (草原)', flag: '🌾' },
  { code: 'jazz', name: 'Jazz (爵士)', flag: '🎺' },
  { code: 'rio', name: 'Rio (里约)', flag: '🏖️' },
  { code: 'megan-wetherall', name: 'Megan Wetherall', flag: '🎤' },
  { code: 'jade-hardy', name: 'Jade Hardy', flag: '🎭' },
  { code: 'megan-wetherall-2025-03-07', name: 'Megan Wetherall (2025)', flag: '🎤' },
  { code: 'jade-hardy-2025-03-07', name: 'Jade Hardy (2025)', flag: '🎭' }
];

const ttsModelOptions = [
  { code: 'tts-1', name: 'TTS-1 (标准质量，速度快)', flag: '⚡' },
  { code: 'tts-1-hd', name: 'TTS-1-HD (高质量，速度慢)', flag: '💎' },
  { code: 'gpt-4o-mini-tts', name: 'GPT-4o-Mini-TTS (最新高级模型)', flag: '🚀' }
];

// 默认语音指令
const DEFAULT_VOICE_INSTRUCTIONS = 'As a professional language speaking teacher, you can adapt to various languages. Please read our content in a professional tone.';

// URL验证函数
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 独立的语音指令输入组件
const VoiceInstructionsInput = React.memo(({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // 当外部 value 变化时同步到本地状态
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  return (
    <div className="animate-slideDown">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        <i className="fas fa-magic mr-1"></i>
        语音指令 (可选)
      </label>
      <textarea
        value={localValue}
        onChange={handleChange}
        rows={3}
        placeholder={`例如：${DEFAULT_VOICE_INSTRUCTIONS}`}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-xs bg-gray-50 hover:bg-white transition-all resize-none"
      />
      <p className="text-xs text-gray-500 mt-1 flex items-center">
        <i className="fas fa-lightbulb mr-1 text-yellow-500"></i>
        AI 将根据您的指令调整语音风格和语调
      </p>
    </div>
  );
});

VoiceInstructionsInput.displayName = 'VoiceInstructionsInput';

export default function ConfigSidebar({ isOpen, onClose, onConfigSaved, autoSwitchToClient = false }: ConfigSidebarProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'preferences'>('basic');
  const [config, setConfig] = useState<TranslateConfig>({
    apiKey: '',
    baseURL: '',
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    systemMessage: DEFAULT_SYSTEM_MESSAGE,
    useServerSide: true,
    streamTranslation: false
  });

  // 为输入框创建本地状态，避免被外部状态重置
  const [localInputs, setLocalInputs] = useState({
    apiKey: '',
    baseURL: '',
    maxTokens: 4096,
    systemMessage: DEFAULT_SYSTEM_MESSAGE,
  });

  // 临时TTS设置状态（未保存的）
  const [tempTTSSettings, setTempTTSSettings] = useState({
    voice: 'alloy' as TTSVoice,
    model: 'tts-1' as TTSModel,
    speed: 1.0,
    enabled: true,
    voiceInstructions: DEFAULT_VOICE_INSTRUCTIONS,
  });

  const { settings: currentTTSSettings, updateSettings: updateTTSSettings } = useTTS();

  const isInitialized = useRef(false);
  const isTTSInitialized = useRef(false);

  // 同步 config 到 localInputs
  useEffect(() => {
    setLocalInputs({
      apiKey: config.apiKey || '',
      baseURL: config.baseURL || '',
      maxTokens: config.maxTokens || 4096,
      systemMessage: config.systemMessage || DEFAULT_SYSTEM_MESSAGE,
    });
  }, [config.apiKey, config.baseURL, config.maxTokens, config.systemMessage]);

  // 更新本地输入的回调函数
  const updateLocalInput = useCallback((key: keyof typeof localInputs, value: string | number) => {
    setLocalInputs(prev => ({ ...prev, [key]: value }));
    // 同时更新 config 状态
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (!isInitialized.current) {
      // 首先尝试迁移旧的配置数据
      SecureStorage.migrateTranslateConfig();
      
      // 从SecureStorage加载保存的配置
      const savedConfig = SecureStorage.get<TranslateConfig>(STORAGE_KEYS.TRANSLATE_CONFIG);
      if (savedConfig) {
        try {
          const newConfig = {
            apiKey: savedConfig.apiKey || '',
            baseURL: savedConfig.baseURL || '',
            model: savedConfig.model || 'gpt-4o-mini',
            maxTokens: savedConfig.maxTokens || 4096,
            systemMessage: savedConfig.systemMessage || DEFAULT_SYSTEM_MESSAGE,
            useServerSide: savedConfig.useServerSide !== undefined ? savedConfig.useServerSide : true,
            streamTranslation: savedConfig.streamTranslation !== undefined ? savedConfig.streamTranslation : false
          };
          setConfig(newConfig);
          // 自动初始化服务
          initTranslateService(newConfig);
        } catch (error) {
          console.error('Failed to parse saved config:', error);
        }
      } else {
        // 如果没有保存的配置，创建并保存默认配置
        const defaultConfig = {
          apiKey: '',
          baseURL: '',
          model: 'gpt-4o-mini',
          maxTokens: 4096,
          systemMessage: DEFAULT_SYSTEM_MESSAGE,
          useServerSide: true,
          streamTranslation: false
        };
        
        // 保存默认配置到 SecureStorage
        SecureStorage.set(STORAGE_KEYS.TRANSLATE_CONFIG, defaultConfig);
        
        // 设置组件状态为默认配置
        setConfig(defaultConfig);
        
        // 初始化翻译服务
        initTranslateService(defaultConfig);
        
        console.log('已自动生成默认翻译配置');
      }
      isInitialized.current = true;
    }
  }, []); // 只在组件挂载时执行一次

  // 单独处理TTS设置的初始化，只在第一次打开时加载
  useEffect(() => {
    if (isOpen && !isTTSInitialized.current) {
      // 加载当前TTS设置到临时状态
      setTempTTSSettings({
        voice: currentTTSSettings.voice,
        model: currentTTSSettings.model,
        speed: currentTTSSettings.speed,
        enabled: currentTTSSettings.enabled,
        voiceInstructions: currentTTSSettings.voiceInstructions || DEFAULT_VOICE_INSTRUCTIONS,
      });
      isTTSInitialized.current = true;
    }
  }, [isOpen]);

  // 处理自动切换到客户端模式，但只在初始化时
  useEffect(() => {
    if (autoSwitchToClient && isInitialized.current) {
      setConfig((prevConfig: TranslateConfig) => ({
        ...prevConfig,
        useServerSide: false
      }));
    }
  }, [autoSwitchToClient]);

  const handleSave = () => {
    // 基本验证
    if (!config.useServerSide && !config.apiKey.trim()) {
      toast.error('请输入有效的API密钥');
      return;
    }

    if (config.baseURL && !isValidUrl(config.baseURL)) {
      toast.error('请输入有效的API基础URL');
      return;
    }

    // 保存翻译配置到SecureStorage
    SecureStorage.set(STORAGE_KEYS.TRANSLATE_CONFIG, config);
    
    // 初始化翻译服务
    initTranslateService(config);

    // 保存TTS设置
    updateTTSSettings(tempTTSSettings);
    
    toast.success('配置保存成功！');
    
    // 立即触发配置更新回调，确保UI实时更新
    onConfigSaved();
    
    // 延迟关闭侧边栏，让用户看到保存成功的反馈
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleCancel = () => {
    console.log('handleCancel called - restoring to saved state');
    // 取消时恢复到原始设置
    const savedConfig = SecureStorage.get<TranslateConfig>(STORAGE_KEYS.TRANSLATE_CONFIG);
    if (savedConfig) {
      try {
        setConfig({
          ...savedConfig,
          systemMessage: savedConfig.systemMessage || DEFAULT_SYSTEM_MESSAGE,
          maxTokens: savedConfig.maxTokens || 4096,
          useServerSide: savedConfig.useServerSide !== undefined ? savedConfig.useServerSide : true,
          streamTranslation: savedConfig.streamTranslation !== undefined ? savedConfig.streamTranslation : false
        });
      } catch (error) {
        console.error('Failed to restore config:', error);
      }
    }

    // 恢复TTS设置
    setTempTTSSettings({
      voice: currentTTSSettings.voice,
      model: currentTTSSettings.model,
      speed: currentTTSSettings.speed,
      enabled: currentTTSSettings.enabled,
      voiceInstructions: currentTTSSettings.voiceInstructions || DEFAULT_VOICE_INSTRUCTIONS,
    });

    onClose();
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有配置吗？此操作无法撤销。')) {
      setConfig({
        apiKey: '',
        baseURL: '',
        model: 'gpt-4o-mini',
        maxTokens: 4096,
        systemMessage: DEFAULT_SYSTEM_MESSAGE,
        useServerSide: true,
        streamTranslation: false
      });

      setTempTTSSettings({
        voice: 'alloy',
        model: 'tts-1',
        speed: 1.0,
        enabled: true,
        voiceInstructions: DEFAULT_VOICE_INSTRUCTIONS,
      });

      SecureStorage.remove(STORAGE_KEYS.TRANSLATE_CONFIG);
      toast.info('配置已重置');
    }
  };

  // 临时更新TTS设置（不保存）
  const updateTempTTSSettings = useCallback((newSettings: Partial<typeof tempTTSSettings>) => {
    setTempTTSSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // 专门处理语音指令更新的稳定回调
  const handleVoiceInstructionsChange = useCallback((value: string) => {
    updateTempTTSSettings({ voiceInstructions: value });
  }, [updateTempTTSSettings]);

  // 重新设计的 Tab 切换组件
  const TabButton = ({ label, icon, isActive, onClick }: {
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`relative px-3 py-2 text-xs font-medium rounded-md transition-all duration-300 transform ${
        isActive
          ? 'bg-blue-500 text-white shadow-md scale-105'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:scale-102'
      }`}
    >
      <i className={`${icon} mr-1.5 text-xs transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}></i>
      <span className="transition-all duration-300">{label}</span>
      {isActive && (
        <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-blue-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );

  // 基础设置内容 - 使用 useMemo 防止重新渲染导致输入框失焦
  const BasicSettings = useMemo(() => (
    <div className="space-y-6 animate-fadeIn">
      {/* 使用模式选择 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <i className="fas fa-server mr-2 text-indigo-500"></i>
          请求模式
        </label>
        <div className="space-y-3">
          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
            <input
              type="radio"
              name="useMode"
              checked={config.useServerSide}
              onChange={() => setConfig({ ...config, useServerSide: true })}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-sm text-gray-800">服务端模式</div>
              <div className="text-xs text-gray-500">完全免费，使用内置模型，推荐</div>
            </div>
          </label>
          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
            <input
              type="radio"
              name="useMode"
              checked={!config.useServerSide}
              onChange={() => setConfig({ ...config, useServerSide: false })}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-sm text-gray-800">客户端模式</div>
              <div className="text-xs text-gray-500">使用您自己的API密钥和高级模型</div>
            </div>
          </label>
        </div>
      </div>

      {/* 流式翻译设置 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <i className="fas fa-stream mr-2 text-cyan-500"></i>
          翻译模式
        </label>
        <div>
          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
            <input
              type="checkbox"
              checked={config.streamTranslation}
              onChange={(e) => setConfig({ ...config, streamTranslation: e.target.checked })}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <div className="font-medium text-sm text-gray-800">启用流式翻译</div>
                <span className="ml-2 px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded-full font-medium">
                  Beta
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                实时显示翻译进度，适合长文本翻译，提升用户体验
              </div>
            </div>
            <div className="ml-2">
              <i className="fas fa-bolt text-cyan-500"></i>
            </div>
          </label>
        </div>
        {config.streamTranslation && (
          <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg animate-slideDown">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-cyan-500 mr-2 mt-0.5"></i>
              <div className="text-xs text-cyan-700">
                <div className="font-medium mb-1">流式翻译说明：</div>
                <ul className="space-y-1 text-cyan-600">
                  <li>• 翻译内容将逐字显示，无需等待完整结果</li>
                  <li>• 特别适合翻译长文档和文章</li>
                  <li>• 可以实时查看翻译进度和质量</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 客户端模式配置 - 仅在客户端模式显示 */}
      {!config.useServerSide && (
        <div className="animate-slideDown">
          {/* API Key */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <i className="fas fa-key mr-2 text-blue-500"></i>
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={localInputs.apiKey}
                onChange={(e) => updateLocalInput('apiKey', e.target.value)}
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

          {/* 代理地址 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <i className="fas fa-globe mr-2 text-green-500"></i>
              代理地址 (可选)
            </label>
            <div className="relative">
              <input
                type="text"
                value={localInputs.baseURL}
                onChange={(e) => updateLocalInput('baseURL', e.target.value)}
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

          {/* AI模型 - 仅在客户端模式显示 */}
          <div className="mb-6">
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
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <i className="fas fa-coins mr-2 text-yellow-500"></i>
              最大Token数量
            </label>
            <div className="relative">
              <input
                type="number"
                value={localInputs.maxTokens}
                onChange={(e) => updateLocalInput('maxTokens', parseInt(e.target.value) || 4096)}
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
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 mb-2 flex items-center">
                <i className="fas fa-info-circle mr-1"></i>
                可用变量参数：
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <div><code className="bg-blue-100 px-1 rounded">{'{{to}}'}</code> - 会被替换为目标语言</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{{text}}'}</code> - 会被替换为翻译内容</div>
              </div>
            </div>
            <textarea
              value={localInputs.systemMessage}
              onChange={(e) => updateLocalInput('systemMessage', e.target.value)}
              rows={6}
              placeholder="输入自定义的系统提示词..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 text-sm bg-gray-50 hover:bg-white transition-all form-input resize-none"
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <i className="fas fa-lightbulb mr-1 text-yellow-500"></i>
              自定义AI的翻译风格和行为，使用变量参数可以动态替换内容
            </p>
            <button
              type="button"
              onClick={() => updateLocalInput('systemMessage', DEFAULT_SYSTEM_MESSAGE)}
              className="mt-2 text-xs text-blue-500 hover:text-blue-600"
            >
              恢复默认提示词
            </button>
          </div>
        </div>
      )}

      {/* 服务端模式提示 */}
      {config.useServerSide && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 animate-slideDown">
          <div className="flex items-start">
            <i className="fas fa-gift text-green-500 mr-3 mt-0.5"></i>
            <div>
              <h4 className="text-sm font-medium text-green-800 mb-1">🎉 服务端模式已启用</h4>
              <p className="text-xs text-green-700 leading-relaxed">
                服务端模式完全<span className="font-semibold text-green-800">免费</span>，我们为用户准备了高质量的AI模型供您使用。
                如果您需要使用特定的高级模型，也可以切换到客户端模式进行自定义配置。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  ), [config, localInputs, updateLocalInput]);

  // 根据选择的模型获取可用的语音选项
  const getAvailableVoiceOptions = useCallback(() => {
    if (tempTTSSettings.model === 'gpt-4o-mini-tts') {
      return [...basicVoiceOptions, ...advancedVoiceOptions];
    }
    return basicVoiceOptions;
  }, [tempTTSSettings.model]);

  // 当模型变更时，检查当前语音是否仍然可用
  const handleModelChange = useCallback((newModel: TTSModel) => {
    const availableVoices = newModel === 'gpt-4o-mini-tts' 
      ? [...basicVoiceOptions, ...advancedVoiceOptions]
      : basicVoiceOptions;
    
    const currentVoiceAvailable = availableVoices.some(v => v.code === tempTTSSettings.voice);
    
    updateTempTTSSettings({ 
      model: newModel,
      // 如果当前语音不可用，重置为 alloy
      ...(currentVoiceAvailable ? {} : { voice: 'alloy' as TTSVoice }),
      // 如果切换到非高级模型，清空 voice_instructions
      ...(newModel !== 'gpt-4o-mini-tts' ? { voiceInstructions: '' } : {})
    });
  }, [tempTTSSettings.voice, updateTempTTSSettings]);

  // 个人偏好设置内容
  const PreferencesSettings = useMemo(() => (
    <div className="space-y-6 animate-fadeIn">
      {/* TTS 语音合成设置 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <i className="fas fa-volume-up mr-2 text-orange-500"></i>
          语音合成设置
        </label>
        
        {/* 启用 TTS */}
        <div className="mb-4">
          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
            <input
              type="checkbox"
              checked={tempTTSSettings.enabled}
              onChange={(e) => updateTempTTSSettings({ enabled: e.target.checked })}
              className="mr-3"
            />
            <div>
              <div className="font-medium text-sm text-gray-800">启用 AI 语音合成</div>
              <div className="text-xs text-gray-500">使用 OpenAI TTS 进行高质量语音合成</div>
            </div>
          </label>
        </div>

        {tempTTSSettings.enabled && (
          <div className="space-y-4 ml-4 pl-4 border-l-2 border-orange-200 animate-slideDown">
            {/* 模型选择 - 优先级最高 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                <i className="fas fa-microchip mr-1"></i>
                TTS 模型
              </label>
              <CustomSelect
                value={tempTTSSettings.model}
                onChange={(value) => handleModelChange(value as TTSModel)}
                options={ttsModelOptions}
                placeholder="选择TTS模型"
              />
              {tempTTSSettings.model === 'gpt-4o-mini-tts' && (
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <i className="fas fa-star mr-1"></i>
                  高级模型支持更多语音选项和语音指令
                </p>
              )}
            </div>

            {/* 语音选择 - 根据模型动态显示 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                <i className="fas fa-user-tie mr-1"></i>
                语音类型
              </label>
              <CustomSelect
                value={tempTTSSettings.voice}
                onChange={(value) => updateTempTTSSettings({ voice: value as TTSVoice })}
                options={getAvailableVoiceOptions()}
                placeholder="选择语音类型"
              />
              <p className="text-xs text-gray-500 mt-1">
                {tempTTSSettings.model === 'gpt-4o-mini-tts' 
                  ? `可选择 ${getAvailableVoiceOptions().length} 种语音类型`
                  : `基础模型支持 ${basicVoiceOptions.length} 种语音类型`
                }
              </p>
            </div>

            {/* 语音指令 - 仅在 gpt-4o-mini-tts 模型下显示 */}
            {tempTTSSettings.model === 'gpt-4o-mini-tts' && (
              <VoiceInstructionsInput
                key="voice-instructions"
                value={tempTTSSettings.voiceInstructions || ''}
                onChange={handleVoiceInstructionsChange}
              />
            )}

            {/* 语速控制 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                <i className="fas fa-tachometer-alt mr-1"></i>
                语速: {tempTTSSettings.speed}x
              </label>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.25"
                value={tempTTSSettings.speed}
                onChange={(e) => updateTempTTSSettings({ speed: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.25x</span>
                <span>1.0x</span>
                <span>4.0x</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 未来可以在这里添加更多个人偏好设置 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center text-gray-500">
          <i className="fas fa-cog mr-3"></i>
          <div>
            <p className="text-sm font-medium">更多个人偏好设置</p>
            <p className="text-xs">即将推出更多个性化配置选项</p>
          </div>
        </div>
      </div>
    </div>
  ), [tempTTSSettings, updateTempTTSSettings, handleModelChange, getAvailableVoiceOptions]);

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={handleCancel}
      title=""
      width="lg"
      footer={
        <div className="flex justify-between items-center py-2">
          <button
            onClick={handleReset}
            className="flex items-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-all duration-200 hover:shadow-sm"
          >
            <i className="fas fa-trash-alt mr-1.5 text-xs"></i>
            重置配置
          </button>
          <div className="flex space-x-2">
            <Button
              onClick={handleCancel}
              variant="secondary"
              size="sm"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
            >
              <i className="fas fa-save mr-2"></i>
              保存配置
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Tab 切换按钮作为标题 - 固定在顶部 */}
        <div className="flex space-x-1.5 p-1.5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100 sticky top-0 z-20 backdrop-blur-sm shadow-sm">
          <TabButton
            label="基础设置"
            icon="fas fa-cog"
            isActive={activeTab === 'basic'}
            onClick={() => setActiveTab('basic')}
          />
          <TabButton
            label="个人偏好"
            icon="fas fa-user-cog"
            isActive={activeTab === 'preferences'}
            onClick={() => setActiveTab('preferences')}
          />
        </div>

        {/* Tab 内容 - 可滚动区域 */}
        <div className="flex-1 relative overflow-hidden mt-4">
          <div className={`h-full overflow-y-auto transition-all duration-500 ease-in-out ${
            activeTab === 'basic' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute top-0 left-0 w-full'
          }`}>
            {BasicSettings}
          </div>
          <div className={`h-full overflow-y-auto transition-all duration-500 ease-in-out ${
            activeTab === 'preferences' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute top-0 left-0 w-full'
          }`}>
            {PreferencesSettings}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </Sidebar>
  );
} 
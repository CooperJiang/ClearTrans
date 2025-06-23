'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initTranslateService, getTranslateService, DEFAULT_SYSTEM_MESSAGE } from '@/services/translation';
import { TranslateConfig, TTSVoice, TTSModel, AIProvider, OpenAIModel, GeminiModel } from '@/types';
import type { TTSSettings, GeminiTTSVoice, GeminiTTSModel, OpenAITTSVoice, OpenAITTSModel, GeminiTTSSettings, OpenAITTSSettings, GeminiLanguage, TTSFormat } from '@/types/tts';
import { CustomSelect, Button, Sidebar, toast } from '@/components/ui';
import { useTTS } from '@/hooks/useTTS';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage/secureStorage';
import { 
  GEMINI_MODELS, 
  GEMINI_VOICES, 
  GEMINI_TTS_MODELS,
  DEFAULT_GEMINI_TTS_CONFIG
} from '@/constants/gemini';

interface ConfigSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
  autoSwitchToClient?: boolean;
}

// AI服务提供商选项
const providerOptions = [
  { code: 'openai', name: 'OpenAI', flag: '🤖', description: '成熟稳定，功能全面' },
  { code: 'gemini', name: 'Google Gemini', flag: '💫', description: '新一代AI，性能强劲' }
];

// OpenAI模型选项
const openAIModelOptions = [
  { code: 'gpt-4o-mini', name: 'GPT-4o Mini (推荐)', flag: '⚡' },
  { code: 'gpt-4o', name: 'GPT-4o', flag: '🧠' },
  { code: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', flag: '🚀' }
];

// Gemini模型选项 
const geminiModelOptions = GEMINI_MODELS.map(model => ({
  code: model.value,
  name: model.label,
  flag: model.value.includes('flash') ? '⚡' : '💎'
}));

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

// Gemini语音选项
const geminiVoiceOptions = GEMINI_VOICES.map(voice => ({
  code: voice.value,
  name: `${voice.label} (${voice.category})`,
  flag: voice.category === '明亮' ? '☀️' : 
        voice.category === '坚定' ? '💪' :
        voice.category === '活力' ? '⚡' :
        voice.category === '轻松' ? '😌' :
        voice.category === '清晰' ? '🔍' :
        voice.category === '信息' ? '📢' :
        voice.category === '年轻' ? '👶' :
        voice.category === '温和' ? '🌸' :
        voice.category === '平滑' ? '🌊' : '✨',
  description: voice.description
}));

const openAITTSModelOptions = [
  { code: 'tts-1', name: 'TTS-1 (标准质量，速度快)', flag: '⚡' },
  { code: 'tts-1-hd', name: 'TTS-1-HD (高质量，速度慢)', flag: '💎' },
  { code: 'gpt-4o-mini-tts', name: 'GPT-4o-Mini-TTS (最新高级模型)', flag: '🚀' }
];

const geminiTTSModelOptions = GEMINI_TTS_MODELS.map(model => ({
  code: model.value,
  name: model.label,
  flag: model.value.includes('flash') ? '⚡' : '💎'
}));

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
    provider: 'openai',
    apiKey: '',
    baseURL: '',
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    systemMessage: DEFAULT_SYSTEM_MESSAGE,
    useServerSide: true,
    streamTranslation: false
  });

  // 为每个提供商维护独立的配置状态
  const [providerConfigs, setProviderConfigs] = useState<{
    openai: Partial<TranslateConfig>;
    gemini: Partial<TranslateConfig>;
  }>({
    openai: {
      apiKey: '',
      baseURL: '',
      model: 'gpt-4o-mini'
    },
    gemini: {
      geminiApiKey: '',
      geminiBaseURL: '',
      geminiModel: 'gemini-2.0-flash'
    }
  });

  // 为输入框创建本地状态，避免被外部状态重置
  const [localInputs, setLocalInputs] = useState({
    apiKey: '',
    baseURL: '',
    geminiApiKey: '',
    geminiBaseURL: '',
    maxTokens: 4096,
    systemMessage: DEFAULT_SYSTEM_MESSAGE,
  });

  // 临时TTS设置状态（未保存的）
  const [tempTTSSettings, setTempTTSSettings] = useState({
    provider: 'openai' as const,
    voice: 'alloy' as TTSVoice,
    model: 'tts-1' as TTSModel,
    speed: 1.0,
    enabled: true,
    useServerSide: true,
    voiceInstructions: DEFAULT_VOICE_INSTRUCTIONS,
    stylePrompt: '', // Gemini专用
    format: 'mp3' as const, // Gemini专用
    language: 'zh-CN' as const, // Gemini专用
  });

  const { settings: currentTTSSettings, updateSettings: updateTTSSettings } = useTTS();

  const isInitialized = useRef(false);
  const isTTSInitialized = useRef(false);

  // 同步 config 到 localInputs - 修复配置同步逻辑
  useEffect(() => {
    console.log('🔄 同步配置到本地输入:', {
      provider: config.provider,
      hasApiKey: config.provider === 'openai' ? !!config.apiKey : !!config.geminiApiKey,
      hasBaseURL: config.provider === 'openai' ? !!config.baseURL : !!config.geminiBaseURL
    });

    // 不再清空其他提供商的字段，而是保持所有字段的值
    setLocalInputs(prev => ({
      ...prev,
      // OpenAI 字段
      apiKey: config.provider === 'openai' ? (config.apiKey || '') : prev.apiKey,
      baseURL: config.provider === 'openai' ? (config.baseURL || '') : prev.baseURL,
      // Gemini 字段
      geminiApiKey: config.provider === 'gemini' ? (config.geminiApiKey || '') : prev.geminiApiKey,
      geminiBaseURL: config.provider === 'gemini' ? (config.geminiBaseURL || '') : prev.geminiBaseURL,
      // 共享字段
      maxTokens: config.maxTokens || 4096,
      systemMessage: config.systemMessage || DEFAULT_SYSTEM_MESSAGE,
    }));
  }, [config.provider, config.apiKey, config.baseURL, config.geminiApiKey, config.geminiBaseURL, config.maxTokens, config.systemMessage]);

  // 更新本地输入的回调函数 - 同时更新config和providerConfigs
  const updateLocalInput = useCallback((key: keyof typeof localInputs, value: string | number) => {
    console.log('📝 更新本地输入:', { key, value: typeof value === 'string' && key.includes('Key') ? value.substring(0, 10) + '...' : value });
    
    setLocalInputs(prev => ({ ...prev, [key]: value }));
    
    // 更新对应提供商的配置
    if (key === 'apiKey' || key === 'baseURL') {
      setProviderConfigs(prev => ({
        ...prev,
        openai: { ...prev.openai, [key]: value }
      }));
    } else if (key === 'geminiApiKey' || key === 'geminiBaseURL') {
      setProviderConfigs(prev => ({
        ...prev,
        gemini: { ...prev.gemini, [key]: value }
      }));
    }
    
    // 同时更新当前 config 状态，确保实时同步
    setConfig(prev => {
      if (key === 'apiKey' && prev.provider === 'openai') {
        return { ...prev, apiKey: value as string };
      }
      if (key === 'baseURL' && prev.provider === 'openai') {
        return { ...prev, baseURL: value as string };
      }
      if (key === 'geminiApiKey' && prev.provider === 'gemini') {
        return { ...prev, geminiApiKey: value as string };
      }
      if (key === 'geminiBaseURL' && prev.provider === 'gemini') {
        return { ...prev, geminiBaseURL: value as string };
      }
      if (key === 'maxTokens') {
        return { ...prev, maxTokens: value as number };
      }
      if (key === 'systemMessage') {
        return { ...prev, systemMessage: value as string };
      }
      return prev;
    });
  }, []);

  // 处理提供商切换 - 修复配置保持逻辑
  const handleProviderChange = useCallback((newProvider: AIProvider) => {
    console.log('🔄 切换AI提供商:', { from: config.provider, to: newProvider });
    
    if (newProvider === 'gemini') {
      const geminiConfig: TranslateConfig = {
        provider: 'gemini',
        // 使用保存的Gemini配置，而不是清空
        geminiApiKey: providerConfigs.gemini.geminiApiKey || localInputs.geminiApiKey || '',
        geminiBaseURL: providerConfigs.gemini.geminiBaseURL || localInputs.geminiBaseURL || '',
        geminiModel: providerConfigs.gemini.geminiModel || 'gemini-2.0-flash',
        maxTokens: config.maxTokens || 4096,
        systemMessage: config.systemMessage || DEFAULT_SYSTEM_MESSAGE,
        useServerSide: config.useServerSide,
        streamTranslation: config.streamTranslation
      };
      setConfig(geminiConfig);
      
      // 同时更新TTS设置
      setTempTTSSettings(prev => ({
        ...DEFAULT_GEMINI_TTS_CONFIG,
        enabled: prev.enabled,
        speed: prev.speed
      }));
    } else {
      const openaiConfig: TranslateConfig = {
        provider: 'openai',
        // 使用保存的OpenAI配置，而不是清空
        apiKey: providerConfigs.openai.apiKey || localInputs.apiKey || '',
        baseURL: providerConfigs.openai.baseURL || localInputs.baseURL || '',
        model: providerConfigs.openai.model || 'gpt-4o-mini',
        maxTokens: config.maxTokens || 4096,
        systemMessage: config.systemMessage || DEFAULT_SYSTEM_MESSAGE,
        useServerSide: config.useServerSide,
        streamTranslation: config.streamTranslation
      };
      setConfig(openaiConfig);
      
      // 恢复OpenAI TTS设置
      setTempTTSSettings(prev => ({
        provider: 'openai',
        voice: 'alloy',
        model: 'tts-1',
        speed: prev.speed,
        enabled: prev.enabled,
        useServerSide: true,
        voiceInstructions: DEFAULT_VOICE_INSTRUCTIONS,
        stylePrompt: '',
        format: 'mp3',
        language: 'zh-CN'
      }));
    }
  }, [config.maxTokens, config.systemMessage, config.useServerSide, config.streamTranslation, providerConfigs, localInputs]);

  // 获取当前模型选项
  const getCurrentModelOptions = useCallback(() => {
    return config.provider === 'gemini' ? geminiModelOptions : openAIModelOptions;
  }, [config.provider]);

  // 获取当前语音选项
  const getCurrentVoiceOptions = useCallback(() => {
    if (tempTTSSettings.provider === 'gemini') {
      return geminiVoiceOptions;
    } else {
      // OpenAI语音选项
      if (tempTTSSettings.model === 'gpt-4o-mini-tts') {
        return [...basicVoiceOptions, ...advancedVoiceOptions];
      }
      return basicVoiceOptions;
    }
  }, [tempTTSSettings.provider, tempTTSSettings.model]);

  // 获取当前TTS模型选项
  const getCurrentTTSModelOptions = useCallback(() => {
    return tempTTSSettings.provider === 'gemini' ? geminiTTSModelOptions : openAITTSModelOptions;
  }, [tempTTSSettings.provider]);

  useEffect(() => {
    if (!isInitialized.current) {
      // 首先尝试迁移旧的配置数据
      SecureStorage.migrateTranslateConfig();
      
      // 从SecureStorage加载保存的配置
      const savedConfig = SecureStorage.get<TranslateConfig>(STORAGE_KEYS.TRANSLATE_CONFIG);
      console.log('📂 加载保存的配置:', savedConfig);
      
      if (savedConfig) {
        try {
          // 确保配置完整性，处理新旧版本兼容
          const completeConfig: TranslateConfig = {
            provider: savedConfig.provider || 'openai',
            useServerSide: savedConfig.useServerSide !== undefined ? savedConfig.useServerSide : true,
            streamTranslation: savedConfig.streamTranslation !== undefined ? savedConfig.streamTranslation : false,
            maxTokens: savedConfig.maxTokens || 4096,
            systemMessage: savedConfig.systemMessage || DEFAULT_SYSTEM_MESSAGE,
            // OpenAI 配置
            ...(savedConfig.provider === 'openai' ? {
              apiKey: savedConfig.apiKey || '',
              baseURL: savedConfig.baseURL || '',
              model: savedConfig.model || 'gpt-4o-mini'
            } : {}),
            // Gemini 配置 - 修复旧的TTS模型配置
            ...(savedConfig.provider === 'gemini' ? {
              geminiApiKey: savedConfig.geminiApiKey || '',
              geminiBaseURL: savedConfig.geminiBaseURL || '',
              // 如果是旧的TTS模型，迁移为翻译模型
              geminiModel: (savedConfig.geminiModel && savedConfig.geminiModel.includes('tts')) 
                ? 'gemini-2.0-flash' 
                : (savedConfig.geminiModel || 'gemini-2.0-flash')
            } : {})
          };

          console.log('✅ 完整配置:', completeConfig);
          
          // 如果进行了模型迁移，显示提示
          if (savedConfig.provider === 'gemini' && savedConfig.geminiModel && savedConfig.geminiModel.includes('tts')) {
            console.log('🔄 检测到旧的TTS模型配置，已自动迁移为翻译模型:', completeConfig.geminiModel);
          }
          
          setConfig(completeConfig);
          
          // 初始化各个提供商的独立配置状态
          setProviderConfigs({
            openai: {
              apiKey: savedConfig.apiKey || '',
              baseURL: savedConfig.baseURL || '',
              model: savedConfig.model || 'gpt-4o-mini'
            },
            gemini: {
              geminiApiKey: savedConfig.geminiApiKey || '',
              geminiBaseURL: savedConfig.geminiBaseURL || '',
              geminiModel: (savedConfig.geminiModel && savedConfig.geminiModel.includes('tts')) 
                ? 'gemini-2.0-flash' 
                : (savedConfig.geminiModel || 'gemini-2.0-flash')
            }
          });
          
          // 初始化本地输入状态 - 包含所有提供商的配置
          setLocalInputs({
            apiKey: savedConfig.apiKey || '',
            baseURL: savedConfig.baseURL || '',
            geminiApiKey: savedConfig.geminiApiKey || '',
            geminiBaseURL: savedConfig.geminiBaseURL || '',
            maxTokens: completeConfig.maxTokens || 4096,
            systemMessage: completeConfig.systemMessage || DEFAULT_SYSTEM_MESSAGE,
          });
          
          // 自动初始化服务
          initTranslateService(completeConfig);
        } catch (error) {
          console.error('Failed to parse saved config:', error);
          // 如果解析失败，使用默认配置
          initializeDefaultConfig();
        }
      } else {
        // 如果没有保存的配置，创建并保存默认配置
        initializeDefaultConfig();
      }
      isInitialized.current = true;
    }
  }, []); // 只在组件挂载时执行一次

  // 初始化默认配置的函数
  const initializeDefaultConfig = () => {
    const defaultConfig: TranslateConfig = {
      provider: 'openai',
      apiKey: '',
      baseURL: '',
      model: 'gpt-4o-mini',
      maxTokens: 4096,
      systemMessage: DEFAULT_SYSTEM_MESSAGE,
      useServerSide: true,
      streamTranslation: false
    };
    
    console.log('🔧 初始化默认配置:', defaultConfig);
    
    // 保存默认配置到 SecureStorage
    SecureStorage.set(STORAGE_KEYS.TRANSLATE_CONFIG, defaultConfig);
    
    // 设置组件状态为默认配置
    setConfig(defaultConfig);
    
    // 初始化本地输入状态
    setLocalInputs({
      apiKey: '',
      baseURL: '',
      geminiApiKey: '',
      geminiBaseURL: '',
      maxTokens: 4096,
      systemMessage: DEFAULT_SYSTEM_MESSAGE,
    });
    
    // 初始化翻译服务
    initTranslateService(defaultConfig);
    
    console.log('已自动生成默认翻译配置');
  };

  // 单独处理TTS设置的初始化，只在第一次打开时加载
  useEffect(() => {
    if (!isTTSInitialized.current && isOpen) {
      // 从存储加载TTS设置
      const savedTTSSettings = SecureStorage.get<TTSSettings>(STORAGE_KEYS.TTS_SETTINGS);
      console.log('📂 加载保存的TTS设置:', savedTTSSettings);
      
      if (savedTTSSettings) {
        setTempTTSSettings({
          provider: savedTTSSettings.provider || 'openai',
          voice: savedTTSSettings.voice || 'alloy',
          model: savedTTSSettings.model || 'tts-1',
          speed: savedTTSSettings.speed || 1.0,
          enabled: savedTTSSettings.enabled !== undefined ? savedTTSSettings.enabled : true,
          useServerSide: true,
          voiceInstructions: 'voiceInstructions' in savedTTSSettings ? savedTTSSettings.voiceInstructions : DEFAULT_VOICE_INSTRUCTIONS,
          stylePrompt: 'stylePrompt' in savedTTSSettings ? savedTTSSettings.stylePrompt : '',
          format: 'format' in savedTTSSettings ? savedTTSSettings.format : 'mp3',
          language: 'language' in savedTTSSettings ? savedTTSSettings.language : 'zh-CN',
        });
      } else {
        // 根据当前基础设置的提供商初始化TTS设置
        if (config.provider === 'gemini') {
          setTempTTSSettings({
            ...DEFAULT_GEMINI_TTS_CONFIG,
            enabled: true,
            useServerSide: true
          });
        } else {
          setTempTTSSettings({
            provider: 'openai',
            voice: 'alloy',
            model: 'tts-1',
            speed: 1.0,
            enabled: true,
            useServerSide: true,
            voiceInstructions: DEFAULT_VOICE_INSTRUCTIONS,
            stylePrompt: '',
            format: 'mp3',
            language: 'zh-CN'
          });
        }
      }
      
      isTTSInitialized.current = true;
    }
  }, [isOpen, config.provider]);

  // 监听基础设置提供商变化，自动同步TTS设置提供商
  useEffect(() => {
    if (isInitialized.current && isTTSInitialized.current) {
      if (config.provider === 'gemini' && tempTTSSettings.provider !== 'gemini') {
        console.log('🔄 基础设置切换到Gemini，自动更新TTS设置');
        setTempTTSSettings(prev => ({
          ...DEFAULT_GEMINI_TTS_CONFIG,
          enabled: prev.enabled,
          speed: prev.speed,
          useServerSide: true
        }));
      } else if (config.provider === 'openai' && tempTTSSettings.provider !== 'openai') {
        console.log('🔄 基础设置切换到OpenAI，自动更新TTS设置');
        setTempTTSSettings(prev => ({
          provider: 'openai',
          voice: 'alloy',
          model: 'tts-1',
          speed: prev.speed,
          enabled: prev.enabled,
          useServerSide: true,
          voiceInstructions: DEFAULT_VOICE_INSTRUCTIONS,
          stylePrompt: '',
          format: 'mp3',
          language: 'zh-CN'
        }));
      }
    }
  }, [config.provider, tempTTSSettings.provider]);

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
    if (!config.useServerSide) {
      if (config.provider === 'openai' && !localInputs.apiKey?.trim()) {
        toast.error('请输入有效的OpenAI API密钥');
        return;
      }
      if (config.provider === 'gemini') {
        if (!localInputs.geminiApiKey?.trim()) {
          toast.error('请输入有效的Gemini API密钥');
          return;
        }
      }
    }

    // URL验证
    if (config.provider === 'openai' && localInputs.baseURL && !isValidUrl(localInputs.baseURL)) {
      toast.error('请输入有效的OpenAI API基础URL');
      return;
    }
    if (config.provider === 'gemini' && localInputs.geminiBaseURL && !isValidUrl(localInputs.geminiBaseURL)) {
      toast.error('请输入有效的Gemini API基础URL');
      return;
    }

    // 构建最终配置，确保所有参数正确传递
    const finalConfig: TranslateConfig = {
      ...config,
      // 同步本地输入的值
      ...(config.provider === 'openai' ? {
        apiKey: localInputs.apiKey,
        baseURL: localInputs.baseURL || '',
        model: config.model as OpenAIModel,
      } : {
        geminiApiKey: localInputs.geminiApiKey,
        geminiBaseURL: localInputs.geminiBaseURL || '',
        geminiModel: config.geminiModel as GeminiModel,
      }),
      maxTokens: localInputs.maxTokens,
      systemMessage: localInputs.systemMessage
    };

    // 扩展配置以包含所有提供商的设置
    const expandedConfig = {
      ...finalConfig,
      // 保存所有提供商的配置，而不仅仅是当前的
      apiKey: localInputs.apiKey,
      baseURL: localInputs.baseURL || '',
      geminiApiKey: localInputs.geminiApiKey,
      geminiBaseURL: localInputs.geminiBaseURL || '',
      model: config.provider === 'openai' ? config.model : (providerConfigs.openai.model || 'gpt-4o-mini'),
      geminiModel: config.provider === 'gemini' ? config.geminiModel : (providerConfigs.gemini.geminiModel || 'gemini-2.0-flash')
    };

    console.log('💾 保存扩展配置:', {
      provider: expandedConfig.provider,
      useServerSide: expandedConfig.useServerSide,
      openaiModel: expandedConfig.model,
      geminiModel: expandedConfig.geminiModel,
      hasOpenAIKey: !!expandedConfig.apiKey,
      hasGeminiKey: !!expandedConfig.geminiApiKey,
      openaiBaseURL: expandedConfig.baseURL,
      geminiBaseURL: expandedConfig.geminiBaseURL
    });

    // 保存翻译配置到SecureStorage
    SecureStorage.set(STORAGE_KEYS.TRANSLATE_CONFIG, expandedConfig);
    
    // 初始化翻译服务
    initTranslateService(expandedConfig);

    // 保存TTS设置 - 根据提供商构建正确的设置结构
    let ttsSettings: TTSSettings;
    
    if (tempTTSSettings.provider === 'gemini') {
      ttsSettings = {
        provider: 'gemini',
        voice: tempTTSSettings.voice as GeminiTTSVoice,
        model: tempTTSSettings.model as GeminiTTSModel,
        speed: tempTTSSettings.speed,
        enabled: tempTTSSettings.enabled,
        useServerSide: true,
        language: tempTTSSettings.language as GeminiLanguage,
        format: tempTTSSettings.format as TTSFormat,
        stylePrompt: tempTTSSettings.stylePrompt
      } as GeminiTTSSettings;
    } else {
      ttsSettings = {
        provider: 'openai',
        voice: tempTTSSettings.voice as OpenAITTSVoice,
        model: tempTTSSettings.model as OpenAITTSModel,
        speed: tempTTSSettings.speed,
        enabled: tempTTSSettings.enabled,
        useServerSide: true,
        voiceInstructions: tempTTSSettings.voiceInstructions
      } as OpenAITTSSettings;
    }

    console.log('💾 保存TTS设置:', ttsSettings);
    updateTTSSettings(ttsSettings);
    
    toast.success('配置保存成功！');
    
    // 立即触发配置更新回调，确保UI实时更新
    onConfigSaved();
    
    // 延迟关闭侧边栏，让用户看到保存成功的反馈
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleCancel = () => {
    console.log('❌ 取消配置，恢复到保存状态');
    // 取消时恢复到原始设置
    const savedConfig = SecureStorage.get<TranslateConfig>(STORAGE_KEYS.TRANSLATE_CONFIG);
    if (savedConfig) {
      try {
        const restoredConfig: TranslateConfig = {
          provider: savedConfig.provider || 'openai',
          useServerSide: savedConfig.useServerSide !== undefined ? savedConfig.useServerSide : true,
          streamTranslation: savedConfig.streamTranslation !== undefined ? savedConfig.streamTranslation : false,
          maxTokens: savedConfig.maxTokens || 4096,
          systemMessage: savedConfig.systemMessage || DEFAULT_SYSTEM_MESSAGE,
          // OpenAI 配置
          ...(savedConfig.provider === 'openai' ? {
            apiKey: savedConfig.apiKey || '',
            baseURL: savedConfig.baseURL || '',
            model: savedConfig.model || 'gpt-4o-mini'
          } : {}),
          // Gemini 配置
          ...(savedConfig.provider === 'gemini' ? {
            geminiApiKey: savedConfig.geminiApiKey || '',
            geminiBaseURL: savedConfig.geminiBaseURL || '',
            geminiModel: savedConfig.geminiModel || 'gemini-2.0-flash'
          } : {})
        };

        console.log('🔄 恢复配置:', restoredConfig);
        setConfig(restoredConfig);
        
        // 恢复本地输入状态
        setLocalInputs({
          apiKey: restoredConfig.provider === 'openai' ? restoredConfig.apiKey || '' : '',
          baseURL: restoredConfig.provider === 'openai' ? restoredConfig.baseURL || '' : '',
          geminiApiKey: restoredConfig.provider === 'gemini' ? restoredConfig.geminiApiKey || '' : '',
          geminiBaseURL: restoredConfig.provider === 'gemini' ? restoredConfig.geminiBaseURL || '' : '',
          maxTokens: restoredConfig.maxTokens || 4096,
          systemMessage: restoredConfig.systemMessage || DEFAULT_SYSTEM_MESSAGE,
        });
      } catch (error) {
        console.error('Failed to restore config:', error);
      }
    }

    // 恢复TTS设置
    setTempTTSSettings({
      provider: currentTTSSettings.provider,
      voice: currentTTSSettings.voice,
      model: currentTTSSettings.model,
      speed: currentTTSSettings.speed,
      enabled: currentTTSSettings.enabled,
      useServerSide: true,
      voiceInstructions: currentTTSSettings.voiceInstructions || DEFAULT_VOICE_INSTRUCTIONS,
    });

    onClose();
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有配置吗？此操作无法撤销。')) {
      const defaultConfig: TranslateConfig = {
        provider: 'openai',
        apiKey: '',
        baseURL: '',
        model: 'gpt-4o-mini',
        maxTokens: 4096,
        systemMessage: DEFAULT_SYSTEM_MESSAGE,
        useServerSide: true,
        streamTranslation: false
      };
      setConfig(defaultConfig);

      setTempTTSSettings({
        provider: 'openai',
        voice: 'alloy',
        model: 'tts-1',
        speed: 1.0,
        enabled: true,
        useServerSide: true,
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
      {/* AI服务提供商选择 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <i className="fas fa-robot mr-2 text-purple-500"></i>
          AI服务提供商
        </label>
        <div className="space-y-3">
          {providerOptions.map((provider) => (
            <label 
              key={provider.code}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200"
            >
              <input
                type="radio"
                name="provider"
                checked={config.provider === provider.code}
                onChange={() => handleProviderChange(provider.code as AIProvider)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="mr-2">{provider.flag}</span>
                  <div className="font-medium text-sm text-gray-800">{provider.name}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{provider.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

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
              <div className="text-xs text-gray-500">
                {config.provider === 'openai' ? '完全免费，使用内置模型，推荐' : '使用服务端配置的Gemini模型'}
              </div>
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
              <div className="text-xs text-gray-500">
                使用您自己的{config.provider === 'openai' ? 'OpenAI' : 'Gemini'} API密钥和高级模型
              </div>
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

      {/* 配置状态显示 - 调试用 */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-2">
          <i className="fas fa-info-circle mr-1"></i>
          当前配置状态
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <div>提供商: <span className="font-mono">{config.provider}</span></div>
          <div>模式: <span className="font-mono">{config.useServerSide ? '服务端' : '客户端'}</span></div>
          {config.provider === 'openai' && (
            <>
              <div>API密钥: <span className="font-mono">{config.apiKey ? config.apiKey.substring(0, 10) + '...' : '未设置'}</span></div>
              <div>模型: <span className="font-mono">{config.model}</span></div>
              <div>BaseURL: <span className="font-mono">{config.baseURL || '默认'}</span></div>
            </>
          )}
          {config.provider === 'gemini' && (
            <>
              <div>API密钥: <span className="font-mono">{config.geminiApiKey ? config.geminiApiKey.substring(0, 10) + '...' : '未设置'}</span></div>
              <div>模型: <span className="font-mono">{config.geminiModel}</span></div>
              <div>BaseURL: <span className="font-mono">{config.geminiBaseURL || '默认'}</span></div>
            </>
          )}
        </div>
      </div>

      {/* 客户端模式配置 - 仅在客户端模式显示 */}
      {!config.useServerSide && (
        <div className="animate-slideDown">
          {/* API Key */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <i className="fas fa-key mr-2 text-blue-500"></i>
              {config.provider === 'openai' ? 'OpenAI API Key' : 'Gemini API Key'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={config.provider === 'openai' ? localInputs.apiKey : localInputs.geminiApiKey}
                onChange={(e) => updateLocalInput(
                  config.provider === 'openai' ? 'apiKey' : 'geminiApiKey', 
                  e.target.value
                )}
                placeholder={config.provider === 'openai' ? 'sk-...' : 'AIzaSy...'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm bg-gray-50 hover:bg-white transition-all form-input"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <i className="fas fa-shield-alt text-gray-400"></i>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500 flex items-center">
                <i className="fas fa-lock mr-1 text-green-500"></i>
                密钥将安全存储在您的设备上
              </p>
              {config.provider === 'gemini' && localInputs.geminiApiKey && (
                <p className="text-xs text-blue-500 flex items-center">
                  <i className="fas fa-info-circle mr-1"></i>
                  已输入{localInputs.geminiApiKey.length}个字符的API密钥
                </p>
              )}
            </div>
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
                value={config.provider === 'openai' ? localInputs.baseURL : localInputs.geminiBaseURL}
                onChange={(e) => updateLocalInput(
                  config.provider === 'openai' ? 'baseURL' : 'geminiBaseURL',
                  e.target.value
                )}
                placeholder={
                  config.provider === 'openai' 
                    ? 'https://api.openai.com' 
                    : 'https://generativelanguage.googleapis.com/v1beta'
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-sm bg-gray-50 hover:bg-white transition-all form-input"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <i className="fas fa-link text-gray-400"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <i className="fas fa-info-circle mr-1 text-blue-400"></i>
              留空则使用默认{config.provider === 'openai' ? 'OpenAI' : 'Gemini'} API地址
            </p>
          </div>

          {/* AI模型 - 仅在客户端模式显示 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <i className="fas fa-robot mr-2 text-purple-500"></i>
              {config.provider === 'openai' ? 'OpenAI 模型' : 'Gemini 模型'}
            </label>
            <div className="w-full">
              <CustomSelect
                value={config.provider === 'openai' ? config.model : config.geminiModel}
                onChange={(value) => {
                  if (config.provider === 'openai') {
                    setConfig({ ...config, model: value as OpenAIModel });
                  } else {
                    setConfig({ ...config, geminiModel: value as GeminiModel });
                  }
                }}
                options={getCurrentModelOptions()}
                placeholder="选择AI模型"
              />
            </div>
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                {config.provider === 'openai' ? (
                  <>
                    <strong>推荐：</strong> GPT-4o Mini 具有优秀的性价比，适合大多数翻译任务
                  </>
                ) : (
                  <>
                    <strong>Flash:</strong> 速度快，性价比高；<strong>Pro:</strong> 质量更高，速度稍慢
                  </>
                )}
              </p>
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

          {/* 测试配置按钮 - 仅在客户端模式显示 */}
          <div className="mb-6">
            <button
              type="button"
              onClick={async () => {
                console.log('🧪 详细配置测试开始');
                
                // 1. 检查当前配置状态
                console.log('📋 当前配置状态:', {
                  provider: config.provider,
                  useServerSide: config.useServerSide,
                  hasApiKey: config.provider === 'openai' ? !!config.apiKey : !!config.geminiApiKey,
                  hasBaseURL: config.provider === 'openai' ? !!config.baseURL : !!config.geminiBaseURL,
                });
                
                // 2. 检查本地输入状态
                console.log('📝 本地输入状态:', {
                  apiKey: config.provider === 'openai' ? localInputs.apiKey?.substring(0, 10) + '...' : 'N/A',
                  geminiApiKey: config.provider === 'gemini' ? localInputs.geminiApiKey?.substring(0, 10) + '...' : 'N/A',
                  baseURL: config.provider === 'openai' ? localInputs.baseURL : 'N/A',
                  geminiBaseURL: config.provider === 'gemini' ? localInputs.geminiBaseURL : 'N/A',
                  model: config.provider === 'openai' ? config.model : config.geminiModel
                });
                
                // 3. 构建测试配置
                const testConfig: TranslateConfig = {
                  ...config,
                  ...(config.provider === 'openai' ? {
                    apiKey: localInputs.apiKey,
                    baseURL: localInputs.baseURL || '',
                  } : {
                    geminiApiKey: localInputs.geminiApiKey,
                    geminiBaseURL: localInputs.geminiBaseURL || '',
                  }),
                };
                
                console.log('🔧 构建的测试配置:', {
                  provider: testConfig.provider,
                  useServerSide: testConfig.useServerSide,
                  model: testConfig.provider === 'openai' ? testConfig.model : testConfig.geminiModel,
                  hasApiKey: testConfig.provider === 'openai' ? !!testConfig.apiKey : !!testConfig.geminiApiKey,
                  apiKeyLength: testConfig.provider === 'openai' ? 
                    (testConfig.apiKey ? testConfig.apiKey.length : 0) : 
                    (testConfig.geminiApiKey ? testConfig.geminiApiKey.length : 0),
                  baseURL: testConfig.provider === 'openai' ? testConfig.baseURL : testConfig.geminiBaseURL
                });
                
                // 4. 初始化服务并测试
                initTranslateService(testConfig);
                
                // 5. 模拟翻译请求查看参数传递
                console.log('🚀 开始模拟翻译请求...');
                
                try {
                  const service = getTranslateService();
                  if (service) {
                    // 这里会触发我们添加的详细日志
                    await service.translate({
                      text: 'Hello World',
                      targetLanguage: 'Chinese',
                      sourceLanguage: 'English'
                    });
                  }
                } catch (error) {
                  console.error('🔥 测试翻译失败:', error);
                }
                
                toast.info('配置测试完成，请查看控制台详细日志');
              }}
              className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all text-sm text-blue-700 font-medium"
            >
              <i className="fas fa-flask mr-2"></i>
              🔍 详细测试API密钥传递
            </button>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <i className="fas fa-info-circle mr-1 text-blue-400"></i>
              点击后请打开浏览器开发者工具查看详细的API密钥传递过程
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
              <div className="text-xs text-gray-500">
                {tempTTSSettings.provider === 'gemini' ? 
                  '使用 Google Gemini TTS 进行高质量语音合成' : 
                  '使用 OpenAI TTS 进行高质量语音合成'
                }
              </div>
            </div>
          </label>
        </div>

        {tempTTSSettings.enabled && (
          <div className="space-y-4 ml-4 pl-4 border-l-2 border-orange-200 animate-slideDown">
            {/* 提供商同步提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-2 mt-0.5"></i>
                <div>
                  <p className="text-xs font-medium text-blue-800">自动同步</p>
                  <p className="text-xs text-blue-700">
                    TTS设置已自动匹配基础设置中的 <span className="font-semibold">
                    {config.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}</span> 提供商
                  </p>
                </div>
              </div>
            </div>
            {/* 模型选择 - 优先级最高 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                <i className="fas fa-microchip mr-1"></i>
                TTS 模型
              </label>
              <CustomSelect
                value={tempTTSSettings.model}
                onChange={(value) => handleModelChange(value as TTSModel)}
                options={getCurrentTTSModelOptions()}
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
                options={getCurrentVoiceOptions()}
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

            {/* Gemini专用设置 */}
            {tempTTSSettings.provider === 'gemini' && (
              <>
                {/* 语言设置 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    <i className="fas fa-language mr-1"></i>
                    输出语言
                  </label>
                  <select
                    value={tempTTSSettings.language}
                    onChange={(e) => updateTempTTSSettings({ language: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="zh-CN">中文 (简体)</option>
                    <option value="zh-TW">中文 (繁体)</option>
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="ja-JP">日本語</option>
                    <option value="ko-KR">한국어</option>
                  </select>
                </div>



                {/* 风格提示 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    <i className="fas fa-paint-brush mr-1"></i>
                    语音风格 (可选)
                  </label>
                  <textarea
                    value={tempTTSSettings.stylePrompt}
                    onChange={(e) => updateTempTTSSettings({ stylePrompt: e.target.value })}
                    placeholder="例如：请用温和亲切的语调朗读，语速适中..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    可以描述期望的语音风格和情感，最多200字符
                  </p>
                </div>
              </>
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
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { TTSVoice, TTSModel, GeminiTTSVoice, GeminiTTSModel } from '@/types/tts';

// 全局存储 TTS 配置（生产环境可以使用 Redis 等）
declare global {
  var ttsConfigStore: Map<string, {
    text: string;
    voice: TTSVoice;
    model: TTSModel;
    speed: number;
    provider: 'openai' | 'gemini';
    apiKey: string;
    baseURL?: string;
    voiceInstructions?: string;
    // Gemini 专用参数
    geminiApiKey?: string;
    geminiBaseURL?: string;
    language?: string;
    format?: 'mp3' | 'wav';
    stylePrompt?: string;
    createdAt: number;
  }>;
}

// 初始化全局存储
if (!globalThis.ttsConfigStore) {
  globalThis.ttsConfigStore = new Map();
}

// 清理过期配置（5分钟过期）
const EXPIRY_TIME = 5 * 60 * 1000; // 5分钟
setInterval(() => {
  const now = Date.now();
  for (const [uuid, config] of globalThis.ttsConfigStore.entries()) {
    if (now - config.createdAt > EXPIRY_TIME) {
      globalThis.ttsConfigStore.delete(uuid);
    }
  }
}, 60 * 1000); // 每分钟清理一次

// 检测TTS提供商
function detectTTSProvider(model: TTSModel): 'openai' | 'gemini' {
  const geminiModels: GeminiTTSModel[] = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
  return geminiModels.includes(model as GeminiTTSModel) ? 'gemini' : 'openai';
}

// POST: 存储 TTS 配置，返回 UUID
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    console.log('TTS POST 请求体:', {
      ...requestBody,
      text: requestBody.text ? `${requestBody.text.substring(0, 50)}...` : 'undefined',
      userConfig: requestBody.userConfig ? {
        hasApiKey: !!requestBody.userConfig.apiKey,
        hasGeminiApiKey: !!requestBody.userConfig.geminiApiKey,
        baseURL: requestBody.userConfig.baseURL,
        geminiBaseURL: requestBody.userConfig.geminiBaseURL
      } : 'undefined'
    });

    const { 
      text, 
      voice = 'alloy', 
      model = 'tts-1', 
      speed = 1.0, 
      voiceInstructions,
      language = 'zh-CN',
      format = 'mp3',
      stylePrompt = '',
      userConfig 
    } = requestBody;

    if (!text || text.trim().length === 0) {
      console.error('文本为空');
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      console.error('文本过长:', text.length);
      return NextResponse.json(
        { error: 'Text too long. Maximum 4096 characters allowed.' },
        { status: 400 }
      );
    }

    // 检测提供商
    const provider = detectTTSProvider(model);
    console.log('🔍 检测到TTS提供商:', provider, '模型:', model);

    // 根据提供商验证配置
    if (provider === 'openai') {
      if (!userConfig || !userConfig.apiKey) {
        console.error('缺少 OpenAI API 密钥');
        return NextResponse.json(
          { 
            error: 'OpenAI API key required',
            code: 'API_KEY_REQUIRED',
            message: 'Please provide your OpenAI API key'
          },
          { status: 400 }
        );
      }

      // 验证OpenAI参数
      const basicVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      const advancedVoices = [
        'coral', 'verse', 'ballad', 'ash', 'sage', 'amuch', 'aster', 'brook',
        'clover', 'dan', 'elan', 'marilyn', 'meadow', 'jazz', 'rio',
        'megan-wetherall', 'jade-hardy', 'megan-wetherall-2025-03-07', 'jade-hardy-2025-03-07'
      ];
      const allVoices = [...basicVoices, ...advancedVoices];
      const validModels = ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts'];
      
      if (!allVoices.includes(voice)) {
        console.error('无效的OpenAI语音类型:', voice);
        return NextResponse.json(
          { error: `Invalid voice. Must be one of: ${allVoices.join(', ')}` },
          { status: 400 }
        );
      }

      if (!validModels.includes(model)) {
        console.error('无效的OpenAI模型:', model);
        return NextResponse.json(
          { error: `Invalid model. Must be one of: ${validModels.join(', ')}` },
          { status: 400 }
        );
      }

      // 验证高级声音只能用于 gpt-4o-mini-tts 模型
      if (advancedVoices.includes(voice) && model !== 'gpt-4o-mini-tts') {
        console.error('高级语音用于非高级模型:', voice, model);
        return NextResponse.json(
          { error: `Voice "${voice}" is only available with gpt-4o-mini-tts model` },
          { status: 400 }
        );
      }

    } else if (provider === 'gemini') {
      if (!userConfig || !userConfig.geminiApiKey) {
        console.error('缺少 Gemini API 密钥');
        return NextResponse.json(
          { 
            error: 'Gemini API key required',
            code: 'GEMINI_API_KEY_REQUIRED',
            message: 'Please provide your Gemini API key'
          },
          { status: 400 }
        );
      }

      // 验证Gemini参数
      const geminiVoices = [
        'Zephyr', 'Autonoe', 'Kore', 'Orus', 'Alnilam', 'Puck', 'Fenrir', 'Laomedeia', 'Sadachbia',
        'Aoede', 'Umbriel', 'Callirrhoe', 'Zubenelgenubi', 'Erinome', 'Iapetus', 'Charon', 'Rasalgethi',
        'Leda', 'Enceladus', 'Achernar', 'Vindemiatrix', 'Sulafat', 'Algieba', 'Despina', 'Algenib',
        'Gacrux', 'Schedar', 'Achird', 'Sadaltager', 'Pulcherrima'
      ];
      const geminiModels = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
      
      if (!geminiVoices.includes(voice)) {
        console.error('无效的Gemini语音类型:', voice);
        return NextResponse.json(
          { error: `Invalid Gemini voice. Must be one of: ${geminiVoices.join(', ')}` },
          { status: 400 }
        );
      }

      if (!geminiModels.includes(model)) {
        console.error('无效的Gemini模型:', model);
        return NextResponse.json(
          { error: `Invalid Gemini model. Must be one of: ${geminiModels.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (speed < 0.25 || speed > 4.0) {
      console.error('无效的语速:', speed);
      return NextResponse.json(
        { error: 'Speed must be between 0.25 and 4.0' },
        { status: 400 }
      );
    }

    // 生成 UUID 并存储配置
    const uuid = uuidv4();
    console.log('生成 UUID:', uuid);
    
    const configToStore = {
      text,
      voice: voice as TTSVoice,
      model: model as TTSModel,
      speed,
      provider,
      apiKey: userConfig.apiKey || '',
      baseURL: userConfig.baseURL,
      voiceInstructions,
      // Gemini 专用参数
      geminiApiKey: userConfig.geminiApiKey || '',
      geminiBaseURL: userConfig.geminiBaseURL,
      language,
      format: format as 'mp3' | 'wav',
      stylePrompt,
      createdAt: Date.now(),
    };

    console.log('存储配置:', {
      uuid,
      provider: configToStore.provider,
      voice: configToStore.voice,
      model: configToStore.model,
      speed: configToStore.speed,
      hasApiKey: !!configToStore.apiKey,
      hasGeminiApiKey: !!configToStore.geminiApiKey,
      baseURL: configToStore.baseURL,
      geminiBaseURL: configToStore.geminiBaseURL,
      language: configToStore.language,
      format: configToStore.format,
      hasVoiceInstructions: !!configToStore.voiceInstructions,
      hasStylePrompt: !!configToStore.stylePrompt,
      textLength: configToStore.text.length
    });

    globalThis.ttsConfigStore.set(uuid, configToStore);

    const audioUrl = `/api/tts/${uuid}`;
    console.log('返回音频URL:', audioUrl);

    return NextResponse.json({
      success: true,
      uuid,
      audioUrl,
    });

  } catch (error) {
    console.error('TTS config storage error:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 处理 OPTIONS 请求（CORS 预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 
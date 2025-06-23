import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { TTSVoice, TTSModel, GeminiTTSModel } from '@/types/tts';
import { MemoryManager } from '@/utils/memoryManager';

// TTS配置类型
interface TTSConfigData {
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
}

// 使用内存管理器代替全局变量
const ttsConfigManager = new MemoryManager<TTSConfigData>(5 * 60 * 1000); // 5分钟过期

// 检测TTS提供商
function detectTTSProvider(model: TTSModel): 'openai' | 'gemini' {
  const geminiModels: GeminiTTSModel[] = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
  return geminiModels.includes(model as GeminiTTSModel) ? 'gemini' : 'openai';
}

// POST: 存储 TTS 配置，返回 UUID
// 处理预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();


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
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 4096 characters allowed.' },
        { status: 400 }
      );
    }

    // 检测提供商
    const provider = detectTTSProvider(model);

    // 根据提供商验证配置
    if (provider === 'openai') {
      if (!userConfig || !userConfig.apiKey) {
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
        return NextResponse.json(
          { error: `Invalid voice. Must be one of: ${allVoices.join(', ')}` },
          { status: 400 }
        );
      }

      if (!validModels.includes(model)) {
        return NextResponse.json(
          { error: `Invalid model. Must be one of: ${validModels.join(', ')}` },
          { status: 400 }
        );
      }

      // 验证高级声音只能用于 gpt-4o-mini-tts 模型
      if (advancedVoices.includes(voice) && model !== 'gpt-4o-mini-tts') {
        return NextResponse.json(
          { error: `Voice "${voice}" is only available with gpt-4o-mini-tts model` },
          { status: 400 }
        );
      }

    } else if (provider === 'gemini') {
      if (!userConfig || !userConfig.geminiApiKey) {
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
        return NextResponse.json(
          { error: `Invalid Gemini voice. Must be one of: ${geminiVoices.join(', ')}` },
          { status: 400 }
        );
      }

      if (!geminiModels.includes(model)) {
        return NextResponse.json(
          { error: `Invalid Gemini model. Must be one of: ${geminiModels.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (speed < 0.25 || speed > 4.0) {
      return NextResponse.json(
        { error: 'Speed must be between 0.25 and 4.0' },
        { status: 400 }
      );
    }

    // 生成 UUID 并存储配置
    const uuid = uuidv4();
    
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



    ttsConfigManager.set(uuid, configToStore);

    const audioUrl = `/api/tts/${uuid}`;

    return NextResponse.json({
      success: true,
      uuid,
      audioUrl,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

 
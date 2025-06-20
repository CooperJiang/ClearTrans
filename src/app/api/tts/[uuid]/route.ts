import { NextRequest, NextResponse } from 'next/server';
import type { TTSVoice, TTSModel } from '@/types/tts';

// 使用全局存储的类型声明
declare global {
  var ttsConfigStore: Map<string, {
    text: string;
    voice: TTSVoice;
    model: TTSModel;
    speed: number;
    apiKey: string;
    baseURL?: string;
    voiceInstructions?: string;
    createdAt: number;
  }>;
}

// GET: 通过 UUID 流式返回音频
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // Next.js 15 要求 await params
    const { uuid } = await params;
    console.log('TTS UUID 请求:', uuid);

    // 从全局存储获取配置
    const config = globalThis.ttsConfigStore?.get(uuid);
    
    if (!config) {
      console.error('TTS 配置未找到:', uuid);
      console.log('当前存储的 UUID:', Array.from(globalThis.ttsConfigStore?.keys() || []));
      return NextResponse.json(
        { error: 'TTS configuration not found or expired' },
        { status: 404 }
      );
    }

    console.log('TTS 配置找到:', {
      voice: config.voice,
      model: config.model,
      speed: config.speed,
      hasApiKey: !!config.apiKey,
      baseURL: config.baseURL,
      hasVoiceInstructions: !!config.voiceInstructions,
      textLength: config.text.length,
      createdAt: new Date(config.createdAt).toISOString()
    });

    // 处理 baseURL
    let processedBaseURL = config.baseURL || 'https://api.openai.com/v1';
    if (!processedBaseURL.endsWith('/v1')) {
      processedBaseURL = processedBaseURL.replace(/\/$/, '') + '/v1';
    }
    
    const ttsApiUrl = `${processedBaseURL}/audio/speech`;
    console.log('TTS API URL:', ttsApiUrl);

    // 构建请求体
    const requestBody: {
      model: TTSModel;
      input: string;
      voice: TTSVoice;
      speed: number;
      response_format: string;
      voice_instructions?: string;
    } = {
      model: config.model,
      input: config.text,
      voice: config.voice,
      speed: config.speed,
      response_format: 'mp3'
    };

    // 如果是 gpt-4o-mini-tts 模型且有 voice_instructions，则添加该参数
    if (config.model === 'gpt-4o-mini-tts' && config.voiceInstructions) {
      requestBody.voice_instructions = config.voiceInstructions;
      console.log('添加语音指令:', config.voiceInstructions);
    }

    console.log('发送到 OpenAI 的请求体:', {
      ...requestBody,
      input: `${requestBody.input.substring(0, 50)}...`
    });

    // 调用 OpenAI TTS API
    const openaiResponse = await fetch(ttsApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI 响应状态:', openaiResponse.status, openaiResponse.statusText);
    console.log('OpenAI 响应头:', Object.fromEntries(openaiResponse.headers.entries()));

    if (!openaiResponse.ok) {
      console.log('OpenAI 错误响应状态文本:', openaiResponse?.statusText);
      
      // 尝试读取错误响应体
      let errorBody = '';
      try {
        errorBody = await openaiResponse.text();
        console.log('OpenAI 错误响应体:', errorBody);
      } catch (e) {
        console.log('无法读取错误响应体:', e);
      }

      let errorMessage = 'TTS generation failed';
      if (openaiResponse.status === 401) {
        errorMessage = 'Invalid API key';
      } else if (openaiResponse.status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (openaiResponse.status === 400) {
        errorMessage = 'Invalid request parameters';
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorBody || openaiResponse.statusText,
          status: openaiResponse.status
        },
        { status: openaiResponse.status }
      );
    }

    // 检查响应体
    if (!openaiResponse.body) {
      console.error('OpenAI 响应没有 body');
      throw new Error('No audio stream available from OpenAI');
    }

    console.log('OpenAI 响应成功，开始流式传输音频');

    // 直接流式传输 OpenAI 的音频响应
    return new NextResponse(openaiResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...(openaiResponse.headers.get('content-length') && {
          'Content-Length': openaiResponse.headers.get('content-length')!
        }),
      },
    });

  } catch (error) {
    console.error('TTS stream error:', error);
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
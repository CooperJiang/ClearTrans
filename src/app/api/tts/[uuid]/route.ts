import { NextRequest, NextResponse } from 'next/server';
import type { TTSVoice, TTSModel } from '@/types/tts';

// TTS配置类型定义
interface TTSConfig {
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
}

// 使用全局存储的类型声明
declare global {
  var ttsConfigStore: Map<string, TTSConfig>;
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
      provider: config.provider,
      voice: config.voice,
      model: config.model,
      speed: config.speed,
      hasApiKey: !!config.apiKey,
      hasGeminiApiKey: !!config.geminiApiKey,
      baseURL: config.baseURL,
      geminiBaseURL: config.geminiBaseURL,
      language: config.language,
      format: config.format,
      hasVoiceInstructions: !!config.voiceInstructions,
      hasStylePrompt: !!config.stylePrompt,
      textLength: config.text.length,
      createdAt: new Date(config.createdAt).toISOString()
    });

    // 根据提供商处理不同的TTS API
    if (config.provider === 'gemini') {
      return await handleGeminiTTS(config);
    } else {
      return await handleOpenAITTS(config);
    }

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

// 处理OpenAI TTS
async function handleOpenAITTS(config: TTSConfig) {
  // 处理 baseURL
  let processedBaseURL = config.baseURL || 'https://api.openai.com/v1';
  if (!processedBaseURL.endsWith('/v1')) {
    processedBaseURL = processedBaseURL.replace(/\/$/, '') + '/v1';
  }
  
  const ttsApiUrl = `${processedBaseURL}/audio/speech`;
  console.log('OpenAI TTS API URL:', ttsApiUrl);

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

  if (!openaiResponse.ok) {
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
}

// 处理Gemini TTS
async function handleGeminiTTS(config: TTSConfig) {
  // 处理 baseURL - 使用正确的Gemini API端点
  let processedBaseURL = config.geminiBaseURL || 'https://generativelanguage.googleapis.com/v1beta';
  if (!processedBaseURL.endsWith('/v1beta')) {
    processedBaseURL = processedBaseURL.replace(/\/$/, '') + '/v1beta';
  }
  
  // API URL格式 - 根据是否为官方API决定认证方式
  const isOfficialAPI = processedBaseURL.includes('generativelanguage.googleapis.com');
  let ttsApiUrl: string;
  
  if (isOfficialAPI) {
    // 官方API使用查询参数
    ttsApiUrl = `${processedBaseURL}/models/${config.model}:generateContent?key=${config.geminiApiKey}`;
  } else {
    // 代理服务器使用标准URL
    ttsApiUrl = `${processedBaseURL}/models/${config.model}:generateContent`;
  }
  
  console.log('Gemini TTS API URL:', ttsApiUrl.replace(config.geminiApiKey!, '***'));

  // 构建Gemini TTS请求体
  const requestBody = {
    contents: [{
      parts: [{
        text: config.text
      }]
    }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: config.voice
          }
        }
      }
    }
  };

  // 添加风格控制（如果有）
  if (config.stylePrompt) {
    requestBody.contents[0].parts.push({
      text: `Style instruction: ${config.stylePrompt}`
    });
  }

  console.log('发送到 Gemini 的请求体:', {
    ...requestBody,
    contents: [{
      ...requestBody.contents[0],
      parts: requestBody.contents[0].parts.map(part => ({
        ...part,
        text: part.text.substring(0, 50) + (part.text.length > 50 ? '...' : '')
      }))
    }]
  });

  // 构建请求头 - 根据API类型决定认证方式
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (!isOfficialAPI) {
    // 代理服务器使用Bearer认证
    headers['Authorization'] = `Bearer ${config.geminiApiKey}`;
  }

  // 调用 Gemini TTS API
  const geminiResponse = await fetch(ttsApiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  console.log('Gemini 响应状态:', geminiResponse.status, geminiResponse.statusText);

  if (!geminiResponse.ok) {
    let errorBody = '';
    try {
      errorBody = await geminiResponse.text();
      console.log('Gemini 错误响应体:', errorBody);
    } catch (e) {
      console.log('无法读取错误响应体:', e);
    }

    let errorMessage = 'Gemini TTS generation failed';
    if (geminiResponse.status === 401) {
      errorMessage = 'Invalid Gemini API key';
    } else if (geminiResponse.status === 429) {
      errorMessage = 'Rate limit exceeded';
    } else if (geminiResponse.status === 400) {
      errorMessage = 'Invalid request parameters';
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorBody || geminiResponse.statusText,
        status: geminiResponse.status
      },
      { status: geminiResponse.status }
    );
  }

  // 解析Gemini响应
  const responseData = await geminiResponse.json();
  console.log('Gemini 响应数据结构:', {
    hasCandidates: !!responseData.candidates,
    candidatesLength: responseData.candidates?.length || 0,
    hasContent: !!(responseData.candidates?.[0]?.content),
    hasParts: !!(responseData.candidates?.[0]?.content?.parts),
    partsLength: responseData.candidates?.[0]?.content?.parts?.length || 0
  });

  // 提取音频数据
  const audioPart = responseData.candidates?.[0]?.content?.parts?.find(
    (part: { inlineData?: { mimeType?: string; data?: string } }) => part.inlineData?.mimeType?.startsWith('audio/')
  );

  if (!audioPart || !audioPart.inlineData?.data) {
    console.error('Gemini 响应中没有音频数据');
    console.log('完整响应结构:', JSON.stringify(responseData, null, 2));
    return NextResponse.json(
      { error: 'No audio data in Gemini response' },
      { status: 500 }
    );
  }

  const audioData = audioPart.inlineData.data;
  const mimeType = audioPart.inlineData.mimeType;

  console.log('Gemini 音频信息:', {
    dataLength: audioData.length,
    mimeType: mimeType,
    isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(audioData.substring(0, 100))
  });

  // 将base64音频数据转换为Buffer
  let audioBuffer: Buffer;
  try {
    audioBuffer = Buffer.from(audioData, 'base64');
    console.log('音频Buffer大小:', audioBuffer.length, 'bytes');
  } catch (error) {
    console.error('Base64解码失败:', error);
    return NextResponse.json(
      { error: 'Failed to decode audio data' },
      { status: 500 }
    );
  }

  // 根据Gemini返回的MIME类型确定Content-Type，优先使用返回的类型
  let contentType = mimeType || 'audio/mpeg';
  
  // 如果没有返回MIME类型，根据配置推断
  if (!mimeType) {
    if (config.format === 'wav') {
      contentType = 'audio/wav';
    } else {
      contentType = 'audio/mpeg';
    }
  }

  console.log('Gemini TTS 成功，返回音频流:', {
    contentType,
    bufferSize: audioBuffer.length,
    originalMimeType: mimeType
  });

  // 返回音频数据，添加更多浏览器兼容性头部
  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Length': audioBuffer.length.toString(),
      // 添加音频相关的响应头
      'Accept-Ranges': 'bytes',
      'X-Audio-Format': mimeType || 'unknown',
      // 添加更多浏览器兼容性头部
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Expose-Headers': 'Content-Length, X-Audio-Format',
    },
  });
} 
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
    // 从全局存储获取配置
    const config = globalThis.ttsConfigStore?.get(uuid);
    
    if (!config) {
      return NextResponse.json(
        { error: 'TTS configuration not found or expired' },
        { status: 404 }
      );
    }

    // 根据提供商处理不同的TTS API
    if (config.provider === 'gemini') {
      return await handleGeminiTTS(config);
    } else {
      return await handleOpenAITTS(config);
    }

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

// 处理OpenAI TTS
async function handleOpenAITTS(config: TTSConfig) {
  // 处理 baseURL
  let processedBaseURL = config.baseURL || 'https://api.openai.com/v1';
  if (!processedBaseURL.endsWith('/v1')) {
    processedBaseURL = processedBaseURL.replace(/\/$/, '') + '/v1';
  }
  
  const ttsApiUrl = `${processedBaseURL}/audio/speech`;

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
  }

  // 调用 OpenAI TTS API
  const openaiResponse = await fetch(ttsApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!openaiResponse.ok) {
    let errorBody = '';
    try {
      errorBody = await openaiResponse.text();
    } catch {
      // Ignore error reading response body
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
    throw new Error('No audio stream available from OpenAI');
  }

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

// 处理Gemini TTS - 只使用流式模式
async function handleGeminiTTS(config: TTSConfig) {
  // 处理 baseURL - 使用正确的Gemini API端点
  let processedBaseURL = config.geminiBaseURL || 'https://generativelanguage.googleapis.com/v1beta';
  if (!processedBaseURL.endsWith('/v1beta')) {
    processedBaseURL = processedBaseURL.replace(/\/$/, '') + '/v1beta';
  }
  
  const isOfficialAPI = processedBaseURL.includes('generativelanguage.googleapis.com');
  
  // 强制使用流式TTS以获得更好的性能
  return await handleGeminiStreamTTS(config, processedBaseURL, isOfficialAPI);
}

// 流式Gemini TTS处理 - 使用官方支持的流式TTS API
async function handleGeminiStreamTTS(config: TTSConfig, processedBaseURL: string, isOfficialAPI: boolean) {

  // 使用generateContent端点，通过流式方式处理响应
  let ttsApiUrl: string;
  
  if (isOfficialAPI) {
    // 官方API使用generateContent端点
    ttsApiUrl = `${processedBaseURL}/models/${config.model}:generateContent?key=${config.geminiApiKey}`;
  } else {
    // 代理服务器使用generateContent端点  
    ttsApiUrl = `${processedBaseURL}/models/${config.model}:generateContent`;
  }

  // 构建正确的Gemini TTS请求体（按照官方文档格式）
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

  // 构建请求头
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (!isOfficialAPI) {
    headers['Authorization'] = `Bearer ${config.geminiApiKey}`;
  }

  // 调用 Gemini TTS API
  const geminiResponse = await fetch(ttsApiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!geminiResponse.ok) {
    let errorBody = '';
    try {
      errorBody = await geminiResponse.text();
    } catch {
      // Ignore error reading response body
    }

    throw new Error(`Gemini TTS failed: ${geminiResponse.status} ${geminiResponse.statusText}. Body: ${errorBody}`);
  }

  // 检查响应体
  if (!geminiResponse.body) {
    throw new Error('No audio stream available from Gemini TTS');
  }

  // 解析JSON响应并提取音频数据
  const responseData = await geminiResponse.json();

  // 提取音频数据
  const audioData = responseData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error('No audio data found in Gemini TTS response');
  }

  // 转换为Buffer
  const audioBuffer = Buffer.from(audioData, 'base64');
  
  // 转换PCM为WAV格式（如果需要）
  let finalAudioBuffer: Buffer = audioBuffer;
  try {
    finalAudioBuffer = convertPCMToWAV(audioBuffer, 24000, 1, 16);
  } catch {
    // Use original data if conversion fails
  }

  // 创建流式响应 - 使用 response.pipe() 的方式
  const readable = new ReadableStream({
    start(controller) {
      // 将音频数据分块流式传输
      const chunkSize = 8192; // 8KB chunks
      let offset = 0;
      
      const sendChunk = () => {
        if (offset >= finalAudioBuffer.length) {
          controller.close();
          return;
        }
        
        const chunk = finalAudioBuffer.slice(offset, offset + chunkSize);
        controller.enqueue(chunk);
        offset += chunkSize;
        
        // 异步发送下一块，模拟流式传输
        setTimeout(sendChunk, 10); // 10ms间隔
      };
      
      sendChunk();
    }
  });

  // 返回流式音频响应
  return new NextResponse(readable, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Accept-Ranges': 'bytes',
      'X-Audio-Format': 'audio/wav',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Expose-Headers': 'Content-Length, X-Audio-Format',
    },
  });
}

// PCM转WAV格式的辅助函数
function convertPCMToWAV(pcmBuffer: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const pcmDataLength = pcmBuffer.length;
  const wavHeaderLength = 44;
  const wavFileLength = wavHeaderLength + pcmDataLength;
  
  const wavBuffer = Buffer.alloc(wavFileLength);
  
  // WAV文件头
  let offset = 0;
  
  // RIFF header
  wavBuffer.write('RIFF', offset); offset += 4;
  wavBuffer.writeUInt32LE(wavFileLength - 8, offset); offset += 4; // File size - 8
  wavBuffer.write('WAVE', offset); offset += 4;
  
  // fmt chunk
  wavBuffer.write('fmt ', offset); offset += 4;
  wavBuffer.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size (16 for PCM)
  wavBuffer.writeUInt16LE(1, offset); offset += 2; // AudioFormat (1 for PCM)
  wavBuffer.writeUInt16LE(channels, offset); offset += 2; // NumChannels
  wavBuffer.writeUInt32LE(sampleRate, offset); offset += 4; // SampleRate
  wavBuffer.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, offset); offset += 4; // ByteRate
  wavBuffer.writeUInt16LE(channels * bitsPerSample / 8, offset); offset += 2; // BlockAlign
  wavBuffer.writeUInt16LE(bitsPerSample, offset); offset += 2; // BitsPerSample
  
  // data chunk
  wavBuffer.write('data', offset); offset += 4;
  wavBuffer.writeUInt32LE(pcmDataLength, offset); offset += 4; // Subchunk2Size
  
  // Copy PCM data
  pcmBuffer.copy(wavBuffer, offset);
  
  return wavBuffer;
} 
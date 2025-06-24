import { NextRequest, NextResponse } from 'next/server';

interface UserConfig {
  apiKey?: string;
  baseURL?: string;
  geminiApiKey?: string;
  geminiBaseURL?: string;
}

interface ImageTranslateRequest {
  image: string; // base64 encoded image
  targetLanguage: string;
  sourceLanguage?: string;
  provider?: 'openai' | 'gemini';
  model?: string;
  useServerSide?: boolean;
  userConfig?: UserConfig;
  streamTranslation?: boolean;
}

const IMAGE_TRANSLATE_PROMPT = `You are a professional image text translator. Your task is to extract text from images and translate it to {{to}} language.

## Instructions:
- Extract ALL visible text from the image including signs, labels, captions, handwritten text, etc.
- Translate the extracted text to {{to}} language accurately
- Preserve the logical reading order and formatting
- If no text is found, respond with: "图片中未发现可识别的文本"
- Output ONLY the translated text, no explanations or formatting
- Do not include the original text in your response

Example:
If image contains "Hello World\nWelcome to our store", output only:
你好世界
欢迎来到我们的商店`;

export async function POST(request: NextRequest) {
  try {
    const body: ImageTranslateRequest = await request.json();
    const { 
      image, 
      targetLanguage,
      provider = 'openai',
      model,
      useServerSide = true,
      userConfig,
      streamTranslation = false
    } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { error: 'Target language is required' },
        { status: 400 }
      );
    }

    // 验证base64图片格式
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 encoded image.' },
        { status: 400 }
      );
    }

    // 服务端模式下，如果没有提供model，使用环境变量中的默认值
    let modelToUse = model;
    if (!modelToUse && useServerSide) {
      modelToUse = provider === 'openai' 
        ? (process.env.OPENAI_MODEL || 'gpt-4o')  // 图片识别需要 vision 模型
        : (process.env.GEMINI_MODEL || 'gemini-2.0-flash');
    } else if (!modelToUse) {
      return NextResponse.json(
        { error: 'Model is required for client mode' },
        { status: 400 }
      );
    }

    // 构建配置
    const { apiKey, baseURL } = buildConfig({
      provider,
      useServerSide,
      userConfig
    });

    // 构建系统消息
    const systemMessage = IMAGE_TRANSLATE_PROMPT.replace(/\{\{to\}\}/g, getLanguageDisplayName(targetLanguage));

    // 构建用户消息（包含图片）
    const userMessage = `Please extract and translate all text from this image to ${getLanguageDisplayName(targetLanguage)}.`;

    // 调用Vision API
    if (streamTranslation) {
      // 流式返回
      if (provider === 'openai') {
        return callOpenAIVisionStream(apiKey, baseURL, modelToUse, systemMessage, userMessage, image);
      } else if (provider === 'gemini') {
        return callGeminiVisionStream(apiKey, baseURL, modelToUse, systemMessage, userMessage, image);
      } else {
        throw new Error(`Unsupported provider for image translation: ${provider}`);
      }
    } else {
      // 非流式返回
      let result;
      
      if (provider === 'openai') {
        result = await callOpenAIVision(apiKey, baseURL, modelToUse, systemMessage, userMessage, image);
      } else if (provider === 'gemini') {
        result = await callGeminiVision(apiKey, baseURL, modelToUse, systemMessage, userMessage, image);
      } else {
        throw new Error(`Unsupported provider for image translation: ${provider}`);
      }

      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Image translation error:', error);
    
    // 确保返回正确的错误格式
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        type: 'api_error',
        success: false
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * 构建配置
 */
function buildConfig(params: {
  provider: string;
  useServerSide: boolean;
  userConfig?: UserConfig;
}): { apiKey: string; baseURL: string } {
  const { provider, useServerSide, userConfig } = params;

  let apiKey: string;
  let baseURL: string;

  if (useServerSide) {
    // 使用服务端配置
    if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY || '';
      baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      if (!apiKey) {
        throw new Error('Server OpenAI configuration not available');
      }
    } else if (provider === 'gemini') {
      apiKey = process.env.GEMINI_API_KEY || '';
      baseURL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
      if (!apiKey) {
        throw new Error('Server Gemini configuration not available');
      }
    } else {
      throw new Error(`Unsupported server provider: ${provider}`);
    }
  } else {
    // 使用用户配置
    if (provider === 'openai') {
      if (!userConfig?.apiKey) {
        throw new Error('User OpenAI API key is required for client mode');
      }
      apiKey = userConfig.apiKey;
      baseURL = userConfig.baseURL || 'https://api.openai.com/v1';
    } else if (provider === 'gemini') {
      if (!userConfig?.geminiApiKey) {
        throw new Error('User Gemini API key is required for client mode');
      }
      apiKey = userConfig.geminiApiKey;
      const userBaseURL = userConfig.geminiBaseURL || 'https://generativelanguage.googleapis.com/v1beta';
      
      if (!userBaseURL.includes('/openai') && userBaseURL.includes('generativelanguage.googleapis.com')) {
        baseURL = userBaseURL.replace(/\/+$/, '') + '/openai';
      } else {
        baseURL = userBaseURL;
      }
    } else {
      throw new Error(`Unsupported user provider: ${provider}`);
    }
  }

  return { apiKey, baseURL };
}

/**
 * 获取语言显示名称
 */
function getLanguageDisplayName(languageCode: string): string {
  const languageNames: Record<string, string> = {
    'zh': 'Chinese',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'en': 'English',
    'ja': 'Japanese',
    'ko': 'Korean',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese'
  };
  
  return languageNames[languageCode] || languageCode;
}

/**
 * 调用OpenAI Vision API
 */
async function callOpenAIVision(
  apiKey: string,
  baseURL: string,
  model: string,
  systemMessage: string, 
  userMessage: string, 
  image: string
) {
  // 确保URL正确拼接
  let url;
  if (baseURL.endsWith('/v1') || baseURL.includes('/v1/')) {
    url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
  } else {
    url = `${baseURL.replace(/\/$/, '')}/v1/chat/completions`;
  }
  console.log('Final OpenAI URL after processing:', url);
  
  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage
          },
          {
            type: 'image_url',
            image_url: {
              url: image,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_tokens: 4096,
    temperature: 0.3
  };

  console.log('OpenAI API URL:', url);
  console.log('OpenAI API Key (first 10 chars):', apiKey.substring(0, 10));
  console.log('Request body model:', requestBody.model);
  console.log('Request body structure:', {
    model: requestBody.model,
    messagesLength: requestBody.messages.length,
    firstMessageRole: requestBody.messages[0]?.role,
    hasImageInSecondMessage: Array.isArray(requestBody.messages[1]?.content) 
      ? requestBody.messages[1]?.content?.some((c: { type: string }) => c.type === 'image_url')
      : false,
    imageUrlPrefix: Array.isArray(requestBody.messages[1]?.content)
      ? requestBody.messages[1]?.content?.find((c: { type: string; image_url?: { url?: string } }) => c.type === 'image_url')?.image_url?.url?.substring(0, 30)
      : undefined
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  console.log('OpenAI response status:', response.status);
  console.log('OpenAI response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.log('OpenAI error response:', errorText);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const responseText = await response.text();
  console.log('OpenAI response text (first 200 chars):', responseText.substring(0, 200));
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response as JSON:', parseError);
    console.log('Full response text:', responseText);
    throw new Error('OpenAI returned invalid JSON response');
  }
}

/**
 * 调用Gemini Vision API
 */
async function callGeminiVision(
  apiKey: string,
  baseURL: string,
  model: string,
  systemMessage: string, 
  userMessage: string, 
  image: string
) {
  // 确保URL正确拼接
  let url;
  if (baseURL.endsWith('/v1') || baseURL.includes('/v1/') || baseURL.includes('/openai')) {
    url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
  } else {
    url = `${baseURL.replace(/\/$/, '')}/v1/chat/completions`;
  }
  console.log('Final Gemini URL after processing:', url);
  
  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage
          },
          {
            type: 'image_url',
            image_url: {
              url: image
            }
          }
        ]
      }
    ],
    max_tokens: 4096,
    temperature: 0.3
  };

  console.log('Gemini API URL:', url);
  console.log('Gemini API Key (first 10 chars):', apiKey.substring(0, 10));
  console.log('Gemini Request body model:', requestBody.model);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  console.log('Gemini response status:', response.status);
  console.log('Gemini response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.log('Gemini error response:', errorText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const responseText = await response.text();
  console.log('Gemini response text (first 200 chars):', responseText.substring(0, 200));
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse Gemini response as JSON:', parseError);
    console.log('Full response text:', responseText);
    throw new Error('Gemini returned invalid JSON response');
  }
}

/**
 * 调用OpenAI Vision API - 流式
 */
async function callOpenAIVisionStream(
  apiKey: string,
  baseURL: string,
  model: string,
  systemMessage: string, 
  userMessage: string, 
  image: string
) {
  // 确保URL正确拼接
  let url;
  if (baseURL.endsWith('/v1') || baseURL.includes('/v1/')) {
    url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
  } else {
    url = `${baseURL.replace(/\/$/, '')}/v1/chat/completions`;
  }
  
  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage
          },
          {
            type: 'image_url',
            image_url: {
              url: image,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_tokens: 4096,
    temperature: 0.3,
    stream: true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // 创建流式响应
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * 调用Gemini Vision API - 流式
 */
async function callGeminiVisionStream(
  apiKey: string,
  baseURL: string,
  model: string,
  systemMessage: string, 
  userMessage: string, 
  image: string
) {
  // 确保URL正确拼接
  let url;
  if (baseURL.endsWith('/v1') || baseURL.includes('/v1/') || baseURL.includes('/openai')) {
    url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
  } else {
    url = `${baseURL.replace(/\/$/, '')}/v1/chat/completions`;
  }
  
  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage
          },
          {
            type: 'image_url',
            image_url: {
              url: image
            }
          }
        ]
      }
    ],
    max_tokens: 4096,
    temperature: 0.3,
    stream: true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // 创建流式响应
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
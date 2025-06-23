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
}

const IMAGE_TRANSLATE_PROMPT = `You are a professional image text translator. Your task is to:

1. **Extract all text** from the provided image accurately
2. **Translate the extracted text** to {{to}} language
3. **Maintain original formatting** and structure as much as possible

## Instructions:
- If the image contains no readable text, respond with: "No text found in the image"
- Extract ALL visible text including signs, labels, captions, handwritten text, etc.
- Preserve the logical reading order (top to bottom, left to right)
- Maintain line breaks and paragraph structure
- Translate names and proper nouns appropriately for the target language
- If text is unclear or partially obscured, indicate with [unclear] in the translation

## Output Format:
For text found in image, provide:

**Original Text:**
[extracted text in original language]

**Translation ({{to}}):**
[translated text]

If multiple text blocks exist, separate them clearly and number them.`;

export async function POST(request: NextRequest) {
  try {
    const body: ImageTranslateRequest = await request.json();
    const { 
      image, 
      targetLanguage,
      sourceLanguage,
      provider = 'openai',
      model,
      useServerSide = true,
      userConfig 
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
    let result;
    
    if (provider === 'openai') {
      // OpenAI Vision API调用
      result = await callOpenAIVision(apiKey, baseURL, modelToUse, systemMessage, userMessage, image);
    } else if (provider === 'gemini') {
      // Gemini Vision API调用  
      result = await callGeminiVision(apiKey, baseURL, modelToUse, systemMessage, userMessage, image);
    } else {
      throw new Error(`Unsupported provider for image translation: ${provider}`);
    }

    return NextResponse.json(result);

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
    hasImageInSecondMessage: requestBody.messages[1]?.content?.some((c: any) => c.type === 'image_url'),
    imageUrlPrefix: requestBody.messages[1]?.content?.find((c: any) => c.type === 'image_url')?.image_url?.url?.substring(0, 30)
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
  
  // 提取base64数据
  const base64Data = image.split(',')[1];
  const mimeType = image.split(';')[0].split(':')[1];
  
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
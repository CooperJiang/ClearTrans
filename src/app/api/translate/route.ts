import { NextRequest, NextResponse } from 'next/server';
import { getEnvConfig } from '@/config/env';

// 服务端配置
const SERVER_CONFIG = getEnvConfig().openai;

export async function POST(request: NextRequest) {
  try {
    const { 
      text, 
      model = SERVER_CONFIG.model, 
      maxTokens = SERVER_CONFIG.maxTokens, 
      systemMessage,
      targetLanguage,
      useServerSide = true,
      userConfig 
    } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    let apiKey: string;
    let baseURL: string;

    if (useServerSide) {
      // 使用服务端内置配置
      if (!SERVER_CONFIG.apiKey) {
        return NextResponse.json(
          { 
            error: 'Server configuration not available',
            code: 'SERVER_NOT_CONFIGURED',
            message: '服务端没有配置默认模型，当前仅支持用户配置自己的私有key进行访问'
          },
          { status: 200 } // 使用200状态码，不是500错误
        );
      }
      apiKey = SERVER_CONFIG.apiKey;
      baseURL = SERVER_CONFIG.baseURL;
    } else {
      // 使用用户提供的配置
      if (!userConfig?.apiKey) {
        return NextResponse.json(
          { error: 'User API key is required for client mode' },
          { status: 400 }
        );
      }
      apiKey = userConfig.apiKey;
      baseURL = userConfig.baseURL || 'https://api.openai.com';
    }

    const response = await fetch(`${baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemMessage || `You are a professional ${targetLanguage || 'English'} native translator who needs to fluently translate text into ${targetLanguage || 'English'}.

## Translation Rules
1. Output only the translated content, without explanations or additional content (such as "Here's the translation:" or "Translation as follows:")
2. The returned translation must maintain exactly the same number of paragraphs and format as the original text
3. If the text contains HTML tags, consider where the tags should be placed in the translation while maintaining fluency
4. For content that should not be translated (such as proper nouns, code, etc.), keep the original text.
5. If input contains %%, use %% in your output, if input has no %%, don't use %% in your 

## OUTPUT FORMAT:
- **Single paragraph input** → Output translation directly (no separators, no extra text)
- **Multi-paragraph input** → Use line break as paragraph separator between translations

## Examples
### Multi-paragraph Input:
Paragraph A

Paragraph B

Paragraph C

Paragraph D

### Multi-paragraph Output:
Translation A

Translation B

Translation C

Translation D

### Single paragraph Input:
Single paragraph content

### Single paragraph Output:
Direct translation without separators`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: SERVER_CONFIG.temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content || '';

    if (!translatedText) {
      return NextResponse.json(
        { error: 'No translation received from API' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translatedText,
      model,
      usage: data.usage,
      mode: useServerSide ? 'server' : 'client',
      success: true
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
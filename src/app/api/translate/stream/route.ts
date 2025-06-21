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
          { status: 200 }
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

    // 创建 ReadableStream 用于流式响应
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
              stream: true, // 启用流式响应
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`;
            controller.enqueue(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.enqueue(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`);
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';
          let translationContent = '';
          let isControllerClosed = false;

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // 发送完成信号
                if (!isControllerClosed) {
                  controller.enqueue(`data: ${JSON.stringify({ 
                    done: true, 
                    fullText: translationContent,
                    model,
                    mode: useServerSide ? 'server' : 'client'
                  })}\n\n`);
                }
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    
                    if (delta && !isControllerClosed) {
                      translationContent += delta;
                      // 发送增量数据
                      controller.enqueue(`data: ${JSON.stringify({ 
                        delta, 
                        content: translationContent,
                        done: false 
                      })}\n\n`);
                    }
                  } catch (parseError) {
                    console.error('Error parsing SSE data:', parseError);
                  }
                }
              }
            }
          } catch (streamError) {
            console.error('Stream processing error:', streamError);
            if (!isControllerClosed) {
              controller.enqueue(`data: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`);
            }
          } finally {
            reader.releaseLock();
            if (!isControllerClosed) {
              controller.close();
              isControllerClosed = true;
            }
          }

        } catch (error) {
          console.error('Translation stream error:', error);
          if (!isControllerClosed) {
            controller.enqueue(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
            controller.close();
            isControllerClosed = true;
          }
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Translation stream API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
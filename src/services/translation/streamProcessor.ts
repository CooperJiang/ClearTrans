import { NextResponse } from 'next/server';
import { BaseTranslationAdapter } from './adapters/baseAdapter';

export class StreamProcessor {
  /**
   * 处理流式翻译并返回NextResponse
   */
  static async processStream(
    adapter: BaseTranslationAdapter,
    request: {
      text: string;
      model: string;
      maxTokens: number;
      systemMessage?: string;
      targetLanguage?: string;
      temperature?: number;
    }
  ): Promise<NextResponse> {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 使用适配器的流式翻译
          for await (const chunk of adapter.translateStream(request)) {
            if (chunk.content) {
              // 转换为OpenAI兼容格式
              const sseData = JSON.stringify({
                choices: [{
                  delta: { content: chunk.content },
                  index: 0,
                  finish_reason: null
                }],
                model: request.model,
                object: 'chat.completion.chunk'
              });

              controller.enqueue(`data: ${sseData}\n\n`);
            }

            if (chunk.isComplete) {
              // 发送完成信号
              const finalData = JSON.stringify({
                choices: [{
                  delta: {},
                  index: 0,
                  finish_reason: 'stop'
                }],
                model: request.model,
                object: 'chat.completion.chunk',
                usage: chunk.usage
              });

              controller.enqueue(`data: ${finalData}\n\n`);
              controller.enqueue(`data: [DONE]\n\n`);
              break;
            }
          }

        } catch (error) {
          console.error('❌ 流式处理错误:', error);
          
          const errorData = JSON.stringify({
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              type: 'stream_error'
            }
          });
          
          controller.enqueue(`data: ${errorData}\n\n`);
        } finally {
          controller.close();
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
  }

  /**
   * 处理普通翻译（非流式）
   */
  static async processTranslation(
    adapter: BaseTranslationAdapter,
    request: {
      text: string;
      model: string;
      maxTokens: number;
      systemMessage?: string;
      targetLanguage?: string;
      temperature?: number;
    }
  ) {
    try {
      const result = await adapter.translate(request);
      
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: result.content
          },
          index: 0,
          finish_reason: 'stop'
        }],
        model: request.model,
        object: 'chat.completion',
        usage: result.usage
      };

    } catch (error) {
      console.error('❌ 普通翻译错误:', error);
      throw error;
    }
  }
} 
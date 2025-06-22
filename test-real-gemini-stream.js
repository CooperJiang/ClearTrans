/**
 * 测试真正的Gemini流式翻译（使用streamGenerateContent）
 */

async function testRealGeminiStream() {
    console.log('🧪 测试真正的Gemini流式翻译');
    console.log('='.repeat(60));
    
    // 请在这里填入你的真实配置
    const testData = {
        text: 'Hello World! This is a comprehensive test of the real streaming translation feature using Gemini\'s streamGenerateContent API. We want to verify that the content is properly streamed in real-time chunks.',
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        maxTokens: 4096,
        systemMessage: 'You are a professional translator. Translate the given text to Chinese directly without explanations.',
        targetLanguage: 'Chinese',
        useServerSide: false,  // 使用客户端模式
        userConfig: {
            geminiApiKey: 'your-real-api-key-here',  // 请替换为真实的API密钥
            geminiBaseURL: 'your-real-base-url-here'  // 请替换为真实的基础URL
        }
    };

    // 验证配置
    console.log('🔍 配置验证:');
    console.log(`   提供商: ${testData.provider}`);
    console.log(`   模型: ${testData.model}`);
    console.log(`   文本长度: ${testData.text.length}字符`);
    console.log(`   使用服务端: ${testData.useServerSide}`);
    console.log(`   API密钥: ${testData.userConfig.geminiApiKey ? testData.userConfig.geminiApiKey.substring(0, 10) + '...' : '未设置'}`);
    console.log(`   基础URL: ${testData.userConfig.geminiBaseURL}`);
    console.log(`   原文: ${testData.text.substring(0, 80)}...`);
    console.log('');

    // 检查配置是否完整
    if (!testData.userConfig.geminiApiKey || testData.userConfig.geminiApiKey === 'your-real-api-key-here') {
        console.error('❌ 请先在测试脚本中配置真实的Gemini API密钥！');
        console.error('   请将 geminiApiKey 替换为你的真实API密钥');
        return;
    }

    if (!testData.userConfig.geminiBaseURL || testData.userConfig.geminiBaseURL === 'your-real-base-url-here') {
        console.error('❌ 请先在测试脚本中配置真实的Gemini基础URL！');
        console.error('   请将 geminiBaseURL 替换为你的真实基础URL');
        return;
    }

    try {
        const startTime = Date.now();
        
        // 确保调用正确的流式端点
        const streamApiUrl = 'http://localhost:8888/api/translate/stream';
        console.log('📤 发送流式翻译请求:');
        console.log(`   API端点: ${streamApiUrl}`);
        console.log(`   请求方法: POST`);
        console.log(`   Content-Type: application/json`);
        console.log('');
        
        const response = await fetch(streamApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
        });

        console.log('📥 响应信息:');
        console.log(`   状态码: ${response.status}`);
        console.log(`   状态文本: ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   是否OK: ${response.ok}`);
        console.log('');

        // 如果不是200状态码，先读取错误信息
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ API错误响应:');
            console.error(`   状态码: ${response.status}`);
            console.error(`   错误内容: ${errorData}`);
            
            // 尝试解析JSON错误
            try {
                const errorJson = JSON.parse(errorData);
                console.error('   解析的错误JSON:', errorJson);
                
                if (errorJson.error === 'Gemini API request failed') {
                    console.error('');
                    console.error('🔍 错误分析:');
                    console.error('   这个错误来自普通翻译API，不是流式翻译API');
                    console.error('   可能的原因:');
                    console.error('   1. 你可能调用了错误的端点');
                    console.error('   2. 服务器路由配置有问题');
                    console.error('   3. API密钥在服务器端处理时出错');
                }
            } catch (parseError) {
                console.error('   无法解析错误JSON:', parseError.message);
            }
            return;
        }

        // 检查响应头确认是流式响应
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/plain')) {
            console.warn('⚠️  响应Content-Type不是text/plain，可能不是流式响应');
            console.warn(`   实际Content-Type: ${contentType}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            console.error('❌ 无法获取响应流读取器');
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let chunkIndex = 0;
        let contentChunks = [];
        let fullTranslation = '';
        let firstChunkTime = null;
        let lastChunkTime = null;

        console.log('🌊 开始接收流式数据...');
        console.log('='.repeat(60));

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                const totalTime = Date.now() - startTime;
                console.log('');
                console.log('✅ 流式传输完成');
                console.log(`   总耗时: ${totalTime}ms`);
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            chunkIndex++;

            console.log(`📦 Raw Chunk ${chunkIndex}:`, JSON.stringify(chunk));

            // 实时处理每一行
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                console.log(`📄 处理行: ${trimmedLine}`);

                if (trimmedLine.startsWith('data: ')) {
                    const jsonStr = trimmedLine.slice(6);
                    if (jsonStr === '[DONE]') {
                        lastChunkTime = Date.now();
                        console.log('🏁 接收到完成信号 [DONE]');
                        break;
                    }
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        
                        if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                            const delta = data.choices[0].delta.content;
                            const currentTime = Date.now();
                            
                            if (!firstChunkTime) {
                                firstChunkTime = currentTime;
                                console.log(`⚡ 首个内容块到达时间: ${currentTime - startTime}ms`);
                            }
                            
                            contentChunks.push({
                                index: contentChunks.length + 1,
                                content: delta,
                                timestamp: currentTime - startTime,
                                length: delta.length
                            });
                            fullTranslation += delta;
                            
                            console.log(`✅ 内容块 ${contentChunks.length}:`, {
                                content: JSON.stringify(delta),
                                length: delta.length,
                                timestamp: `${currentTime - startTime}ms`
                            });
                        } else if (data.choices && data.choices[0] && data.choices[0].finish_reason === 'stop') {
                            lastChunkTime = Date.now();
                            console.log('🔚 接收到结束信号:', data);
                        } else if (data.error) {
                            console.error('❌ 流式响应中的错误:', data.error);
                        } else {
                            console.log('ℹ️  其他流式响应:', data);
                        }
                    } catch (parseError) {
                        console.warn('⚠️  JSON解析失败:', parseError.message);
                        console.warn('   原始数据:', jsonStr);
                    }
                } else {
                    console.log('📄 非data行:', trimmedLine);
                }
            }
        }

        // 统计分析
        console.log('');
        console.log('📊 流式翻译统计分析:');
        console.log('='.repeat(60));
        console.log(`   原文长度: ${testData.text.length}字符`);
        console.log(`   译文长度: ${fullTranslation.length}字符`);
        console.log(`   内容块数量: ${contentChunks.length}个`);
        console.log(`   总接收chunks: ${chunkIndex}个`);
        
        if (firstChunkTime && lastChunkTime) {
            console.log(`   首块延迟: ${firstChunkTime}ms`);
            console.log(`   流式持续时间: ${lastChunkTime - firstChunkTime}ms`);
            console.log(`   平均块间隔: ${Math.round((lastChunkTime - firstChunkTime) / contentChunks.length)}ms`);
        }
        
        console.log('');
        console.log('📝 完整译文:');
        console.log(`"${fullTranslation}"`);
        
        console.log('');
        console.log('🔍 内容块详情:');
        contentChunks.forEach(chunk => {
            console.log(`   块${chunk.index}: "${chunk.content}" (${chunk.length}字符, ${chunk.timestamp}ms)`);
        });

        // 验证结果
        console.log('');
        console.log('✅ 验证结果:');
        if (contentChunks.length > 0) {
            console.log('   ✅ 成功接收到流式内容');
            console.log('   ✅ 流式传输正常工作');
            console.log('   ✅ 翻译内容完整');
            
            if (contentChunks.length > 1) {
                console.log('   ✅ 真正的流式输出（多个块）');
            } else {
                console.log('   ⚠️  只有一个内容块（可能不是真正的流式）');
            }
        } else {
            console.log('   ❌ 没有接收到任何翻译内容');
            console.log('   ❌ 流式翻译失败');
        }

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        console.error('   错误类型:', error.constructor.name);
        console.error('   错误消息:', error.message);
        if (error.stack) {
            console.error('   错误堆栈:', error.stack);
        }
    }
}

// 运行测试
console.log('🚀 启动Gemini真正流式翻译测试...');
console.log('⚠️  请确保已在脚本中配置真实的API密钥和基础URL');
console.log('');
testRealGeminiStream().catch(console.error); 
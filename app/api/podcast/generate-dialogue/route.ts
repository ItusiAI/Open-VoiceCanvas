import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

export async function POST(req: Request) {
  try {
    // 检查用户是否登录
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    if (!QWEN_API_KEY) {
      console.error('Qwen API key not configured');
      return NextResponse.json({ error: '通义千问 API 未配置' }, { status: 500 });
    }

    const { content } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '播客内容不能为空' }, { status: 400 });
    }

    if (content.length > 10000) {
      return NextResponse.json({ error: '播客内容不能超过10000字符' }, { status: 400 });
    }

    console.log('开始生成访谈对话，内容长度:', content.length);

    // 分析内容长度，动态确定对话段落数量
    const contentLength = content.length;
    let targetSegments = 8; // 默认段落数
    let segmentLength = "50-150字"; // 默认段落长度

    if (contentLength < 200) {
      targetSegments = 4;
      segmentLength = "30-60字";
    } else if (contentLength < 500) {
      targetSegments = 6;
      segmentLength = "40-80字";
    } else if (contentLength < 1000) {
      targetSegments = 10;
      segmentLength = "60-120字";
    } else if (contentLength < 2000) {
      targetSegments = 12;
      segmentLength = "80-150字";
    } else {
      targetSegments = 15;
      segmentLength = "100-200字";
    }

    console.log(`内容长度: ${contentLength}, 目标段落数: ${targetSegments}, 段落长度: ${segmentLength}`);

    // 构建访谈生成的prompt
    const prompt = `你是一位专业的播客制作人，需要将以下内容转换为生动有趣的访谈对话。

要求：
1. 创建一个主持人和一个嘉宾的对话
2. 主持人：专业、引导性强，善于提问和总结
3. 嘉宾：知识丰富、表达清晰，是内容的主要讲述者
4. 生成${targetSegments}个对话段落，每段${segmentLength}
5. 对话要自然流畅，有逻辑性和层次感
6. 主持人要适时提问、引导话题、做总结
7. 嘉宾要详细解释、举例说明、分享见解
8. 语言要口语化，适合播客收听

原始内容：
${content}

请按以下JSON格式输出，确保JSON格式正确：
{
  "segments": [
    {
      "speaker": "主持人",
      "content": "对话内容",
      "role": "host"
    },
    {
      "speaker": "嘉宾",
      "content": "对话内容",
      "role": "guest"
    }
  ]
}`;

    // 调用通义千问-Turbo-Latest API
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo-latest',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          temperature: 0.7,
          top_p: 0.8,
          max_tokens: 30000,
          result_format: 'message'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('通义千问API错误:', errorText);
      return NextResponse.json(
        { success: false, error: `访谈生成失败: ${response.status}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('通义千问API响应:', JSON.stringify(result, null, 2));

    // 检查通义千问API响应格式
    if (!result.output) {
      console.error('通义千问API响应格式错误:', result);
      return NextResponse.json(
        { success: false, error: '访谈生成失败，API响应格式错误' },
        { status: 500 }
      );
    }

    // 通义千问API的响应格式
    const generatedContent = result.output.text || result.output.choices?.[0]?.message?.content || result.output.content || '';

    if (!generatedContent) {
      console.error('通义千问API未返回内容:', result);
      return NextResponse.json(
        { success: false, error: '访谈生成失败，API未返回内容' },
        { status: 500 }
      );
    }

    // 解析JSON响应
    let parsedContent;
    try {
      // 尝试提取JSON部分
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('未找到JSON格式的响应');
      }
    } catch (parseError) {
      console.error('解析访谈内容失败:', parseError);
      console.error('原始内容:', generatedContent);

      // 如果JSON解析失败，尝试简单的文本分割
      const lines = generatedContent.split('\n').filter((line: string) => line.trim());
      const segments: any[] = [];
      let currentSpeaker = '主持人';

      for (let i = 0; i < lines.length && segments.length < targetSegments; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('{') && !line.startsWith('}')) {
          segments.push({
            speaker: currentSpeaker,
            content: line.replace(/^(主持人|嘉宾)[:：]?\s*/, ''),
            role: currentSpeaker === '主持人' ? 'host' : 'guest'
          });
          currentSpeaker = currentSpeaker === '主持人' ? '嘉宾' : '主持人';
        }
      }

      parsedContent = { segments };
    }

    if (!parsedContent.segments || !Array.isArray(parsedContent.segments)) {
      return NextResponse.json(
        { success: false, error: '访谈内容格式错误' },
        { status: 500 }
      );
    }

    // 验证和清理segments
    const validSegments = parsedContent.segments
      .filter((segment: any) => segment.content && segment.content.trim().length > 0)
      .map((segment: any) => ({
        speaker: segment.speaker || (segment.role === 'host' ? '主持人' : '嘉宾'),
        content: segment.content.trim(),
        role: segment.role || (segment.speaker === '主持人' ? 'host' : 'guest')
      }));

    if (validSegments.length === 0) {
      return NextResponse.json(
        { success: false, error: '未生成有效的访谈内容' },
        { status: 500 }
      );
    }

    console.log(`成功生成${validSegments.length}个访谈段落`);

    return NextResponse.json({
      success: true,
      data: {
        segments: validSegments,
        totalSegments: validSegments.length,
        model: 'qwen-turbo-latest'
      }
    });

  } catch (error) {
    console.error('Podcast dialogue generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '播客内容生成失败' },
      { status: 500 }
    );
  }
}

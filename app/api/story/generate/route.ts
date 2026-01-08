import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(req: Request) {
  try {
    // 检查用户是否登录
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    if (!DEEPSEEK_API_KEY) {
      console.error('DeepSeek API key not configured');
      return NextResponse.json({ error: 'DeepSeek API 未配置' }, { status: 500 });
    }

    const { requirement } = await req.json();

    if (!requirement || requirement.trim().length === 0) {
      return NextResponse.json({ error: '故事要求不能为空' }, { status: 400 });
    }

    if (requirement.length > 500) {
      return NextResponse.json({ error: '故事要求不能超过500字符' }, { status: 400 });
    }

    // 构建提示词
    const systemPrompt = `你是一个专业的故事创作者。请根据用户的要求创作一个完整的故事。

要求：
1. 故事要有完整的情节，包括开头、发展、高潮和结局
2. 故事中要包含对话和旁白
3. 对话格式：角色名："对话内容"
4. 旁白格式：旁白：描述内容
5. 故事长度适中，大约300-800字
6. 故事要生动有趣，适合配音朗读
7. 每个段落之间用空行分隔

示例格式：
旁白：在一个遥远的王国里，住着一位勇敢的年轻骑士艾伦。

艾伦："我必须找到传说中的圣剑，拯救被困的公主！"

旁白：艾伦踏上了危险的征程，穿越黑暗森林。

请严格按照这个格式创作故事。`;

    const userPrompt = `请根据以下要求创作一个故事：${requirement}`;

    // 调用 DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      return NextResponse.json(
        { error: 'DeepSeek API 调用失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      console.error('DeepSeek API returned no choices:', data);
      return NextResponse.json(
        { error: '故事生成失败，请重试' },
        { status: 500 }
      );
    }

    const story = data.choices[0].message.content;
    
    if (!story || story.trim().length === 0) {
      return NextResponse.json(
        { error: '生成的故事为空，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      story: story.trim(),
      usage: data.usage
    });

  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '故事生成失败' },
      { status: 500 }
    );
  }
} 
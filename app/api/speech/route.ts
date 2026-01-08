import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;

const BASE_CONCURRENT_LIMIT = 3;     // 基础并发数
const VIP_MULTIPLIER = 2;           // 会员倍数
const ANONYMOUS_LIMIT = 1;          // 匿名用户限制

// 创建并发限制器
const limiter = rateLimit({
  interval: 1000,
  getMaxRequests: async (userId: string) => {
    // 匿名用户只允许1个并发请求
    if (userId === 'anonymous') return ANONYMOUS_LIMIT;
    
    // 查询用户的订阅状态
    const user = await prisma.users.findFirst({
      where: { email: userId },
      include: { subscription: true }
    });

    // 如果用户有活跃的订阅，给予双倍并发限制
    const isVip = user?.subscription && 
                 new Date(user.subscription.endDate) > new Date() &&
                 user.subscription.status === 'active';

    return isVip ? BASE_CONCURRENT_LIMIT * VIP_MULTIPLIER : BASE_CONCURRENT_LIMIT;
  }
});

// 支持的情绪类型
export type EmotionType = "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.email || 'anonymous';

    // 应用基于用户的并发限制
    await limiter.acquire(userId);

    const { 
      text, 
      language, 
      voiceId, 
      speed = 1, 
      vol = 1, 
      pitch = 0,
      sampleRate = 32000, // 采样率，默认32000
      bitrate = 128000,   // 比特率，默认128000 
      channel = 1,        // 声道数，默认1(单声道)
      emotion = undefined,
      useClonedVoice = false 
    } = await req.json();
    
    // 验证必需参数
    if (!text) {
      return NextResponse.json({ error: '文本内容不能为空' }, { status: 400 });
    }

    // 检查参数有效性
    const validSampleRates = [8000, 16000, 22050, 24000, 32000, 44100];
    const validBitrates = [32000, 64000, 128000, 256000];
    
    if (sampleRate && !validSampleRates.includes(sampleRate)) {
      return NextResponse.json({ error: '无效的采样率，有效值为: 8000、16000、22050、24000、32000、44100' }, { status: 400 });
    }
    
    if (bitrate && !validBitrates.includes(bitrate)) {
      return NextResponse.json({ error: '无效的比特率，有效值为: 32000、64000、128000、256000' }, { status: 400 });
    }
    
    if (channel && ![1, 2].includes(channel)) {
      return NextResponse.json({ error: '无效的声道数，有效值为: 1(单声道)、2(双声道)' }, { status: 400 });
    }

    // 详细的请求日志
    console.log('API Request:', {
      text,
      language,
      voiceId,
      speed,
      vol,
      pitch,
      sampleRate,
      bitrate,
      channel,
      emotion,
      useClonedVoice,
      groupId: MINIMAX_GROUP_ID,
      apiKeyLength: MINIMAX_API_KEY?.length
    });

    const requestBody = {
      model: "speech-2.6-turbo",
      text,
      stream: false,
      voice_setting: {
        voice_id: voiceId || "female-qn-qingse",
        speed: speed || 1,
        vol: vol || 1,
        pitch: pitch || 0
      },
      audio_setting: {
        sample_rate: sampleRate || 32000,
        bitrate: bitrate || 128000,
        format: "mp3",
        channel: channel || 1
      }
    };

    // 添加语言增强
    if (!useClonedVoice && language) {
      Object.assign(requestBody, {
        language_boost: language
      });
    }

    // 如果指定了情绪，添加emotion字段
    if (emotion) {
      Object.assign(requestBody, {
        emotion: emotion
      });
    }

    const url = `https://api.minimax.chat/v1/t2a_v2?GroupId=${MINIMAX_GROUP_ID}`;
    console.log('Making request to:', url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // 使用 AbortController 设置超时
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15秒超时

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'MM-Api-Key': MINIMAX_API_KEY || ''
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Minimax API error:', errorText);
        throw new Error(`Minimax API error: ${response.status}`);
      }

      const jsonResponse = await response.json();
      
      if (jsonResponse.base_resp?.status_code === 0 && jsonResponse.data?.audio) {
        // 将Base64音频数据转换为Buffer
        const audioBuffer = Buffer.from(jsonResponse.data.audio, 'hex');
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mp3',
            'Content-Length': audioBuffer.length.toString(),
            'Cache-Control': 'public, max-age=86400' // 24小时缓存
          },
        });
      }
      
      throw new Error(jsonResponse.base_resp?.status_msg || '语音生成失败');

    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '语音生成失败' },
      { status: 500 }
    );
  } finally {
    const session = await getServerSession();
    const userId = session?.user?.email || 'anonymous';
    limiter.release(userId);
  }
} 
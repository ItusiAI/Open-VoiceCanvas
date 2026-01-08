import { NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import axios from 'axios';

// 错误消息常量（与声音克隆保持一致）
const ERROR_MESSAGES = {
  minimaxConfigError: 'Minimax configuration error',
  loginRequired: 'Login required',
  insufficientCloneCredits: 'Insufficient clone credits',
  invalidParameters: 'Invalid parameters',
  voiceDesignError: 'Voice design error',
  voiceDesignFailed: 'Voice design failed',
  designSuccess: 'Voice design successful',
  requestTimeout: 'Request timeout'
};

export const dynamic = 'force-dynamic';
export const maxDuration = 25; // Vercel免费版最大25秒

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;



if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
  console.error('Missing Minimax configuration');
}

// 音色设计预览
export async function POST(request: Request) {
  try {
    console.log('Starting voice design preview...');
    
    // 验证用户会话
    const { valid, error, status, user } = await validateUserSession();
    
    if (!valid || !user) {
      console.log('用户验证失败:', error);
      return NextResponse.json({ error: error || '用户验证失败' }, { status: status || 401 });
    }

    // 获取用户的克隆配额（与声音克隆使用相同的配额系统）
    const userWithClones = await prisma.users.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        remaining_clones: true,
        used_clones: true
      }
    });
    console.log('User found:', userWithClones);

    if (!userWithClones || userWithClones.remaining_clones <= 0) {
      console.log('Insufficient clone credits');
      return NextResponse.json({
        error: ERROR_MESSAGES.insufficientCloneCredits
      }, { status: 403 });
    }

    const {
      text,
      description,
      name,
      language = 'zh-CN'
    } = await request.json();

    // 验证必需参数
    if (!text || !description || !name) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: ERROR_MESSAGES.invalidParameters }, { status: 400 });
    }

    console.log('Design parameters:', {
      text,
      description,
      name,
      language
    });

    // 根据MiniMax官方文档构建Voice Design API请求
    const requestBody = {
      prompt: description,        // 音色描述
      preview_text: text         // 试听文本
    };

    console.log('Making request to MiniMax Voice Design API...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    const url = `https://api.minimaxi.com/v1/voice_design`;

    const startTime = Date.now();
    
    // 使用axios，与克隆API保持一致，无超时限制
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'MM-Api-Key': MINIMAX_API_KEY || ''
      }
    });

    const endTime = Date.now();
    console.log(`MiniMax Voice Design API response time: ${endTime - startTime}ms`);

    console.log('MiniMax API response:', response.data);

    const jsonResponse = response.data;

      if (jsonResponse.base_resp?.status_code === 0 && jsonResponse.trial_audio && jsonResponse.voice_id) {
        console.log('Voice design successful');

        // 使用MiniMax返回的voice_id
        const finalVoiceId = jsonResponse.voice_id;

        console.log('使用voice_id:', finalVoiceId);

        // 保存音色设计到数据库
        const savedDesign = await prisma.designedVoice.create({
          data: {
            id: createId(),
            userId: user.id,
            name: name,
            language: language,
            description: description,
            speed: 1.0,
            volume: 1.0,
            pitch: 0,
            voiceId: finalVoiceId
          }
        });

        // 扣除用户的克隆次数（与声音克隆使用相同的配额系统）
        console.log('Updating user clone count...');
        const updatedUser = await prisma.users.update({
          where: { id: userWithClones.id },
          data: {
            remaining_clones: {
              decrement: 1
            },
            used_clones: {
              increment: 1
            }
          },
          select: {
            remaining_clones: true,
            used_clones: true
          }
        });

        console.log('Voice design saved successfully');

        // 将hex编码音频数据转换为Buffer
        const audioBuffer = Buffer.from(jsonResponse.trial_audio, 'hex');
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mp3',
            'Content-Length': audioBuffer.length.toString(),
            'Cache-Control': 'public, max-age=86400', // 24小时缓存
            'X-Voice-Id': finalVoiceId // 在响应头中返回voice_id
          },
        });
      }
      
      throw new Error(jsonResponse.base_resp?.status_msg || '音色预览失败');

  } catch (error) {
    console.error('Voice design preview error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : ERROR_MESSAGES.voiceDesignFailed,
        details: 'Unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

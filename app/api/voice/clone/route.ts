import { NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import FormData from 'form-data';
import { createId } from '@paralleldrive/cuid2';

export const dynamic = 'force-dynamic';
export const maxDuration = 25; // Vercel免费版最大25秒

// 错误消息
const ERROR_MESSAGES = {
  minimaxConfigError: 'Minimax configuration error',
  loginRequired: 'Login required',
  insufficientCloneCredits: 'Insufficient clone credits',
  uploadAudioFirst: 'Please upload an audio file first',
  audioUploadRequirements: 'Invalid audio format',
  voiceCloneError: 'Voice clone error',
  voiceCloneFailed: 'Voice clone failed',
  cloneSuccess: 'Clone successful',
  defaultClonedVoiceName: (date: string) => `Cloned Voice (${date})`
};

// 允许的文件格式
const ALLOWED_FORMATS = [
  'audio/mpeg', 'audio/mp4', 'audio/wav',
  'audio/mp3', 'audio/x-wav', 'audio/wave',
  'audio/x-m4a', 'audio/aac', 'audio/x-aac'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;

if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
  throw new Error(ERROR_MESSAGES.minimaxConfigError);
}

interface MinimaxResponse {
  file: {
    file_id: string;
  };
}

// 上传文件获取 file_id
async function uploadFile(file: Buffer, fileName: string, purpose: 'voice_clone' | 'prompt_audio'): Promise<string> {
  try {
    console.log('Creating form data...');
    const form = new FormData();
    form.append('file', file, {
      filename: fileName,
      contentType: 'audio/mpeg'
    });
    form.append('purpose', purpose);

    console.log('Sending request to Minimax...');
    const response = await axios.post(
      `https://api.minimax.chat/v1/files/upload?GroupId=${MINIMAX_GROUP_ID}`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          ...form.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    console.log('Response received:', response.data);
    if (!response.data?.file?.file_id) {
      console.error('Invalid response:', response.data);
      throw new Error('Invalid response from server');
    }

    return response.data.file.file_id;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Upload error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        error: error.message
      });
      throw new Error(`Upload failed: ${error.message}`);
    }
    console.error('Unexpected error:', error);
    throw new Error('File upload failed');
  }
}

export async function POST(request: Request) {
  try {
    console.log('Starting voice clone process...');
    
    // 使用新的验证函数验证用户会话
    const { valid, error, status, user } = await validateUserSession();
    
    if (!valid || !user) {
      console.log('用户验证失败:', error);
      return NextResponse.json({ error: error || '用户验证失败' }, { status: status || 401 });
    }

    // 获取用户的克隆配额
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
      return NextResponse.json({ error: ERROR_MESSAGES.insufficientCloneCredits }, { status: 403 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.log('No audio file found');
      return NextResponse.json({ error: ERROR_MESSAGES.uploadAudioFirst }, { status: 400 });
    }

    console.log('Audio file received:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    const isAllowedFormat = ALLOWED_FORMATS.some(format => 
      audioFile.type.startsWith(format) || 
      audioFile.name.toLowerCase().endsWith(format.split('/')[1])
    );

    if (!isAllowedFormat) {
      console.log('Invalid file format');
      return NextResponse.json(
        { error: ERROR_MESSAGES.audioUploadRequirements },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      console.log('File too large');
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    console.log('File converted to buffer, size:', buffer.length);

    const fileId = await uploadFile(buffer, audioFile.name, 'voice_clone');
    console.log('File uploaded successfully, ID:', fileId);

    // 生成唯一的voice_id
    const voiceId = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const payload = {
      file_id: fileId,
      voice_id: voiceId,
      accuracy: 0.8
    };
    console.log('Starting voice clone with payload:', payload);

    const cloneResponse = await axios.post(
      `https://api.minimax.chat/v1/voice_clone?GroupId=${MINIMAX_GROUP_ID}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Clone response:', cloneResponse.data);
    
    // 检查响应状态
    if (cloneResponse.data?.base_resp?.status_code !== 0) {
      console.error('API返回错误状态:', cloneResponse.data?.base_resp);
      throw new Error(cloneResponse.data?.base_resp?.status_msg || ERROR_MESSAGES.voiceCloneError);
    }
    
    // 使用请求中的voice_id，因为API响应中可能不直接返回
    const finalVoiceId = payload.voice_id;
    
    console.log('使用voice_id:', finalVoiceId);

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

    console.log('Saving cloned voice to database...');
    const savedVoice = await prisma.clonedVoice.create({
      data: {
        id: createId(),
        userId: userWithClones.id,
        voiceId: finalVoiceId,
        name: ERROR_MESSAGES.defaultClonedVoiceName(new Date().toLocaleString())
      }
    });

    console.log('Process completed successfully');
    return NextResponse.json({
      voiceId: finalVoiceId,
      message: ERROR_MESSAGES.cloneSuccess,
      remaining_clones: updatedUser.remaining_clones,
      used_clones: updatedUser.used_clones,
      savedVoice: savedVoice
    });

  } catch (error) {
    console.error('Clone process error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message
      });
      return NextResponse.json(
        { 
          error: error.response?.data?.error || ERROR_MESSAGES.voiceCloneFailed,
          details: error.message,
          responseData: error.response?.data // 添加完整的响应数据以便调试
        },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : ERROR_MESSAGES.voiceCloneFailed,
        details: 'Unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined // 添加堆栈跟踪以便调试
      },
      { status: 500 }
    );
  }
} 
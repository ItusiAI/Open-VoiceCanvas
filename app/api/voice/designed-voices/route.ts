import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 获取用户的所有设计音色
export async function GET() {
  try {
    console.log('开始获取设计音色列表...');
    
    const session = await getServerSession(authOptions);
    console.log('会话信息:', session?.user ? { 
      id: session.user.id, 
      email: session.user.email 
    } : 'No session');

    if (!session?.user) {
      console.log('未授权访问: 用户未登录');
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    if (!session?.user?.email) {
      console.log('无效的用户邮箱');
      return NextResponse.json({ error: '无效的用户邮箱' }, { status: 400 });
    }

    // 先查询用户
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      console.log('未找到用户');
      return NextResponse.json({ error: '未找到用户' }, { status: 404 });
    }

    console.log('查询用户设计音色, 用户ID:', user.id);
    
    try {
      const designedVoices = await prisma.designedVoice.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('查询结果:', designedVoices ? `找到 ${designedVoices.length} 个设计音色` : '未找到设计音色');
      return NextResponse.json(designedVoices || []);
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      return NextResponse.json(
        { error: '数据库查询失败，请稍后重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取设计音色列表错误:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return NextResponse.json(
      { error: '获取设计音色列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 添加新的设计音色
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    if (!session?.user?.email) {
      return NextResponse.json({ error: '无效的用户邮箱' }, { status: 400 });
    }

    // 先查询用户
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: '未找到用户' }, { status: 404 });
    }

    const { voiceId, name, language, description } = await request.json();

    if (!voiceId) {
      return NextResponse.json({ error: '无效的音色ID' }, { status: 400 });
    }

    const designedVoice = await prisma.designedVoice.create({
      data: {
        userId: user.id,
        voiceId: voiceId,
        name: name || `设计音色 (${new Date().toLocaleString()})`,
        language: language || 'zh-CN',
        description: description || '自定义音色设计'
      }
    });

    return NextResponse.json(designedVoice);
  } catch (error) {
    console.error('添加设计音色错误:', error);
    return NextResponse.json({ error: '添加设计音色失败' }, { status: 500 });
  }
}

// 删除设计音色
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    if (!session?.user?.email) {
      return NextResponse.json({ error: '无效的用户邮箱' }, { status: 400 });
    }

    // 先查询用户
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: '未找到用户' }, { status: 404 });
    }

    const { voiceId } = await request.json();

    if (!voiceId) {
      return NextResponse.json({ error: '无效的音色ID' }, { status: 400 });
    }

    // 删除设计音色
    await prisma.designedVoice.deleteMany({
      where: {
        userId: user.id,
        voiceId: voiceId
      }
    });

    return NextResponse.json({ message: '设计音色已删除' });

  } catch (error) {
    console.error('删除设计音色错误:', error);
    return NextResponse.json({ error: '删除设计音色失败' }, { status: 500 });
  }
}

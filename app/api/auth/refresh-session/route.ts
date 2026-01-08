import { NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 用于修复和刷新用户会话数据
export async function GET() {
  try {
    console.log('开始刷新用户会话...');
    
    // 获取当前会话
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('无法刷新：未找到用户会话');
      return NextResponse.json({ 
        success: false, 
        message: '未找到用户会话',
        loggedIn: false
      }, { status: 401 });
    }
    
    // 记录初始会话状态
    const initialState = {
      id: session.user.id,
      email: session.user.email
    };
    
    console.log('当前会话状态:', initialState);
    
    // 使用validateUserSession进行验证并获取正确的用户数据
    const { valid, user, error } = await validateUserSession();
    
    if (!valid || !user) {
      console.log('会话验证失败:', error);
      return NextResponse.json({ 
        success: false, 
        message: error || '会话验证失败',
        loggedIn: true,
        initialState
      }, { status: 400 });
    }
    
    // 在需要时检查并修复session <-> user关联
    if (session.user.id !== user.id) {
      console.log(`检测到会话ID(${session.user.id})与用户ID(${user.id})不匹配`);
      
      // 尝试查找并修复现有会话
      try {
        const sessions = await prisma.session.findMany({
          where: {
            OR: [
              { userId: session.user.id },
              { userId: user.id }
            ]
          }
        });
        
        console.log(`找到${sessions.length}个相关会话记录`);
        
        // 更新所有相关会话
        if (sessions.length > 0) {
          for (const sess of sessions) {
            await prisma.session.update({
              where: { id: sess.id },
              data: { userId: user.id }
            });
          }
          console.log('会话记录已更新');
        }
      } catch (e) {
        console.error('修复会话记录失败:', e);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '会话刷新成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      },
      fixed: session.user.id !== user.id,
      initialState
    });
  } catch (error) {
    console.error('会话刷新错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '会话刷新失败',
        error: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
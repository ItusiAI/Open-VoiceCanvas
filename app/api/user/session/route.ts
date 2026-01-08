import { NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { valid, error, status, user } = await validateUserSession();
    
    if (!valid || !user) {
      return NextResponse.json({ error: error || '用户验证失败' }, { status: status || 400 });
    }
    
    // 返回有效用户数据但不包含敏感信息
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      status: user.status,
      valid: true
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '会话检查失败' },
      { status: 500 }
    );
  }
} 
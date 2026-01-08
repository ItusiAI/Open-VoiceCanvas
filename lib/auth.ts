import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('登录回调：', { userId: user.id, provider: account?.provider });
      
      // 如果是OAuth登录，确保用户状态为active
      if (account && account.provider && ['github', 'google'].includes(account.provider)) {
        try {
          console.log(`检测到${account.provider}登录，自动验证邮箱和激活账户`);
          
          // 更新用户状态为active并设置邮箱验证时间
          await prisma.users.update({
            where: { id: user.id },
            data: {
              emailVerified: new Date(),
              status: 'active'
            }
          });
          
          console.log(`用户${user.id}状态已更新为active`);
        } catch (error) {
          console.error('更新用户状态失败:', error);
          // 不阻止登录继续
        }
      }
      
      return true;
    },
    async session({ session, token }) {
      console.log('Session回调:', { 
        tokenSub: token.sub,
        tokenId: token.id,
        sessionBefore: JSON.stringify(session)
      });
      
      // 确保会话中包含用户ID
      if (session.user) {
        session.user.id = token.sub as string;
      }
      
      console.log('Session处理后:', {
        sessionAfter: JSON.stringify(session)
      });
      
      return session;
    },
    async jwt({ token, user }) {
      console.log('JWT回调:', {
        tokenBefore: JSON.stringify(token),
        userId: user?.id
      });
      
      // 如果有用户数据，确保将用户ID保存到令牌中
      if (user) {
        token.id = user.id;
      }
      
      console.log('JWT处理后:', {
        tokenAfter: JSON.stringify(token)
      });
      
      return token;
    }
  },
};

// 用于API路由的用户会话验证函数
export async function validateUserSession() {
  const session = await getServerSession(authOptions);
  console.log('验证用户会话:', JSON.stringify(session, null, 2));
  
  if (!session?.user) {
    console.log('会话中没有用户信息');
    return { 
      valid: false, 
      error: '请先登录', 
      status: 401,
      session: null,
      user: null
    };
  }
  
  const userId = session.user.id;
  const userEmail = session.user.email;
  
  console.log('会话中的用户数据:', { userId, userEmail });
  
  if (!userId && !userEmail) {
    console.error('从会话中未能获取任何用户标识信息');
    return { 
      valid: false, 
      error: '用户身份验证失败，请重新登录', 
      status: 400,
      session,
      user: null
    };
  }
  
  // 尝试通过ID查找用户
  let user = null;
  if (userId) {
    console.log(`尝试通过ID查找用户: ${userId}`);
    user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        image: true,
        status: true
      }
    });
  }
  
  // 如果通过ID无法找到，尝试通过邮箱查找
  if (!user && userEmail) {
    console.log(`通过ID未找到用户，尝试通过邮箱查找: ${userEmail}`);
    user = await prisma.users.findUnique({
      where: { email: userEmail },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        image: true,
        status: true
      }
    });
    
    // 如果通过邮箱找到了用户，更新会话中的用户ID
    if (user) {
      console.log(`通过邮箱找到用户: ${user.id}`);
      
      // 更新内存中的会话数据
      session.user.id = user.id;
      
      try {
        // 通过更新数据库中的会话信息来持久化更改
        console.log(`尝试更新会话token以持久化用户ID更改...`);
        
        // 检查是否有会话token可以查找
        const sessionToken = 
          (session as any).sessionToken || 
          (session as any)?.user?.sessionToken;
        
        if (sessionToken) {
          // 更新会话记录
          await prisma.session.update({
            where: { sessionToken },
            data: { userId: user.id }
          });
          console.log(`会话token ${sessionToken} 已更新`);
        } else {
          // 如果没有会话token，则创建用户账户关联
          // 查看是否已有关联
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: user.id,
              OR: [
                { provider: 'github' },
                { provider: 'google' }
              ]
            }
          });
          
          if (!existingAccount) {
            console.log(`为用户 ${user.id} 创建账户记录以确保会话关联...`);
            // 记录ID不匹配问题，便于之后修复
            await prisma.users.update({
              where: { id: user.id },
              data: {
                provider: 'mismatched_id',
                provider_id: userId || 'unknown'
              }
            });
          }
        }
      } catch (e) {
        console.error('持久化会话更改失败:', e);
        // 继续处理，不中断流程
      }
    }
  }
  
  if (!user) {
    console.error(`未找到用户(ID: ${userId}, Email: ${userEmail})`);
    return { 
      valid: false, 
      error: '未找到用户信息，请重新登录', 
      status: 400,
      session,
      user: null
    };
  }
  
  console.log('找到用户:', { id: user.id, email: user.email, status: user.status });
  
  if (!user.email) {
    console.error(`用户ID ${user.id} 缺少邮箱信息`);
    return { 
      valid: false, 
      error: '用户数据不完整，请在个人资料中设置邮箱', 
      status: 400,
      session,
      user
    };
  }
  
  // 检查用户状态
  if (user.status !== 'active') {
    console.log(`用户状态不是active: ${user.status}`);
    return {
      valid: false,
      error: '您的账户未激活，请先验证邮箱',
      status: 403,
      session,
      user
    };
  }
  
  console.log('用户验证成功');
  return { 
    valid: true, 
    error: null, 
    status: 200,
    session,
    user
  };
}; 
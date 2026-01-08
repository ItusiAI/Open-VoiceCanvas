/**
 * 修复第三方登录用户数据完整性
 * 为所有通过GitHub和Google登录且状态不是active的用户自动验证邮箱并激活账户
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function fixOAuthUsers() {
  console.log('开始修复第三方登录用户数据...');
  
  try {
    // 查找所有通过第三方登录但状态不是active的用户
    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { provider: 'github' },
          { provider: 'google' }
        ]
      },
      select: {
        id: true,
        userId: true,
        provider: true,
        providerAccountId: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            emailVerified: true,
            provider: true, 
            provider_id: true
          }
        }
      }
    });
    
    console.log(`找到${accounts.length}个第三方登录用户`);
    
    // 筛选出需要修复Email验证的用户
    const usersToFixVerification = accounts.filter(account => 
      account.user && (account.user.status !== 'active' || !account.user.emailVerified)
    );
    
    console.log(`其中${usersToFixVerification.length}个用户需要修复Email验证`);
    
    // 筛选出需要修复provider_id的用户
    const usersToFixProviderId = accounts.filter(account => 
      account.user && 
      (account.user.provider !== account.provider || 
       account.user.provider_id !== account.providerAccountId)
    );
    
    console.log(`其中${usersToFixProviderId.length}个用户需要修复提供商ID`);
    
    // 修复Email验证问题
    if (usersToFixVerification.length > 0) {
      console.log('开始修复Email验证问题...');
      
      for (const account of usersToFixVerification) {
        if (!account.user) continue;
        
        console.log(`修复用户 ${account.user.email} (${account.user.id}) - 登录方式: ${account.provider}`);
        
        await prisma.users.update({
          where: { id: account.user.id },
          data: {
            emailVerified: new Date(),
            status: 'active'
          }
        });
        
        console.log(`用户 ${account.user.email} Email验证已修复`);
      }
      
      console.log(`成功修复了 ${usersToFixVerification.length} 个用户的Email验证`);
    }
    
    // 修复提供商ID问题
    if (usersToFixProviderId.length > 0) {
      console.log('开始修复提供商ID问题...');
      
      for (const account of usersToFixProviderId) {
        if (!account.user) continue;
        
        console.log(`修复用户 ${account.user.email} (${account.user.id}) 的提供商信息`);
        console.log(`  当前值: 提供商=${account.user.provider}, 提供商ID=${account.user.provider_id}`);
        console.log(`  修正为: 提供商=${account.provider}, 提供商ID=${account.providerAccountId}`);
        
        await prisma.users.update({
          where: { id: account.user.id },
          data: {
            provider: account.provider,
            provider_id: account.providerAccountId
          }
        });
        
        console.log(`用户 ${account.user.email} 提供商信息已修复`);
      }
      
      console.log(`成功修复了 ${usersToFixProviderId.length} 个用户的提供商信息`);
    }
    
    // 如果没有需要修复的用户
    if (usersToFixVerification.length === 0 && usersToFixProviderId.length === 0) {
      console.log('没有需要修复的用户，脚本执行完毕');
    }
    
  } catch (error) {
    console.error('修复过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行修复
fixOAuthUsers()
  .then(() => {
    console.log('脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }); 
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function updateTables() {
  try {
    console.log('开始更新表结构...');

    // 删除外键约束
    console.log('删除外键约束...');
    await prisma.$executeRaw`ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey"`;
    await prisma.$executeRaw`ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey"`;
    await prisma.$executeRaw`ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey"`;
    await prisma.$executeRaw`ALTER TABLE "CharacterQuota" DROP CONSTRAINT IF EXISTS "CharacterQuota_userId_fkey"`;
    await prisma.$executeRaw`ALTER TABLE "ClonedVoice" DROP CONSTRAINT IF EXISTS "ClonedVoice_userId_fkey"`;
    await prisma.$executeRaw`ALTER TABLE "payment" DROP CONSTRAINT IF EXISTS "payment_userId_fkey"`;
    console.log('已删除外键约束');

    // 修改字段类型
    console.log('修改字段类型...');
    await prisma.$executeRaw`ALTER TABLE users ALTER COLUMN id TYPE text USING id::text`;
    await prisma.$executeRaw`ALTER TABLE "Account" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
    await prisma.$executeRaw`ALTER TABLE "Session" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
    await prisma.$executeRaw`ALTER TABLE "Subscription" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
    await prisma.$executeRaw`ALTER TABLE "CharacterQuota" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
    await prisma.$executeRaw`ALTER TABLE "ClonedVoice" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
    await prisma.$executeRaw`ALTER TABLE "payment" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
    console.log('已修改字段类型');

    // 重新添加外键约束
    console.log('重新添加外键约束...');
    await prisma.$executeRaw`ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id)`;
    await prisma.$executeRaw`ALTER TABLE "CharacterQuota" ADD CONSTRAINT "CharacterQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id)`;
    await prisma.$executeRaw`ALTER TABLE "ClonedVoice" ADD CONSTRAINT "ClonedVoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id)`;
    console.log('已重新添加外键约束');

    console.log('表结构更新完成！');
  } catch (error) {
    console.error('更新表结构时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTables().catch(console.error); 
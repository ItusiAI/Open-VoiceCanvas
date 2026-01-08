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

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  console.log('创建数据备份...');
  
  try {
    // 备份 users 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS users_backup_${timestamp} AS 
      SELECT * FROM users;
    `;
    
    console.log('备份完成');
    return timestamp;
  } catch (error) {
    console.error('备份失败:', error);
    throw error;
  }
}

async function validateBackup(timestamp: string) {
  console.log('验证备份...');
  
  try {
    const [originalResult, backupResult] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM users`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM users_backup_${timestamp}`
    ]);
    
    const originalCount = Number((originalResult as any[])[0].count);
    const backupCount = Number((backupResult as any[])[0].count);
    
    console.log('原表记录数:', originalCount);
    console.log('备份表记录数:', backupCount);
    
    if (originalCount !== backupCount) {
      throw new Error(`备份验证失败：原表记录数 ${originalCount}, 备份表记录数 ${backupCount}`);
    }
    
    console.log('备份验证成功');
  } catch (error) {
    console.error('备份验证失败:', error);
    throw error;
  }
}

async function performMigration() {
  console.log('开始迁移...');
  
  try {
    // 1. 添加克隆相关字段到 users 表
    console.log('添加克隆相关字段到 users 表...');
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS remaining_clones INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_clones INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS used_clones INTEGER DEFAULT 0;
    `;

    // 2. 创建 ClonedVoice 表
    console.log('创建 ClonedVoice 表...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ClonedVoice" (
        id TEXT PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "voiceId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // 3. 创建 payment 表
    console.log('创建 payment 表...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS payment (
        id TEXT PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        "packageId" TEXT NOT NULL,
        clone_count INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id)
      );
    `;

    // 4. 创建索引
    console.log('创建索引...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ClonedVoice_userId_idx" ON "ClonedVoice"("userId");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "payment_userId_idx" ON payment("userId");
    `;

    console.log('迁移完成');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('开始安全迁移流程...');
    
    // 1. 创建备份
    const timestamp = await createBackup();
    
    // 2. 验证备份
    await validateBackup(timestamp);
    
    // 3. 执行迁移
    await performMigration();
    
    console.log('迁移流程完成');
  } catch (error) {
    console.error('迁移流程失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
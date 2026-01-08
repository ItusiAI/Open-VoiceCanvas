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

async function analyzeDatabase() {
  try {
    console.log('开始分析数据库结构...\n');

    // 获取所有表的信息
    const tables = await prisma.$queryRaw`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('发现的表:', tables);
    console.log('\n-------------------\n');

    // 对每个表分析其列信息
    for (const table of tables as any[]) {
      const tableName = table.table_name;
      console.log(`分析表 "${tableName}" 的结构:`);
      
      const columns = await prisma.$queryRaw`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `;
      
      console.log('列信息:', columns);
      
      // 获取表的行数
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "${tableName}";
      `;
      
      console.log(`表 "${tableName}" 中的记录数:`, (countResult as any[])[0].count);
      console.log('\n-------------------\n');
    }

    // 获取所有外键约束
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    `;
    
    console.log('外键关系:', foreignKeys);

  } catch (error) {
    console.error('分析数据库时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabase(); 
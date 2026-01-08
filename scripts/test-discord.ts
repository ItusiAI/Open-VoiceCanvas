import { sendUserRegistrationNotification, sendSubscriptionNotification } from '../lib/discord-service';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function testDiscordNotifications() {
  console.log('开始测试Discord通知功能...');
  
  try {
    // 测试用户注册通知
    console.log('测试用户注册通知...');
    await sendUserRegistrationNotification({
      id: 'test-user-id-123',
      name: '测试用户',
      email: 'test@example.com',
      image: null
    });
    console.log('用户注册通知发送成功！');
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试订阅通知
    console.log('测试订阅通知...');
    await sendSubscriptionNotification({
      userId: 'test-user-id-123',
      userName: '测试用户',
      planName: '年度高级会员',
      price: 199,
      currency: 'CNY',
      interval: '年',
      status: 'active'
    });
    console.log('订阅通知发送成功！');
    
    console.log('所有通知测试完成！');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
testDiscordNotifications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  }); 
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { sendSubscriptionNotification } from '@/lib/discord-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    console.log('接收到 Stripe webhook 请求');
    const body = await req.text();
    const sig = headers().get('stripe-signature');

    let event: Stripe.Event;

    if (process.env.NODE_ENV === 'production') {
      // 生产环境进行签名验证
      if (!sig || !endpointSecret) {
        console.log('缺少签名或端点密钥');
        return NextResponse.json(
          { error: 'Missing signature or endpoint secret' },
          { status: 400 }
        );
      }

      try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook 签名验证失败:', err);
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
    } else {
      // 开发环境直接解析 JSON
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log('Webhook 事件类型:', event.type);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          console.log('处理 checkout.session.completed 事件');
          const session = event.data.object as Stripe.Checkout.Session;
          console.log('会话信息:', JSON.stringify(session, null, 2));
          
          // 优先从元数据获取用户ID和邮箱
          const userId = session.metadata?.userId;
          const userEmail = session.metadata?.userEmail;
          
          let user;
          
          if (userId) {
            // 如果有用户ID，优先使用ID查找
            console.log('使用用户ID查找用户:', userId);
            user = await prisma.users.findUnique({
              where: { id: userId },
              include: {
                subscription: true,
                characterQuota: true,
              },
            });
          }
          
          if (!user && userEmail) {
            // 如果通过ID没找到但有邮箱，使用邮箱查找
            console.log('使用注册邮箱查找用户:', userEmail);
            user = await prisma.users.findUnique({
              where: { email: userEmail },
              include: {
                subscription: true,
                characterQuota: true,
              },
            });
          }
          
          // 如果通过元数据没找到用户，再尝试使用客户邮箱
          if (!user) {
            // 从会话中获取客户邮箱作为备选方案
            const email = session.customer_details?.email;
            if (email) {
              console.log('尝试使用客户提供的邮箱查找用户:', email);
              user = await prisma.users.findUnique({
                where: { email },
                include: {
                  subscription: true,
                  characterQuota: true,
                },
              });
            }
          }

          if (!user) {
            console.error('未找到用户。用户ID:', userId, '注册邮箱:', userEmail, '客户邮箱:', session.customer_details?.email);
            throw new Error('未找到用户，无法处理订阅');
          }
          console.log('找到用户:', user.id, '邮箱:', user.email, '当前订阅状态:', user.subscription);

          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          console.log('订单项目:', JSON.stringify(lineItems, null, 2));
          
          const priceId = lineItems.data[0]?.price?.id;
          if (!priceId) {
            console.error('未找到价格 ID');
            throw new Error('未找到价格 ID');
          }
          console.log('价格 ID:', priceId);

          // 根据价格 ID 确定计划类型和字符额度
          const planDetails = getPlanDetailsFromPriceId(priceId);
          console.log('计划详情:', planDetails);
          console.log('环境变量价格 ID:', {
            STRIPE_CLONE_1_PRICE_ID: process.env.STRIPE_CLONE_1_PRICE_ID,
            STRIPE_CLONE_10_PRICE_ID: process.env.STRIPE_CLONE_10_PRICE_ID,
            STRIPE_CLONE_50_PRICE_ID: process.env.STRIPE_CLONE_50_PRICE_ID
          });

          if (planDetails.type === 'clone' && planDetails.clone_count) {
            console.log('处理克隆包购买, 数量:', planDetails.clone_count);
            console.log('价格 ID:', priceId);
            console.log('用户 ID:', user.id);
            
            try {
              // 更新用户的克隆次数
              console.log('更新前的用户克隆次数:', {
                id: user.id,
                remaining_clones: user.remaining_clones,
                total_clones: user.total_clones,
                used_clones: user.used_clones
              });
              
              const updatedUser = await prisma.users.update({
                where: { id: user.id },
                data: {
                  remaining_clones: {
                    increment: planDetails.clone_count
                  },
                  total_clones: {
                    increment: planDetails.clone_count
                  }
                },
                select: {
                  id: true,
                  remaining_clones: true,
                  total_clones: true,
                  used_clones: true
                }
              });
              
              console.log('更新后的用户克隆次数:', {
                id: updatedUser.id,
                remaining_clones: updatedUser.remaining_clones,
                total_clones: updatedUser.total_clones,
                used_clones: updatedUser.used_clones
              });

              // 创建支付记录
              console.log('创建支付记录, 参数:', {
                userId: user.id,
                type: 'clone',
                amount: session.amount_total,
                packageId: priceId,
                clone_count: planDetails.clone_count
              });

              const payment = await prisma.payment.create({
                data: {
                  id: session.id, // 使用 session.id 作为支付记录的唯一标识
                  userId: user.id,
                  type: 'clone',
                  amount: session.amount_total || 0,
                  status: 'completed',
                  packageId: priceId,
                  clone_count: planDetails.clone_count
                }
              });
              console.log('创建的支付记录:', payment);

              console.log('克隆包购买处理完成');
              
              // 发送Discord通知
              try {
                console.log('发送Discord订阅通知...用户数据:', {
                  id: user.id,
                  name: user.name,
                  email: user.email
                });
                
                await sendSubscriptionNotification({
                  userId: user.id,
                  userName: user.name || undefined,
                  planName: `克隆包 (${planDetails.clone_count}次)`,
                  price: session.amount_total ? session.amount_total / 100 : undefined,
                  currency: session.currency?.toUpperCase(),
                  status: 'completed'
                });
                console.log('Discord订阅通知发送成功');
              } catch (discordError) {
                console.error('发送Discord订阅通知失败:', discordError);
                // 通知失败不影响主流程
              }
            } catch (error) {
              console.error('更新克隆次数或创建支付记录时出错:', error);
              throw error;
            }

            break;
          } else if (planDetails.type === 'subscription') {
            if (!planDetails.planType || !planDetails.endDate) {
              throw new Error('订阅计划类型或结束日期未定义');
            }
            console.log('开始更新订阅信息');
            console.log('当前用户订阅状态:', user.subscription);

            // 获取现有订阅信息
            const existingSubscription = user.subscription;
            let newEndDate = planDetails.endDate;
            // 保持更高级的计划类型（年度优先于月度）
            let newPlanType = planDetails.planType;
            if (existingSubscription?.status === 'active' && existingSubscription.planType === 'yearly' && planDetails.planType === 'monthly') {
              newPlanType = 'yearly'; // 如果已有年度计划，保持年度计划
              console.log('保持年度计划类型');
            }

            // 如果已有活跃订阅，累加时间
            if (existingSubscription && existingSubscription.status === 'active') {
              const currentEndDate = new Date(existingSubscription.endDate);
              if (currentEndDate > new Date()) {
                // 计算剩余天数
                const remainingDays = Math.ceil((currentEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                console.log('现有订阅剩余天数:', remainingDays);

                // 新订阅的天数
                const addDays = planDetails.planType === 'yearly' ? 365 : 31;
                console.log('新订阅天数:', addDays);

                // 累加天数
                newEndDate = new Date();
                newEndDate.setDate(newEndDate.getDate() + remainingDays + addDays);
                console.log('累加订阅时间至:', newEndDate);
              }
            }

            const updatedSubscription = await prisma.subscription.upsert({
              where: { userId: user.id },
              update: {
                planType: newPlanType,
                endDate: newEndDate,
                status: 'active',
              },
              create: {
                userId: user.id,
                planType: newPlanType,
                startDate: new Date(),
                endDate: newEndDate,
                status: 'active',
              },
            });
            console.log('更新后的订阅信息:', updatedSubscription);

            // 发送Discord通知
            try {
              console.log('发送Discord订阅通知...用户数据:', {
                id: user.id,
                name: user.name,
                email: user.email
              });
              
              await sendSubscriptionNotification({
                userId: user.id,
                userName: user.name || undefined,
                planName: `${newPlanType === 'yearly' ? '年度' : '月度'}订阅`,
                price: session.amount_total ? session.amount_total / 100 : undefined,
                currency: session.currency?.toUpperCase(),
                interval: newPlanType === 'yearly' ? '年' : '月',
                status: 'active'
              });
              console.log('Discord订阅通知发送成功');
            } catch (discordError) {
              console.error('发送Discord订阅通知失败:', discordError);
              // 通知失败不影响主流程
            }

            console.log('更新字符额度');
            const existingQuota = user.characterQuota;
            const currentTemporaryQuota = existingQuota?.temporaryQuota || 0;
            
            console.log('当前临时额度:', currentTemporaryQuota);
            console.log('新增额度:', planDetails.characters);
            
            // 如果已有临时额度且未过期
            if (existingQuota?.quotaExpiry && new Date(existingQuota.quotaExpiry) > new Date()) {
              // 使用新的到期时间
              console.log('累加临时额度，到期时间:', newEndDate);
              await prisma.characterQuota.update({
                where: { userId: user.id },
                data: {
                  temporaryQuota: {
                    increment: planDetails.characters
                  },
                  quotaExpiry: newEndDate,
                  lastUpdated: new Date(),
                }
              });
            } else {
              // 如果没有临时额度或已过期，设置新的临时额度和到期时间
              console.log('设置新的临时额度，到期时间:', newEndDate);
              await prisma.characterQuota.upsert({
                where: { userId: user.id },
                update: {
                  temporaryQuota: planDetails.characters,
                  quotaExpiry: newEndDate,
                  lastUpdated: new Date(),
                },
                create: {
                  userId: user.id,
                  temporaryQuota: planDetails.characters,
                  permanentQuota: 0,
                  quotaExpiry: newEndDate,
                  usedCharacters: 0,
                  lastUpdated: new Date(),
                }
              });
            }
          } else {
            // 永久额度的处理
            await prisma.characterQuota.upsert({
              where: { userId: user.id },
              update: {
                permanentQuota: {
                  increment: planDetails.characters
                },
                lastUpdated: new Date(),
              },
              create: {
                userId: user.id,
                permanentQuota: planDetails.characters,
                temporaryQuota: 0,
                usedCharacters: 0,
                lastUpdated: new Date(),
              }
            });
            
            // 发送Discord通知
            try {
              console.log('发送Discord订阅通知...');
              await sendSubscriptionNotification({
                userId: user.id,
                userName: user.name || undefined,
                planName: `永久字符包 (${planDetails.characters?.toLocaleString()}字符)`,
                price: session.amount_total ? session.amount_total / 100 : undefined,
                currency: session.currency?.toUpperCase(),
                status: 'completed'
              });
              console.log('Discord订阅通知发送成功');
            } catch (discordError) {
              console.error('发送Discord订阅通知失败:', discordError);
              // 通知失败不影响主流程
            }
          }

          console.log('处理完成');
          break;
        }

        case 'customer.subscription.updated': {
          console.log('处理 customer.subscription.updated 事件');
          const subscription = event.data.object as Stripe.Subscription;
          
          // 查找用户
          const metadataItems = await stripe.subscriptionItems.list({
            subscription: subscription.id,
            limit: 1,
          });
          
          // 尝试从元数据中获取用户ID或邮箱
          let userId;
          let userEmail;
          
          if (metadataItems.data.length > 0) {
            const priceId = metadataItems.data[0].price?.id;
            if (priceId) {
              const prices = await stripe.prices.retrieve(priceId);
              userId = prices?.metadata?.userId;
              userEmail = prices?.metadata?.userEmail;
            }
          }
          
          let user;
          
          // 如果元数据中有用户ID
          if (userId) {
            user = await prisma.users.findUnique({
              where: { id: userId },
              include: { subscription: true },
            });
          }
          
          // 如果元数据中有用户邮箱
          if (!user && userEmail) {
            user = await prisma.users.findUnique({
              where: { email: userEmail },
              include: { subscription: true },
            });
          }
          
          // 如果通过元数据没找到用户，尝试使用客户邮箱
          if (!user) {
            const customerId = subscription.customer as string;
            const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
            const email = customer.email;
            
            if (email) {
              user = await prisma.users.findUnique({
                where: { email },
                include: { subscription: true },
              });
            }
          }

          if (!user) {
            throw new Error('未找到用户，无法更新订阅状态');
          }

          // 更新订阅状态
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status: subscription.status || 'active',
              endDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : new Date(),
            },
          });
          break;
        }

        case 'customer.subscription.deleted': {
          console.log('处理 customer.subscription.deleted 事件');
          const subscription = event.data.object as Stripe.Subscription;
          
          // 查找用户
          const metadataItems = await stripe.subscriptionItems.list({
            subscription: subscription.id,
            limit: 1,
          });
          
          // 尝试从元数据中获取用户ID或邮箱
          let userId;
          let userEmail;
          
          if (metadataItems.data.length > 0) {
            const priceId = metadataItems.data[0].price?.id;
            if (priceId) {
              const prices = await stripe.prices.retrieve(priceId);
              userId = prices?.metadata?.userId;
              userEmail = prices?.metadata?.userEmail;
            }
          }
          
          let user;
          
          // 如果元数据中有用户ID
          if (userId) {
            user = await prisma.users.findUnique({
              where: { id: userId },
              include: { subscription: true },
            });
          }
          
          // 如果元数据中有用户邮箱
          if (!user && userEmail) {
            user = await prisma.users.findUnique({
              where: { email: userEmail },
              include: { subscription: true },
            });
          }
          
          // 如果通过元数据没找到用户，尝试使用客户邮箱
          if (!user) {
            const customerId = subscription.customer as string;
            const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
            const email = customer.email;
            
            if (email) {
              user = await prisma.users.findUnique({
                where: { email },
                include: { subscription: true },
              });
            }
          }

          if (!user) {
            throw new Error('未找到用户，无法取消订阅');
          }

          // 更新订阅状态为已取消
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status: 'canceled',
            },
          });
          break;
        }

        case 'invoice.payment_succeeded': {
          console.log('处理 invoice.payment_succeeded 事件');
          const invoice = event.data.object as Stripe.Invoice;
          
          // 检查是否是首次订阅支付，如果是则跳过处理（因为已经在 checkout.session.completed 中处理过）
          if (invoice.billing_reason === 'subscription_create') {
            console.log('跳过首次订阅支付的处理（已在 checkout.session.completed 中处理）');
            break;
          }

          // 尝试从发票元数据中获取用户信息
          let userId = invoice.metadata?.userId;
          let userEmail = invoice.metadata?.userEmail;
          
          let user;
          
          // 如果发票元数据中有用户ID
          if (userId) {
            user = await prisma.users.findUnique({
              where: { id: userId },
              include: { subscription: true, characterQuota: true },
            });
          }
          
          // 如果发票元数据中有用户邮箱
          if (!user && userEmail) {
            user = await prisma.users.findUnique({
              where: { email: userEmail },
              include: { subscription: true, characterQuota: true },
            });
          }
          
          // 如果通过发票元数据没找到用户，尝试使用客户邮箱
          if (!user) {
            const customerId = invoice.customer as string;
            const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
            const email = customer.email;
            
            if (email) {
              user = await prisma.users.findUnique({
                where: { email },
                include: { subscription: true, characterQuota: true },
              });
            }
          }

          if (!user) {
            throw new Error('未找到用户，无法处理发票支付');
          }

          // 如果是订阅续费，更新字符配额
          if ((invoice as any).subscription) {
            const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
            const priceId = subscription.items.data[0]?.price.id;
            if (priceId) {
              const planDetails = getPlanDetailsFromPriceId(priceId);
              
              if (!planDetails.planType || !planDetails.endDate) {
                throw new Error('订阅计划类型或结束日期未定义');
              }

              // 获取现有订阅信息
              const existingSubscription = user.subscription;
              let newEndDate = planDetails.endDate;
              // 保持更高级的计划类型（年度优先于月度）
              let newPlanType = planDetails.planType;
              if (existingSubscription?.status === 'active' && existingSubscription.planType === 'yearly' && planDetails.planType === 'monthly') {
                newPlanType = 'yearly'; // 如果已有年度计划，保持年度计划
                console.log('保持年度计划类型');
              }

              // 如果已有活跃订阅，累加时间
              if (existingSubscription && existingSubscription.status === 'active') {
                const currentEndDate = new Date(existingSubscription.endDate);
                if (currentEndDate > new Date()) {
                  // 计算剩余天数
                  const remainingDays = Math.ceil((currentEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  console.log('现有订阅剩余天数:', remainingDays);

                  // 新订阅的天数
                  const addDays = planDetails.planType === 'yearly' ? 365 : 31;
                  console.log('新订阅天数:', addDays);

                  // 累加天数
                  newEndDate = new Date();
                  newEndDate.setDate(newEndDate.getDate() + remainingDays + addDays);
                  console.log('累加订阅时间至:', newEndDate);
                }
              }

              // 更新订阅信息
              await prisma.subscription.upsert({
                where: { userId: user.id },
                update: {
                  planType: newPlanType,
                  endDate: newEndDate,
                  status: 'active',
                },
                create: {
                  userId: user.id,
                  planType: newPlanType,
                  startDate: new Date(),
                  endDate: newEndDate,
                  status: 'active',
                },
              });

              // 更新字符额度
              const existingQuota = user.characterQuota;
              
              if (existingQuota?.quotaExpiry && new Date(existingQuota.quotaExpiry) > new Date()) {
                // 如果已有未过期的临时额度，累加额度并更新到期时间
                console.log('累加临时额度，到期时间:', newEndDate);
                await prisma.characterQuota.update({
                  where: { userId: user.id },
                  data: {
                    temporaryQuota: {
                      increment: planDetails.characters
                    },
                    quotaExpiry: newEndDate,
                    lastUpdated: new Date(),
                  }
                });
              } else {
                // 如果没有临时额度或已过期，设置新的临时额度和到期时间
                console.log('设置新的临时额度，到期时间:', newEndDate);
                await prisma.characterQuota.upsert({
                  where: { userId: user.id },
                  update: {
                    temporaryQuota: planDetails.characters,
                    quotaExpiry: newEndDate,
                    lastUpdated: new Date(),
                  },
                  create: {
                    userId: user.id,
                    temporaryQuota: planDetails.characters,
                    permanentQuota: 0,
                    quotaExpiry: newEndDate,
                    usedCharacters: 0,
                    lastUpdated: new Date(),
                  }
                });
              }
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          console.log('处理 invoice.payment_failed 事件');
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          const email = customer.email;

          if (!email) {
            throw new Error('未找到客户邮箱');
          }

          const user = await prisma.users.findUnique({
            where: { email },
            include: { subscription: true },
          });

          if (!user) {
            throw new Error('未找到用户');
          }

          // 更新订阅状态为支付失败
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status: 'payment_failed',
            },
          });
          break;
        }
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('处理 webhook 时出错:', error);
      return NextResponse.json(
        { error: 'Webhook processing failed', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webhook 处理主流程错误:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function getPlanDetailsFromPriceId(priceId: string): {
  type: 'subscription' | 'oneTime' | 'clone';
  planType?: string;
  endDate?: Date;
  characters?: number;
  clone_count?: number;
} {
  const now = new Date();
  const oneYear = new Date(now);
  oneYear.setFullYear(oneYear.getFullYear() + 1);
  
  const oneMonth = new Date(now);
  oneMonth.setDate(oneMonth.getDate() + 31);

  switch (priceId) {
    case process.env.STRIPE_YEARLY_PRICE_ID:
      return {
        type: 'subscription',
        planType: 'yearly',
        endDate: oneYear,
        characters: 1500000,
      };
    case process.env.STRIPE_MONTHLY_PRICE_ID:
      return {
        type: 'subscription',
        planType: 'monthly',
        endDate: oneMonth,
        characters: 100000,
      };
    case process.env.STRIPE_10K_PRICE_ID:
      return {
        type: 'oneTime',
        characters: 100000,
      };
    case process.env.STRIPE_1M_PRICE_ID:
      return {
        type: 'oneTime',
        characters: 1000000,
      };
    case process.env.STRIPE_3M_PRICE_ID:
      return {
        type: 'oneTime',
        characters: 3000000,
      };
    case process.env.STRIPE_CLONE_1_PRICE_ID:
      return {
        type: 'clone',
        clone_count: 1,
      };
    case process.env.STRIPE_CLONE_10_PRICE_ID:
      return {
        type: 'clone',
        clone_count: 10,
      };
    case process.env.STRIPE_CLONE_50_PRICE_ID:
      return {
        type: 'clone',
        clone_count: 50,
      };
    default:
      throw new Error('无效的价格 ID');
  }
} 
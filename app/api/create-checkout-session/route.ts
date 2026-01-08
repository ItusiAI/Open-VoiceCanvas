import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { validateUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const PLAN_PRICES = {
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  tenThousandChars: process.env.STRIPE_10K_PRICE_ID,
  millionChars: process.env.STRIPE_1M_PRICE_ID,
  threeMillionChars: process.env.STRIPE_3M_PRICE_ID,
  clone1: process.env.STRIPE_CLONE_1_PRICE_ID,
  clone10: process.env.STRIPE_CLONE_10_PRICE_ID,
  clone50: process.env.STRIPE_CLONE_50_PRICE_ID,
};

const CLONE_COUNTS = {
  clone1: 1,
  clone10: 10,
  clone50: 50,
};

// 判断是否为订阅类型的计划
const isSubscriptionPlan = (planType: string) => {
  return planType === 'yearly' || planType === 'monthly';
};

export async function POST(req: Request) {
  try {
    console.log('开始创建支付会话...');
    
    // 验证环境变量
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe密钥未配置');
      return NextResponse.json(
        { error: 'Stripe secret key is not configured' },
        { status: 500 }
      );
    }

    // 使用新的验证函数验证用户会话
    console.log('验证用户会话...');
    const sessionResult = await validateUserSession();
    
    console.log('验证结果:', {
      valid: sessionResult.valid,
      error: sessionResult.error,
      status: sessionResult.status,
      userId: sessionResult.user?.id,
      userEmail: sessionResult.user?.email
    });
    
    if (!sessionResult.valid || !sessionResult.user) {
      console.error('用户验证失败:', sessionResult.error);
      return NextResponse.json({ error: sessionResult.error || '用户验证失败' }, { status: sessionResult.status || 400 });
    }

    const requestBody = await req.json();
    console.log('请求体:', requestBody);
    
    const { planType } = requestBody;
    if (!planType) {
      console.error('缺少planType参数');
      return NextResponse.json({ error: '缺少计划类型参数' }, { status: 400 });
    }
    
    const priceId = PLAN_PRICES[planType as keyof typeof PLAN_PRICES];

    // 验证价格ID
    if (!priceId) {
      console.error(`未找到价格ID: ${planType}`);
      return NextResponse.json(
        { error: `Price ID not found for plan type: ${planType}` },
        { status: 400 }
      );
    }
    
    console.log('使用价格ID:', priceId);

    // 检查是否是克隆包
    const isClonePackage = planType.startsWith('clone');
    const cloneCount = isClonePackage ? CLONE_COUNTS[planType as keyof typeof CLONE_COUNTS] : 0;

    // 验证基础URL
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error('基础URL未配置');
      return NextResponse.json(
        { error: 'Base URL is not configured' },
        { status: 500 }
      );
    }

    const mode = isSubscriptionPlan(planType) ? 'subscription' : 'payment';
    console.log('支付模式:', mode);
    
    console.log('创建Stripe支付会话...');
    const checkoutSession = await stripe.checkout.sessions.create({
      ...(mode === 'payment' ? { submit_type: 'pay' } : {}),
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      customer_email: sessionResult.user.email, // 使用验证后的用户邮箱
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?success=true&type=${isClonePackage ? 'clone' : 'quota'}&count=${cloneCount}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?canceled=true`,
      metadata: {
        userId: sessionResult.user.id,
        userEmail: sessionResult.user.email,
        planType,
        cloneCount: cloneCount.toString(),
      },
    } as Stripe.Checkout.SessionCreateParams);
    
    console.log('Stripe会话已创建:', checkoutSession.id);
    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('创建支付会话错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: `Error creating checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
} 
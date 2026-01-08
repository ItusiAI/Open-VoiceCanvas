'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Star, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { NavBar } from "@/components/nav-bar";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { PricingTitleUpdater } from "./title-updater";
import { ChevronUp } from "lucide-react";

// 初始化 Stripe 的 Promise，添加重试机制
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Stripe publishable key is not configured');
      throw new Error('支付系统配置错误');
    }

    if (!publishableKey.startsWith('pk_')) {
      console.error('Invalid Stripe publishable key');
      throw new Error('支付系统配置错误');
    }

    stripePromise = loadStripe(publishableKey)
      .catch(error => {
        console.error('Stripe 加载失败:', error);
        stripePromise = null; // 重置 Promise 以便下次重试
        throw error;
      });
  }
  return stripePromise;
};

const plans = [
  {
    type: "trial",
    features: [
      "freeChars|amount=1000",
      "trialPeriod|days=7",
      "languageSupport",
      "basicSpeedControl",
      "basicVoiceSelection",
      "textInputOnly",
      "standardSupport"
    ]
  },
  {
    type: "yearly",
    features: [
      "yearlyQuota|amount=1500000",
      "languageSupport",
      "fullSpeedControl",
      "allVoices",
      "wordByWordReading",
      "fileUpload",
      "audioVisualization",
      "storyVoiceover",
      "support247",
      "earlyAccess"
    ]
  },
  {
    type: "monthly",
    features: [
      "monthlyQuota|amount=100000",
      "languageSupport",
      "fullSpeedControl",
      "allVoices",
      "wordByWordReading",
      "fileUpload",
      "audioVisualization",
      "storyVoiceover",
      "prioritySupport"
    ]
  }
];

const payAsYouGo = [
  {
    type: "tenThousandChars",
    price: "$6",
    popular: false
  },
  {
    type: "millionChars",
    price: "$55",
    popular: true
  },
  {
    type: "threeMillionChars",
    price: "$150",
    popular: false
  }
];

export default function PricingPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 用户评价数据
  const testimonials = [
    {
      avatar: "J",
      name: t('testimonial1Name'),
      role: t('testimonial1Role'),
      content: t('testimonial1Content'),
      rating: 5
    },
    {
      avatar: "M",
      name: t('testimonial2Name'),
      role: t('testimonial2Role'),
      content: t('testimonial2Content'),
      rating: 5
    },
    {
      avatar: "S",
      name: t('testimonial3Name'),
      role: t('testimonial3Role'),
      content: t('testimonial3Content'),
      rating: 5
    },
    {
      avatar: "R",
      name: t('testimonial4Name'),
      role: t('testimonial4Role'),
      content: t('testimonial4Content'),
      rating: 5
    },
    {
      avatar: "L",
      name: t('testimonial5Name'),
      role: t('testimonial5Role'),
      content: t('testimonial5Content'),
      rating: 5
    },
    {
      avatar: "Y",
      name: t('testimonial6Name'),
      role: t('testimonial6Role'),
      content: t('testimonial6Content'),
      rating: 5
    },
    {
      avatar: "K",
      name: t('testimonial7Name'),
      role: t('testimonial7Role'),
      content: t('testimonial7Content'),
      rating: 5
    },
    {
      avatar: "H",
      name: t('testimonial8Name'),
      role: t('testimonial8Role'),
      content: t('testimonial8Content'),
      rating: 5
    },
    {
      avatar: "L",
      name: t('testimonial9Name'),
      role: t('testimonial9Role'),
      content: t('testimonial9Content'),
      rating: 5
    },
    {
      avatar: "Z",
      name: t('testimonial10Name'),
      role: t('testimonial10Role'),
      content: t('testimonial10Content'),
      rating: 5
    }
  ];

  // 返回顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 固定的翻页Testimonial效果
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonialIndex((current) => 
        current === testimonials.length - 3 ? 0 : current + 1
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  // 检查 Stripe 配置
  useEffect(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey || !publishableKey.startsWith('pk_')) {
      console.error('Stripe publishable key is not properly configured');
      toast({
        title: t('error'),
        description: t('paymentSystemError'),
        variant: "destructive",
      });
    }
  }, []);

  const getClonePackages = () => [
    {
      id: 'clone1',
      name: t('clonePackageBasic'),
      originalPrice: '$5',
      price: '$3',
      saveAmount: '$2',
      clones: 1,
      description: t('clonePackageBasicDesc'),
      features: [
        t('cloneFeature1Times', { count: 1 }),
        t('cloneFeatureValidForever'),
        t('cloneFeatureMultiLanguage'),
        t('cloneFeatureCustomization'),
        t('cloneFeatureStandardSupport')
      ]
    },
    {
      id: 'clone50',
      name: t('clonePackagePro'),
      originalPrice: '$299',
      price: '$150',
      saveAmount: '$149',
      clones: 50,
      description: t('clonePackageProDesc'),
      features: [
        t('cloneFeature1Times', { count: 50 }),
        t('cloneFeatureValidForever'),
        t('cloneFeatureMultiLanguage'),
        t('cloneFeatureCustomization'),
        t('cloneFeaturePrioritySupport')
      ]
    },
    {
      id: 'clone10',
      name: t('clonePackageAdvanced'),
      originalPrice: '$59',
      price: '$30',
      saveAmount: '$29',
      clones: 10,
      description: t('clonePackageAdvancedDesc'),
      features: [
        t('cloneFeature1Times', { count: 10 }),
        t('cloneFeatureValidForever'),
        t('cloneFeatureMultiLanguage'),
        t('cloneFeatureCustomization'),
        t('cloneFeaturePrioritySupport')
      ]
    }
  ];

  const handlePlanClick = async (type: string) => {
    if (!session) {
      setShowAuthDialog(true);
      return;
    }

    if (type === 'trial') {
      router.push('/app');
      return;
    }

    try {
      // 尝试刷新会话，确保用户数据完整
      console.log('刷新用户会话...');
      const refreshResponse = await fetch('/api/auth/refresh-session');
      if (!refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        if (refreshData.message?.includes('登录') || refreshData.message?.includes('身份验证')) {
          toast({
            title: t('error'),
            description: t('please_login_again') || '请重新登录',
            variant: "destructive",
          });
          setShowAuthDialog(true);
          return;
        }
      } else {
        const refreshData = await refreshResponse.json();
        if (refreshData.fixed) {
          console.log('会话ID已修复:', refreshData);
        }
      }

      // 最多重试3次
      let retries = 3;
      let stripe = null;
      
      while (retries > 0 && !stripe) {
        try {
          stripe = await getStripe();
        } catch (error) {
          console.error(`Stripe 加载失败，剩余重试次数: ${retries - 1}`, error);
          retries--;
          if (retries === 0) {
            throw new Error(t('stripeLoadError'));
          }
          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!stripe) {
        throw new Error(t('stripeLoadError'));
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('checkoutError'));
      }

      const { sessionId } = await response.json();
      
      if (!sessionId) {
        throw new Error(t('invalidSessionId'));
      }

      // 添加超时处理
      const redirectPromise = stripe.redirectToCheckout({ sessionId });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(t('checkoutTimeout'))), 10000)
      );

      const result = await Promise.race([redirectPromise, timeoutPromise]);

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('支付错误:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('unknownError'),
        variant: "destructive",
      });
    }
  };

  const handleClonePackagePurchase = async (packageId: string) => {
    if (!session) {
      setShowAuthDialog(true);
      return;
    }

    try {
      // 尝试刷新会话，确保用户数据完整
      console.log('刷新用户会话...');
      const refreshResponse = await fetch('/api/auth/refresh-session');
      if (!refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        if (refreshData.message?.includes('登录') || refreshData.message?.includes('身份验证')) {
          toast({
            title: t('error'),
            description: t('please_login_again') || '请重新登录',
            variant: "destructive",
          });
          setShowAuthDialog(true);
          return;
        }
      } else {
        const refreshData = await refreshResponse.json();
        if (refreshData.fixed) {
          console.log('会话ID已修复:', refreshData);
        }
      }
      
      const stripe = await getStripe();
      
      if (!stripe) {
        throw new Error(t('stripeError'));
      }
      
      // 检查当前用户状态
      const sessionRes = await fetch('/api/user/session');
      if (!sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.error === '用户数据不完整' || sessionData.error.includes('不完整')) {
          throw new Error(t('profileIncomplete') || '请先完善您的个人资料信息');
        } else {
          throw new Error(sessionData.error || t('checkoutError'));
        }
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: packageId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // 检查是否是用户数据不完整的错误
        if (error.error === '用户数据不完整' || error.error.includes('不完整')) {
          throw new Error(t('profileIncomplete') || '请先完善您的个人资料信息');
        } else {
          throw new Error(error.error || t('checkoutError'));
        }
      }

      const { sessionId } = await response.json();
      
      // 添加超时处理
      const redirectPromise = stripe.redirectToCheckout({ sessionId });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(t('checkoutTimeout'))), 10000)
      );

      const result = await Promise.race([redirectPromise, timeoutPromise]);

      if (result.error) {
        throw new Error(result.error.message || t('checkoutError'));
      }
    } catch (error) {
      console.error('克隆包购买错误:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('unknownError'),
        variant: "destructive",
      });
    }
  };

  const getPlanName = (type: string) => {
    switch (type) {
      case 'trial': return t('trialPlan');
      case 'yearly': return t('yearlyPlan');
      case 'monthly': return t('monthlyPlan');
      default: return '';
    }
  };

  const getPlanDesc = (type: string) => {
    switch (type) {
      case 'trial': return t('trialDesc');
      case 'yearly': return t('yearlyDesc');
      case 'monthly': return t('monthlyDesc');
      default: return '';
    }
  };

  const getPlanPrice = (type: string) => {
    switch (type) {
      case 'monthly':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground line-through">$9.99</span>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">$5.99</span>
            <span className="text-muted-foreground">{t('perMonth')}</span>
            <Badge className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-0">{t('save')} $4</Badge>
          </div>
        );
      case 'yearly':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground line-through">$99.9</span>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">$49.9</span>
            <span className="text-muted-foreground">{t('perYear')}</span>
            <Badge className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-0">{t('save')} $50</Badge>
          </div>
        );
      case 'trial':
        return (
          <div>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">{t('free')}</span>
          </div>
        );
      default:
        return '';
    }
  };

  const getPlanPeriod = (type: string) => {
    switch (type) {
      case 'yearly': return t('perYear');
      case 'monthly': return t('perMonth');
      default: return '';
    }
  };

  const getButtonText = (type: string) => {
    switch (type) {
      case 'trial': return t('startTrial');
      case 'yearly': return t('chooseYearly');
      case 'monthly': return t('chooseMonthly');
      default: return '';
    }
  };

  const translateFeature = (feature: string) => {
    const [key, params] = feature.split('|');
    if (params) {
      const paramObj = Object.fromEntries(
        params.split(',').map(p => {
          const [k, v] = p.split('=');
          if (k === 'amount') {
            return [k, v];
          }
          return [k, v];
        })
      );
      return t(key, paramObj as any);
    }
    return t(key);
  };

  return (
    <div className="min-h-screen bg-background">
      <PricingTitleUpdater />
      <NavBar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">{t('pricingTitle')}</h1>
          <p className="text-xl text-muted-foreground">{t('pricingSubtitle')}</p>
        </div>

        {/* 会员方案 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card key={plan.type} className={`p-6 relative ${plan.type === 'yearly' ? 'border-primary shadow-lg' : ''}`}>
              {plan.type === 'yearly' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm">
                    {t('mostPopular')}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg" />
              <div className="relative">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{getPlanName(plan.type)}</h3>
                  <p className="text-muted-foreground">{getPlanDesc(plan.type)}</p>
                </div>
                <div className="mb-6">
                  {getPlanPrice(plan.type)}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span>{translateFeature(feature)}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white" 
                  variant={plan.type === 'yearly' ? "default" : "outline"}
                  onClick={() => handlePlanClick(plan.type)}
                >
                  {getButtonText(plan.type)}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* 克隆次数购买部分 */}
        <div id="clone-packages" className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {t('clonePackagesTitle')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('clonePackagesSubtitle')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {getClonePackages().map((pkg) => (
              <Card key={pkg.id} className={`p-6 relative ${pkg.id === 'clone50' ? 'border-primary shadow-lg' : ''}`}>
                {pkg.id === 'clone50' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm">
                      {t('mostPopular')}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg" />
                <div className="relative">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{pkg.name}</h3>
                    <p className="text-muted-foreground">{pkg.description}</p>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">{pkg.originalPrice}</span>
                      <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">{pkg.price}</span>
                      <Badge className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-0">{t('save')} {pkg.saveAmount}</Badge>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white" 
                    onClick={() => handleClonePackagePurchase(pkg.id)}
                  >
                    {t('buyNow')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 按量付费方案 */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">{t('payAsYouGo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {payAsYouGo.map((plan) => (
              <Card key={plan.type} className={`p-6 relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm">
                      {t('bestValue')}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg" />
                <div className="relative text-center">
                  <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{t(plan.type)}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">{plan.price}</span>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handlePlanClick(plan.type)}
                  >
                    {t('buyNow')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 用户评价部分 */}
        <div className="mt-16">
          <div className="bg-gradient-to-b from-background via-purple-500/5 to-background py-8 md:py-16 overflow-hidden">
            <div className="container mx-auto px-4">
              <motion.h2
                className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {t('testimonials')}
              </motion.h2>
              <div className="relative">
                <div className="overflow-hidden mx-auto">
                  <motion.div
                    className="flex"
                    initial={false}
                    animate={{
                      x: `-${activeTestimonialIndex * (isMobile ? 100 : 33.33)}%`,
                      transition: {
                        duration: 0.5,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {testimonials.map((testimonial, index) => (
                      <div 
                        key={index} 
                        className="w-full flex-shrink-0 md:w-1/3 px-2 md:px-4"
                      >
                        <motion.div
                          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.15)" }}
                          transition={{ duration: 0.2 }}
                          className="h-full"
                        >
                          <Card className="p-2 md:p-3 h-[180px] bg-background/60 backdrop-blur border border-purple-500/10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-purple-500/[0.03] to-pink-500/[0.03] opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* 装饰性引号 */}
                            <div className="absolute top-1 right-1 text-3xl text-purple-500/10 font-serif">"</div>
                            
                            <div className="relative flex flex-col h-full">
                              <div className="flex-grow overflow-hidden">
                                <p className="text-sm md:text-base text-foreground/90 font-medium leading-tight line-clamp-3 mb-0.5">
                                  {testimonial.content}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1.5 mt-auto pt-1.5 border-t border-purple-500/10">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center text-purple-700 dark:text-purple-300 font-semibold text-xs border border-purple-500/10 flex-shrink-0">
                                  {testimonial.avatar}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs truncate">
                                    {testimonial.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {testimonial.role}
                                  </div>
                                </div>
                                
                                <div className="flex ml-auto">
                                  {[...Array(testimonial.rating)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: i * 0.05, duration: 0.1 }}
                                    >
                                      <Star className="h-3 w-3 fill-purple-500 text-purple-500" />
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      </div>
                    ))}
                  </motion.div>
                </div>
                <motion.button
                  className="absolute top-1/2 left-2 transform -translate-y-1/2 p-2 md:p-3 rounded-full bg-background/80 backdrop-blur-sm border border-purple-500/20 shadow-sm hover:bg-purple-500/5 transition-all duration-300 z-10"
                  onClick={() => setActiveTestimonialIndex((current) => 
                    current === 0 ? testimonials.length - (isMobile ? 1 : 3) : current - 1
                  )}
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 rotate-180 text-purple-700 dark:text-purple-300" />
                </motion.button>
                <motion.button
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 p-2 md:p-3 rounded-full bg-background/80 backdrop-blur-sm border border-purple-500/20 shadow-sm hover:bg-purple-500/5 transition-all duration-300 z-10"
                  onClick={() => setActiveTestimonialIndex((current) => 
                    current === testimonials.length - (isMobile ? 1 : 3) ? 0 : current + 1
                  )}
                  whileHover={{ scale: 1.1, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-purple-700 dark:text-purple-300" />
                </motion.button>
              </div>
              <div className="flex justify-center gap-2 mt-6 md:mt-10">
                {[...Array(isMobile ? testimonials.length : testimonials.length - 2)].map((_, index) => (
                  <motion.button
                    key={index}
                    className={`w-8 h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                      index === activeTestimonialIndex 
                        ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' 
                        : 'bg-purple-200 dark:bg-purple-900/20'
                    }`}
                    onClick={() => setActiveTestimonialIndex(index)}
                    whileHover={{ scaleX: 1.2 }}
                    whileTap={{ scaleX: 0.8 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ部分 */}
        <div className="mt-16">
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {t('faq')}
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bg-background/60 backdrop-blur border border-primary/10 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">{t('faqTrialFeatures')}</h3>
                <p className="text-muted-foreground">{t('faqTrialFeaturesAnswer')}</p>
              </div>
              <div className="bg-background/60 backdrop-blur border border-primary/10 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">{t('faqHowToTry')}</h3>
                <p className="text-muted-foreground">{t('faqHowToTryAnswer')}</p>
              </div>
              <div className="bg-background/60 backdrop-blur border border-primary/10 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">{t('faqQuotaCalc')}</h3>
                <p className="text-muted-foreground">{t('faqQuotaCalcAnswer')}</p>
              </div>
              <div className="bg-background/60 backdrop-blur border border-primary/10 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">{t('faqPayment')}</h3>
                <p className="text-muted-foreground">{t('faqPaymentAnswer')}</p>
              </div>
              <div className="bg-background/60 backdrop-blur border border-primary/10 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">{t('faqQuotaType')}</h3>
                <p className="text-muted-foreground">{t('faqQuotaTypeAnswer')}</p>
              </div>
              <div className="bg-background/60 backdrop-blur border border-primary/10 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">{t('faqCloneVoice')}</h3>
                <p className="text-muted-foreground">{t('faqCloneVoiceAnswer')}</p>
              </div>
              <div className="bg-background/60 backdrop-blur border border-primary/10 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">{t('faqStoryVoiceover')}</h3>
                <p className="text-muted-foreground">{t('faqStoryVoiceoverAnswer')}</p>
              </div>
              <div className="bg-background/60 backdrop-blur border border-primary/10 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">{t('faqHowToGenerateStoryVoiceover')}</h3>
                <p className="text-muted-foreground">{t('faqHowToGenerateStoryVoiceoverAnswer')}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)} 
      />
      
      {/* 返回顶部按钮 */}
      <motion.div 
        className="fixed bottom-24 right-6 z-[100]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <button
          onClick={scrollToTop}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-background/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-700"
          title={t('back_to_top')}
        >
          <ChevronUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </motion.div>

      {/* Discord 悬浮按钮 */}
      <motion.div 
        className="fixed bottom-6 right-6 z-[100]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <a 
          href="https://discord.gg/966GMKhQhs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-background/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-700"
          title={t('join_discord_community')}
        >
          <img 
            src="/images/discord.png" 
            alt="Discord" 
            className="w-11 h-11 object-contain"
          />
        </a>
      </motion.div>
    </div>
  );
} 
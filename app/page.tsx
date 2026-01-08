'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic2, Globe2, Sparkles, ArrowRight, Volume2, Settings, FileText, Star, Pause, Play, Download, Upload, Crown, Rocket, UserSquare2, Check, Badge, Zap, Waves, Music, Languages, BookOpen, ChevronUp, Palette, Radio } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { NavBar } from "@/components/nav-bar";
import { RequireAuth } from "@/components/require-auth";
import { cn } from "@/lib/utils";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade } from 'swiper/modules';
import { useTheme } from "next-themes";
import 'swiper/css';
import 'swiper/css/effect-fade';
import { AuthDialog } from "@/components/auth-dialog";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { loadStripe } from '@stripe/stripe-js';

// 从pricing页面导入的函数
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

// pricing页面的辅助函数
const getPlanName = (type: string) => {
  const { t } = useLanguage();
  switch (type) {
    case 'trial': return t('trialPlan');
    case 'yearly': return t('yearlyPlan');
    case 'monthly': return t('monthlyPlan');
    default: return '';
  }
};

const getPlanDesc = (type: string) => {
  const { t } = useLanguage();
  switch (type) {
    case 'trial': return t('trialDesc');
    case 'yearly': return t('yearlyDesc');
    case 'monthly': return t('monthlyDesc');
    default: return '';
  }
};

const getPlanPrice = (type: string) => {
  const { t } = useLanguage();
  switch (type) {
    case 'trial':
      return (
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">{t('free')}</span>
        </div>
      );
    case 'monthly':
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground line-through">$9.99</span>
          <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">$5.99</span>
          <span className="text-muted-foreground">{t('perMonth')}</span>
        </div>
      );
    case 'yearly':
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground line-through">$99.9</span>
          <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">$49.9</span>
          <span className="text-muted-foreground">{t('perYear')}</span>
        </div>
      );
    default:
      return null;
  }
};

const getPlanPeriod = (type: string) => {
  const { t } = useLanguage();
  switch (type) {
    case 'yearly': return t('perYear');
    case 'monthly': return t('perMonth');
    default: return '';
  }
};

const getButtonText = (type: string) => {
  const { t } = useLanguage();
  switch (type) {
    case 'trial': return t('startTrial');
    case 'yearly': return t('chooseYearly');
    case 'monthly': return t('chooseMonthly');
    default: return '';
  }
};

const translateFeature = (key: string) => {
  const { t } = useLanguage();
  
  const [featureKey, params] = key.split('|');
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
    return t(featureKey, paramObj as any);
  }
  return t(featureKey);
};

const getClonePackages = () => {
  const { t } = useLanguage();
  return [
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
};

// 添加stripe初始化代码
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

export default function LandingPage() {
  const { t } = useLanguage();
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [stars, setStars] = useState<Array<{ top: number; left: number; delay: number; opacity: number }>>([]);
  const { data: session } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  
  // 用于展示的短语
  const demoTextPhrases = [
    t('demoPhrase1'),
    t('demoPhrase2'),
  ];
  
  // 监听语言变化，重置打字机效果
  const { language } = useLanguage();
  useEffect(() => {
    // 重置打字机状态
    setTypedText("");
    setCurrentPhrase(0);
    setIsTyping(true);
  }, [language]);
  
  const features = [
    {
      icon: <Mic2 className="h-6 w-6" />,
      title: t('feature1Title'),
      description: t('feature1Desc')
    },
    {
      icon: <Globe2 className="h-6 w-6" />,
      title: t('feature2Title'),
      description: t('feature2Desc')
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: t('feature3Title'),
      description: t('feature3Desc')
    },
    {
      icon: <UserSquare2 className="h-6 w-6" />,
      title: t('feature4Title'),
      description: t('feature4Desc')
    }
  ];

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

  // 生成随机星星
  useEffect(() => {
    setStars(Array.from({ length: 50 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.3,
    })));
  }, []);

  // 打字机效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // 确保 demoTextPhrases 数组有值且 currentPhrase 不越界
    if (!demoTextPhrases || demoTextPhrases.length === 0) {
      return () => {};
    }
    
    // 修正 currentPhrase 索引，确保在有效范围内
    const safeCurrentPhrase = currentPhrase >= demoTextPhrases.length ? 0 : currentPhrase;
    const currentText = demoTextPhrases[safeCurrentPhrase] || "";
    
    if (isTyping && typedText.length < currentText.length) {
      timer = setTimeout(() => {
        setTypedText(currentText.slice(0, typedText.length + 1));
      }, 100);
    } else if (isTyping && typedText.length === currentText.length) {
      timer = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    } else if (!isTyping && typedText.length > 0) {
      timer = setTimeout(() => {
        setTypedText(typedText.slice(0, typedText.length - 1));
      }, 50);
    } else if (!isTyping && typedText.length === 0) {
      timer = setTimeout(() => {
        setCurrentPhrase((safeCurrentPhrase + 1) % demoTextPhrases.length);
        setIsTyping(true);
      }, 500);
    }
    
    return () => clearTimeout(timer);
  }, [typedText, isTyping, currentPhrase, demoTextPhrases]);
  
  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 特性出现动画
  useEffect(() => {
    const interval = setInterval(() => {
      if (visibleFeatures.length < 4) {
        setVisibleFeatures(prev => {
          const next = prev.length < 4 ? [...prev, prev.length] : prev;
          return next;
        });
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [visibleFeatures]);

  // 固定的翻页Testimonial效果
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonialIndex((current) => 
        current === testimonials.length - 3 ? 0 : current + 1
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  // 返回顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 处理购买按钮点击，使用stripe
  const handlePlanClick = async (planType: string) => {
    if (!session) {
      setShowAuthDialog(true);
      return;
    }

    if (planType === 'trial') {
      router.push('/app');
      return;
    }

    try {
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
            throw new Error(t('paymentSystemLoadFailed'));
          }
          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!stripe) {
        throw new Error(t('paymentSystemLoadFailed'));
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: planType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('checkoutCreationFailed'));
      }

      const { sessionId } = await response.json();
      
      if (!sessionId) {
        throw new Error(t('invalidPaymentSession'));
      }

      // 添加超时处理
      const redirectPromise = stripe.redirectToCheckout({ sessionId });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(t('paymentTimeout'))), 10000)
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

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section - 重构部分 */}
      <div className="min-h-[60vh] flex items-center relative overflow-hidden py-4 md:py-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 overflow-hidden">
            {/* 主动态背景 */}
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.3),rgba(236,72,153,0.3)_50%)]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "reverse"
              }}
            />
            
            {/* 流动渐变效果 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30"
              animate={{
                x: ['-100%', '100%'],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* 光晕效果 */}
            <motion.div
              className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(56,189,248,0.3)_0deg,rgba(236,72,153,0.3)_120deg,rgba(168,85,247,0.3)_240deg)]"
              animate={{
                rotate: [0, 360],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* 星光效果 */}
            <div className="absolute inset-0">
              {stars.map((star, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-0.5 md:w-1 md:h-1 bg-white/80 rounded-full"
                  style={{
                    top: `${star.top}%`,
                    left: `${star.left}%`,
                  }}
                  animate={{
                    opacity: [star.opacity, star.opacity * 1.5, star.opacity],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: star.delay,
                  }}
                />
              ))}
            </div>
            
            {/* 背景模糊 */}
            <div className="absolute inset-0 backdrop-blur-[80px] bg-background/30" />
          </div>
        </div>
        
        <div className="container mx-auto px-4 z-10">
          <div className="flex flex-col items-center justify-center">
            {/* 主标题 */}
            <motion.div
              className="relative z-10 mb-2"
              initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">
            {t('landingTitle')}
          </span>
              </h1>
              
              {/* 打字机效果 */}
              <div className="mt-2 md:mt-4 mb-6 md:mb-8 h-auto min-h-[3rem] md:min-h-[2.5rem] flex items-center justify-center">
                <p className="text-lg md:text-xl text-center font-bold w-full px-4 mx-auto whitespace-normal md:whitespace-nowrap md:w-auto overflow-hidden text-ellipsis md:overflow-visible md:text-clip">
                  <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">
                    {typedText}
                    <motion.span 
                      className="absolute inline-block w-[2px] h-[1.2em] ml-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear", repeatType: "reverse" }}
                    />
            </span>
                </p>
          </div>
            </motion.div>
  
            {/* 功能标签 */}
            <motion.div 
              className="flex flex-wrap justify-center gap-2 mb-2 md:mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <AnimatePresence>
                {visibleFeatures.includes(0) && (
                  <motion.div
                    key="feature-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center px-3 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/20 backdrop-blur-sm"
                  >
                    <Globe2 className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">{t('aiPowered')}</span>
                  </motion.div>
                )}
                
                {visibleFeatures.includes(1) && (
                  <motion.div
                    key="feature-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center px-3 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/20 backdrop-blur-sm"
                  >
                    <Mic2 className="h-4 w-4 mr-2 text-green-400" />
                    <span className="text-sm font-medium text-green-400">{t('voiceCloning')}</span>
                  </motion.div>
                )}

                {visibleFeatures.includes(2) && (
                  <motion.div
                    key="feature-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center px-3 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/20 backdrop-blur-sm"
                  >
                    <Palette className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">{t('voiceDesignTag')}</span>
                  </motion.div>
                )}

                {visibleFeatures.includes(3) && (
                  <motion.div
                    key="feature-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center px-3 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/20 backdrop-blur-sm"
                  >
                    <Languages className="h-4 w-4 mr-2 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">{t('languagesSupported')}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* 子标题 */}
            <motion.p
              className="text-md sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto text-center mb-3 md:mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500/90 via-purple-500/90 to-pink-500/90">
          {t('landingSubtitle')}
              </span>
        </motion.p>
            
            {/* 按钮区域 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href="/app/" className="w-full block">
            <Button 
              size="lg" 
                    className="w-full sm:w-auto h-10 md:h-12 text-sm md:text-base gap-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 group"
            >
              <Rocket className="h-4 w-4 md:h-5 md:w-5 animate-pulse" />
                    <span>{t('startNow')}</span>
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href="/cloning/" className="w-full block">
            <Button 
              size="lg" 
                    className="w-full sm:w-auto h-10 md:h-12 text-sm md:text-base gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 group"
            >
              <Mic2 className="h-4 w-4 md:h-5 md:w-5 animate-pulse" />
                    <span>{t('voiceCloning')}</span>
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
              </motion.div>
            </div>
            
            {/* 波浪动画 */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-10 md:h-16 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <motion.div 
                className="w-[200%] h-full bg-[url('/images/wave.svg')] bg-repeat-x bg-contain bg-bottom"
                animate={{ x: [0, '-50%'] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
        </motion.div>
          </div>
        </div>
      </div>

      {/* 功能展示部分 */}
      <div className="py-12 md:py-20 bg-gradient-to-b from-background via-purple-500/5 to-background">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-12 md:mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {t('coreFeatures')}
          </motion.h2>

          {/* 功能0：AI播客生成 */}
          <motion.div
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full md:w-1/2">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-1">
                <div className="aspect-video relative rounded-lg overflow-hidden shadow-xl">
                  <img
                    src="/images/gongneng6.png"
                    alt="AI播客生成演示"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x400/3b82f6/ffffff?text=AI播客生成";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <Radio className="h-4 w-4" />
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('aiGeneration')}</span>
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('interview')}</span>
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('audioConversion')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                  {t('podcastFeatureTitle')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  {t('podcastFeatureDesc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span>{t('aiInterviewGenerationItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span>{t('hostGuestDialogueItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span>{t('professionalPodcastItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span>{t('voiceSynthesisIntegrationItem')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/podcast" className="inline-flex">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
                      {t('tryPodcastFeature')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 功能1：AI故事生成 */}
          <motion.div
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="bg-gradient-to-r from-orange-500/5 to-pink-500/5 rounded-lg p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500">
                  {t('storyFeatureTitle')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  {t('storyFeatureDesc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <span>{t('aiStoryGenerationItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <span>{t('multiCharacterVoicesItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <span>{t('storyToAudioItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <span>{t('customStoryInputItem')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/story" className="inline-flex">
                    <Button className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600">
                      {t('tryStoryFeature')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 p-1">
                <div className="aspect-video relative rounded-lg overflow-hidden shadow-xl">
                  <img
                    src="/images/gongneng4.png"
                    alt="AI故事生成演示"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x400/f97316/ffffff?text=AI故事生成";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('aiGeneration')}</span>
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('multiCharacter')}</span>
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('audioConversion')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>


          {/* 功能2：音色设计 */}
          <motion.div
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full md:w-1/2">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 p-1">
                <div className="aspect-video relative rounded-lg overflow-hidden shadow-xl">
                  <img
                    src="/images/gongneng5.png"
                    alt="音色设计演示"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x400/a855f7/ffffff?text=音色设计";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                        <Palette className="h-4 w-4" />
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('aiDesignTag')}</span>
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('personalizationTag')}</span>
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">{t('realtimePreviewTag')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                  {t('voiceDesignFeatureTitle')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  {t('voiceDesignFeatureDesc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-purple-500 mr-2 mt-0.5" />
                    <span>{t('voiceDesignItem1')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-purple-500 mr-2 mt-0.5" />
                    <span>{t('voiceDesignItem2')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-purple-500 mr-2 mt-0.5" />
                    <span>{t('voiceDesignItem3')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-purple-500 mr-2 mt-0.5" />
                    <span>{t('voiceDesignItem4')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/design" className="inline-flex">
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                      {t('tryVoiceDesign')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 功能3：声音克隆 */}
          <motion.div
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-lg p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
                  {t('feature4Title')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  {t('feature4Desc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>{t('shortSampleItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>{t('preserveEmotionItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>{t('crossLanguageItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>{t('permanentCloneItem')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/cloning" className="inline-flex">
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600">
                      {t('cloneMyVoice')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-green-500/10 via-teal-500/10 to-emerald-500/10 p-1">
                <div className="aspect-video relative rounded-lg overflow-hidden shadow-xl">
                  <img
                    src="/images/gongneng2.png"
                    alt="声音克隆演示"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x400/10b981/ffffff?text=声音克隆";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <Mic2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                      </div>
                      <span className="text-white text-xs">00:35</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </motion.div>

          {/* 功能4：多语言支持 */}
          <motion.div
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full md:w-1/2">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-1">
                <div className="aspect-video relative rounded-lg overflow-hidden shadow-xl">
                  <img
                    src="/images/gongneng1.png"
                    alt="多语言支持演示"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x400/3b82f6/ffffff?text=多语言支持";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6">
                    <div className="flex gap-2 mb-2">
                      {[
                        t('supportedLanguagesChinese'),
                        t('supportedLanguagesEnglish'),
                        t('supportedLanguagesJapanese'),
                        t('supportedLanguagesFrench'),
                        t('supportedLanguagesGerman')
                      ].map((lang, i) => (
                        <span key={i} className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                          {lang}
                        </span>
                      ))}
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                  {t('feature2Title')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  {t('feature2Desc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span>{t('multiLanguageSupportItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span>{t('multiLanguageVoicesItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span>{t('multiLanguageAccentsItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span>{t('naturalSpeechItem')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/app" className="inline-flex">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
                      {t('tryFeatureNow')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 功能5：高级编辑 */}
          <motion.div
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-lg p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                  {t('feature3Title')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  {t('feature3Desc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <span>{t('adjustSpeedPitchItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <span>{t('realtimeVisualizationItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <span>{t('wordByWordItem')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <span>{t('downloadAudioItem')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/app" className="inline-flex">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600">
                      {t('tryAdvancedFeatures')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-orange-500/10 via-red-500/10 to-rose-500/10 p-1">
                <div className="aspect-video relative rounded-lg overflow-hidden shadow-xl">
                  <img
                    src="/images/gongneng3.png"
                    alt="高级功能演示"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x400/f97316/ffffff?text=高级功能";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg p-2">
                        <Settings className="h-4 w-4 text-white mb-1" />
                        <span className="text-white text-xs">{t('speedControlTag')}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg p-2">
                        <Download className="h-4 w-4 text-white mb-1" />
                        <span className="text-white text-xs">{t('downloadAudioTag')}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg p-2">
                        <Volume2 className="h-4 w-4 text-white mb-1" />
                        <span className="text-white text-xs">{t('visualizationTag')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 会员方案 */}
      <div className="py-10 md:py-16 bg-gradient-to-b from-background via-rose-500/5 to-background">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {t('pricingTitle')}
          </motion.h2>
          <p className="text-xl text-center text-muted-foreground mb-8">{t('pricingSubtitle')}</p>

          {/* 会员方案 */}
              <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <Card className={`p-6 relative ${plan.type === 'yearly' ? 'border-primary shadow-lg' : ''} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
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
                      className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300" 
                      variant={plan.type === 'yearly' ? "default" : "outline"}
                      onClick={() => handlePlanClick(plan.type)}
                    >
                      {getButtonText(plan.type)}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* 克隆次数购买部分 */}
          <div className="mt-16">
            <motion.h2
              className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {t('clonePackagesTitle')}
            </motion.h2>
            <p className="text-lg text-center text-muted-foreground mb-8">
              {t('clonePackagesSubtitle')}
            </p>

              <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid gap-8 md:grid-cols-3"
            >
              {getClonePackages().map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                  <Card className={`p-6 relative ${pkg.id === 'clone50' ? 'border-primary shadow-lg' : ''} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
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
                        className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300" 
                        onClick={() => handlePlanClick(pkg.id)}
                      >
                        {t('buyNow')}
                      </Button>
                  </div>
                </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* 按量付费方案 */}
          <div className="mt-16">
            <motion.h2
              className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {t('payAsYouGo')}
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {payAsYouGo.map((plan, index) => (
                <motion.div
                  key={plan.type}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <Card className={`p-6 relative ${plan.popular ? 'border-primary shadow-lg' : ''} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
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
                        className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300" 
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handlePlanClick(plan.type)}
                      >
                        {t('buyNow')}
                      </Button>
                    </div>
                  </Card>
              </motion.div>
            ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
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

      {/* 增加底部间距 */}
      <div className="h-16 md:h-24"></div>
      
      {/* CTA Section */}
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
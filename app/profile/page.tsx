'use client';

import { NavBar } from "@/components/nav-bar";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { useLanguage } from "@/lib/i18n/language-context";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, CreditCard, User, Mail, Calendar, Activity, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import confetti from 'canvas-confetti';
import { Button } from "@/components/ui/button";

interface UserPlan {
  subscription?: {
    planType: string;
    endDate: string;
    status: string;
  };
  characterQuota?: {
    permanentQuota: number;
    temporaryQuota: number;
    usedCharacters: number;
    lastUpdated: string;
    quotaExpiry?: string;
  };
  cloneQuota?: {
    remaining_clones: number;
    total_clones: number;
    used_clones: number;
  };
}

interface CloneQuota {
  remaining_clones: number;
  total_clones: number;
  used_clones: number;
}

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const success = searchParams.get('success');
  const type = searchParams.get('type');

  const triggerConfetti = () => {
    const end = Date.now() + 1000;
    const colors = ['#4F46E5', '#7C3AED', '#EC4899'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const fetchUserPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/user/plan');
      if (!response.ok) {
        throw new Error(t('fetchUserDataError'));
      }
      const data = await response.json();
      setUserPlan(data);
      
      // 检查是否是支付成功
      if (success === 'true') {
        setShowConfetti(true);
        triggerConfetti();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchUserDataError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    // 只在首次加载和支付成功时获取数据
    if (!userPlan) {
      fetchUserPlan();
    }
  }, [session, router, sessionStatus]);

  useEffect(() => {
    if (success === 'true' && type) {
      // 获取购买类型
      let toastMessage = {
        title: t('paymentSuccess'),
        description: t('refreshingData')
      };

      // 根据购买类型显示不同的提示信息
      if (type === 'subscription') {
        toastMessage = {
          title: t('subscriptionSuccess'),
          description: t('subscriptionUpdated')
        };
      } else if (type === 'quota') {
        toastMessage = {
          title: t('purchaseSuccess'),
          description: t('quotaUpdated')
        };
      } else if (type === 'clone') {
        toastMessage = {
          title: t('clonePackagePurchaseSuccess'),
          description: t('updatingCloneCount')
        };
      }

      toast({
        title: toastMessage.title,
        description: toastMessage.description,
        variant: "default",
        duration: 5000,
      });
      
      // 支付成功时立即刷新数据
      fetchUserPlan();
      
      // 1秒后再次刷新数据，以确保 webhook 处理完成
      setTimeout(() => {
        fetchUserPlan();
      }, 1000);
      
      // 清除 URL 中的查询参数
      router.replace('/profile');
    }
  }, [success, type]);

  // 清理撒花效果
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (sessionStatus === 'loading' || loading) {
    return (
      <div>
        <NavBar />
        <div className="container py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[200px] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'trial': return t('trialPlan');
      case 'yearly': return t('yearlyPlan');
      case 'monthly': return t('monthlyPlan');
      default: return t('noPlan');
    }
  };

  const getQuotaPercentage = () => {
    if (!userPlan?.characterQuota) return 0;
    const { permanentQuota, temporaryQuota, usedCharacters } = userPlan.characterQuota;
    const totalQuota = permanentQuota + temporaryQuota;
    return totalQuota > 0 ? (usedCharacters / totalQuota) * 100 : 0;
  };

  const getClonePercentage = () => {
    if (!userPlan?.cloneQuota) return 0;
    const { used_clones, total_clones } = userPlan.cloneQuota;
    return total_clones > 0 ? (used_clones / total_clones) * 100 : 0;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/90 to-background/80">
      <NavBar />
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x relative">
            {t('profile')}
            <AnimatePresence>
              {showConfetti && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -right-8 top-0"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce" />
                </motion.div>
              )}
            </AnimatePresence>
          </h1>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6"
        >
          <motion.div variants={item} className="md:col-span-2">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500 group-hover:animate-bounce" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                    {t('basicInfo')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between group/item hover:bg-primary/5 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-400 group-hover/item:text-blue-500 transition-colors" />
                    <span className="text-muted-foreground group-hover/item:text-primary transition-colors">{t('username')}</span>
                  </div>
                  <span className="font-medium">{user.name || t('notSet')}</span>
                </div>
                <div className="flex items-center justify-between group/item hover:bg-primary/5 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-400 group-hover/item:text-purple-500 transition-colors" />
                    <span className="text-muted-foreground group-hover/item:text-primary transition-colors">{t('email')}</span>
                  </div>
                  <span className="font-medium">{user.email || t('notSet')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={item}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-500 group-hover:animate-bounce" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                      {t('subscription')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userPlan?.subscription ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {getPlanName(userPlan.subscription.planType)}
                          </span>
                          <Badge 
                            variant={userPlan.subscription.status === 'active' ? "default" : "destructive"}
                            className={userPlan.subscription.status === 'active' ? "animate-gradient-x bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white" : ""}
                          >
                            {userPlan.subscription.status === 'active' ? t('active') : t('inactive')}
                          </Badge>
                        </div>
                        <div className="relative h-2">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20"></div>
                          <Progress value={userPlan.subscription.status === 'active' ? 100 : 0} className="relative z-10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('currentPlan')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                            {getPlanName(userPlan.subscription.planType)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('planStatus')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                            {userPlan.subscription.status === 'active' ? t('active') : t('inactive')}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-red-500/10 hover:from-pink-500/20 hover:to-red-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('expiryDate')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                            {formatDate(userPlan.subscription.endDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t group/item hover:bg-primary/5 p-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-400 group-hover/item:text-red-500 transition-colors" />
                          <span className="text-muted-foreground group-hover/item:text-primary transition-colors">{t('expiryDate')}</span>
                        </div>
                        <span>{formatDate(userPlan.subscription.endDate)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('notSubscribed')}</span>
                          <Badge variant="destructive">{t('notActivated')}</Badge>
                        </div>
                        <div className="relative h-2">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20"></div>
                          <Progress value={0} className="relative z-10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('currentPlan')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                            {t('notSubscribed')}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('planStatus')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                            {t('notActivated')}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-red-500/10 hover:from-pink-500/20 hover:to-red-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('expiryDate')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                            -
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t group/item hover:bg-primary/5 p-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-400 group-hover/item:text-red-500 transition-colors" />
                          <span className="text-muted-foreground group-hover/item:text-primary transition-colors">{t('expiryDate')}</span>
                        </div>
                        <span>-</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-pink-500 group-hover:animate-bounce" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                      {t('cloneQuota')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userPlan?.cloneQuota ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatNumber(userPlan.cloneQuota.used_clones)} / {formatNumber(userPlan.cloneQuota.total_clones)} {t('times')}
                          </span>
                          <span className="font-medium">{Math.round(getClonePercentage())}%</span>
                        </div>
                        <div className="relative h-2">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20"></div>
                          <Progress value={getClonePercentage()} className="relative z-10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('totalClones')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                            {formatNumber(userPlan.cloneQuota.total_clones)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('usedClones')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                            {formatNumber(userPlan.cloneQuota.used_clones)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-red-500/10 hover:from-pink-500/20 hover:to-red-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('remainingClones')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                            {formatNumber(userPlan.cloneQuota.remaining_clones)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t group/item hover:bg-primary/5 p-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-400 group-hover/item:text-red-500 transition-colors" />
                          <span className="text-muted-foreground group-hover/item:text-primary transition-colors">{t('lastUpdated')}</span>
                        </div>
                        <span>{formatDate(userPlan.characterQuota?.lastUpdated || new Date().toISOString())}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">0 / 0 {t('times')}</span>
                          <span className="font-medium">0%</span>
                        </div>
                        <div className="relative h-2">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20"></div>
                          <Progress value={0} className="relative z-10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('totalClones')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                            0
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('usedClones')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                            0
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-red-500/10 hover:from-pink-500/20 hover:to-red-500/20 transition-colors">
                          <span className="text-muted-foreground text-sm">{t('remainingClones')}</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                            0
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t group/item hover:bg-primary/5 p-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-400 group-hover/item:text-red-500 transition-colors" />
                          <span className="text-muted-foreground group-hover/item:text-primary transition-colors">{t('lastUpdated')}</span>
                        </div>
                        <span>{formatDate(new Date().toISOString())}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={item} className="md:col-span-2">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-pink-500 group-hover:animate-bounce" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                    {t('characterQuota')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {userPlan?.characterQuota ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatNumber(userPlan.characterQuota.usedCharacters)} / {formatNumber(userPlan.characterQuota.permanentQuota + userPlan.characterQuota.temporaryQuota)} {t('characters')}
                        </span>
                        <span className="font-medium">{Math.round(getQuotaPercentage())}%</span>
                      </div>
                      <div className="relative h-2">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20"></div>
                        <Progress value={getQuotaPercentage()} className="relative z-10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors">
                        <span className="text-muted-foreground text-sm">{t('totalQuota')}</span>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                          {formatNumber(userPlan.characterQuota.permanentQuota + userPlan.characterQuota.temporaryQuota)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors">
                        <span className="text-muted-foreground text-sm">{t('usedQuota')}</span>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                          {formatNumber(userPlan.characterQuota.usedCharacters)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-red-500/10 hover:from-pink-500/20 hover:to-red-500/20 transition-colors">
                        <span className="text-muted-foreground text-sm">{t('remainingQuota')}</span>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                          {formatNumber(userPlan.characterQuota.permanentQuota + userPlan.characterQuota.temporaryQuota - userPlan.characterQuota.usedCharacters)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 transition-colors">
                        <span className="text-muted-foreground text-sm">{t('permanentQuota')}</span>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                          {formatNumber(userPlan.characterQuota.permanentQuota)}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">{t('permanentValid')}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 transition-colors">
                        <span className="text-muted-foreground text-sm">{t('temporaryQuota')}</span>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">
                          {formatNumber(userPlan.characterQuota.temporaryQuota)}
                        </span>
                        {userPlan.characterQuota.quotaExpiry && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {t('quotaExpiryTime', { date: formatDate(userPlan.characterQuota.quotaExpiry) })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t group/item hover:bg-primary/5 p-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-400 group-hover/item:text-red-500 transition-colors" />
                        <span className="text-muted-foreground group-hover/item:text-primary transition-colors">{t('lastUpdated')}</span>
                      </div>
                      <span>{formatDate(userPlan.characterQuota.lastUpdated)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-4">{t('noQuota')}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={item}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end mt-8"
        >
          <SignOutButton />
        </motion.div>
      </div>
    </div>
  );
} 
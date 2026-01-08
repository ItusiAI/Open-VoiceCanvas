'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/i18n/language-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  useEffect(() => {
    // 从URL获取令牌
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      console.log('Token from URL:', tokenParam);
      setToken(tokenParam);
    } else {
      console.error('No token found in URL parameters');
      setIsTokenInvalid(true);
      toast({
        title: t('error'),
        description: t('missingResetToken') || 'Missing reset token',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, t]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: t('error'),
        description: t('passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: t('error'),
        description: t('passwordTooShort') || 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    console.log('Submitting reset password request with token:', token);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      console.log('Reset password response:', data);
      
      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: t('success') || 'Success',
          description: data.message,
        });
        
        // 3秒后重定向到首页
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        toast({
          title: t('error'),
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: t('error'),
        description: t('somethingWentWrong') || 'Something went wrong. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 成功重置密码后的逻辑
  useEffect(() => {
    if (isSuccess) {
      setRedirecting(true);
      // 重定向到主页
      setTimeout(() => {
        router.push("/");
      }, 3000);
    }
  }, [isSuccess, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isSuccess 
              ? (t('passwordResetSuccess') || 'Password Reset Successfully') 
              : (t('resetPassword') || 'Reset Password')}
          </CardTitle>
          <CardDescription>
            {isSuccess 
              ? (t('passwordResetSuccessDesc') || 'Your password has been reset successfully. Redirecting to homepage...') 
              : isTokenInvalid
                ? (t('invalidResetToken') || 'Invalid or missing reset token. Please request a new password reset link.')
                : (t('createNewPassword') || 'Create a new password for your account')}
            {redirecting && (
              <p className="text-sm text-muted-foreground">
                {t("redirectingToLogin")}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isSuccess ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="mb-4">{t('redirectingToLogin') || 'Redirecting to homepage...'}</p>
            </div>
          ) : isTokenInvalid ? (
            <div className="text-center py-4">
              <p className="mb-4">{t('requestNewResetLink') || 'Please request a new password reset link.'}</p>
              <Button 
                asChild 
                className="mt-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                <Link href="/forgot-password">
                  {t('forgotPassword') || 'Forgot Password'}
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('newPassword') || 'New Password'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('resetPassword') || 'Reset Password'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            asChild 
            variant="outline"
            className="border-primary/20 hover:bg-primary/5"
          >
            <Link href="/" className="flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('goToHomepage') || 'Go to Homepage'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
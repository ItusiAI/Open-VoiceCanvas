'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'clone' | 'character';
}

export function InsufficientCreditsDialog({ 
  open, 
  onOpenChange, 
  type 
}: InsufficientCreditsDialogProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const handlePurchase = () => {
    onOpenChange(false);
    // 跳转到购买页面，并滚动到对应的套餐区域
    // 目前字符套餐和克隆套餐都使用同一个区域
    router.push('/pricing#clone-packages');
  };

  const getTitle = () => {
    return type === 'clone' 
      ? t('insufficientCloneCreditsTitle')
      : t('insufficientCharacterCreditsTitle');
  };

  const getDescription = () => {
    return type === 'clone'
      ? t('insufficientCloneCreditsDesc')
      : t('insufficientCharacterCreditsDesc');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold">
            {getTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-2">
          <AlertDialogCancel className="mt-0">
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePurchase}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t('buyCredits')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

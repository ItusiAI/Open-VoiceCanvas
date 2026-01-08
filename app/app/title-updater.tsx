'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/language-context';

export function AppTitleUpdater() {
  const { t, language } = useLanguage();

  useEffect(() => {
    // 根据当前语言更新App页面标题
    document.title = t('appPageTitle');
  }, [language, t]);

  return null; // 这是一个无渲染组件，只处理页面标题更新
} 
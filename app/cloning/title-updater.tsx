'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/language-context';

export function VoiceTitleUpdater() {
  const { t, language } = useLanguage();

  useEffect(() => {
    // 根据当前语言更新声音克隆页面标题
    document.title = t('voicePageTitle');
  }, [language, t]);

  return null; // 这是一个无渲染组件，只处理页面标题更新
} 
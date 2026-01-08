"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Language, TranslationKey, TranslationType } from './translations/types'
import { en } from './translations/en'
import { zh } from './translations/zh'
import { ja } from './translations/ja'
import { ko } from './translations/ko'
import { yue } from './translations/yue'
import { es } from './translations/es'
import { fr } from './translations/fr'
import { de } from './translations/de'
import { it } from './translations/it'
import { pt } from './translations/pt'
import { ru } from './translations/ru'
import { nl } from './translations/nl'
import { sv } from './translations/sv'
import { no } from './translations/no'
import { da } from './translations/da'
import { fi } from './translations/fi'
import { el } from './translations/el'
import { pl } from './translations/pl'
import { ro } from './translations/ro'
import { hu } from './translations/hu'
import { tr } from './translations/tr'
import { cy } from './translations/cy'
import { ar } from './translations/ar'
import { he } from './translations/he'
import { hi } from './translations/hi'
import { id } from './translations/id'
import { cs } from './translations/cs'
import { vi } from './translations/vi'
import { uk } from './translations/uk'

const translations = {
  en, zh, ja, ko, yue, es, fr, de, it, pt, ru, nl, sv, no, da,
  fi, el, pl, ro, hu, tr, cy, ar, he, hi, id, cs, vi, uk,
} as const;

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // 初始化时从本地存储读取语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage) {
      setLanguage(savedLanguage as Language);
    }
  }, []);

  // 当语言改变时，保存到本地存储
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    // 确保语言存在于translations中，如果不存在则使用英语作为回退
    const currentTranslations = translations[language as keyof typeof translations] || translations.en;
    const translation = currentTranslations[key as keyof typeof currentTranslations];
    
    // 如果翻译不存在，返回键值本身
    if (translation === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    if (typeof translation === 'function') {
      // 确保translation是一个可调用的函数类型，并传递参数
      return (translation as (params: Record<string, string | number>) => string)(params || {});
    }
    
    if (params && typeof translation === 'string') {
      return Object.entries(params).reduce(
        (str, [key, value]) => str.replace(`{${key}}`, String(value)),
        translation
      );
    }
    
    return translation as string;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
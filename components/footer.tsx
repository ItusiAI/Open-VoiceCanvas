'use client';

import { useLanguage } from "@/lib/i18n/language-context";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Github, Twitter, Globe } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：Logo、标题、宣传语、社交链接 */}
          <div className="flex flex-col gap-4">
            {/* Logo和标题 */}
            <motion.div 
              className="flex items-center gap-2 group relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Image
                  src="/images/logo.png"
                  alt="VoiceCanvas Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 transition-transform duration-300 group-hover:scale-110"
                />
              </motion.div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                VoiceCanvas
              </span>
            </motion.div>
            
            {/* 宣传语 */}
            <p className="text-muted-foreground text-sm max-w-md">
              {t('footerTagline')}
            </p>
            
            {/* 社交链接 */}
            <div className="flex items-center gap-3">
              <motion.a
                href="https://github.com/ItusiAI" 
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <Github className="w-4 h-4 text-muted-foreground" />
              </motion.a>
              <motion.a
                href="https://twitter.com/zyailive" 
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <Twitter className="w-4 h-4 text-muted-foreground" />
              </motion.a>
              <motion.a
                href="https://voicecanvas.org" 
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <Globe className="w-4 h-4 text-muted-foreground" />
              </motion.a>
            </div>
          </div>
          
          {/* 右侧：三个导航栏 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            {/* 功能导航 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">{t('footerFeatures')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/podcast" className="hover:text-primary transition-colors">
                    {t('aiPodcast')}
                  </Link>
                </li>
                <li>
                  <Link href="/app" className="hover:text-primary transition-colors">
                    {t('textToSpeech')}
                  </Link>
                </li>
                <li>
                  <Link href="/cloning" className="hover:text-primary transition-colors">
                    {t('voiceClone')}
                  </Link>
                </li>
                <li>
                  <Link href="/story" className="hover:text-primary transition-colors">
                    {t('storyVoiceover')}
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* 支持导航 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">{t('footerSupport')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    {t('termsOfService')}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    {t('privacyPolicy')}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-primary transition-colors">
                    {t('cookiePolicy')}
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* 友情链接 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">{t('footerLinks')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://itusi.cn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    ITUSI
                  </a>
                </li>
                <li>
                  <a href="https://aiartools.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Aiartools
                  </a>
                </li>
                <li>
                  <a href="https://pdf2md.site/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    PDF2MD
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 底部版权信息 */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>{t('copyright').replace('{year}', new Date().getFullYear().toString())}</p>
        </div>
      </div>
    </footer>
  );
} 
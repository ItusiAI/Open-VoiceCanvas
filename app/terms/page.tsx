'use client';

import React from 'react';
import { NavBar } from '@/components/nav-bar';
import { useLanguage } from '@/lib/i18n/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function TermsOfService() {
  const { t } = useLanguage();

  // 返回顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-lg">
          <CardHeader className="border-b border-primary/10 pb-4 md:pb-6">
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent text-center">
              {t('termsOfService')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 prose dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              Welcome to VoiceCanvas services. By accessing or using our website, applications, APIs, or any related services (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.
            </p>

            <h2>2. Service Description</h2>
            <p>
              VoiceCanvas provides text-to-speech and voice cloning services that allow users to convert text into speech output and create personalized voice models based on user-uploaded voice samples.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              3.1 You may need to create an account to use certain features of the Services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.<br />
              3.2 You must provide accurate, complete, and up-to-date account information.<br />
              3.3 You must notify us immediately of any unauthorized use of your account.
            </p>

            <h2>4. Use of Services</h2>
            <p>
              4.1 You agree not to use the Services in any manner that violates any applicable laws, regulations, or this Agreement.<br />
              4.2 You may not use the Services to transmit any illegal, harmful, threatening, abusive, harassing, defamatory, obscene, or otherwise objectionable content.<br />
              4.3 You may not attempt to interfere with or disrupt the functionality or security of the Services.
            </p>

            <h2>5. Voice Cloning and Content Use</h2>
            <p>
              5.1 You must own the legal rights to audio materials you upload for voice cloning.<br />
              5.2 You may not upload audio containing third-party voices, copyrighted content, or unauthorized materials unless you have obtained legal rights to do so.<br />
              5.3 You may not use voice cloning features to impersonate, mimic others, or create misleading content.<br />
              5.4 You may not use cloned voices for fraudulent, deceptive, or any other unlawful activities.
            </p>

            <h2>6. Content Ownership and License</h2>
            <p>
              6.1 You retain all rights to content you create (including uploaded audio and generated speech), but grant us a non-exclusive, worldwide, royalty-free license to enable us to provide and improve the Services.<br />
              6.2 We retain all right, title, and interest in the Services themselves, including the software, technology, algorithms, and related intellectual property.
            </p>

            <h2>7. Privacy</h2>
            <p>
              We collect and use your information according to our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which forms a part of this Agreement.
            </p>

            <h2>8. Subscriptions and Payment</h2>
            <p>
              8.1 Certain Service features may require paid subscriptions or one-time purchases.<br />
              8.2 Subscriptions automatically renew unless you cancel prior to the renewal date.<br />
              8.3 We reserve the right to change prices at any time, but will notify you of any changes.<br />
              8.4 All payments are final unless refunds are required by law.
            </p>

            <h2>9. Termination</h2>
            <p>
              9.1 You may terminate this Agreement at any time by ceasing to use the Services or by closing your account.<br />
              9.2 We reserve the right to suspend or terminate your access to the Services for any reason, including violation of this Agreement.
            </p>

            <h2>10. Disclaimer and Limitation of Liability</h2>
            <p>
              10.1 The Services are provided "as is" and "as available" without warranties of any kind, either express or implied.<br />
              10.2 We do not guarantee that the Services will be uninterrupted, timely, secure, or error-free.<br />
              10.3 To the maximum extent permitted by applicable law, we shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages.
            </p>

            <h2>11. Modifications</h2>
            <p>
              We reserve the right to modify this Agreement at any time. We will notify you of changes by posting the updated version on the website. Your continued use of the Services after such changes constitutes acceptance of the modified terms.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Agreement, please contact us at the following email address: wt@wmcircle.cn
            </p>

            <p className="mt-8 text-sm text-muted-foreground">
              Last Updated: December 1, 2024
            </p>
          </CardContent>
        </Card>
      </div>
      
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
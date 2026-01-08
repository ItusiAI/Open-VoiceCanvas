'use client';

import React from 'react';
import { NavBar } from '@/components/nav-bar';
import { useLanguage } from '@/lib/i18n/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function PrivacyPolicy() {
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
              {t('privacyPolicy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 prose dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              VoiceCanvas ("we," "our," or "the Company") respects your privacy. This Privacy Policy explains how we collect, use, disclose, process, and protect information that you provide to us through our website, applications, and related services (collectively, the "Services").
            </p>

            <h2>2. Information We Collect</h2>
            <p>
              We may collect the following types of information:
            </p>
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li>Account information: Email address, username, and password when you create an account.</li>
              <li>Profile information: Any additional profile information you choose to provide.</li>
              <li>Payment information: Payment details when you purchase subscriptions or products.</li>
              <li>User content: Content you upload, create, or generate, including text inputs and audio files.</li>
              <li>Communications: Content of your communications with our customer support team.</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <ul>
              <li>Usage data: Information about how you use our Services, such as feature usage, content generation, and interaction patterns.</li>
              <li>Device information: IP address, browser type, operating system, device identifiers, and other technical information.</li>
              <li>Cookies and similar technologies: Information collected through cookies and similar technologies, such as your browsing activity and preferences.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>
              We may use your information for the following purposes:
            </p>
            <ul>
              <li>To provide and maintain our Services, including voice synthesis and voice cloning features.</li>
              <li>To process your payment transactions.</li>
              <li>To personalize your experience and improve our Services.</li>
              <li>To communicate with you, including sending service notifications, updates, and marketing information.</li>
              <li>To analyze usage patterns and trends to improve our Services.</li>
              <li>To detect, prevent, and address technical issues or security concerns.</li>
              <li>To comply with legal obligations.</li>
            </ul>

            <h2>4. Audio Data and Voice Cloning</h2>
            <p>
              Specifically regarding our voice cloning features:
            </p>
            <ul>
              <li>We use audio samples you upload to create a digital model of your voice.</li>
              <li>This model is associated only with your account and is not shared with other users unless you explicitly authorize it.</li>
              <li>Your original audio files and generated voice models are used only for providing the Services and not for other purposes unless you explicitly consent.</li>
              <li>You can request deletion of your voice model and uploaded audio data at any time.</li>
            </ul>

            <h2>5. Information Sharing and Disclosure</h2>
            <p>
              We may share your information in the following circumstances:
            </p>
            <ul>
              <li>With service providers: Third parties that provide services to us, such as payment processors, hosting providers, and customer support services.</li>
              <li>Business transfers: If we are involved in a merger, acquisition, bankruptcy, reorganization, or sale of assets, your information may be transferred as part of that transaction.</li>
              <li>Legal requirements: When we believe disclosure is necessary to (a) comply with applicable laws, regulations, or legal processes, or (b) protect our rights, property, or safety, or the rights, property, or safety of other users.</li>
              <li>With your consent: In other cases where you have consented.</li>
            </ul>

            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information against accidental loss, unauthorized access, use, alteration, and disclosure. However, no method of Internet transmission or electronic storage is 100% secure.
            </p>

            <h2>7. Data Retention</h2>
            <p>
              We retain your personal information no longer than necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>

            <h2>8. Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have some or all of the following rights:
            </p>
            <ul>
              <li>Right of access: Request a copy of the personal information we hold about you.</li>
              <li>Right to rectification: Request correction of inaccurate or incomplete personal information we hold about you.</li>
              <li>Right to erasure: Request deletion of your personal information in certain circumstances.</li>
              <li>Right to restrict processing: Request restriction of processing of your personal information in certain circumstances.</li>
              <li>Right to data portability: Receive your personal information that we hold in a structured, commonly used, and machine-readable format, where feasible.</li>
              <li>Right to object: Object to our processing of your personal information.</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the contact information provided below.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Our Services are not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we might have any information from a child under 13, please contact us immediately.
            </p>

            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and stored or processed in countries other than the country you are located in, where data protection laws may be different from those in your country. In such cases, we will ensure that appropriate safeguards are in place to protect your personal information.
            </p>

            <h2>11. Privacy Policy Updates</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by posting the updated policy on our website or through other communication channels. We encourage you to review this Privacy Policy periodically for any changes.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact us at:<br />
              Email: wt@wmcircle.cn
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
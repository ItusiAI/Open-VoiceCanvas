'use client';

import React from 'react';
import { NavBar } from '@/components/nav-bar';
import { useLanguage } from '@/lib/i18n/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function CookiePolicy() {
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
              Cookie Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 prose dark:prose-invert max-w-none">
            <h2>1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners about how users interact with their sites.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>
              VoiceCanvas uses cookies to enhance your experience on our platform. We use cookies for the following purposes:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.</li>
              <li><strong>Authentication Cookies:</strong> These cookies help us remember your login status and keep you signed in across sessions.</li>
              <li><strong>Preference Cookies:</strong> These cookies remember your settings and preferences, such as language selection and theme preferences.</li>
              <li><strong>Analytics Cookies:</strong> These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
            </ul>

            <h2>3. Types of Cookies We Use</h2>
            
            <h3>3.1 Strictly Necessary Cookies</h3>
            <p>
              These cookies are essential for you to browse the website and use its features. Without these cookies, services you have asked for cannot be provided. These cookies include:
            </p>
            <ul>
              <li>Session management cookies</li>
              <li>Security cookies</li>
              <li>Load balancing cookies</li>
            </ul>

            <h3>3.2 Functional Cookies</h3>
            <p>
              These cookies allow the website to remember choices you make and provide enhanced, more personal features. These cookies include:
            </p>
            <ul>
              <li>Language preference cookies</li>
              <li>Theme selection cookies</li>
              <li>User interface customization cookies</li>
            </ul>

            <h3>3.3 Analytics Cookies</h3>
            <p>
              These cookies collect information about how you use our website. The information is collected in an anonymous form and includes the number of visitors, where visitors come from, and the pages they visited. These cookies help us:
            </p>
            <ul>
              <li>Understand how visitors interact with our website</li>
              <li>Improve website performance and user experience</li>
              <li>Analyze usage patterns and trends</li>
            </ul>

            <h2>4. Third-Party Cookies</h2>
            <p>
              We may use third-party services that set cookies on your device. These include:
            </p>
            <ul>
              <li><strong>Authentication Services:</strong> Google OAuth, GitHub OAuth for secure login</li>
              <li><strong>Payment Processing:</strong> Stripe for secure payment processing</li>
              <li><strong>Analytics Services:</strong> To help us understand website usage and improve our services</li>
            </ul>
            <p>
              These third-party services have their own privacy policies and cookie policies, which we encourage you to review.
            </p>

            <h2>5. Managing Cookies</h2>
            <p>
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by:
            </p>

            <h3>5.1 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings preferences. You can:
            </p>
            <ul>
              <li>View what cookies are stored on your device</li>
              <li>Delete cookies individually or all at once</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies</li>
              <li>Set your browser to notify you when cookies are being set</li>
            </ul>

            <h3>5.2 Browser-Specific Instructions</h3>
            <p>
              For specific instructions on how to manage cookies in your browser, please visit:
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Internet Explorer</a></li>
              <li><a href="https://support.microsoft.com/en-us/help/4027947/microsoft-edge-delete-cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            </ul>

            <h2>6. Impact of Disabling Cookies</h2>
            <p>
              Please note that if you choose to disable cookies, some features of our website may not function properly. Specifically:
            </p>
            <ul>
              <li>You may not be able to stay logged in</li>
              <li>Your preferences and settings may not be saved</li>
              <li>Some interactive features may not work correctly</li>
              <li>We may not be able to provide personalized experiences</li>
            </ul>

            <h2>7. Cookie Retention</h2>
            <p>
              Different types of cookies are stored for different periods:
            </p>
            <ul>
              <li><strong>Session Cookies:</strong> These are temporary cookies that are deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> These remain on your device for a set period or until you delete them manually</li>
            </ul>
            <p>
              We regularly review and delete cookies that are no longer necessary for providing our services.
            </p>

            <h2>8. Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website and updating the "Last Updated" date below.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
            </p>
            <ul>
              <li>Email: wt@wmcircle.cn</li>
              <li>Website: <a href="https://voicecanvas.org" className="text-primary hover:underline">https://voicecanvas.org</a></li>
            </ul>

            <h2>10. Your Consent</h2>
            <p>
              By continuing to use our website, you consent to our use of cookies as described in this Cookie Policy. If you do not agree to our use of cookies, please adjust your browser settings or discontinue using our website.
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
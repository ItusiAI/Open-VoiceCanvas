import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { getServerSession } from "next-auth";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import { GoogleAnalytics } from "@/components/google-analytics";
import { UmamiAnalytics } from "@/components/umami-analytics";
import { TitleUpdater } from './title-updater';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://voicecanvas.org'),
  title: {
    default: 'VoiceCanvas - Advanced AI-Powered Multilingual Voice Synthesis & Voice Cloning Platform',
    template: '%s | VoiceCanvas'
  },
  description: 'Experience state-of-the-art neural voice synthesis and voice cloning in 40+ languages. Professional-grade text-to-speech platform with advanced AI technology, offering crystal-clear audio quality, natural language processing, and personalized voice cloning capabilities.',
  keywords: [
    // 英文关键词
    'text to speech',
    'TTS',
    'voice synthesis',
    'multilingual',
    'speech generator',
    'voice converter',
    'audio tool',
    'language learning',
    'accessibility',
    'voice generator',
    'speech to text',
    'voice assistant',
    'AI voice',
    'natural voice',
    'text reader',
    'voice over',
    'audio converter',
    'speech synthesis',
    'language translator',
    'voice recording',
    'neural voice synthesis',
    'AI speech platform',
    'voice AI',
    'deep learning voice',
    'machine learning audio',
    
    // 语言相关
    'Chinese voice',
    'English voice',
    'Japanese voice',
    'Korean voice',
    'Spanish voice',
    'French voice',
    'German voice',
    'Italian voice',
    'Russian voice',
    'Arabic voice',
    'Hindi voice',
    'Portuguese voice',
    'Turkish voice',
    'Vietnamese voice',
    'Thai voice',
    'Indonesian voice',
    'Dutch voice',
    'Polish voice',
    'Swedish voice',
    'Danish voice',
    'Norwegian voice',
    'Finnish voice',
    'Greek voice',
    'Hebrew voice',
    'Romanian voice',
    'Hungarian voice',
    
    // 中文关键词
    '文字转语音',
    '语音合成',
    '在线配音',
    '文本朗读',
    '语音生成',
    '多语言转换',
    '智能语音',
    '语音助手',
    '朗读工具',
    '语音转换',
    '人工智能语音',
    '神经网络语音',
    '深度学习语音',
    '智能配音',
    
    // 日文关键词
    'テキスト読み上げ',
    '音声合成',
    '音声変換',
    '多言語対応',
    '音声ツール',
    'AI音声',
    'ニューラル音声合成',
    '機械学習音声',
    '音声アシスタント',
    
    // 韩文关键词
    '텍스트 음성 변환',
    '음성 합성',
    '음성 생성',
    '다국어 지원',
    '인공지능 음성',
    '뉴럴 음성합성',
    '머신러닝 음성',
    '음성 도우미',
    
    // 西班牙语关键词
    'texto a voz',
    'síntesis de voz',
    'conversión de texto a voz',
    'voz artificial',
    'asistente de voz',
    
    // 法语关键词
    'texte en parole',
    'synthèse vocale',
    'conversion texte-parole',
    'voix artificielle',
    'assistant vocal',
    
    // 德语关键词
    'text zu sprache',
    'sprachsynthese',
    'künstliche stimme',
    'sprachassistent',
    'sprachausgabe',
    
    // 意大利语关键词
    'testo in voce',
    'sintesi vocale',
    'voce artificiale',
    'assistente vocale',
    
    // 俄语关键词
    'текст в речь',
    'синтез речи',
    'голосовой помощник',
    'искусственный голос',
    
    // 阿拉伯语关键词
    'تحويل النص إلى كلام',
    'توليف الصوت',
    'المساعد الصوتي',
    'الذكاء الاصطناعي للصوت',
    
    // 印地语关键词
    'पाठ से वाणी',
    'आवाज़ संश्लेषण',
    'आवाज़ सहायक',
    'कृत्रिम आवाज़',
    
    // 葡萄牙语关键词
    'texto para voz',
    'síntese de voz',
    'voz artificial',
    'assistente de voz',
    
    // 功能相关
    'real-time preview',
    'voice customization',
    'speed control',
    'pitch adjustment',
    'male voice',
    'female voice',
    'word by word',
    'audio download',
    'file upload',
    'instant conversion',
    'neural processing',
    'AI enhancement',
    'voice cloning',
    'emotion synthesis',
    'accent control',
    
    // 声音克隆相关关键词
    'voice cloning',
    'voice replication',
    'voice copying',
    'voice model',
    'voice avatar',
    'custom voice',
    'personalized voice',
    'voice identity',
    'voice twin',
    'voice duplication',
    'AI voice cloning',
    'neural voice cloning',
    'voice clone technology',
    'voice sample',
    'voice bank',
    
    // 中文声音克隆关键词
    '声音克隆',
    '声音复制',
    '声音模仿',
    '声音模型',
    '个性化声音',
    '声音定制',
    '声音样本',
    '声音库',
    '智能配音克隆',
    '语音克隆技术',
    
    // 日文声音克隆关键词
    '音声クローン',
    '声のクローン',
    'ボイスクローン',
    '音声複製',
    'カスタムボイス',
    
    // 韩文声音克隆关键词
    '음성 복제',
    '목소리 복제',
    '음성 클론',
    '맞춤형 음성',
  ],
  authors: [{ name: 'ItusiAI' }],
  creator: 'ItusiAI',
  publisher: 'ItusiAI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://voicecanvas.org',
    title: 'VoiceCanvas - Advanced AI-Powered Multilingual Voice Synthesis & Voice Cloning Platform',
    description: 'Experience state-of-the-art neural voice synthesis and voice cloning in 40+ languages. Professional-grade text-to-speech platform with advanced AI technology, offering crystal-clear audio quality, natural language processing, and personalized voice cloning capabilities.',
    siteName: 'VoiceCanvas',
    images: [
      {
        url: 'https://voicecanvas.org/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VoiceCanvas - AI Voice Synthesis & Cloning Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VoiceCanvas - Advanced AI-Powered Multilingual Voice Synthesis & Voice Cloning Platform',
    description: 'Experience state-of-the-art neural voice synthesis and voice cloning in 40+ languages. Professional-grade text-to-speech platform with advanced AI technology, offering crystal-clear audio quality, natural language processing, and personalized voice cloning capabilities.',
    images: {
      url: 'https://voicecanvas.org/images/og-image.png',
      alt: 'VoiceCanvas - AI Voice Synthesis & Cloning Platform',
      width: 1200,
      height: 630
    },
    creator: '@VoiceCanvas',
    site: '@VoiceCanvas',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://voicecanvas.org'
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        <UmamiAnalytics />
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <TitleUpdater />
              {children}
            </div>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
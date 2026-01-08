import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Voice Design - Professional Voice Creation & Customization Service',
  description: 'Create and customize unique voices using advanced AI technology. Support for multiple languages including English, Chinese, Japanese, and Korean. Features real-time preview and personalization options. Perfect for voiceovers, education, and podcasting.',
  metadataBase: new URL('https://voicecanvas.org'),
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
  keywords: 'voice design, AI voice creation, voice synthesis, voice customization, multilingual voiceover, personalized voice, professional voiceover, voice customization service, AI voice design, voice generation, voice creation, custom voice, voice identity, voice model, neural voice design, voice generation, speech synthesis, text to speech, TTS, voice AI, deep learning voice, machine learning audio, neural voice synthesis, AI voice technology, voice design platform, voice design service, voice design software, voiceover, dubbing, audiobook, podcast, education, entertainment, content creation, voice acting, narration, presentation, accessibility, language learning, voice assistant, chatbot voice, virtual assistant, deep learning, neural networks, machine learning, artificial intelligence, natural language processing, speech recognition, audio processing, voice modeling, acoustic modeling, prosody modeling, 音色设计, AI音色设计, 语音设计, 声音设计, 语音合成, 声音定制, 个性化语音, 声音模型, 语音生成, 智能配音, 声音创作, 语音创作, 声音制作, 个人声音, 定制语音, 声音AI, 语音AI, 智能语音, 声音技术, 语音技术, 音声デザイン, AI音声デザイン, 音声設計, 音声合成, 音声カスタマイズ, パーソナライズ音声, 音声モデル, 音声生成, スマート音声, 音声制作技術, 音声AI, ニューラル音声合成, 機械学習音声, 음성 디자인, AI 음성 디자인, 음성 설계, 음성 합성, 음성 커스터마이징, 개인화 음성, 음성 모델, 음성 생성, 스마트 음성, 음성 제작 기술, 음성 AI, 뉴럴 음성 합성, 머신러닝 음성, diseño de voz, diseño de voz IA, creación de voz, síntesis de voz, personalización de voz, voz personalizada, modelo de voz, generación de voz, voz inteligente, tecnología de diseño de voz, conception de voix, conception de voix IA, création de voix, synthèse vocale, personnalisation de voix, voix personnalisée, modèle de voix, génération de voix, voix intelligente, technologie de conception de voix, Stimmdesign, KI-Stimmdesign, Stimmerstellung, Sprachsynthese, Stimmenpersonalisierung, personalisierte Stimme, Stimmmodell, Stimmgenerierung, intelligente Stimme, Stimmdesign-Technologie, progettazione vocale, progettazione vocale IA, creazione vocale, sintesi vocale, personalizzazione vocale, voce personalizzata, modello vocale, generazione vocale, voce intelligente, tecnologia di progettazione vocale, дизайн голоса, ИИ дизайн голоса, создание голоса, синтез речи, персонализация голоса, персонализированный голос, модель голоса, генерация голоса, умный голос, технология дизайна голоса, تصميم الصوت, تصميم الصوت بالذكاء الاصطناعي, إنشاء الصوت, توليف الصوت, تخصيص الصوت, صوت مخصص, نموذج الصوت, توليد الصوت, صوت ذكي, تقنية تصميم الصوت, आवाज़ डिज़ाइन, एआई आवाज़ डिज़ाइन, आवाज़ निर्माण, आवाज़ संश्लेषण, आवाज़ अनुकूलन, व्यक्तिगत आवाज़, आवाज़ मॉडल, आवाज़ उत्पादन, स्मार्ट आवाज़, आवाज़ डिज़ाइन तकनीक, design de voz, design de voz IA, criação de voz, síntese de voz, personalização de voz, voz personalizada, modelo de voz, geração de voz, voz inteligente, tecnologia de design de voz',
  openGraph: {
    title: 'AI Voice Design - Professional Voice Creation & Customization Service',
    description: 'Create and customize unique voices using advanced AI technology. Support for multiple languages including English, Chinese, Japanese, and Korean. Features real-time preview and personalization options.',
    url: 'https://voicecanvas.org/design',
    siteName: 'VoiceCanvas',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://voicecanvas.org/images/design-og.png',
        width: 1200,
        height: 630,
        alt: 'VoiceCanvas Voice Design Interface',
        type: 'image/png'
      }
    ]
  },
  twitter: {
    title: 'AI Voice Design - Professional Voice Creation & Customization',
    description: 'Create and customize unique voices using advanced AI technology. Supports multiple languages with personalization options and real-time preview.',
    card: 'summary_large_image',
    images: {
      url: '/images/design-twitter.png',
      alt: 'VoiceCanvas Voice Design Interface',
      width: 1200,
      height: 630
    },
    creator: '@VoiceCanvas',
    site: '@VoiceCanvas'
  },
  other: {
    'og:image:secure_url': 'https://voicecanvas.org/images/design-og.png',
    'pinterest-rich-pin': 'true',
    'fb:app_id': '',
    'article:author': 'https://voicecanvas.org',
    'article:publisher': 'https://voicecanvas.org'
  }
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

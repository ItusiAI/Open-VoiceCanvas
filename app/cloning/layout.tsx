import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Voice Cloning - Professional Voice Replication & Customization Service',
  description: 'Clone and customize your voice using advanced AI technology. Support for multiple languages including English, Chinese, Japanese, and Korean. Features real-time preview and personalization options. Perfect for voiceovers, education, and podcasting.',
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
  keywords: 'voice cloning, AI voiceover, voice synthesis, voice customization, multilingual voiceover, personalized voice, professional voiceover, voice customization service, AI voice cloning, voice replication, voice duplication, voice copying, voice model, voice avatar, custom voice, voice identity, voice twin, neural voice cloning, voice generation, speech synthesis, text to speech, TTS, voice AI, deep learning voice, machine learning audio, neural voice synthesis, AI voice technology, voice cloning platform, voice cloning service, voice cloning software, voiceover, dubbing, audiobook, podcast, education, entertainment, content creation, voice acting, narration, presentation, accessibility, language learning, voice assistant, chatbot voice, virtual assistant, deep learning, neural networks, machine learning, artificial intelligence, natural language processing, speech recognition, audio processing, voice modeling, acoustic modeling, prosody modeling, 声音克隆, AI声音克隆, 语音克隆, 声音复制, 语音合成, 声音定制, 个性化语音, 声音模型, 语音生成, 智能配音, 声音复刻, 语音复制, 声音仿制, 个人声音, 定制语音, 声音AI, 语音AI, 智能语音, 声音技术, 语音技术, 音声クローニング, AI音声クローニング, 音声複製, 音声合成, 音声カスタマイズ, パーソナライズ音声, 音声モデル, 音声生成, スマート音声, 音声複製技術, 音声AI, ニューラル音声合成, 機械学習音声, 음성 복제, AI 음성 복제, 음성 클로닝, 음성 합성, 음성 커스터마이징, 개인화 음성, 음성 모델, 음성 생성, 스마트 음성, 음성 복제 기술, 음성 AI, 뉴럴 음성 합성, 머신러닝 음성, clonación de voz, clonación de voz IA, replicación de voz, síntesis de voz, personalización de voz, voz personalizada, modelo de voz, generación de voz, voz inteligente, tecnología de clonación de voz, clonage de voix, clonage de voix IA, réplication de voix, synthèse vocale, personnalisation de voix, voix personnalisée, modèle de voix, génération de voix, voix intelligente, technologie de clonage de voix, Stimmklonen, KI-Stimmklonen, Stimmreplikation, Sprachsynthese, Stimmenpersonalisierung, personalisierte Stimme, Stimmmodell, Stimmgenerierung, intelligente Stimme, Stimmklon-Technologie, clonazione vocale, clonazione vocale IA, replicazione vocale, sintesi vocale, personalizzazione vocale, voce personalizzata, modello vocale, generazione vocale, voce intelligente, tecnologia di clonazione vocale, клонирование голоса, ИИ клонирование голоса, репликация голоса, синтез речи, персонализация голоса, персонализированный голос, модель голоса, генерация голоса, умный голос, технология клонирования голоса, استنساخ الصوت, استنساخ الصوت بالذكاء الاصطناعي, تكرار الصوت, توليف الصوت, تخصيص الصوت, صوت مخصص, نموذج الصوت, توليد الصوت, صوت ذكي, تقنية استنساخ الصوت, आवाज़ क्लोनिंग, एआई आवाज़ क्लोनिंग, आवाज़ प्रतिकृति, आवाज़ संश्लेषण, आवाज़ अनुकूलन, व्यक्तिगत आवाज़, आवाज़ मॉडल, आवाज़ उत्पादन, स्मार्ट आवाज़, आवाज़ क्लोनिंग तकनीक, clonagem de voz, clonagem de voz IA, replicação de voz, síntese de voz, personalização de voz, voz personalizada, modelo de voz, geração de voz, voz inteligente, tecnologia de clonagem de voz',
  openGraph: {
    title: 'AI Voice Cloning - Professional Voice Replication & Customization Service',
    description: 'Clone and customize your voice using advanced AI technology. Support for multiple languages including English, Chinese, Japanese, and Korean. Features real-time preview and personalization options.',
    url: 'https://voicecanvas.org/cloning',
    siteName: 'VoiceCanvas',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://voicecanvas.org/images/cloning-og.png',
        width: 1200,
        height: 630,
        alt: 'VoiceCanvas Cloning Interface',
        type: 'image/png'
      }
    ]
  },
  twitter: {
    title: 'AI Voice Cloning - Professional Voice Replication & Customization',
    description: 'Clone and customize your voice using advanced AI technology. Supports multiple languages with personalization options and real-time preview.',
    card: 'summary_large_image',
    images: {
      url: '/images/cloning-twitter.png',
      alt: 'VoiceCanvas Cloning Interface',
      width: 1200,
      height: 630
    },
    creator: '@VoiceCanvas',
    site: '@VoiceCanvas'
  },
  other: {
    'og:image:secure_url': 'https://voicecanvas.org/images/cloning-og.png',
    'pinterest-rich-pin': 'true',
    'fb:app_id': '',
    'article:author': 'https://voicecanvas.org',
    'article:publisher': 'https://voicecanvas.org'
  }
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 
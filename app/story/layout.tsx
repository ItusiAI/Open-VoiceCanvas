import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Story Dubbing - Professional Story Generation & Voice Synthesis Service',
  description: 'Automatically generate stories and create voice dubbing using AI technology. Intelligently select appropriate voices based on story plots to create immersive storytelling experiences. Support multiple character voices and advanced voice synthesis technology.',
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
  keywords: 'AI story generation, AI story dubbing, automatic voice over, story creation, voice synthesis, character dubbing, intelligent dubbing, story narration, text to speech, multi-character dubbing, immersive storytelling, voice generation, story audio, character voices, smart voice, story production, dubbing tool, voice story, automatic reading, story podcast, audiobook creation, podcast production, educational content, entertainment, storytelling platform, voice content creation, audio story maker, narrative voice, story automation, content creation tool, neural voice synthesis, AI voice technology, deep learning voice, machine learning audio, natural language processing, voice AI, speech synthesis, voice cloning, emotion synthesis, Minimax, AI故事生成, AI故事配音, 自动配音, 故事创作, 语音合成, 角色配音, 智能配音, 故事朗读, 文本转语音, 多角色配音, 沉浸式故事, 语音生成, 故事音频, 角色声音, 智能语音, 故事制作, 配音工具, 语音故事, 自动朗读, 故事播客, テキスト読み上げ, 音声合成, 音声変換, 多言語対応, 音声ツール, AI音声, ニューラル音声合成, 機械学習音声, 音声アシスタント, ストーリー生成, 物語作成, 音声吹き替え, キャラクター音声, 자동 더빙, 스토리 생성, 음성 합성, 캐릭터 더빙, 인공지능 음성, 뉴럴 음성합성, 머신러닝 음성, 음성 도우미, 이야기 생성, 음성 변환, generación de historias IA, doblaje automático, síntesis de voz, creación de historias, narración automática, voces de personajes, asistente de voz, génération d\'histoires IA, doublage automatique, synthèse vocale, création d\'histoires, narration automatique, voix de personnages, assistant vocal, KI-Geschichtenerstellung, automatische Synchronisation, Sprachsynthese, Geschichtenerstellung, automatische Erzählung, Charakterstimmen, Sprachassistent, generazione di storie IA, doppiaggio automatico, sintesi vocale, creazione di storie, narrazione automatica, voci dei personaggi, assistente vocale, генерация историй ИИ, автоматическое озвучивание, синтез речи, создание историй, автоматическое повествование, голоса персонажей, голосовой помощник, توليد القصص بالذكاء الاصطناعي, الدبلجة التلقائية, توليف الصوت, إنشاء القصص, السرد التلقائي, أصوات الشخصيات, المساعد الصوتي, कहानी निर्माण एआई, स्वचालित डबिंग, आवाज़ संश्लेषण, कहानी निर्माण, स्वचालित कथन, चरित्र आवाज़ें, आवाज़ सहायक, geração de histórias IA, dublagem automática, síntese de voz, criação de histórias, narração automática, vozes de personagens, assistente de voz',
  openGraph: {
    title: 'AI Story Dubbing - Professional Story Generation & Voice Synthesis Service',
    description: 'Automatically generate stories and create voice dubbing using AI technology. Intelligently select appropriate voices based on story plots to create immersive storytelling experiences.',
    url: 'https://voicecanvas.org/story',
    siteName: 'VoiceCanvas',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://voicecanvas.org/images/story-og.png',
        width: 1200,
        height: 630,
        alt: 'VoiceCanvas Story Interface',
        type: 'image/png'
      }
    ]
  },
  twitter: {
    title: 'AI Story Dubbing - Professional Story Generation & Voice Synthesis',
    description: 'Automatically generate stories and create voice dubbing using AI technology. Intelligently select appropriate voices based on story plots to create immersive storytelling experiences.',
    card: 'summary_large_image',
    images: {
      url: '/images/story-twitter.png',
      alt: 'VoiceCanvas Story Interface',
      width: 1200,
      height: 630
    },
    creator: '@VoiceCanvas',
    site: '@VoiceCanvas'
  },
  other: {
    'og:image:secure_url': 'https://voicecanvas.org/images/story-og.png',
    'pinterest-rich-pin': 'true',
    'fb:app_id': '',
    'article:author': 'https://voicecanvas.org',
    'article:publisher': 'https://voicecanvas.org'
  }
};

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
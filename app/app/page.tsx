"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Upload, Languages, Sun, Moon, Globe, Download, Pause, Play, Settings, Sparkles, Mic2, ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/language-context";
import { synthesizeSpeech, playPollyAudio, hasSingleVoice, downloadAudio, SpeechService, minimaxLanguages, playMinimaxAudio, SERVICE_LIMITS, getProviderFromService } from "@/lib/polly-service";
import { getSupportedLanguages, getVoicesByLanguage, VoiceOption } from "@/lib/voice-config";
import { useSpeech } from '@/hooks/use-speech';
import { AudioVisualizer } from "@/components/audio-visualizer";
import { NavBar } from "@/components/nav-bar";
import { motion } from "framer-motion";
import { RequireAuth } from "@/components/require-auth";
import { useSession } from "next-auth/react";
import { useAnalytics } from '@/hooks/use-analytics';
import { VoiceSelector } from '@/components/voice-selector';
import { VoiceId } from "@aws-sdk/client-polly";
import { AppTitleUpdater } from "./title-updater";

interface Language {
  code: string;
  nameKey: 'chinese' | 'english' | 'japanese' | 'korean' | 'spanish' | 'french' | 'russian' | 'italian' | 'portuguese' | 'german' | 'indonesian' | 'arabic' | 'cantonese' | 'danish' | 'dutch' | 'finnish' | 'greek' | 'hebrew' | 'hindi' | 'hungarian' | 'norwegian' | 'polish' | 'romanian' | 'swedish' | 'turkish' | 'welsh' | 'britishEnglish' | 'australianEnglish' | 'mexicanSpanish' | 'usSpanish' |  'canadianFrench' | 'belgianFrench' | 'brazilianPortuguese' | 'austrianGerman' | 'swissGerman' | 'uaeArabic' | 'belgianDutch' | 'indianEnglish' | 'welshEnglish' | 'irishEnglish' | 'newZealandEnglish' | 'southAfricanEnglish' | 'singaporeanEnglish' | 'icelandic' | 'catalan' | 'czech' | 'vietnamese' | 'ukrainian' | 'afrikaans' | 'bulgarian' | 'croatian' | 'lithuanian' | 'latvian' | 'macedonian' | 'malay' | 'persian' | 'filipino' | 'nynorsk' | 'serbian' | 'slovak' | 'slovenian' | 'swahili' | 'tamil' | 'thai' | 'urdu' | 'traditionalChinese' | 'saudiArabic';
}

const MINIMAX_LANGUAGES = [
  { code: 'zh-CN', nameKey: 'chinese' as const },
  { code: 'yue-CN', nameKey: 'cantonese' as const },
  { code: 'en-US', nameKey: 'english' as const },
  { code: 'es-ES', nameKey: 'spanish' as const },
  { code: 'fr-FR', nameKey: 'french' as const },
  { code: 'ru-RU', nameKey: 'russian' as const },
  { code: 'de-DE', nameKey: 'german' as const },
  { code: 'pt-PT', nameKey: 'portuguese' as const },
  { code: 'ar-SA', nameKey: 'arabic' as const },
  { code: 'it-IT', nameKey: 'italian' as const },
  { code: 'ja-JP', nameKey: 'japanese' as const },
  { code: 'ko-KR', nameKey: 'korean' as const },
  { code: 'id-ID', nameKey: 'indonesian' as const },
  { code: 'vi-VN', nameKey: 'vietnamese' as const },
  { code: 'tr-TR', nameKey: 'turkish' as const },
  { code: 'nl-NL', nameKey: 'dutch' as const },
  { code: 'uk-UA', nameKey: 'ukrainian' as const },
  { code: 'th-TH', nameKey: 'thai' as const },
  { code: 'pl-PL', nameKey: 'polish' as const },
  { code: 'ro-RO', nameKey: 'romanian' as const },
  { code: 'el-GR', nameKey: 'greek' as const },
  { code: 'cs-CZ', nameKey: 'czech' as const },
  { code: 'fi-FI', nameKey: 'finnish' as const },
  { code: 'hi-IN', nameKey: 'hindi' as const },
  { code: 'bg-BG', nameKey: 'bulgarian' as const },
  { code: 'da-DK', nameKey: 'danish' as const },
  { code: 'he-IL', nameKey: 'hebrew' as const },
  { code: 'ms-MY', nameKey: 'malay' as const },
  { code: 'fa-IR', nameKey: 'persian' as const },
  { code: 'sk-SK', nameKey: 'slovak' as const },
  { code: 'sv-SE', nameKey: 'swedish' as const },
  { code: 'hr-HR', nameKey: 'croatian' as const },
  { code: 'tl-PH', nameKey: 'filipino' as const },
  { code: 'hu-HU', nameKey: 'hungarian' as const },
  { code: 'no-NO', nameKey: 'norwegian' as const },
  { code: 'sl-SI', nameKey: 'slovenian' as const },
  { code: 'ca-ES', nameKey: 'catalan' as const },
  { code: 'nn-NO', nameKey: 'nynorsk' as const },
  { code: 'ta-IN', nameKey: 'tamil' as const },
  { code: 'af-ZA', nameKey: 'afrikaans' as const }
] as const satisfies readonly Language[];

const AWS_LANGUAGES: readonly Language[] = [
  { code: 'zh-CN', nameKey: 'chinese' as const },
  { code: 'en-US', nameKey: 'english' as const },
  { code: 'en-GB', nameKey: 'britishEnglish' as const },
  { code: 'en-AU', nameKey: 'australianEnglish' as const },
  { code: 'ja-JP', nameKey: 'japanese' as const },
  { code: 'ko-KR', nameKey: 'korean' as const },
  { code: 'es-ES', nameKey: 'spanish' as const },
  { code: 'es-MX', nameKey: 'mexicanSpanish' as const },
  { code: 'es-US', nameKey: 'usSpanish' as const },
  { code: 'fr-FR', nameKey: 'french' as const },
  { code: 'fr-CA', nameKey: 'canadianFrench' as const },
  { code: 'fr-BE', nameKey: 'belgianFrench' as const },
  { code: 'ru-RU', nameKey: 'russian' as const },
  { code: 'it-IT', nameKey: 'italian' as const },
  { code: 'pt-PT', nameKey: 'portuguese' as const },
  { code: 'pt-BR', nameKey: 'brazilianPortuguese' as const },
  { code: 'de-DE', nameKey: 'german' as const },
  { code: 'de-AT', nameKey: 'austrianGerman' as const },
  { code: 'de-CH', nameKey: 'swissGerman' as const },
  { code: 'id-ID', nameKey: 'indonesian' as const },
  { code: 'arb', nameKey: 'arabic' as const },
  { code: 'ar-AE', nameKey: 'uaeArabic' as const },
  { code: 'ar-SA', nameKey: 'arabic' as const },
  { code: 'yue-CN', nameKey: 'cantonese' as const },
  { code: 'da-DK', nameKey: 'danish' as const },
  { code: 'nl-NL', nameKey: 'dutch' as const },
  { code: 'nl-BE', nameKey: 'belgianDutch' as const },
  { code: 'fi-FI', nameKey: 'finnish' as const },
  { code: 'hi-IN', nameKey: 'hindi' as const },
  { code: 'en-IN', nameKey: 'indianEnglish' as const },
  { code: 'en-GB-WLS', nameKey: 'welshEnglish' as const },
  { code: 'en-IE', nameKey: 'irishEnglish' as const },
  { code: 'en-NZ', nameKey: 'newZealandEnglish' as const },
  { code: 'en-ZA', nameKey: 'southAfricanEnglish' as const },
  { code: 'is-IS', nameKey: 'icelandic' as const },
  { code: 'nb-NO', nameKey: 'norwegian' as const },
  { code: 'pl-PL', nameKey: 'polish' as const },
  { code: 'ro-RO', nameKey: 'romanian' as const },
  { code: 'sv-SE', nameKey: 'swedish' as const },
  { code: 'tr-TR', nameKey: 'turkish' as const },
  { code: 'cy-GB', nameKey: 'welsh' as const },
  { code: 'ca-ES', nameKey: 'catalan' as const },
  { code: 'cs-CZ', nameKey: 'czech' as const }
] as const;

// OpenAI 支持的语言
const OPENAI_LANGUAGES = [
  { code: 'af-ZA', nameKey: 'afrikaans' as const },
  { code: 'ar-AE', nameKey: 'uaeArabic' as const },
  { code: 'ar-SA', nameKey: 'saudiArabic' as const },
  { code: 'bg-BG', nameKey: 'bulgarian' as const },
  { code: 'ca-ES', nameKey: 'catalan' as const },
  { code: 'cs-CZ', nameKey: 'czech' as const },
  { code: 'cy-GB', nameKey: 'welsh' as const },
  { code: 'da-DK', nameKey: 'danish' as const },
  { code: 'de-DE', nameKey: 'german' as const },
  { code: 'el-GR', nameKey: 'greek' as const },
  { code: 'en-AU', nameKey: 'australianEnglish' as const },
  { code: 'en-GB', nameKey: 'britishEnglish' as const },
  { code: 'en-GB-WLS', nameKey: 'welshEnglish' as const },
  { code: 'en-IE', nameKey: 'irishEnglish' as const },
  { code: 'en-IN', nameKey: 'indianEnglish' as const },
  { code: 'en-NZ', nameKey: 'newZealandEnglish' as const },
  { code: 'en-US', nameKey: 'english' as const },
  { code: 'en-ZA', nameKey: 'southAfricanEnglish' as const },
  { code: 'es-ES', nameKey: 'spanish' as const },
  { code: 'es-MX', nameKey: 'mexicanSpanish' as const },
  { code: 'es-US', nameKey: 'usSpanish' as const },
  { code: 'fi-FI', nameKey: 'finnish' as const },
  { code: 'fr-BE', nameKey: 'belgianFrench' as const },
  { code: 'fr-CA', nameKey: 'canadianFrench' as const },
  { code: 'fr-FR', nameKey: 'french' as const },
  { code: 'he-IL', nameKey: 'hebrew' as const },
  { code: 'hi-IN', nameKey: 'hindi' as const },
  { code: 'hr-HR', nameKey: 'croatian' as const },
  { code: 'hu-HU', nameKey: 'hungarian' as const },
  { code: 'id-ID', nameKey: 'indonesian' as const },
  { code: 'is-IS', nameKey: 'icelandic' as const },
  { code: 'it-IT', nameKey: 'italian' as const },
  { code: 'ja-JP', nameKey: 'japanese' as const },
  { code: 'ko-KR', nameKey: 'korean' as const },
  { code: 'lt-LT', nameKey: 'lithuanian' as const },
  { code: 'lv-LV', nameKey: 'latvian' as const },
  { code: 'mk-MK', nameKey: 'macedonian' as const },
  { code: 'ms-MY', nameKey: 'malay' as const },
  { code: 'nb-NO', nameKey: 'norwegian' as const },
  { code: 'nl-BE', nameKey: 'belgianDutch' as const },
  { code: 'nl-NL', nameKey: 'dutch' as const },
  { code: 'pl-PL', nameKey: 'polish' as const },
  { code: 'pt-BR', nameKey: 'brazilianPortuguese' as const },
  { code: 'pt-PT', nameKey: 'portuguese' as const },
  { code: 'ro-RO', nameKey: 'romanian' as const },
  { code: 'ru-RU', nameKey: 'russian' as const },
  { code: 'sk-SK', nameKey: 'slovak' as const },
  { code: 'sl-SI', nameKey: 'slovenian' as const },
  { code: 'sr-RS', nameKey: 'serbian' as const },
  { code: 'sv-SE', nameKey: 'swedish' as const },
  { code: 'sw-KE', nameKey: 'swahili' as const },
  { code: 'ta-IN', nameKey: 'tamil' as const },
  { code: 'th-TH', nameKey: 'thai' as const },
  { code: 'tr-TR', nameKey: 'turkish' as const },
  { code: 'uk-UA', nameKey: 'ukrainian' as const },
  { code: 'ur-PK', nameKey: 'urdu' as const },
  { code: 'vi-VN', nameKey: 'vietnamese' as const },
  { code: 'zh-CN', nameKey: 'chinese' as const },
  { code: 'zh-TW', nameKey: 'traditionalChinese' as const },
  { code: 'yue-CN', nameKey: 'cantonese' as const }
] as const;

// 创建语言代码到翻译键的映射
const languageCodeToNameKey: Record<string, string> = {
  'zh-CN': 'chinese',
  'cmn-CN': 'chinese',
  'en-US': 'english',
  'en-GB': 'britishEnglish',
  'en-AU': 'australianEnglish',
  'ja-JP': 'japanese',
  'ko-KR': 'korean',
  'es-ES': 'spanish',
  'es-MX': 'mexicanSpanish',
  'es-US': 'usSpanish',
  'fr-FR': 'french',
  'fr-CA': 'canadianFrench',
  'fr-BE': 'belgianFrench',
  'ru-RU': 'russian',
  'it-IT': 'italian',
  'pt-PT': 'portuguese',
  'pt-BR': 'brazilianPortuguese',
  'de-DE': 'german',
  'de-AT': 'austrianGerman',
  'de-CH': 'swissGerman',
  'id-ID': 'indonesian',
  'arb': 'arabic',
  'ar-AE': 'uaeArabic',
  'ar-SA': 'saudiArabic',
  'yue-CN': 'cantonese',
  'da-DK': 'danish',
  'nl-NL': 'dutch',
  'nl-BE': 'belgianDutch',
  'fi-FI': 'finnish',
  'hi-IN': 'hindi',
  'en-IN': 'indianEnglish',
  'en-GB-WLS': 'welshEnglish',
  'en-IE': 'irishEnglish',
  'en-NZ': 'newZealandEnglish',
  'en-ZA': 'southAfricanEnglish',
  'en-SG': 'singaporeanEnglish',
  'is-IS': 'icelandic',
  'nb-NO': 'norwegian',
  'pl-PL': 'polish',
  'ro-RO': 'romanian',
  'sv-SE': 'swedish',
  'tr-TR': 'turkish',
  'cy-GB': 'welsh',
  'ca-ES': 'catalan',
  'cs-CZ': 'czech',
  'vi-VN': 'vietnamese',
  'uk-UA': 'ukrainian',
  'af-ZA': 'afrikaans',
  'bg-BG': 'bulgarian',
  'hr-HR': 'croatian',
  'lt-LT': 'lithuanian',
  'lv-LV': 'latvian',
  'mk-MK': 'macedonian',
  'ms-MY': 'malay',
  'sr-RS': 'serbian',
  'sk-SK': 'slovak',
  'sl-SI': 'slovenian',
  'sw-KE': 'swahili',
  'ta-IN': 'tamil',
  'th-TH': 'thai',
  'ur-PK': 'urdu',
  'zh-TW': 'traditionalChinese'
};

// 使用从 polly-service.ts 导入的 SERVICE_LIMITS
// const SERVICE_LIMITS = {
//   aws: 100000,    // AWS Polly 最大支持 100,000 字符
//   minimax: 10000,  // Minimax 最大支持 10,000 字符
//   openai: 10000,  // OpenAI TTS 最大支持 10,000 字符
// };

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const [text, setText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [speed, setSpeed] = useState(1);
  const [isFemaleVoice, setIsFemaleVoice] = useState(true);
  const [isWordByWord, setIsWordByWord] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const [lastGeneratedAudio, setLastGeneratedAudio] = useState<ArrayBuffer | null>(null);
  const { speak, isLoading, error, SUPPORTED_LANGUAGES } = useSpeech();
  const [speechService, setSpeechService] = useState<SpeechService>('aws');
  const [selectedProvider, setSelectedProvider] = useState<'aws' | 'minimax' | 'openai'>('aws');
  const prevSpeechServiceRef = useRef(speechService);
  const [audioVisualizer, setAudioVisualizer] = useState<{
    audioContext: AudioContext;
    source: AudioBufferSourceNode;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { data: session } = useSession();
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const analytics = useAnalytics();
  
  // 高级音频选项 - 仅Minimax服务时使用
  const [vol, setVol] = useState(1); // 音量，范围(0,10]
  const [pitch, setPitch] = useState(0); // 语调，范围[-12,12]
  const [sampleRate, setSampleRate] = useState<number>(32000); // 采样率，默认32000
  const [bitrate, setBitrate] = useState<number>(128000); // 比特率，默认128000
  const [channel, setChannel] = useState<number>(2); // 声道数，默认2(双声道)
  const [emotion, setEmotion] = useState<EmotionType | undefined>(undefined); // 情绪

  // 支持的情绪类型
  type EmotionType = "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral";

  // 有效的采样率选项
  const SAMPLE_RATES = [8000, 16000, 22050, 24000, 32000, 44100];

  // 有效的比特率选项
  const BITRATES = [32000, 64000, 128000, 256000];

  // 返回顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    setMounted(true);
    
    // Initialize voices
    const initVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (hasSingleVoice(selectedLanguage, speechService)) {
      setIsFemaleVoice(true);
    }
  }, [selectedLanguage, speechService]);

  // 当切换服务商时，自动选择合适的语言
  useEffect(() => {
    // 只在服务商变化时触发语言切换
    if (prevSpeechServiceRef.current !== speechService) {
      if (speechService === 'minimax') {
        setSelectedLanguage('zh-CN');
      } else if (speechService === 'openai') {
        // 切换到 OpenAI 时默认选择英语
        setSelectedLanguage('en-US');
      } else if (speechService === 'aws' && selectedLanguage === 'zh-CN') {
        // 如果从 Minimax 切换到 AWS，且当前是中文，则切换到英语
        setSelectedLanguage('en-US');
      }
      
      prevSpeechServiceRef.current = speechService;
    }
  }, [speechService, selectedLanguage]);

  // 处理文本输入，限制字符数
  const handleTextChange = (value: string) => {
    const limit = SERVICE_LIMITS[speechService];
    if (value.length <= limit) {
      setText(value);
    } else {
      toast({
        title: t("error"),
        description: t("serviceProviderCharacterLimit", { limit: limit.toLocaleString() }),
        variant: "destructive",
      });
    }
  };

  // 当切换服务商时，如果当前文本超过新服务商的限制，则截断文本
  useEffect(() => {
    const limit = SERVICE_LIMITS[speechService];
    if (text.length > limit) {
      setText(text.slice(0, limit));
      toast({
        description: t("textTruncatedDueToLimit"),
        variant: "default",
      });
    }
  }, [speechService]);

  const handleSpeak = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      if (!text) {
        toast({
          title: t("noTextError"),
          description: t("pleaseEnterText"),
          variant: "destructive",
        });
        return;
      }

      if (!selectedVoice) {
        toast({
          title: t("error"),
          description: t("selectVoiceFirst"),
          variant: "destructive",
        });
        return;
      }

      // 尝试刷新会话，确保用户数据完整
      if (session?.user) {
        try {
          console.log('刷新用户会话...');
          const refreshResponse = await fetch('/api/auth/refresh-session');
          if (!refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.message?.includes('登录') || refreshData.message?.includes('身份验证')) {
              toast({
                title: t('error'),
                description: t('please_login_again') || '请重新登录',
                variant: "destructive",
              });
              return;
            }
          } else {
            const refreshData = await refreshResponse.json();
            if (refreshData.fixed) {
              console.log('会话ID已修复:', refreshData);
            }
          }
        } catch (error) {
          console.error('会话刷新失败:', error);
        }
      }

      let quotaCheckPassed = false;

      try {
        // 检查用户是否登录
        if (!session?.user) {
          toast({
            title: t("loginRequired"),
            description: t("loginToUseFeature"),
            variant: "destructive",
          });
          return;
        }

        // 获取用户当前配额信息
        const quotaResponse = await fetch('/api/user/plan');
        if (quotaResponse.ok) {
          const quotaData = await quotaResponse.json();
          
          // 检查用户是否有足够的字符额度
          const { permanentQuota, temporaryQuota, usedCharacters, quotaExpiry } = quotaData.characterQuota;
          const totalQuota = permanentQuota + (quotaExpiry && new Date(quotaExpiry) > new Date() ? temporaryQuota : 0);
          const remainingQuota = totalQuota - usedCharacters;

          if (remainingQuota < text.length) {
            toast({
              title: t("error"),
              description: t("insufficientCharacterQuota"),
              variant: "destructive",
            });
            return;
          }
          quotaCheckPassed = true;
        } else {
          console.error(t("quotaCheckFailed"));
          toast({
            title: t("notice"),
            description: t("quotaCheckUnavailable"),
          });
        }
      } catch (error) {
        console.error(t("quotaCheckError"), error);
        toast({
          title: t("notice"),
          description: t("quotaCheckUnavailable"),
        });
      }

      // 检查使用的是否是Minimax服务，如果是则使用高级音频选项
      let audioData: ArrayBuffer;
      
      if (speechService === 'minimax') {
        audioData = await synthesizeSpeech({
          text,
          language: selectedLanguage,
          voiceId: selectedVoice.id as VoiceId,
          speed,
          service: speechService
        });
      } else {
        audioData = await synthesizeSpeech({
          text,
          language: selectedLanguage,
          voiceId: selectedVoice.id as VoiceId,
          engine: selectedVoice.engine,
          speed,
          service: speechService
        });
      }

      if (speechService === 'minimax') {
        const result = await playMinimaxAudio(audioData, speed);
        setAudioVisualizer(result);
        setIsPlaying(true);
      } else if (speechService === 'openai') {
        const result = await playPollyAudio(audioData, speed); // OpenAI 音频可以使用相同的播放函数
        setAudioVisualizer(result);
        setIsPlaying(true);
      } else {
        const result = await playPollyAudio(audioData, speed);
        setAudioVisualizer(result);
        setIsPlaying(true);
      }
      
      setLastGeneratedAudio(audioData);
      
      // 只有在配额检查成功的情况下才更新使用量
      if (quotaCheckPassed) {
        try {
          // 统一处理所有语音服务的字符配额更新
          const updateResponse = await fetch('/api/user/update-quota', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usedCharacters: text.length,
            }),
          });

          if (!updateResponse.ok) {
            console.error(t("updateQuotaFailed"));
          } else {
            console.log(`字符配额更新成功，使用字符数: ${text.length}`);
          }
        } catch (error) {
          console.error(t("updateQuotaError"), error);
        }
      }

    } catch (error) {
      console.error(t("speechSynthesisError"), error);
      toast({
        title: t("error"),
        description: (error as Error).message || t("speechError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (!text) {
        toast({
          title: t("noTextError"),
          description: t("pleaseEnterText"),
          variant: "destructive",
        });
        return;
      }

      if (!selectedVoice) {
        toast({
          title: t("error"),
          description: t("selectVoiceFirst"),
          variant: "destructive",
        });
        return;
      }

      // 检查用户是否登录
      if (!session?.user) {
        toast({
          title: t("loginRequired"),
          description: t("loginToUseFeature"),
          variant: "destructive",
        });
        return;
      }
      
      // 尝试刷新会话，确保用户数据完整
      try {
        console.log('刷新用户会话...');
        const refreshResponse = await fetch('/api/auth/refresh-session');
        if (!refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.message?.includes('登录') || refreshData.message?.includes('身份验证')) {
            toast({
              title: t('error'),
              description: t('please_login_again') || '请重新登录',
              variant: "destructive",
            });
            return;
          }
        } else {
          const refreshData = await refreshResponse.json();
          if (refreshData.fixed) {
            console.log('会话ID已修复:', refreshData);
          }
        }
      } catch (error) {
        console.error('会话刷新失败:', error);
      }

      // 获取用户当前配额信息
      let quotaCheckPassed = false;
      try {
        const quotaResponse = await fetch('/api/user/plan');
        if (quotaResponse.ok) {
          const quotaData = await quotaResponse.json();
          
          // 检查用户是否有足够的字符额度
          const { permanentQuota, temporaryQuota, usedCharacters, quotaExpiry } = quotaData.characterQuota;
          const totalQuota = permanentQuota + (quotaExpiry && new Date(quotaExpiry) > new Date() ? temporaryQuota : 0);
          const remainingQuota = totalQuota - usedCharacters;

          if (remainingQuota < text.length) {
            toast({
              title: t("error"),
              description: t("insufficientCharacterQuota"),
              variant: "destructive",
            });
            return;
          }
          quotaCheckPassed = true;
        } else {
          console.error(t("quotaCheckFailed"));
          toast({
            title: t("notice"),
            description: t("quotaCheckUnavailable"),
          });
        }
      } catch (error) {
        console.error(t("quotaCheckError"), error);
        toast({
          title: t("notice"),
          description: t("quotaCheckUnavailable"),
        });
      }

      // 使用Minimax服务时，使用高级音频选项
      let audioData: ArrayBuffer;

      if (speechService === 'minimax') {
        audioData = await synthesizeSpeech({
          text,
          language: selectedLanguage,
          voiceId: selectedVoice.id as VoiceId,
          speed,
          service: 'minimax',
          vol,
          pitch,
          sampleRate,
          bitrate,
          channel,
          emotion
        });
      } else {
        audioData = await synthesizeSpeech({
          text,
          language: selectedLanguage,
          voiceId: selectedVoice.id as VoiceId,
          engine: selectedVoice.engine,
          speed,
          service: speechService
        });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audio_${selectedLanguage}_${timestamp}.mp3`;
      await downloadAudio(audioData, filename);
      
      // 只有在配额检查成功的情况下才更新使用量
      if (quotaCheckPassed) {
        try {
          // 统一处理所有语音服务的字符配额更新
          const updateResponse = await fetch('/api/user/update-quota', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usedCharacters: text.length,
            }),
          });

          if (!updateResponse.ok) {
            console.error(t("updateQuotaFailed"));
          } else {
            console.log(`字符配额更新成功，使用字符数: ${text.length}`);
          }
        } catch (error) {
          console.error(t("updateQuotaError"), error);
        }
      }
    } catch (error) {
      console.error(t("downloadError"), error);
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("downloadError"),
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        // 处理纯文本文件
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setText(content);
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        // 处理 PDF 文件
        toast({
          title: t("error"),
          description: t("pdfNotSupported"),
          variant: "destructive",
        });
      } else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.rtf')) {
        // 处理 Word 文件
        toast({
          title: t("error"),
          description: t("wordNotSupported"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("error"),
          description: t("unsupportedFormat"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: t("error"),
        description: t("uploadError"),
        variant: "destructive",
      });
    }
  };

  const handlePause = () => {
    if (audioVisualizer) {
      audioVisualizer.audioContext.suspend();
      setIsPlaying(false);
    }
  };

  const handleResume = () => {
    if (audioVisualizer) {
      audioVisualizer.audioContext.resume();
      setIsPlaying(true);
    }
  };

  // 跟踪服务提供商切换
  const handleServiceChange = (value: SpeechService) => {
    setSpeechService(value);
    setSelectedProvider(getProviderFromService(value));
    
    // 当切换到aws-ntts服务时，确保选择的语言是支持的
    if (value === 'aws-ntts') {
      // 获取支持神经引擎的语言列表
      const supportedNTTSLanguages = getSupportedLanguages('aws-ntts').map(lang => lang.code);
      
      // 检查当前选择的语言是否支持神经引擎
      // 如果当前是zh-CN，需要转换为cmn-CN
      const checkLanguage = selectedLanguage === 'zh-CN' ? 'cmn-CN' : selectedLanguage;
      
      if (!supportedNTTSLanguages.includes(checkLanguage)) {
        // 如果不支持，选择默认的支持语言（如英语）
        setSelectedLanguage('en-US');
        toast({
          description: t("languageChangedToSupported"),
          variant: "default",
        });
      } else if (selectedLanguage === 'zh-CN') {
        // 如果是中文，需要切换到正确的语言代码
        setSelectedLanguage('cmn-CN');
      }
    } else if (selectedLanguage === 'cmn-CN') {
      // 如果从aws-ntts切换回其他服务，且当前语言是cmn-CN，需要切换回zh-CN
      setSelectedLanguage('zh-CN');
    }
    
    analytics.trackEvent('change_service', 'settings', value);
  };

  // 跟踪语言切换
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    analytics.trackEvent('change_language', 'settings', value);
  };

  useEffect(() => {
    setMounted(true);
    // 初始化时设置正确的provider
    setSelectedProvider(getProviderFromService(speechService));
  }, []);

  // 处理VoiceSelector组件
  useEffect(() => {
    if (selectedLanguage && speechService) {
      // 确定要使用的语言代码
      const languageToUse =
        speechService === 'aws-ntts' && selectedLanguage === 'zh-CN' ? 'cmn-CN' :
        selectedLanguage === 'cmn-CN' && speechService !== 'aws-ntts' ? 'zh-CN' :
        selectedLanguage;

      // 获取可用的音色
      let availableVoices: VoiceOption[] = [];

      if (speechService === 'aws-ntts') {
        // 对于神经引擎，直接从AWS_NTTS_VOICES中查找
        availableVoices = getVoicesByLanguage(languageToUse, 'aws-ntts');
      } else {
        // 对于其他服务，使用常规的getVoicesByLanguage
        availableVoices = getVoicesByLanguage(languageToUse, selectedProvider);
      }

      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0]);
      } else if (availableVoices.length > 0 &&
                 selectedVoice &&
                 !availableVoices.some(voice => voice.id === selectedVoice.id)) {
        // 如果当前选中的音色在新的语言中不可用，则重新选择
        setSelectedVoice(availableVoices[0]);
      }
    }
  }, [selectedLanguage, selectedProvider, speechService]);

  if (!mounted) return null;

  return (
    <RequireAuth>
      <AppTitleUpdater />
      <div className="min-h-screen flex flex-col pb-16">
        <NavBar />
        <main className="container mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-10">
          {/* 背景光效 */}
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(96,165,250,0.05),transparent)] dark:bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.05),transparent)]"></div>
          
          <Card className="backdrop-blur-sm bg-background/90 border-primary/10 shadow-xl rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-xl"></div>
            <CardHeader className="border-b border-primary/10 pb-4 md:pb-6 flex justify-center items-center relative z-10">
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent text-center relative">
                {t('title')}
                <div className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-purple-500/50 to-pink-500/0"></div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 md:pt-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                <Card className="backdrop-blur-sm bg-background/95 border-primary/10 shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                  <CardHeader className="space-y-1 md:space-y-2">
                    <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-blue-500" />
                      {t('serviceSettings')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 md:space-y-6">
                    <div className="space-y-3 md:space-y-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label>{t('speechService')}</Label>
                        <Select
                          value={speechService}
                          onValueChange={handleServiceChange}
                        >
                          <SelectTrigger className="h-9 md:h-10 rounded-md bg-background/60 border-primary/20 hover:border-primary/40 transition-colors duration-200 focus:ring-1 focus:ring-primary/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aws">AWS Polly</SelectItem>
                            <SelectItem value="aws-ntts">AWS Polly NTTS</SelectItem>
                            <SelectItem value="minimax">Minimax</SelectItem>
                            <SelectItem value="openai">OpenAI TTS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 md:space-y-2">
                        <Label>{t('selectLanguage')}</Label>
                        <Select
                          value={selectedLanguage}
                          onValueChange={handleLanguageChange}
                        >
                          <SelectTrigger className="h-9 md:h-10 rounded-md bg-background/60 border-primary/20 hover:border-primary/40 transition-colors duration-200 focus:ring-1 focus:ring-primary/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[40vh] overflow-y-auto">
                            <div className="px-3 py-2 sticky top-0 bg-background z-10 border-b">
                              <input
                                className="w-full h-8 px-3 text-sm border rounded-md border-primary/20 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                                placeholder={t('searchLanguage')}
                                onChange={(e) => {
                                  const searchElement = e.target.parentElement?.parentElement?.querySelectorAll('.language-item');
                                  const searchText = e.target.value.toLowerCase();
                                  searchElement?.forEach((item) => {
                                    const text = item.textContent?.toLowerCase() || '';
                                    if (text.includes(searchText)) {
                                      (item as HTMLElement).style.display = 'block';
                                    } else {
                                      (item as HTMLElement).style.display = 'none';
                                    }
                                  });
                                }}
                              />
                            </div>
                            {speechService === 'minimax' ? (
                              MINIMAX_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code} className="language-item">
                                  {t(lang.nameKey)}
                                </SelectItem>
                              ))
                            ) : speechService === 'openai' ? (
                              // 使用 OpenAI 的语言列表
                              OPENAI_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code} className="language-item">
                                  {t(lang.nameKey)}
                                </SelectItem>
                              ))
                            ) : speechService === 'aws-ntts' ? (
                              // 只展示支持神经引擎的语言
                              getSupportedLanguages('aws-ntts').map((lang) => (
                                <SelectItem key={lang.code} value={lang.code} className="language-item">
                                  {languageCodeToNameKey[lang.code] ? t(languageCodeToNameKey[lang.code] as any) : lang.name}
                                </SelectItem>
                              ))
                            ) : (
                              // 使用 AWS 的语言列表（标准引擎）
                              AWS_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code} className="language-item">
                                  {t(lang.nameKey)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 md:space-y-2">
                        <Label>{t('voice')}</Label>
                        {selectedLanguage && (
                          <VoiceSelector
                            languageCode={
                              // 对于aws-ntts，确保使用cmn-CN作为中文的语言代码
                              speechService === 'aws-ntts' && selectedLanguage === 'zh-CN'
                                ? 'cmn-CN'
                                : selectedLanguage === 'cmn-CN' && speechService !== 'aws-ntts'
                                  ? 'zh-CN'
                                  : selectedLanguage
                            }
                            onVoiceSelect={setSelectedVoice}
                            selectedVoiceId={selectedVoice?.id}
                            provider={speechService === 'aws-ntts' ? 'aws-ntts' : selectedProvider}
                          />
                        )}
                      </div>

                      <div className="space-y-1.5 md:space-y-2">
                        <Label>{t('wordByWord')}</Label>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {isWordByWord ? t('on') : t('off')}
                          </span>
                          <Switch
                            checked={isWordByWord}
                            onCheckedChange={setIsWordByWord}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 md:space-y-2">
                        <div className="flex justify-between">
                          <Label>{t('speed')}</Label>
                          <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{speed}x</span>
                        </div>
                        <Slider
                          value={[speed]}
                          onValueChange={([value]) => setSpeed(value)}
                          min={0.5}
                          max={2}
                          step={0.1}
                          className="py-2"
                          defaultValue={[1]}
                        />
                      </div>
                      
                      {/* Minimax 高级音频选项 */}
                      {speechService === 'minimax' && (
                        <>
                          <div className="space-y-1.5 md:space-y-2">
                            <div className="flex justify-between">
                              <Label>{t('volume')}</Label>
                              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{vol}</span>
                            </div>
                            <Slider
                              value={[vol]}
                              onValueChange={([value]) => setVol(value)}
                              min={0.1}
                              max={10}
                              step={0.1}
                              className="py-2"
                              defaultValue={[1]}
                            />
                          </div>

                          <div className="space-y-1.5 md:space-y-2">
                            <div className="flex justify-between">
                              <Label>{t('pitch')}</Label>
                              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{pitch}</span>
                            </div>
                            <Slider
                              value={[pitch]}
                              onValueChange={([value]) => setPitch(value)}
                              min={-12}
                              max={12}
                              step={1}
                              className="py-2"
                              defaultValue={[0]}
                            />
                          </div>

                          <div className="space-y-3 pt-2 border-t border-primary/10">
                            <h3 className="text-sm font-medium">{t('advancedAudioOptions')}</h3>
                            
                            <div className="space-y-1.5 md:space-y-2">
                              <Label>{t('emotion')}</Label>
                              <Select
                                value={emotion || "none"}
                                onValueChange={(value) => {
                                  setEmotion(value === "none" ? undefined : value as EmotionType);
                                }}
                              >
                                <SelectTrigger className="h-9 md:h-10 rounded-md bg-background/60 border-primary/20 hover:border-primary/40 transition-colors duration-200 focus:ring-1 focus:ring-primary/30">
                                  <SelectValue placeholder={t('selectEmotionOptional')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">{t('noEmotion')}</SelectItem>
                                  {(['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'] as EmotionType[]).map((emotion) => (
                                    <SelectItem key={emotion} value={emotion}>
                                      {t(`emotion_${emotion}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1.5 md:space-y-2">
                              <Label>{t('sampleRate')}</Label>
                              <Select
                                value={sampleRate.toString()}
                                onValueChange={(value) => setSampleRate(parseInt(value))}
                              >
                                <SelectTrigger className="h-9 md:h-10 rounded-md bg-background/60 border-primary/20 hover:border-primary/40 transition-colors duration-200 focus:ring-1 focus:ring-primary/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SAMPLE_RATES.map((rate) => (
                                    <SelectItem key={rate} value={rate.toString()}>
                                      {rate.toLocaleString()}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1.5 md:space-y-2">
                              <Label>{t('bitrate')}</Label>
                              <Select
                                value={bitrate.toString()}
                                onValueChange={(value) => setBitrate(parseInt(value))}
                              >
                                <SelectTrigger className="h-9 md:h-10 rounded-md bg-background/60 border-primary/20 hover:border-primary/40 transition-colors duration-200 focus:ring-1 focus:ring-primary/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {BITRATES.map((rate) => (
                                    <SelectItem key={rate} value={rate.toString()}>
                                      {rate === 32000 ? "32 kbps" : 
                                        rate === 64000 ? "64 kbps" : 
                                        rate === 128000 ? "128 kbps" : 
                                        "256 kbps"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1.5 md:space-y-2">
                              <Label>{t('channel')}</Label>
                              <Select
                                value={channel.toString()}
                                onValueChange={(value) => setChannel(parseInt(value))}
                              >
                                <SelectTrigger className="h-9 md:h-10 rounded-md bg-background/60 border-primary/20 hover:border-primary/40 transition-colors duration-200 focus:ring-1 focus:ring-primary/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">{t('mono')}</SelectItem>
                                  <SelectItem value="2">{t('stereo')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-sm bg-background/95 border-primary/10 shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                  <CardHeader className="space-y-1 md:space-y-2">
                    <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center">
                      <Volume2 className="h-5 w-5 mr-2 text-purple-500" />
                      {t('readText')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 md:space-y-6">
                    <div className="relative">
                      <Textarea
                        placeholder={t('inputPlaceholder')}
                        className="min-h-[140px] md:min-h-[220px] bg-background/70 backdrop-blur-sm border-primary/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all duration-300 resize-none text-sm md:text-base rounded-lg"
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        maxLength={SERVICE_LIMITS[speechService]}
                      />
                      <div className="absolute bottom-2 right-2 text-xs font-medium px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-primary/10 text-primary/80">
                        {text.length}/{SERVICE_LIMITS[speechService].toLocaleString()} {t('characters')}
                      </div>
                    </div>
                    
                    {audioVisualizer && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="w-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-3 md:p-4 rounded-xl border border-primary/10"
                      >
                        <AudioVisualizer 
                          audioContext={audioVisualizer.audioContext}
                          audioSource={audioVisualizer.source}
                          onPause={handlePause}
                          onResume={handleResume}
                          isPlaying={isPlaying}
                        />
                      </motion.div>
                    )}
                    
                    <div className="flex flex-wrap gap-3 md:gap-5">
                      <RequireAuth>
                        <Button 
                          onClick={handleSpeak} 
                          className="flex-1 h-9 md:h-10 text-sm bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 rounded-md shadow-md hover:shadow-lg hover:shadow-purple-500/20"
                        >
                          <Volume2 className="mr-2 h-4 w-4" />
                          {t('readText')}
                        </Button>
                      </RequireAuth>

                      {audioVisualizer && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          <RequireAuth>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={isPlaying ? handlePause : handleResume}
                              className="h-9 md:h-10 w-9 md:w-10 border-primary/20 hover:border-primary/40 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          </RequireAuth>
                        </motion.div>
                      )}

                      <RequireAuth>
                        <Button 
                          variant="outline" 
                          onClick={handleDownload}
                          className="flex-1 h-9 md:h-10 text-sm border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {t('downloadAudio')}
                        </Button>
                      </RequireAuth>

                      <RequireAuth>
                        <Button
                          variant="outline"
                          className="flex-1 h-9 md:h-10 text-sm border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                          asChild
                        >
                          <label>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('uploadFile')}
                            <input
                              type="file"
                              className="hidden"
                              accept=".txt,.md"
                              onChange={handleFileUpload}
                            />
                          </label>
                        </Button>
                      </RequireAuth>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </main>
        
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
    </RequireAuth>
  );
}
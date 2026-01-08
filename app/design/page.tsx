'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Download, Play, Pause, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/language-context";
import { playMinimaxAudio, SERVICE_LIMITS, synthesizeSpeech } from "@/lib/polly-service";
import { motion } from "framer-motion";
import { RequireAuth } from "@/components/require-auth";

import { VoiceOption } from "@/lib/voice-config";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { InsufficientCreditsDialog } from "@/components/InsufficientCreditsDialog";
import { NavBar } from "@/components/nav-bar";
import { VoiceDesignTitleUpdater } from "./title-updater";

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
];

interface DesignedVoice {
  id: string;
  name: string;
  language: string;
  description: string;
  voiceId: string;
  createdAt: string;
}

export default function VoiceDesign() {
  const { t, language } = useLanguage();

  // 返回顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const [text, setText] = useState("");
  const [testText, setTestText] = useState(""); // 试听文本
  const [voiceDescription, setVoiceDescription] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("zh-CN");
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [speed, setSpeed] = useState(1);
  const [vol, setVol] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [sampleRate, setSampleRate] = useState<number>(32000);
  const [bitrate, setBitrate] = useState<number>(128000);
  const [channel, setChannel] = useState<number>(2);
  const [emotion, setEmotion] = useState<"happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral" | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [designedVoices, setDesignedVoices] = useState<DesignedVoice[]>([]);
  const [audioVisualizer, setAudioVisualizer] = useState<{
    audioContext: AudioContext;
    source: AudioBufferSourceNode;
    url: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] = useState(false);

  // 有效的采样率选项
  const SAMPLE_RATES = [8000, 16000, 22050, 24000, 32000, 44100];

  // 有效的比特率选项
  const BITRATES = [32000, 64000, 128000, 256000];

  useEffect(() => {
    setMounted(true);
    fetchDesignedVoices();
  }, []);

  const fetchDesignedVoices = async () => {
    try {
      const response = await fetch('/api/voice/designed-voices');
      if (response.ok) {
        const voices = await response.json();
        setDesignedVoices(voices);
      }
    } catch (error) {
      console.error('Failed to fetch designed voices:', error);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setSelectedVoice(null);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleResume = () => {
    setIsPlaying(true);
  };

  const handleDownload = () => {
    if (audioVisualizer?.url) {
      const link = document.createElement('a');
      link.href = audioVisualizer.url;
      link.download = 'voice_design_audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSpeak = async () => {
    if (isProcessing) return;

    if (!text.trim()) {
      toast({
        title: t("error"),
        description: t("pleaseEnterText"),
        variant: "destructive",
      });
      return;
    }

    if (!selectedVoice) {
      toast({
        title: t("error"),
        description: t("pleaseSelectVoice"),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const audioData = await synthesizeSpeech({
        text,
        language: selectedLanguage,
        voiceId: selectedVoice.id,
        speed: speed,
        service: 'minimax',
        vol,
        pitch,
        sampleRate,
        bitrate,
        channel,
        emotion
      });

      const { audioContext, source } = await playMinimaxAudio(audioData, speed);

      const audioUrl = URL.createObjectURL(new Blob([audioData], { type: 'audio/mp3' }));

      setAudioVisualizer({
        audioContext,
        source,
        url: audioUrl
      });

      setIsPlaying(true);

    } catch (error) {
      console.error(t('speechSynthesisError'), error);
      toast({
        title: t('speechSynthesisError'),
        description: error instanceof Error ? error.message : t('speechError'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };





  // 处理文本输入，限制字符数
  const handleTextChange = (value: string) => {
    const limit = SERVICE_LIMITS.minimax;
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

  const handlePreview = async () => {
    if (isProcessing) return;

    if (!testText.trim()) {
      toast({
        title: t("error"),
        description: t("pleaseEnterText"),
        variant: "destructive",
      });
      return;
    }

    if (!voiceDescription.trim()) {
      toast({
        title: t("error"),
        description: t("pleaseEnterVoiceDescription"),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 生成多语言的默认名称，根据当前语言环境格式化日期
      const currentDate = new Date();
      // 根据语言代码映射到正确的locale
      const getLocale = (lang: string) => {
        switch (lang) {
          case 'zh': return 'zh-CN';
          case 'yue': return 'zh-HK';
          case 'ja': return 'ja-JP';
          case 'ko': return 'ko-KR';
          case 'es': return 'es-ES';
          case 'fr': return 'fr-FR';
          case 'de': return 'de-DE';
          case 'it': return 'it-IT';
          case 'pt': return 'pt-PT';
          case 'ru': return 'ru-RU';
          default: return 'en-US';
        }
      };
      const locale = getLocale(language);
      const formattedDate = currentDate.toLocaleString(locale);
      const defaultName = `${t('voiceDesign')} ${formattedDate}`;

      console.log('Language info:', {
        language,
        locale,
        voiceDesignText: t('voiceDesign'),
        formattedDate,
        defaultName
      });

      // 调用音色设计API，预览并保存
      const response = await fetch('/api/voice/design/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText,
          description: voiceDescription,
          name: defaultName,
          language: selectedLanguage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // 检查是否是额度不足错误
        if (response.status === 403 && errorData.error === 'Insufficient clone credits') {
          setShowInsufficientCreditsDialog(true);
          return;
        }
        throw new Error(errorData.error || '音色设计失败');
      }

      const audioData = await response.arrayBuffer();
      console.log('Audio data received, size:', audioData.byteLength);

      try {
        await playMinimaxAudio(audioData, 1.0);
        console.log('Audio playback started successfully');
      } catch (audioError) {
        console.error('Audio playback with Web Audio API failed:', audioError);

        // 尝试使用HTML Audio元素作为备用方案
        try {
          console.log('Trying fallback audio playback...');
          const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          audio.oncanplaythrough = () => {
            audio.play().then(() => {
              console.log('Fallback audio playback started successfully');
            }).catch((playError) => {
              console.error('Fallback audio play failed:', playError);
              toast({
                title: t("notice"),
                description: "音频播放失败，但音色设计已保存成功。请手动点击播放。",
                variant: "default",
              });
            });
          };

          audio.onerror = () => {
            console.error('Fallback audio loading failed');
            toast({
              title: t("notice"),
              description: "音频播放失败，但音色设计已保存成功",
              variant: "default",
            });
          };

        } catch (fallbackError) {
          console.error('Fallback audio playback also failed:', fallbackError);
          toast({
            title: t("notice"),
            description: "音频播放失败，但音色设计已保存成功",
            variant: "default",
          });
        }
      }

      // 刷新设计音色列表
      fetchDesignedVoices();

      toast({
        title: t("success"),
        description: t("voiceDesignSuccess"),
      });

    } catch (error) {
      console.error('Voice design error:', error);
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t('designFailed'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };



  if (!mounted) {
    return null;
  }

  return (
    <>
      <VoiceDesignTitleUpdater />
      <NavBar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8">
        <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-blue-500/5 to-pink-500/5 rounded-xl"></div>
          <CardHeader className="border-b border-primary/10 pb-4 md:pb-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent text-center">
                {t('voiceDesign')}
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6 relative z-10">
            <div className="space-y-4 md:space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="space-y-1 md:space-y-2 pb-3">
                    <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {t('designVoice')}
                    </CardTitle>
                  </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 pt-0">
                      {/* 音色描述 */}
                      <div className="space-y-2">
                        <Label htmlFor="voiceDescription" className="text-sm font-medium">{t('voiceDescriptionLabel')}</Label>
                        <Textarea
                          id="voiceDescription"
                          placeholder={t('voiceDescriptionPlaceholder')}
                          value={voiceDescription}
                          onChange={(e) => setVoiceDescription(e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-primary/5">
                          <p>{t('voiceDescriptionExample')}</p>
                          <ul className="mt-1 space-y-1">
                            <li>• "{t('voiceDescriptionExample1')}"</li>
                            <li>• "{t('voiceDescriptionExample2')}"</li>
                            <li>• "{t('voiceDescriptionExample3')}"</li>
                          </ul>
                        </div>
                      </div>

                      {/* 试听文本 */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="testText" className="text-sm font-medium">{t('testTextRequired')}</Label>
                          <span className="text-sm text-muted-foreground">
                            {testText.length}/{SERVICE_LIMITS.minimax.toLocaleString()}
                          </span>
                        </div>
                        <Textarea
                          id="testText"
                          placeholder={t('testTextPlaceholder')}
                          value={testText}
                          onChange={(e) => setTestText(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      {/* 预设描述词快捷选择 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('quickDescriptions')}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { labelKey: 'warmFriendly', descKey: 'warmFriendlyDesc' },
                            { labelKey: 'professionalBusiness', descKey: 'professionalBusinessDesc' },
                            { labelKey: 'energeticYouthful', descKey: 'energeticYouthfulDesc' },
                            { labelKey: 'magneticMature', descKey: 'magneticMatureDesc' },
                            { labelKey: 'sweetCute', descKey: 'sweetCuteDesc' },
                            { labelKey: 'steadyAuthoritative', descKey: 'steadyAuthoritativeDesc' }
                          ].map((preset) => (
                            <Button
                              key={preset.labelKey}
                              variant="outline"
                              size="sm"
                              className="h-auto p-2 text-left justify-start hover:bg-primary/5 transition-colors"
                              onClick={() => setVoiceDescription(t(preset.descKey as any))}
                            >
                              <div>
                                <div className="text-sm font-medium">{t(preset.labelKey as any)}</div>
                                <div className="text-xs text-muted-foreground mt-1">{t(preset.descKey as any)}</div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="pt-4">
                        <RequireAuth>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              onClick={handlePreview}
                              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-12 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg text-base font-semibold"
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <div className="flex items-center">
                                  <div className="h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                  {t('processing')}
                                </div>
                              ) : (
                                <>
                                  <Volume2 className="mr-2 h-5 w-5" />
                                  {t('generateAndSaveVoice')}
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </RequireAuth>
                      </div>
                    </CardContent>
                  </Card>
              </motion.div>

              {/* 服务设置和朗读文本左右布局 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 左侧：服务设置 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader className="space-y-1 md:space-y-2 pb-3">
                      <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {t('serviceSettings')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 pt-0">
                      {/* 语言选择 */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{t('selectLanguage')}</Label>
                        <Select
                          value={selectedLanguage}
                          onValueChange={handleLanguageChange}
                        >
                          <SelectTrigger className="h-9 rounded-md bg-background/70 border-primary/20 hover:border-primary/40 transition-colors duration-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[40vh] overflow-y-auto">
                            <div className="px-3 py-2 sticky top-0 bg-background z-10 border-b">
                              <input
                                className="w-full h-8 px-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
                            {MINIMAX_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code} className="language-item">
                                {t(lang.nameKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 音色选择 - 只显示设计的音色 */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{t('voice')}</Label>
                        {selectedLanguage && (
                          <div className="space-y-2">
                            {designedVoices.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground bg-muted/30 rounded-lg border border-primary/5">
                                <p className="text-sm">{t('noDesignedVoices')}</p>
                                <p className="text-xs">{t('pleaseDesignFirst')}</p>
                              </div>
                            ) : (
                              <>
                                <h3 className="text-sm font-medium text-muted-foreground">{t('designedVoices')}</h3>
                                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                  {designedVoices.map((voice) => (
                                    <Card
                                      key={voice.id}
                                      className={`cursor-pointer transition-all hover:shadow-md ${
                                        selectedVoice?.id === voice.voiceId
                                          ? "border-primary bg-primary/5"
                                          : "hover:border-primary/50"
                                      }`}
                                      onClick={() => setSelectedVoice({
                                        id: voice.voiceId,
                                        provider: 'minimax',
                                        name: voice.voiceId,
                                        gender: 'Female'
                                      })}
                                    >
                                      <CardContent className="p-2">
                                        <p className="font-medium text-sm font-mono">{voice.voiceId}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{voice.description}</p>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 音频参数调节 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
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
                            min={-20}
                            max={20}
                            step={1}
                            className="py-2"
                            defaultValue={[0]}
                          />
                        </div>
                      </div>

                      {/* 情绪选择 */}
                      <div className="space-y-1.5 md:space-y-2">
                        <Label>{t('emotion')}</Label>
                        <Select
                          value={emotion || "none"}
                          onValueChange={(value) => {
                            setEmotion(value === "none" ? undefined : value as "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral");
                          }}
                        >
                          <SelectTrigger className="h-9 md:h-10 rounded-md bg-background/60 border-primary/20 hover:border-primary/40 transition-colors duration-200 focus:ring-1 focus:ring-primary/30">
                            <SelectValue placeholder={t('selectEmotionOptional')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('noEmotion')}</SelectItem>
                            {(['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'] as const).map((emotion) => (
                              <SelectItem key={emotion} value={emotion}>
                                {t(`emotion_${emotion}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 高级音频选项 */}
                      <div className="space-y-3 pt-2 border-t border-primary/10">
                        <h3 className="text-sm font-medium">{t('advancedAudioOptions')}</h3>

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
                    </CardContent>
                  </Card>
                </motion.div>

                {/* 右侧：朗读文本 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader className="space-y-1 md:space-y-2 pb-3">
                      <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {t('readText')}
                      </CardTitle>
                    </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 pt-0">
                    <div className="relative">
                      <Textarea
                        placeholder={t('inputPlaceholder')}
                        className="min-h-[120px] md:min-h-[180px] bg-background/70 backdrop-blur-sm border-primary/20 focus:border-primary/40 rounded-md transition-all duration-300 resize-none text-sm md:text-base"
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        maxLength={SERVICE_LIMITS.minimax}
                      />
                      <div className="absolute bottom-2 right-2 text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/80">
                        {text.length}/{SERVICE_LIMITS.minimax.toLocaleString()}
                      </div>
                    </div>

                    {audioVisualizer && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="w-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-2 rounded-lg border border-primary/10"
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

                    <div className="flex flex-wrap gap-2">
                      <RequireAuth>
                        <Button
                          onClick={handleSpeak}
                          className="flex-1 h-9 text-sm bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 rounded-md shadow-sm hover:shadow-md"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <div className="flex items-center">
                              <div className="h-3.5 w-3.5 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                              {t('processing')}
                            </div>
                          ) : (
                            <>
                              <Volume2 className="mr-1.5 h-3.5 w-3.5" />
                              {t('readText')}
                            </>
                          )}
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
                              className="h-9 w-9 border-primary/20 hover:border-primary/40 rounded-md shadow-sm"
                            >
                              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                          </RequireAuth>
                        </motion.div>
                      )}

                      <RequireAuth>
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          className="flex-1 h-9 text-sm border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-md shadow-sm"
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          {t('downloadAudio')}
                        </Button>
                      </RequireAuth>
                    </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 额度不足弹窗 */}
        <InsufficientCreditsDialog
          open={showInsufficientCreditsDialog}
          onOpenChange={setShowInsufficientCreditsDialog}
          type="clone"
        />
        </div>
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
    </>
  );
}

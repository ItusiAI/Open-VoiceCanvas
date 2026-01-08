"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Upload, Download, Pause, Play, Mic, Square, Trash2, Settings, FileText, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/language-context";
import { synthesizeSpeech, playMinimaxAudio, downloadAudio } from "@/lib/polly-service";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { NavBar } from "@/components/nav-bar";
import { motion } from "framer-motion";
import { RequireAuth } from "@/components/require-auth";
import { useSession } from "next-auth/react";
import { useAnalytics } from '@/hooks/use-analytics';
import { VoiceSelector } from '@/components/voice-selector';
import { VoiceOption } from "@/lib/voice-config";
import { VoiceId } from "@aws-sdk/client-polly";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { VoiceTitleUpdater } from "./title-updater";
import { InsufficientCreditsDialog } from "@/components/InsufficientCreditsDialog";

interface Language {
  code: string;
  nameKey: 'chinese' | 'english' | 'japanese' | 'korean' | 'spanish' | 'french' | 'russian' | 'italian' | 'portuguese' | 'german' | 'indonesian' | 'arabic' | 'cantonese' | 'danish' | 'dutch' | 'finnish' | 'greek' | 'hebrew' | 'hindi' | 'hungarian' | 'norwegian' | 'polish' | 'romanian' | 'swedish' | 'turkish' | 'welsh' | 'britishEnglish' | 'australianEnglish' | 'mexicanSpanish' | 'usSpanish' |  'canadianFrench' | 'belgianFrench' | 'brazilianPortuguese' | 'austrianGerman' | 'swissGerman' | 'uaeArabic' | 'belgianDutch' | 'indianEnglish' | 'welshEnglish' | 'irishEnglish' | 'newZealandEnglish' | 'southAfricanEnglish' | 'singaporeanEnglish' | 'icelandic' | 'catalan' | 'czech' | 'vietnamese' | 'ukrainian' | 'thai' | 'afrikaans' | 'bulgarian' | 'croatian' | 'lithuanian' | 'latvian' | 'macedonian' | 'malay' | 'persian' | 'filipino' | 'nynorsk' | 'serbian' | 'slovak' | 'slovenian' | 'swahili' | 'tamil' | 'urdu' | 'traditionalChinese' | 'saudiArabic';
}

interface CloneQuota {
  remaining_clones: number;
  used_clones: number;
}

interface ClonedVoice {
  id: string;
  voiceId: string;
  name: string;
  createdAt: string;
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
] as const;

const SERVICE_LIMITS = {
  minimax: 10000  // Minimax 最大支持 10,000 字符
};

// 支持的情绪类型
type EmotionType = "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral";

export default function Cloning() {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("zh-CN");
  const [speed, setSpeed] = useState(1);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const [audioVisualizer, setAudioVisualizer] = useState<{
    audioContext: AudioContext;
    source: AudioBufferSourceNode;
    url: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { data: session } = useSession();
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const analytics = useAnalytics();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [cloneQuota, setCloneQuota] = useState<CloneQuota>({ remaining_clones: 0, used_clones: 0 });
  const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] = useState(false);
  const router = useRouter();
  
  // 高级音频选项
  const [vol, setVol] = useState(1); // 音量，范围(0,10]
  const [pitch, setPitch] = useState(0); // 语调，范围[-12,12]
  const [sampleRate, setSampleRate] = useState<number>(32000); // 采样率，默认32000
  const [bitrate, setBitrate] = useState<number>(128000); // 比特率，默认128000
  const [channel, setChannel] = useState<number>(2); // 声道数，默认2(双声道)
  const [emotion, setEmotion] = useState<EmotionType | undefined>(undefined); // 情绪

  // 有效的采样率选项
  const SAMPLE_RATES = [8000, 16000, 22050, 24000, 32000, 44100];

  // 有效的比特率选项
  const BITRATES = [32000, 64000, 128000, 256000];

  // 在组件顶层定义错误消息
  const errorMessages = {
    uploadAudioFirst: t("uploadAudioFirst"),
    audioUploadRequirements: t("audioUploadRequirements"),
    loginRequired: t("loginRequired"),
    loginForCloning: t("loginForCloning"),
    fetchUserDataError: t("fetchUserDataError"),
    insufficientCloneCredits: t("insufficientCloneCredits"),
    buyMoreCredits: t("buyMoreCredits"),
    startCloningTitle: t("startCloningTitle"),
    startCloningDesc: t("startCloningDesc"),
    cloneVoiceFailed: t("cloneVoiceFailed"),
    invalidVoiceId: t("invalidVoiceId"),
    cloneSuccess: t("cloneSuccess"),
    cloneReadyToUse: t("cloneReadyToUse"),
    cloneError: t("cloneError"),
    unknownError: t("unknownError"),
    invalidResponse: t("invalidResponse") || "Invalid response from server"
  };

  // 在组件顶层定义所有翻译消息
  const messages = {
    // 已有的错误消息
    ...errorMessages,
    // 新增的其他消息
    error: t("error"),
    fetchCloneVoicesError: t("fetchCloneVoicesError"),
    deleteSuccess: t("deleteSuccess"),
    cloneVoiceDeleted: t("cloneVoiceDeleted"),
    deleteCloneVoiceError: t("deleteCloneVoiceError"),
    recordingComplete: t("recordingComplete"),
    recordingSaved: (filename: string, size: string) => t("recordingSaved", { filename, size }),
    startRecordingTitle: t("startRecordingTitle"),
    startRecordingDesc: t("startRecordingDesc"),
    microphoneAccessError: t("microphoneAccessError"),
    clonedVoice: t("clonedVoice")
  };

  useEffect(() => {
    setMounted(true);
    // 从 localStorage 读取保存的声音ID
    const savedVoiceId = localStorage.getItem('clonedVoiceId');
    if (savedVoiceId) {
      setSelectedVoice({
        id: savedVoiceId,
        gender: 'Female',
        provider: 'minimax',
        name: t('clonedVoice'),
      });
    }
  }, []);

  // 返回顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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

      const audioData = await synthesizeSpeech({
        text,
        language: selectedLanguage,
        voiceId: selectedVoice?.id || '',
        speed: speed,
        service: 'minimax',
        useClonedVoice: !!selectedVoice,
        vol,
        pitch,
        sampleRate,
        bitrate,
        channel,
        emotion
      });

      const { audioContext, source } = await playMinimaxAudio(audioData, speed);
      setAudioVisualizer({ audioContext, source, url: '' });
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

      const audioData = await synthesizeSpeech({
        text,
        language: selectedLanguage,
        voiceId: selectedVoice.id as VoiceId,
        engine: selectedVoice.engine,
        speed,
        service: 'minimax',
        useClonedVoice: !!selectedVoice,
        vol,
        pitch,
        sampleRate,
        bitrate,
        channel,
        emotion
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audio_${selectedLanguage}_${timestamp}.mp3`;
      await downloadAudio(audioData, filename);
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

  // 跟踪语言切换
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    analytics.trackEvent('change_language', 'settings', value);
  };

  // 处理音频文件上传
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: t("error"),
          description: t("audioUploadRequirements"),
          variant: "destructive",
        });
        return;
      }

      // 检查文件大小（5MB限制）
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast({
          title: t("error"),
          description: t("fileSizeExceeded", { size: (file.size / 1024 / 1024).toFixed(2) }),
          variant: "destructive",
        });
        return;
      }

      // 检查音频时长
      const audio = new Audio();
      const duration = await new Promise<number>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => reject(new Error(t('audioDurationError')));
        audio.src = URL.createObjectURL(file);
      });

      if (duration < 10) { // 最小10秒
        toast({
          title: t("error"),
          description: t("minDurationError"),
          variant: "destructive",
        });
        URL.revokeObjectURL(audio.src);
        return;
      }

      if (duration > 300) { // 最大5分钟
        toast({
          title: t("error"),
          description: t("maxDurationError"),
          variant: "destructive",
        });
        URL.revokeObjectURL(audio.src);
        return;
      }

      setAudioFile(file);
      toast({
        title: t("audioFileSelectedTitle"),
        description: t("audioFileSelectedDesc", { 
          filename: file.name, 
          size: (file.size / 1024 / 1024).toFixed(2),
          duration: Math.round(duration)
        }),
      });
      URL.revokeObjectURL(audio.src);
    } catch (error) {
      console.error(t("uploadError"), error);
      toast({
        title: t("error"),
        description: t("uploadError"),
        variant: "destructive",
      });
    }
  };

  // 获取用户的克隆声音列表
  const fetchClonedVoices = async () => {
    try {
      const response = await fetch('/api/voice/cloned-voices');
      
      // 如果是未登录或其他预期的错误状态，静默处理
      if (response.status === 401 || response.status === 404) {
        setClonedVoices([]);
        return;
      }

      const data = await response.json();

      // 确保返回的是数组
      if (Array.isArray(data)) {
        setClonedVoices(data);
      } else {
        setClonedVoices([]);
      }
    } catch (error) {
      // 静默处理错误，只设置空数组
      setClonedVoices([]);
      // 仅在开发环境下记录错误
      if (process.env.NODE_ENV === 'development') {
        console.log('获取克隆语音列表:', error);
      }
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchClonedVoices();
    } else {
      setClonedVoices([]);
    }
  }, [session]);

  // 删除克隆声音
  const handleDeleteClonedVoice = async (id: string) => {
    try {
      const response = await fetch('/api/voice/cloned-voices', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        throw new Error(messages.deleteCloneVoiceError);
      }

      // 更新列表
      setClonedVoices(prev => prev.filter(voice => voice.id !== id));
      
      // 如果当前选中的是被删除的声音，清除选择
      if (selectedVoice?.id === id) {
        setSelectedVoice(null);
      }

      toast({
        title: messages.deleteSuccess,
        description: messages.cloneVoiceDeleted,
      });
    } catch (error) {
      console.error(messages.deleteCloneVoiceError, error);
      toast({
        title: messages.error,
        description: messages.deleteCloneVoiceError,
        variant: "destructive",
      });
    }
  };

  // 克隆声音
  const handleCloneVoice = async () => {
    setIsCloning(true);
    setErrorMessage("");

    try {
      if (!audioFile) {
        toast({
          title: t('error'),
          description: t('noAudioFile'),
          variant: "destructive",
        });
        return;
      }

      // 检查用户是否登录
      if (!session?.user) {
        toast({
          title: t('loginRequired'),
          description: t('loginToCloneVoice'),
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

      // 检查用户克隆配额
      try {
        const quotaResponse = await fetch('/api/user/plan');
        if (!quotaResponse.ok) {
          toast({
            title: t('error'),
            description: t('planInfoFetchFailed'),
            variant: "destructive",
          });
          return;
        }

        const quotaData = await quotaResponse.json();
        const { cloneCredits, usedClones } = quotaData;
        
        if (cloneCredits - usedClones <= 0) {
          setShowInsufficientCreditsDialog(true);
          return;
        }
      } catch (error) {
        console.error('获取用户配额信息失败:', error);
        toast({
          title: t('error'),
          description: t('planInfoFetchFailed'),
          variant: "destructive",
        });
        return;
      }

      // 创建表单数据
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (selectedVoice?.name) {
        formData.append('name', selectedVoice.name);
      }

      // 发送克隆请求
      const response = await fetch('/api/voice/clone', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // 检查是否是额度不足错误
        if (response.status === 403 && errorData.error === 'Insufficient clone credits') {
          setShowInsufficientCreditsDialog(true);
          return;
        }
        throw new Error(errorData.message || 'Voice cloning failed');
      }

      const data = await response.json();
      console.log('克隆成功:', data);

      setClonedVoices(prev => [...prev, {
        id: data.savedVoice.voiceId,
        voiceId: data.savedVoice.voiceId,
        name: data.savedVoice.name,
        createdAt: new Date().toISOString()
      }]);
      toast({
        title: t('success'),
        description: t('voiceCloningSuccess'),
      });

      // 更新用户声音列表
      fetchClonedVoices();
    } catch (error) {
      console.error('克隆失败:', error);
      setErrorMessage((error as Error).message || 'Unknown error');
      toast({
        title: t('error'),
        description: (error as Error).message || t('voiceCloningFailed'),
        variant: "destructive",
      });
    } finally {
      setIsCloning(false);
    }
  };

  // 重置音频文件
  const handleResetAudio = () => {
    setAudioFile(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  // 处理录音
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
        setAudioFile(file);
        setRecordedChunks([]);
        toast({
          title: messages.recordingComplete,
          description: messages.recordingSaved(
            file.name,
            (file.size / 1024 / 1024).toFixed(2)
          ),
        });
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast({
        title: messages.startRecordingTitle,
        description: messages.startRecordingDesc,
      });
    } catch (error) {
      console.error(messages.error, error);
      toast({
        title: messages.error,
        description: messages.microphoneAccessError,
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      <VoiceTitleUpdater />
      <NavBar />
      <main className="container mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8">
        <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-blue-500/5 to-pink-500/5 rounded-xl"></div>
          <CardHeader className="border-b border-primary/10 pb-4 md:pb-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent text-center">
                {t('voiceCloning')}
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6 relative z-10">
            <div className="space-y-4 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="h-full backdrop-blur-sm bg-background/80 border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader className="space-y-1 md:space-y-2 pb-3">
                      <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {t('uploadAudio')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <RequireAuth>
                            <Button
                              variant="outline"
                              onClick={() => audioInputRef.current?.click()}
                              disabled={isCloning || isRecording}
                              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 h-9 shadow-sm hover:shadow-md transition-all duration-300 rounded-md"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              {t('uploadAudio')}
                            </Button>
                          </RequireAuth>
                          <RequireAuth>
                            <Button
                              variant="outline"
                              onClick={isRecording ? handleStopRecording : handleStartRecording}
                              disabled={isCloning}
                              className={cn(
                                "text-white h-9 shadow-sm hover:shadow-md transition-all duration-300 rounded-md",
                                isRecording 
                                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                  : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
                              )}
                            >
                              {isRecording ? (
                                <>
                                  <Square className="w-3.5 h-3.5 mr-1.5" />
                                  {t('stopRecording')}
                                </>
                              ) : (
                                <>
                                  <Mic className="w-3.5 h-3.5 mr-1.5" />
                                  {t('record')}
                                </>
                              )}
                            </Button>
                          </RequireAuth>
                        </div>
                        {audioFile && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg border border-primary/5"
                          >
                            {t('fileSelected', { 
                              filename: audioFile.name, 
                              size: (audioFile.size / 1024 / 1024).toFixed(2) 
                            })}
                          </motion.div>
                        )}
                        <input
                          type="file"
                          ref={audioInputRef}
                          className="hidden"
                          accept="audio/*"
                          onChange={handleAudioUpload}
                        />
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-9 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300 rounded-md"
                            onClick={handleCloneVoice}
                            disabled={!audioFile || isCloning || isRecording}
                          >
                            {isCloning ? (
                              <div className="flex items-center">
                                <div className="h-3.5 w-3.5 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                {t('cloning')}
                              </div>
                            ) : (
                              t('startCloning')
                            )}
                          </Button>
                        </motion.div>
                        {selectedVoice && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-2 bg-muted/30 rounded-lg border border-primary/5"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">{t('voiceId')}</span> 
                                <span className="ml-1 text-primary/80">{selectedVoice.id}</span>
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  localStorage.removeItem('clonedVoiceId');
                                  setSelectedVoice(null);
                                  toast({
                                    title: t("clear"),
                                    description: t("clearClonedVoice"),
                                  });
                                }}
                                className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              >
                                {t('clear')}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Card className="h-full backdrop-blur-sm bg-background/80 border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader className="space-y-1 md:space-y-2 pb-3">
                      <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {t('instructions')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="space-y-3">
                          <p className="pl-3 border-l-2 border-blue-500/40 py-1">{t('instruction1')}</p>
                          <p className="pl-3 border-l-2 border-purple-500/40 py-1">{t('instruction2')}</p>
                          <p className="pl-3 border-l-2 border-pink-500/40 py-1">{t('instruction3')}</p>
                          <p className="pl-3 border-l-2 border-red-500/40 py-1">{t('instruction4')}</p>
                          <p className="pl-3 border-l-2 border-orange-500/40 py-1">{t('instruction5')}</p>
                          <p className="pl-3 border-l-2 border-emerald-500/40 py-1">{t('instruction6')}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-primary/10">
                          <p className="text-xs text-red-500">{t('legalNotice')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card className="h-full backdrop-blur-sm bg-background/80 border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader className="space-y-1 md:space-y-2 pb-3">
                      <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {t('serviceSettings')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 pt-0">
                      <div className="space-y-3 md:space-y-4">
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

                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">{t('voice')}</Label>
                          {selectedLanguage && (
                            <VoiceSelector
                              languageCode={selectedLanguage}
                              onVoiceSelect={setSelectedVoice}
                              selectedVoiceId={selectedVoice?.id}
                              provider="minimax"
                              clonedVoices={clonedVoices.map(voice => ({
                                id: voice.voiceId,
                                provider: 'minimax',
                                name: voice.name,
                                gender: 'Female'
                              }))}
                            />
                          )}
                        </div>

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
                            min={-12}
                            max={12}
                            step={1}
                            className="py-2"
                            defaultValue={[0]}
                          />
                        </div>

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
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Card className="h-full backdrop-blur-sm bg-background/80 border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
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

                        <RequireAuth>
                          <Button
                            variant="outline"
                            className="flex-1 h-9 text-sm border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-md shadow-sm"
                            asChild
                          >
                            <label>
                              <Upload className="mr-1.5 h-3.5 w-3.5" />
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
                </motion.div>
              </div>
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

      {/* 额度不足弹窗 */}
      <InsufficientCreditsDialog
        open={showInsufficientCreditsDialog}
        onOpenChange={setShowInsufficientCreditsDialog}
        type="clone"
      />
    </div>
  );
}
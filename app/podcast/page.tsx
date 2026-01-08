'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavBar } from "@/components/nav-bar";
import { RequireAuth } from "@/components/require-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/lib/i18n/language-context';
import { useSession } from "next-auth/react";
import {
  Mic,
  Play,
  Pause,
  Download,
  Loader2,
  Radio,
  Users,
  MessageSquare,
  Volume2,
  Sparkles,
  Edit3,
  Check,
  X,
  CheckCircle2,
  ChevronUp
} from "lucide-react";

// 播客页面标题更新器
function PodcastTitleUpdater() {
  const { t } = useLanguage();
  useEffect(() => {
    document.title = t('podcastPageTitle');
  }, [t]);
  return null;
}

interface DialogueSegment {
  speaker: 'host' | 'guest';
  text: string;
  audio?: string;
  isGenerating?: boolean;
}

// 克隆音色类型定义
interface ClonedVoice {
  id: string;
  voiceId: string;
  name: string;
  createdAt: string;
}

// 设计音色类型定义
interface DesignedVoice {
  id: string;
  voiceId: string;
  name: string;
  language: string;
  description: string;
  createdAt: string;
}

// 音色配置 - 动态构建，包含克隆音色和设计音色
const buildVoiceOptions = (clonedVoices: ClonedVoice[], designedVoices: DesignedVoice[]) => {
  const voiceOptions: any = {};

  // 首先添加克隆音色分类（如果有的话）
  if (clonedVoices.length > 0) {
    voiceOptions.cloned = {
      voices: clonedVoices.map(voice => ({
        id: voice.voiceId,
        gender: 'female', // 默认为女性，实际应该从数据库获取
        name: voice.name
      }))
    };
  }

  // 然后添加设计音色分类（如果有的话）
  if (designedVoices.length > 0) {
    voiceOptions.designed = {
      voices: designedVoices.map(voice => ({
        id: voice.voiceId,
        gender: 'female', // 默认为女性，实际应该从数据库获取
        name: voice.name
      }))
    };
  }

  // 最后添加官方音色分类
  voiceOptions.presenter = {
    voices: [
      { id: 'presenter_male', gender: 'male' },
      { id: 'presenter_female', gender: 'female' },
    ]
  };

  voiceOptions.audiobook = {
    voices: [
      { id: 'audiobook_male_1', gender: 'male' },
      { id: 'audiobook_male_2', gender: 'male' },
      { id: 'audiobook_female_1', gender: 'female' },
      { id: 'audiobook_female_2', gender: 'female' },
    ]
  };

  voiceOptions.basic = {
    voices: [
      { id: 'male-qn-qingse', gender: 'male' },
      { id: 'male-qn-jingying', gender: 'male' },
      { id: 'male-qn-badao', gender: 'male' },
      { id: 'male-qn-daxuesheng', gender: 'male' },
      { id: 'female-shaonv', gender: 'female' },
      { id: 'female-yujie', gender: 'female' },
      { id: 'female-chengshu', gender: 'female' },
      { id: 'female-tianmei', gender: 'female' },
    ]
  };

  voiceOptions.premium = {
    voices: [
      { id: 'male-qn-qingse-jingpin', gender: 'male' },
      { id: 'male-qn-jingying-jingpin', gender: 'male' },
      { id: 'female-yujie-jingpin', gender: 'female' },
      { id: 'female-tianmei-jingpin', gender: 'female' },
    ]
  };

  voiceOptions.character = {
    voices: [
      { id: 'xiaoxiao_xuejie', gender: 'female' },
      { id: 'wennuan_dage', gender: 'male' },
      { id: 'qingchun_nanshen', gender: 'male' },
      { id: 'zhiyu_jiejie', gender: 'female' },
      { id: 'yangguang_nanhai', gender: 'male' },
      { id: 'wenrou_xiaojie', gender: 'female' },
      { id: 'chenwen_dage', gender: 'male' },
      { id: 'huoli_shaonv', gender: 'female' },
      { id: 'chengwen_nanshi', gender: 'male' },
      { id: 'tianmei_nvhai', gender: 'female' },
      { id: 'shuai_xiaohuo', gender: 'male' },
      { id: 'zhixing_jiejie', gender: 'female' },
      { id: 'yangqi_nansheng', gender: 'male' },
      { id: 'qingxin_nvsheng', gender: 'female' },
      { id: 'wenya_xiansheng', gender: 'male' },
      { id: 'huopo_xiaomei', gender: 'female' },
      { id: 'chengshu_dage', gender: 'male' },
      { id: 'qingchun_meizi', gender: 'female' },
      { id: 'wending_nanren', gender: 'male' },
      { id: 'danya_xuejie', gender: 'female' },
    ]
  };

  return voiceOptions;
};

export default function PodcastPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueSegment[]>([]);
  const [previewDialogue, setPreviewDialogue] = useState<DialogueSegment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<Set<number>>(new Set());
  const [isMergingAudio, setIsMergingAudio] = useState(false);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [designedVoices, setDesignedVoices] = useState<DesignedVoice[]>([]);
  const [hostVoice, setHostVoice] = useState('presenter_female');
  const [guestVoice, setGuestVoice] = useState('female-tianmei-jingpin');
  const [language, setLanguage] = useState('zh-CN');
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();

  // 获取用户的克隆音色列表
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

  // 获取用户的设计音色列表
  const fetchDesignedVoices = async () => {
    try {
      const response = await fetch('/api/voice/designed-voices');

      // 如果是未登录或其他预期的错误状态，静默处理
      if (response.status === 401 || response.status === 404) {
        setDesignedVoices([]);
        return;
      }

      const data = await response.json();

      // 确保返回的是数组
      if (Array.isArray(data)) {
        setDesignedVoices(data);
      } else {
        setDesignedVoices([]);
      }
    } catch (error) {
      // 静默处理错误，只设置空数组
      setDesignedVoices([]);
      // 仅在开发环境下记录错误
      if (process.env.NODE_ENV === 'development') {
        console.log('获取设计音色列表:', error);
      }
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchClonedVoices();
      fetchDesignedVoices();
    } else {
      setClonedVoices([]);
      setDesignedVoices([]);
    }
  }, [session]);

  // 返回顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };



  // 生成播客对话预览
  const generateDialogue = async () => {
    if (!content.trim()) {
      toast({
        title: t('errorTitle'),
        description: t('inputPodcastContentError'),
        variant: "destructive",
      });
      return;
    }

    // 预估字符消耗（按输入内容字数计算）
    const estimatedCharacters = content.length * 2;

    // 检查用户字符配额
    try {
      const quotaResponse = await fetch('/api/user/plan');
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();

        const { permanentQuota, temporaryQuota, usedCharacters, quotaExpiry } = quotaData.characterQuota;
        const totalQuota = permanentQuota + (quotaExpiry && new Date(quotaExpiry) > new Date() ? temporaryQuota : 0);
        const remainingQuota = totalQuota - usedCharacters;

        if (remainingQuota < estimatedCharacters) {
          toast({
            title: t('characterQuotaInsufficientTitle'),
            description: t('characterQuotaInsufficientDesc', {
              contentLength: content.length,
              required: estimatedCharacters,
              remaining: remainingQuota
            }),
            variant: "destructive",
          });
          return;
        }

        // 如果配额紧张，给出警告
        if (remainingQuota < estimatedCharacters * 2) {
          toast({
            title: t('quotaReminderTitle'),
            description: t('quotaReminderDesc', {
              remaining: remainingQuota,
              required: estimatedCharacters
            }),
          });
        }
      } else {
        toast({
          title: t('quotaCheckFailedTitle'),
          description: t('quotaCheckFailedDesc'),
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Quota check failed:', error);
      toast({
        title: t('quotaCheckFailedTitle'),
        description: t('quotaServiceUnavailableDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setPreviewDialogue([]);
    setShowPreview(false);

    try {
      const response = await fetch('/api/podcast/generate-dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('podcastGenerationFailed2'));
      }

      const data = await response.json();

      if (!data.success || !data.data?.segments) {
        throw new Error(t('dialogueFormatError'));
      }

      // 转换API响应格式为组件需要的格式
      const dialogueSegments: DialogueSegment[] = data.data.segments.map((segment: any) => ({
        speaker: segment.role,
        text: segment.content
      }));

      setPreviewDialogue(dialogueSegments);
      setShowPreview(true);

      toast({
        title: t('podcastPreviewGenerationComplete'),
        description: t('podcastPreviewGenerated', { totalSegments: data.data.totalSegments }),
      });

    } catch (error) {
      console.error('Error generating dialogue:', error);
      toast({
        title: t('errorTitle'),
        description: error instanceof Error ? error.message : t('podcastGenerationFailed'),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 确认使用预览内容
  const confirmDialogue = () => {
    setDialogue([...previewDialogue]);
    setShowPreview(false);
    toast({
      title: t('confirmationSuccessTitle'),
      description: t('contentConfirmedDesc'),
    });
  };

  // 从预览直接生成所有音频
  const generateAllAudioFromPreview = async () => {
    // 先确认内容
    const confirmedDialogue = [...previewDialogue];

    // 计算总字符数
    const totalCharacters = confirmedDialogue.reduce((total, segment) => total + segment.text.length, 0) * 2;

    // 检查用户字符配额
    try {
      const quotaResponse = await fetch('/api/user/plan');
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();

        const { permanentQuota, temporaryQuota, usedCharacters, quotaExpiry } = quotaData.characterQuota;
        const totalQuota = permanentQuota + (quotaExpiry && new Date(quotaExpiry) > new Date() ? temporaryQuota : 0);
        const remainingQuota = totalQuota - usedCharacters;

        if (remainingQuota < totalCharacters) {
          toast({
            title: t('characterQuotaInsufficientTitle'),
            description: t('characterQuotaNeedDesc', {
              required: totalCharacters,
              remaining: remainingQuota
            }),
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: t('quotaCheckFailedTitle'),
          description: t('quotaCheckFailedDesc'),
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Quota check failed:', error);
      toast({
        title: t('quotaCheckFailedTitle'),
        description: t('quotaServiceUnavailableDesc'),
        variant: "destructive",
      });
      return;
    }

    setDialogue(confirmedDialogue);
    setShowPreview(false);

    const audioUrls: string[] = [];
    let successfulGenerations = 0;

    // Then generate all audio
    for (let i = 0; i < confirmedDialogue.length; i++) {
      setIsGeneratingAudio(prev => new Set(prev).add(i));

      try {
        const selectedVoice = confirmedDialogue[i].speaker === 'host' ? hostVoice : guestVoice;

        const response = await fetch('/api/podcast/generate-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: confirmedDialogue[i].text,
            speaker: confirmedDialogue[i].speaker,
            voiceId: selectedVoice,
            language: language
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('audioGenerationErrorDesc'));
        }

        const audioBlob = await response.blob();
        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type
        });

        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio URL created:', audioUrl);

        audioUrls[i] = audioUrl;
        successfulGenerations++;

        // Update dialogue segment audio URL
        setDialogue(prev => prev.map((seg, index) =>
          index === i ? { ...seg, audio: audioUrl } : seg
        ));

        toast({
          title: t('progressUpdateTitle'),
          description: t('segmentAudioCompleteDesc', {
            current: i + 1,
            total: confirmedDialogue.length
          }),
        });

      } catch (error) {
        console.error('Error generating audio:', error);
        toast({
          title: t('errorTitle'),
          description: t('podcastSegmentAudioGenerationFailed', {
            segment: i + 1,
            error: error instanceof Error ? error.message : t('podcastUnknownError')
          }),
          variant: "destructive",
        });
        return; // Stop if there's an error
      } finally {
        setIsGeneratingAudio(prev => {
          const newSet = new Set(prev);
          newSet.delete(i);
          return newSet;
        });
      }

      // Add delay to avoid API limits
      if (i < confirmedDialogue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // If there are successfully generated audio, deduct character quota
    if (successfulGenerations > 0) {
      try {
        const updateResponse = await fetch('/api/user/update-quota', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usedCharacters: totalCharacters,
          }),
        });

        if (!updateResponse.ok) {
          console.error('Character quota update failed');
        } else {
          console.log(`Character quota update successful, used characters: ${totalCharacters}`);
        }
      } catch (error) {
        console.error('Character quota update error:', error);
      }
    }

    // After all audio generation is complete, directly synthesize
    if (audioUrls.length === confirmedDialogue.length && audioUrls.every(url => url)) {
      toast({
        title: t('podcastAudioGenerationCompleteTitle'),
        description: t('podcastGeneratingCompletePodcastDesc'),
      });

      // Wait a bit to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Directly call synthesis function
      await mergeAudioFromUrls(audioUrls);
    } else {
      toast({
        title: t('podcastAudioGenerationCompleteTitle'),
        description: t('podcastAllSegmentAudioCompleteDesc'),
      });
    }
  };

  // Regenerate dialogue
  const regenerateDialogue = () => {
    generateDialogue();
  };

  // Start editing segment
  const startEditing = (index: number, text: string) => {
    setEditingIndex(index);
    setEditingText(text);
  };

  // Save edit
  const saveEdit = async (index: number) => {
    if (showPreview) {
      setPreviewDialogue(prev => prev.map((seg, i) =>
        i === index ? { ...seg, text: editingText } : seg
      ));
      setEditingIndex(null);
      setEditingText('');

      toast({
        title: t('podcastSaveSuccessTitle'),
        description: t('podcastDialogueContentUpdated'),
      });
    } else {
      // Get current segment info
      const currentSegment = dialogue[index];

      // Update dialogue content and clear audio for this segment
      setDialogue(prev => prev.map((seg, i) =>
        i === index ? { ...seg, text: editingText, audio: undefined } : seg
      ));

      setEditingIndex(null);
      setEditingText('');

      toast({
        title: t('podcastContentUpdated'),
        description: t('regeneratingSegmentAudioDesc'),
      });

      // Regenerate audio for this segment
      const characterCount = editingText.length;

      // Check character quota
      try {
        const quotaResponse = await fetch('/api/user/plan');
        if (quotaResponse.ok) {
          const quotaData = await quotaResponse.json();

          const { permanentQuota, temporaryQuota, usedCharacters, quotaExpiry } = quotaData.characterQuota;
          const totalQuota = permanentQuota + (quotaExpiry && new Date(quotaExpiry) > new Date() ? temporaryQuota : 0);
          const remainingQuota = totalQuota - usedCharacters;

          if (remainingQuota < characterCount) {
            toast({
              title: t('characterQuotaInsufficientTitle'),
              description: t('characterQuotaNeedDesc', {
                required: characterCount,
                remaining: remainingQuota
              }),
              variant: "destructive",
            });
            return;
          }
        } else {
          toast({
            title: t('quotaCheckFailedTitle'),
            description: t('quotaCheckFailedDesc'),
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Quota check failed:', error);
        toast({
          title: t('quotaCheckFailedTitle'),
          description: t('quotaServiceUnavailableDesc'),
          variant: "destructive",
        });
        return;
      }

      try {
        const selectedVoice = currentSegment.speaker === 'host' ? hostVoice : guestVoice;

        setIsGeneratingAudio(prev => new Set(prev).add(index));

        const response = await fetch('/api/podcast/generate-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: editingText,
            speaker: currentSegment.speaker,
            voiceId: selectedVoice,
            language: language
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('audioGenerationErrorDesc'));
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Update audio URL for this segment
        setDialogue(prev => prev.map((seg, i) =>
          i === index ? { ...seg, audio: audioUrl } : seg
        ));

        // Deduct character quota
        try {
          const updateResponse = await fetch('/api/user/update-quota', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usedCharacters: characterCount,
            }),
          });

          if (!updateResponse.ok) {
            console.error('Character quota update failed');
          } else {
            console.log(`Character quota update successful, used characters: ${characterCount}`);
          }
        } catch (error) {
          console.error('Character quota update error:', error);
        }

        toast({
          title: t('podcastAudioUpdateComplete'),
          description: t('regeneratingCompletePodcastDesc'),
        });

        // Wait a bit to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 500));

        // Re-synthesize complete audio
        await mergeAllAudio();

      } catch (error) {
        console.error('Error regenerating audio:', error);
        toast({
          title: t('podcastAudioGenerationFailed'),
          description: error instanceof Error ? error.message : t('podcastRegenerateAudioFailedMessage'),
          variant: "destructive",
        });
      } finally {
        setIsGeneratingAudio(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  // Generate single segment audio
  const generateAudio = async (index: number, segment: DialogueSegment) => {
    // Check character quota
    const characterCount = segment.text.length;

    try {
      const quotaResponse = await fetch('/api/user/plan');
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();

        const { permanentQuota, temporaryQuota, usedCharacters, quotaExpiry } = quotaData.characterQuota;
        const totalQuota = permanentQuota + (quotaExpiry && new Date(quotaExpiry) > new Date() ? temporaryQuota : 0);
        const remainingQuota = totalQuota - usedCharacters;

        if (remainingQuota < characterCount) {
          toast({
            title: t('characterQuotaInsufficientTitle'),
            description: t('characterQuotaNeedDesc', {
              required: characterCount,
              remaining: remainingQuota
            }),
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: t('quotaCheckFailedTitle'),
          description: t('quotaCheckFailedDesc'),
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Quota check failed:', error);
      toast({
        title: t('quotaCheckFailedTitle'),
        description: t('quotaServiceUnavailableDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(prev => new Set(prev).add(index));

    try {
      const selectedVoice = segment.speaker === 'host' ? hostVoice : guestVoice;

      const response = await fetch('/api/podcast/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: segment.text,
          speaker: segment.speaker,
          voiceId: selectedVoice,
          language: language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('audioGenerationErrorDesc'));
      }

      const audioBlob = await response.blob();
      console.log('Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Audio URL created:', audioUrl);

      // Update dialogue segment audio URL
      setDialogue(prev => prev.map((seg, i) =>
        i === index ? { ...seg, audio: audioUrl } : seg
      ));

      // Deduct character quota
      try {
        const updateResponse = await fetch('/api/user/update-quota', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usedCharacters: characterCount,
          }),
        });

        if (!updateResponse.ok) {
          console.error('Character quota update failed');
        } else {
          console.log(`Character quota update successful, used characters: ${characterCount}`);
        }
      } catch (error) {
        console.error('Character quota update error:', error);
      }

      toast({
        title: t('podcastSuccess'),
        description: t('audioGenerationCompleteDesc', {
          speaker: segment.speaker === 'host' ? t('podcastHost') : t('podcastGuest')
        }),
      });

    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: t('errorTitle'),
        description: error instanceof Error ? error.message : t('audioGenerationErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // Generate all audio
  const generateAllAudio = async () => {
    let hasNewAudio = false;

    for (let i = 0; i < dialogue.length; i++) {
      if (!dialogue[i].audio) {
        await generateAudio(i, dialogue[i]);
        hasNewAudio = true;
        // Add delay to avoid API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // If new audio is generated, check if all audio is generated, then auto-synthesize
    if (hasNewAudio) {
      // Wait a bit to ensure all audio is updated to state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Re-check current dialogue state
      const currentDialogue = dialogue;
      const allHaveAudio = currentDialogue.every(seg => seg.audio);

      if (allHaveAudio && currentDialogue.length > 0) {
        toast({
          title: t('podcastAudioGenerationCompleteTitle'),
          description: t('podcastGeneratingCompletePodcastDesc'),
        });
        await mergeAllAudio();
      }
    }
  };

  // Synthesize complete audio
  const mergeAllAudio = async () => {
    const audioSegments = dialogue.filter(seg => seg.audio);

    if (audioSegments.length === 0) {
      toast({
        title: t('errorTitle'),
        description: t('noAudioSegmentsDesc'),
        variant: "destructive",
      });
      return;
    }

    if (audioSegments.length !== dialogue.length) {
      toast({
        title: t('quotaCheckFailedTitle'),
        description: t('missingAudioSegmentsDesc', {
          missing: dialogue.length - audioSegments.length
        }),
        variant: "destructive",
      });
      return;
    }

    setIsMergingAudio(true);

    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffers: AudioBuffer[] = [];

      // 并行加载所有音频段落
      const loadPromises = audioSegments.map(async (segment) => {
        if (segment.audio) {
          const response = await fetch(segment.audio);
          const arrayBuffer = await response.arrayBuffer();
          return audioContext.decodeAudioData(arrayBuffer);
        }
        return null;
      });

      const results = await Promise.all(loadPromises);
      audioBuffers.push(...results.filter(buffer => buffer !== null) as AudioBuffer[]);

      if (audioBuffers.length === 0) {
        throw new Error(t('podcastNoValidAudioData'));
      }

      // 计算总长度（包括段落间的静音间隔）
      const silenceDuration = 0.5; // 0.5秒静音间隔
      const silenceSamples = Math.floor(audioBuffers[0].sampleRate * silenceDuration);
      const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0) +
                         (audioBuffers.length - 1) * silenceSamples;

      // 创建合并后的音频缓冲区
      const mergedBuffer = audioContext.createBuffer(
        audioBuffers[0].numberOfChannels,
        totalLength,
        audioBuffers[0].sampleRate
      );

      // 合并音频（包括静音间隔）
      let offset = 0;
      for (let i = 0; i < audioBuffers.length; i++) {
        const buffer = audioBuffers[i];

        // 复制音频数据
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          mergedBuffer.getChannelData(channel).set(channelData, offset);
        }
        offset += buffer.length;

        // 添加静音间隔（除了最后一个段落）
        if (i < audioBuffers.length - 1) {
          offset += silenceSamples;
        }
      }

      // 转换为WAV格式
      const wavBlob = audioBufferToWav(mergedBuffer);
      const mergedUrl = URL.createObjectURL(wavBlob);

      setMergedAudioUrl(mergedUrl);

      toast({
        title: t('podcastGenerationSuccess'),
        description: t('completePodcastGeneratedDesc', {
          duration: Math.round(totalLength / audioBuffers[0].sampleRate)
        }),
      });

    } catch (error) {
      console.error('Audio merging error:', error);
      toast({
        title: t('podcastGenerationFailed2'),
        description: error instanceof Error ? error.message : t('audioGenerationErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsMergingAudio(false);
    }
  };

  // 音频缓冲区转WAV格式
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV文件头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // 写入音频数据
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // 直接从音频URL数组合成音频
  const mergeAudioFromUrls = async (audioUrls: string[]) => {
    setIsMergingAudio(true);

    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffers: AudioBuffer[] = [];

      // 并行加载所有音频URL
      const loadPromises = audioUrls.map(async (audioUrl) => {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        return audioContext.decodeAudioData(arrayBuffer);
      });

      const results = await Promise.all(loadPromises);
      audioBuffers.push(...results);

      if (audioBuffers.length === 0) {
        throw new Error(t('podcastNoValidAudioData'));
      }

      // 计算总长度（包括段落间的静音间隔）
      const silenceDuration = 0.5; // 0.5秒静音间隔
      const silenceSamples = Math.floor(audioBuffers[0].sampleRate * silenceDuration);
      const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0) +
                         (audioBuffers.length - 1) * silenceSamples;

      // 创建合并后的音频缓冲区
      const mergedBuffer = audioContext.createBuffer(
        audioBuffers[0].numberOfChannels,
        totalLength,
        audioBuffers[0].sampleRate
      );

      // 合并音频（包括静音间隔）
      let offset = 0;
      for (let i = 0; i < audioBuffers.length; i++) {
        const buffer = audioBuffers[i];

        // 复制音频数据
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          mergedBuffer.getChannelData(channel).set(channelData, offset);
        }
        offset += buffer.length;

        // 添加静音间隔（除了最后一个段落）
        if (i < audioBuffers.length - 1) {
          offset += silenceSamples;
        }
      }

      // 转换为WAV格式
      const wavBlob = audioBufferToWav(mergedBuffer);
      const mergedUrl = URL.createObjectURL(wavBlob);

      setMergedAudioUrl(mergedUrl);

      toast({
        title: t('podcastGenerationSuccess'),
        description: t('completePodcastGeneratedDesc', {
          duration: Math.round(totalLength / audioBuffers[0].sampleRate)
        }),
      });

    } catch (error) {
      console.error('Audio merging error:', error);
      toast({
        title: t('podcastGenerationFailed2'),
        description: error instanceof Error ? error.message : t('audioGenerationErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsMergingAudio(false);
    }
  };

  // 播放音频
  const playAudio = async (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    // 停止其他正在播放的音频
    audioRefs.current.forEach((ref, i) => {
      if (ref && i !== index) {
        ref.pause();
        ref.currentTime = 0;
      }
    });

    if (currentlyPlaying === index) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      try {
        // 重新加载音频以确保可以播放
        audio.load();
        await audio.play();
        setCurrentlyPlaying(index);
      } catch (error) {
        console.error('Audio play error:', error);
        toast({
          title: t('podcastPlaybackFailed'),
          description: t('podcastAudioPlaybackError'),
          variant: "destructive",
        });
      }
    }
  };

  // 下载音频
  const downloadAudio = (audioUrl: string, index: number, speaker: string) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    const speakerName = speaker === 'host' ? t('podcastHost') : t('podcastGuest');
    link.download = t('downloadFileName', { speaker: speakerName, segment: index + 1 });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  return (
    <RequireAuth>
      <div className="min-h-screen">
        <PodcastTitleUpdater />
        <NavBar />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">
          {/* 背景装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8 relative z-10">
            <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-blue-500/5 to-pink-500/5 rounded-xl"></div>
              <CardHeader className="pb-4 md:pb-6 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
                        <Radio className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">
                        {t('aiPodcast')}
                      </CardTitle>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t('podcastDescription')}
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-2">
                        {t('podcastSubDescription')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6 relative z-10">
                {/* 主题输入区域 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                          <MessageSquare className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <CardTitle className="text-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            {t('contentInputTitle')}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('contentInputDesc')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="relative">
                          <Textarea
                            placeholder={t('podcastContentPlaceholder')}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[300px] resize-none text-sm leading-relaxed pr-20"
                            maxLength={10000}
                          />
                          <div className="absolute bottom-3 right-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                              content.length > 9000
                                ? 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                : content.length > 7000
                                ? 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                                : 'bg-muted/80 text-muted-foreground'
                            }`}>
                              {content.length}/10000
                            </div>
                          </div>
                        </div>

                        {/* 内容长度提示 */}
                        {content.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                            <Sparkles className="w-4 h-4" />
                            <span>
                              {content.length < 200 && t('willGenerate4Segments')}
                              {content.length >= 200 && content.length < 500 && t('willGenerate6Segments')}
                              {content.length >= 500 && content.length < 1000 && t('willGenerate10Segments')}
                              {content.length >= 1000 && content.length < 2000 && t('willGenerate12Segments')}
                              {content.length >= 2000 && t('willGenerate15Segments')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 音色选择区域 */}
                      <Card className="bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 border-primary/10">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                              <Volume2 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <CardTitle className="text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                {t('podcastVoiceSettings')}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t('configureLanguageAndVoices')}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* 语言选择 */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <label className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {t('podcastLanguage')}
                              </label>
                            </div>
                            <Select value={language} onValueChange={setLanguage}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('selectPodcastLanguage')}>
                                  {language && (
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                        🌐
                                      </div>
                                      <span>{language === 'zh-CN' ? t('chineseSimplifiedDisplay') : language}</span>
                                    </div>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="zh-CN" className="[&_.lucide-check]:hidden">
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                        🇨🇳
                                      </div>
                                      <span>{t('chineseSimplified')}</span>
                                    </div>
                                    {language === 'zh-CN' && (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    )}
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 主持人音色选择 */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <label className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                  {t('hostVoice')}
                                </label>
                              </div>
                              <Select value={hostVoice} onValueChange={setHostVoice}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={t('selectHostVoice')}>
                                    {hostVoice && (() => {
                                      const voiceOptions = buildVoiceOptions(clonedVoices, designedVoices);
                                      const selectedVoice = Object.values(voiceOptions)
                                        .flatMap((cat: any) => cat.voices)
                                        .find((voice: any) => voice.id === hostVoice);
                                      return selectedVoice ? (
                                        <div className="flex items-center gap-3">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                            selectedVoice.gender === 'male'
                                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                              : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                                          }`}>
                                            {selectedVoice.gender === 'male' ? '♂' : '♀'}
                                          </div>
                                          <span>{selectedVoice.name || t(`voice-${selectedVoice.id}`)}</span>
                                        </div>
                                      ) : null;
                                    })()}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {Object.entries(buildVoiceOptions(clonedVoices, designedVoices)).map(([categoryKey, category]) => (
                                    <div key={categoryKey} className="space-y-1">
                                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 rounded-sm">
                                        {t(`voice-category-${categoryKey}`)}
                                      </div>
                                      {(category as any).voices.map((voice: any) => (
                                        <SelectItem key={voice.id} value={voice.id} className="pl-4 [&_.lucide-check]:hidden">
                                          <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                                voice.gender === 'male'
                                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                  : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                                              }`}>
                                                {voice.gender === 'male' ? '♂' : '♀'}
                                              </div>
                                              <span>{voice.name || t(`voice-${voice.id}`)}</span>
                                            </div>
                                            {hostVoice === voice.id && (
                                              <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </div>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* 嘉宾音色选择 */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <label className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                  {t('guestVoice')}
                                </label>
                              </div>
                              <Select value={guestVoice} onValueChange={setGuestVoice}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={t('selectGuestVoice')}>
                                    {guestVoice && (() => {
                                      const voiceOptions = buildVoiceOptions(clonedVoices, designedVoices);
                                      const selectedVoice = Object.values(voiceOptions)
                                        .flatMap((cat: any) => cat.voices)
                                        .find((voice: any) => voice.id === guestVoice);
                                      return selectedVoice ? (
                                        <div className="flex items-center gap-3">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                            selectedVoice.gender === 'male'
                                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                              : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                                          }`}>
                                            {selectedVoice.gender === 'male' ? '♂' : '♀'}
                                          </div>
                                          <span>{selectedVoice.name || t(`voice-${selectedVoice.id}`)}</span>
                                        </div>
                                      ) : null;
                                    })()}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {Object.entries(buildVoiceOptions(clonedVoices, designedVoices)).map(([categoryKey, category]) => (
                                    <div key={categoryKey} className="space-y-1">
                                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 rounded-sm">
                                        {t(`voice-category-${categoryKey}`)}
                                      </div>
                                      {(category as any).voices.map((voice: any) => (
                                        <SelectItem key={voice.id} value={voice.id} className="pl-4 [&_.lucide-check]:hidden">
                                          <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                                voice.gender === 'male'
                                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                  : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                                              }`}>
                                                {voice.gender === 'male' ? '♂' : '♀'}
                                              </div>
                                              <span>{voice.name || t(`voice-${voice.id}`)}</span>
                                            </div>
                                            {guestVoice === voice.id && (
                                              <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </div>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Button
                        onClick={generateDialogue}
                        disabled={isGenerating || !content.trim()}
                        size="lg"
                        className="w-full h-12 text-base bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {t('aiAnalyzingContent')}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            {t('generatePodcastPreview')}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>



                {/* 预览对话内容 */}
                {showPreview && previewDialogue.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="backdrop-blur-sm bg-background/80 border-orange-200/50 dark:border-orange-700/30 shadow-md">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10">
                              <MessageSquare className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                              <CardTitle className="text-xl bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
                                {t('podcastPreview')}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t('previewSegmentsInfo', {
                                  count: previewDialogue.length,
                                  segments: t('segmentsGenerated'),
                                  action: t('canDirectlyGenerateOrConfirm')
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={regenerateDialogue}
                              variant="outline"
                              size="sm"
                              disabled={isGenerating}
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              {t('podcastRegenerate')}
                            </Button>
                            <Button
                              onClick={confirmDialogue}
                              variant="outline"
                              size="sm"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {t('confirmContent')}
                            </Button>
                            <Button
                              onClick={generateAllAudioFromPreview}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                              size="sm"
                              disabled={isGeneratingAudio.size > 0}
                            >
                              <Volume2 className="w-4 h-4 mr-1" />
                              {isGeneratingAudio.size > 0 ? t('podcastGenerating') : t('generateAllAudio')}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {previewDialogue.map((segment, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: segment.speaker === 'host' ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={`flex ${segment.speaker === 'host' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`${editingIndex === index ? 'w-[85%]' : 'max-w-[85%]'} relative ${
                              segment.speaker === 'host'
                                ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200/50 dark:border-blue-700/30'
                                : 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-700/30'
                            } p-4 rounded-2xl shadow-sm`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    segment.speaker === 'host'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-purple-500 text-white'
                                  }`}>
                                    {segment.speaker === 'host' ? (
                                      <Mic className="w-3 h-3" />
                                    ) : (
                                      <Users className="w-3 h-3" />
                                    )}
                                  </div>
                                  <span className="font-medium text-sm">
                                    {segment.speaker === 'host' ? t('podcastHost') : t('podcastGuest')}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {editingIndex === index ? editingText.length : segment.text.length} {t('podcastCharacters')}
                                    {isGeneratingAudio.has(index) && (
                                      <span className="ml-2 text-orange-500">{t('generatingAudio')}</span>
                                    )}
                                  </span>
                                </div>
                                {editingIndex === index ? (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => saveEdit(index)}
                                      className="h-7 px-2 bg-green-500 hover:bg-green-600 text-white"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEdit}
                                      className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(index, segment.text)}
                                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>

                              {editingIndex === index ? (
                                <Textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="min-h-[100px] text-sm leading-relaxed resize-none border-none bg-transparent p-0 focus:ring-0 focus:outline-none"
                                  placeholder={t('podcastEditDialogueContentPlaceholder')}
                                  autoFocus
                                />
                              ) : (
                                <p className="text-sm leading-relaxed text-foreground/90">{segment.text}</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 对话内容显示区域 */}
                {dialogue.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10">
                              <Users className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <CardTitle className="text-xl bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                                {t('podcastContent')}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t('dialogueSegmentsCount', { count: dialogue.length })}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={generateAllAudio}
                            disabled={isGeneratingAudio.size > 0 || isMergingAudio}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                          >
                            <Volume2 className="w-4 h-4 mr-2" />
                            {isMergingAudio ? t('generatingPodcast') : isGeneratingAudio.size > 0 ? t('podcastGenerating') : t('generateAllAudio')}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 合成音频控制区域 - 置顶显示 */}
                        {mergedAudioUrl && (
                          <div className="mb-6">
                            <Card className="bg-gradient-to-r from-purple-50/50 via-pink-50/50 to-orange-50/50 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-orange-900/10 border-purple-200/50 dark:border-purple-700/30">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                    <Radio className="w-5 h-5 text-purple-500" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                                      {t('completePodcastAudio')}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {dialogue.length} {t('segmentsGenerated')}
                                    </p>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-4">
                                  <audio
                                    controls
                                    src={mergedAudioUrl}
                                    className="flex-1"
                                    preload="metadata"
                                  />
                                  <Button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = mergedAudioUrl;
                                      link.download = t('completePodcastFileName', { date: new Date().toISOString().slice(0, 10) });
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    {t('downloadCompleteAudio')}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        {dialogue.map((segment, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: segment.speaker === 'host' ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={`flex ${segment.speaker === 'host' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`${editingIndex === index ? 'w-[85%]' : 'max-w-[85%]'} relative ${
                              segment.speaker === 'host'
                                ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200/50 dark:border-blue-700/30'
                                : 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-700/30'
                            } p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300`}>
                              {/* 角色标识 */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    segment.speaker === 'host'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-purple-500 text-white'
                                  }`}>
                                    {segment.speaker === 'host' ? (
                                      <Mic className="w-4 h-4" />
                                    ) : (
                                      <Users className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-sm">
                                      {segment.speaker === 'host' ? t('podcastHost') : t('podcastGuest')}
                                    </span>
                                    <div className={`w-12 h-0.5 mt-1 ${
                                      segment.speaker === 'host' ? 'bg-blue-500' : 'bg-purple-500'
                                    }`} />
                                  </div>
                                </div>
                                {editingIndex === index ? (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => saveEdit(index)}
                                      className="h-7 px-2 bg-green-500 hover:bg-green-600 text-white"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEdit}
                                      className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(index, segment.text)}
                                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                    disabled={editingIndex !== null}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>

                              {/* 对话内容 */}
                              {editingIndex === index ? (
                                <Textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="min-h-[100px] text-sm leading-relaxed resize-none border-none bg-transparent p-0 focus:ring-0 focus:outline-none mb-4"
                                  placeholder={t('podcastEditDialogueContentPlaceholder')}
                                  autoFocus
                                />
                              ) : (
                                <p className="text-sm leading-relaxed mb-4 text-foreground/90">{segment.text}</p>
                              )}
                              
                              {/* 音频控制区域 */}
                              <div className="flex items-center justify-between pt-3 border-t border-current/10">
                                <div className="flex items-center gap-2">
                                  {segment.audio ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => playAudio(index)}
                                        className={`h-9 px-3 ${
                                          currentlyPlaying === index
                                            ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                                            : ''
                                        }`}
                                      >
                                        {currentlyPlaying === index ? (
                                          <>
                                            <Pause className="w-4 h-4 mr-1" />
                                            {t('pauseButton')}
                                          </>
                                        ) : (
                                          <>
                                            <Play className="w-4 h-4 mr-1" />
                                            {t('playButton')}
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadAudio(segment.audio!, index, segment.speaker)}
                                        className="h-9 px-3"
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        {t('downloadButton')}
                                      </Button>
                                      <audio
                                        ref={(el) => audioRefs.current[index] = el}
                                        src={segment.audio}
                                        preload="metadata"
                                        onEnded={() => setCurrentlyPlaying(null)}
                                        onPause={() => setCurrentlyPlaying(null)}
                                        onPlay={() => setCurrentlyPlaying(index)}
                                        onError={(e) => {
                                          console.error('Audio error:', e);
                                          toast({
                                            title: t('podcastAudioErrorTitle'),
                                            description: t('podcastAudioFileLoadFailed'),
                                            variant: "destructive",
                                          });
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => generateAudio(index, segment)}
                                      disabled={isGeneratingAudio.has(index)}
                                      className={`h-9 px-4 ${
                                        segment.speaker === 'host'
                                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                          : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                                      } text-white transition-all duration-300`}
                                    >
                                      {isGeneratingAudio.has(index) ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          {t('generatingButton')}
                                        </>
                                      ) : (
                                        <>
                                          <Volume2 className="w-4 h-4 mr-1" />
                                          {t('generateAudioButton')}
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>

                                {/* 字符统计 */}
                                <span className="text-xs text-muted-foreground">
                                  {segment.text.length} {t('podcastCharacters')}
                                  {isGeneratingAudio.has(index) && (
                                    <span className="ml-2 text-orange-500">{t('generatingAudio')}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
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
    </RequireAuth>
  );
}

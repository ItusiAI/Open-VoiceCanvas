"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Download, Pause, Play, BookOpen, Wand2, Loader2, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/language-context";
import { synthesizeSpeech, playMinimaxAudio, downloadAudio } from "@/lib/polly-service";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { NavBar } from "@/components/nav-bar";
import { motion } from "framer-motion";
import { RequireAuth } from "@/components/require-auth";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { StoryTitleUpdater } from "./title-updater";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 故事角色类型定义
interface StoryCharacter {
  name: string;
  role: string;
  voiceId: string;
  gender: 'male' | 'female';
  description: string;
  emotion?: string; // 新增：角色情绪
}

// 故事段落类型定义
interface StorySegment {
  id: string;
  type: 'narration' | 'dialogue';
  character?: string;
  text: string;
  voiceId: string;
  emotion?: string; // 新增：段落情绪
  audioData?: ArrayBuffer;
  isGenerating?: boolean; // 新增：生成状态
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

// 可用的情绪选项 - 根据语言返回对应的情绪名称
const getAvailableEmotions = (t: any) => [
  { id: "none", name: t('noEmotion') },
  { id: "happy", name: t('emotion_happy') },
  { id: "sad", name: t('emotion_sad') },
  { id: "angry", name: t('emotion_angry') },
  { id: "fearful", name: t('emotion_fearful') },
  { id: "surprised", name: t('emotion_surprised') },
  { id: "neutral", name: t('emotion_neutral') },
  { id: "disgusted", name: t('emotion_disgusted') },
];

// 可用的音色选项
const AVAILABLE_VOICES = [
  // 基础男声
  { id: "male-qn-qingse", name: "清澈男声", gender: "male" },
  { id: "male-qn-jingying", name: "精英男声", gender: "male" },
  { id: "male-qn-badao", name: "霸道男声", gender: "male" },
  { id: "male-qn-daxuesheng", name: "大学生男声", gender: "male" },
  
  // 基础女声
  { id: "female-shaonv", name: "少女音", gender: "female" },
  { id: "female-yujie", name: "御姐音", gender: "female" },
  { id: "female-chengshu", name: "成熟女声", gender: "female" },
  { id: "female-tianmei", name: "甜美女声", gender: "female" },
  
  // 主持人音色
  { id: "presenter_male", name: "主持人男声", gender: "male" },
  { id: "presenter_female", name: "主持人女声", gender: "female" },
  
  // 有声书音色
  { id: "audiobook_male_1", name: "有声书男声1", gender: "male" },
  { id: "audiobook_male_2", name: "有声书男声2", gender: "male" },
  { id: "audiobook_female_1", name: "有声书女声1", gender: "female" },
  { id: "audiobook_female_2", name: "有声书女声2", gender: "female" },
  
  // 精品音色
  { id: "male-qn-qingse-jingpin", name: "清澈男声(精品)", gender: "male" },
  { id: "male-qn-jingying-jingpin", name: "精英男声(精品)", gender: "male" },
  { id: "male-qn-badao-jingpin", name: "霸道男声(精品)", gender: "male" },
  { id: "male-qn-daxuesheng-jingpin", name: "大学生男声(精品)", gender: "male" },
  { id: "female-shaonv-jingpin", name: "少女音(精品)", gender: "female" },
  { id: "female-yujie-jingpin", name: "御姐音(精品)", gender: "female" },
  { id: "female-chengshu-jingpin", name: "成熟女声(精品)", gender: "female" },
  { id: "female-tianmei-jingpin", name: "甜美女声(精品)", gender: "female" },
  
  // 角色音色
  { id: "clever_boy", name: "机灵男孩", gender: "male" },
  { id: "cute_boy", name: "可爱男孩", gender: "male" },
  { id: "lovely_girl", name: "可爱女孩", gender: "female" },
  { id: "cartoon_pig", name: "卡通小猪", gender: "female" },
  { id: "bingjiao_didi", name: "冰骄弟弟", gender: "male" },
  { id: "junlang_nanyou", name: "俊朗男友", gender: "male" },
  { id: "chunzhen_xuedi", name: "纯真学弟", gender: "male" },
  { id: "lengdan_xiongzhang", name: "冷淡兄长", gender: "male" },
  { id: "badao_shaoye", name: "霸道少爷", gender: "male" },
  { id: "tianxin_xiaoling", name: "甜心校领", gender: "female" },
  { id: "qiaopi_mengmei", name: "俏皮萌妹", gender: "female" },
  { id: "wumei_yujie", name: "妩媚御姐", gender: "female" },
  { id: "diadia_xuemei", name: "嗲嗲学妹", gender: "female" },
  { id: "danya_xuejie", name: "淡雅学姐", gender: "female" },
];

// 默认旁白音色 - 移除默认设置
// const DEFAULT_NARRATOR_VOICE = "female-shaonv";

export default function StoryPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: session } = useSession();
  
  // 状态管理
  const [inputMode, setInputMode] = useState<'generate' | 'input'>('generate'); // 新增：输入模式
  const [storyRequirement, setStoryRequirement] = useState("");
  const [userStory, setUserStory] = useState(""); // 新增：用户输入的故事
  const [generatedStory, setGeneratedStory] = useState("");
  const [currentStory, setCurrentStory] = useState(""); // 新增：当前使用的故事（生成的或输入的）
  const [storySegments, setStorySegments] = useState<StorySegment[]>([]);
  const [characters, setCharacters] = useState<StoryCharacter[]>([]);
  const [narratorVoice, setNarratorVoice] = useState(""); // 不设置默认值，让用户选择
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [audioVisualizer, setAudioVisualizer] = useState<{
    audioContext: AudioContext;
    source: AudioBufferSourceNode;
    url: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null); // 新增：正在编辑的段落ID
  const [apiMode] = useState<'client'>('client'); // 默认使用客户端调用，不再让用户选择
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]); // 新增：克隆音色列表
  const [designedVoices, setDesignedVoices] = useState<DesignedVoice[]>([]); // 新增：设计音色列表

  // 获取当前语言的情绪选项
  const AVAILABLE_EMOTIONS = getAvailableEmotions(t);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 客户端直接调用DeepSeek API
  const generateStoryClientSide = async (requirement: string) => {
    const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API密钥未配置，请在环境变量中设置 NEXT_PUBLIC_DEEPSEEK_API_KEY');
    }

    const systemPrompt = `你是专业故事创作者。根据要求创作完整故事。

格式要求：
1. 对话格式：角色名："对话内容"
2. 旁白格式：旁白：描述内容  
3. 故事长度300-1000字
4. 包含开头、发展、结局

示例：
旁白：在遥远王国里，住着勇敢骑士艾伦。
艾伦："我要拯救公主！"
旁白：艾伦踏上了征程。

请严格按此格式创作。`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `创作故事：${requirement}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.8,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `API调用失败 (${response.status})`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('故事生成失败，请重试');
    }

    return data.choices[0].message.content;
  };

  // 生成故事
  const generateStory = async () => {
    if (!storyRequirement.trim()) {
      toast({
        title: t('error'),
        description: t('storyRequirementRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!session?.user) {
      toast({
        title: t('error'),
        description: t('pleaseLoginFirst'),
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // 客户端直接调用DeepSeek API，无时间限制
      const story = await generateStoryClientSide(storyRequirement);

      setGeneratedStory(story);
      setCurrentStory(story); // 设置当前故事
      
      toast({
        title: t('success'),
        description: t('storyGenerationComplete'),
      });

      // 自动分析故事并提取角色
      const segments = parseStorySegments(story);
      const storyCharacters = extractCharacters(segments);
      
      setStorySegments(segments);
      setCharacters(storyCharacters);
      
      // 提示用户设置音色
      toast({
        title: t('notice'),
        description: t('pleaseSetVoicesForCharacters'),
        variant: "default",
      });

    } catch (error) {
      console.error('故事生成失败:', error);
      const errorMessage = error instanceof Error ? error.message : t('storyGenerationFailedRetry');
      toast({
        title: t('error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 使用用户输入的故事
  const useUserStory = () => {
    if (!userStory.trim()) {
      toast({
        title: t('error'),
        description: t('pleaseEnterStoryContent'),
        variant: "destructive",
      });
      return;
    }

    setCurrentStory(userStory);

    // 自动分析故事并提取角色
    const segments = parseStorySegments(userStory);
    const storyCharacters = extractCharacters(segments);

    console.log('解析的段落:', segments);
    console.log('提取的角色:', storyCharacters);

    setStorySegments(segments);
    setCharacters(storyCharacters);

    toast({
      title: t('success'),
      description: t('storyContentConfirmed'),
    });

    // 如果有角色，提示用户设置音色
    if (storyCharacters.length > 0) {
      toast({
        title: t('notice'),
        description: t('pleaseSetVoicesForCharacters'),
        variant: "default",
      });
    } else {
      // 如果没有检测到角色，提示用户检查格式
      toast({
        title: t('notice'),
        description: '未检测到对话角色，请检查格式是否正确（如：角色名："对话内容"）',
        variant: "default",
      });
    }
  };

  // 分析故事并分段
  const analyzeStory = async () => {
    if (!session?.user) {
      toast({
        title: t('error'),
        description: t('pleaseLoginFirst'),
        variant: "destructive",
      });
      return;
    }

    const storyToAnalyze = currentStory || userStory;
    if (!storyToAnalyze.trim()) {
      toast({
        title: t('error'),
        description: t('noStoryToAnalyze'),
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // 检查旁白音色是否已设置
    if (!narratorVoice) {
      toast({
        title: t('notice'),
        description: t('pleaseSelectNarratorVoice'),
        variant: "default",
      });
      setIsAnalyzing(false);
      return;
    }
    
    // 添加调试信息
    console.log('开始分析故事...');
    console.log('当前旁白音色:', narratorVoice);
    console.log('当前角色列表:', characters);
    console.log('当前段落列表:', storySegments);
    
    try {
      // 如果已经有段落，保留现有的设置
      let segments;
      if (storySegments.length > 0) {
        // 保留现有段落的设置
        segments = storySegments.map(segment => ({
          ...segment,
          // 保留现有的情绪设置和音色设置
        }));
        console.log('保留现有段落设置:', segments);
      } else {
        // 首次解析故事
        segments = parseStorySegments(storyToAnalyze);
        console.log('首次解析段落:', segments);
      }
      
      const newCharacters = extractCharacters(segments);
      
      // 保留已设置的音色 - 合并新角色和现有角色的音色设置
      const mergedCharacters = newCharacters.map(newChar => {
        const existingChar = characters.find(char => char.name === newChar.name);
        return existingChar ? { ...newChar, voiceId: existingChar.voiceId, emotion: existingChar.emotion } : newChar;
      });
      
      // 检查是否所有角色都已设置音色
      const unsetCharacters = mergedCharacters.filter(char => !char.voiceId);
      if (unsetCharacters.length > 0) {
        toast({
          title: t('notice'),
          description: t('pleaseSelectVoicesForCharacters', { characters: unsetCharacters.map(c => c.name).join(', ') }),
          variant: "default",
        });
        setStorySegments(segments);
        setCharacters(mergedCharacters);
        setIsAnalyzing(false);
        return;
      }
      
      // 使用当前的角色音色设置更新段落
      const updatedSegments = updateSegmentsWithVoices(segments, mergedCharacters);
      
      setStorySegments(updatedSegments);
      setCharacters(mergedCharacters);
      
      toast({
        title: t('success'),
        description: t('storyAnalysisComplete'),
      });

      // 计算总字符数
      const totalCharacters = updatedSegments.reduce((total, segment) => total + segment.text.length, 0);

      // 自动生成音频
      toast({
        title: t('notice'),
        description: t('startingAudioGeneration'),
      });

      // 生成所有音频
      const audioSegments = [...updatedSegments];
      let successfulGenerations = 0;
      
      for (let i = 0; i < audioSegments.length; i++) {
        const segment = audioSegments[i];
        
        try {
          console.log(`正在生成段落 ${i + 1} 的音频，音色ID: ${segment.voiceId}`);
          console.log(`段落 ${i + 1} 的情绪设置:`, segment.emotion);
          
          // 检查是否使用克隆音色或设计音色
          const isClonedVoice = clonedVoices.some(voice => voice.voiceId === segment.voiceId);
          const isDesignedVoice = designedVoices.some(voice => voice.voiceId === segment.voiceId);
          const isCustomVoice = isClonedVoice || isDesignedVoice;
          
          // 处理情绪参数
          const emotionParam = segment.emotion && segment.emotion !== "none" && ["happy", "sad", "angry", "fearful", "surprised", "neutral", "disgusted"].includes(segment.emotion) 
            ? segment.emotion as "happy" | "sad" | "angry" | "fearful" | "surprised" | "neutral" | "disgusted"
            : undefined;
          
          console.log(`段落 ${i + 1} 传递给API的情绪参数:`, emotionParam);
          
          const audioData = await synthesizeSpeech({
            text: segment.text,
            language: 'zh-CN',
            voiceId: segment.voiceId,
            speed: 1,
            service: 'minimax',
            useClonedVoice: isCustomVoice,
            vol: 1,
            pitch: 0,
            sampleRate: 32000,
            bitrate: 128000,
            channel: 2,
            emotion: emotionParam
          });
          
          audioSegments[i] = {
            ...segment,
            audioData
          };
          
          successfulGenerations++;
          
          // 更新进度
          setStorySegments([...audioSegments]);
          
        } catch (error) {
          console.error(`段落 ${i + 1} 音频生成失败:`, error);
          toast({
            title: t('error'),
            description: t('segmentAudioGenerationFailed', { index: i + 1 }),
            variant: "destructive",
          });
        }
      }
      
      // 如果有成功生成的音频，扣除字符配额
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
            console.error('字符配额更新失败');
          } else {
            console.log(`字符配额更新成功，使用字符数: ${totalCharacters}`);
          }
        } catch (error) {
          console.error('字符配额更新错误:', error);
        }
      }
      
      toast({
        title: t('success'),
        description: t('allAudioGenerationComplete'),
      });

    } catch (error) {
      console.error('故事分析失败:', error);
      toast({
        title: t('error'),
        description: t('storyAnalysisFailed'),
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 切换输入模式时重置相关状态
  const handleInputModeChange = (mode: 'generate' | 'input') => {
    setInputMode(mode);
    setStorySegments([]);
    setCharacters([]);
    setCurrentStory("");
    setNarratorVoice("");
  };

  // 生成所有音频（独立函数，用于重新生成）
  const generateAllAudio = async () => {
    if (!session?.user) {
      toast({
        title: t('error'),
        description: t('pleaseLoginFirst'),
        variant: "destructive",
      });
      return;
    }

    if (storySegments.length === 0) {
      toast({
        title: t('error'),
        description: t('pleaseAnalyzeStoryFirst'),
        variant: "destructive",
      });
      return;
    }

    // 检查是否所有段落都已设置音色
    const unsetVoiceSegments = storySegments.filter(segment => !segment.voiceId);
    if (unsetVoiceSegments.length > 0) {
      const narratorUnset = unsetVoiceSegments.some(s => s.type === 'narration');
      const characterUnset = unsetVoiceSegments.some(s => s.type === 'dialogue');
      
      let errorMessage = t('pleaseSelectVoicesForAllSegments');
      if (narratorUnset) errorMessage += ` ${t('narratorVoice')}`;
      if (characterUnset) errorMessage += ` ${t('characterVoice')}`;
      
      toast({
        title: t('error'),
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // 计算总字符数
    const totalCharacters = storySegments.reduce((total, segment) => total + segment.text.length, 0);

    // 检查用户字符配额
    try {
      const quotaResponse = await fetch('/api/user/plan');
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();
        
        // 检查用户是否有足够的字符额度
        const { permanentQuota, temporaryQuota, usedCharacters, quotaExpiry } = quotaData.characterQuota;
        const totalQuota = permanentQuota + (quotaExpiry && new Date(quotaExpiry) > new Date() ? temporaryQuota : 0);
        const remainingQuota = totalQuota - usedCharacters;

        if (remainingQuota < totalCharacters) {
          toast({
            title: t('characterQuotaInsufficient'),
            description: t('characterQuotaRequired', { required: totalCharacters, remaining: remainingQuota }),
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: t('notice'),
          description: t('unableToCheckQuota'),
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('配额检查失败:', error);
      toast({
        title: t('notice'),
        description: t('quotaCheckServiceUnavailable'),
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const updatedSegments = [...storySegments];
      let successfulGenerations = 0;
      
      for (let i = 0; i < updatedSegments.length; i++) {
        const segment = updatedSegments[i];
        
        try {
          console.log(`正在生成段落 ${i + 1} 的音频，音色ID: ${segment.voiceId}`);
          console.log(`段落 ${i + 1} 的情绪设置:`, segment.emotion);
          
          // 检查是否使用克隆音色或设计音色
          const isClonedVoice = clonedVoices.some(voice => voice.voiceId === segment.voiceId);
          const isDesignedVoice = designedVoices.some(voice => voice.voiceId === segment.voiceId);
          const isCustomVoice = isClonedVoice || isDesignedVoice;

          // 处理情绪参数
          const emotionParam = segment.emotion && segment.emotion !== "none" && ["happy", "sad", "angry", "fearful", "surprised", "neutral", "disgusted"].includes(segment.emotion)
            ? segment.emotion as "happy" | "sad" | "angry" | "fearful" | "surprised" | "neutral" | "disgusted"
            : undefined;

          console.log(`段落 ${i + 1} 传递给API的情绪参数:`, emotionParam);

          const audioData = await synthesizeSpeech({
            text: segment.text,
            language: 'zh-CN',
            voiceId: segment.voiceId,
            speed: 1,
            service: 'minimax',
            useClonedVoice: isCustomVoice,
            vol: 1,
            pitch: 0,
            sampleRate: 32000,
            bitrate: 128000,
            channel: 2,
            emotion: emotionParam
          });
          
          updatedSegments[i] = {
            ...segment,
            audioData
          };
          
          successfulGenerations++;
          
          // 更新进度
          setStorySegments([...updatedSegments]);
          
        } catch (error) {
          console.error(`段落 ${i + 1} 音频生成失败:`, error);
          toast({
            title: t('error'),
            description: t('segmentAudioGenerationFailed', { index: i + 1 }),
            variant: "destructive",
          });
        }
      }
      
      // 如果有成功生成的音频，扣除字符配额
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
            console.error('字符配额更新失败');
          } else {
            console.log(`字符配额更新成功，使用字符数: ${totalCharacters}`);
          }
        } catch (error) {
          console.error('字符配额更新错误:', error);
        }
      }
      
      toast({
        title: t('success'),
        description: t('allAudioGenerationComplete'),
      });
    } catch (error) {
      console.error('音频生成失败:', error);
      toast({
        title: t('error'),
        description: t('audioGenerationFailed'),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // 解析故事段落
  const parseStorySegments = (story: string): StorySegment[] => {
    const lines = story.split('\n').filter(line => line.trim());
    const segments: StorySegment[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // 检查是否为对话（支持多种格式）
      // 支持的格式：
      // 角色名："对话内容"、角色名："对话内容"、角色名: "对话内容"、角色名: "对话内容"
      let dialogueMatch = null;

      // 匹配各种引号组合
      const patterns = [
        /^(.+?)[:：]\s*"(.+?)"$/, // 中文引号
        /^(.+?)[:：]\s*"(.+?)"$/, // 英文引号
        /^(.+?)[:：]\s*"(.+?)"$/, // 混合引号1
        /^(.+?)[:：]\s*"(.+?)"$/  // 混合引号2
      ];

      for (const pattern of patterns) {
        dialogueMatch = trimmedLine.match(pattern);
        if (dialogueMatch) break;
      }

      if (dialogueMatch) {
        const [, character, text] = dialogueMatch;
        console.log('检测到对话:', { character: character.trim(), text: text.trim() });
        segments.push({
          id: `segment-${index}`,
          type: 'dialogue',
          character: character.trim(),
          text: text.trim(),
          voiceId: '',
          emotion: "none" // 默认无情绪
        });
      } else if (trimmedLine.startsWith('旁白：') || trimmedLine.startsWith('旁白:')) {
        // 旁白格式
        const text = trimmedLine.replace(/^旁白[:：]\s*/, '').trim();
        console.log('检测到旁白:', text);
        segments.push({
          id: `segment-${index}`,
          type: 'narration',
          text,
          voiceId: '',
          emotion: "none" // 默认无情绪
        });
      } else {
        // 其他格式当作旁白处理
        console.log('作为旁白处理:', trimmedLine);
        segments.push({
          id: `segment-${index}`,
          type: 'narration',
          text: trimmedLine,
          voiceId: '',
          emotion: "none" // 默认无情绪
        });
      }
    });
    
    return segments;
  };

  // 更新段落音色ID
  const updateSegmentsWithVoices = (segments: StorySegment[], charactersWithVoices: StoryCharacter[]): StorySegment[] => {
    return segments.map(segment => {
      if (segment.type === 'dialogue' && segment.character) {
        const character = charactersWithVoices.find(c => c.name === segment.character);
        return {
          ...segment,
          voiceId: character?.voiceId || "",
          // 只有当段落没有设置情绪时，才使用角色的默认情绪
          emotion: segment.emotion && segment.emotion !== "none" ? segment.emotion : (character?.emotion || "none")
        };
      } else if (segment.type === 'narration') {
        return {
          ...segment,
          voiceId: narratorVoice || "",
          // 保留旁白段落的情绪设置，如果没有则设为none
          emotion: segment.emotion || "none"
        };
      }
      return segment;
    });
  };

  // 提取角色信息
  const extractCharacters = (segments: StorySegment[]): StoryCharacter[] => {
    const characterNames = new Set<string>();
    
    segments.forEach(segment => {
      if (segment.type === 'dialogue' && segment.character) {
        characterNames.add(segment.character);
      }
    });
    
    return Array.from(characterNames).map(name => ({
      name,
      role: getCharacterRole(name),
      voiceId: getDefaultVoiceForCharacter(name),
      gender: getCharacterGender(name),
      description: '',
      emotion: "none" // 默认无情绪
    }));
  };

  // 根据角色名称获取默认音色 - 移除默认音色，返回空字符串
  const getDefaultVoiceForCharacter = (character: string): string => {
    // 不再提供默认音色，让用户自己选择
    return "";
  };

  // 获取角色性别
  const getCharacterGender = (character: string): 'male' | 'female' => {
    const femaleNames = ['小雨', '公主', '小红', '小美', '小丽', '小花'];
    const maleNames = ['艾伦', '李明', '小明', '王华', '小强', '小军'];
    
    if (femaleNames.some(name => character.includes(name))) {
      return 'female';
    }
    
    if (maleNames.some(name => character.includes(name))) {
      return 'male';
    }
    
    return 'female'; // 默认
  };

  // 获取角色类型
  const getCharacterRole = (character: string): string => {
    if (character.includes('公主')) return '公主';
    if (character.includes('骑士') || character.includes('艾伦')) return '骑士';
    if (character.includes('龙')) return '巨龙';
    if (character.includes('侦探')) return '侦探';
    return '角色';
  };

  // 更新角色音色
  const updateCharacterVoice = (characterName: string, voiceId: string) => {
    console.log('更新角色音色:', characterName, voiceId);
    
    // 更新角色列表中的音色
    setCharacters(prev => {
      const updated = prev.map(char => 
        char.name === characterName 
          ? { ...char, voiceId }
          : char
      );
      console.log('更新后的角色列表:', updated);
      return updated;
    });
    
    // 更新所有相关段落的音色
    setStorySegments(prev => {
      const updated = prev.map(segment => 
        segment.type === 'dialogue' && segment.character === characterName 
          ? { ...segment, voiceId, audioData: undefined }
          : segment
      );
      console.log('更新后的故事段落:', updated);
      return updated;
    });
  };

  // 更新旁白音色
  const updateNarratorVoice = (voiceId: string) => {
    console.log('更新旁白音色:', voiceId);
    
    // 更新旁白音色状态
    setNarratorVoice(voiceId);
    
    // 更新所有旁白段落的音色
    setStorySegments(prev => {
      const updated = prev.map(segment => 
        segment.type === 'narration'
          ? { ...segment, voiceId, audioData: undefined }
          : segment
      );
      console.log('更新后的旁白段落:', updated);
      return updated;
    });
  };

  // 播放单个段落
  const playSegment = async (index: number) => {
    const segment = storySegments[index];
    if (!segment.audioData) {
      toast({
        title: t('error'),
        description: t('segmentAudioNotGenerated'),
        variant: "destructive",
      });
      return;
    }

    // 如果当前正在播放，先停止
    if (audioVisualizer) {
      audioVisualizer.source.stop();
      audioVisualizer.audioContext.close();
      setAudioVisualizer(null);
      setIsPlaying(false);
      setCurrentPlayingIndex(null);
    }

    try {
      const { audioContext, source } = await playMinimaxAudio(segment.audioData, 1);
      setAudioVisualizer({ audioContext, source, url: '' });
      setIsPlaying(true);
      setCurrentPlayingIndex(index);
      
      // 音频播放结束后自动播放下一段
      source.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingIndex(null);
        setAudioVisualizer(null);
        if (index < storySegments.length - 1) {
          setTimeout(() => playSegment(index + 1), 500);
        }
      };
    } catch (error) {
      console.error('播放失败:', error);
      toast({
        title: t('error'),
        description: t('playbackFailed'),
        variant: "destructive",
      });
    }
  };

  // 暂停播放
  const handlePause = () => {
    if (audioVisualizer) {
      audioVisualizer.source.stop();
      audioVisualizer.audioContext.close();
      setAudioVisualizer(null);
      setIsPlaying(false);
      setCurrentPlayingIndex(null);
    }
  };

  // 新增：更新段落文本
  const updateSegmentText = (segmentId: string, newText: string) => {
    setStorySegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { ...segment, text: newText, audioData: undefined } // 清除已生成的音频
          : segment
      )
    );
  };

  // 新增：更新段落角色名称
  const updateSegmentCharacter = (segmentId: string, newCharacterName: string) => {
    setStorySegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { ...segment, character: newCharacterName, audioData: undefined } // 清除已生成的音频
          : segment
      )
    );
  };

  // 新增：开始编辑段落
  const startEditingSegment = (segmentId: string) => {
    setEditingSegmentId(segmentId);
  };

  // 新增：完成编辑段落
  const finishEditingSegment = () => {
    setEditingSegmentId(null);
    toast({
      title: t('success'),
      description: t('textUpdated'),
    });
  };

  // 新增：删除段落
  const deleteSegment = (segmentId: string) => {
    setStorySegments(prev => prev.filter(segment => segment.id !== segmentId));
    
    toast({
      title: t('success'),
      description: t('segmentDeleted'),
    });
  };

  // 下载单个段落音频
  const downloadSegmentAudio = async (segment: StorySegment, index: number) => {
    if (!segment.audioData) {
      toast({
        title: t('error'),
        description: t('segmentAudioNotGenerated'),
        variant: "destructive",
      });
      return;
    }

    try {
      // 创建 Blob 对象
      const blob = new Blob([segment.audioData], { type: 'audio/wav' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 生成文件名
      const fileName = `${segment.type === 'dialogue' ? segment.character : t('narrator')} 段落${index + 1}.wav`;
      link.download = fileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理 URL
      URL.revokeObjectURL(url);
      
      toast({
        title: t('success'),
        description: t('segmentAudioDownloaded', { fileName }),
      });
    } catch (error) {
      console.error('下载失败:', error);
      toast({
        title: t('error'),
        description: t('downloadFailed'),
        variant: "destructive",
      });
    }
  };

  // 合并音频数据
  const mergeAudioBuffers = (audioBuffers: ArrayBuffer[]): ArrayBuffer => {
    // 计算总长度
    let totalLength = 0;
    audioBuffers.forEach(buffer => {
      totalLength += buffer.byteLength;
    });

    // 创建新的 ArrayBuffer
    const mergedBuffer = new ArrayBuffer(totalLength);
    const mergedView = new Uint8Array(mergedBuffer);
    
    let offset = 0;
    audioBuffers.forEach(buffer => {
      const view = new Uint8Array(buffer);
      mergedView.set(view, offset);
      offset += buffer.byteLength;
    });

    return mergedBuffer;
  };

  // 下载完整音频
  const downloadCompleteStory = async () => {
    if (storySegments.some(segment => !segment.audioData)) {
      toast({
        title: t('error'),
        description: t('pleaseGenerateAllAudioFirst'),
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: t('processing'),
        description: t('mergingAudioFiles'),
      });

      // 收集所有音频数据
      const audioBuffers: ArrayBuffer[] = [];
      storySegments.forEach(segment => {
        if (segment.audioData) {
          audioBuffers.push(segment.audioData);
        }
      });

      if (audioBuffers.length === 0) {
        throw new Error('没有可用的音频数据');
      }

      // 合并音频
      const mergedAudio = mergeAudioBuffers(audioBuffers);
      
      // 创建 Blob 对象
      const blob = new Blob([mergedAudio], { type: 'audio/wav' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 生成文件名（使用当前时间戳）
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const fileName = `VoiceCanvas_Story_${timestamp}.wav`;
      link.download = fileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理 URL
      URL.revokeObjectURL(url);
      
      toast({
        title: t('success'),
        description: t('completeStoryAudioDownloaded', { fileName }),
      });
    } catch (error) {
      console.error('下载失败:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('downloadFailed'),
        variant: "destructive",
      });
    }
  };

  // 删除角色
  const deleteCharacter = (characterName: string) => {
    // 从角色列表中删除
    setCharacters(prev => prev.filter(char => char.name !== characterName));
    
    // 从故事段落中删除相关对话
    setStorySegments(prev => prev.filter(segment => 
      segment.type !== 'dialogue' || segment.character !== characterName
    ));
    
    toast({
      title: t('success'),
      description: t('characterDeleted'),
    });
  };

  // 修改角色名称
  const updateCharacterName = (oldName: string, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: t('error'),
        description: t('characterNameRequired'),
        variant: "destructive",
      });
      return;
    }

    // 检查新名称是否已存在
    if (characters.some(char => char.name === newName && char.name !== oldName)) {
      toast({
        title: t('error'),
        description: t('characterNameExists'),
        variant: "destructive",
      });
      return;
    }

    // 更新角色列表
    setCharacters(prev => prev.map(char => 
      char.name === oldName 
        ? { ...char, name: newName }
        : char
    ));

    // 更新故事段落中的角色名称
    setStorySegments(prev => prev.map(segment => 
      segment.type === 'dialogue' && segment.character === oldName
        ? { ...segment, character: newName }
        : segment
    ));

    toast({
      title: t('success'),
      description: t('characterNameUpdated'),
    });
  };

  // 修改角色性别
  const updateCharacterGender = (characterName: string, newGender: 'male' | 'female') => {
    // 更新角色列表中的性别
    setCharacters(prev => prev.map(char => 
      char.name === characterName 
        ? { ...char, gender: newGender }
        : char
    ));

    toast({
      title: t('success'),
      description: t('characterGenderUpdated'),
    });
  };

  // 更新角色情绪
  const updateCharacterEmotion = (characterName: string, emotion: string) => {
    // 更新角色列表中的情绪
    setCharacters(prev => prev.map(char => 
      char.name === characterName 
        ? { ...char, emotion }
        : char
    ));

    // 更新所有相关段落的情绪并清除音频
    setStorySegments(prev => prev.map(segment => 
      segment.type === 'dialogue' && segment.character === characterName
        ? { ...segment, emotion, audioData: undefined }
        : segment
    ));

    toast({
      title: t('success'),
      description: t('characterEmotionUpdated'),
    });
  };

  // 更新段落情绪
  const updateSegmentEmotion = (segmentId: string, emotion: string) => {
    console.log(`更新段落情绪: ${segmentId}, 新情绪: ${emotion}`);
    
    setStorySegments(prev => {
      const updated = prev.map(segment => 
        segment.id === segmentId
          ? { ...segment, emotion, audioData: undefined } // 清除已生成的音频
          : segment
      );
      console.log('更新后的段落列表:', updated);
      return updated;
    });

    toast({
      title: t('success'),
      description: t('segmentEmotionUpdated'),
    });
  };

  // 单独重新生成某个段落的音频
  const regenerateSegmentAudio = async (segmentId: string) => {
    if (!session?.user) {
      toast({
        title: t('error'),
        description: t('pleaseLoginFirst'),
        variant: "destructive",
      });
      return;
    }

    const segment = storySegments.find(s => s.id === segmentId);
    if (!segment) {
      toast({
        title: t('error'),
        description: t('segmentNotFound'),
        variant: "destructive",
      });
      return;
    }

    if (!segment.voiceId) {
      toast({
        title: t('error'),
        description: t('pleaseSelectVoiceFirst'),
        variant: "destructive",
      });
      return;
    }

    // 计算该段落的字符数
    const characterCount = segment.text.length;

    // 检查用户字符配额
    try {
      const quotaResponse = await fetch('/api/user/plan');
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();
        
        const { permanentQuota, temporaryQuota, usedCharacters, quotaExpiry } = quotaData.characterQuota;
        const totalQuota = permanentQuota + (quotaExpiry && new Date(quotaExpiry) > new Date() ? temporaryQuota : 0);
        const remainingQuota = totalQuota - usedCharacters;

        if (remainingQuota < characterCount) {
          toast({
            title: t('characterQuotaInsufficient'),
            description: t('characterQuotaRequired', { required: characterCount, remaining: remainingQuota }),
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: t('notice'),
          description: t('unableToCheckQuota'),
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('配额检查失败:', error);
      toast({
        title: t('notice'),
        description: t('quotaCheckServiceUnavailable'),
        variant: "destructive",
      });
      return;
    }

    // 设置该段落为生成中状态
    setStorySegments(prev => prev.map(s => 
      s.id === segmentId 
        ? { ...s, audioData: undefined, isGenerating: true }
        : s
    ));

    try {
      console.log(`正在重新生成段落 ${segmentId} 的音频，音色ID: ${segment.voiceId}`);
      console.log(`段落 ${segmentId} 的情绪设置:`, segment.emotion);
      
      // 检查是否使用克隆音色或设计音色
      const isClonedVoice = clonedVoices.some(voice => voice.voiceId === segment.voiceId);
      const isDesignedVoice = designedVoices.some(voice => voice.voiceId === segment.voiceId);
      const isCustomVoice = isClonedVoice || isDesignedVoice;

      // 处理情绪参数
      const emotionParam = segment.emotion && segment.emotion !== "none" && ["happy", "sad", "angry", "fearful", "surprised", "neutral", "disgusted"].includes(segment.emotion)
        ? segment.emotion as "happy" | "sad" | "angry" | "fearful" | "surprised" | "neutral" | "disgusted"
        : undefined;

      console.log(`段落 ${segmentId} 传递给API的情绪参数:`, emotionParam);

      const audioData = await synthesizeSpeech({
        text: segment.text,
        language: 'zh-CN',
        voiceId: segment.voiceId,
        speed: 1,
        service: 'minimax',
        useClonedVoice: isCustomVoice,
        vol: 1,
        pitch: 0,
        sampleRate: 32000,
        bitrate: 128000,
        channel: 2,
        emotion: emotionParam
      });
      
      // 更新段落音频数据
      setStorySegments(prev => prev.map(s => 
        s.id === segmentId 
          ? { ...s, audioData, isGenerating: false }
          : s
      ));
      
      // 扣除字符配额
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
          console.error('字符配额更新失败');
        } else {
          console.log(`字符配额更新成功，使用字符数: ${characterCount}`);
        }
      } catch (error) {
        console.error('字符配额更新错误:', error);
      }
      
      toast({
        title: t('success'),
        description: t('segmentAudioRegenerated'),
      });
      
    } catch (error) {
      console.error(`段落 ${segmentId} 音频生成失败:`, error);
      
      // 移除生成中状态
      setStorySegments(prev => prev.map(s => 
        s.id === segmentId 
          ? { ...s, isGenerating: false }
          : s
      ));
      
      toast({
        title: t('error'),
        description: t('segmentAudioRegenerationFailed'),
        variant: "destructive",
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      <StoryTitleUpdater />
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
                <BookOpen className="inline-block w-8 h-8 mr-2" />
                VoiceCanvas Story
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6 relative z-10">
            <div className="space-y-6">
              
              {/* 输入模式选择 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {t('selectInputMethod')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button
                        variant={inputMode === 'generate' ? 'default' : 'outline'}
                        onClick={() => handleInputModeChange('generate')}
                        className={inputMode === 'generate' ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' : ''}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        {t('aiGenerateStory')}
                      </Button>
                      <Button
                        variant={inputMode === 'input' ? 'default' : 'outline'}
                        onClick={() => handleInputModeChange('input')}
                        className={inputMode === 'input' ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' : ''}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t('inputStoryContent')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI生成故事模式 */}
              {inputMode === 'generate' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {t('storyRequirement')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder={t('describeStoryTypeThemeRole')}
                        className="min-h-[100px] bg-background/70 backdrop-blur-sm border-primary/20 focus:border-primary/40"
                        value={storyRequirement}
                        onChange={(e) => setStoryRequirement(e.target.value)}
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {storyRequirement.length}/500
                        </span>
                        <RequireAuth>
                          <Button
                            onClick={generateStory}
                            disabled={isGenerating || !storyRequirement.trim()}
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('generating')}...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                {t('generateStory')}
                              </>
                            )}
                          </Button>
                        </RequireAuth>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 用户输入故事模式 */}
              {inputMode === 'input' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {t('inputStoryContent')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {t('enterStoryContentDescription')}
                        </p>
                        <div className="bg-muted/30 p-3 rounded-lg text-xs">
                          <p className="font-medium mb-1">{t('formatExample')}:</p>
                          <p>{t('narrator')}: {t('exampleNarration')}</p>
                          <p>{t('princess')}: "{t('examplePrincessDialogue')}"</p>
                          <p>{t('knight')}: "{t('exampleKnightDialogue')}"</p>
                          <p>{t('narrator')}: {t('exampleNarrationEnd')}</p>
                        </div>
                      </div>
                      <Textarea
                        placeholder={t('enterStoryContentPlaceholder')}
                        className="min-h-[200px] bg-background/70 backdrop-blur-sm border-primary/20 focus:border-primary/40"
                        value={userStory}
                        onChange={(e) => setUserStory(e.target.value)}
                        maxLength={10000}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {userStory.length}/10000
                        </span>
                        <RequireAuth>
                          <Button
                            onClick={useUserStory}
                            disabled={!userStory.trim()}
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            {t('confirmStoryContent')}
                          </Button>
                        </RequireAuth>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 显示当前故事 */}
              {currentStory && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                          {inputMode === 'generate' ? t('generatedStory') : t('yourStory')}
                        </CardTitle>
                        <RequireAuth>
                          <Button
                            onClick={analyzeStory}
                            disabled={isAnalyzing}
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('analyzing')}...
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4 mr-2" />
                                {t('analyzeStory')}
                              </>
                            )}
                          </Button>
                        </RequireAuth>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                          {currentStory}
                        </pre>
                      </div>
                      <div className="flex justify-end mt-2">
                        <span className="text-xs text-muted-foreground">
                          {t('characterCount')}: {currentStory.length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 角色信息 */}
              {characters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {t('characterVoiceSettings')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 旁白音色设置 */}
                        <div className="p-4 bg-muted/20 rounded-lg border border-primary/10">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{t('narrator')}</h4>
                              <p className="text-sm text-muted-foreground">{t('narratorDescription')}</p>
                            </div>
                            <Badge variant="secondary">{t('narrator')}</Badge>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('storySelectVoice')}:</label>
                            <Select value={narratorVoice} onValueChange={updateNarratorVoice}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('selectNarratorVoice')} />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                {/* 克隆音色 */}
                                {clonedVoices.length > 0 && (
                                  <>
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">{t('clonedVoices')}</div>
                                    {clonedVoices.map((voice) => (
                                      <SelectItem key={voice.voiceId} value={voice.voiceId}>
                                        {voice.name} ({t('clonedVoice')})
                                      </SelectItem>
                                    ))}
                                  </>
                                )}

                                {/* 设计音色 */}
                                {designedVoices.length > 0 && (
                                  <>
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">{t('designedVoices')}</div>
                                    {designedVoices.map((voice) => (
                                      <SelectItem key={voice.voiceId} value={voice.voiceId}>
                                        {voice.name} ({t('designedVoice')})
                                      </SelectItem>
                                    ))}
                                  </>
                                )}

                                {/* 基础音色 */}
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">{t('basicVoices')}</div>
                                {AVAILABLE_VOICES.filter(voice => 
                                  !voice.id.includes('jingpin') && 
                                  !voice.id.includes('presenter') && 
                                  !voice.id.includes('audiobook') &&
                                  !['clever_boy', 'cute_boy', 'lovely_girl', 'cartoon_pig', 'bingjiao_didi', 'junlang_nanyou', 'chunzhen_xuedi', 'lengdan_xiongzhang', 'badao_shaoye', 'tianxin_xiaoling', 'qiaopi_mengmei', 'wumei_yujie', 'diadia_xuemei', 'danya_xuejie'].includes(voice.id)
                                ).map((voice) => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                  </SelectItem>
                                ))}
                                
                                {/* 精品音色 */}
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">{t('premiumVoices')}</div>
                                {AVAILABLE_VOICES.filter(voice => voice.id.includes('jingpin')).map((voice) => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                  </SelectItem>
                                ))}
                                
                                {/* 主持人音色 */}
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">{t('presenterVoices')}</div>
                                {AVAILABLE_VOICES.filter(voice => voice.id.includes('presenter')).map((voice) => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                  </SelectItem>
                                ))}
                                
                                {/* 有声书音色 */}
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">{t('audiobookVoices')}</div>
                                {AVAILABLE_VOICES.filter(voice => voice.id.includes('audiobook')).map((voice) => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                  </SelectItem>
                                ))}
                                
                                {/* 角色音色 */}
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">{t('characterVoices')}</div>
                                {AVAILABLE_VOICES.filter(voice => 
                                  ['clever_boy', 'cute_boy', 'lovely_girl', 'cartoon_pig', 'bingjiao_didi', 'junlang_nanyou', 'chunzhen_xuedi', 'lengdan_xiongzhang', 'badao_shaoye', 'tianxin_xiaoling', 'qiaopi_mengmei', 'wumei_yujie', 'diadia_xuemei', 'danya_xuejie'].includes(voice.id)
                                ).map((voice) => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!narratorVoice && (
                              <p className="text-xs text-amber-600">⚠️ {t('pleaseSelectNarratorVoice')}</p>
                            )}
                          </div>
                        </div>

                        {/* 角色音色设置 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {characters.map((character, index) => (
                            <div key={index} className="p-4 bg-muted/20 rounded-lg border border-primary/10">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2 mb-1">
                                    <input
                                      type="text"
                                      value={character.name}
                                      onChange={(e) => updateCharacterName(character.name, e.target.value)}
                                      placeholder={t('characterName')}
                                      className="font-medium bg-transparent border-b border-primary/20 focus:border-primary/40 focus:outline-none px-1 py-0.5 min-w-[100px]"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 hover:bg-primary/10"
                                      onClick={() => updateCharacterGender(character.name, character.gender === 'male' ? 'female' : 'male')}
                                    >
                                      <Badge variant={character.gender === 'male' ? 'default' : 'secondary'}>
                                        {character.gender === 'male' ? t('male') : t('female')}
                                      </Badge>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-100/10"
                                      onClick={() => deleteCharacter(character.name)}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                      </svg>
                                    </Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{character.role}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('storySelectVoice')}:</label>
                                <Select 
                                  value={character.voiceId} 
                                  onValueChange={(voiceId) => updateCharacterVoice(character.name, voiceId)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('storySelectVoice')} />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-80">
                                    {/* 克隆音色 */}
                                    {clonedVoices.length > 0 && (
                                      <>
                                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">{t('clonedVoices')}</div>
                                        {clonedVoices.map((voice) => (
                                          <SelectItem key={voice.voiceId} value={voice.voiceId}>
                                            {voice.name} ({t('clonedVoice')})
                                          </SelectItem>
                                        ))}
                                      </>
                                    )}

                                    {/* 设计音色 */}
                                    {designedVoices.length > 0 && (
                                      <>
                                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">{t('designedVoices')}</div>
                                        {designedVoices.map((voice) => (
                                          <SelectItem key={voice.voiceId} value={voice.voiceId}>
                                            {voice.name} ({t('designedVoice')})
                                          </SelectItem>
                                        ))}
                                      </>
                                    )}

                                    {/* 基础音色 */}
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">{t('basicVoices')}</div>
                                    {AVAILABLE_VOICES.filter(voice => 
                                      !voice.id.includes('jingpin') && 
                                      !voice.id.includes('presenter') && 
                                      !voice.id.includes('audiobook') &&
                                      !['clever_boy', 'cute_boy', 'lovely_girl', 'cartoon_pig', 'bingjiao_didi', 'junlang_nanyou', 'chunzhen_xuedi', 'lengdan_xiongzhang', 'badao_shaoye', 'tianxin_xiaoling', 'qiaopi_mengmei', 'wumei_yujie', 'diadia_xuemei', 'danya_xuejie'].includes(voice.id)
                                    ).map((voice) => (
                                      <SelectItem key={voice.id} value={voice.id}>
                                        {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                      </SelectItem>
                                    ))}
                                    
                                    {/* 精品音色 */}
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">{t('premiumVoices')}</div>
                                    {AVAILABLE_VOICES.filter(voice => voice.id.includes('jingpin')).map((voice) => (
                                      <SelectItem key={voice.id} value={voice.id}>
                                        {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                      </SelectItem>
                                    ))}
                                    
                                    {/* 主持人音色 */}
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">{t('presenterVoices')}</div>
                                    {AVAILABLE_VOICES.filter(voice => voice.id.includes('presenter')).map((voice) => (
                                      <SelectItem key={voice.id} value={voice.id}>
                                        {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                      </SelectItem>
                                    ))}
                                    
                                    {/* 有声书音色 */}
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">{t('audiobookVoices')}</div>
                                    {AVAILABLE_VOICES.filter(voice => voice.id.includes('audiobook')).map((voice) => (
                                      <SelectItem key={voice.id} value={voice.id}>
                                        {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                      </SelectItem>
                                    ))}
                                    
                                    {/* 角色音色 */}
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">{t('characterVoices')}</div>
                                    {AVAILABLE_VOICES.filter(voice => 
                                      ['clever_boy', 'cute_boy', 'lovely_girl', 'cartoon_pig', 'bingjiao_didi', 'junlang_nanyou', 'chunzhen_xuedi', 'lengdan_xiongzhang', 'badao_shaoye', 'tianxin_xiaoling', 'qiaopi_mengmei', 'wumei_yujie', 'diadia_xuemei', 'danya_xuejie'].includes(voice.id)
                                    ).map((voice) => (
                                      <SelectItem key={voice.id} value={voice.id}>
                                        {voice.name} ({voice.gender === 'male' ? t('male') : t('female')})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {!character.voiceId && (
                                  <p className="text-xs text-amber-600">⚠️ {t('pleaseSelectCharacterVoice')}</p>
                                )}

                                {/* 情绪选择器 */}
                                <div className="mt-3">
                                  <label className="text-sm font-medium">{t('emotion')}:</label>
                                  <Select 
                                    value={character.emotion || "none"} 
                                    onValueChange={(emotion) => updateCharacterEmotion(character.name, emotion === "none" ? "" : emotion)}
                                  >
                                    <SelectTrigger className="w-full mt-1">
                                      <SelectValue placeholder={t('selectEmotionOptional')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_EMOTIONS.map((emotion) => (
                                        <SelectItem key={emotion.id} value={emotion.id}>
                                          {emotion.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 故事段落和配音 */}
              {storySegments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                          {t('storyVoiceover')}
                        </CardTitle>
                        <div className="flex gap-2">
                          <RequireAuth>
                            <Button
                              onClick={analyzeStory}
                              disabled={isAnalyzing}
                              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {t('analyzing')}...
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-4 h-4 mr-2" />
                                  {t('analyzeStory')}
                                </>
                              )}
                            </Button>
                          </RequireAuth>
                          {storySegments.length > 0 && (
                            <RequireAuth>
                              <Button
                                onClick={generateAllAudio}
                                disabled={isGeneratingAudio}
                                variant="outline"
                                className="border-primary/20 hover:bg-primary/10"
                              >
                                {isGeneratingAudio ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('generating')}...
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-4 h-4 mr-2" />
                                    {t('regenerateAudio')}
                                  </>
                                )}
                              </Button>
                            </RequireAuth>
                          )}
                          <Button
                            onClick={downloadCompleteStory}
                            disabled={storySegments.some(s => !s.audioData)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {t('downloadCompleteStory')}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {storySegments.map((segment, index) => (
                          <div key={segment.id} className="p-4 bg-muted/20 rounded-lg border border-primary/10">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={segment.type === 'dialogue' ? 'default' : 'secondary'}>
                                  {segment.type === 'dialogue' ? t('dialogue') : t('narration')}
                                </Badge>
                                {segment.type === 'dialogue' && (
                                  <div className="flex items-center gap-1">
                                    {editingSegmentId === segment.id ? (
                                      <Select
                                        value={segment.character || ''}
                                        onValueChange={(value) => updateSegmentCharacter(segment.id, value)}
                                      >
                                        <SelectTrigger className="w-32 h-7 text-xs">
                                          <SelectValue placeholder={t('characterName')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {characters.map((char) => (
                                            <SelectItem key={char.name} value={char.name}>
                                              {char.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Badge variant="outline">{segment.character || t('characterName')}</Badge>
                                    )}
                                  </div>
                                )}
                                
                                {/* 段落情绪选择器 - 移到角色旁边 */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">{t('emotion')}:</span>
                                  <Select 
                                    value={segment.emotion || "none"} 
                                    onValueChange={(emotion) => updateSegmentEmotion(segment.id, emotion === "none" ? "" : emotion)}
                                  >
                                    <SelectTrigger className="w-24 h-7 text-xs">
                                      <SelectValue placeholder={t('selectEmotionOptional')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_EMOTIONS.map((emotion) => (
                                        <SelectItem key={emotion.id} value={emotion.id}>
                                          <span className="text-xs">{emotion.name}</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => editingSegmentId === segment.id ? finishEditingSegment() : startEditingSegment(segment.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  {editingSegmentId === segment.id ? t('finishEditing') : t('editText')}
                                </Button>
                                <Button
                                  onClick={() => regenerateSegmentAudio(segment.id)}
                                  disabled={!segment.voiceId || segment.isGenerating}
                                  size="sm"
                                  variant="outline"
                                  title={t('regenerateSegmentAudio')}
                                >
                                  {segment.isGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Volume2 className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() => deleteSegment(segment.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
                                  title={t('deleteSegment')}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                  </svg>
                                </Button>
                                <Button
                                  onClick={() => downloadSegmentAudio(segment, index)}
                                  disabled={!segment.audioData}
                                  size="sm"
                                  variant="outline"
                                  title={t('downloadSegmentAudio')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => isPlaying && currentPlayingIndex === index ? handlePause() : playSegment(index)}
                                  disabled={!segment.audioData}
                                  size="sm"
                                  variant="outline"
                                >
                                  {isPlaying && currentPlayingIndex === index ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {/* 文本显示/编辑区域 */}
                            {editingSegmentId === segment.id ? (
                              <div className="mb-2">
                                <Textarea
                                  value={segment.text}
                                  onChange={(e) => updateSegmentText(segment.id, e.target.value)}
                                  className="min-h-[80px] bg-background/70 backdrop-blur-sm border-primary/20 focus:border-primary/40"
                                  placeholder={t('enterText')}
                                />
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed mb-2 p-2 bg-background/30 rounded border border-primary/10">
                                {segment.text}
                              </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              {t('storyVoiceLabel')}: {segment.voiceId || t('notSet')} | 
                              {t('emotion')}: {
                                segment.emotion && segment.emotion !== "none" 
                                  ? AVAILABLE_EMOTIONS.find(e => e.id === segment.emotion)?.name || segment.emotion
                                  : AVAILABLE_EMOTIONS.find(e => e.id === "none")?.name || t('noEmotion')
                              } | 
                              {t('status')}: {segment.audioData ? t('generated') : segment.voiceId ? t('pending') : t('notSet')}
                              {editingSegmentId === segment.id && (
                                <span className="text-amber-600 ml-2">{t('editing')}</span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 音频可视化 */}
              {audioVisualizer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/10 shadow-md">
                    <CardContent className="pt-6">
                      <div className="w-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-4 rounded-lg border border-primary/10">
                        <AudioVisualizer 
                          audioContext={audioVisualizer.audioContext}
                          audioSource={audioVisualizer.source}
                          onPause={handlePause}
                          onResume={() => {}} // 移除恢复功能
                          isPlaying={isPlaying}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

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
  );
} 
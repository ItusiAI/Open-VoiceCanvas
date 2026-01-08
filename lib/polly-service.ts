import { SynthesizeSpeechCommand, SynthesizeSpeechCommandInput, LanguageCode, VoiceId } from "@aws-sdk/client-polly";
import { pollyClient } from "./aws-config";
import { AudioCache } from './audio-cache';
import { openai, TTS_MODEL } from './openai';

import { getVoicesByLanguage, AWS_NTTS_VOICES } from './voice-config';
const voiceConfig = {
  "fr-FR": {
    female: "Lea" as VoiceId,
    male: "Chantal" as VoiceId
  },
  "is-IS": {
    female: "Dora" as VoiceId,
    male: "Karl" as VoiceId
  },
  "nb-NO": {
    female: "Liv" as VoiceId,
    male: "Liv" as VoiceId
  },
  "ro-RO": {
    female: "Carmen" as VoiceId,
    male: "Carmen" as VoiceId
  },
  "sv-SE": {
    female: "Astrid" as VoiceId,
    male: "Astrid" as VoiceId
  },
  "es-US": {
    female: "Lupe" as VoiceId,
    male: "Pedro" as VoiceId
  },
  "fi-FI": {
    female: "Suvi" as VoiceId,
    male: "Suvi" as VoiceId
  },
  "yue-CN": {
    female: "Hiujin" as VoiceId,
    male: "Hiujin" as VoiceId
  },
  "ca-ES": {
    female: "Arlet" as VoiceId,
    male: "Arlet" as VoiceId
  },
  "de-AT": {
    female: "Hannah" as VoiceId,
    male: "Hannah" as VoiceId
  },
  "de-CH": {
    female: "Sabrina" as VoiceId,
    male: "Sabrina" as VoiceId
  },
  "en-IE": {
    female: "Niamh" as VoiceId,
    male: "Niamh" as VoiceId
  },
  "en-NZ": {
    female: "Aria" as VoiceId,
    male: "Aria" as VoiceId
  },
  "en-ZA": {
    female: "Ayanda" as VoiceId,
    male: "Ayanda" as VoiceId
  },
  "fr-BE": {
    female: "Isabelle" as VoiceId,
    male: "Isabelle" as VoiceId
  },
  "nl-BE": {
    female: "Lisa" as VoiceId,
    male: "Lisa" as VoiceId
  },
  "ar-AE": {
    female: "Hala" as VoiceId,
    male: "Hala" as VoiceId
  },
  "cs-CZ": {
    female: "Jitka" as VoiceId,
    male: "Jitka" as VoiceId
  }
};

const languageCodeMap = {
  "en-US": "en-US" as LanguageCode,
  "en-GB": "en-GB" as LanguageCode,
  "en-AU": "en-AU" as LanguageCode,
  "zh-CN": "cmn-CN" as LanguageCode,
  "cmn-CN": "cmn-CN" as LanguageCode,
  "fr-FR": "fr-FR" as LanguageCode,
  "es-ES": "es-ES" as LanguageCode,
  "es-MX": "es-MX" as LanguageCode,
  "de-DE": "de-DE" as LanguageCode,
  "it-IT": "it-IT" as LanguageCode,
  "ja-JP": "ja-JP" as LanguageCode,
  "ko-KR": "ko-KR" as LanguageCode,
  "pt-BR": "pt-BR" as LanguageCode,
  "pt-PT": "pt-PT" as LanguageCode,
  "pl-PL": "pl-PL" as LanguageCode,
  "ru-RU": "ru-RU" as LanguageCode,
  "tr-TR": "tr-TR" as LanguageCode,
  "hi-IN": "hi-IN" as LanguageCode,
  "arb": "arb" as LanguageCode,
  "cy-GB": "cy-GB" as LanguageCode,
  "da-DK": "da-DK" as LanguageCode,
  "nl-NL": "nl-NL" as LanguageCode,
  "en-IN": "en-IN" as LanguageCode,
  "en-GB-WLS": "en-GB-WLS" as LanguageCode,
  "fr-CA": "fr-CA" as LanguageCode,
  "is-IS": "is-IS" as LanguageCode,
  "nb-NO": "nb-NO" as LanguageCode,
  "ro-RO": "ro-RO" as LanguageCode,
  "sv-SE": "sv-SE" as LanguageCode,
  "es-US": "es-US" as LanguageCode,
  "fi-FI": "fi-FI" as LanguageCode,
  "yue-CN": "yue-CN" as LanguageCode,
  "ca-ES": "ca-ES" as LanguageCode,
  "de-AT": "de-AT" as LanguageCode,
  "de-CH": "de-CH" as LanguageCode,
  "en-IE": "en-IE" as LanguageCode,
  "en-NZ": "en-NZ" as LanguageCode,
  "en-ZA": "en-ZA" as LanguageCode,
  "en-SG": "en-SG" as LanguageCode,
  "fr-BE": "fr-BE" as LanguageCode,
  "nl-BE": "nl-BE" as LanguageCode,
  "ar-AE": "ar-AE" as LanguageCode,
  "cs-CZ": "cs-CZ" as LanguageCode
};

// Minimax声音配置 (speech-2.6-turbo模型支持40种语言)
const minimaxVoiceMap = {
  female: {
    zh: 'female-qn-qingse',      // 中文（普通话）
    yue: 'female-qn-qingse',     // 粤语
    en: 'female-qn-qingse',      // 英语
    es: 'female-qn-qingse',      // 西班牙语
    fr: 'female-qn-qingse',      // 法语
    ru: 'female-qn-qingse',      // 俄语
    de: 'female-qn-qingse',      // 德语
    pt: 'female-qn-qingse',      // 葡萄牙语
    ar: 'female-qn-qingse',      // 阿拉伯语
    it: 'female-qn-qingse',      // 意大利语
    ja: 'female-qn-qingse',      // 日语
    ko: 'female-qn-qingse',      // 韩语
    id: 'female-qn-qingse',      // 印尼语
    vi: 'female-qn-qingse',      // 越南语
    tr: 'female-qn-qingse',      // 土耳其语
    nl: 'female-qn-qingse',      // 荷兰语
    uk: 'female-qn-qingse',      // 乌克兰语
    th: 'female-qn-qingse',      // 泰语
    pl: 'female-qn-qingse',      // 波兰语
    ro: 'female-qn-qingse',      // 罗马尼亚语
    el: 'female-qn-qingse',      // 希腊语
    cs: 'female-qn-qingse',      // 捷克语
    fi: 'female-qn-qingse',      // 芬兰语
    hi: 'female-qn-qingse',      // 印地语
    bg: 'female-qn-qingse',      // 保加利亚语
    da: 'female-qn-qingse',      // 丹麦语
    he: 'female-qn-qingse',      // 希伯来语
    ms: 'female-qn-qingse',      // 马来语
    fa: 'female-qn-qingse',      // 波斯语
    sk: 'female-qn-qingse',      // 斯洛伐克语
    sv: 'female-qn-qingse',      // 瑞典语
    hr: 'female-qn-qingse',      // 克罗地亚语
    tl: 'female-qn-qingse',      // 菲律宾语
    hu: 'female-qn-qingse',      // 匈牙利语
    no: 'female-qn-qingse',      // 挪威语
    sl: 'female-qn-qingse',      // 斯洛文尼亚语
    ca: 'female-qn-qingse',      // 加泰罗尼亚语
    nn: 'female-qn-qingse',      // 尼诺斯克语
    ta: 'female-qn-qingse',      // 泰米尔语
    af: 'female-qn-qingse'       // 阿非利卡语
  },
  male: {
    zh: 'male-qn-qingse',        // 中文（普通话）
    yue: 'male-qn-qingse',       // 粤语
    en: 'male-qn-qingse',        // 英语
    es: 'male-qn-qingse',        // 西班牙语
    fr: 'male-qn-qingse',        // 法语
    ru: 'male-qn-qingse',        // 俄语
    de: 'male-qn-qingse',        // 德语
    pt: 'male-qn-qingse',        // 葡萄牙语
    ar: 'male-qn-qingse',        // 阿拉伯语
    it: 'male-qn-qingse',        // 意大利语
    ja: 'male-qn-qingse',        // 日语
    ko: 'male-qn-qingse',        // 韩语
    id: 'male-qn-qingse',        // 印尼语
    vi: 'male-qn-qingse',        // 越南语
    tr: 'male-qn-qingse',        // 土耳其语
    nl: 'male-qn-qingse',        // 荷兰语
    uk: 'male-qn-qingse',        // 乌克兰语
    th: 'male-qn-qingse',        // 泰语
    pl: 'male-qn-qingse',        // 波兰语
    ro: 'male-qn-qingse',        // 罗马尼亚语
    el: 'male-qn-qingse',        // 希腊语
    cs: 'male-qn-qingse',        // 捷克语
    fi: 'male-qn-qingse',        // 芬兰语
    hi: 'male-qn-qingse',        // 印地语
    bg: 'male-qn-qingse',        // 保加利亚语
    da: 'male-qn-qingse',        // 丹麦语
    he: 'male-qn-qingse',        // 希伯来语
    ms: 'male-qn-qingse',        // 马来语
    fa: 'male-qn-qingse',        // 波斯语
    sk: 'male-qn-qingse',        // 斯洛伐克语
    sv: 'male-qn-qingse',        // 瑞典语
    hr: 'male-qn-qingse',        // 克罗地亚语
    tl: 'male-qn-qingse',        // 菲律宾语
    hu: 'male-qn-qingse',        // 匈牙利语
    no: 'male-qn-qingse',        // 挪威语
    sl: 'male-qn-qingse',        // 斯洛文尼亚语
    ca: 'male-qn-qingse',        // 加泰罗尼亚语
    nn: 'male-qn-qingse',        // 尼诺斯克语
    ta: 'male-qn-qingse',        // 泰米尔语
    af: 'male-qn-qingse'         // 阿非利卡语
  }
};

// 服务提供商类型
export type SpeechService = 'aws' | 'aws-ntts' | 'minimax' | 'openai';

// 获取服务对应的提供商
export function getProviderFromService(service: SpeechService): 'aws' | 'minimax' | 'openai' {
  if (service === 'aws-ntts') {
    return 'aws';
  }
  return service as 'aws' | 'minimax' | 'openai';
}

// 语音合成选项
export interface SpeechOptions {
  text: string;
  language: string;
  voiceId: VoiceId | string;
  engine?: 'standard' | 'neural';
  speed: number;
  service: SpeechService;
  useClonedVoice?: boolean;
}

// 字符限制
export const SERVICE_LIMITS: Record<SpeechService, number> = {
  aws: 100000,
  'aws-ntts': 100000,
  minimax: 10000,
  openai: 2000
};

export async function synthesizeSpeech({
  text,
  language,
  voiceId,
  engine = 'neural',
  speed = 1.0,
  service = 'aws',
  useClonedVoice = false,
  clonedVoiceId = '',
  vol = 1,
  pitch = 0,
  sampleRate = 32000,
  bitrate = 128000,
  channel = 1,
  emotion = undefined
}: {
  text: string;
  language: string;
  voiceId: string;
  engine?: 'standard' | 'neural';
  speed?: number;
  service?: SpeechService;
  useClonedVoice?: boolean;
  clonedVoiceId?: string;
  vol?: number;
  pitch?: number;
  sampleRate?: number;
  bitrate?: number;
  channel?: number;
  emotion?: "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral";
}): Promise<ArrayBuffer> {
  // 检查当前选择的语言是否支持指定的引擎
  if (service === 'aws-ntts') {
    const nttsLanguages = AWS_NTTS_VOICES.map(lang => lang.languageCode);
    
    // 如果当前语言不支持神经引擎，切换到支持神经引擎的默认语言
    if (!nttsLanguages.includes(language)) {
      console.warn(`语言 ${language} 不支持神经引擎，将使用默认的英语语言`);
      language = 'en-US'; // 默认切换到美式英语
      
      // 获取该语言的默认神经引擎声音
      const defaultVoice = AWS_NTTS_VOICES.find(v => v.languageCode === 'en-US')?.defaultVoice;
      if (defaultVoice) {
        voiceId = defaultVoice;
        console.log(`已自动选择神经引擎支持的声音: ${voiceId}`);
      }
    }
  }

  if (service === 'minimax') {
    // 转换语言代码
    const minimaxLanguage = getMinimaxLanguageCode(language);

    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language: minimaxLanguage,
        voiceId,
        speed,
        useClonedVoice,
        vol,
        pitch,
        sampleRate,
        bitrate,
        channel,
        emotion
      })
    });

    if (!response.ok) {
      let errorMessage = '语音合成失败';
      try {
        const errorData = await response.json();
        console.error('API 响应:', errorData);
        if (errorData.error) {
          // 如果是API错误，直接显示错误信息
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        }
      } catch (e) {
        console.error('解析错误响应失败:', e);
      }
      throw new Error(errorMessage);
    }

    return await response.arrayBuffer();
  } else {
    // 1. 检查缓存
    const cacheKey = AudioCache.getCacheKey({
      text,
      language,
      voiceId,
      engine,
      speed,
      service
    });
    
    const cachedAudio = AudioCache.get(cacheKey);
    if (cachedAudio) {
      return cachedAudio;
    }

    // 2. 根据服务选择生成方式
    let audioData: ArrayBuffer;
    
    if (service === 'openai') {
      audioData = await synthesizeWithOpenai(text, language, voiceId, speed);
    } else if (service === 'aws-ntts') {
      // 使用神经引擎前检查声音是否支持
      const neuralVoices = AWS_NTTS_VOICES.flatMap(lang => lang.voices.map(voice => voice.id));
      const voiceSupportsNeural = neuralVoices.includes(voiceId);
      
      if (!voiceSupportsNeural) {
        // 如果声音不支持神经引擎，尝试找到同语言下支持神经引擎的声音
        const languageGroup = AWS_NTTS_VOICES.find(lang => lang.languageCode === language);
        if (languageGroup && languageGroup.voices.length > 0) {
          // 使用支持神经引擎的默认声音
          console.log(`声音 ${voiceId} 不支持神经引擎，切换到 ${languageGroup.defaultVoice}`);
          audioData = await synthesizeWithPolly(
            text, 
            language, 
            { voiceId: languageGroup.defaultVoice as VoiceId, engine: 'neural' }, 
            speed
          );
        } else {
          // 如果这个语言没有支持神经引擎的声音，回退到标准引擎
          console.log(`语言 ${language} 没有支持神经引擎的声音，使用标准引擎`);
          audioData = await synthesizeWithPolly(text, language, { voiceId: voiceId as VoiceId, engine: 'standard' }, speed);
        }
      } else {
        // 声音支持神经引擎
        audioData = await synthesizeWithPolly(text, language, { voiceId: voiceId as VoiceId, engine: 'neural' }, speed);
      }
    } else {
      // 默认AWS标准引擎
      audioData = await synthesizeWithPolly(text, language, { voiceId: voiceId as VoiceId, engine: 'standard' }, speed);
    }

    // 3. 存入缓存
    AudioCache.set(cacheKey, audioData);
    
    return audioData;
  }
}

// Minimax支持的语言代码映射 (speech-2.6-turbo模型支持40种语言)
const minimaxLanguageMap = {
  'zh-CN': 'zh',        // 中文（普通话）
  'yue-CN': 'yue',      // 粤语
  'en-US': 'en',        // 英语
  'es-ES': 'es',        // 西班牙语
  'fr-FR': 'fr',        // 法语
  'ru-RU': 'ru',        // 俄语
  'de-DE': 'de',        // 德语
  'pt-PT': 'pt',        // 葡萄牙语
  'ar-SA': 'ar',        // 阿拉伯语
  'it-IT': 'it',        // 意大利语
  'ja-JP': 'ja',        // 日语
  'ko-KR': 'ko',        // 韩语
  'id-ID': 'id',        // 印尼语
  'vi-VN': 'vi',        // 越南语
  'tr-TR': 'tr',        // 土耳其语
  'nl-NL': 'nl',        // 荷兰语
  'uk-UA': 'uk',        // 乌克兰语
  'th-TH': 'th',        // 泰语
  'pl-PL': 'pl',        // 波兰语
  'ro-RO': 'ro',        // 罗马尼亚语
  'el-GR': 'el',        // 希腊语
  'cs-CZ': 'cs',        // 捷克语
  'fi-FI': 'fi',        // 芬兰语
  'hi-IN': 'hi',        // 印地语
  'bg-BG': 'bg',        // 保加利亚语
  'da-DK': 'da',        // 丹麦语
  'he-IL': 'he',        // 希伯来语
  'ms-MY': 'ms',        // 马来语
  'fa-IR': 'fa',        // 波斯语
  'sk-SK': 'sk',        // 斯洛伐克语
  'sv-SE': 'sv',        // 瑞典语
  'hr-HR': 'hr',        // 克罗地亚语
  'tl-PH': 'tl',        // 菲律宾语
  'hu-HU': 'hu',        // 匈牙利语
  'no-NO': 'no',        // 挪威语
  'sl-SI': 'sl',        // 斯洛文尼亚语
  'ca-ES': 'ca',        // 加泰罗尼亚语
  'nn-NO': 'nn',        // 尼诺斯克语
  'ta-IN': 'ta',        // 泰米尔语
  'af-ZA': 'af'         // 阿非利卡语
} as const;

function isMinimaxSupported(language: string): boolean {
  return language in minimaxLanguageMap;
}

function getMinimaxLanguageCode(pollyLanguage: string): string {
  return minimaxLanguageMap[pollyLanguage as keyof typeof minimaxLanguageMap] || pollyLanguage;
}

async function synthesizeWithMinimax(
  text: string, 
  language: string, 
  isFemale: boolean, 
  speed: number = 1,
  vol: number = 1,
  pitch: number = 0,
  sampleRate: number = 32000,
  bitrate: number = 128000,
  channel: number = 1,
  emotion?: "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral"
): Promise<ArrayBuffer> {
  const minimaxLanguage = getMinimaxLanguageCode(language);
  // 非中文固定使用女声
  const voiceId = language === 'zh-CN' 
    ? (isFemale ? minimaxVoiceMap.female[minimaxLanguage as keyof typeof minimaxVoiceMap.female]
                : minimaxVoiceMap.male[minimaxLanguage as keyof typeof minimaxVoiceMap.male])
    : minimaxVoiceMap.female[minimaxLanguage as keyof typeof minimaxVoiceMap.female];

  const response = await fetch('/api/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      language: minimaxLanguage,
      voiceId,
      speed,
      vol,
      pitch,
      sampleRate,
      bitrate,
      channel,
      emotion
    }),
  });

  if (!response.ok) {
    throw new Error('语音生成失败');
  }

  return await response.arrayBuffer();
}

async function synthesizeWithOpenai(
  text: string, 
  language: string, 
  voiceId: string, 
  speed: number
): Promise<ArrayBuffer> {
  try {
    console.log('开始OpenAI TTS请求...');
    const response = await fetch('/api/voice/openai-tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: voiceId,
        speed
      }),
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI TTS请求失败:', response.status, response.statusText, errorData);
      throw new Error(`语音生成失败: ${response.status} ${response.statusText} ${errorData.error || ''}`);
    }

    console.log('OpenAI TTS请求成功，处理响应...');
    // 使用blob()而不是arrayBuffer()，避免ArrayBuffer被分离
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error: any) {
    // 无论是网络错误、超时、服务器错误还是其他任何错误，都切换到AWS Polly
    console.warn('OpenAI TTS请求失败，切换到AWS Polly作为备选方案:', error);
    
    // 确定适合的AWS Polly声音ID
    let awsVoiceId: VoiceId = 'Joanna'; // 默认英语女声
    
    // 根据语言代码选择合适的AWS Polly声音
    // 使用更全面的语言映射
    if (language.startsWith('zh')) {
      awsVoiceId = 'Zhiyu'; // 中文
    } else if (language.startsWith('ja')) {
      awsVoiceId = 'Takumi'; // 日语
    } else if (language.startsWith('fr')) {
      awsVoiceId = 'Lea'; // 法语
    } else if (language.startsWith('de')) {
      awsVoiceId = 'Vicki'; // 德语
    } else if (language.startsWith('es')) {
      awsVoiceId = 'Lupe'; // 西班牙语
    } else if (language.startsWith('it')) {
      awsVoiceId = 'Bianca'; // 意大利语
    } else if (language.startsWith('pt')) {
      awsVoiceId = 'Camila'; // 葡萄牙语
    } else if (language.startsWith('ru')) {
      awsVoiceId = 'Tatyana'; // 俄语
    } else if (language.startsWith('ar')) {
      awsVoiceId = 'Zeina'; // 阿拉伯语
    } else if (language.startsWith('hi')) {
      awsVoiceId = 'Aditi'; // 印地语
    } else if (language.startsWith('ko')) {
      awsVoiceId = 'Seoyeon'; // 韩语
    } else if (language.startsWith('pl')) {
      awsVoiceId = 'Ewa'; // 波兰语
    } else if (language.startsWith('sv')) {
      awsVoiceId = 'Astrid'; // 瑞典语
    } else if (language.startsWith('tr')) {
      awsVoiceId = 'Filiz'; // 土耳其语
    } else if (language.startsWith('nl')) {
      awsVoiceId = 'Lotte'; // 荷兰语
    } else if (language.startsWith('da')) {
      awsVoiceId = 'Naja'; // 丹麦语
    } else if (language.startsWith('no')) {
      awsVoiceId = 'Liv'; // 挪威语
    } else if (language.startsWith('is')) {
      awsVoiceId = 'Dora'; // 冰岛语
    } else if (language.startsWith('ro')) {
      awsVoiceId = 'Carmen'; // 罗马尼亚语
    } else if (language.startsWith('fi')) {
      awsVoiceId = 'Suvi'; // 芬兰语
    } else if (language.startsWith('cs')) {
      awsVoiceId = 'Jitka'; // 捷克语
    } else if (language.startsWith('ca')) {
      awsVoiceId = 'Arlet'; // 加泰罗尼亚语
    } else if (language.startsWith('cy')) {
      awsVoiceId = 'Gwyneth'; // 威尔士语
    } else if (language.startsWith('uk') || 
               language.startsWith('hu') || 
               language.startsWith('th') || 
               language.startsWith('id') || 
               language.startsWith('ms') || 
               language.startsWith('vi')) {
      // 对于不直接支持的语言，使用英语默认声音
      // 根据OpenAI声音选择对应的英语声音
      switch (voiceId) {
        case 'alloy':
        case 'echo':
        case 'fable':
        case 'shimmer':
        case 'coral':
        case 'sage':
          awsVoiceId = 'Joanna'; // 女声
          break;
        case 'onyx':
        case 'nova':
        case 'ash':
        case 'ballad':
          awsVoiceId = 'Matthew'; // 男声
          break;
        default:
          awsVoiceId = 'Joanna';
      }
    } else {
      // 根据OpenAI声音选择对应的英语声音
      switch (voiceId) {
        case 'alloy':
        case 'echo':
        case 'fable':
          awsVoiceId = 'Joanna'; // 女声
          break;
        case 'onyx':
        case 'nova':
          awsVoiceId = 'Matthew'; // 男声
          break;
        case 'shimmer':
          awsVoiceId = 'Kendra'; // 女声
          break;
        case 'ash':
          awsVoiceId = 'Joey'; // 男声
          break;
        case 'coral':
          awsVoiceId = 'Salli'; // 女声
          break;
        case 'ballad':
          awsVoiceId = 'Justin'; // 男声
          break;
        case 'sage':
          awsVoiceId = 'Amy'; // 女声
          break;
        default:
          awsVoiceId = 'Joanna';
      }
    }
    
    console.log(`切换到AWS Polly备选方案，使用声音: ${awsVoiceId}，原始语言: ${language}`);
    
    // 使用AWS Polly作为备选方案
    return await synthesizeWithPolly(text, language, { voiceId: awsVoiceId, engine: 'neural' }, speed);
  }
}

// 优化 Polly 合成函数
export interface PollyVoiceOptions {
  voiceId: VoiceId;
  engine?: 'standard' | 'neural';
}

async function synthesizeWithPolly(
  text: string,
  language: string,
  voiceOptions: PollyVoiceOptions,
  speed: number
): Promise<ArrayBuffer> {
  try {
    const languageCode = languageCodeMap[language as keyof typeof languageCodeMap] || languageCodeMap["en-US"];
    const { voiceId, engine = 'standard' } = voiceOptions;

    if (!voiceId) {
      throw new Error("语音ID不能为空");
    }

    // 查找此voice是否支持指定的engine
    let isEngineSupported = true;
    
    if (engine === 'neural') {
      // 检查所选声音是否支持神经引擎
      const neuralVoices = AWS_NTTS_VOICES.flatMap(lang => lang.voices.map(voice => voice.id));
      isEngineSupported = neuralVoices.includes(voiceId);
      
      if (!isEngineSupported) {
        console.warn(`声音 ${voiceId} 不支持神经引擎，将使用标准引擎代替`);
      }
    }
    
    // 如果不支持神经引擎，则使用标准引擎
    const finalEngine = isEngineSupported ? engine : 'standard';

    // 使用 AbortController 设置超时
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const input: SynthesizeSpeechCommandInput = {
      Engine: finalEngine,
      LanguageCode: languageCode,
      OutputFormat: "mp3",
      SampleRate: "24000",
      Text: text,
      TextType: "text",
      VoiceId: voiceId
    };

    const command = new SynthesizeSpeechCommand(input);
    const response = await Promise.race([
      pollyClient.send(command),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Polly 请求超时")), 10000)
      )
    ]);

    clearTimeout(timeout);

    if (!response.AudioStream) {
      throw new Error("No audio stream returned");
    }

    return new Uint8Array(await response.AudioStream.transformToByteArray()).buffer;
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw error;
  }
}

interface PlayAudioResult {
  audioContext: AudioContext;
  source: AudioBufferSourceNode;
}

export async function playPollyAudio(audioData: ArrayBuffer, speed: number = 1): Promise<PlayAudioResult> {
  // 创建一个新的ArrayBuffer副本，避免使用可能已分离的ArrayBuffer
  const blob = new Blob([audioData], { type: 'audio/mp3' });
  const freshArrayBuffer = await blob.arrayBuffer();
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(freshArrayBuffer);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = speed;
  source.connect(audioContext.destination);
  source.start(0);
  
  return { audioContext, source };
}

export async function downloadAudio(audioData: ArrayBuffer, filename: string) {
  const blob = new Blob([audioData], { type: 'audio/mp3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function hasSingleVoice(language: string, service?: SpeechService): boolean {
  // 统一逻辑：通过检查实际可用音色数量来判断
  const voices = getVoicesByLanguage(language, service === 'minimax' ? 'minimax' : service === 'aws-ntts' ? 'aws-ntts' : service === 'openai' ? 'openai' : 'aws');
  if (voices.length === 0) return false;
  return voices.length === 1;
}

export const minimaxLanguages = {
  'zh-CN': 'zh',
  'en-US': 'en',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'es-ES': 'es',
  'fr-FR': 'fr',
  'ru-RU': 'ru',
  'it-IT': 'it',
  'pt-PT': 'pt',
  'de-DE': 'de',
  'id-ID': 'id',
  'vi-VN': 'vi',
  'uk-UA': 'uk',
  'th-TH': 'th',
  'tr-TR': 'tr',
  'ar-SA': 'ar',
  'nl-NL': 'nl',
  'pl-PL': 'pl',
  'ro-RO': 'ro',
  'el-GR': 'el',
  'cs-CZ': 'cs',
  'fi-FI': 'fi',
  'hi-IN': 'hi',
  'yue-CN': 'yue'
} as const;

export async function playMinimaxAudio(audioData: ArrayBuffer, speed: number = 1): Promise<PlayAudioResult> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    // A创建一个新的ArrayBuffer副本，避免使用可能已分离的ArrayBuffer
    const blob = new Blob([audioData], { type: 'audio/mp3' });
    const freshArrayBuffer = await blob.arrayBuffer();
    
    const audioBuffer = await audioContext.decodeAudioData(freshArrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed;
    source.connect(audioContext.destination);
    source.start(0);
    
    return { audioContext, source };
  } catch (error) {
    audioContext.close();
    throw error;
  }
}
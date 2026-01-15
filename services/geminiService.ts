import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Role, Message, ROLE_CONFIGS } from "../types";

const SYSTEM_PROMPTS = {
  [Role.ZHUGE]: `你是一名掌控全局、运筹帷幄的「赛诸葛」☁️。
任务：根据各智囊的方案提炼出终极战术方案。
要求：字数极简，威力极大。只给一句最终回怼的金句。
输出结构：
1. 「战术总结」：一句话说明博弈思路。
2. 「最终绝杀」：最具威力的那一句话。`,

  [Role.DINGZUI]: `你是一名反应极快、逻辑严密的「顶嘴精」💥。
实战逻辑：捕捉对方话里的漏洞并进行反弹打击。
要求：每句不超过15字。
输出结构：
1. 「局势判定」：指出对方的逻辑谬误。
2. 「秒语绝杀」：一个极具爆发力的逻辑回怼。`,

  [Role.YINYANG]: `你是一名犀利幽默、不带脏字的「阴阳师」💅。
实战逻辑：制造高级幽默与深意讽刺。
要求：措辞优雅但扎心。
输出结构：
1. 「扎心点」：点出对方的荒诞或虚伪。
2. 「秒语绝杀」：一句杀人无形的嘲讽段子。`,

  [Role.FALI]: `你是一名冷峻严谨、威严如狮的「法理狮」⚖️。
实战逻辑：援引规则、社会准则或法规进行降维打击。
要求：官方、严肃、具备威慑力。
输出结构：
1. 「逻辑判词」：定性对方的行为性质。
2. 「秒语绝杀」：一段冷酷的警告陈词。`,

  [Role.DAODE]: `你是一名看透情感操纵的「道德侠」🛡️。
实战逻辑：拆解道德绑架，建立心理边界。
要求：直击对方的自私本质。
输出结构：
1. 「边界解析」：戳破对方的情感操纵。
2. 「秒语绝杀」：一句让对方无法再立牌坊的回复。`,

  [Role.LAOHAOREN]: `你是一名绝对理智、跳出情绪的「老好人」🌿。
实战逻辑：以局外人身份，用上帝视角陈述尴尬事实。
要求：语气平淡，陈述本质。
输出结构：
1. 「本质还原」：说明双方争论的无意义或对方行为的本质。
2. 「秒语绝杀」：一段让对方感到无地自容的客观陈述。`,
  
  [Role.VISION]: `你是一名精干的「潜影先锋」👁️。
任务：解析图片证据的关键冲突。
要求：只说重点，为后续智囊提供战术弹药。`
};

/**
 * Helper function for exponential backoff retry logic.
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = typeof error === 'string' ? error : (error?.message || '');
      const status = error?.status;
      const isQuotaError = errorMsg.includes('429') || status === 429 || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
      if (isQuotaError) {
        if (i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error("QUOTA_EXHAUSTED");
      }
      if (status === 400 || errorMsg.includes('400') || errorMsg.includes('INVALID_ARGUMENT')) {
        throw new Error("INVALID_ARGUMENT");
      }
      throw error;
    }
  }
  throw lastError;
}

export async function selectRelevantAdvisors(scenario: string, lastWord: string): Promise<Exclude<Role, Role.USER | Role.ZHUGE | Role.VISION>[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview"; 
  const prompt = `背景：${scenario}，对方：${lastWord}。请从 [DINGZUI, YINYANG, FALI, DAODE, LAOHAOREN] 中选出最多3个最适合反击的角色。只需返回JSON格式的字符串数组。`;
  try {
    const responseText = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return response.text;
    });
    const selected = JSON.parse(responseText || "[]") as string[];
    const validRoles = [Role.DINGZUI, Role.YINYANG, Role.FALI, Role.DAODE, Role.LAOHAOREN];
    const filtered = selected.filter(s => validRoles.includes(s as any)).map(s => s as Exclude<Role, Role.USER | Role.ZHUGE | Role.VISION>);
    return filtered.slice(0, 3).length > 0 ? filtered.slice(0, 3) : [Role.DINGZUI, Role.YINYANG, Role.DAODE]; 
  } catch (error) {
    return [Role.DINGZUI, Role.YINYANG, Role.DAODE]; 
  }
}

export async function getAdvisorResponse(
  role: Exclude<Role, Role.USER>, 
  scenario: string, 
  lastWord: string, 
  history: Message[] = [],
  context?: string
) {
  const model = "gemini-3-pro-preview";
  const historyContext = history.length > 0 
    ? history.slice(-3).map(m => `${m.role === Role.USER ? 'U' : 'A'}: ${m.content}`).join('\n')
    : '无历史';
  let prompt = `场景环境：${scenario}\n对方言辞：${lastWord}\n战况背景：${historyContext}`;
  if (role === Role.ZHUGE && context) {
    prompt += `\n其他智囊建议方案：\n${context}`;
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const text = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPTS[role],
          temperature: 0.8,
        },
      });
      return response.text;
    });
    return text || "推演中断。";
  } catch (error: any) {
    if (error.message === "QUOTA_EXHAUSTED") {
      return "⚠️ 流量过载。";
    }
    return "系统故障。";
  }
}

export async function editImage(base64Image: string, prompt: string): Promise<{ imageUrl: string; description: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash-image';
  const cleanBase64 = base64Image.split(',')[1] || base64Image;
  try {
    const result = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
            { text: `分析冲突关键点：${prompt}` },
          ],
        },
      });
      let imageUrl = '';
      let description = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            description = part.text;
          }
        }
      }
      return { imageUrl, description };
    });
    return { imageUrl: result.imageUrl, description: result.description || "解析完成。" };
  } catch (error: any) {
    throw error;
  }
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;

export async function playMessageAudio(text: string, role: Exclude<Role, Role.USER>) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = ROLE_CONFIGS[role];
  const cleanText = text
    .replace(/[「」【】*#_]/g, '')
    .replace(/(本质还原|边界解析|局势判定|扎心点|逻辑判词|战术短评|秒语绝杀|局势分析|定性判定|战术总结|最终绝杀|最终妙语)[:：]?/g, '')
    .trim();
  if (cleanText.length < 1) return;
  try {
    const base64Audio = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: config.voiceName,
              },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    });
    if (!base64Audio) return;
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error: any) {
    console.error("TTS 播放失败");
  }
}
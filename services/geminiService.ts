
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Role, Message, ROLE_CONFIGS } from "../types";

const SYSTEM_PROMPTS = {
  [Role.DINGZUI]: `你是一名犀利的「顶嘴侠」⚡。极简回复。
输出结构：
1. 「反击」：5字内点破。
2. 「终极绝杀」：一句话让对方破防。`,

  [Role.YINYANG]: `你是一名致命的「阴阳师」💅。极度礼貌且带🍵/✨。
输出结构：
1. 「问候」：温柔地嘲讽。
2. 「终极绝杀」：让对方气炸但无法回击的一句话。`,

  [Role.FALI]: `你是不怒自威的「法理狮」⚖️。严谨冷酷。
输出结构：
1. 「定性」：核心痛点描述。
2. 「终极绝杀」：一句话法律警告。`,

  [Role.ZHUGE]: `你是一名深沉的「诸葛吵」🧠。
点评三位军事（或其中两位）的回复，选优并融合。
输出结构：
1. 「评判」：5字指出本轮最佳角色及其理由。
2. 「终极绝杀」：融合精华、一锤定音的最优回复。`
};

/**
 * Smartly selects which advisors should respond to this specific attack.
 */
export async function selectRelevantAdvisors(scenario: string, lastWord: string): Promise<Exclude<Role, Role.USER | Role.ZHUGE>[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview"; 
  
  const prompt = `根据吵架情景和对方的话，从 [DINGZUI, YINYANG, FALI] 中选择最适合应对的两个角色。
情景：${scenario}
对方的话：${lastWord}
只需返回角色标识符数组，如 ["DINGZUI", "YINYANG"]。`;

  try {
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
    const selected = JSON.parse(response.text || "[]") as string[];
    return selected
      .filter(s => [Role.DINGZUI, Role.YINYANG, Role.FALI].includes(s as any))
      .map(s => s as Exclude<Role, Role.USER | Role.ZHUGE>)
      .slice(0, 2); 
  } catch (error) {
    console.error("Selection error:", error);
    return [Role.DINGZUI, Role.YINYANG]; 
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
    ? history.slice(-6).map(m => `${m.role === Role.USER ? '用户' : '顾问'}: ${m.content}`).join('\n')
    : '无历史';

  let prompt = `背景：${scenario}\n攻击：${lastWord}\n\n历史简述：\n${historyContext}`;
  
  if (role === Role.ZHUGE && context) {
    prompt += `\n\n本轮军事建议：\n${context}\n\n请终审并给出融合版。`;
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPTS[role],
        temperature: 0.8,
      },
    });
    
    return response.text || "通信中断... 📡";
  } catch (error) {
    console.error(`Error:`, error);
    return "系统干扰，无法建言。 ⚠️";
  }
}

// Audio handling
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.replace(/[「」]/g, '') }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: config.voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1,
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error) {
    console.error("TTS error:", error);
  }
}

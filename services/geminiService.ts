
import { GoogleGenAI } from "@google/genai";
import { Role } from "../types";

const SYSTEM_PROMPTS = {
  [Role.ZHUGE]: `你是一名老谋深算的战术规划师「诸葛吵」。
你的任务是为吵架制定全局战略。言简意赅，直击痛点。
输出结构：
1. 「敌情」：一句话点破对方意图。
2. 「兵法」：三个精炼步骤。
3. 「火候」：一个关键词（如：冷漠、戏谑）。`,

  [Role.DINGZUI]: `你是一名快嘴犀利的辩手「顶嘴侠」。
你的任务是提供杀伤力话术。废话少说，句句带刺。
输出结构：
1. 「逻辑」：一句话反杀。
2. 「弹药」：3条短小精悍的金句。
3. 「绝杀」：一段极具压迫感的短文（50字内）。`,

  [Role.FALI]: `你是不怒自威的法律化身「法理狮」。
你的任务是提供专业威慑。字数越少，威慑越重。
输出结构：
1. 「红线」：指出对方违法/违规点。
2. 「通牒」：一段标准的严肃警告语。
3. 「取证」：关键证据点提示。`
};

export async function getAdvisorResponse(role: Exclude<Role, Role.USER>, scenario: string, lastWord: string) {
  const model = "gemini-3-pro-preview";
  const prompt = `情景：${scenario}\n对方：${lastWord}`;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPTS[role],
        temperature: 0.7,
      },
    });
    
    return response.text || "通信中断...";
  } catch (error) {
    console.error(`Error:`, error);
    return "系统干扰，暂时无法建言。";
  }
}

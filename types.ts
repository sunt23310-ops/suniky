
export enum Role {
  USER = 'USER',
  ZHUGE = 'ZHUGE', // 诸葛吵 - 终审裁决
  DINGZUI = 'DINGZUI', // 顶嘴侠
  YINYANG = 'YINYANG', // 阴阳师
  FALI = 'FALI' // 法理狮
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface RoleConfig {
  name: string;
  title: string;
  avatar: string;
  color: string;
  description: string;
  icon: string;
  voiceName: string;
}

export const ROLE_CONFIGS: Record<Exclude<Role, Role.USER>, RoleConfig> = {
  [Role.DINGZUI]: {
    name: '顶嘴侠',
    title: '前线突击手',
    avatar: 'https://images.unsplash.com/photo-1519337265831-281ec6cc8514?w=200&h=200&fit=crop',
    color: 'from-red-600 to-orange-600',
    description: '逻辑鬼才，快准狠，专治各种不服。',
    icon: 'fa-bolt',
    voiceName: 'Kore' // Sharp/Energetic
  },
  [Role.YINYANG]: {
    name: '阴阳师',
    title: '心理打击者',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    color: 'from-purple-500 to-fuchsia-700',
    description: '极度温柔，字字见血，让人无话可说。',
    icon: 'fa-wand-magic-sparkles',
    voiceName: 'Puck' // Soft/Calm
  },
  [Role.FALI]: {
    name: '法理狮',
    title: '规则仲裁者',
    avatar: 'https://images.unsplash.com/photo-1589216532372-1c2a11f90d4e?w=200&h=200&fit=crop',
    color: 'from-slate-600 to-slate-900',
    description: '法典化身，威严冷酷，以降维打击制胜。',
    icon: 'fa-scale-balanced',
    voiceName: 'Charon' // Authoritative/Deep
  },
  [Role.ZHUGE]: {
    name: '诸葛吵',
    title: '总参谋长',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    color: 'from-blue-600 to-indigo-800',
    description: '算无遗策，点评全场并给出一锤定音的最佳回复。',
    icon: 'fa-chess-king',
    voiceName: 'Zephyr' // Wise/Balanced
  }
};

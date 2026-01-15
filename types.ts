export enum Role {
  USER = 'USER',
  ZHUGE = 'ZHUGE', // 赛诸葛 - 策略军师
  DINGZUI = 'DINGZUI', // 顶嘴精 - 逻辑辩手
  YINYANG = 'YINYANG', // 阴阳师 - 犀利段子手
  FALI = 'FALI', // 法理狮 - 法律顾问
  DAODE = 'DAODE', // 道德侠 - 情感攻防师
  LAOHAOREN = 'LAOHAOREN', // 老好人 - 冷静复盘者
  VISION = 'VISION' // 潜影先锋 - 物证解析员
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  imageUrl?: string;
}

export interface SavedBattle {
  id: string;
  scenario: string;
  messages: Message[];
  timestamp: number;
}

export interface RoleConfig {
  name: string;
  title: string;
  avatar: string;
  color: string;
  accent: string;
  glow: string;
  description: string;
  icon: string;
  voiceName: string;
  skills: string[];
  stats: {
    label: string;
    value: number;
  }[];
}

export const ROLE_CONFIGS: Record<Exclude<Role, Role.USER>, RoleConfig> = {
  [Role.ZHUGE]: {
    name: '赛诸葛',
    title: '策略军师',
    avatar: 'https://images.unsplash.com/photo-1611003228941-98a521681248?w=400&h=400&fit=crop', // Wise Owl
    color: 'from-blue-400 to-indigo-900',
    accent: '#818cf8',
    glow: 'shadow-[0_0_20px_rgba(129,140,248,0.4)]',
    description: '制定战术节奏与心理博弈。擅长从宏观角度拆解对方心理，步步为营。',
    icon: 'fa-scroll',
    voiceName: 'Zephyr',
    skills: ['战术节奏控制', '心理博弈推演', '格局降维打击'],
    stats: [
      { label: '谋略值', value: 100 },
      { label: '冷静度', value: 95 },
      { label: '预测准度', value: 98 }
    ]
  },
  [Role.DINGZUI]: {
    name: '顶嘴精',
    title: '逻辑辩手',
    avatar: 'https://images.unsplash.com/photo-1603483080228-04f2313d9f10?w=400&h=400&fit=crop', // Feisty Red Panda
    color: 'from-red-400 to-orange-700',
    accent: '#fb923c',
    glow: 'shadow-[0_0_20px_rgba(251,146,60,0.4)]',
    description: '拆解逻辑谬误与事实反驳。精准捕捉对方漏洞，快速反弹伤害。',
    icon: 'fa-bolt',
    voiceName: 'Fenrir',
    skills: ['逻辑漏洞捕捉', '事实快速反驳', '高频回击'],
    stats: [
      { label: '反应速度', value: 99 },
      { label: '攻击性', value: 98 },
      { label: '逻辑力', value: 95 }
    ]
  },
  [Role.FALI]: {
    name: '法理狮',
    title: '法律顾问',
    avatar: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=400&fit=crop', // Regal Lion
    color: 'from-amber-400 to-yellow-900',
    accent: '#facc15',
    glow: 'shadow-[0_0_20px_rgba(250,204,21,0.4)]',
    description: '援引法规与进行正式警告。用最严肃的口吻让对方知难而退，建立规则威慑。',
    icon: 'fa-gavel',
    voiceName: 'Charon',
    skills: ['法律条文引用', '正式威慑警告', '社会准则定性'],
    stats: [
      { label: '威严感', value: 100 },
      { label: '理智值', value: 99 },
      { label: '说服力', value: 96 }
    ]
  },
  [Role.DAODE]: {
    name: '道德侠',
    title: '情感攻防师',
    avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop', // Righteous Dog
    color: 'from-pink-400 to-rose-800',
    accent: '#fb7185',
    glow: 'shadow-[0_0_20px_rgba(251,113,133,0.4)]',
    description: '化解道德绑架与情感操纵。反向PUA对方，夺回情感主导权。',
    icon: 'fa-heart-circle-check',
    voiceName: 'Kore',
    skills: ['道德绑架拆解', '情感操纵阻断', '同理心回弹'],
    stats: [
      { label: '防御力', value: 98 },
      { label: '心理穿透', value: 95 },
      { label: '慈悲度', value: 40 }
    ]
  },
  [Role.YINYANG]: {
    name: '阴阳师',
    title: '犀利段子手',
    avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop', // Sarcastic Cat
    color: 'from-purple-400 to-indigo-950',
    accent: '#a78bfa',
    glow: 'shadow-[0_0_20px_rgba(167,139,250,0.4)]',
    description: '制造幽默讽刺与犀利回击。不带脏字，用最高级的幽默扎透对方的心。',
    icon: 'fa-masks-theater',
    voiceName: 'Puck',
    skills: ['金句讽刺', '隐喻打击', '情绪干扰'],
    stats: [
      { label: '扎心指数', value: 99 },
      { label: '幽默感', value: 97 },
      { label: '艺术感', value: 94 }
    ]
  },
  [Role.LAOHAOREN]: {
    name: '老好人',
    title: '冷静复盘者',
    avatar: 'https://images.unsplash.com/photo-1629898084814-232185c74780?w=400&h=400&fit=crop', // Chill Capybara
    color: 'from-slate-400 to-slate-800',
    accent: '#94a3b8',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.4)]',
    description: '跳出情绪梳理问题本质。以“理客中”身份描述事实，让对方在羞愧中冷静。',
    icon: 'fa-snowflake',
    voiceName: 'Zephyr',
    skills: ['事实去情绪化', '矛盾核心定位', '物理降温'],
    stats: [
      { label: '客观度', value: 100 },
      { label: '稳定感', value: 98 },
      { label: '透明度', value: 95 }
    ]
  },
  [Role.VISION]: {
    name: '潜影先锋',
    title: '物证解析员',
    avatar: 'https://images.unsplash.com/photo-1511094059471-3c99b923746a?w=400&h=400&fit=crop', // Raccoon Investigator
    color: 'from-emerald-400 to-teal-900',
    accent: '#2dd4bf',
    glow: 'shadow-[0_0_20px_rgba(45,212,191,0.4)]',
    description: '视觉证据链条构建。从截图中分析情绪、语气与冲突关键点。',
    icon: 'fa-magnifying-glass-chart',
    voiceName: 'Kore',
    skills: ['物证提取', '动机拆解', '现场还原'],
    stats: [
      { label: '洞察力', value: 98 },
      { label: '严谨度', value: 97 },
      { label: '情报力', value: 95 }
    ]
  }
};
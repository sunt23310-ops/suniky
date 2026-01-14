
export enum Role {
  USER = 'USER',
  ZHUGE = 'ZHUGE', // 诸葛吵
  DINGZUI = 'DINGZUI', // 顶嘴侠
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
}

export const ROLE_CONFIGS: Record<Exclude<Role, Role.USER>, RoleConfig> = {
  [Role.ZHUGE]: {
    name: '诸葛吵',
    title: '战术规划师',
    avatar: 'https://picsum.photos/seed/zhuge/200',
    color: 'from-blue-600 to-indigo-800',
    description: '运筹帷幄的智者，精通人心与节奏，制定全局战略。',
    icon: 'fa-chess-king'
  },
  [Role.DINGZUI]: {
    name: '顶嘴侠',
    title: '前线突击手',
    avatar: 'https://picsum.photos/seed/dingzui/200',
    color: 'from-red-600 to-orange-600',
    description: '反应神速、逻辑鬼才，生成杀伤性话术。',
    icon: 'fa-bolt'
  },
  [Role.FALI]: {
    name: '法理狮',
    title: '规则仲裁者',
    avatar: 'https://picsum.photos/seed/fali/200',
    color: 'from-slate-600 to-slate-900',
    description: '冷静威严，手持法典，提供底线护盾。',
    icon: 'fa-scale-balanced'
  }
};

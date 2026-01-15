import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Role, Message, ROLE_CONFIGS, SavedBattle } from './types';
import { getAdvisorResponse, selectRelevantAdvisors, editImage } from './services/geminiService';
import MessageItem from './components/MessageItem';
import Avatar from './components/Avatar';

const STORAGE_KEY = 'chaojiawang_history';

const SCENARIO_EXAMPLES = [
  {
    title: "家庭纠纷",
    icon: "fa-house-chimney-crack",
    scenario: "老公总是打麻将不顾家",
    lastWord: "工作这么累，打会儿麻将怎么了？",
    color: "from-pink-500/20 to-rose-500/20"
  },
  {
    title: "职场甩锅",
    icon: "fa-briefcase",
    scenario: "同事不干活导致项目延期，甩锅给我",
    lastWord: "你又不是老板，凭什么管我呀？",
    color: "from-blue-500/20 to-indigo-500/20"
  },
  {
    title: "邻里噪音",
    icon: "fa-volume-high",
    scenario: "邻居总是半夜打游戏制造噪音",
    lastWord: "我自己的家，我想怎么吵怎么吵！",
    color: "from-orange-500/20 to-amber-500/20"
  }
];

const encodeState = (data: any) => {
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
};

const decodeState = (base64: string) => {
  try {
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json);
  } catch (e) {
    console.error("解析分享状态失败", e);
    return null;
  }
};

const Logo = () => (
  <div className="flex items-center gap-2 sm:gap-4 group cursor-default">
    <div className="relative w-9 h-9 sm:w-14 sm:h-14 flex items-center justify-center">
      <div className="absolute inset-0 bg-cyan-500/20 rounded-lg sm:rounded-xl blur-md sm:blur-lg group-hover:bg-cyan-500/40 transition-all duration-700"></div>
      <div className="absolute inset-0 border border-cyan-400/30 rounded-lg sm:rounded-xl group-hover:border-cyan-400/60 transition-colors"></div>
      <svg viewBox="0 0 100 100" className="w-5 h-5 sm:w-10 sm:h-10 relative z-10 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]">
        <path d="M10,30 L10,10 L30,10" fill="none" stroke="#00f3ff" strokeWidth="8" />
        <path d="M70,10 L90,10 L90,30" fill="none" stroke="#00f3ff" strokeWidth="8" />
        <path d="M10,70 L10,90 L30,90" fill="none" stroke="#00f3ff" strokeWidth="8" />
        <path d="M70,90 L90,90 L90,70" fill="none" stroke="#00f3ff" strokeWidth="8" />
        <path d="M30,50 L50,30 L70,50 L50,70 Z" fill="#ffaa00" className="animate-pulse" />
      </svg>
    </div>
    <div className="flex flex-col">
      <h1 className="text-sm sm:text-2xl font-black tracking-tighter leading-none grad-text italic uppercase">
        吵架王
      </h1>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[6px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.4em] text-cyan-500/60 uppercase mono leading-none">Tactical Battle Group</span>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [scenario, setScenario] = useState('');
  const [lastWord, setLastWord] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAdvisorRole, setActiveAdvisorRole] = useState<Exclude<Role, Role.USER> | null>(null);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedSkillRole, setSelectedSkillRole] = useState<Exclude<Role, Role.USER>>(Role.ZHUGE);
  const [history, setHistory] = useState<SavedBattle[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeAdvisorRole, scrollToBottom]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash && hash.startsWith('share:')) {
        const encodedData = hash.replace('share:', '');
        const decoded = decodeState(encodedData);
        if (decoded && decoded.messages && decoded.scenario) {
          setMessages(decoded.messages);
          setScenario(decoded.scenario);
          setIsViewMode(true);
          showToast("战术档案加载成功", "info");
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const saveBattle = useCallback((currentScenario: string, currentMessages: Message[]) => {
    if (currentMessages.length === 0) return;
    const newBattle: SavedBattle = {
      id: Date.now().toString(),
      scenario: currentScenario || "未命名战场",
      messages: currentMessages,
      timestamp: Date.now()
    };
    setHistory(prev => [newBattle, ...prev.filter(h => h.id !== newBattle.id)].slice(0, 30));
  }, []);

  const loadHistoryItem = (battle: SavedBattle) => {
    setMessages(battle.messages);
    setScenario(battle.scenario);
    setIsViewMode(false);
    setIsHistoryOpen(false);
    window.location.hash = '';
    showToast(`档案已恢复: ${battle.scenario.slice(0, 8)}...`);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const handleNewBattle = () => {
    const clearSession = () => {
      setMessages([]);
      setScenario('');
      setLastWord('');
      setAttachedImage(null);
      setIsViewMode(false);
      window.location.hash = '';
      showToast("智囊团已待命，新对局重置完成");
    };

    if (messages.length > 0) {
      if (confirm("是否保存当前交锋并开启新对话？")) {
        saveBattle(scenario, messages);
        clearSession();
      }
    } else {
      clearSession();
    }
  };

  const handleExampleClick = (example: typeof SCENARIO_EXAMPLES[0]) => {
    setScenario(example.scenario);
    setLastWord(example.lastWord);
    showToast("情景已同步，准备开火");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastWord.trim() || isProcessing) return;
    if (!scenario.trim() && !attachedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: attachedImage 
        ? `[上传物证]: ${lastWord}` 
        : (messages.length === 0 ? `【战场环境】: ${scenario}\n【对方挑衅】: ${lastWord}` : lastWord),
      timestamp: Date.now(),
      imageUrl: attachedImage || undefined
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);

    const currentAttack = lastWord;
    const currentImage = attachedImage;
    const currentScenario = scenario;
    setLastWord('');
    setAttachedImage(null);

    try {
      let finalMessages = [...updatedMessages];
      if (currentImage) {
        setActiveAdvisorRole(Role.VISION);
        const { imageUrl, description } = await editImage(currentImage, currentAttack);
        const visionMessage: Message = {
          id: (Date.now() + Math.random()).toString(),
          role: Role.VISION,
          content: description,
          timestamp: Date.now(),
          imageUrl: imageUrl
        };
        finalMessages.push(visionMessage);
        setMessages(finalMessages);
      } else {
        const selectedAdvisors = await selectRelevantAdvisors(currentScenario, currentAttack);
        const currentTurnResponses: string[] = [];
        
        for (const role of selectedAdvisors) {
          setActiveAdvisorRole(role);
          const responseText = await getAdvisorResponse(role, currentScenario, currentAttack, finalMessages);
          currentTurnResponses.push(`${ROLE_CONFIGS[role].name}：\n${responseText}`);
          const advisorMessage: Message = {
            id: (Date.now() + Math.random()).toString(),
            role: role,
            content: responseText,
            timestamp: Date.now(),
          };
          finalMessages.push(advisorMessage);
          setMessages([...finalMessages]);
        }

        setActiveAdvisorRole(Role.ZHUGE);
        const zhugeResponse = await getAdvisorResponse(
          Role.ZHUGE, 
          currentScenario, 
          currentAttack, 
          finalMessages, 
          currentTurnResponses.join('\n\n')
        );
        const finalZhugeMsg: Message = {
          id: (Date.now() + Math.random()).toString(),
          role: Role.ZHUGE,
          content: zhugeResponse,
          timestamp: Date.now(),
        };
        finalMessages.push(finalZhugeMsg);
        setMessages(finalMessages);
      }
      saveBattle(currentScenario, finalMessages);
    } catch (error: any) {
      console.error("战术故障:", error);
      const errorMsg = error?.message || "";
      const isQuotaError = errorMsg.includes('429') || errorMsg === "QUOTA_EXHAUSTED";
      if (isQuotaError) {
        showToast("⚠️ 智囊团正在休息，请稍后再试。", "error");
      } else {
        showToast("⚠️ 推演异常中断。", "error");
      }
      const errorMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        role: Role.ZHUGE,
        content: "⚠️ 通信受阻。可能需要检查连接或稍后重试。",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setActiveAdvisorRole(null);
    }
  };

  const displayedAdvisors = (Object.keys(ROLE_CONFIGS) as Array<Exclude<Role, Role.USER>>).filter(r => r !== Role.ZHUGE && r !== Role.VISION);

  return (
    <div className="flex flex-col h-screen overflow-hidden relative selection:bg-cyan-500/30">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
           <div className={`px-6 py-3 rounded-full shadow-2xl border border-white/10 backdrop-blur-xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-cyan-500/80' : toast.type === 'error' ? 'bg-red-600/80' : 'bg-orange-500/80'} text-white font-black uppercase tracking-widest text-[10px]`}>
             <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-info-circle'}`}></i>
             {toast.message}
           </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsHistoryOpen(false)}></div>
          <div className="relative w-full max-w-2xl h-[80vh] glass-card border border-orange-500/30 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in fade-in duration-300">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-black italic grad-text uppercase tracking-widest">战术存档库</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-white/30 hover:text-orange-400 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20 uppercase font-black tracking-widest text-xs italic">
                  <i className="fa-solid fa-box-archive text-4xl mb-4 opacity-20"></i>
                  尚无战术存档
                </div>
              ) : (
                history.map((battle) => (
                  <div 
                    key={battle.id} 
                    onClick={() => loadHistoryItem(battle)}
                    className="group relative p-5 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-10">
                      <div className="text-[9px] font-black text-orange-400/60 uppercase tracking-widest mb-1 italic">
                         {new Date(battle.timestamp).toLocaleString()}
                      </div>
                      <h3 className="text-white font-bold truncate text-sm sm:text-base">{battle.scenario}</h3>
                      <div className="text-[10px] text-white/40 mt-1 uppercase font-black tracking-tighter">
                         {battle.messages.length} 轮交锋
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteHistoryItem(e, battle.id)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isSkillsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsSkillsOpen(false)}></div>
          <div className="relative w-full max-w-4xl h-[90vh] sm:h-auto glass-card border border-cyan-500/30 rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-2xl animate-in zoom-in fade-in duration-300">
            <div className="w-full sm:w-20 bg-white/5 p-3 flex sm:flex-col gap-3 justify-center items-center border-b sm:border-b-0 sm:border-r border-white/10 shrink-0 overflow-x-auto no-scrollbar">
              {(Object.keys(ROLE_CONFIGS) as Array<Exclude<Role, Role.USER>>).map((role) => (
                <button 
                  key={role}
                  onClick={() => setSelectedSkillRole(role)}
                  className={`relative p-0.5 rounded-xl transition-all duration-300 shrink-0 ${selectedSkillRole === role ? 'ring-2 ring-cyan-400 scale-105 shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'opacity-40 hover:opacity-100'}`}
                >
                  <Avatar role={role} size="sm" />
                </button>
              ))}
            </div>
            <div className="flex-1 p-5 sm:p-10 overflow-y-auto custom-scrollbar relative">
              <button onClick={() => setIsSkillsOpen(false)} className="absolute top-4 right-4 text-white/30 hover:text-cyan-400 transition-colors z-50">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                <div className="w-28 sm:w-48 lg:w-56 shrink-0 relative">
                  <div className={`aspect-square rounded-2xl overflow-hidden border border-white/10 ${ROLE_CONFIGS[selectedSkillRole].glow} group`}>
                    <img src={ROLE_CONFIGS[selectedSkillRole].avatar} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={ROLE_CONFIGS[selectedSkillRole].name} />
                  </div>
                </div>
                <div className="flex-1 w-full text-center lg:text-left">
                  <div className="mb-6">
                    <div className={`text-[9px] font-black tracking-[0.2em] uppercase mb-1 bg-gradient-to-r ${ROLE_CONFIGS[selectedSkillRole].color} bg-clip-text text-transparent italic`}>
                       {ROLE_CONFIGS[selectedSkillRole].title}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white mb-3 uppercase italic leading-none">{ROLE_CONFIGS[selectedSkillRole].name}</h2>
                    <p className="text-slate-300 leading-relaxed text-sm sm:text-base font-medium opacity-80">{ROLE_CONFIGS[selectedSkillRole].description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                    <div className="space-y-3">
                      <div className="text-[9px] font-black uppercase tracking-widest text-cyan-400">核心战术</div>
                      <div className="space-y-1.5">
                        {ROLE_CONFIGS[selectedSkillRole].skills.map(skill => (
                          <div key={skill} className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-bold text-[10px] flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-cyan-400"></div>
                            {skill}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-[9px] font-black uppercase tracking-widest text-orange-400">作战评估</div>
                      <div className="space-y-3">
                        {ROLE_CONFIGS[selectedSkillRole].stats.map(stat => (
                          <div key={stat.label} className="space-y-1">
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/50 mono">
                              <span>{stat.label}</span>
                              <span className="text-white">{stat.value}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${ROLE_CONFIGS[selectedSkillRole].color}`} style={{ width: `${stat.value}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 bg-black/60 backdrop-blur-xl border-b border-white/5 z-50 shrink-0">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="h-8 sm:h-10 px-3 sm:px-4 glass-card rounded-lg border border-white/10 flex items-center gap-2 text-orange-400 hover:bg-orange-400/10 hover:border-orange-400/30 transition-all font-black uppercase tracking-widest text-[9px]"
            title="查看往期记录"
          >
            <i className="fa-solid fa-folder-open"></i>
            <span className="hidden sm:inline">存档库</span>
          </button>
          
          <button 
            onClick={handleNewBattle}
            className="h-8 sm:h-10 px-3 sm:px-5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white flex items-center gap-2 transition-all active:scale-95 font-black uppercase tracking-widest text-[9px] shadow-[0_0_15px_rgba(8,145,178,0.4)] group"
          >
            <i className={`fa-solid ${messages.length > 0 ? 'fa-rotate-left' : 'fa-plus'} group-hover:rotate-90 transition-transform duration-300`}></i>
            <span>{messages.length > 0 ? '开启新局' : '新建推演'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-10 py-4 sm:py-10 custom-scrollbar relative">
        {messages.length === 0 && (
          <div className="min-h-full flex flex-col items-center justify-center max-w-5xl mx-auto animate-in fade-in zoom-in duration-700">
            <div className="w-full p-6 sm:p-12 rounded-2xl sm:rounded-3xl glass-card border border-white/10 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
              
              <div className="mb-5 sm:mb-8 w-14 h-14 sm:w-20 sm:h-20 mx-auto">
                <div className="w-full h-full glass-card rounded-xl sm:rounded-2xl border border-cyan-400/30 flex items-center justify-center relative">
                   <i className="fa-solid fa-bolt-lightning text-2xl sm:text-4xl text-cyan-400"></i>
                </div>
              </div>
              
              <h2 className="text-xl sm:text-4xl font-black mb-3 sm:mb-8 tracking-tighter uppercase italic text-white leading-none">智囊团已进入战斗位置</h2>
              
              <div className="mb-10 text-left">
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-4 text-center">快捷部署经典战场</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {SCENARIO_EXAMPLES.map((ex, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(ex)}
                      className={`p-4 rounded-xl glass-card border border-white/5 hover:border-cyan-400/40 transition-all text-left group relative overflow-hidden bg-gradient-to-br ${ex.color}`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <i className={`fa-solid ${ex.icon} text-cyan-400 text-xs`}></i>
                          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{ex.title}</span>
                        </div>
                        <div className="text-white font-bold text-xs mb-1 line-clamp-1">情景：{ex.scenario}</div>
                        <div className="text-white/40 text-[10px] italic line-clamp-1">对方："{ex.lastWord}"</div>
                      </div>
                      <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i className={`fa-solid ${ex.icon} text-4xl`}></i>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left max-w-3xl mx-auto">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-400/20 transition-colors">
                  <div className="text-cyan-400 font-black text-[9px] mb-1 uppercase italic">Step 1</div>
                  <div className="text-white font-bold text-sm">锁定背景</div>
                  <div className="text-slate-400 text-xs mt-1">输入冲突发生的来龙去脉。</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-orange-400/20 transition-colors">
                  <div className="text-orange-400 font-black text-[9px] mb-1 uppercase italic">Step 2</div>
                  <div className="text-white font-bold text-sm">呈上挑衅</div>
                  <div className="text-slate-400 text-xs mt-1">输入对方的原话或截图。</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-400/20 transition-colors">
                  <div className="text-emerald-400 font-black text-[9px] mb-1 uppercase italic">Step 3</div>
                  <div className="text-white font-bold text-sm">集火突围</div>
                  <div className="text-slate-400 text-xs mt-1">智能选取3位专家实施打击。</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {displayedAdvisors.map((role) => (
                  <button key={role} onClick={() => { setSelectedSkillRole(role); setIsSkillsOpen(true); }} className="flex flex-col items-center gap-1 group">
                    <Avatar role={role} size="sm" />
                    <span className="text-[8px] font-black text-white/40 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">{ROLE_CONFIGS[role].name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 pb-24">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          {activeAdvisorRole && (
            <div className="flex justify-start animate-in slide-in-from-left-4 fade-in duration-500">
              <div className="mr-2 sm:mr-4 shrink-0"><Avatar role={activeAdvisorRole} size="sm" /></div>
              <div className="flex flex-col pt-1 max-w-[85%]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
                  <span className="text-[8px] sm:text-[9px] font-black text-cyan-400 uppercase tracking-widest mono italic">
                     {ROLE_CONFIGS[activeAdvisorRole].name} 正在准备战术方案...
                  </span>
                </div>
                <div className="glass-card px-4 py-3 rounded-xl rounded-tl-none border border-white/5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="px-4 py-3 sm:px-8 sm:py-6 bg-black/90 backdrop-blur-3xl border-t border-white/5 z-50 shrink-0">
        <div className="max-w-4xl mx-auto">
          {attachedImage && (
            <div className="mb-3 flex animate-in slide-in-from-bottom-2 duration-300">
              <div className="relative p-1 glass-card rounded-xl border border-cyan-400/50 group">
                <img src={attachedImage} className="h-16 sm:h-24 rounded-lg shadow-xl object-cover" alt="待解析图片" />
                <button 
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              </div>
            </div>
          )}

          {isViewMode ? (
            <div className="flex flex-col items-center py-1">
              <button 
                onClick={handleNewBattle}
                className="w-full sm:w-auto px-8 sm:px-12 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest italic shadow-xl transition-all"
              >
                我也要开启战术推演
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:gap-3">
              {messages.length === 0 && !attachedImage && (
                <div className="relative animate-in slide-in-from-bottom-4 duration-500">
                  <input
                    type="text"
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="第一步：设定场景背景 (如：老公不干家务、同事甩锅...)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-cyan-500/40 transition-all placeholder:text-white/20 font-bold text-white shadow-inner"
                    disabled={isProcessing}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={lastWord}
                    onChange={(e) => setLastWord(e.target.value)}
                    placeholder={attachedImage ? "简述图片背后的冲突详情..." : "第二步：输入对方怼你的原话是什么？"}
                    className="w-full bg-white/10 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 sm:py-4 text-sm sm:text-base focus:outline-none focus:border-orange-500/40 transition-all font-bold text-white placeholder:text-white/20 shadow-inner"
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-2.5 w-7 h-7 rounded-lg flex items-center justify-center text-cyan-400 hover:bg-white/10 transition-all"
                    title="上传截图或照片"
                  >
                    <i className="fa-solid fa-camera text-sm"></i>
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !lastWord.trim() || (!scenario.trim() && !attachedImage)}
                  className="h-10 sm:h-14 px-4 sm:px-8 bg-gradient-to-r from-orange-500 to-red-600 disabled:opacity-20 rounded-xl text-white font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center shrink-0 active:scale-95"
                >
                  {isProcessing ? (
                    <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                  ) : (
                    <>
                      <span className="hidden sm:inline mr-2">推演</span>
                      <i className="fa-solid fa-paper-plane text-[10px] sm:text-sm"></i>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
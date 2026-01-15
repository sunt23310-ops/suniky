
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Role, Message, ROLE_CONFIGS } from './types';
import { getAdvisorResponse, selectRelevantAdvisors } from './services/geminiService';
import MessageItem from './components/MessageItem';
import Avatar from './components/Avatar';

// Speech Recognition Type Definitions
interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [scenario, setScenario] = useState('');
  const [lastWord, setLastWord] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAdvisorRole, setActiveAdvisorRole] = useState<Exclude<Role, Role.USER> | null>(null);
  const [isRecording, setIsRecording] = useState<'scenario' | 'lastWord' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeAdvisorRole, scrollToBottom]);

  const startVoiceInput = (field: 'scenario' | 'lastWord') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音识别功能。");
      return;
    }
    if (isRecording) return;
    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setIsRecording(field);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'scenario') setScenario(prev => prev + transcript);
      else setLastWord(prev => prev + transcript);
    };
    recognition.onerror = () => setIsRecording(null);
    recognition.onend = () => setIsRecording(null);
    recognition.start();
  };

  const handleNewBattle = () => {
    setMessages([]);
    setScenario('');
    setLastWord('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim() || !lastWord.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: messages.length === 0 
        ? `【背景】: ${scenario}\n【对方攻击】: ${lastWord}`
        : `【对方追加攻击】: ${lastWord}`,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);

    const currentAttack = lastWord;
    setLastWord('');

    try {
      // Step 1: Intelligently select 2 advisors from the trio
      const selectedAdvisors = await selectRelevantAdvisors(scenario, currentAttack);
      
      const currentTurnResponses: string[] = [];
      const turnMessages: Message[] = [];
      
      // Step 2: Selected Advisors Response
      for (const role of selectedAdvisors) {
        setActiveAdvisorRole(role);
        await new Promise(r => setTimeout(r, 400));
        
        const responseText = await getAdvisorResponse(role, scenario, currentAttack, updatedMessages);
        currentTurnResponses.push(`${ROLE_CONFIGS[role].name}建议：\n${responseText}`);
        
        const advisorMessage: Message = {
          id: (Date.now() + Math.random()).toString(),
          role: role,
          content: responseText,
          timestamp: Date.now(),
        };
        
        turnMessages.push(advisorMessage);
        setMessages(prev => [...prev, advisorMessage]);
        setActiveAdvisorRole(null);
      }

      // Step 3: Zhuge Judge (Always the 3rd participant)
      setActiveAdvisorRole(Role.ZHUGE);
      await new Promise(r => setTimeout(r, 600));
      
      const zhugeResponse = await getAdvisorResponse(
        Role.ZHUGE, 
        scenario, 
        currentAttack, 
        [...updatedMessages, ...turnMessages], 
        currentTurnResponses.join('\n\n')
      );
      
      const finalMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        role: Role.ZHUGE,
        content: zhugeResponse,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, finalMessage]);
      
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsProcessing(false);
      setActiveAdvisorRole(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg border border-indigo-400/30 overflow-hidden">
             <img src="https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=100&h=100&fit=crop" className="w-full h-full object-cover opacity-80" alt="logo" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              吵架王
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">AI Strategic Warfare</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleNewBattle}
            className="text-[10px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-plus text-indigo-500"></i>
            开启新战局
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10 chat-container bg-[radial-gradient(circle_at_50%_0%,rgba(15,23,42,0.5)_0%,rgba(2,6,23,1)_100%)]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-700">
            <div className="mb-6 p-10 rounded-[2.5rem] bg-slate-900/40 border border-slate-800/50 shadow-2xl backdrop-blur-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-brain text-5xl text-indigo-500 animate-pulse"></i>
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tight">智能沙盘推演</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                输入冲突背景，系统将智能分派最适合的军事出击。<br/>
                诸葛吵坐镇中军，为您一锤定音。
              </p>
              <div className="flex justify-center gap-4">
                 {Object.entries(ROLE_CONFIGS).map(([key, role]) => (
                   <div key={key} title={role.name} className="grayscale hover:grayscale-0 transition-all hover:scale-125 cursor-help">
                      <Avatar role={key as any} size="sm" />
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto pb-20">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          
          {activeAdvisorRole && (
            <div className="flex justify-start mb-6 animate-in slide-in-from-left-4 duration-300">
              <div className="mr-4">
                <Avatar role={activeAdvisorRole} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                  {ROLE_CONFIGS[activeAdvisorRole].name} 正在出策...
                </span>
                <div className="bg-slate-900/50 px-5 py-4 rounded-3xl rounded-tl-none border border-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-5 bg-slate-900/90 backdrop-blur-2xl border-t border-slate-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] z-20">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Background Input - persists */}
            <div className="relative group flex-1 flex items-center">
              <div className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <i className="fa-solid fa-scroll"></i>
              </div>
              <input
                type="text"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="吵架背景情境（已锁定历史上下文）"
                className="w-full bg-slate-800/30 border border-slate-800 rounded-2xl pl-12 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600 disabled:bg-slate-900/50 disabled:text-slate-500"
                disabled={isProcessing || messages.length > 0}
              />
              {messages.length === 0 && (
                <button
                  type="button"
                  onClick={() => startVoiceInput('scenario')}
                  className={`absolute right-3 p-2 rounded-xl transition-all ${isRecording === 'scenario' ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50'}`}
                >
                  <i className="fa-solid fa-microphone"></i>
                </button>
              )}
            </div>
            {/* Attack Input - clears for follow-up */}
            <div className="relative group flex-[2] flex items-center">
              <div className="absolute left-4 text-slate-500 group-focus-within:text-red-400 transition-colors">
                <i className="fa-solid fa-fire-flame-simple"></i>
              </div>
              <input
                type="text"
                value={lastWord}
                onChange={(e) => setLastWord(e.target.value)}
                placeholder={messages.length === 0 ? "输入对方最恶毒的话..." : "对方又说了什么？（追加对抗）"}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl pl-12 pr-24 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-lg placeholder:text-slate-500"
                disabled={isProcessing}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startVoiceInput('lastWord')}
                  className={`p-2 rounded-xl transition-all ${isRecording === 'lastWord' ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700'}`}
                  disabled={isProcessing}
                >
                  <i className="fa-solid fa-microphone-lines"></i>
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !scenario.trim() || !lastWord.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-90"
                >
                  {isProcessing ? <i className="fa-solid fa-spinner fa-spin text-white"></i> : <i className="fa-solid fa-paper-plane text-white"></i>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default App;

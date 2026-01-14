
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Role, Message, ROLE_CONFIGS } from './types';
import { getAdvisorResponse } from './services/geminiService';
import MessageItem from './components/MessageItem';
import Avatar from './components/Avatar';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [scenario, setScenario] = useState('');
  const [lastWord, setLastWord] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAdvisorRole, setActiveAdvisorRole] = useState<Exclude<Role, Role.USER> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeAdvisorRole, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim() || !lastWord.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: `【情景】: ${scenario}\n【对方】: ${lastWord}`,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const rolesToCall: Exclude<Role, Role.USER>[] = [Role.ZHUGE, Role.DINGZUI, Role.FALI];
      
      for (const role of rolesToCall) {
        setActiveAdvisorRole(role);
        // Simulate thinking time for better UX
        await new Promise(r => setTimeout(r, 600));
        
        const responseText = await getAdvisorResponse(role, scenario, lastWord);
        
        const advisorMessage: Message = {
          id: (Date.now() + Math.random()).toString(),
          role: role,
          content: responseText,
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, advisorMessage]);
        setActiveAdvisorRole(null);
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsProcessing(false);
      setActiveAdvisorRole(null);
      setScenario('');
      setLastWord('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg border border-indigo-400/30">
            <i className="fa-solid fa-fire-flame-curved text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              吵架王
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Strategic Warfare Center</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {(Object.keys(ROLE_CONFIGS) as Array<Exclude<Role, Role.USER>>).map((role) => (
            <div key={role} className={`transition-all duration-300 ${activeAdvisorRole === role ? 'scale-125 ring-2 ring-indigo-500 rounded-full' : 'opacity-50'}`}>
               <Avatar role={role} size="sm" />
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10 chat-container">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-700">
            <div className="mb-6 p-8 rounded-3xl bg-slate-900/50 border border-slate-800 shadow-2xl backdrop-blur-sm">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                <i className="fa-solid fa-shield-halved text-4xl text-indigo-500"></i>
              </div>
              <h2 className="text-2xl font-bold mb-3">进场部署</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                输入冲突背景与对方话术，<br/>三大军事将为您提供全方位降维打击策略。
              </p>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          
          {activeAdvisorRole && (
            <div className="flex justify-start mb-6 animate-in slide-in-from-left-4 duration-300">
              <div className="mr-3">
                <Avatar role={activeAdvisorRole} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 mb-1">
                  {ROLE_CONFIGS[activeAdvisorRole].name} 正在研判...
                </span>
                <div className="bg-slate-800/50 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-slate-900 border-t border-slate-800 shadow-inner">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group">
              <div className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                <i className="fa-solid fa-map-location-dot"></i>
              </div>
              <input
                type="text"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="吵架背景..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                disabled={isProcessing}
              />
            </div>
            <div className="relative group">
              <div className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-red-500 transition-colors">
                <i className="fa-solid fa-comment-slash"></i>
              </div>
              <input
                type="text"
                value={lastWord}
                onChange={(e) => setLastWord(e.target.value)}
                placeholder="对方的话术..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || !scenario.trim() || !lastWord.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:scale-100 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 group"
          >
            {isProcessing ? (
              <i className="fa-solid fa-satellite-dish fa-spin"></i>
            ) : (
              <i className="fa-solid fa-bolt-lightning group-hover:animate-pulse"></i>
            )}
            <span className="tracking-widest">{isProcessing ? '正在生成作战方案' : '全军出击'}</span>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;

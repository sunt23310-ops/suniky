import React, { useState } from 'react';
import { Message, Role, ROLE_CONFIGS } from '../types';
import Avatar from './Avatar';
import { playMessageAudio } from '../services/geminiService';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const config = !isUser ? ROLE_CONFIGS[message.role as Exclude<Role, Role.USER>] : null;
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isImgZoomed, setIsImgZoomed] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePlayAudio = async () => {
    if (isUser || isPlaying) return;
    setIsPlaying(true);
    await playMessageAudio(message.content, message.role as Exclude<Role, Role.USER>);
    setIsPlaying(false);
  };

  const renderContent = (content: string) => {
    if (isUser) return <div className="font-bold text-sm sm:text-base tracking-tight leading-relaxed italic text-white/90">{content}</div>;
    
    // 匹配所有的绝杀标签及其后的内容
    const parts = content.split(/(「(?:终极绝杀|最终绝杀|秒语绝杀|最终妙语|绝杀)」[:：]?.*)/s);
    return parts.map((part, index) => {
      const isKill = /绝杀|妙语/.test(part);
      if (isKill) {
        const textToCopy = part.replace(/「[^」]+」[:：]?/, '').trim();
        return (
          <div key={index} className="mt-3 sm:mt-5 overflow-hidden rounded-xl sm:rounded-2xl glass-card border border-cyan-400/40 group/kill relative shadow-xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-cyan-600/80 to-blue-800/80 px-3 sm:px-4 py-1.5 sm:py-2">
              <div className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-skull-crossbones animate-pulse"></i>
                反击建议
              </div>
              <button 
                onClick={() => handleCopy(textToCopy)}
                className={`text-[8px] sm:text-[9px] px-2 sm:px-3 py-1 rounded-md transition-all flex items-center gap-1.5 font-black uppercase tracking-widest ${
                  copied ? 'bg-green-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                }`}
              >
                {copied ? <><i className="fa-solid fa-check"></i> 已复制</> : <><i className="fa-solid fa-copy"></i> 复制</>}
              </button>
            </div>
            
            <div onClick={() => handleCopy(textToCopy)} className="p-4 sm:p-5 cursor-pointer hover:bg-cyan-400/5 transition-all">
              <div className="text-white font-bold italic text-base sm:text-lg md:text-xl leading-relaxed tracking-tight">
                {textToCopy}
              </div>
              <div className="mt-3 sm:mt-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/20 to-transparent"></div>
                <div className="text-[7px] sm:text-[8px] font-black text-cyan-400 uppercase mono tracking-[0.2em] italic opacity-50">
                   READY TO SEND
                </div>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div key={index} className="space-y-2 sm:space-y-3">
          {part.split('\n').filter(l => l.trim()).map((line, lIdx) => (
            <div key={lIdx} className={line.startsWith('「') ? 'font-black text-cyan-300 text-[10px] sm:text-xs tracking-widest mt-3 flex items-center gap-1.5' : 'text-slate-300 font-medium text-xs sm:text-sm leading-relaxed'}>
              {line.startsWith('「') && <div className="w-1 h-1 bg-cyan-400 rounded-sm rotate-45 shrink-0"></div>}
              {line}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[95%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'} mt-1`}>
          <div className="relative group/avatar">
             <Avatar role={message.role} size="sm" />
             {!isUser && (
               <button 
                 onClick={handlePlayAudio}
                 disabled={isPlaying}
                 className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center border transition-all z-20 shadow-lg ${isPlaying ? 'bg-cyan-500 border-cyan-400 animate-pulse text-white' : 'glass-card border-white/20 text-cyan-200 hover:text-white'}`}
               >
                 <i className={`fa-solid ${isPlaying ? 'fa-waveform-lines' : 'fa-volume-high'} text-[7px] sm:text-[9px]`}></i>
               </button>
             )}
          </div>
        </div>
        
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-2 mb-0.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest mono italic ${isUser ? 'text-cyan-400' : 'text-white/30'}`}>
              {isUser ? 'YOU' : config?.name}
            </span>
            <div className="w-0.5 h-0.5 bg-white/10 rounded-full"></div>
            <span className="text-[6px] sm:text-[8px] text-white/10 font-black mono">{new Date(message.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <div className={`relative px-3 py-2.5 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg transition-all border ${
            isUser 
              ? 'bg-gradient-to-br from-cyan-600/20 to-blue-800/20 text-white rounded-tr-none border-cyan-500/10' 
              : 'glass-card text-slate-100 border-white/5 rounded-tl-none'
          }`}>
            <div className="relative z-10">
                {message.imageUrl && (
                  <div className="relative mb-3 overflow-hidden rounded-lg border border-white/10 bg-black/50">
                     <img 
                       src={message.imageUrl} 
                       className={`w-full max-h-[200px] sm:max-h-[350px] object-contain cursor-zoom-in transition-all ${isImgZoomed ? 'fixed inset-0 z-[200] max-h-none h-screen w-screen p-4 bg-black/98 object-contain cursor-zoom-out' : ''}`} 
                       alt="Evidence"
                       onClick={() => setIsImgZoomed(!isImgZoomed)}
                     />
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {renderContent(message.content)}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

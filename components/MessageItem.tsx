
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
    if (isUser) return <div className="opacity-100 font-medium">{content}</div>;
    
    const parts = content.split(/(「终极绝杀」[:：]?.*)/s);
    return parts.map((part, index) => {
      if (part.startsWith('「终极绝杀」')) {
        const textToCopy = part.replace(/「终极绝杀」[:：]?/, '').trim();
        return (
          <div key={index} className="mt-4 overflow-hidden rounded-xl border border-indigo-500/40 bg-slate-950/60 shadow-2xl shadow-indigo-500/20 group/kill transition-all hover:border-indigo-400">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900/40 to-slate-900/40 px-3 py-2 border-b border-indigo-500/20">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                终极绝杀 · 致命一击
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopy(textToCopy)}
                  className={`text-[10px] px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-bold border ${
                    copied 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/30'
                  }`}
                >
                  {copied ? (
                    <><i className="fa-solid fa-check"></i> 已复制</>
                  ) : (
                    <><i className="fa-solid fa-copy"></i> 复制</>
                  )}
                </button>
              </div>
            </div>
            <div 
              onClick={() => handleCopy(textToCopy)}
              className="p-5 cursor-pointer transition-colors relative"
            >
              <div className="text-white font-bold italic text-xl leading-relaxed relative z-10 group-hover/kill:text-indigo-100 transition-colors">
                <span className="text-indigo-500/40 text-4xl font-serif absolute -top-4 -left-3 select-none">“</span>
                {textToCopy}
                <span className="text-indigo-500/40 text-4xl font-serif absolute -bottom-8 -right-1 select-none">”</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover/kill:opacity-100 transition-opacity"></div>
            </div>
          </div>
        );
      }
      return (
        <div key={index} className="opacity-95 space-y-2">
          {part.split('\n').map((line, lIdx) => (
            <div key={lIdx} className={line.startsWith('「') ? 'font-bold text-indigo-300/90 mt-2 text-xs uppercase tracking-wider' : ''}>
              {line}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className={`flex w-full mb-10 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[95%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-4' : 'mr-4'} mt-1`}>
          <div className="relative group/avatar">
             <Avatar role={message.role} size={isUser ? 'sm' : 'md'} />
             {!isUser && (
               <>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-950 rounded-full shadow-lg"></div>
                <button 
                  onClick={handlePlayAudio}
                  disabled={isPlaying}
                  className="absolute -top-2 -right-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center border border-indigo-400 shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity scale-90 hover:scale-110 active:scale-75"
                >
                  {isPlaying ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i>
                  ) : (
                    <i className="fa-solid fa-volume-high text-[10px]"></i>
                  )}
                </button>
               </>
             )}
          </div>
        </div>
        
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className={`text-[11px] font-black uppercase tracking-widest ${isUser ? 'text-indigo-400' : 'text-slate-400'}`}>
              {isUser ? 'YOU' : config?.name}
            </span>
            <span className="text-[9px] text-slate-600 font-bold tracking-tighter">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className={`relative px-6 py-5 rounded-3xl shadow-2xl text-[15px] leading-relaxed whitespace-pre-wrap transition-all ${
            isUser 
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-tr-none border border-indigo-400/20 shadow-indigo-500/10' 
              : 'bg-slate-900/90 backdrop-blur-md text-slate-100 border border-slate-700/50 rounded-tl-none shadow-black/40'
          }`}>
            {renderContent(message.content)}
            
            {/* Subtle bubble tail */}
            <div className={`absolute top-0 w-4 h-4 ${isUser ? '-right-2' : '-left-2'}`}>
               <div className={`w-full h-full ${isUser ? 'bg-indigo-600' : 'bg-slate-900'} rotate-45 transform origin-top-left`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

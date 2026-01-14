
import React from 'react';
import { Message, Role, ROLE_CONFIGS } from '../types';
import Avatar from './Avatar';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const config = !isUser ? ROLE_CONFIGS[message.role as Exclude<Role, Role.USER>] : null;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <Avatar role={message.role} />
        </div>
        
        <div>
          <div className={`flex items-center mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs font-bold text-slate-400">
              {isUser ? '我' : `${config?.name} | ${config?.title}`}
            </span>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
          }`}>
            {message.content}
          </div>
          
          <div className={`text-[10px] mt-1 text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

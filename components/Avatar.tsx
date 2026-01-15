import React from 'react';
import { Role, ROLE_CONFIGS } from '../types';

interface AvatarProps {
  role: Role;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ role, size = 'md' }) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10 sm:w-12 sm:h-12',
    md: 'w-14 h-14 sm:w-20 sm:h-20',
    lg: 'w-24 h-24 sm:w-40 sm:h-40'
  };

  if (role === Role.USER) {
    return (
      <div className={`${sizeClasses[size]} rounded-xl sm:rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center text-white shadow-xl border border-white/20 relative group overflow-hidden`}>
        <i className="fa-solid fa-user-secret text-base sm:text-3xl transition-transform group-hover:scale-110"></i>
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    );
  }

  const config = ROLE_CONFIGS[role];
  return (
    <div className={`${sizeClasses[size]} rounded-xl sm:rounded-[1.8rem] p-0.5 sm:p-[3px] relative group overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-90 transition-all duration-500 group-hover:opacity-100`}></div>
      <div className="w-full h-full rounded-[calc(0.75rem-0.5px)] sm:rounded-[1.6rem] bg-black overflow-hidden relative z-10 border border-white/10 shadow-inner">
        <img 
          src={config.avatar} 
          alt={config.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>
      {/* 战术装饰线 */}
      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white/30 z-20 rounded-tl-sm group-hover:border-white/60 transition-colors"></div>
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white/30 z-20 rounded-br-sm group-hover:border-white/60 transition-colors"></div>
    </div>
  );
};

export default Avatar;

import React from 'react';
import { Role, ROLE_CONFIGS } from '../types';

interface AvatarProps {
  role: Role;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ role, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  if (role === Role.USER) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xl border border-white/10 overflow-hidden`}>
        <i className="fa-solid fa-user"></i>
      </div>
    );
  }

  const config = ROLE_CONFIGS[role];
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.color} p-0.5 shadow-2xl border border-white/20 relative group overflow-hidden`}>
      <img 
        src={config.avatar} 
        alt={config.name} 
        className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 brightness-90 group-hover:brightness-110" 
      />
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <i className={`fa-solid ${config.icon} text-white ${size === 'lg' ? 'text-2xl' : 'text-xs'}`}></i>
      </div>
    </div>
  );
};

export default Avatar;

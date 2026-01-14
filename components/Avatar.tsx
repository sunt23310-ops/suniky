
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
      <div className={`${sizeClasses[size]} rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg`}>
        <i className="fa-solid fa-user"></i>
      </div>
    );
  }

  const config = ROLE_CONFIGS[role];
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center p-0.5 shadow-lg border-2 border-slate-700`}>
      <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
        <i className={`fa-solid ${config.icon} text-white ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}></i>
      </div>
    </div>
  );
};

export default Avatar;

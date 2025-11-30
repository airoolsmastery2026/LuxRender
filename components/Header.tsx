import React from 'react';
import { useStore } from '../store';
import { Bell, Crown } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useStore();

  return (
    <div className="flex justify-between items-center p-6 pb-2">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-brand-start object-cover" />
          <div className="absolute -bottom-1 -right-1 bg-brand-gold text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-dark-bg flex items-center gap-0.5">
            <Crown size={8} fill="black" /> PRO
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Xin chào,</p>
          <h2 className="text-white font-bold text-lg leading-tight">{user.name}</h2>
        </div>
      </div>
      <div className="relative bg-dark-surface p-2 rounded-full border border-dark-border cursor-pointer hover:bg-dark-surfaceHighlight transition-colors">
        <Bell size={20} className="text-white" />
        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
      </div>
    </div>
  );
};
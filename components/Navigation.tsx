
import React from 'react';
import { Home, FolderOpen, LayoutTemplate, BarChart2, User, PlusSquare, Box, Users, Settings, LogOut, Aperture } from 'lucide-react';
import { useStore } from '../store';
import { AppState } from '../types';

export const Navigation: React.FC = () => {
  const { currentScreen, setScreen, language, setLanguage, logout } = useStore();

  const navItems = [
    { id: AppState.HOME, icon: Home, label: language === 'vi' ? 'Trang chủ' : 'Home' },
    { id: AppState.PROJECTS, icon: FolderOpen, label: language === 'vi' ? 'Dự án' : 'Projects' },
    { id: AppState.TEMPLATES, icon: LayoutTemplate, label: language === 'vi' ? 'Mẫu' : 'Templates' },
    { id: AppState.ASSETS, icon: Box, label: language === 'vi' ? 'Kho' : 'Assets' },
    { id: AppState.CRM, icon: BarChart2, label: 'CRM' },
    { id: AppState.TEAM, icon: Users, label: language === 'vi' ? 'Nhóm' : 'Team' },
    { id: AppState.PROFILE, icon: User, label: language === 'vi' ? 'Cá nhân' : 'Profile' },
  ];

  return (
    <aside className="h-full w-full bg-dark-surface/95 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-2xl">
       {/* Logo Area */}
       <div className="p-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-gold to-orange-400 rounded-2xl flex items-center justify-center shadow-glow-gold relative group cursor-pointer hover:scale-105 transition-transform" onClick={() => setScreen(AppState.HOME)}>
                 <span className="font-serif font-bold text-black text-2xl">L</span>
                 <Aperture size={18} className="absolute -bottom-2 -right-2 text-white opacity-80 group-hover:rotate-180 transition-transform duration-700"/>
            </div>
            <div className="flex flex-col">
                <h1 className="font-serif font-bold text-white text-xl tracking-wide leading-none">LuxRender</h1>
                <p className="text-[10px] text-brand-gold tracking-[0.2em] uppercase mt-1 font-medium">Studio Pro</p>
            </div>
       </div>

       {/* Create Button */}
       <div className="px-6 mb-8">
            <button 
                onClick={() => setScreen(AppState.CREATE)}
                className="w-full bg-gradient-to-r from-brand-start to-brand-end hover:shadow-glow text-white py-3.5 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg group"
            >
                <PlusSquare size={20} className="group-hover:rotate-90 transition-transform" />
                {language === 'vi' ? 'Tạo Dự Án' : 'New Project'}
            </button>
       </div>

       {/* Nav Items */}
       <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
                const isActive = currentScreen === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setScreen(item.id)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 group relative ${
                            isActive 
                            ? 'bg-gradient-to-r from-white/10 to-transparent text-white shadow-inner' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-gold rounded-r-full shadow-glow-gold" />}
                        <item.icon size={22} className={`transition-colors ${isActive ? 'text-brand-gold' : 'group-hover:text-white'}`} />
                        <span className={`text-sm font-medium ${isActive ? 'translate-x-1' : ''} transition-transform`}>{item.label}</span>
                    </button>
                );
            })}
       </nav>

       {/* Footer / User Info */}
       <div className="p-6 border-t border-white/5 bg-black/20">
            <button onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')} className="flex items-center gap-3 text-gray-500 hover:text-white text-xs mb-4 px-2 w-full transition-colors">
                <span className="uppercase bg-white/5 border border-white/10 px-2 py-1 rounded font-bold">{language}</span>
                <span>Switch Language</span>
            </button>
            <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all hover:pl-6">
                <LogOut size={18} />
                {language === 'vi' ? 'Đăng xuất' : 'Sign Out'}
            </button>
       </div>
    </aside>
  );
};

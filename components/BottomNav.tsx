
import React from 'react';
import { Home, FolderOpen, LayoutTemplate, BarChart2, User, Plus } from 'lucide-react';
import { useStore } from '../store';
import { AppState } from '../types';

export const BottomNav: React.FC = () => {
  const { currentScreen, setScreen } = useStore();

  // Hide on desktop/tablet, Fix Z-Index
  const classNameWrapper = "md:hidden fixed bottom-0 left-0 w-full z-50 pointer-events-none"; // Wrapper is pointer-events-none to let touches pass through transparent areas

  const navItems = [
    { id: AppState.HOME, icon: Home, label: 'Trang chủ' },
    { id: AppState.PROJECTS, icon: FolderOpen, label: 'Dự án' },
    { id: AppState.TEMPLATES, icon: LayoutTemplate, label: 'Mẫu' },
    { id: AppState.CRM, icon: BarChart2, label: 'CRM' },
    { id: AppState.PROFILE, icon: User, label: 'Cá nhân' },
  ];

  const handleCreate = () => {
    setScreen(AppState.CREATE);
  };

  return (
    <>
      {/* Floating Create Button (Mobile Only) */}
      <button 
        onClick={handleCreate}
        className="md:hidden fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-brand-start to-brand-end shadow-glow flex items-center justify-center text-white animate-bounce-slow active:scale-95 transition-transform"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {/* Glassmorphism Tab Bar */}
      <div className={classNameWrapper}>
        {/* Gradient Fade up */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-dark-bg to-transparent pointer-events-none" />
        
        <div className="relative glass mx-4 mb-4 rounded-3xl h-16 flex items-center justify-between px-2 shadow-2xl pointer-events-auto">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                className="flex-1 flex flex-col items-center justify-center h-full relative"
              >
                {isActive && (
                  <div className="absolute -top-3 w-10 h-1 rounded-b-lg bg-gradient-to-r from-brand-start to-brand-end shadow-glow" />
                )}
                <item.icon 
                  size={24} 
                  className={`transition-colors duration-300 ${isActive ? 'text-brand-start' : 'text-gray-500'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

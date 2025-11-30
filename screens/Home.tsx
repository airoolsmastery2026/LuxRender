
import React from 'react';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { AppState } from '../types';
import { Image as ImageIcon, Box, Layout, Play, ArrowRight, TrendingUp } from 'lucide-react';

export const Home: React.FC = () => {
  const { setScreen, projects, setCurrentProject } = useStore();

  const QuickAction = ({ icon: Icon, label, color, onClick, desc }: any) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center text-center md:flex-row md:text-left md:items-center gap-4 bg-dark-surface p-4 md:p-5 rounded-2xl border border-white/5 hover:border-brand-gold/30 hover:bg-white/5 active:scale-95 transition-all group h-full shadow-lg"
    >
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <span className="text-sm font-bold text-white block group-hover:text-brand-gold transition-colors">{label}</span>
            {desc && <span className="hidden md:block text-xs text-gray-400 mt-1 leading-tight">{desc}</span>}
        </div>
    </button>
  );

  const handleProjectClick = (project: any) => {
      setCurrentProject(project);
      setScreen(AppState.PROJECT_DETAIL);
  };

  return (
    <div className="h-full">
        <Header />

        <div className="w-full px-4 md:px-8 space-y-8 md:space-y-10">
            {/* Banner Carousel */}
            <div className="w-full relative group cursor-pointer rounded-3xl overflow-hidden shadow-2xl" onClick={() => setScreen(AppState.TEMPLATES)}>
                <div className="w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] bg-gradient-to-r from-indigo-900 to-purple-900 relative">
                    {/* Background Detail */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-[10s] group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-center max-w-2xl">
                        <div className="flex items-center gap-2 mb-4">
                             <span className="bg-brand-gold text-black text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-glow-gold">New Release</span>
                             <span className="text-white/60 text-xs backdrop-blur-md px-2 py-1 rounded border border-white/10 hidden sm:inline">v2.5 Updated</span>
                        </div>
                        
                        <h3 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-2 leading-tight">
                            Cinematic Villa Collection <span className="text-brand-gold">2025</span>
                        </h3>
                        <p className="text-gray-300 text-sm md:text-lg mb-8 font-light line-clamp-2 md:line-clamp-none">
                            Mẫu dựng phim BĐS cao cấp tối ưu cho màn hình dọc. Tích hợp AI Voice, hiệu ứng ánh sáng Volumetric.
                        </p>
                        
                        <button className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold w-fit shadow-xl hover:shadow-2xl hover:bg-brand-gold transition-all flex items-center gap-3 group/btn">
                            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                                <Play size={12} fill="white" className="text-white ml-0.5" />
                            </div>
                            Trải nghiệm ngay
                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Floating Element */}
                    <img 
                        src="https://png.pngtree.com/png-vector/20230928/ourmid/pngtree-3d-modern-luxury-real-estate-house-png-image_10150247.png" 
                        className="absolute -right-10 -bottom-10 h-[120%] object-contain drop-shadow-2xl opacity-0 lg:opacity-100 transition-transform duration-700 group-hover:-translate-x-4 pointer-events-none"
                        alt="House"
                    />
                </div>
            </div>

            {/* Quick Actions - Responsive Grid */}
            <div>
                <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                    <TrendingUp size={20} className="text-brand-gold"/> 
                    Sáng tạo nhanh
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <QuickAction 
                        icon={ImageIcon} 
                        label="Từ Ảnh 2D" 
                        desc="AI biến ảnh tĩnh thành Video động 60fps"
                        color="bg-gradient-to-br from-blue-500 to-blue-600" 
                        onClick={() => setScreen(AppState.CREATE)} 
                    />
                    <QuickAction 
                        icon={Box} 
                        label="Import 3D" 
                        desc="Render file GLB/FBX thời gian thực"
                        color="bg-gradient-to-br from-purple-500 to-purple-600" 
                        onClick={() => setScreen(AppState.CREATE)} 
                    />
                    <QuickAction 
                        icon={Layout} 
                        label="Template" 
                        desc="Kho 200+ mẫu dựng sẵn chuyên nghiệp"
                        color="bg-gradient-to-br from-pink-500 to-pink-600" 
                        onClick={() => setScreen(AppState.TEMPLATES)} 
                    />
                     <QuickAction 
                        icon={Play} 
                        label="Dự án nháp" 
                        desc="Tiếp tục chỉnh sửa video đang làm"
                        color="bg-gradient-to-br from-orange-500 to-orange-600" 
                        onClick={() => setScreen(AppState.PROJECTS)} 
                    />
                </div>
            </div>

            {/* Recent Videos */}
            <div className="pb-8">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-white font-bold text-lg">Dự án gần đây</h3>
                        <p className="text-gray-500 text-xs mt-1">Quản lý và chỉnh sửa các video của bạn</p>
                    </div>
                    <button 
                        onClick={() => setScreen(AppState.PROJECTS)}
                        className="text-brand-start text-sm font-medium flex items-center gap-1 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Xem tất cả <ArrowRight size={14} />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {projects.map(p => (
                        <div 
                            key={p.id} 
                            className="bg-dark-surface rounded-2xl border border-white/5 overflow-hidden hover:border-brand-gold/40 transition-all hover:shadow-glow-gold/10 group cursor-pointer flex flex-col" 
                            onClick={() => handleProjectClick(p)}
                        >
                            <div className="w-full aspect-video relative overflow-hidden bg-gray-800">
                                <img src={p.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300">
                                        <Play size={20} fill="white" className="text-white ml-1" />
                                    </div>
                                </div>
                                <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono border border-white/10">0:{p.duration}</span>
                                <div className="absolute top-2 left-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg backdrop-blur-md ${p.status === 'completed' ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                                        {p.status === 'completed' ? 'DONE' : 'PROCESSING'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{p.name}</h4>
                                <p className="text-gray-400 text-xs mb-4 line-clamp-2 h-8 leading-relaxed">{p.script || 'Chưa có kịch bản chi tiết...'}</p>
                                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className="text-[10px] text-gray-500 font-mono">{new Date(p.lastModified).toLocaleDateString()}</span>
                                    <span className="text-[10px] text-brand-gold">{p.views || 0} views</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

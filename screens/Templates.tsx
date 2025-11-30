
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Search, Filter, Play } from 'lucide-react';

export const Templates: React.FC = () => {
    const [activeCat, setActiveCat] = useState('All');
    const categories = ['All', 'Villa', 'Căn hộ', 'Đất nền', 'Tiến độ', '360 Tour', 'TikTok', 'Shorts'];

    return (
        <div className="h-full bg-dark-bg overflow-y-auto pb-32 md:pb-0">
            <Header />
            
            <div className="px-4 md:px-8 max-w-7xl mx-auto sticky top-0 z-20 bg-dark-bg/95 backdrop-blur-md pb-4 pt-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Kho Mẫu 2025</h1>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 bg-dark-surface border border-dark-border rounded-xl flex items-center px-4 py-3">
                        <Search className="text-gray-500 mr-3" size={20} />
                        <input type="text" placeholder="Tìm kiếm mẫu (VD: Villa, Penthouse)..." className="bg-transparent text-white text-sm w-full focus:outline-none" />
                    </div>
                    <button className="bg-dark-surface border border-dark-border rounded-xl px-4 py-3 flex items-center justify-center gap-2 hover:bg-white/10 text-white transition-colors">
                        <Filter className="text-gray-400" size={18} />
                        <span className="text-sm font-medium">Bộ lọc</span>
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveCat(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                                activeCat === cat 
                                ? 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-glow transform scale-105' 
                                : 'bg-dark-surface text-gray-400 border border-dark-border hover:border-white/30'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="group relative rounded-2xl overflow-hidden aspect-[9/16] bg-gray-800 cursor-pointer border border-transparent hover:border-brand-gold/50 transition-colors">
                        <img 
                            src={`https://picsum.photos/400/700?random=${i+10}`} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                        
                        <div className="absolute top-2 right-2">
                            {i % 3 === 0 && (
                                <span className="bg-brand-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-lg">PRO</span>
                            )}
                        </div>

                        {/* Hover Overlay Icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                <Play fill="white" className="ml-1 text-white"/>
                             </div>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                            <h4 className="text-white text-sm font-bold truncate">Luxury Apartment {i+1}</h4>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded">15s • 4K</span>
                                <button className="bg-brand-start hover:bg-brand-end text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                    Sử dụng
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <BottomNav />
        </div>
    );
};

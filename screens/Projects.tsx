import React from 'react';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Play, MoreVertical, Share2 } from 'lucide-react';

export const Projects: React.FC = () => {
    const { projects } = useStore();

    return (
        <div className="h-full bg-dark-bg overflow-y-auto pb-32">
            <Header />
            <div className="px-4 mb-4">
                <h1 className="text-2xl font-bold text-white">Dự án của tôi</h1>
            </div>

            <div className="px-4 space-y-4">
                {projects.map(p => (
                    <div key={p.id} className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
                         <div className="aspect-video bg-gray-800 relative group">
                             <img src={p.thumbnail} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                     <Play fill="white" className="text-white ml-1" />
                                 </button>
                             </div>
                             <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-mono">
                                 0:{p.duration}
                             </div>
                         </div>
                         <div className="p-4">
                             <div className="flex justify-between items-start mb-2">
                                 <h3 className="text-white font-bold text-base line-clamp-1">{p.name}</h3>
                                 <button><MoreVertical size={16} className="text-gray-400" /></button>
                             </div>
                             <div className="flex justify-between items-center text-xs text-gray-400">
                                 <span>{new Date(p.lastModified).toLocaleDateString()}</span>
                                 <div className="flex gap-4">
                                     <span className="flex items-center gap-1 text-brand-start"><Share2 size={12}/> Chia sẻ</span>
                                 </div>
                             </div>
                             
                             <div className="mt-3 flex gap-4 border-t border-dark-border pt-3">
                                 <div className="text-center">
                                     <span className="block text-white font-bold text-sm">{p.views || 0}</span>
                                     <span className="text-[10px] text-gray-500">Views</span>
                                 </div>
                                 <div className="text-center">
                                     <span className="block text-brand-gold font-bold text-sm">{p.leads || 0}</span>
                                     <span className="text-[10px] text-gray-500">Leads</span>
                                 </div>
                             </div>
                         </div>
                    </div>
                ))}
            </div>

            <BottomNav />
        </div>
    );
};
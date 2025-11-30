import React from 'react';
import { Search, Music, Image as ImageIcon, Box } from 'lucide-react';

export const Assets: React.FC = () => {
    return (
        <div className="p-4 md:p-8 pb-24 md:ml-20 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Asset Library</h1>
            
            <div className="relative mb-6">
                <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Search 5000+ models, textures, music..." 
                    className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-10 text-white focus:outline-none focus:border-brand-500"
                />
            </div>

            <div className="flex gap-4 mb-6 text-sm overflow-x-auto pb-2">
                <button className="bg-brand-600 text-white px-4 py-2 rounded-full whitespace-nowrap">All Assets</button>
                <button className="bg-dark-surface text-gray-300 border border-dark-border px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap"><Box size={14}/> 3D Models</button>
                <button className="bg-dark-surface text-gray-300 border border-dark-border px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap"><Music size={14}/> Music</button>
                <button className="bg-dark-surface text-gray-300 border border-dark-border px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap"><ImageIcon size={14}/> Textures</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-dark-surface rounded-xl overflow-hidden group cursor-pointer hover:ring-2 hover:ring-brand-500">
                        <div className="aspect-square bg-gray-800 relative">
                             <img src={`https://picsum.photos/id/${100+i}/300/300`} className="w-full h-full object-cover" />
                             <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full">
                                {i % 2 === 0 ? <Box size={14} className="text-white" /> : <Music size={14} className="text-white" />}
                             </div>
                        </div>
                        <div className="p-3">
                            <h4 className="text-white text-sm font-medium truncate">Modern Sofa {i+1}</h4>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-gray-400">Free</span>
                                <button className="text-brand-400 text-[10px] font-bold uppercase hover:text-brand-300">Add</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

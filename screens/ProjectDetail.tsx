
import React from 'react';
import { useStore } from '../store';
import { AppState } from '../types';
import { ChevronLeft, Play, Share2, Box, Eye, Edit3, MessageSquare, BarChart2, Mic, Clock, Download, MoreHorizontal } from 'lucide-react';
import { GradientButton } from '../components/GradientButton';

export const ProjectDetail: React.FC = () => {
    const { currentProject, setScreen, language } = useStore();

    if (!currentProject) {
        setScreen(AppState.PROJECTS);
        return null;
    }

    const ActionButton = ({ icon: Icon, label, onClick, highlight }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all active:scale-95 group h-32 ${
                highlight 
                ? 'bg-brand-gold/10 border-brand-gold/30 hover:bg-brand-gold/20' 
                : 'bg-dark-surface border-white/5 hover:border-brand-gold/30 hover:bg-white/5'
            }`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${highlight ? 'bg-brand-gold text-black' : 'bg-white/10 text-white group-hover:bg-brand-gold group-hover:text-black'}`}>
                <Icon size={20} />
            </div>
            <span className={`text-xs font-bold ${highlight ? 'text-brand-gold' : 'text-gray-400 group-hover:text-white'}`}>{label}</span>
        </button>
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-dark-surface/80 backdrop-blur z-20 sticky top-0">
                <button onClick={() => setScreen(AppState.PROJECTS)} className="text-gray-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <ChevronLeft size={20} /> <span className="hidden md:inline font-medium text-sm">Back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-white font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-md">{currentProject.name}</h1>
                    <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wide">
                        {currentProject.status}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5"><Download size={20}/></button>
                    <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5"><MoreHorizontal size={20}/></button>
                </div>
            </div>

            <div className="flex-1 w-full p-4 md:p-8 space-y-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Preview Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Hero Player */}
                        <div className="aspect-video w-full bg-black relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                            <img src={currentProject.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button 
                                    onClick={() => setScreen(AppState.EDITOR)}
                                    className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:bg-brand-gold group-hover:shadow-glow-gold border border-white/20 group-hover:border-transparent"
                                >
                                    <Play fill="currentColor" className="text-white ml-1 group-hover:text-black transition-colors" size={32} />
                                </button>
                            </div>
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                    <span className="bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white border border-white/10">4K 60FPS</span>
                                    <span className="bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white border border-white/10">HDR</span>
                            </div>
                        </div>
                        
                        {/* Script Section */}
                            <div className="bg-dark-surface p-6 rounded-2xl border border-white/5 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><MessageSquare size={18}/></div>
                                    <h3 className="text-white font-bold text-base">AI Script Generated</h3>
                                </div>
                                <button onClick={() => setScreen(AppState.EDITOR)} className="text-xs font-bold text-brand-gold hover:underline">EDIT SCRIPT</button>
                            </div>
                            <div className="relative pl-6 border-l-2 border-brand-gold/30">
                                <p className="text-gray-300 text-sm md:text-lg font-light italic leading-relaxed">
                                    "{currentProject.script || 'Chưa có kịch bản. Hãy vào Editor để AI viết kịch bản tự động cho bạn.'}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Quick Stats */}
                        <div className="bg-gradient-to-br from-dark-surface to-[#1A1D23] rounded-2xl border border-white/5 p-6 shadow-xl">
                            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-6">Project Insights</h3>
                            <div className="grid grid-cols-2 gap-y-6">
                                <div className="border-r border-white/5">
                                    <p className="text-gray-500 text-xs mb-1">Total Views</p>
                                    <p className="text-2xl font-bold text-white">{currentProject.views?.toLocaleString() || 0}</p>
                                </div>
                                <div className="pl-6">
                                    <p className="text-gray-500 text-xs mb-1">Leads Generated</p>
                                    <p className="text-2xl font-bold text-brand-gold">{currentProject.leads || 0}</p>
                                </div>
                                <div className="border-r border-white/5 pt-4 border-t">
                                    <p className="text-gray-500 text-xs mb-1">Duration</p>
                                    <p className="text-lg font-bold text-white flex items-center gap-2">
                                        <Clock size={16} className="text-gray-600"/> 0:{currentProject.duration}
                                    </p>
                                </div>
                                <div className="pl-6 pt-4 border-t border-white/5">
                                    <p className="text-gray-500 text-xs mb-1">Created</p>
                                    <p className="text-lg font-bold text-white text-sm mt-1">{new Date(currentProject.lastModified).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <GradientButton fullWidth variant="outline" size="sm" onClick={() => setScreen(AppState.ANALYTICS)}>
                                    View Full Analytics
                                </GradientButton>
                            </div>
                        </div>

                        {/* Tools Grid */}
                        <div>
                            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-4">Production Tools</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ActionButton icon={Edit3} label="Editor" highlight onClick={() => setScreen(AppState.EDITOR)} />
                                <ActionButton icon={Mic} label="Voiceover" onClick={() => setScreen(AppState.EDITOR)} />
                                <ActionButton icon={Box} label="AR View" onClick={() => setScreen(AppState.AR)} />
                                <ActionButton icon={Eye} label="VR Tour" onClick={() => setScreen(AppState.VR_SHOWROOM)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

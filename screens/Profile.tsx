
import React from 'react';
import { useStore } from '../store';
import { BottomNav } from '../components/BottomNav';
import { GradientButton } from '../components/GradientButton';
import { Crown, Settings, LogOut, ChevronRight, MessageCircle, Shield, Facebook, Send } from 'lucide-react';

export const Profile: React.FC = () => {
    const { user, logout, toggleSocialConnection } = useStore();

    const SocialButton = ({ icon: Icon, label, color, platform, connected }: any) => (
        <button 
            onClick={() => toggleSocialConnection(platform)}
            className={`w-full flex items-center justify-between p-4 border-b border-white/5 last:border-0 transition-all group ${
                connected ? 'bg-white/5' : 'hover:bg-white/5'
            }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${connected ? color.replace('text-', 'bg-') + '/20' : 'bg-gray-800'}`}>
                    <Icon size={20} className={connected ? color : 'text-gray-400 group-hover:text-white'} />
                </div>
                <div className="text-left">
                    <span className="text-white text-sm font-bold block">{label}</span>
                    <span className={`text-[10px] uppercase tracking-wide font-medium ${connected ? 'text-green-400' : 'text-gray-500'}`}>
                        {connected ? 'Active ●' : 'Disconnected'}
                    </span>
                </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-transform active:scale-95 ${connected ? 'bg-white/10 text-white border border-white/10' : 'bg-brand-gold text-black shadow-glow-gold'}`}>
                {connected ? 'Disconnect' : 'Connect'}
            </div>
        </button>
    );

    return (
        <div className="h-full bg-dark-bg overflow-y-auto pb-32">
            {/* Header */}
            <div className="relative h-64 bg-gradient-to-b from-[#1A1D23] to-dark-bg border-b border-white/5">
                <div className="absolute top-8 right-8">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full"><Settings size={20}/></button>
                </div>
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full border-4 border-dark-bg overflow-hidden relative shadow-2xl p-1 bg-gradient-to-br from-brand-gold to-orange-600">
                         <div className="w-full h-full rounded-full overflow-hidden border-2 border-black">
                            <img src={user.avatar} className="w-full h-full object-cover" />
                         </div>
                    </div>
                    <div className="mt-3 text-center">
                        <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                        <div className="flex items-center gap-2 justify-center mt-1">
                            <span className="text-gray-400 text-sm">{user.phone || '0909 *** 888'}</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span className="text-brand-gold text-xs font-bold border border-brand-gold/30 px-2 py-0.5 rounded-full bg-brand-gold/10">PRO MEMBER</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-20 px-4 md:px-8 max-w-2xl mx-auto space-y-8">
                {/* Premium Banner */}
                <div className="bg-gradient-to-r from-[#FFD700] to-[#FF8C00] rounded-3xl p-6 relative overflow-hidden shadow-glow-gold group cursor-pointer transform hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/30 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h3 className="text-black font-bold text-xl flex items-center gap-2 mb-1">
                                <Crown fill="black" size={24} /> LuxRender ELITE
                            </h3>
                            <p className="text-black/70 text-sm font-medium max-w-[250px] leading-tight">
                                Unlock 8K Export, VR Showroom, AI Scripting & Priority Support.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="bg-black/10 backdrop-blur-md rounded-xl px-4 py-2 border border-black/5">
                                <span className="text-black font-bold text-lg block">299k</span>
                                <span className="text-black/60 text-[10px] font-bold uppercase tracking-wide">/ Month</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Integration Section */}
                <div>
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-4 px-1">Ecosystem Integrations</h3>
                    <div className="bg-dark-surface rounded-3xl overflow-hidden border border-white/5 shadow-lg">
                        <SocialButton 
                            icon={MessageCircle} 
                            label="Zalo Official Account" 
                            color="text-blue-500" 
                            platform="zalo"
                            connected={user.socialConnections?.zalo} 
                        />
                        <SocialButton 
                            icon={Facebook} 
                            label="Facebook Fanpage" 
                            color="text-blue-600" 
                            platform="facebook"
                            connected={user.socialConnections?.facebook} 
                        />
                        <SocialButton 
                            icon={Send} 
                            label="Telegram Bot" 
                            color="text-sky-400" 
                            platform="telegram"
                            connected={user.socialConnections?.telegram} 
                        />
                    </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 bg-dark-surface rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-gray-400 group-hover:text-white"/>
                            <span className="text-white font-medium">Privacy & Security</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-600"/>
                    </button>

                    <button 
                        onClick={logout}
                        className="w-full py-4 text-red-500 font-bold text-sm bg-dark-surface rounded-2xl border border-white/5 flex items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
                
                <div className="text-center pt-4 pb-8">
                    <p className="text-gray-600 text-xs font-mono">LuxRender v2.5.0 (Build 2025.04.15)</p>
                    <p className="text-[10px] text-gray-700 mt-1 uppercase tracking-widest">Designed by HỮU HƯƠNG</p>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};


import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { AppState } from '../types';
import { ChevronLeft, Play, Pause, Share2, Layers, Music, Type, Wand2, Mic, Box, ZoomIn, ZoomOut } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { AIVoiceGuide } from '../components/AIVoiceGuide';

// Fix for missing R3F types in JSX.IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
    }
  }
}

const ModelViewer = () => (
    <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <mesh rotation={[0.5, 0.5, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.8} />
        </mesh>
        <OrbitControls autoRotate autoRotateSpeed={4} />
        <Environment preset="city" />
    </Canvas>
);

export const Editor: React.FC = () => {
  const { currentProject, setScreen, language } = useStore();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(30);
  const [activeTab, setActiveTab] = useState<'clips' | 'text' | 'music' | 'voice'>('clips');

  useEffect(() => {
    if (!currentProject) setScreen(AppState.HOME);
  }, [currentProject, setScreen]);

  if (!currentProject) return null;

  const togglePlay = () => setPlaying(!playing);

  const handleExport = () => {
    alert(language === 'vi' ? 'Đang xuất video 8K Premium...' : 'Exporting 8K Premium video...');
  };

  const is3D = currentProject.type === 'construction' || currentProject.scenes.some(s => s.type === '3d');

  return (
    <div className="flex flex-col h-full w-full bg-[#0F1115] overflow-hidden">
      {/* Top Header - Fixed Height */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#14161B] z-30 flex-shrink-0 shadow-md">
        <div className="flex items-center gap-4">
            <button onClick={() => setScreen(AppState.HOME)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col">
                <h1 className="text-white font-bold text-sm md:text-base leading-tight truncate max-w-[150px] md:max-w-xs">{currentProject.name}</h1>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-brand-gold font-bold px-1.5 py-0.5 bg-brand-gold/10 rounded">PRO</span>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
             <button onClick={handleExport} className="bg-gradient-to-r from-brand-gold to-orange-500 text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-glow-gold hover:opacity-90 transition-opacity">
                <Share2 size={14} /> <span className="hidden md:inline">Export</span>
             </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left Toolbar (Desktop Only) */}
          <aside className="hidden md:flex flex-col w-16 border-r border-white/5 bg-[#14161B] items-center py-6 gap-6 z-20 flex-shrink-0">
             {[
                 { id: 'clips', icon: Layers, label: 'Media' },
                 { id: 'text', icon: Type, label: 'Text' },
                 { id: 'music', icon: Music, label: 'Audio' },
                 { id: 'voice', icon: Mic, label: 'Voice' },
                 { id: 'fx', icon: Wand2, label: 'FX' },
             ].map((tool) => (
                 <button 
                    key={tool.id}
                    onClick={() => setActiveTab(tool.id as any)} 
                    className={`p-3 rounded-xl transition-all duration-300 relative group ${activeTab === tool.id ? 'bg-brand-gold/20 text-brand-gold' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                 >
                     <tool.icon size={20} strokeWidth={activeTab === tool.id ? 2.5 : 2} />
                     {activeTab === tool.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-gold rounded-r" />}
                 </button>
             ))}
          </aside>

          {/* Center Area */}
          <div className="flex-1 flex flex-col relative h-full min-h-0 w-full">
                
                {/* 1. Preview Monitor (Flexible Height) */}
                <div className="flex-1 bg-black/90 relative flex items-center justify-center p-2 md:p-8 overflow-hidden shadow-inner min-h-0">
                    <div className="relative w-full h-full max-h-[70vh] aspect-video bg-[#050505] rounded-lg shadow-2xl overflow-hidden border border-white/10 group flex items-center justify-center">
                        {is3D ? (
                            <ModelViewer />
                        ) : (
                            <img 
                                src={currentProject.scenes[0]?.url || 'https://picsum.photos/800/600'} 
                                className={`w-full h-full object-contain transition-transform duration-[10000ms] ease-linear ${playing ? 'scale-110' : 'scale-100'}`}
                                alt="Preview"
                            />
                        )}
                        
                        {/* Playback Controls Overlay */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10 opacity-100 transition-opacity duration-300">
                             <div className="bg-black/60 backdrop-blur-xl rounded-full p-2 flex items-center gap-4 border border-white/10">
                                <button onClick={togglePlay} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-glow">
                                    {playing ? <Pause fill="black" size={16} /> : <Play fill="black" className="ml-1" size={16} />}
                                </button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Toolbar (Bottom of Preview) */}
                <div className="md:hidden h-12 bg-[#14161B] border-t border-b border-white/5 flex items-center justify-around px-2 relative z-30 shrink-0">
                    {['clips', 'text', 'music', 'voice'].map((t) => (
                        <button 
                            key={t}
                            onClick={() => setActiveTab(t as any)} 
                            className={`flex flex-col items-center justify-center h-full w-full gap-1 ${activeTab === t ? 'text-brand-gold bg-white/5' : 'text-gray-500'}`}
                        >
                            {t === 'clips' && <Layers size={16} />}
                            {t === 'text' && <Type size={16} />}
                            {t === 'music' && <Music size={16} />}
                            {t === 'voice' && <Mic size={16} />}
                        </button>
                    ))}
                </div>

                {/* 2. Timeline Area - Adjusted for mobile visibility (25vh on mobile, 72 on desktop) */}
                <div className="h-[25vh] min-h-[160px] md:h-72 bg-[#14161B] flex flex-col relative z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] flex-shrink-0 border-t border-white/5">
                     {/* Timeline Toolbar */}
                     <div className="h-8 md:h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#1A1D23]">
                         <div className="flex items-center gap-4">
                             <span className="text-[10px] md:text-xs text-gray-400">00:15:00 / 00:45:00</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <button className="p-1 text-gray-500 hover:text-white"><ZoomOut size={14}/></button>
                             <div className="w-16 md:w-20 h-1 bg-gray-700 rounded-full">
                                 <div className="w-1/3 h-full bg-gray-400 rounded-full"></div>
                             </div>
                             <button className="p-1 text-gray-500 hover:text-white"><ZoomIn size={14}/></button>
                         </div>
                     </div>

                     {/* Content Container */}
                     <div className="flex-1 relative flex overflow-hidden">
                         {/* Side Panel (Contextual) */}
                         {activeTab === 'voice' ? (
                             <div className="w-full md:w-80 h-full border-r border-white/5 bg-[#14161B] z-30 absolute left-0 top-0 md:relative overflow-hidden flex flex-col">
                                 <div className="p-2 border-b border-white/5 flex justify-between md:hidden">
                                    <span className="text-xs font-bold text-white">Voice Settings</span>
                                    <button onClick={() => setActiveTab('clips')}><ChevronLeft size={16} className="text-white"/></button>
                                 </div>
                                 <div className="flex-1 overflow-y-auto">
                                    <AIVoiceGuide onApply={(url) => console.log('Applied', url)} />
                                 </div>
                             </div>
                         ) : null}

                         {/* Timeline Tracks */}
                         <div className="flex-1 flex flex-col relative overflow-hidden">
                             {/* Ruler */}
                             <div className="h-5 flex items-center border-b border-white/5 bg-[#14161B] overflow-hidden shrink-0 select-none">
                                 <div className="flex-1 flex relative" style={{ transform: 'translateX(-10px)' }}>
                                    {[...Array(60)].map((_, i) => (
                                        <div key={i} className="flex-shrink-0 w-10 h-full flex flex-col justify-end items-start border-l border-white/5 pl-1 relative">
                                            <span className="text-[8px] text-gray-600 font-mono mb-0.5">{i % 5 === 0 ? `00:${i < 10 ? '0'+i : i}` : ''}</span>
                                            <div className={`w-px bg-gray-700 ${i % 5 === 0 ? 'h-2' : 'h-1'}`} />
                                        </div>
                                    ))}
                                 </div>
                             </div>

                             {/* Tracks Container */}
                             <div className="flex-1 overflow-y-auto overflow-x-auto p-2 md:p-4 space-y-2 md:space-y-3 bg-[#0F1115] relative custom-scrollbar">
                                 {/* Playhead Line */}
                                 <div className="absolute top-0 bottom-0 w-px bg-brand-gold z-30 pointer-events-none shadow-[0_0_10px_rgba(255,215,0,0.5)]" style={{ left: `${progress}%` }}>
                                     <div className="w-3 h-3 bg-brand-gold rotate-45 -ml-[5px] -mt-1.5 border border-black shadow-sm"></div>
                                 </div>

                                 {/* Video Track */}
                                 <div className="group relative">
                                     <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-[#1A1D23] z-10 border-r border-white/5 flex items-center px-2 text-[10px] md:text-xs text-gray-400 font-medium truncate">
                                         <Layers size={12} className="mr-1 md:mr-2 shrink-0"/> Video
                                     </div>
                                     <div className="pl-16 md:pl-24 flex gap-1 h-12 md:h-16">
                                         {currentProject.scenes.map((scene, i) => (
                                             <div key={i} className="min-w-[80px] md:min-w-[140px] h-full bg-slate-800 rounded-lg overflow-hidden relative border border-white/10 group hover:border-brand-gold/50 cursor-pointer transition-all hover:brightness-110">
                                                 {scene.type === '3d' ? (
                                                     <div className="w-full h-full flex items-center justify-center bg-blue-900/10"><Box size={24} className="text-brand-gold"/></div>
                                                 ) : (
                                                     <img src={scene.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Audio Track */}
                                 <div className="group relative">
                                     <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-[#1A1D23] z-10 border-r border-white/5 flex items-center px-2 text-[10px] md:text-xs text-gray-400 font-medium truncate">
                                         <Music size={12} className="mr-1 md:mr-2 shrink-0"/> Audio
                                     </div>
                                     <div className="pl-16 md:pl-24 flex gap-1 h-8 md:h-10 items-center">
                                         <div className="w-[200px] md:w-[400px] h-full bg-purple-900/30 border border-purple-500/30 rounded-lg flex items-center px-3 cursor-grab relative overflow-hidden">
                                             <span className="text-[9px] text-purple-200 relative z-10 font-medium truncate">Music.mp3</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
          </div>
      </div>
    </div>
  );
};

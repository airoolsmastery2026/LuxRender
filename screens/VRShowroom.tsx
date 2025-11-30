
import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { AppState } from '../types';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, Sphere } from '@react-three/drei';
import { TextureLoader, BackSide } from 'three';
import { ChevronLeft, Info, Headphones, Compass, Glasses } from 'lucide-react';
import { GradientButton } from '../components/GradientButton';

// Fix for missing R3F types in JSX.IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshBasicMaterial: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      meshBasicMaterial: any;
    }
  }
}

const VRScene = ({ imageUrl }: { imageUrl: string }) => {
    const texture = useLoader(TextureLoader, imageUrl);
    return (
        <Sphere args={[500, 60, 40]} scale={[-1, 1, 1]}>
            <meshBasicMaterial map={texture} side={BackSide} />
        </Sphere>
    );
};

const Hotspot = ({ position, label }: { position: [number, number, number], label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Html position={position}>
            <div className="relative group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                    <Info size={16} className="text-white" />
                </div>
                {isOpen && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10">
                        <h4 className="text-white font-bold text-sm mb-1">{label}</h4>
                        <p className="text-gray-300 text-xs">Sàn gỗ nhập khẩu Đức, view trực diện sông Sài Gòn.</p>
                    </div>
                )}
            </div>
        </Html>
    );
};

export const VRShowroom: React.FC = () => {
    const { currentProject, setScreen } = useStore();
    const [viewMode, setViewMode] = useState<'360' | 'cardboard'>('360');

    // Use a high-res equirectangular placeholder
    const panoUrl = "https://images.unsplash.com/photo-1557971370-e7298ee473fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";

    return (
        <div className="h-full bg-black relative">
             {/* UI Overlay */}
             <div className="absolute top-0 left-0 w-full z-10 p-4 flex justify-between items-start pointer-events-none">
                <button onClick={() => setScreen(AppState.PROJECT_DETAIL)} className="pointer-events-auto bg-black/40 p-2 rounded-full text-white backdrop-blur-md hover:bg-black/60">
                    <ChevronLeft />
                </button>
                <div className="flex flex-col items-end gap-2 pointer-events-auto">
                    <div className="bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                         <p className="text-white text-xs font-bold flex items-center gap-2">
                            <Compass size={14} className="text-brand-gold"/> {currentProject?.name || 'VR Tour'}
                         </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setViewMode(viewMode === '360' ? 'cardboard' : '360')}
                            className={`p-2 rounded-full backdrop-blur-md border border-white/10 text-white ${viewMode === 'cardboard' ? 'bg-brand-500' : 'bg-black/40'}`}
                        >
                            <Glasses size={20} />
                        </button>
                        <button className="bg-black/40 p-2 rounded-full text-white backdrop-blur-md border border-white/10">
                            <Headphones size={20} />
                        </button>
                    </div>
                </div>
             </div>

             {/* 3D Scene */}
             <div className="absolute inset-0 z-0">
                 <Canvas camera={{ position: [0, 0, 0.1] }}>
                     <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
                     <React.Suspense fallback={<Html center><div className="text-white">Loading VR...</div></Html>}>
                        <VRScene imageUrl={panoUrl} />
                        <Hotspot position={[15, -2, -10]} label="Sofa Ý Cao Cấp" />
                        <Hotspot position={[-10, 0, 15]} label="Khu Vực Bếp" />
                        <Hotspot position={[5, 5, 10]} label="Đèn Chùm Pha Lê" />
                     </React.Suspense>
                 </Canvas>
             </div>

             {/* Bottom Controls */}
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full px-4 flex justify-center pointer-events-none">
                 <div className="bg-black/50 backdrop-blur-md rounded-2xl p-2 flex gap-4 pointer-events-auto border border-white/10">
                     <button className="flex flex-col items-center gap-1 text-white opacity-100 hover:text-brand-500">
                         <div className="w-16 h-12 rounded-lg bg-cover bg-center border-2 border-brand-500" style={{backgroundImage: `url(${panoUrl})`}}></div>
                         <span className="text-[10px]">Phòng Khách</span>
                     </button>
                     <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                         <div className="w-16 h-12 rounded-lg bg-gray-700 border-2 border-transparent"></div>
                         <span className="text-[10px]">Phòng Ngủ</span>
                     </button>
                     <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                         <div className="w-16 h-12 rounded-lg bg-gray-700 border-2 border-transparent"></div>
                         <span className="text-[10px]">Ban Công</span>
                     </button>
                 </div>
             </div>
        </div>
    );
};

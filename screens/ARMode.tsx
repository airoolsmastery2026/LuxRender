
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { AppState } from '../types';
import { X, Camera, RefreshCw, Loader2 } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';

// Fix for missing R3F types in JSX.IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
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
      pointLight: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
    }
  }
}

export const ARMode: React.FC = () => {
    const { setScreen } = useStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [streamActive, setStreamActive] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            try {
                // Request camera immediately without user trigger
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Small delay to ensure video element is ready
                    videoRef.current.onloadedmetadata = () => {
                        setStreamActive(true);
                    };
                }
            } catch (err) {
                console.error("Camera access denied or error:", err);
                // Handle error silently or show a specific settings prompt if needed
            }
        };
        startCamera();

        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-50">
             {/* Camera Feed */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Loading Spinner (Only visible if stream takes time, no text) */}
            {!streamActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="text-brand-gold animate-spin" size={48} />
                </div>
            )}

            {/* AR Overlay (Three.js) */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}>
                 <Canvas camera={{ position: [0, 0, 5] }}>
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} />
                    {/* Simulated AR Object */}
                    <mesh rotation={[0.4, 0.2, 0]}>
                         <boxGeometry args={[1, 1, 1]} />
                         <meshStandardMaterial color="#FFD700" wireframe />
                    </mesh>
                 </Canvas>
            </div>

            {/* UI Controls */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10">
                <button onClick={() => setScreen(AppState.HOME)} className="bg-black/40 p-2 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition-colors">
                    <X />
                </button>
                <div className="bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                    <p className="text-white text-xs font-bold font-serif tracking-widest text-brand-gold">AR MODE</p>
                </div>
            </div>

            <div className="absolute bottom-10 left-0 w-full flex justify-center items-center gap-8 z-20">
                <button className="text-white p-3 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors">
                     <RefreshCw size={24} />
                </button>
                <button className="w-20 h-20 border-4 border-white/80 rounded-full flex items-center justify-center bg-brand-gold/90 shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:scale-105 transition-transform">
                    <Camera size={36} className="text-black" />
                </button>
                <div className="w-12"></div> {/* Spacer */}
            </div>

            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-lg backdrop-blur text-center pointer-events-auto cursor-pointer border border-white/5">
                <p className="text-white text-xs font-medium">Tap to place furniture</p>
            </div>
        </div>
    );
};

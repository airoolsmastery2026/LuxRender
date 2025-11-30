import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AVAILABLE_VOICES, generateSpeech } from '../services/voiceService';
import { generateRealEstateScript } from '../services/geminiService';
import { GradientButton } from './GradientButton';
import { Mic, Play, Square, Wand2, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
    onApply: (url: string) => void;
}

export const AIVoiceGuide: React.FC<Props> = ({ onApply }) => {
    const { currentProject, updateCurrentProject, language } = useStore();
    const [script, setScript] = useState(currentProject?.script || '');
    const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0].id);
    const [emotion, setEmotion] = useState('luxury');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScripting, setIsScripting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentProject?.voiceOverUrl || null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [micPermission, setMicPermission] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Auto-request Mic permission on mount for visualizer
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => setMicPermission(true))
            .catch(() => setMicPermission(false));
    }, []);

    useEffect(() => {
        if(currentProject?.script) setScript(currentProject.script);
    }, [currentProject]);

    const handleAutoScript = async () => {
        if (!currentProject) return;
        setIsScripting(true);
        const newScript = await generateRealEstateScript(currentProject.name, currentProject.type, 'Sang trọng, hiện đại, tiện nghi', language);
        setScript(newScript);
        updateCurrentProject({ script: newScript });
        setIsScripting(false);
    };

    const handleGenerateVoice = async () => {
        if (!script) return;
        setIsGenerating(true);
        try {
            const result = await generateSpeech(script, {
                voiceId: selectedVoice,
                language: language === 'vi' ? 'vi-VN' : 'en-US',
                emotion: emotion as any,
                speed: 1.0
            });
            setPreviewUrl(result.url);
            // Auto play on generation
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.src = result.url;
                    audioRef.current.play();
                    setIsPlaying(true);
                }
            }, 100);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !previewUrl) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleApply = () => {
        if (previewUrl) {
            updateCurrentProject({ voiceOverUrl: previewUrl });
            onApply(previewUrl);
        }
    };

    return (
        <div className="bg-dark-surface p-4 rounded-xl border border-dark-border h-full flex flex-col">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${micPermission ? 'bg-brand-gold/20' : 'bg-gray-700'}`}>
                    <Mic className={micPermission ? "text-brand-gold" : "text-gray-400"} size={16} />
                </div>
                {language === 'vi' ? 'Trợ lý Giọng nói AI' : 'AI Voice Assistant'}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4">
                {/* Script Section */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-400 text-xs uppercase font-semibold">Kịch bản (Script)</label>
                        <button 
                            onClick={handleAutoScript}
                            disabled={isScripting}
                            className="text-brand-start text-xs flex items-center gap-1 hover:text-white transition-colors"
                        >
                            {isScripting ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />}
                            {language === 'vi' ? 'AI Viết lại' : 'AI Rewrite'}
                        </button>
                    </div>
                    <textarea 
                        className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white text-sm focus:outline-none focus:border-brand-500 h-24 resize-none"
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Nhập nội dung thuyết minh..."
                    />
                </div>

                {/* Voice Settings */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs uppercase font-semibold">Giọng đọc</label>
                        <select 
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-white text-xs focus:outline-none"
                        >
                            {AVAILABLE_VOICES.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs uppercase font-semibold">Cảm xúc</label>
                        <select 
                            value={emotion}
                            onChange={(e) => setEmotion(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-white text-xs focus:outline-none"
                        >
                            <option value="luxury">Sang trọng (Luxury)</option>
                            <option value="friendly">Thân thiện (Friendly)</option>
                            <option value="excited">Hào hứng (Excited)</option>
                            <option value="professional">Chuyên nghiệp</option>
                        </select>
                    </div>
                </div>

                {/* Audio Player */}
                {previewUrl && (
                    <div className="bg-dark-bg p-3 rounded-lg border border-dark-border flex items-center gap-3">
                        <button 
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-brand-500 hover:text-white transition-colors"
                        >
                            {isPlaying ? <Square size={14} fill="white" /> : <Play size={16} fill="white" className="ml-1"/>}
                        </button>
                        <div className="flex-1">
                            {/* Fake Waveform */}
                            <div className="flex items-center gap-0.5 h-6">
                                {[...Array(20)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-1 rounded-full transition-all duration-200 ${isPlaying ? 'bg-brand-400 animate-pulse' : 'bg-gray-700'}`}
                                        style={{ height: `${Math.random() * 100}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                        <audio 
                            ref={audioRef} 
                            src={previewUrl} 
                            onEnded={() => setIsPlaying(false)} 
                            className="hidden"
                        />
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-3">
                <button 
                    onClick={handleGenerateVoice}
                    disabled={isGenerating}
                    className="flex-1 bg-dark-bg border border-dark-border text-white py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 hover:bg-gray-800"
                >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {language === 'vi' ? 'Tạo giọng' : 'Generate'}
                </button>
                <GradientButton 
                    className="flex-1" 
                    onClick={handleApply}
                    disabled={!previewUrl}
                >
                    <div className="flex items-center gap-2 text-xs">
                        <CheckCircle size={14} />
                        {language === 'vi' ? 'Áp dụng' : 'Apply'}
                    </div>
                </GradientButton>
            </div>
        </div>
    );
};
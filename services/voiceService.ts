import { VoiceConfig } from "../types";

// Mock Data for Voices
export const AVAILABLE_VOICES = [
    { id: 'minh-nhat-pro', name: 'Minh Nhật (Nam - Chuẩn giọng HN)', gender: 'male', region: 'north' },
    { id: 'ngoc-lan-pro', name: 'Ngọc Lan (Nữ - Truyền cảm)', gender: 'female', region: 'north' },
    { id: 'quang-huy', name: 'Quang Huy (Nam - Sài Gòn)', gender: 'male', region: 'south' },
    { id: 'my-linh', name: 'Mỹ Linh (Nữ - Nhẹ nhàng)', gender: 'female', region: 'south' },
    { id: 'adam-us', name: 'Adam (English - Professional)', gender: 'male', region: 'us' },
];

export const generateSpeech = async (text: string, config: VoiceConfig): Promise<{ url: string, duration: number }> => {
    return new Promise((resolve) => {
        // Simulate API latency
        setTimeout(() => {
            console.log(`[ElevenLabs Mock] Generating speech for: "${text.substring(0, 20)}..." with voice ${config.voiceId}`);
            
            // In a real app, this would call ElevenLabs API and return a blob URL.
            // Here we return a specific mock file based on length or just a standard file.
            // Using a free sample MP3 for demo purposes.
            const mockUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
            
            // Simulate random duration between 10s and 30s based on text length
            const estimatedDuration = Math.max(5, Math.min(120, text.length * 0.1));
            
            resolve({
                url: mockUrl,
                duration: estimatedDuration
            });
        }, 2000);
    });
};

export const getEstimatedCost = (textLength: number): number => {
    // Mock calculation for ElevenLabs credits
    return Math.ceil(textLength * 1.5);
};
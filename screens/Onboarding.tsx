
import React, { useState } from 'react';
import { useStore } from '../store';
import { GradientButton } from '../components/GradientButton';
import { ArrowRight, Video, Box, Users, Aperture } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { completeOnboarding } = useStore();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      icon: <Video size={48} className="text-brand-gold" />,
      title: "LuxRender Studio 8K",
      desc: "Kiến tạo video BĐS chuẩn Hollywood chỉ trong 60 giây. Nâng tầm dự án của bạn.",
      // Cinematic Exterior/Drone Shot
      video: "https://videos.pexels.com/video-files/3254006/3254006-hd_1920_1080_25fps.mp4"
    },
    {
      icon: <Box size={48} className="text-brand-gold" />,
      title: "Công nghệ AR & VR Đẳng cấp",
      desc: "Trải nghiệm không gian ảo siêu thực. Chốt khách ngay tại showroom ảo.",
      // Smooth Interior Walkthrough / VR Style
      video: "https://videos.pexels.com/video-files/7578546/7578546-uhd_2160_3840_25fps.mp4"
    },
    {
      icon: <Users size={48} className="text-brand-gold" />,
      title: "Cộng đồng Tinh Hoa",
      desc: "Gia nhập mạng lưới môi giới cao cấp sử dụng LuxRender để dẫn đầu thị trường.",
      // Professional Architects/Team
      video: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4"
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg relative overflow-y-auto no-scrollbar">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-brand-gold/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-blue-900/20 rounded-full blur-[100px]" />

        {/* Header Logo Small */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2 opacity-80 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
             <Aperture size={20} className="text-brand-gold" />
             <span className="font-serif font-bold text-white text-sm">LuxRender</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 pt-20 z-10">
            {/* Visual - Video Card */}
            <div className="relative w-full aspect-[4/5] max-h-[50vh] rounded-3xl overflow-hidden shadow-2xl mb-4 md:mb-8 border border-white/10 group flex-shrink-0 bg-gray-900">
                <video 
                    key={slide} // Key change forces re-render/replay when slide changes
                    src={slides[slide].video} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                    autoPlay
                    muted
                    loop
                    playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent" />
                
                {/* Floating Icon */}
                <div className="absolute top-6 right-6 w-16 h-16 md:w-20 md:h-20 bg-dark-bg/80 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-brand-gold/20 shadow-glow-gold animate-float">
                    {slides[slide].icon}
                </div>
            </div>

            {/* Text & Actions (Pushed to bottom, but scrollable if needed) */}
            <div className="mt-auto pb-6">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 leading-tight">
                    {slides[slide].title}
                </h1>
                <p className="text-gray-400 text-sm md:text-base mb-6 leading-relaxed font-light">
                    {slides[slide].desc}
                </p>

                {/* Indicators */}
                <div className="flex gap-2 mb-6">
                    {slides.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-brand-gold' : 'w-2 bg-gray-700'}`} 
                        />
                    ))}
                </div>

                <div className="w-full flex justify-center md:block">
                    <div className="w-full md:w-[30%] mx-auto">
                        <GradientButton variant="gold" onClick={handleNext} fullWidth size="lg">
                            {slide === slides.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'}
                            {slide !== slides.length - 1 && <ArrowRight size={18} className="ml-2" />}
                        </GradientButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { AppState, Project } from '../types';
import { GradientButton } from '../components/GradientButton';
import { ChevronLeft, Upload, Check, Wand2, Music, Type, Play } from 'lucide-react';

export const Create: React.FC = () => {
  const { setScreen, addProject, setCurrentProject } = useStore();
  const [step, setStep] = useState(1); // 1: Upload, 2: Template, 3: Edit, 4: AI Gen, 5: Result
  const [files, setFiles] = useState<File[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps Configuration
  const steps = [
    { id: 1, title: 'Tải lên' },
    { id: 2, title: 'Mẫu' },
    { id: 3, title: 'Chỉnh sửa' },
    { id: 4, title: 'Xử lý' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const nextStep = () => {
    if (step === 3) {
      // Start AI Generation simulation
      setStep(4);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        setLoadingProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            
            // Create the new project in store
            const newId = Date.now().toString();
            const newProject: Project = {
                id: newId,
                name: 'New AI Project ' + new Date().toLocaleTimeString(),
                thumbnail: files.length > 0 ? URL.createObjectURL(files[0]) : 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
                status: 'completed',
                duration: 45,
                type: 'apartment',
                script: 'Mẫu kịch bản tự động được AI tạo ra dựa trên hình ảnh của bạn...',
                lastModified: new Date(),
                scenes: files.map((f, i) => ({
                    id: `scene-${i}`,
                    type: 'image',
                    url: URL.createObjectURL(f),
                    duration: 5,
                    description: `Scene ${i+1}`
                })),
                views: 0,
                leads: 0
            };
            
            // Add default scene if none uploaded (mock flow)
            if (newProject.scenes.length === 0) {
                newProject.scenes.push({
                    id: 's1', type: 'image', 
                    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
                    duration: 5, description: 'Default'
                });
            }

            addProject(newProject);
            setCreatedProjectId(newId);
            setStep(5);
        }
      }, 50);
    } else {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
      // Find the created project and set it as current
      setScreen(AppState.PROJECT_DETAIL);
  };

  // --- Step 4: AI Loading Animation ---
  if (step === 4) {
      return (
          <div className="h-full bg-dark-bg flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://cdn.dribbble.com/users/1227803/screenshots/15479007/media/1d9111c03d778d055404f26b5278d65c.gif')] opacity-10 bg-cover" />
               
               <div className="w-32 h-32 relative mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-dark-surface" />
                  <div className="absolute inset-0 rounded-full border-4 border-brand-start border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-xl font-bold text-white">{loadingProgress}%</span>
                  </div>
               </div>
               
               <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">Đang AI tạo video...</h2>
               <p className="text-gray-400 text-sm max-w-xs">
                  AI đang phân tích ánh sáng, tạo chuyển động camera và lồng tiếng.
               </p>
          </div>
      );
  }

  // --- Step 5: Success Result ---
  if (step === 5) {
      return (
          <div className="h-full bg-dark-bg flex flex-col">
              <div className="flex-1 relative">
                   <img src={files.length > 0 ? URL.createObjectURL(files[0]) : "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 flex items-center justify-center">
                       <button className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-glow">
                           <Play fill="white" className="text-white ml-1" size={32} />
                       </button>
                   </div>
                   <div className="absolute top-8 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-xs border border-white/20">
                       4K • 60FPS
                   </div>
              </div>
              <div className="p-6 bg-dark-surface rounded-t-3xl -mt-6 relative z-10 border-t border-white/10">
                  <h2 className="text-xl font-bold text-white mb-2">Video của bạn đã sẵn sàng! 🎉</h2>
                  <p className="text-gray-400 text-sm mb-6">Video đã được tối ưu cho TikTok & Facebook Reels.</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <button onClick={handleFinish} className="bg-dark-bg border border-dark-border text-white py-3 rounded-xl font-medium">Chỉnh sửa lại</button>
                      <GradientButton onClick={handleFinish}>Xem chi tiết</GradientButton>
                  </div>
                  <button onClick={() => setScreen(AppState.HOME)} className="w-full text-gray-500 text-sm hover:text-white">Về trang chủ</button>
              </div>
          </div>
      );
  }

  // --- Main Wizard UI ---
  return (
    <div className="h-full bg-dark-bg flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-border">
        <button onClick={() => step > 1 ? setStep(step - 1) : setScreen(AppState.HOME)} className="text-white">
          <ChevronLeft />
        </button>
        <h1 className="text-white font-bold text-lg">{steps[step-1].title}</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-dark-surface w-full">
        <div 
            className="h-full bg-gradient-to-r from-brand-start to-brand-end transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }} 
        />
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {step === 1 && (
            <div className="h-full flex flex-col">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-dark-border rounded-3xl bg-dark-surface/50 flex flex-col items-center justify-center gap-4 hover:border-brand-start transition-colors cursor-pointer"
                >
                    <div className="w-20 h-20 bg-dark-surface rounded-full flex items-center justify-center shadow-lg">
                        <Upload size={32} className="text-brand-start" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-white font-bold text-lg">Chạm để tải ảnh/video</h3>
                        <p className="text-gray-500 text-sm mt-1">Hỗ trợ JPG, PNG, MP4, GLB</p>
                    </div>
                    <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
                {files.length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                        {files.map((f, i) => (
                            <div key={i} className="w-20 h-20 bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden relative">
                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4,5,6].map(i => (
                    <div 
                        key={i} 
                        onClick={() => setSelectedTemplate(i.toString())}
                        className={`aspect-[9/16] rounded-2xl bg-gray-800 overflow-hidden relative border-2 transition-all cursor-pointer ${selectedTemplate === i.toString() ? 'border-brand-start shadow-glow' : 'border-transparent'}`}
                    >
                        <img src={`https://picsum.photos/300/500?random=${i}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-xs font-bold">Cinematic Villa {i}</p>
                        </div>
                        {selectedTemplate === i.toString() && (
                            <div className="absolute top-2 right-2 bg-brand-start rounded-full p-1">
                                <Check size={12} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {step === 3 && (
            <div className="space-y-6">
                <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden relative">
                    <img src={files[0] ? URL.createObjectURL(files[0]) : "https://picsum.photos/800/450"} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="text-white/50" size={48} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-dark-surface p-4 rounded-xl border border-dark-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Wand2 size={20} /></div>
                            <div>
                                <p className="text-white font-medium text-sm">Kịch bản AI</p>
                                <p className="text-gray-500 text-xs">Tự động viết lời bình</p>
                            </div>
                        </div>
                        <input type="checkbox" defaultChecked className="toggle-checkbox" />
                    </div>

                    <div className="bg-dark-surface p-4 rounded-xl border border-dark-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Music size={20} /></div>
                            <div>
                                <p className="text-white font-medium text-sm">Nhạc nền</p>
                                <p className="text-gray-500 text-xs">Luxury Acoustic</p>
                            </div>
                        </div>
                        <span className="text-brand-start text-xs font-bold">Thay đổi</span>
                    </div>

                     <div className="bg-dark-surface p-4 rounded-xl border border-dark-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><Type size={20} /></div>
                            <div>
                                <p className="text-white font-medium text-sm">Phụ đề</p>
                                <p className="text-gray-500 text-xs">Tiếng Việt + Tiếng Anh</p>
                            </div>
                        </div>
                         <input type="checkbox" defaultChecked className="toggle-checkbox" />
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-dark-surface border-t border-dark-border">
          <GradientButton 
            fullWidth 
            onClick={nextStep}
            disabled={step === 1 && files.length === 0}
          >
            {step === 3 ? 'Tạo Video Ngay (AI)' : 'Tiếp tục'}
          </GradientButton>
      </div>
    </div>
  );
};

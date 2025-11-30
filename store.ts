
import { create } from 'zustand';
import { AppState, Project, User, Lead } from './types';

interface StoreState {
  currentScreen: AppState;
  previousScreen: AppState | null;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  user: User;
  projects: Project[];
  leads: Lead[];
  currentProject: Project | null;
  language: 'vi' | 'en';
  
  // Actions
  setScreen: (screen: AppState) => void;
  completeOnboarding: () => void;
  login: (phone: string) => void;
  logout: () => void;
  setCurrentProject: (project: Project | null) => void;
  updateCurrentProject: (updates: Partial<Project>) => void;
  addProject: (project: Project) => void;
  setLanguage: (lang: 'vi' | 'en') => void;
  toggleSocialConnection: (platform: 'zalo' | 'facebook' | 'telegram') => void;
  simulateWebhook: (source: 'zalo' | 'facebook' | 'telegram', name: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  currentScreen: AppState.ONBOARDING,
  previousScreen: null,
  hasCompletedOnboarding: false,
  isAuthenticated: false,
  language: 'vi',
  user: {
    id: 'u1',
    name: 'HỮU HƯƠNG',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    role: 'pro', 
    phone: '0909888999',
    socialConnections: {
      zalo: false,
      facebook: false,
      telegram: false
    }
  },
  projects: [
    {
      id: 'p1',
      name: 'The Global City - Villa T1',
      thumbnail: 'https://images.unsplash.com/photo-1613490493576-2f5033197093?auto=format&fit=crop&q=80&w=800',
      status: 'completed',
      duration: 60,
      type: 'villa',
      script: 'Chào mừng quý khách đến với siêu phẩm The Global City. Nơi hội tụ tinh hoa kiến trúc và không gian sống đẳng cấp.',
      lastModified: new Date(),
      scenes: [
        { id: 's1', type: 'image', url: 'https://images.unsplash.com/photo-1613490493576-2f5033197093?auto=format&fit=crop&q=80&w=800', duration: 5, description: 'Exterior' },
        { id: 's2', type: 'image', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800', duration: 5, description: 'Pool' }
      ],
      views: 1250,
      leads: 12,
      voiceConfig: {
        voiceId: 'minh-nhat-pro',
        language: 'vi-VN',
        emotion: 'luxury',
        speed: 1.0
      },
      voiceOverUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
      id: 'p2',
      name: 'Lumiere Riverside 2PN View Sông',
      thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
      status: 'completed',
      duration: 45,
      type: 'apartment',
      script: 'Căn hộ 2 phòng ngủ Lumiere Riverside với tầm view triệu đô ôm trọn thành phố.',
      lastModified: new Date(Date.now() - 86400000),
      scenes: [],
      views: 890,
      leads: 5
    },
    {
      id: 'p3',
      name: 'Penthouse Landmark 81 - Tầng 79',
      thumbnail: 'https://images.unsplash.com/photo-1600596542815-2a4f04d5d217?auto=format&fit=crop&q=80&w=800',
      status: 'processing',
      duration: 90,
      type: 'apartment',
      script: 'Đẳng cấp thượng lưu tại nóc nhà Đông Nam Á...',
      lastModified: new Date(Date.now() - 172800000),
      scenes: [],
      views: 0,
      leads: 0
    }
  ],
  leads: [
    { id: 'l1', name: 'Nguyễn Văn Hùng', phone: '0909***123', interest: 'Global City', status: 'new', date: '10:30 AM', score: 850, source: 'zalo' },
    { id: 'l2', name: 'Trần Thị Mai', phone: '0912***456', interest: 'Lumiere', status: 'contacted', date: 'Yesterday', score: 400, source: 'facebook' },
    { id: 'l3', name: 'Mr. David Lee', phone: '0988***789', interest: 'Penthouse', status: 'new', date: 'Yesterday', score: 950, source: 'telegram' },
    { id: 'l4', name: 'Phạm Thanh Tâm', phone: '0933***555', interest: 'Đất nền Q9', status: 'closed', date: '2 days ago', score: 1000, source: 'web' },
  ],
  
  // Chatbot State
  chatMessages: [],
  isChatOpen: false,

  currentProject: null,

  setScreen: (screen) => set((state) => ({ 
    previousScreen: state.currentScreen,
    currentScreen: screen 
  })),
  completeOnboarding: () => set({ hasCompletedOnboarding: true, currentScreen: AppState.AUTH }),
  login: (phone) => set((state) => ({ 
    isAuthenticated: true, 
    currentScreen: AppState.HOME,
    user: { ...state.user, phone }
  })),
  logout: () => set({ isAuthenticated: false, currentScreen: AppState.AUTH }),
  setCurrentProject: (project) => set({ currentProject: project }),
  updateCurrentProject: (updates) => set((state) => {
    if (!state.currentProject) return {};
    const updated = { ...state.currentProject, ...updates };
    const updatedList = state.projects.map(p => p.id === updated.id ? updated : p);
    return { currentProject: updated, projects: updatedList };
  }),
  addProject: (project) => set((state) => ({ 
    projects: [project, ...state.projects],
    currentProject: project
  })),
  setLanguage: (lang) => set({ language: lang }),
  
  toggleSocialConnection: (platform) => set((state) => {
      // Logic for "Connecting" simulation
      const newState = !state.user.socialConnections?.[platform];
      
      // Simulate Webhook Integration
      if (newState) {
          setTimeout(() => {
             // alert(`Đã kết nối ${platform} thành công!`);
          }, 500);
      }

      return {
        user: {
            ...state.user,
            socialConnections: {
                ...state.user.socialConnections!,
                [platform]: newState
            }
        }
      };
  }),

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  
  addChatMessage: (msg) => set((state) => ({
      chatMessages: [...state.chatMessages, msg]
  })),

  simulateWebhook: (source, name) => set((state) => {
      const newLead: Lead = {
          id: 'l_new_' + Date.now(),
          name: name,
          phone: '0909***' + Math.floor(Math.random()*1000),
          interest: 'Quan tâm dự án mới',
          status: 'new',
          date: 'Vừa xong',
          score: 100,
          source: source,
          activityHistory: [{ type: 'message', content: 'Khách hàng nhắn tin qua ' + source, timestamp: new Date() }],
          tags: [source.toUpperCase(), 'HOT']
      };
      
      return {
          leads: [newLead, ...state.leads]
      };
  })
}));

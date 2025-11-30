
export interface Project {
  id: string;
  name: string;
  thumbnail: string;
  status: 'draft' | 'processing' | 'completed';
  duration: number; // in seconds
  scenes: Scene[];
  script: string;
  type: 'apartment' | 'villa' | 'office' | 'construction';
  lastModified: Date;
  views?: number;
  leads?: number;
  
  // Voice & AR/VR specific
  voiceOverUrl?: string;
  voiceConfig?: VoiceConfig;
}

export interface VoiceConfig {
  voiceId: string;
  language: 'vi-VN' | 'en-US';
  emotion: 'professional' | 'friendly' | 'excited' | 'luxury';
  speed: number;
}

export interface Scene {
  id: string;
  type: 'image' | 'video' | '3d';
  url: string;
  duration: number;
  description: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'free' | 'pro' | 'enterprise';
  phone: string;
  socialConnections?: {
    zalo: boolean;
    facebook: boolean;
    telegram: boolean;
  };
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  isPro: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  interest: string;
  status: 'new' | 'contacted' | 'closed';
  date: string;
  score?: number;
  source?: 'zalo' | 'facebook' | 'telegram' | 'web';
  activityHistory?: { type: string; content: string; timestamp: Date }[];
  tags?: string[];
}

export enum AppState {
  ONBOARDING = 'ONBOARDING',
  AUTH = 'AUTH',
  HOME = 'HOME',
  PROJECTS = 'PROJECTS',
  CREATE = 'CREATE',
  TEMPLATES = 'TEMPLATES',
  CRM = 'CRM',
  PROFILE = 'PROFILE',
  EDITOR = 'EDITOR',
  PROJECT_DETAIL = 'PROJECT_DETAIL',
  AR = 'AR',
  ASSETS = 'ASSETS',
  TEAM = 'TEAM',
  ANALYTICS = 'ANALYTICS',
  VR_SHOWROOM = 'VR_SHOWROOM'
}
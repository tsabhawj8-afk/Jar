
export interface LyricLine {
  text: string;
  translation: string;
}

export interface LyricSection {
  sectionName: string;
  hmongSectionName: string;
  lines: LyricLine[];
}

export interface Scene {
  time: string;
  description: string;
  hmongDescription: string;
  visualCue: string;
  mood: number; // 0 to 100
  imageUrl?: string;
  unsplashQuery?: string;
}

export interface StoryboardData {
  id?: string;
  isFavorite?: boolean;
  createdAt?: number;
  title: string;
  hmongTitle: string;
  artist: string;
  theme: string;
  overallMood: string;
  traditionalDetails?: string;
  lyrics: LyricSection[];
  scenes: Scene[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export interface UserPreferences {
  language: 'hmong' | 'english';
  mood: 'sad' | 'happy' | 'romantic' | 'nostalgic';
  tempo: 'slow' | 'medium' | 'fast';
  vibe: 'traditional' | 'pop' | 'modern';
}


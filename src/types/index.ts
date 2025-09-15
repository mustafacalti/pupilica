export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  age?: number; // sadece öğrenciler için
  teacherId?: string; // öğrencinin hangi öğretmene bağlı olduğu
  createdAt: Date;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  teacherId: string;
  notes?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  studentId: string;
  gameType: 'word-image' | 'number' | 'color';
  score: number;
  duration: number;
  emotions: EmotionResult[];
  createdAt: Date;
}

export interface EmotionResult {
  emotion: 'happy' | 'sad' | 'angry' | 'neutral' | 'focused' | 'confused';
  confidence: number;
  timestamp: Date;
}

export interface AIInsight {
  id: string;
  studentId: string;
  type: 'progress' | 'attention' | 'recommendation' | 'warning';
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  confidence: number;
  gameType: string;
}

export interface PerformanceStats {
  weeklyProgress: number;
  completedActivities: number;
  averageSuccess: number;
  aiRecommendations: number;
}
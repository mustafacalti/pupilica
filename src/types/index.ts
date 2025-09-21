export interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'student';
  age?: number; // sadece öğrenciler için
  parentId?: string; // öğrencinin hangi veliye bağlı olduğu
  createdAt: Date;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  parentId: string;
  notes?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  studentId: string;
  gameType: 'word-image' | 'number' | 'color' | 'attention-sprint';
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
  difficulty?: 'easy' | 'medium' | 'hard';
  adaptedFor?: 'success' | 'struggle' | 'confusion';
}

export interface PlayerPerformance {
  recentScores: number[];
  averageResponseTime: number;
  recentEmotions: EmotionResult[];
  strugglingTopics: string[];
  strengths: string[];
  currentDifficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionGenerationContext {
  performance: PlayerPerformance;
  currentEmotion?: EmotionResult;
  gameType: 'word-image' | 'number' | 'color' | 'attention-sprint';
  previousQuestions: GameQuestion[];
  studentAge: number;
  adaptiveMode: boolean;
}

export interface PerformanceStats {
  weeklyProgress: number;
  completedActivities: number;
  averageSuccess: number;
  aiRecommendations: number;
}

// Dikkat Sprintleri için özel tipler
export interface AttentionSprintTask {
  id: string;
  gorev: string; // Yapılacak görev açıklaması
  sure_saniye: number; // Görev süresi (30-60 saniye)
  ipuclari: string[]; // Yardımcı ipuçları
  hedefRenk?: string; // Hedef renk (varsa)
  hedefSayi?: number; // Hedef sayı (varsa)
  hedefSekil?: string; // Hedef şekil (varsa)
  dikkatDagitici: number; // 0-1 arası dikkat dağıtıcı sayısı
  difficulty: 'kolay' | 'orta' | 'zor';
  hedefTipi: 'renk' | 'sekil' | 'sayi' | 'genel'; // Ana hedef tipi
  // AI'dan gelen emotion-based oyun parametreleri
  gameParams?: {
    spawnInterval: number; // 1500-4000ms
    objectLifespan: number; // 3000-8000ms
    targetRatio: number; // 0.3-0.8
    visualComplexity: number; // 0.2-1.0
    feedbackFrequency: number; // 0.5-3.0
  };
}

export interface AttentionSprintPerformance {
  son3Tur: {
    basari: boolean;
    sure: number;
    zorluk: 'kolay' | 'orta' | 'zor';
    hedefTipi?: 'renk' | 'sekil' | 'sayi' | 'genel';
    hedefSayi?: number; // Sayı görevlerinde hedef değer
    hizliCozum?: boolean; // Çok hızlı çözüldü mü
    zamanlamaSapmasi?: number; // Hedef zamana göre sapma (saniye)
    hedefZaman?: number; // Beklenen ideal süre (saniye)
  }[];
  ortalamaReaksiyonSuresi: number;
  basariOrani: number;
  odaklanmaDurumu: 'yuksek' | 'orta' | 'dusuk';
  zamanlamaPerformansi?: {
    ortalamaSapma: number; // Hedeften ortalama sapma
    sapmaStandartSapma: number; // Tutarlılık ölçüsü
    idealZamanlamaOrani: number; // ±1 saniye içinde çözme oranı
    zamanlamaBasariOrani: number; // Zamanlama hedeflerindeki başarı
  };
  sayiGorevPerformansi?: {
    ortalamaSayiZorlugu: number; // 1-9 arası ortalama
    sayiBasariOrani: number;
    ortalamaReaksiyonSuresiSayi: number;
    hizliCozumSayisi: number; // Çok hızlı çözülen görev sayısı
    hedefYakalamaOrani: number; // Hedef objeleri yakalama oranı
    toplamHedefSayisi: number; // Toplam hedef sayısı
    yakalinanHedefSayisi: number; // Yakalanan hedef sayısı
    odaklanmaSayisi: number; // Odaklanma sayısı
    yanlisTiklamaSayisi: number; // Yanlış tıklama sayısı
    // KÜMÜLATIF PERFORMANS (TÜM TURLAR)
    hizliTiklamaOrani: number; // Hızlı tıklama oranı (ortalama)
    hizliTiklamaSayisi: number; // Hızlı tıklama sayısı (toplam)
    toplamTiklamaSayisi: number; // Toplam tıklama sayısı (toplam)
    hizliVeDogruTiklamalar: number; // Hem hızlı hem doğru tıklamalar (toplam)
    hizliTiklamaDogrulukOrani: number; // Hızlı tıklamalardaki doğruluk oranı (ortalama)
    // SON ROUND PERFORMANSI (SADECE O TUR)
    sonRoundHizliTiklamaOrani: number; // Son round hızlı tıklama oranı
    sonRoundHizliTiklamaSayisi: number; // Son round hızlı tıklama sayısı
    sonRoundToplamTiklamaSayisi: number; // Son round toplam tıklama sayısı
    sonRoundHizliVeDogruTiklamalar: number; // Son round hızlı+doğru tıklamalar
    sonRoundHizliTiklamaDogrulukOrani: number; // Son round hızlı tıklama doğruluğu
  };
  // AI için attention metrics
  attentionMetrics?: {
    totalGameTime: number;
    screenLookingTime: number;
    screenLookingPercentage: number;
    emotionStats: Array<{
      emotion: string;
      totalTime: number;
      lookingTime: number;
      percentage: number;
      lookingPercentage: number;
    }>;
    dominantEmotion: string;
    attentionScore: number;
    distractionEvents: number;
  };
}
import { Student, Activity, AIInsight, EmotionResult } from '../types';

// Mock öğrenci verileri
export const mockStudents: Student[] = [
  // Mustafa deneme'nin çocukları
  {
    id: 'mustafa-child-1',
    name: 'Ahmet Deneme',
    age: 8,
    parentId: 'XYrGBIVm5mXsL8TbDxO9i3pXlWy1', // mustafa deneme'nin user ID'si
    notes: 'Sayı oyunlarında çok başarılı, dikkat süresi gün geçtikçe artıyor.',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'mustafa-child-2',
    name: 'Ayşe Deneme',
    age: 6,
    parentId: 'XYrGBIVm5mXsL8TbDxO9i3pXlWy1', // mustafa deneme'nin user ID'si
    notes: 'Renk eşleştirme oyunlarında yetenekli, hikaye dinlemeyi seviyor.',
    createdAt: new Date('2024-02-10')
  },
  // Diğer test verileri
  {
    id: '1',
    name: 'Elif Yılmaz',
    age: 8,
    parentId: 'parent1',
    notes: 'Matematik konularında çok başarılı, hikaye okumayı seviyor.',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Mehmet Kaya',
    age: 7,
    parentId: 'parent1',
    notes: 'Renklerle ilgili oyunlarda yetenekli, dikkat süresi artıyor.',
    createdAt: new Date('2024-02-10')
  },
  {
    id: '3',
    name: 'Zeynep Demir',
    age: 9,
    parentId: 'parent2',
    notes: 'Sosyal beceriler gelişiyor, grup oyunlarına katılım artıyor.',
    createdAt: new Date('2024-01-20')
  }
];

// Mock aktivite verileri
export const mockActivities: Activity[] = [
  // Mustafa deneme'nin çocukları için aktiviteler
  {
    id: 'mustafa-act1',
    studentId: 'mustafa-child-1', // Ahmet Deneme
    gameType: 'count',
    score: 88,
    duration: 420,
    emotions: [
      {
        emotion: 'focused',
        confidence: 0.91,
        timestamp: new Date('2024-03-15T10:30:00')
      },
      {
        emotion: 'happy',
        confidence: 0.85,
        timestamp: new Date('2024-03-15T10:35:00')
      }
    ],
    createdAt: new Date('2024-03-15')
  },
  {
    id: 'mustafa-act2',
    studentId: 'mustafa-child-1', // Ahmet Deneme
    gameType: 'dynamic',
    score: 92,
    duration: 380,
    emotions: [
      {
        emotion: 'focused',
        confidence: 0.96,
        timestamp: new Date('2024-03-14T14:20:00')
      }
    ],
    createdAt: new Date('2024-03-14')
  },
  {
    id: 'mustafa-act3',
    studentId: 'mustafa-child-2', // Ayşe Deneme
    gameType: 'conflict',
    score: 76,
    duration: 450,
    emotions: [
      {
        emotion: 'happy',
        confidence: 0.89,
        timestamp: new Date('2024-03-13T09:15:00')
      },
      {
        emotion: 'focused',
        confidence: 0.84,
        timestamp: new Date('2024-03-13T09:20:00')
      }
    ],
    createdAt: new Date('2024-03-13')
  },
  {
    id: 'mustafa-act4',
    studentId: 'mustafa-child-2', // Ayşe Deneme
    gameType: 'click',
    score: 82,
    duration: 390,
    emotions: [
      {
        emotion: 'happy',
        confidence: 0.93,
        timestamp: new Date('2024-03-12T11:00:00')
      }
    ],
    createdAt: new Date('2024-03-12')
  },
  {
    id: 'act1',
    studentId: '1',
    gameType: 'click',
    score: 85,
    duration: 450,
    emotions: [
      {
        emotion: 'happy',
        confidence: 0.92,
        timestamp: new Date('2024-03-15T10:30:00')
      },
      {
        emotion: 'focused',
        confidence: 0.88,
        timestamp: new Date('2024-03-15T10:35:00')
      }
    ],
    createdAt: new Date('2024-03-15')
  },
  {
    id: 'act2',
    studentId: '1',
    gameType: 'count',
    score: 92,
    duration: 380,
    emotions: [
      {
        emotion: 'focused',
        confidence: 0.95,
        timestamp: new Date('2024-03-14T14:20:00')
      },
      {
        emotion: 'happy',
        confidence: 0.87,
        timestamp: new Date('2024-03-14T14:25:00')
      }
    ],
    createdAt: new Date('2024-03-14')
  },
  {
    id: 'act3',
    studentId: '2',
    gameType: 'conflict',
    score: 78,
    duration: 520,
    emotions: [
      {
        emotion: 'confused',
        confidence: 0.75,
        timestamp: new Date('2024-03-13T09:15:00')
      },
      {
        emotion: 'neutral',
        confidence: 0.82,
        timestamp: new Date('2024-03-13T09:20:00')
      }
    ],
    createdAt: new Date('2024-03-13')
  },
  {
    id: 'act4',
    studentId: '2',
    gameType: 'dynamic',
    score: 88,
    duration: 420,
    emotions: [
      {
        emotion: 'focused',
        confidence: 0.91,
        timestamp: new Date('2024-03-12T11:00:00')
      }
    ],
    createdAt: new Date('2024-03-12')
  },
  {
    id: 'act5',
    studentId: '3',
    gameType: 'click',
    score: 94,
    duration: 350,
    emotions: [
      {
        emotion: 'happy',
        confidence: 0.96,
        timestamp: new Date('2024-03-11T15:30:00')
      },
      {
        emotion: 'focused',
        confidence: 0.89,
        timestamp: new Date('2024-03-11T15:35:00')
      }
    ],
    createdAt: new Date('2024-03-11')
  }
];

// Mock AI öngörüleri
export const mockAIInsights: AIInsight[] = [
  // Mustafa deneme'nin çocukları için AI öngörüleri
  {
    id: 'mustafa-insight1',
    studentId: 'mustafa-child-1', // Ahmet Deneme
    type: 'progress',
    message: 'Ahmet\'in sayı oyunlarındaki performansı son 2 haftada %18 arttı. Matematiksel düşünme becerileri gelişiyor.',
    priority: 'medium',
    createdAt: new Date('2024-03-15')
  },
  {
    id: 'mustafa-insight2',
    studentId: 'mustafa-child-1', // Ahmet Deneme
    type: 'recommendation',
    message: 'Ahmet dikkat sprint oyunlarında mükemmel performans gösteriyor. Daha zorlu dikkat görevleri eklenebilir.',
    priority: 'low',
    createdAt: new Date('2024-03-14')
  },
  {
    id: 'mustafa-insight3',
    studentId: 'mustafa-child-2', // Ayşe Deneme
    type: 'attention',
    message: 'Ayşe\'nin renk algısı çok gelişmiş. Kelime-resim eşleştirmede de başarılı sonuçlar alıyor.',
    priority: 'medium',
    createdAt: new Date('2024-03-13')
  },
  {
    id: 'mustafa-insight4',
    studentId: 'mustafa-child-2', // Ayşe Deneme
    type: 'progress',
    message: 'Oyun süresince pozitif duygular hakim. Öğrenme motivasyonu yüksek seviyede.',
    priority: 'low',
    createdAt: new Date('2024-03-12')
  },
  {
    id: 'insight1',
    studentId: '1',
    type: 'progress',
    message: 'Elif\'in matematik oyunlarındaki performansı son 2 haftada %15 arttı. Sayı tanıma becerilerinde belirgin gelişme gözleniyor.',
    priority: 'medium',
    createdAt: new Date('2024-03-15')
  },
  {
    id: 'insight2',
    studentId: '1',
    type: 'recommendation',
    message: 'Elif hikaye temelli oyunlarda çok başarılı. Daha karmaşık hikaye senaryoları ile zorlanabilir.',
    priority: 'low',
    createdAt: new Date('2024-03-14')
  },
  {
    id: 'insight3',
    studentId: '2',
    type: 'attention',
    message: 'Mehmet\'in dikkat süresi artıyor ancak renk karışımlarında hala zorlanıyor. Daha basit renk oyunları önerilir.',
    priority: 'high',
    createdAt: new Date('2024-03-13')
  },
  {
    id: 'insight4',
    studentId: '2',
    type: 'progress',
    message: 'Dikkat sprint oyunlarında %20 iyileşme kaydedildi. Motor beceriler gelişiyor.',
    priority: 'medium',
    createdAt: new Date('2024-03-12')
  },
  {
    id: 'insight5',
    studentId: '3',
    type: 'recommendation',
    message: 'Zeynep\'in sosyal beceri gelişimi için grup oyunları artırılabilir. Mükemmel kelime-resim eşleştirme performansı.',
    priority: 'low',
    createdAt: new Date('2024-03-11')
  },
  {
    id: 'insight6',
    studentId: '3',
    type: 'warning',
    message: 'Son oyunlarda hafif stres belirtileri gözlendi. Oyun zorluğu azaltılabilir.',
    priority: 'high',
    createdAt: new Date('2024-03-10')
  }
];

// Oyun istatistikleri hesaplama fonksiyonları
export const calculateGameStats = (studentId: string) => {
  const studentActivities = mockActivities.filter(act => act.studentId === studentId);

  if (studentActivities.length === 0) {
    return {
      totalGames: 0,
      averageScore: 0,
      totalPlayTime: 0,
      favoriteGame: 'Henüz oyun oynamamış',
      lastActivity: null
    };
  }

  const totalGames = studentActivities.length;
  const averageScore = Math.round(
    studentActivities.reduce((sum, act) => sum + act.score, 0) / totalGames
  );
  const totalPlayTime = Math.round(
    studentActivities.reduce((sum, act) => sum + act.duration, 0) / 60
  ); // dakika cinsinden

  // En çok oynanan oyun tipini bul
  const gameTypes = studentActivities.reduce((acc, act) => {
    acc[act.gameType] = (acc[act.gameType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const favoriteGame = Object.entries(gameTypes).reduce((a, b) =>
    gameTypes[a[0]] > gameTypes[b[0]] ? a : b
  )[0];

  const gameTypeNames: Record<string, string> = {
    'count': 'Dikkat Sayma',
    'conflict': 'Çatışma Oyunu',
    'dynamic': 'Dinamik Dikkat',
    'colorRecognition': 'AI Renk Tanıma'
  };

  const lastActivity = studentActivities.sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  )[0];

  return {
    totalGames,
    averageScore,
    totalPlayTime,
    favoriteGame: gameTypeNames[favoriteGame] || favoriteGame,
    lastActivity
  };
};

// Emotion analizi
export const getEmotionAnalysis = (studentId: string) => {
  const studentActivities = mockActivities.filter(act => act.studentId === studentId);
  const allEmotions = studentActivities.flatMap(act => act.emotions);

  if (allEmotions.length === 0) {
    return {
      dominantEmotion: 'neutral',
      emotionDistribution: {},
      averageConfidence: 0
    };
  }

  // Duygu dağılımı
  const emotionCounts = allEmotions.reduce((acc, emotion) => {
    acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) =>
    emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
  )[0];

  // Yüzdelik dağılım
  const total = allEmotions.length;
  const emotionDistribution = Object.entries(emotionCounts).reduce((acc, [emotion, count]) => {
    acc[emotion] = Math.round((count / total) * 100);
    return acc;
  }, {} as Record<string, number>);

  const averageConfidence = allEmotions.reduce((sum, emotion) => sum + emotion.confidence, 0) / allEmotions.length;

  return {
    dominantEmotion,
    emotionDistribution,
    averageConfidence: Math.round(averageConfidence * 100)
  };
};

// Haftalık ilerleme verisi
export const getWeeklyProgress = (studentId: string) => {
  const activities = mockActivities
    .filter(act => act.studentId === studentId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
      score: 0,
      games: 0
    };
  });

  // Mock veri için rastgele skorlar oluştur
  last7Days.forEach(day => {
    day.score = Math.floor(Math.random() * 40) + 60; // 60-100 arası
    day.games = Math.floor(Math.random() * 4) + 1; // 1-4 arası
  });

  return last7Days;
};

// Duygu etiketleri
export const emotionLabels: Record<string, string> = {
  'happy': '😊 Mutlu',
  'sad': '😢 Üzgün',
  'angry': '😠 Kızgın',
  'neutral': '😐 Nötr',
  'focused': '🎯 Odaklanmış',
  'confused': '😕 Şaşkın'
};

// Oyun tipi etiketleri
export const gameTypeLabels: Record<string, string> = {
  'count': 'Dikkat Sayma',
  'conflict': 'Çatışma Oyunu',
  'dynamic': 'Dinamik Dikkat',
  'colorRecognition': 'AI Renk Tanıma'
};

// AI öngörü tipi etiketleri
export const insightTypeLabels: Record<string, string> = {
  'progress': 'İlerleme',
  'attention': 'Dikkat',
  'recommendation': 'Öneri',
  'warning': 'Uyarı'
};

// AI öngörü öncelik renkleri
export const insightPriorityColors: Record<string, string> = {
  'low': 'bg-green-100 text-green-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-red-100 text-red-800'
};
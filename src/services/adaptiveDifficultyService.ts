import { AttentionMetrics } from './emotionAnalysisService';

export interface DifficultyAdjustment {
  newDifficulty: 'kolay' | 'orta' | 'zor';
  speedMultiplier: number; // Hız çarpanı (0.5-2.0)
  objectCount: number; // Ekrandaki obje sayısı
  reason: string; // Ayarlama sebebi
  suggestions: string[]; // Oyuncuya öneriler
}

export interface GamePerformanceData {
  correctClicks: number;
  wrongClicks: number;
  totalSpawned: number;
  accuracy: number;
  avgReactionTime: number;
  attentionMetrics: AttentionMetrics;
}

class AdaptiveDifficultyService {
  private performanceHistory: GamePerformanceData[] = [];
  private baseSettings = {
    kolay: { speed: 0.8, objectCount: 3, duration: 20 },
    orta: { speed: 1.0, objectCount: 4, duration: 30 },
    zor: { speed: 1.5, objectCount: 6, duration: 40 }
  };

  /**
   * Duygu analizi ve performans verilerine göre zorluk ayarla
   */
  calculateDifficultyAdjustment(
    currentDifficulty: 'kolay' | 'orta' | 'zor',
    performanceData: GamePerformanceData
  ): DifficultyAdjustment {
    console.log('🎯 [ADAPTIVE] Zorluk analizi başlıyor...', {
      currentDifficulty,
      accuracy: performanceData.accuracy,
      attentionScore: performanceData.attentionMetrics.attentionScore
    });

    const emotionAnalysis = this.analyzeEmotionState(performanceData.attentionMetrics);
    const performanceAnalysis = this.analyzeGamePerformance(performanceData);
    const attentionAnalysis = this.analyzeAttentionLevel(performanceData.attentionMetrics);

    // Faktörlere göre zorluk hesapla
    const adjustment = this.calculateAdjustment(
      currentDifficulty,
      emotionAnalysis,
      performanceAnalysis,
      attentionAnalysis
    );

    // Performance history'e ekle
    this.performanceHistory.push(performanceData);
    if (this.performanceHistory.length > 5) {
      this.performanceHistory.shift(); // Son 5 oyunu tut
    }

    console.log('✅ [ADAPTIVE] Zorluk ayarlaması tamamlandı:', {
      newDifficulty: adjustment.newDifficulty,
      reason: adjustment.reason,
      speedMultiplier: adjustment.speedMultiplier
    });

    return adjustment;
  }

  /**
   * Duygu durumu analizi
   */
  private analyzeEmotionState(metrics: AttentionMetrics): {
    score: number;
    type: 'positive' | 'neutral' | 'negative';
    recommendation: 'increase' | 'maintain' | 'decrease';
  } {
    const { dominantEmotion, attentionScore } = metrics;

    let emotionScore = 0;
    let type: 'positive' | 'neutral' | 'negative' = 'neutral';

    // Emotion scoring
    const emotionValues: Record<string, number> = {
      'happy': 10,
      'surprised': 8,
      'neutral': 6,
      'confused': 4,
      'bored': 2,
      'sad': 1,
      'angry': 0
    };

    emotionScore = emotionValues[dominantEmotion] || 5;

    if (emotionScore >= 8) type = 'positive';
    else if (emotionScore >= 4) type = 'neutral';
    else type = 'negative';

    // Recommendation logic
    let recommendation: 'increase' | 'maintain' | 'decrease' = 'maintain';

    if (type === 'positive' && attentionScore > 70) {
      recommendation = 'increase'; // Mutlu ve dikkatli -> zorlaştır
    } else if (type === 'negative' || attentionScore < 30) {
      recommendation = 'decrease'; // Negatif emotion veya düşük dikkat -> kolaylaştır
    } else if (dominantEmotion === 'bored' && attentionScore > 50) {
      recommendation = 'increase'; // Sıkılmış ama dikkatli -> zorlaştır
    }

    return { score: emotionScore, type, recommendation };
  }

  /**
   * Oyun performansı analizi
   */
  private analyzeGamePerformance(data: GamePerformanceData): {
    level: 'excellent' | 'good' | 'average' | 'poor';
    recommendation: 'increase' | 'maintain' | 'decrease';
  } {
    const { accuracy, avgReactionTime } = data;

    let level: 'excellent' | 'good' | 'average' | 'poor' = 'average';
    let recommendation: 'increase' | 'maintain' | 'decrease' = 'maintain';

    // Performance evaluation
    if (accuracy > 0.8 && avgReactionTime < 1.5) {
      level = 'excellent';
      recommendation = 'increase';
    } else if (accuracy > 0.6 && avgReactionTime < 2.0) {
      level = 'good';
      recommendation = 'maintain';
    } else if (accuracy > 0.4 || avgReactionTime < 3.0) {
      level = 'average';
      recommendation = 'maintain';
    } else {
      level = 'poor';
      recommendation = 'decrease';
    }

    return { level, recommendation };
  }

  /**
   * Dikkat seviyesi analizi
   */
  private analyzeAttentionLevel(metrics: AttentionMetrics): {
    level: 'high' | 'medium' | 'low';
    recommendation: 'increase' | 'maintain' | 'decrease';
  } {
    const { screenLookingPercentage, distractionEvents, attentionScore } = metrics;

    let level: 'high' | 'medium' | 'low' = 'medium';
    let recommendation: 'increase' | 'maintain' | 'decrease' = 'maintain';

    if (screenLookingPercentage > 80 && distractionEvents < 3 && attentionScore > 70) {
      level = 'high';
      recommendation = 'increase';
    } else if (screenLookingPercentage > 60 && distractionEvents < 5 && attentionScore > 50) {
      level = 'medium';
      recommendation = 'maintain';
    } else {
      level = 'low';
      recommendation = 'decrease';
    }

    return { level, recommendation };
  }

  /**
   * Final zorluk ayarlaması hesapla
   */
  private calculateAdjustment(
    currentDifficulty: 'kolay' | 'orta' | 'zor',
    emotionAnalysis: any,
    performanceAnalysis: any,
    attentionAnalysis: any
  ): DifficultyAdjustment {
    // Recommendation counts
    const recommendations = [
      emotionAnalysis.recommendation,
      performanceAnalysis.recommendation,
      attentionAnalysis.recommendation
    ];

    const increaseCount = recommendations.filter(r => r === 'increase').length;
    const decreaseCount = recommendations.filter(r => r === 'decrease').length;

    // Final decision
    let newDifficulty = currentDifficulty;
    let reason = '';
    let suggestions: string[] = [];

    if (increaseCount >= 2) {
      // Zorlaştır
      if (currentDifficulty === 'kolay') newDifficulty = 'orta';
      else if (currentDifficulty === 'orta') newDifficulty = 'zor';

      reason = 'Performansın mükemmel! Daha zorlu görevler deniyoruz 🎯';
      suggestions = [
        'Harika gidiyorsun! 🌟',
        'Dikkatini toplamayı başarıyorsun',
        'Daha hızlı objeler gelecek'
      ];
    } else if (decreaseCount >= 2) {
      // Kolaylaştır
      if (currentDifficulty === 'zor') newDifficulty = 'orta';
      else if (currentDifficulty === 'orta') newDifficulty = 'kolay';

      reason = 'Odaklanma konusunda zorluk yaşıyorsun. Daha kolay görevlerle devam edelim 💪';
      suggestions = [
        'Merak etme, adım adım öğreniyoruz',
        'Nefes al ve odaklanmaya çalış',
        'Objeler daha yavaş gelecek'
      ];
    } else {
      reason = 'Performansın dengeli, mevcut zorlukta devam ediyoruz 👍';
      suggestions = [
        'İyi gidiyorsun!',
        'Bu tempoda devam et',
        'Dikkatini korumaya çalış'
      ];
    }

    // Speed ve object count ayarlamaları
    const baseSettings = this.baseSettings[newDifficulty];
    let speedMultiplier = baseSettings.speed;
    let objectCount = baseSettings.objectCount;

    // Emotion-based fine tuning
    if (emotionAnalysis.type === 'negative') {
      speedMultiplier *= 0.8; // %20 yavaşlat
      objectCount = Math.max(2, objectCount - 1); // Obje sayısını azalt
    } else if (emotionAnalysis.type === 'positive' && attentionAnalysis.level === 'high') {
      speedMultiplier *= 1.2; // %20 hızlandır
      objectCount = Math.min(8, objectCount + 1); // Obje sayısını artır
    }

    // Attention-based fine tuning
    if (attentionAnalysis.level === 'low') {
      speedMultiplier *= 0.7; // Çok yavaşlat
      objectCount = Math.max(2, objectCount - 1);
    }

    return {
      newDifficulty,
      speedMultiplier: Number(speedMultiplier.toFixed(1)),
      objectCount,
      reason,
      suggestions
    };
  }

  /**
   * Prompt için emotion ve attention verilerini formatla
   */
  formatForPrompt(
    performanceData: GamePerformanceData,
    difficultyAdjustment: DifficultyAdjustment
  ): string {
    const metrics = performanceData.attentionMetrics;

    return `
DUYGU VE DİKKAT ANALİZİ:
- Baskın Duygu: ${metrics.dominantEmotion} (${metrics.emotionStats[0]?.percentage.toFixed(1) || '0'}% süre)
- Ekrana Bakma: %${metrics.screenLookingPercentage.toFixed(1)} (${metrics.screenLookingTime.toFixed(1)}s)
- Dikkat Skoru: ${metrics.attentionScore}/100
- Dikkat Dağılması: ${metrics.distractionEvents} kez ekrandan baktı
- Oyun Performansı: %${(performanceData.accuracy * 100).toFixed(1)} doğruluk, ${performanceData.avgReactionTime.toFixed(1)}s ortalama tepki

ZORLUK AYARLAMA:
- Mevcut Zorluk → Yeni Zorluk: ${difficultyAdjustment.newDifficulty}
- Hız Çarpanı: ${difficultyAdjustment.speedMultiplier}x
- Sebep: ${difficultyAdjustment.reason}

ADHD İÇİN ÖPTİMİZASYON GEREKSİNİMLERİ:
${this.getADHDOptimizations(metrics, performanceData)}`;
  }

  /**
   * ADHD için optimizasyon önerileri
   */
  private getADHDOptimizations(metrics: AttentionMetrics, performance: GamePerformanceData): string {
    const optimizations: string[] = [];

    if (metrics.screenLookingPercentage < 60) {
      optimizations.push('- DİKKAT: Çok dikkat dağınıklığı var, daha büyük ve renkli objeler kullan');
      optimizations.push('- Görevde daha açık talimatlar ve görsel ipuçları ekle');
    }

    if (metrics.dominantEmotion === 'bored') {
      optimizations.push('- SIKINTI: Oyuncu sıkılmış, daha eğlenceli ve değişken görevler sun');
      optimizations.push('- Motivasyon artırıcı pozitif geri bildirimler kullan');
    }

    if (metrics.dominantEmotion === 'confused') {
      optimizations.push('- KARIŞIKLIK: Görevler karmaşık gelmiş, daha basit ve net talimatlar ver');
      optimizations.push('- Adım adım açıklamalar ve örnek göster');
    }

    if (performance.accuracy < 0.5) {
      optimizations.push('- PERFORMANS: Başarı oranı düşük, daha kolay hedefler ve daha uzun süre ver');
      optimizations.push('- Pozitif teşvik ve cesaretlendirme mesajları ekle');
    }

    if (metrics.distractionEvents > 5) {
      optimizations.push('- DİKKAT DAĞINIKLIGI: Çok sık ekrandan bakıyor, daha ilgi çekici görevler tasarla');
      optimizations.push('- Kısa süreli görevler ve sık ara verme imkanı sun');
    }

    return optimizations.length > 0 ? optimizations.join('\n') : '- Mevcut ayarlar ADHD için uygun görünüyor';
  }

  /**
   * Real-time feedback için hızlı analiz
   */
  getRealtimeFeedback(metrics: AttentionMetrics): {
    message: string;
    type: 'success' | 'warning' | 'info';
    suggestion: string;
  } {
    if (metrics.screenLookingPercentage < 40) {
      return {
        message: 'Ekrana odaklanmaya çalış! 👀',
        type: 'warning',
        suggestion: 'Gözlerini ekrandaki renklere odakla'
      };
    }

    if (metrics.dominantEmotion === 'bored') {
      return {
        message: 'Sıkılıyor gibisin, devam et! 🎯',
        type: 'info',
        suggestion: 'Bu görev bittikten sonra daha eğlenceli bir görev gelecek'
      };
    }

    if (metrics.attentionScore > 70) {
      return {
        message: 'Harika odaklanıyorsun! 🌟',
        type: 'success',
        suggestion: 'Bu tempoda devam et'
      };
    }

    return {
      message: 'İyi gidiyorsun! 👍',
      type: 'info',
      suggestion: 'Dikkatini korumaya devam et'
    };
  }
}

export const adaptiveDifficultyService = new AdaptiveDifficultyService();
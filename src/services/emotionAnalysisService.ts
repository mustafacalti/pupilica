export interface EmotionAnalysisResult {
  emotion: 'happy' | 'sad' | 'bored' | 'confused' | 'surprised' | 'angry' | 'neutral';
  confidence: number;
  timestamp: Date;
  gazeStatus: 'looking' | 'not-looking' | 'no-face';
  gazeX?: number;
  lookingAtScreen: boolean;
}

export interface EmotionStats {
  emotion: string;
  totalTime: number;
  lookingTime: number;
  percentage: number;
  lookingPercentage: number;
}

export interface AttentionMetrics {
  totalGameTime: number;
  screenLookingTime: number;
  screenLookingPercentage: number;
  emotionStats: EmotionStats[];
  dominantEmotion: string;
  attentionScore: number; // 0-100
  distractionEvents: number; // Ekrandan bakma sayısı
}

class EmotionAnalysisService {
  private emotions: EmotionAnalysisResult[] = []; // Tüm emotion geçmişi
  private gameStartTime: number = 0;
  private lastAnalysisTime: number = 0;
  private currentGameSession: EmotionAnalysisResult[] = []; // Tüm oyun boyunca (tüm roundlar)
  private currentRoundSession: EmotionAnalysisResult[] = []; // Sadece o anki round için
  private isGameActive: boolean = false; // Oyun durumu kontrolü
  private roundStartTime: number = 0; // Round başlangıç zamanı

  /**
   * Oyun başladığında emotion tracking'i başlat (tüm oyun için)
   */
  startGameSession(): void {
    this.gameStartTime = Date.now();
    this.currentGameSession = []; // Tüm oyun için sıfırla
    this.lastAnalysisTime = this.gameStartTime;
    this.isGameActive = true; // Oyun aktif duruma getir
    console.log('🎮 [EMOTION] Oyun seansı başladı, emotion tracking aktif');
  }

  /**
   * Round başladığında round-specific emotion tracking başlat
   */
  startRoundSession(): void {
    this.roundStartTime = Date.now();
    this.currentRoundSession = []; // Round başında sıfırla
    console.log('🔄 [EMOTION] Round seansı başladı, round emotion tracking aktif');
  }

  /**
   * Emotion result ekle (kameradan gelen analiz sonucu)
   * Sadece oyun aktifken emotion kabul eder
   */
  addEmotionResult(result: EmotionAnalysisResult): void {
    // Sadece oyun aktifken emotion kabul et
    if (!this.isGameActive) {
      console.log('⏸️ [EMOTION] Oyun aktif değil, emotion kaydedilmiyor');
      return;
    }

    this.emotions.push(result); // Genel emotion geçmişi
    this.currentGameSession.push(result); // Tüm oyun için (tüm roundlar)
    this.currentRoundSession.push(result); // Sadece o anki round için

    // DEBUG: lookingAtScreen değerini kontrol et
    console.log('📥 [EMOTION ADDED]', {
      emotion: result.emotion,
      confidence: (result.confidence * 100).toFixed(1) + '%',
      gazeStatus: result.gazeStatus,
      lookingAtScreen: result.lookingAtScreen,
      gameActive: this.isGameActive,
      gameTotal: this.currentGameSession.length,
      roundTotal: this.currentRoundSession.length,
      timestamp: new Date(result.timestamp).toLocaleTimeString()
    });

    // Console spam'i azalt - emotion değişikliklerinde log
    const lastResult = this.currentRoundSession[this.currentRoundSession.length - 2];
    if (!lastResult || lastResult.emotion !== result.emotion) {
      console.log(`😊 [EMOTION] ${result.emotion} (${(result.confidence * 100).toFixed(1)}%) - ${result.gazeStatus} [Round: ${this.currentRoundSession.length}]`);
    }
  }

  /**
   * Mevcut oyun seansı için emotion metrics hesapla
   */
  getCurrentGameMetrics(): AttentionMetrics {
    if (this.currentGameSession.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalGameTime = (Date.now() - this.gameStartTime) / 1000; // saniye
    const emotionGroups = this.groupEmotionsByType(this.currentGameSession);

    // Screen looking time hesapla
    const lookingResults = this.currentGameSession.filter(r => r.lookingAtScreen);
    // Her emotion entry 5 saniye boyunca geçerli (kamera 5 saniyede bir analiz ediyor)
    const avgEmotionDuration = totalGameTime / this.currentGameSession.length;
    const screenLookingTime = lookingResults.length * avgEmotionDuration;
    const screenLookingPercentage = (screenLookingTime / totalGameTime) * 100;

    // DEBUG: Screen looking hesaplamasını kontrol et
    console.log('👁️ [SCREEN LOOKING DEBUG]', {
      totalEmotions: this.currentGameSession.length,
      lookingEmotions: lookingResults.length,
      totalGameTime: totalGameTime.toFixed(1) + 's',
      avgEmotionDuration: avgEmotionDuration.toFixed(1) + 's',
      screenLookingTime: screenLookingTime.toFixed(1) + 's',
      screenLookingPercentage: screenLookingPercentage.toFixed(1) + '%',
      calculationCheck: `${lookingResults.length}/${this.currentGameSession.length} = ${(lookingResults.length/this.currentGameSession.length*100).toFixed(1)}%`,
      sampleEmotions: this.currentGameSession.slice(-3).map(e => ({
        emotion: e.emotion,
        lookingAtScreen: e.lookingAtScreen,
        timestamp: new Date(e.timestamp).toLocaleTimeString()
      }))
    });

    // Dominant emotion bul
    const dominantEmotion = this.getDominantEmotion(emotionGroups);

    // Attention score hesapla (0-100)
    const attentionScore = this.calculateAttentionScore(
      screenLookingPercentage,
      dominantEmotion,
      this.countDistractionEvents()
    );

    const metrics: AttentionMetrics = {
      totalGameTime,
      screenLookingTime,
      screenLookingPercentage,
      emotionStats: this.formatEmotionStats(emotionGroups, totalGameTime),
      dominantEmotion,
      attentionScore,
      distractionEvents: this.countDistractionEvents()
    };

    // Console spam'i azalt
    // console.log('📊 [EMOTION METRICS]', {
    //   screenLooking: `${screenLookingPercentage.toFixed(1)}%`,
    //   dominantEmotion,
    //   attentionScore,
    //   distractionEvents: metrics.distractionEvents
    // });

    return metrics;
  }

  /**
   * Oyun seansını bitir ve final metrics döndür
   */
  endGameSession(): AttentionMetrics {
    const finalMetrics = this.getCurrentGameMetrics();
    this.isGameActive = false; // Oyunu pasif duruma getir

    console.log('🏁 [EMOTION] Oyun seansı bitti', {
      totalTime: `${finalMetrics.totalGameTime.toFixed(1)}s`,
      attentionScore: finalMetrics.attentionScore,
      dominantEmotion: finalMetrics.dominantEmotion,
      totalEmotions: this.currentGameSession.length
    });

    // Oyun bittiğinde currentGameSession'ı sıfırlama - bir sonraki oyun başında sıfırlanacak
    // this.currentGameSession = []; // Bunu kaldırıyoruz, startGameSession'da sıfırlanacak

    return finalMetrics;
  }

  /**
   * Emotion sonuçlarını tip bazında grupla
   */
  private groupEmotionsByType(emotions: EmotionAnalysisResult[]): Record<string, EmotionAnalysisResult[]> {
    return emotions.reduce((groups, emotion) => {
      if (!groups[emotion.emotion]) {
        groups[emotion.emotion] = [];
      }
      groups[emotion.emotion].push(emotion);
      return groups;
    }, {} as Record<string, EmotionAnalysisResult[]>);
  }

  /**
   * En baskın emotion'ı bul
   */
  private getDominantEmotion(emotionGroups: Record<string, EmotionAnalysisResult[]>): string {
    let maxCount = 0;
    let dominantEmotion = 'neutral';

    for (const [emotion, results] of Object.entries(emotionGroups)) {
      if (results.length > maxCount) {
        maxCount = results.length;
        dominantEmotion = emotion;
      }
    }

    return dominantEmotion;
  }

  /**
   * Attention score hesapla (0-100)
   */
  private calculateAttentionScore(
    screenLookingPercentage: number,
    dominantEmotion: string,
    distractionEvents: number
  ): number {
    let score = 0;

    // Screen looking score (50 puan max)
    score += Math.min(screenLookingPercentage * 0.5, 50);

    // Emotion score (30 puan max)
    const emotionScores: Record<string, number> = {
      'happy': 30,
      'neutral': 25,
      'surprised': 20,
      'confused': 15,
      'bored': 10,
      'sad': 5,
      'angry': 0
    };
    score += emotionScores[dominantEmotion] || 15;

    // Distraction penalty (20 puan max düşüş)
    const distractionPenalty = Math.min(distractionEvents * 2, 20);
    score -= distractionPenalty;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Dikkat dağınıklığı olaylarını say
   */
  private countDistractionEvents(): number {
    let events = 0;
    let wasLooking = true;

    for (const result of this.currentGameSession) {
      if (wasLooking && !result.lookingAtScreen) {
        events++;
      }
      wasLooking = result.lookingAtScreen;
    }

    return events;
  }

  /**
   * Emotion stats formatla
   */
  private formatEmotionStats(
    emotionGroups: Record<string, EmotionAnalysisResult[]>,
    totalTime: number
  ): EmotionStats[] {
    const totalEmotions = Object.values(emotionGroups).reduce((sum, arr) => sum + arr.length, 0);

    return Object.entries(emotionGroups).map(([emotion, results]) => {
      // Her emotion count'ını yüzdeye çevir
      const percentage = (results.length / totalEmotions) * 100;
      const lookingResults = results.filter(r => r.lookingAtScreen);
      const lookingPercentage = results.length > 0 ? (lookingResults.length / results.length) * 100 : 0;

      return {
        emotion,
        totalTime: results.length, // Count olarak
        lookingTime: lookingResults.length, // Count olarak
        percentage: percentage,
        lookingPercentage: lookingPercentage
      };
    }).sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Boş metrics döndür
   */
  private getEmptyMetrics(): AttentionMetrics {
    return {
      totalGameTime: 0,
      screenLookingTime: 0,
      screenLookingPercentage: 0,
      emotionStats: [],
      dominantEmotion: 'neutral',
      attentionScore: 50,
      distractionEvents: 0
    };
  }

  /**
   * Geçmiş emotion verilerini temizle
   */
  clearHistory(): void {
    this.emotions = [];
    this.currentGameSession = [];
    console.log('🗑️ [EMOTION] Emotion history temizlendi');
  }

  /**
   * Oyun aktif mi kontrol et
   */
  isGameActiveStatus(): boolean {
    return this.isGameActive;
  }

  /**
   * Sadece o anki round'a ait emotion data'yı döndür (AI prompts için)
   */
  getCurrentRoundEmotions(): EmotionAnalysisResult[] {
    return [...this.currentRoundSession]; // Copy array
  }

  /**
   * Tüm oyun boyunca emotion data'yı döndür (analiz için)
   */
  getFullGameEmotions(): EmotionAnalysisResult[] {
    return [...this.currentGameSession]; // Copy array
  }

  /**
   * Round bitir ve o round'a ait emotion data'yı döndür
   */
  endRoundSession(): EmotionAnalysisResult[] {
    const roundEmotions = [...this.currentRoundSession];
    console.log('🏁 [EMOTION] Round seansı bitti', {
      roundEmotions: roundEmotions.length,
      totalGameEmotions: this.currentGameSession.length,
      roundDuration: this.roundStartTime ? `${((Date.now() - this.roundStartTime) / 1000).toFixed(1)}s` : 'N/A'
    });

    // Round emotion data'yı döndür ama sıfırlama - bir sonraki round başında sıfırlanacak
    return roundEmotions;
  }

  /**
   * Real-time emotion durumu için son 5 saniyelik veri
   */
  getRecentEmotionTrend(): { emotion: string; confidence: number; lookingAtScreen: boolean } {
    const recentResults = this.currentGameSession.slice(-10); // Son 10 analiz (~5 saniye)

    if (recentResults.length === 0) {
      return { emotion: 'neutral', confidence: 0.5, lookingAtScreen: true };
    }

    const emotionCounts: Record<string, number> = {};
    let totalLooking = 0;
    let totalConfidence = 0;

    for (const result of recentResults) {
      emotionCounts[result.emotion] = (emotionCounts[result.emotion] || 0) + 1;
      if (result.lookingAtScreen) totalLooking++;
      totalConfidence += result.confidence;
    }

    // En sık görülen emotion
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      emotion: dominantEmotion,
      confidence: totalConfidence / recentResults.length,
      lookingAtScreen: (totalLooking / recentResults.length) > 0.5
    };
  }
}

export const emotionAnalysisService = new EmotionAnalysisService();
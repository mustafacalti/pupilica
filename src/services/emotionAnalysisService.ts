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
  private emotions: EmotionAnalysisResult[] = [];
  private gameStartTime: number = 0;
  private lastAnalysisTime: number = 0;
  private currentGameSession: EmotionAnalysisResult[] = [];

  /**
   * Oyun başladığında emotion tracking'i başlat
   */
  startGameSession(): void {
    this.gameStartTime = Date.now();
    this.currentGameSession = [];
    this.lastAnalysisTime = this.gameStartTime;
    console.log('🎮 [EMOTION] Oyun seansı başladı, emotion tracking aktif');
  }

  /**
   * Emotion result ekle (kameradan gelen analiz sonucu)
   */
  addEmotionResult(result: EmotionAnalysisResult): void {
    this.emotions.push(result);
    this.currentGameSession.push(result);

    // DEBUG: lookingAtScreen değerini kontrol et
    console.log('📥 [EMOTION ADDED]', {
      emotion: result.emotion,
      confidence: (result.confidence * 100).toFixed(1) + '%',
      gazeStatus: result.gazeStatus,
      lookingAtScreen: result.lookingAtScreen,
      timestamp: new Date(result.timestamp).toLocaleTimeString()
    });

    // Console spam'i azalt - emotion değişikliklerinde log
    const lastResult = this.currentGameSession[this.currentGameSession.length - 2];
    if (!lastResult || lastResult.emotion !== result.emotion) {
      console.log(`😊 [EMOTION] ${result.emotion} (${(result.confidence * 100).toFixed(1)}%) - ${result.gazeStatus}`);
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
    const screenLookingTime = lookingResults.length * 0.5; // Her analiz ~0.5 saniye
    const screenLookingPercentage = (screenLookingTime / totalGameTime) * 100;

    // DEBUG: Screen looking hesaplamasını kontrol et
    console.log('👁️ [SCREEN LOOKING DEBUG]', {
      totalEmotions: this.currentGameSession.length,
      lookingEmotions: lookingResults.length,
      totalGameTime: totalGameTime.toFixed(1) + 's',
      screenLookingTime: screenLookingTime.toFixed(1) + 's',
      screenLookingPercentage: screenLookingPercentage.toFixed(1) + '%',
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

    console.log('🏁 [EMOTION] Oyun seansı bitti', {
      totalTime: `${finalMetrics.totalGameTime.toFixed(1)}s`,
      attentionScore: finalMetrics.attentionScore,
      dominantEmotion: finalMetrics.dominantEmotion
    });

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
    return Object.entries(emotionGroups).map(([emotion, results]) => {
      const emotionTime = results.length * 0.5; // Her analiz ~0.5 saniye
      const lookingResults = results.filter(r => r.lookingAtScreen);
      const lookingTime = lookingResults.length * 0.5;

      return {
        emotion,
        totalTime: emotionTime,
        lookingTime,
        percentage: (emotionTime / totalTime) * 100,
        lookingPercentage: emotionTime > 0 ? (lookingTime / emotionTime) * 100 : 0
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
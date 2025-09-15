import { PlayerPerformance, EmotionResult, GameQuestion } from '../types';

class PerformanceTracker {
  private performanceData: Map<string, PlayerPerformance> = new Map();

  initializePlayer(studentId: string, age: number): void {
    if (!this.performanceData.has(studentId)) {
      this.performanceData.set(studentId, {
        recentScores: [],
        averageResponseTime: 0,
        recentEmotions: [],
        strugglingTopics: [],
        strengths: [],
        currentDifficulty: this.getDifficultyByAge(age)
      });
    }
  }

  private getDifficultyByAge(age: number): 'easy' | 'medium' | 'hard' {
    if (age <= 5) return 'easy';
    if (age <= 8) return 'medium';
    return 'hard';
  }

  recordGameResult(
    studentId: string,
    score: number,
    totalQuestions: number,
    responseTime: number,
    gameType: string,
    emotions: EmotionResult[]
  ): void {
    const performance = this.performanceData.get(studentId);
    if (!performance) return;

    const successRate = score / totalQuestions;

    // Update recent scores (keep last 10)
    performance.recentScores.push(successRate);
    if (performance.recentScores.length > 10) {
      performance.recentScores.shift();
    }

    // Update response time
    performance.averageResponseTime =
      (performance.averageResponseTime + responseTime) / 2;

    // Update emotions (keep last 20)
    performance.recentEmotions.push(...emotions);
    if (performance.recentEmotions.length > 20) {
      performance.recentEmotions = performance.recentEmotions.slice(-20);
    }

    // Analyze performance and adjust difficulty
    this.analyzeAndAdjustDifficulty(studentId, gameType);

    this.performanceData.set(studentId, performance);
  }

  private analyzeAndAdjustDifficulty(studentId: string, gameType: string): void {
    const performance = this.performanceData.get(studentId);
    if (!performance || performance.recentScores.length < 3) return;

    const recentAverage = performance.recentScores.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, performance.recentScores.length);
    const dominantEmotion = this.getDominantEmotion(performance.recentEmotions.slice(-10));

    // Difficulty adjustment logic
    if (recentAverage >= 0.8 && dominantEmotion === 'happy') {
      // Student is doing well, increase difficulty
      if (performance.currentDifficulty === 'easy') {
        performance.currentDifficulty = 'medium';
      } else if (performance.currentDifficulty === 'medium') {
        performance.currentDifficulty = 'hard';
      }
      performance.strengths.push(gameType);
    } else if (recentAverage <= 0.4 || dominantEmotion === 'confused' || dominantEmotion === 'sad') {
      // Student is struggling, decrease difficulty
      if (performance.currentDifficulty === 'hard') {
        performance.currentDifficulty = 'medium';
      } else if (performance.currentDifficulty === 'medium') {
        performance.currentDifficulty = 'easy';
      }
      if (!performance.strugglingTopics.includes(gameType)) {
        performance.strugglingTopics.push(gameType);
      }
    }

    // Remove duplicates and limit arrays
    performance.strengths = Array.from(new Set(performance.strengths)).slice(-5);
    performance.strugglingTopics = Array.from(new Set(performance.strugglingTopics)).slice(-5);
  }

  private getDominantEmotion(emotions: EmotionResult[]): string {
    if (emotions.length === 0) return 'neutral';

    const emotionCounts: { [key: string]: number } = {};
    emotions.forEach(emotion => {
      emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
    });

    return Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    );
  }

  getPerformance(studentId: string): PlayerPerformance | null {
    return this.performanceData.get(studentId) || null;
  }

  shouldAdaptQuestion(studentId: string): boolean {
    const performance = this.performanceData.get(studentId);
    if (!performance) return false;

    // Adapt if student has consistent pattern (at least 3 games)
    return performance.recentScores.length >= 3;
  }

  getAdaptationStrategy(studentId: string): 'success' | 'struggle' | 'confusion' | 'neutral' {
    const performance = this.performanceData.get(studentId);
    if (!performance) return 'neutral';

    const recentAverage = performance.recentScores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, performance.recentScores.length);
    const dominantEmotion = this.getDominantEmotion(performance.recentEmotions.slice(-6));

    if (recentAverage >= 0.7 && (dominantEmotion === 'happy' || dominantEmotion === 'focused')) {
      return 'success';
    } else if (recentAverage <= 0.4 || dominantEmotion === 'sad') {
      return 'struggle';
    } else if (dominantEmotion === 'confused') {
      return 'confusion';
    }

    return 'neutral';
  }

  getInsights(studentId: string): string[] {
    const performance = this.performanceData.get(studentId);
    if (!performance) return [];

    const insights: string[] = [];
    const recentAverage = performance.recentScores.length > 0
      ? performance.recentScores.reduce((a, b) => a + b, 0) / performance.recentScores.length
      : 0;

    if (recentAverage >= 0.8) {
      insights.push('Öğrenci çok başarılı, daha zor sorularla meydan okuyun');
    } else if (recentAverage <= 0.4) {
      insights.push('Öğrenci zorlanıyor, daha basit sorularla motivasyonu artırın');
    }

    if (performance.strugglingTopics.length > 0) {
      insights.push(`Zorlandığı konular: ${performance.strugglingTopics.join(', ')}`);
    }

    if (performance.strengths.length > 0) {
      insights.push(`Güçlü olduğu konular: ${performance.strengths.join(', ')}`);
    }

    const dominantEmotion = this.getDominantEmotion(performance.recentEmotions);
    if (dominantEmotion === 'confused') {
      insights.push('Öğrenci karışık görünüyor, açıklamaları basitleştirin');
    } else if (dominantEmotion === 'happy') {
      insights.push('Öğrenci mutlu ve motive, bu tempoyu koruyun');
    }

    return insights;
  }

  resetPerformance(studentId: string): void {
    this.performanceData.delete(studentId);
  }

  exportPerformanceData(studentId: string): PlayerPerformance | null {
    return this.performanceData.get(studentId) || null;
  }
}

export const performanceTracker = new PerformanceTracker();
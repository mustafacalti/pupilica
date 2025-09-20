interface PerformanceMetrics {
  correctAttempts: number;
  totalAttempts: number;
  averageReactionTime: number;
  streakCounter: number;
  bestStreak: number;
  timeSpent: number;
  difficultyLevel: number;
  recentErrors: string[];
}

interface DifficultySettings {
  boxCount: number;
  commandVisibilityDuration: number;
  conflictRate: number;
  distractorCount: number;
  distractorTypes: string[];
  pauseTime: number;
}

interface AIRecommendation {
  newSettings: DifficultySettings;
  reasoning: string;
  encouragement: string;
  tips: string[];
}

class ConflictGameAI {
  private modelName: string = 'llama3.2:1b'; // Daha hızlı küçük model

  /**
   * Performans metriklerine göre AI'dan zorluk önerisi al
   */
  async getAdaptiveDifficulty(metrics: PerformanceMetrics, emotionData?: string): Promise<AIRecommendation> {
    const prompt = this.buildDifficultyPrompt(metrics, emotionData);

    try {
      const response = await this.callOllama(prompt);
      const aiRecommendation = this.parseAIResponse(response);

      console.log('🤖 AI Zorluk Önerisi:', aiRecommendation);
      return aiRecommendation;
    } catch (error) {
      console.error('❌ AI Zorluk Analizi hatası:', error);

      // Fallback: basit algoritmik zorluk ayarlaması
      return this.getFallbackDifficulty(metrics);
    }
  }

  /**
   * ADHD çocukları için optimize edilmiş zorluk analizi promptu
   */
  private buildDifficultyPrompt(metrics: PerformanceMetrics, emotionData?: string): string {
    const accuracy = metrics.totalAttempts > 0 ? (metrics.correctAttempts / metrics.totalAttempts * 100) : 0;
    const recentErrorPatterns = this.analyzeErrorPatterns(metrics.recentErrors);

    let emotionSection = '';
    if (emotionData) {
      emotionSection = `

KAMERA VERİSİ - TÜM DUYGUSAL DURUMLAR (Oyun süresince):
${emotionData}

DİKKAT: Bu emotion data'dan çok boyutlu analiz yap:

DUYGUSAL DURUM ANALİZİ:
- Hangi duygu baskın? Son trend nasıl?
- Emotion stabilite: Sabit mi değişken mi?
- Pozitif/negatif emotion dengesi?

ÖĞRENME STİLİ ÇIKARIMI:
- confused→happy geçişi = Yavaş öğrenen ama başarılı mı?
- happy→bored pattern = Hızla sıkılan, challenge isteyen mi?
- surprised spike'ları = Yenilikçi görevleri seven mi?

MOTİVASYON/STRES ANALİZİ:
- İçsel motivasyon: happy/neutral dominant mı?
- Frustration tolerance: angry/confused nasıl?
- Kaygı seviyesi: emotion volatility yüksek mi?

ATTENTION SPAN PATTERNİ:
- Emotion değişim hızı = Dikkat süresi ipucu
- Bored'a kadar geçen süre = Natural attention span
- Cognitive load: neutral→confused geçiş noktası

Bu analizlere göre en uygun zorluk stratejisini belirle:

Bu analizine göre çocuğun mevcut duygusal durumuna uygun zorluk ayarla:
- Mutlu/heyecanlı ise: Momentum sürdürecek, biraz daha zorlayıcı görevler
- Kafa karışık/yorgun ise: Basit, net talimatlar, daha az dikkat dağıtıcı
- Odaklanmış ise: Bu durumu koruyacak dengeli görevler
- Stresli/sinirli ise: Sakinleştirici, pozitif, başarıya odaklı görevler`;
    }

    return `Adjust difficulty for ADHD child Stroop game.

DATA: ${accuracy.toFixed(1)}% accuracy, ${metrics.averageReactionTime}ms reaction${emotionSection}

RULES:
- If accuracy >80% AND reaction <2000ms: increase difficulty
- If accuracy <50% OR reaction >2500ms: decrease difficulty
- If reaction <700ms: slow down (impulsive)
- If reaction >2800ms: motivate (struggling)

OUTPUT JSON:
{
  "newSettings": {"boxCount": ${accuracy > 80 && metrics.averageReactionTime < 2000 ? 6 : accuracy < 50 ? 4 : 5}, "commandVisibilityDuration": ${metrics.averageReactionTime < 700 ? 3500 : metrics.averageReactionTime > 2800 ? 2000 : 2500}, "conflictRate": ${accuracy > 80 ? 0.6 : accuracy < 50 ? 0.3 : 0.5}, "distractorCount": ${accuracy > 80 ? 1 : 0}, "distractorTypes": ["${accuracy > 80 ? 'text' : 'none'}"], "pauseTime": ${metrics.averageReactionTime < 700 ? 800 : 400}},
  "reasoning": "Based on ${accuracy.toFixed(1)}% accuracy and ${metrics.averageReactionTime}ms reaction",
  "encouragement": "Keep going!",
  "tips": ["Focus", "Read carefully"]
}`;
  }


  /**
   * Son hataları analiz ederek pattern belirle
   */
  private analyzeErrorPatterns(recentErrors: string[]): string {
    if (!recentErrors.length) return "Henüz hata analizi için yeterli veri yok";

    const patterns = {
      colorCommand: 0,
      textCommand: 0,
      quickClicks: 0,
      slowClicks: 0
    };

    recentErrors.forEach(error => {
      if (error.includes('color')) patterns.colorCommand++;
      if (error.includes('text')) patterns.textCommand++;
      if (error.includes('quick')) patterns.quickClicks++;
      if (error.includes('slow')) patterns.slowClicks++;
    });

    const dominantPattern = Object.entries(patterns)
      .reduce((a, b) => patterns[a[0]] > patterns[b[0]] ? a : b);

    const patternDescriptions = {
      colorCommand: "Renk komutlarında zorluk",
      textCommand: "Kelime komutlarında zorluk",
      quickClicks: "Çok hızlı tıklama eğilimi",
      slowClicks: "Yavaş reaksiyon gösterme"
    };

    return patternDescriptions[dominantPattern[0]] || "Karma hata türleri";
  }

  /**
   * Ollama API çağrısı
   */
  private async callOllama(prompt: string): Promise<string> {
    const ollamaApiUrl = import.meta.env.VITE_AI_STORY_API || 'http://localhost:11434/api/generate';

    const requestBody = {
      model: this.modelName,
      prompt: prompt,
      format: "json",
      stream: false,
      options: {
        temperature: 0.1, // Çok deterministik
        top_p: 0.7,
        num_predict: 100 // Minimum token
      }
    };

    try {
      const response = await fetch(ollamaApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Ollama API hatası: ${response.status}`);
      }

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      throw new Error(`Ollama bağlantı hatası: ${error}`);
    }
  }

  /**
   * AI yanıtını parse et
   */
  private parseAIResponse(response: string): AIRecommendation {
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(response.trim());
      } catch {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON bulunamadı');
        parsed = JSON.parse(jsonMatch[0]);
      }

      // Validasyon
      if (!parsed.newSettings) throw new Error('newSettings eksik');

      const settings = parsed.newSettings;

      // Güvenlik kontrolleri - ADHD için uygun aralıklarda tut
      settings.boxCount = Math.max(2, Math.min(10, settings.boxCount || 4));
      settings.commandVisibilityDuration = Math.max(1500, Math.min(4000, settings.commandVisibilityDuration || 2500));
      settings.conflictRate = Math.max(0.2, Math.min(0.9, settings.conflictRate || 0.5));
      settings.distractorCount = Math.max(0, Math.min(3, settings.distractorCount || 0));
      settings.pauseTime = Math.max(200, Math.min(1200, settings.pauseTime || 600));

      // distractorTypes validation
      const validTypes = ["emoji", "text", "shape", "none"];
      if (!Array.isArray(settings.distractorTypes)) {
        settings.distractorTypes = ["none"];
      } else {
        settings.distractorTypes = settings.distractorTypes.filter(type => validTypes.includes(type));
        if (settings.distractorTypes.length === 0) settings.distractorTypes = ["none"];
      }

      return {
        newSettings: settings,
        reasoning: parsed.reasoning || "AI tarafından optimize edildi",
        encouragement: parsed.encouragement || "Harika gidiyorsun! Devam et!",
        tips: Array.isArray(parsed.tips) ? parsed.tips : ["Odaklan ve sakin ol", "Her cevap öğrenme fırsatı"]
      };

    } catch (error) {
      console.error('AI response parse hatası:', error);
      throw new Error(`AI yanıtı parse edilemedi: ${error}`);
    }
  }

  /**
   * AI hatası durumunda basit fallback algoritma
   */
  private getFallbackDifficulty(metrics: PerformanceMetrics): AIRecommendation {
    const accuracy = metrics.totalAttempts > 0 ? (metrics.correctAttempts / metrics.totalAttempts) : 0;

    // Basit algoritma - sadece doğruluk oranına bak
    let boxCount = 5;
    let commandDuration = 2500;
    let conflictRate = 0.5;
    let distractorCount = 0;
    let pauseTime = 600;

    if (accuracy > 0.8) {
      // Yüksek performans - hafif zorluk artır
      boxCount = 6;
      conflictRate = 0.6;
      distractorCount = 1;
    } else if (accuracy < 0.5) {
      // Düşük performans - kolaylaştır
      boxCount = 4;
      conflictRate = 0.3;
      commandDuration = 3000;
      pauseTime = 800;
    }

    return {
      newSettings: {
        boxCount,
        commandVisibilityDuration: commandDuration,
        conflictRate,
        distractorCount,
        distractorTypes: distractorCount > 0 ? ["emoji"] : ["none"],
        pauseTime
      },
      reasoning: "AI mevcut değil, basit algoritma kullanıldı",
      encouragement: accuracy > 0.7 ? "Harika devam ediyorsun!" : "Güzel, pratik yapmaya devam et!",
      tips: [
        "Komutları dikkatli oku",
        "Acele etme, doğruluğa odaklan",
        "Her seferinde biraz daha iyi oluyorsun"
      ]
    };
  }

  /**
   * Model adını değiştir
   */
  setModel(modelName: string): void {
    this.modelName = modelName;
  }
}

export const conflictGameAI = new ConflictGameAI();
export type { PerformanceMetrics, DifficultySettings, AIRecommendation };
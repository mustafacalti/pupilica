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
  private modelName: string = 'hf.co/umutkkgz/Kaira-Turkish-Gemma-9B-T1-GGUF:Q3_K_M';

  /**
   * Performans metriklerine göre AI'dan zorluk önerisi al
   */
  async getAdaptiveDifficulty(metrics: PerformanceMetrics): Promise<AIRecommendation> {
    const prompt = this.buildDifficultyPrompt(metrics);

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
  private buildDifficultyPrompt(metrics: PerformanceMetrics): string {
    const accuracy = metrics.totalAttempts > 0 ? (metrics.correctAttempts / metrics.totalAttempts * 100) : 0;
    const recentErrorPatterns = this.analyzeErrorPatterns(metrics.recentErrors);

    return `Sen ADHD çocukları için uzmanlaşmış bir eğitim oyunu AI'ısın. Çatışma (Stroop) oyununda bir öğrencinin performansını analiz edip, ona en uygun zorluk seviyesini belirlemen gerekiyor.

ÖĞRENCİ PERFORMANS VERİLERİ:
- Doğruluk oranı: %${accuracy.toFixed(1)}
- Toplam deneme: ${metrics.totalAttempts}
- Doğru cevap: ${metrics.correctAttempts}
- Ortalama reaksiyon süresi: ${metrics.averageReactionTime}ms
- Güncel seri: ${metrics.streakCounter} doğru
- En iyi seri: ${metrics.bestStreak} doğru
- Oyun süresi: ${Math.floor(metrics.timeSpent / 1000)} saniye
- Mevcut zorluk seviyesi: ${metrics.difficultyLevel}/10
- Son hata pattern'leri: ${recentErrorPatterns}

PERFORMANS ANALİZ KURALLARI (ADHD ÇOCUKLARİ İÇİN OPTİMİZE):
1. REAKSİYON SÜRESİ ANALİZİ (ADHD'li çocuklar için):
   • 0-700ms: Çok hızlı - İMPULSİF DAVRANIS RİSKİ (muhtemelen rastgele tıklama)
   • 700-1200ms: Hızlı - İyi kontrol ve hızlı karar verme (çok iyi performans)
   • 1200-1800ms: Normal - ADHD için ideal reaksiyon süresi (dikkatli ve kontrollü)
   • 1800-2800ms: Yavaş - Çok dikkatli yaklaşım (iyi şey, acele etmiyor)
   • 2800ms+: Çok yavaş - Zorlanıyor olabilir VEYA çok dikkatli

2. DOĞRULUK + REAKSİYON KOMBİNASYONU ANALİZİ (ADHD için):
   • Yüksek doğruluk (70%+) + 1200-2800ms reaksiyon = MÜKEMMEL ADHD PERFORMANSI (dikkatli ve başarılı)
   • Yüksek doğruluk (70%+) + 700-1200ms reaksiyon = ÇOK İYİ PERFORMANS (kontrollü hız)
   • Orta doğruluk (50-70%) + 1200-1800ms reaksiyon = NORMAL ADHD PERFORMANSI (iyi gidiyor)
   • Düşük doğruluk (50%-) + 0-700ms reaksiyon = İMPULSİF DAVRANIS (yavaşlatılmalı, dikkat çekilmeli)
   • Düşük doğruluk (50%-) + 2800ms+ reaksiyon = AŞIRI ZORLANIYOR (kolaylaştırılmalı)

3. SEN KARAR VER: Bu veriler ışığında çocuğun durumunu analiz et ve uygun zorluk ayarı yap.
   • Eğer dikkatli ve başarılıysa → Mevcut seviyeyi koru veya hafif artır
   • Eğer aceleciysε → Sakinleştirici ayarlar (daha fazla zaman, daha az kutu)
   • Eğer zorlanıyorsa → Kolaylaştırıcı ayarlar (daha az çatışma, daha basit)
   • Eğer çok başarılıysa → Zorluk artırıcı ayarlar

4. MOTİVASYONEL YAKLAŞIM:
   • Başarılı performans için övgü ve teşvik
   • Zorlanıyorsa sabırlı ve destekleyici
   • Aceleci davranıyorsa yönlendirici ve sakinleştirici

ADHD ÖZEL KONSIDERASYON KURALLARI:
1. Dikkat süresi kısıtlı - çok fazla kutu dikkat dağıtır
2. Görsel karmaşıklık stres yaratır - minimalist yaklaşım
3. Başarı hissi motivasyonu artırır - küçük kazanımlar önemli
4. Çok hızlı değişiklik konfüze eder - kademeli geçişler
5. Pozitif reinforcement esastır

ZORLUK PARAMETRELERİ (1-10 arası değerler):
- boxCount: Ekrandaki kutu sayısı (2-10)
- commandVisibilityDuration: Komut görme süresi ms (1500-4000)
- conflictRate: Çatışma oranı 0-1 (0.2-0.9)
- distractorCount: Dikkat dağıtıcı sayısı (0-3)
- distractorTypes: Hangi tip dikkat dağıtıcılar ["emoji", "text", "shape", "none"]
- pauseTime: Turlar arası mola ms (200-1200)

ÇIKTI FORMATI (sadece JSON döndür):
{
  "newSettings": {
    "boxCount": sayı,
    "commandVisibilityDuration": sayı,
    "conflictRate": ondalık,
    "distractorCount": sayı,
    "distractorTypes": string array,
    "pauseTime": sayı
  },
  "reasoning": "Neden bu ayarları seçtiğin kısa açıklama",
  "encouragement": "Öğrenciyi motive edecek pozitif mesaj",
  "tips": ["ipucu1", "ipucu2", "ipucu3"]
}

ÖNEMLI: Sadece JSON döndür, başka açıklama yazma. ADHD'li çocuklar için optimize et.`;
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
    const ollamaApiUrl = 'http://localhost:11434/api/generate';

    const requestBody = {
      model: this.modelName,
      prompt: prompt,
      format: "json",
      stream: false,
      options: {
        temperature: 0.4, // Daha tutarlı öneriler için düşük
        top_p: 0.85,
        num_predict: 400
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
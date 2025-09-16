import { GameQuestion } from "../types";

export interface OllamaQuestionRequest {
  subject: string;
  difficulty: 'kolay' | 'orta' | 'zor';
  questionType?: 'çoktan seçmeli' | 'doğru-yanlış';
}

export interface OllamaResponse {
  question: string;
  options: string[];
  correctIndex: number;
}

class OllamaService {
  private modelName: string = 'hf.co/umutkkgz/Kaira-Turkish-Gemma-9B-T1-GGUF:Q3_K_M'; // Türkçe Gemma model

  /**
   * Ollama CLI üzerinden soru üretir
   */
  async generateQuestion(request: OllamaQuestionRequest): Promise<GameQuestion> {
    const { subject, difficulty, questionType = 'çoktan seçmeli' } = request;

    console.log('🤖 [OLLAMA DEBUG] Soru üretimi başlıyor:', {
      subject,
      difficulty,
      questionType,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 5).join('\n')
    });

    const prompt = this.buildPrompt(subject, difficulty, questionType);

    try {
      const response = await this.callOllama(prompt);
      const parsedResponse = this.parseOllamaResponse(response);

      console.log('✅ [OLLAMA DEBUG] Soru başarıyla üretildi:', parsedResponse.question);

      return {
        id: `ollama_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: parsedResponse.question,
        options: parsedResponse.options,
        correctAnswer: parsedResponse.correctIndex,
        confidence: 0.9,
        gameType: "word-image", // Default olarak word-image, gerekirse güncellenebilir
        difficulty: this.mapDifficultyToEnglish(difficulty),
        source: 'ollama'
      };
    } catch (error) {
      console.error('❌ [OLLAMA DEBUG] Soru üretme hatası:', error);
      throw new Error(`Ollama servisi ile soru üretilemedi: ${error}`);
    }
  }

  /**
   * ADHD çocukları için optimize edilmiş prompt oluşturur
   */
  private buildPrompt(subject: string, difficulty: string, questionType: string): string {
    return `Aşağıdaki talimatları tamamen uygula ve yalnızca istenen biçimde yanıt ver.

Profil (hedef kitle)
Yaş: 12 (ortaokul 5–6. sınıf).
Dikkat süresi için: tek görev, tek cümle, somut/giriş düzeyi soyut kavramlar.
Kelime dağarcığı: B1 düzeyi; günlük ve dersle ilişkili sözcükler.

Dil ve karakterler
Yanıt yalnızca Türkçe olmalıdır.
Çin/Japon tipi karakter ve noktalama kullanma (örn. ： ， ︿ ＜ ＞).
ASCII soru işareti ? kullan.

Çıktı formatı (zorunlu)
Sadece tek bir JSON nesnesi döndür; açıklama/ek metin yok.
Şema: {"question": string, "options": [string,string,string,string], "correctIndex": number}

Kurallar:
question: 6–8 kelime, kısa ve net.
options: tam 4 seçenek, Türkçe ve emoji ile görsel zengin.
Seçenekler benzersiz, benzer uzunlukta; sadece 1 doğru.
correctIndex: 0–3 arası tamsayı.

ADHD'ye uygun tasarım
Olumsuz kalıp kullanma ("hangisi değildir" yok).
Belirsiz/iki anlamlı ifadeler yok.
Aynı veya çok benzer emojiler kullanma (karışıklık oluşturma).
Gereksiz süsleme ve uzun cümleler yok.

Zorluk haritalaması (12 yaş):
kolay: doğrudan tanıma/isimlendirme; açık farklar; 1 adım.
orta: temel sınıflama/özdeşlik; yakın ama ayrılabilir çeldiriciler.
zor: kısa bağlam ipucu veya 2 adımlı basit akıl yürütme (yine kısa).

Kalite kontrolleri
Soru "hangi / ne / kim / nerede / nedir / nasıl" kalıbı içersin.
Seçenekler dilbilgisel olarak tutarlı (hepsi kısa söz öbekleri).
Soruda cevabı açık etmeyin (ipucu sızıntısı yok).
Doğru cevabın konumu rastgele olsun; sabit pozisyon kullanma.

Konu: ${subject}
Zorluk: ${difficulty}

DOĞRU örnek
{"question":"🐶 hangi ses çıkarır?","options":["Hav hav","Miyav","Möö","Cik cik"],"correctIndex":0}

YANLIŞ örnekler (yapma)
Ek açıklama/metin döndürmek.
Çin tipi noktalama: ： ， ︿ ＜ ＞
Uzun/iki görevli sorular.
Birden çok doğru cevap.`;
  }

  /**
   * ADHD çocukları için zorluk seviyesine göre özel rehberlik
   */
  private getADHDGuidelines(difficulty: string): string {
    switch (difficulty) {
      case 'kolay':
        return `
- Çok basit, günlük yaşamdan konular
- Büyük, kontrastlı emojiler kullan
- Sadece bir odak noktası
- Pozitif, eğlenceli dil`;

      case 'orta':
        return `
- Bilinen konulardan biraz farklı örnekler
- Rengarenk emojiler
- Hafif düşündürücü ama yorucu değil
- Teşvik edici ifadeler`;

      case 'zor':
        return `
- Dikkat gerektiren detaylar
- Çoklu görsel ipuçları
- Problem çözme odaklı
- Başarı hissi verecek zorlukta`;

      default:
        return '- Temel ADHD uyumlu tasarım prensiplerine uygun';
    }
  }

  /**
   * Ollama API'yi çağırır (REST API üzerinden)
   */
  private async callOllama(prompt: string): Promise<string> {
    const ollamaApiUrl = 'http://localhost:11434/api/generate';

    console.log('📡 [OLLAMA DEBUG] API çağrısı başlıyor...');

    const requestBody = {
      model: this.modelName,
      prompt: prompt,
      format: "json", // 🔒 JSON garantisi
      stream: false,
      options: {
        temperature: 0.6, // JSON için optimal
        top_p: 0.9,
        num_predict: 300 // JSON için biraz daha fazla token
      }
    };

    try {
      const response = await fetch(ollamaApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Ollama API hatası: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('Ollama boş yanıt döndürdü');
      }

      console.log('📨 [OLLAMA DEBUG] API yanıtı alındı');
      return data.response.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Ollama API hatası: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Ollama'dan gelen JSON yanıtını parse eder
   */
  private parseOllamaResponse(response: string): OllamaResponse {
    console.log('🔍 [OLLAMA DEBUG] Parse edilecek yanıt:', response);

    try {
      // İlk olarak direkt JSON parse dene (format:"json" kullanıyoruz)
      let parsed: any;
      try {
        parsed = JSON.parse(response.trim()) as OllamaResponse;
      } catch (directParseError) {
        // Eğer başarısız olursa, JSON pattern ara
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`JSON bulunamadı. Ham yanıt: ${response}`);
        }
        const jsonString = jsonMatch[0];
        parsed = JSON.parse(jsonString) as OllamaResponse;
      }

      // Sıkı validasyon
      if (!parsed?.question || typeof parsed.question !== 'string') {
        throw new Error(`Geçersiz question: ${parsed?.question}`);
      }

      // Çince karakter kontrolü
      const chineseRegex = /[\u4e00-\u9fff\uff00-\uffef：，＞︿＜]/;
      if (chineseRegex.test(parsed.question)) {
        throw new Error(`Soru Çince karakter içeriyor: ${parsed.question}`);
      }

      if (!Array.isArray(parsed?.options)) {
        throw new Error(`Options array değil: ${parsed?.options}`);
      }

      if (parsed.options.length !== 4) {
        throw new Error(`4 seçenek gerekli, ${parsed.options.length} bulundu: ${JSON.stringify(parsed.options)}`);
      }

      // Seçeneklerde Çince karakter kontrolü
      for (const option of parsed.options) {
        if (typeof option !== 'string') {
          throw new Error(`Seçenek string değil: ${option}`);
        }
        if (chineseRegex.test(option)) {
          throw new Error(`Seçenek Çince karakter içeriyor: ${option}`);
        }
      }

      if (typeof parsed?.correctIndex !== 'number') {
        throw new Error(`correctIndex sayı değil: ${parsed?.correctIndex}`);
      }

      if (parsed.correctIndex < 0 || parsed.correctIndex > 3) {
        throw new Error(`correctIndex 0-3 arasında olmalı: ${parsed.correctIndex}`);
      }

      console.log('✅ [OLLAMA DEBUG] JSON başarıyla parse edildi');
      return parsed;
    } catch (error) {
      console.error('❌ [OLLAMA DEBUG] JSON parse hatası:', error);
      console.error('🔍 [OLLAMA DEBUG] Ham yanıt:', response);
      throw new Error(`Model JSON döndürmedi veya format hatalı: ${error}`);
    }
  }

  /**
   * Türkçe zorluk seviyesini İngilizceye çevirir
   */
  private mapDifficultyToEnglish(difficulty: string): 'easy' | 'medium' | 'hard' {
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'kolay': 'easy',
      'orta': 'medium',
      'zor': 'hard'
    };

    return difficultyMap[difficulty] || 'medium';
  }

  /**
   * Model adını değiştirir
   */
  setModel(modelName: string): void {
    this.modelName = modelName;
  }

  /**
   * Mevcut model adını döndürür
   */
  getCurrentModel(): string {
    return this.modelName;
  }

  /**
   * Ollama'nın çalışır durumda olup olmadığını kontrol eder
   */
  async checkOllamaStatus(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const models = data.models || [];

      return models.some((model: any) => model.name.includes(this.modelName.split(':')[0]));
    } catch (error) {
      console.error('Ollama status kontrolü hatası:', error);
      return false;
    }
  }

  /**
   * Toplu soru üretimi için batch fonksiyonu
   */
  async generateMultipleQuestions(
    request: OllamaQuestionRequest,
    count: number = 5
  ): Promise<GameQuestion[]> {
    const questions: GameQuestion[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const question = await this.generateQuestion(request);
        questions.push(question);

        // API'ye yük bindirmemek için kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`${i + 1}. soru üretme hatası:`, error);
        // Hata durumunda devam et, en az birkaç soru üretelim
      }
    }

    if (questions.length === 0) {
      throw new Error('Hiç soru üretilemedi');
    }

    return questions;
  }
}

export const ollamaService = new OllamaService();
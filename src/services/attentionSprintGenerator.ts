import { AttentionSprintTask, AttentionSprintPerformance } from '../types';
import { ollamaService } from './ollamaService';

interface AttentionSprintRequest {
  performansOzeti: AttentionSprintPerformance;
  studentAge: number;
}

class AttentionSprintGenerator {

  /**
   * ADHD'li 12 yaş çocukları için dikkat sprintleri üretir
   */
  async generateAttentionSprint(request: AttentionSprintRequest): Promise<AttentionSprintTask> {
    const { performansOzeti, studentAge } = request;

    // Performansa göre zorluk seviyesi belirleme
    const difficulty = this.determineDifficulty(performansOzeti);

    // 12 yaş ADHD çocuklara özel prompt
    const prompt = this.buildAttentionSprintPrompt(performansOzeti, studentAge, difficulty);

    try {
      console.log('🎯 [ATTENTION SPRINT] Görev üretiliyor:', { difficulty, performansOzeti });

      // Ollama'dan görev üret
      const response = await this.callOllama(prompt);
      const sprintTask = this.parseSprintResponse(response, difficulty);

      console.log('✅ [ATTENTION SPRINT] Görev üretildi:', sprintTask.gorev);
      return sprintTask;
    } catch (error) {
      console.error('❌ [ATTENTION SPRINT] Görev üretme hatası:', error);

      // Fallback görev
      return this.getFallbackTask(difficulty, studentAge);
    }
  }

  /**
   * Son 3 turun performansına göre zorluk belirleme
   */
  private determineDifficulty(performans: AttentionSprintPerformance): 'kolay' | 'orta' | 'zor' {
    const { basariOrani, odaklanmaDurumu, ortalamaReaksiyonSuresi } = performans;

    // ADHD çocukları için özel adaptif zorluk
    if (basariOrani >= 0.8 && odaklanmaDurumu === 'yuksek' && ortalamaReaksiyonSuresi < 3) {
      return 'zor'; // Çok iyi gidiyorsa zorlaştır
    } else if (basariOrani >= 0.6 && odaklanmaDurumu !== 'dusuk') {
      return 'orta'; // Normal performans
    } else {
      return 'kolay'; // Zorlanıyorsa basitleştir
    }
  }

  /**
   * 12 yaş ADHD çocuklara özel prompt oluşturma
   */
  private buildAttentionSprintPrompt(
    performans: AttentionSprintPerformance,
    studentAge: number,
    difficulty: 'kolay' | 'orta' | 'zor'
  ): string {
    const performansMetni = this.formatPerformanceForPrompt(performans);

    return `ADHD'li 12 yaş çocuk için Dikkat Sprintleri görevi üret. SADECE JSON döndür.

HEDEF KITLE:
- Yaş: 12 (ortaokul seviyesi)
- ADHD özellik: Kısa dikkat süresi, hiperaktivite, impulse kontrol zorluğu
- Motivasyon: Görsel ödüller, hızlı geri bildirim, başarı hissi

GÖREV KURALLARI:
- Süre: 30-60 saniye (ADHD için kısa)
- Tek odak: Sadece 1 şey yap (çoklu görev yok)
- Net talimat: Basit, anlaşılır komutlar
- Görsel zengin: Renkler, şekiller, emojiler kullan
- Olumlu dil: "Yapma" yerine "Yap" kalıbı

ZORLUK SEVİYESİ: ${difficulty}

PERFORMANS ÖZETİ:
${performansMetni}

ÇIKTI ŞEMASI:
{
  "gorev": string, // "3 saniye bekle, sonra 🔴 kırmızı daire tıkla"
  "sure_saniye": number, // 30-60 arası
  "ipuclari": [string], // Max 2 ipucu, kısa ve net
  "hedefRenk": string, // Varsa: "kırmızı", "mavi" vs
  "hedefSayi": number, // Varsa: sayma görevi için
  "hedefSekil": string, // Varsa: "daire", "kare" vs
  "dikkatDagitici": number // 0-1 arası (0=yok, 1=maksimum)
}

12 YAŞ İÇİN GÖREV ÖRNEKLERİ:
- "🔴 Kırmızı butona 2 saniye sonra bas"
- "🟢 Yeşil kareler sayısını bul"
- "👀 Mavi ⭐ yıldızları takip et"
- "⏰ 5 saniye sessizce bekle"
- "🎯 Ortadaki hedefe odaklan"

YAPMA:
- Uzun açıklamalar
- Karmaşık çoklu adımlar
- Olumsuz kelimeler
- Soyut kavramlar`;
  }

  /**
   * Performans verisini prompt için formatla
   */
  private formatPerformanceForPrompt(performans: AttentionSprintPerformance): string {
    const { son3Tur, basariOrani, ortalamaReaksiyonSuresi, odaklanmaDurumu } = performans;

    const turlar = son3Tur.map((tur, i) =>
      `Tur ${i+1}: ${tur.basari ? 'Başarılı' : 'Başarısız'} - ${tur.sure}s - ${tur.zorluk}`
    ).join('\n');

    return `Son 3 Tur:
${turlar}

Genel Durum:
- Başarı Oranı: ${Math.round(basariOrani * 100)}%
- Ortalama Reaksiyon: ${ortalamaReaksiyonSuresi.toFixed(1)}s
- Odaklanma: ${odaklanmaDurumu}`;
  }

  /**
   * Ollama'ya API çağrısı
   */
  private async callOllama(prompt: string): Promise<string> {
    const ollamaApiUrl = 'http://localhost:11434/api/generate';

    const requestBody = {
      model: 'hf.co/umutkkgz/Kaira-Turkish-Gemma-9B-T1-GGUF:Q3_K_M',
      prompt: prompt,
      format: "json",
      stream: false,
      options: {
        temperature: 0.7, // Kreativite için biraz yüksek
        top_p: 0.9,
        num_predict: 250
      }
    };

    const response = await fetch(ollamaApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Ollama API hatası: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.trim() || '';
  }

  /**
   * Ollama yanıtını parse et
   */
  private parseSprintResponse(response: string, difficulty: 'kolay' | 'orta' | 'zor'): AttentionSprintTask {
    try {
      const parsed = JSON.parse(response);

      // Validasyon
      if (!parsed.gorev || typeof parsed.gorev !== 'string') {
        throw new Error('Geçersiz görev');
      }

      return {
        id: `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        gorev: parsed.gorev,
        sure_saniye: Math.max(30, Math.min(60, parsed.sure_saniye || 45)),
        ipuclari: Array.isArray(parsed.ipuclari) ? parsed.ipuclari.slice(0, 2) : [],
        hedefRenk: parsed.hedefRenk || undefined,
        hedefSayi: parsed.hedefSayi || undefined,
        hedefSekil: parsed.hedefSekil || undefined,
        dikkatDagitici: Math.max(0, Math.min(1, parsed.dikkatDagitici || 0)),
        difficulty
      };
    } catch (error) {
      console.error('Sprint response parse hatası:', error);
      throw new Error(`JSON parse hatası: ${error}`);
    }
  }

  /**
   * Hata durumunda fallback görevler
   */
  private getFallbackTask(difficulty: 'kolay' | 'orta' | 'zor', studentAge: number): AttentionSprintTask {
    const fallbackTasks = {
      kolay: [
        {
          gorev: "🔴 Kırmızı butona bas",
          sure_saniye: 30,
          ipuclari: ["Kırmızı rengi ara", "Büyük buton olacak"],
          hedefRenk: "kırmızı",
          dikkatDagitici: 0
        },
        {
          gorev: "⭐ Yıldızları say",
          sure_saniye: 35,
          ipuclari: ["Sarı yıldızları bul", "Parmakla işaret et"],
          hedefSekil: "yıldız",
          dikkatDagitici: 0
        }
      ],
      orta: [
        {
          gorev: "🟢 Yeşil kareler sayısını bul",
          sure_saniye: 45,
          ipuclari: ["Sadece yeşil olanlar", "Sessizce say"],
          hedefRenk: "yeşil",
          hedefSekil: "kare",
          dikkatDagitici: 0.3
        },
        {
          gorev: "🎯 Ortadaki hedefe 3 saniye odaklan",
          sure_saniye: 40,
          ipuclari: ["Gözlerini hedeften ayırma", "Nefes al"],
          dikkatDagitici: 0.5
        }
      ],
      zor: [
        {
          gorev: "🔵 Mavi daireler gözükünce hızla tıkla",
          sure_saniye: 50,
          ipuclari: ["Hazır ol", "Hızlı reaksiyon göster"],
          hedefRenk: "mavi",
          hedefSekil: "daire",
          dikkatDagitici: 0.7
        },
        {
          gorev: "🟡⭐ Sarı yıldızları takip et ve say",
          sure_saniye: 55,
          ipuclari: ["Hareket eden yıldızları takip et", "Sayıyı unutma"],
          hedefRenk: "sarı",
          hedefSekil: "yıldız",
          dikkatDagitici: 0.8
        }
      ]
    };

    const tasks = fallbackTasks[difficulty];
    const selectedTask = tasks[Math.floor(Math.random() * tasks.length)];

    return {
      id: `fallback_sprint_${Date.now()}`,
      ...selectedTask,
      difficulty
    };
  }
}

export const attentionSprintGenerator = new AttentionSprintGenerator();
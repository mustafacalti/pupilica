import { AttentionSprintTask, AttentionSprintPerformance } from '../types';
import { ollamaService } from './ollamaService';

interface AttentionSprintRequest {
  performansOzeti: AttentionSprintPerformance;
  studentAge: number;
  sonGorevler?: string[]; // Son 3-5 görevin tipleri
  forcedDifficulty?: 'kolay' | 'orta' | 'zor'; // Kullanıcının seçtiği zorluk seviyesi
}

class AttentionSprintGenerator {

  /**
   * ADHD'li 12 yaş çocukları için dikkat sprintleri üretir
   */
  async generateAttentionSprint(request: AttentionSprintRequest & { emotionData?: string }): Promise<AttentionSprintTask> {
    const { performansOzeti, studentAge, sonGorevler = [], forcedDifficulty, emotionData } = request;

    // Zorluk seviyesi belirleme - kullanıcı seçimi varsa onu kullan
    const difficulty = forcedDifficulty || this.determineDifficulty(performansOzeti);

    if (forcedDifficulty) {
      console.log('👤 [USER CHOICE] Kullanıcının seçtiği zorluk kullanılıyor:', forcedDifficulty);
    }

    // Görev çeşitliliğini kontrol et
    const onerilenTip = this.determineTaskVariety(sonGorevler);

    // 12 yaş ADHD çocuklara özel prompt
    const prompt = this.buildAttentionSprintPrompt(performansOzeti, studentAge, difficulty, onerilenTip, emotionData);

    // AI'a gönderilen tam prompt'u logla
    console.log('📝 [AI PROMPT FULL]', {
      hasEmotionData: !!emotionData,
      promptLength: prompt.length,
      emotionDataLength: emotionData?.length || 0,
      preview: emotionData ? `${JSON.parse(emotionData).length} emotions` : 'no emotions'
    });

    // Prompt'u konsola yazdır (daha okunabilir)
    console.log('📄 [AI PROMPT TEXT]');
    console.log('='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80));

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
   * Son 3 turun performansına göre zorluk belirleme - Gelişmiş Adaptif Sistem
   */
  private determineDifficulty(performans: AttentionSprintPerformance): 'kolay' | 'orta' | 'zor' {
    const { basariOrani, odaklanmaDurumu, ortalamaReaksiyonSuresi, son3Tur, sayiGorevPerformansi, zamanlamaPerformansi } = performans;

    // Hızlı çözüm analizi
    const hizliCozumSayisi = son3Tur.filter(tur => tur.hizliCozum).length;
    const sayiGoreviVarMi = son3Tur.some(tur => tur.hedefTipi === 'sayi');

    // Zamanlama performans analizi
    const zamanlamaGoreviVarMi = son3Tur.some(tur => tur.hedefZaman !== null);
    const ortalamaSapma = zamanlamaPerformansi?.ortalamaSapma || 0;
    const idealZamanlamaOrani = zamanlamaPerformansi?.idealZamanlamaOrani || 0;

    console.log('📊 [ADAPTIVE DIFFICULTY]', {
      basariOrani,
      ortalamaReaksiyonSuresi,
      hizliCozumSayisi,
      sayiGoreviVarMi,
      zamanlamaGoreviVarMi,
      ortalamaSapma,
      idealZamanlamaOrani,
      sayiGorevPerformansi,
      zamanlamaPerformansi
    });

    // Zorluk kararı debug
    console.log('🔍 [DIFFICULTY DEBUG]', {
      'Test 1 (Süper)': basariOrani >= 0.8 && (hizliCozumSayisi >= 2 || ortalamaReaksiyonSuresi < 2.5),
      'Test 2 (İyi)': basariOrani >= 0.7 && (hizliCozumSayisi >= 1 || ortalamaReaksiyonSuresi < 4),
      'Test 3 (Yavaş)': basariOrani >= 0.8 && ortalamaReaksiyonSuresi < 6,
      'Test 4 (Zayıf)': basariOrani < 0.5 || ortalamaReaksiyonSuresi > 8,
      conditions: {
        'basariOrani >= 0.8': basariOrani >= 0.8,
        'hizliCozumSayisi >= 2': hizliCozumSayisi >= 2,
        'ortalamaReaksiyonSuresi < 2.5': ortalamaReaksiyonSuresi < 2.5
      }
    });

    // Süper hızlı performans - 2x zorluk atlama
    if (hizliCozumSayisi >= 2 && basariOrani >= 0.8 && ortalamaReaksiyonSuresi < 2) {
      console.log('🚀 [DIFFICULTY] Süper hızlı - 2x atlama!');
      return 'zor';
    }

    // Sayı görevlerinde özel adaptasyon
    if (sayiGorevPerformansi && sayiGoreviVarMi) {
      const sayiPerformans = this.evaluateNumberTaskPerformance(sayiGorevPerformansi, son3Tur);
      if (sayiPerformans.zorlukArtisi > 1) {
        console.log(`🔢 [DIFFICULTY] Sayı görevi adaptasyonu: +${sayiPerformans.zorlukArtisi}`);
        return sayiPerformans.onerilen;
      }
    }

    // Gelişmiş ADHD adaptif zorluk - Sapma Bazlı Değerlendirme

    // ZAMANLAMA PERFORMANSI ÖNCELİĞİ - En önemli metrik
    if (zamanlamaGoreviVarMi && zamanlamaPerformansi) {
      // Mükemmel zamanlama - çok zorlaştır
      if (idealZamanlamaOrani >= 0.8 && ortalamaSapma <= 0.5) {
        console.log('🎯 [DIFFICULTY] Mükemmel zamanlama (sapma ≤0.5s) - ZOR seviye!');
        return 'zor';
      }

      // İyi zamanlama - zorlaştır
      if (idealZamanlamaOrani >= 0.6 && ortalamaSapma <= 1.5) {
        console.log('⏱️ [DIFFICULTY] İyi zamanlama (sapma ≤1.5s) - ORTA seviye!');
        return 'orta';
      }

      // Orta zamanlama - mevcut seviyede tut
      if (idealZamanlamaOrani >= 0.4 && ortalamaSapma <= 3) {
        console.log('⏰ [DIFFICULTY] Orta zamanlama (sapma ≤3s) - KOLAY/ORTA seviye!');
        return basariOrani >= 0.7 ? 'orta' : 'kolay';
      }

      // Kötü zamanlama - basitleştir
      if (ortalamaSapma > 3) {
        console.log('❌ [DIFFICULTY] Kötü zamanlama (sapma >3s) - KOLAY seviye!');
        return 'kolay';
      }
    }

    // GENEL PERFORMANS (Zamanlama yoksa)

    // Süper performans - çok zorlaştır
    if (basariOrani >= 0.8 && (hizliCozumSayisi >= 2 || ortalamaReaksiyonSuresi < 2.5)) {
      console.log('🔥 [DIFFICULTY] Süper performans - ZOR seviye!');
      return 'zor';
    }

    // İyi performans - zorlaştır
    if (basariOrani >= 0.7 && (hizliCozumSayisi >= 1 || ortalamaReaksiyonSuresi < 4)) {
      console.log('⬆️ [DIFFICULTY] İyi performans - ORTA seviye!');
      return 'orta';
    }

    // Yavaş ama başarılı - orta seviye verilebilir
    if (basariOrani >= 0.8 && ortalamaReaksiyonSuresi < 6) {
      console.log('🐌 [DIFFICULTY] Yavaş ama başarılı - ORTA seviye!');
      return 'orta';
    }

    // Zayıf performans - basit tut
    if (basariOrani < 0.5 || ortalamaReaksiyonSuresi > 8) {
      console.log('📉 [DIFFICULTY] Zayıf performans - KOLAY seviye!');
      return 'kolay';
    }

    // Varsayılan orta seviye
    console.log('🎯 [DIFFICULTY] Varsayılan - ORTA seviye!');
    return 'orta';
  }

  /**
   * Görev çeşitliliğini belirle - tekrarları engelle
   */
  private determineTaskVariety(sonGorevler: string[]): string {
    // Eğer sonGorevler'de özel oyun tipi belirtilmişse onu kullan
    if (sonGorevler.length === 1) {
      const ozelTip = sonGorevler[0];
      if (ozelTip === 'sayma') {
        console.log('🎨 [VARIETY] Özel istek: Sayma oyunu');
        return 'sayma';
      }
      if (ozelTip === 'dinamik-tıklama') {
        console.log('🎨 [VARIETY] Özel istek: Dinamik tıklama oyunu');
        return 'dinamik-tıklama';
      }
      if (ozelTip === 'tıklama') {
        console.log('🎨 [VARIETY] Özel istek: Normal tıklama oyunu');
        return 'renk-tıklama';
      }
    }

    // Son görevlerin tiplerini analiz et
    const sonTipler = sonGorevler.map(gorev => this.analyzeTaskType(gorev));

    // Mevcut görev tipleri - sadece sistemde desteklenenler
    const gorevTipleri = [
      'renk-tıklama',    // Kırmızı daire tıkla
      'şekil-tıklama',   // Yıldız tıkla
      'sayma',           // Mavi kareleri say
      'bekleme',         // 5 saniye bekle
      'kombinasyon',     // Mavi üçgenleri tıkla
      'dinamik-sayma',   // Çıkan objeleri say
      'dinamik-tıklama', // 50 saniye mavi üçgenleri tıkla
      'sayı-tıklama'     // 3 sayısını tıkla
    ];

    // En az kullanılan tipi bul
    const tipSayilari = gorevTipleri.map(tip => ({
      tip,
      sayi: sonTipler.filter(sonTip => sonTip === tip).length
    }));

    // En az kullanılanı seç
    const enAzKullanilanTipler = tipSayilari.filter(tip => tip.sayi === Math.min(...tipSayilari.map(t => t.sayi)));

    // Eğer birden fazla en az kullanılan varsa rastgele seç
    const secilenTip = enAzKullanilanTipler[Math.floor(Math.random() * enAzKullanilanTipler.length)];

    console.log('🎨 [VARIETY] Son görevler:', sonTipler, '→ Önerilen tip:', secilenTip.tip);

    return secilenTip.tip;
  }

  /**
   * Görev tipini analiz et
   */
  private analyzeTaskType(gorev: string): string {
    const text = gorev.toLowerCase();

    if (text.includes('say') || text.includes('count') || text.includes('adet')) {
      return text.includes('tüm') || text.includes('saniye içinde') ? 'dinamik-sayma' : 'sayma';
    }

    if (text.includes('tüm') && text.includes('tıkla') && (text.includes('saniye') || text.includes('dakika'))) {
      return 'dinamik-tıklama';
    }

    if (text.includes('bekle') || text.includes('wait') || text.includes('sessiz') || text.includes('dur')) {
      return 'bekleme';
    }

    // Sayı tıklama görevleri
    const sayilar = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const hasSayi = sayilar.some(sayi => text.includes(sayi) && text.includes('tıkla'));
    if (hasSayi) {
      return 'sayı-tıklama';
    }

    // Renk + şekil kombinasyonu
    const renkler = ['kırmızı', 'mavi', 'yeşil', 'sarı', 'mor', 'turuncu'];
    const sekiller = ['daire', 'kare', 'üçgen', 'yıldız', 'kalp', 'elmas'];

    const hasRenk = renkler.some(renk => text.includes(renk));
    const hasSekil = sekiller.some(sekil => text.includes(sekil));

    if (hasRenk && hasSekil) {
      return 'kombinasyon';
    } else if (hasRenk) {
      return 'renk-tıklama';
    } else if (hasSekil) {
      return 'şekil-tıklama';
    }

    return 'renk-tıklama'; // Fallback
  }

  /**
   * Tip için örnek görevler üret
   */
  private getTaskExamplesForType(tip: string, difficulty: 'kolay' | 'orta' | 'zor'): string {
    const ornekler: {[key: string]: {[key: string]: string[]}} = {
      'renk-tıklama': {
        'kolay': [
          '"🔴 Kırmızı butona 2 saniye sonra bas"',
          '"🔵 Mavi daire görünce hemen tıkla"',
          '"🟢 Yeşil rengi gördüğünde bas"'
        ],
        'orta': [
          '"🔴 3 saniye bekle, sonra kırmızı daire tıkla"',
          '"🔵 Mavi renk çıktığında hızlıca bas"',
          '"🟡 Sarı butonu gördüğün anda tıkla"'
        ],
        'zor': [
          '"🔴 Kırmızı hedef çıktığında 1 saniye içinde bas"',
          '"🔵 Mavi objesi belirdiğinde çok hızlı tıkla"',
          '"🟢 Yeşil hedef görünür görünmez bas"'
        ]
      },
      'şekil-tıklama': {
        'kolay': [
          '"⭐ Yıldızı gördüğünde tıkla"',
          '"🔺 Üçgen çıktığında bas"',
          '"⭕ Daire görünce hemen tıkla"'
        ],
        'orta': [
          '"⭐ Yıldız belirdiğinde 2 saniye içinde bas"',
          '"🔺 Üçgen hedefe odaklan ve tıkla"',
          '"💎 Elmas şeklini gördüğünde bas"'
        ],
        'zor': [
          '"⭐ Yıldız çıktığında anında tıkla"',
          '"🔺 Üçgen hedefini çok hızlı yakala"',
          '"💎 Elmas görünür görünmez bas"'
        ]
      },
      'sayma': {
        'kolay': [
          '"🔵 Mavi karelerin sayısını bul"',
          '"⭐ Yıldızları say"',
          '"🔴 Kırmızı daireleri hesapla"'
        ],
        'orta': [
          '"🟢 Yeşil üçgenleri dikkatli say"',
          '"🔵 Mavi şekillerin toplam sayısını bul"',
          '"⭐ Sarı yıldızları say ve say"'
        ],
        'zor': [
          '"🔺 Hızlı çıkan kırmızı üçgenleri say"',
          '"🟦 Mavi kareleri çabuk hesapla"',
          '"⭐ Parlayan yıldızları hızla say"'
        ]
      },
      'bekleme': {
        'kolay': [
          '"⏰ 3 saniye sessizce bekle"',
          '"🤫 5 saniye hareketsiz dur"',
          '"⏳ 4 saniye sakin ol"'
        ],
        'orta': [
          '"⏰ 6 saniye bekle, sonra başla"',
          '"🧘 8 saniye nefes al ve bekle"',
          '"⏳ 7 saniye odaklan ve dur"'
        ],
        'zor': [
          '"⏰ 10 saniye tam konsantre bekle"',
          '"🧘 12 saniye hiç hareket etme"',
          '"⏳ 15 saniye mükemmel bekleme"'
        ]
      },
      'kombinasyon': {
        'kolay': [
          '"🔴 Kırmızı daireyi tıkla"',
          '"🔵 Mavi üçgeni bul ve bas"',
          '"🟢 Yeşil kareyi hedefle"'
        ],
        'orta': [
          '"🔴 Kırmızı yıldızı 3 saniye sonra tıkla"',
          '"🔵 Mavi kalbi gördüğünde bas"',
          '"🟡 Sarı elmasını yakala"'
        ],
        'zor': [
          '"🔴 Kırmızı üçgeni çok hızlı yakala"',
          '"🔵 Mavi kareyi anında tıkla"',
          '"🟢 Yeşil yıldızı 1 saniyede bas"'
        ]
      },
      'dinamik-sayma': {
        'kolay': [
          '"15 saniye içinde çıkan mavi daireleri say"',
          '"20 saniye boyunca gelen yıldızları hesapla"',
          '"12 saniye içinde beliren şekilleri say"'
        ],
        'orta': [
          '"25 saniye içinde gelen kırmızı üçgenleri say"',
          '"30 saniye boyunca çıkan mavi kareleri hesapla"',
          '"20 saniye içinde beliren yeşil daireleri say"'
        ],
        'zor': [
          '"35 saniye içinde hızlı çıkan hedefleri say"',
          '"40 saniye boyunca değişken objeleri hesapla"',
          '"30 saniye içinde karışık şekilleri say"'
        ]
      },
      'dinamik-tıklama': {
        'kolay': [
          '"20 saniye içinde tüm 🔵 mavi daireleri tıkla"',
          '"25 saniye içinde tüm 🟡 sarı yıldızları tıkla"',
          '"15 saniye içinde tüm 🟢 yeşil kareleri tıkla"'
        ],
        'orta': [
          '"35 saniye içinde tüm 🔺 kırmızı üçgenleri tıkla"',
          '"40 saniye içinde tüm 🟦 mavi kareleri tıkla"',
          '"30 saniye içinde tüm 🟢 yeşil daireleri tıkla"'
        ],
        'zor': [
          '"50 saniye içinde tüm 🔺 kırmızı üçgenleri tıkla"',
          '"60 saniye içinde tüm 🟡 sarı yıldızları tıkla"',
          '"45 saniye içinde tüm 💜 mor kalpleri tıkla"'
        ]
      },
      'sayı-tıklama': {
        'kolay': [
          '"3️⃣ 3 sayısını gördüğünde tıkla"',
          '"5️⃣ 5 rakamına bas"',
          '"2️⃣ 2 sayısını yakala"'
        ],
        'orta': [
          '"7️⃣ 7 rakamını 2 saniye sonra tıkla"',
          '"4️⃣ 4 sayısını hızlıca yakala"',
          '"6️⃣ 6 rakamını gördüğünde bas"'
        ],
        'zor': [
          '"9️⃣ 9 sayısını çok hızlı yakala"',
          '"8️⃣ 8 rakamını anında tıkla"',
          '"1️⃣ 1 sayısını görür görmez bas"'
        ]
      }
    };

    const tipOrnekleri = ornekler[tip]?.[difficulty] || ornekler['renk-tıklama'][difficulty];
    return tipOrnekleri.join('\n');
  }


  /**
   * 12 yaş ADHD çocuklara özel prompt oluşturma
   */
  private buildAttentionSprintPrompt(
    performans: AttentionSprintPerformance,
    studentAge: number,
    difficulty: 'kolay' | 'orta' | 'zor',
    onerilenTip: string,
    emotionData?: string
  ): string {
    const performansMetni = this.formatPerformanceForPrompt(performans);
    const tipOrnekleri = this.getTaskExamplesForType(onerilenTip, difficulty);

    const fullPrompt = `ADHD'li 12 yaş çocuk için Dikkat Sprintleri görevi üret. SADECE JSON döndür.

ÖNERİLEN GÖREV TİPİ: ${onerilenTip} (çeşitlilik için)

TİP BAZLI ÖRNEKLER:
${tipOrnekleri}

HEDEF KITLE:
- Yaş: 12 (ortaokul seviyesi)
- ADHD özellik: Kısa dikkat süresi, hiperaktivite, impulse kontrol zorluğu
- Motivasyon: Görsel ödüller, hızlı geri bildirim, başarı hissi

${emotionData ? `KAMERA VERİSİ - TÜM DUYGUSAL DURUMLAR (Oyun süresince):
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

Bu analizlere göre en uygun görev stratejisini belirle:

Bu analizine göre çocuğun mevcut duygusal durumuna uygun görev üret:
- Mutlu/heyecanlı ise: Momentum sürdürecek, biraz daha zorlayıcı görevler
- Kafa karışık/yorgun ise: Basit, net talimatlar, daha az dikkat dağıtıcı
- Odaklanmış ise: Bu durumu koruyacak dengeli görevler
- Stresli/sinirli ise: Sakinleştirici, pozitif, başarıya odaklı görevler

İpuçlarını da bu duygusal duruma göre ayarla.` : ''}

GÖREV KURALLARI:
- Süre: 30-60 saniye (ADHD için kısa)
- Tek odak: Sadece 1 şey yap (çoklu görev yok)
- Net talimat: Basit, anlaşılır komutlar
- Görsel zengin: Renkler, şekiller, emojiler kullan
- Olumlu dil: "Yapma" yerine "Yap" kalıbı
- Duygu durumuna uygun ipuçları ve zorluk seviyesi ayarla
${onerilenTip === 'sayma' ? '- ÖNEMLİ: SADECE SAYMA GÖREVİ ÜRETİN! "tıkla", "bas", "yakala" gibi eylemler YOK. Sadece "say", "hesapla", "bul" kullanın.' : ''}

ZORLUK SEVİYESİ: ${difficulty}

PERFORMANS ÖZETİ:
${performansMetni}

${performans.attentionMetrics ? `
DETAYLI DİKKAT METRİKLERİ:
- Oyun süresi: ${performans.attentionMetrics.totalGameTime.toFixed(1)}s
- Ekrana bakma: %${performans.attentionMetrics.screenLookingPercentage.toFixed(1)}
- Dikkat skoru: ${performans.attentionMetrics.attentionScore.toFixed(1)}/100
- Baskın duygu: ${performans.attentionMetrics.dominantEmotion}
- Dikkat dağılması: ${performans.attentionMetrics.distractionEvents} kez
- Emotion dağılımı: ${performans.attentionMetrics.emotionStats.map(s => `${s.emotion}(${s.percentage.toFixed(1)}%)`).join(', ')}

Bu metrikleri de göz önünde bulundurarak çocuğun GERÇEK odaklanma seviyesini sen belirle:
- Başarı oranı + Dikkat skoru + Ekrana bakma + Emotion pattern + Dikkat dağılması
- "yuksek", "orta" veya "dusuk" olarak değerlendir
` : ''}

ÇIKTI ŞEMASI:
{
  "gorev": string, // ÖRNERİLEN TİPE GÖRE: ${onerilenTip === 'sayma' ? '"🔴 Kırmızı daireleri say"' : '"3 saniye bekle, sonra 🔴 kırmızı daire tıkla"'}
  "sure_saniye": number, // 30-60 arası
  "ipuclari": [string], // Max 2 ipucu, kısa ve net, duygusal duruma uygun
  "hedefRenk": string, // Varsa: "kırmızı", "mavi" vs
  "hedefSayi": number, // Varsa: sayma görevi için
  "hedefSekil": string, // Varsa: "daire", "kare" vs
  "dikkatDagitici": number, // 0-1 arası (0=yok, 1=maksimum)

  // EMOTION ANALİZİNE GÖRE OYUN PARAMETRELERİ:
  "gameParams": {
    "spawnInterval": number, // 1500-4000ms - Kısa attention span = düşük değer, confused'dan kaçın
    "objectLifespan": number, // 3000-8000ms - Yavaş reaction = yüksek değer, stressed ise uzat
    "targetRatio": number, // 0.3-0.8 - Düşük frustration tolerance = yüksek ratio (kolay)
    "visualComplexity": number, // 0.2-1.0 - Confused/overwhelmed ise düşür, happy/confident ise artır
    "feedbackFrequency": number // 0.5-3.0 - Low motivation = sık feedback, high confidence = az feedback
  }
}

12 YAŞ İÇİN GÖREV ÖRNEKLERİ (ÖNERİLEN TİP: ${onerilenTip}):
${onerilenTip === 'sayma' ?
`- "🔴 Kırmızı daireleri say"
- "🟢 Yeşil kareleri hesapla"
- "⭐ Yıldızların sayısını bul"
- "🔵 Mavi şekilleri say"
- "🟡 Sarı objeleri hesapla"` :
`- "🔴 Kırmızı butona 2 saniye sonra bas"
- "🟢 Yeşil kareler sayısını bul"
- "👀 Mavi ⭐ yıldızları takip et"
- "⏰ 5 saniye sessizce bekle"
- "🎯 Ortadaki hedefe odaklan"`}

YAPMA:
- Uzun açıklamalar
- Karmaşık çoklu adımlar
- Olumsuz kelimeler
- Soyut kavramlar

ZORUNLU KURALLAR DİNAMİK TIKLAMA İÇİN:
- Süre MUTLAKA belirt: "30 saniye içinde" formatında
- Renk MUTLAKA emoji ile: 🔴 kırmızı, 🔵 mavi, 🟢 yeşil, 🟡 sarı
- Şekil MUTLAKA spesifik: daire, kare, üçgen, yıldız, kalp, elmas
- Örnek: "45 saniye içinde tüm 🔵 mavi daireleri tıkla"
- "hedefRenk" ve "hedefSekil" alanları MUTLAKA doldur`;

    // AI'A GİDEN GERÇEK PROMPT'U CONSOLE'A YAZDIR
    console.log('🤖 [AI PROMPT] =============================================================================');
    console.log(fullPrompt);
    console.log('🤖 [AI PROMPT END] ========================================================================');

    return fullPrompt;
  }

  /**
   * Performans verisini prompt için formatla
   */
  private formatPerformanceForPrompt(performans: AttentionSprintPerformance): string {
    const { son3Tur, basariOrani, ortalamaReaksiyonSuresi, odaklanmaDurumu, sayiGorevPerformansi } = performans;

    const turlar = son3Tur.map((tur, i) =>
      `Tur ${i+1}: ${tur.basari ? 'Başarılı' : 'Başarısız'} - ${tur.sure}s - ${tur.zorluk}`
    ).join('\n');

    // Hedef yakalama metriklerini ekle
    let hedefMetrikleri = '';
    if (sayiGorevPerformansi &&
        sayiGorevPerformansi.hedefYakalamaOrani !== undefined &&
        sayiGorevPerformansi.toplamHedefSayisi !== undefined) {
      hedefMetrikleri = `

HEDEF YAKALAMA METRİKLERİ:
- Hedef Yakalama Oranı: ${Math.round((sayiGorevPerformansi.hedefYakalamaOrani || 0) * 100)}%
- Yakalanan Hedefler: ${sayiGorevPerformansi.yakalinanHedefSayisi || 0}/${sayiGorevPerformansi.toplamHedefSayisi || 0}
- Yanlış Tıklamalar: ${sayiGorevPerformansi.yanlisTiklamaSayisi || 0}

HIZLI TIKLAMA ANALİZİ (ADHD İÇİN ÖNEMLİ) - KÜMÜLATIF PERFORMANS:
- Genel Hızlı Tıklama Oranı: ${sayiGorevPerformansi.hizliTiklamaOrani ? Math.round(sayiGorevPerformansi.hizliTiklamaOrani * 100) : 0}% (3 saniye altı)
- Toplam Hızlı Tıklamalar: ${sayiGorevPerformansi.hizliTiklamaSayisi || 0}/${sayiGorevPerformansi.toplamTiklamaSayisi || 0}
- Toplam Hızlı+Doğru Tıklamalar: ${sayiGorevPerformansi.hizliVeDogruTiklamalar || 0}
- Genel Hızlı Tıklama Doğruluğu: ${sayiGorevPerformansi.hizliTiklamaDogrulukOrani ? Math.round(sayiGorevPerformansi.hizliTiklamaDogrulukOrani * 100) : 0}%

SON ROUND HIZLI TIKLAMA PERFORMANSI:
- Son Round Hızlı Tıklama Oranı: ${sayiGorevPerformansi.sonRoundHizliTiklamaOrani ? Math.round(sayiGorevPerformansi.sonRoundHizliTiklamaOrani * 100) : 0}%
- Son Round Hızlı Tıklamalar: ${sayiGorevPerformansi.sonRoundHizliTiklamaSayisi || 0}/${sayiGorevPerformansi.sonRoundToplamTiklamaSayisi || 0}
- Son Round Hızlı+Doğru: ${sayiGorevPerformansi.sonRoundHizliVeDogruTiklamalar || 0}
- Son Round Hızlı Tıklama Doğruluğu: ${sayiGorevPerformansi.sonRoundHizliTiklamaDogrulukOrani ? Math.round(sayiGorevPerformansi.sonRoundHizliTiklamaDogrulukOrani * 100) : 0}%`;
    }

    return `Son 3 Tur:
${turlar}

Genel Durum:
- Başarı Oranı: ${Math.round(basariOrani * 100)}%
- Ortalama Reaksiyon: ${ortalamaReaksiyonSuresi.toFixed(1)}s
- Odaklanma: ${odaklanmaDurumu}${hedefMetrikleri}`;
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

      // Validasyon ve düzeltme
      const task = {
        id: `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        gorev: parsed.gorev,
        sure_saniye: Math.max(30, Math.min(60, parsed.sure_saniye || 45)),
        ipuclari: Array.isArray(parsed.ipuclari) ? parsed.ipuclari.slice(0, 2) : [],
        hedefRenk: parsed.hedefRenk || undefined,
        hedefSayi: parsed.hedefSayi || undefined,
        hedefSekil: parsed.hedefSekil || undefined,
        dikkatDagitici: Math.max(0, Math.min(1, parsed.dikkatDagitici || 0)),
        difficulty,
        hedefTipi: this.determineTargetType(parsed)
      };

      // Görev-hedef uyum kontrolü
      const correctedTask = this.validateAndCorrectTask(task);

      console.log('🔍 [AI TASK] Orijinal görev:', parsed);
      console.log('✅ [AI TASK] Düzeltilmiş görev:', correctedTask);

      return correctedTask;
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
      difficulty,
      hedefTipi: selectedTask.hedefRenk ? 'renk' : selectedTask.hedefSekil ? 'sekil' : selectedTask.hedefSayi ? 'sayi' : 'genel'
    };
  }

  /**
   * Hedef tipini belirle
   */
  private determineTargetType(parsed: any): 'renk' | 'sekil' | 'sayi' | 'genel' {
    if (parsed.hedefRenk && parsed.hedefSekil) return 'renk'; // Karma hedef - renk kategorisi
    if (parsed.hedefRenk) return 'renk';
    if (parsed.hedefSekil) return 'sekil';
    if (parsed.hedefSayi) return 'sayi';
    return 'genel';
  }

  /**
   * Görev-hedef uyumunu kontrol et ve düzelt
   */
  private validateAndCorrectTask(task: AttentionSprintTask): AttentionSprintTask {
    const gorevText = task.gorev.toLowerCase();

    // Görev metninden hedefleri çıkar
    const detectedColors = ['kırmızı', 'mavi', 'yeşil', 'sarı', 'mor', 'turuncu'].find(color =>
      gorevText.includes(color)
    );
    const detectedShapes = ['yıldız', 'daire', 'kare', 'üçgen', 'kalp', 'elmas'].find(shape =>
      gorevText.includes(shape)
    );

    // Süre sayısını hedef sayısından ayır - sadece hedef sayma görevleri için
    let detectedNumbers = null;
    // "5 tane kırmızı" veya "3 adet mavi" gibi sayma görevleri
    if (gorevText.includes('tane') || gorevText.includes('adet') || gorevText.includes('say')) {
      const numberMatch = gorevText.match(/(\d+)\s*(tane|adet|say)/);
      detectedNumbers = numberMatch ? parseInt(numberMatch[1]) : null;
    }
    // "3 numarası" veya "5 rakamı" gibi direkt sayı hedefleri
    else if (gorevText.includes('numar') || gorevText.includes('rakam')) {
      const numberMatch = gorevText.match(/(\d+)\s*(numar|rakam)/);
      detectedNumbers = numberMatch ? parseInt(numberMatch[1]) : null;
    }

    console.log('🔍 [TEXT ANALYSIS]', {
      görev: task.gorev,
      detectedColors,
      detectedShapes,
      detectedNumbers,
      originalTask: { hedefRenk: task.hedefRenk, hedefSekil: task.hedefSekil, hedefSayi: task.hedefSayi }
    });

    // Düzeltme uygula
    const corrected = { ...task };

    // Karma hedef kontrolü (renk + şekil)
    if (detectedColors && detectedShapes) {
      console.log(`🔧 [TASK FIX] Karma hedef: ${detectedColors} ${detectedShapes}`);
      corrected.hedefRenk = detectedColors;
      corrected.hedefSekil = detectedShapes;
      corrected.hedefSayi = undefined; // Sayı temizle
      // Hedef sayıları temizle ama süre sayılarını koru ("30 saniye" gibi)
      corrected.gorev = corrected.gorev.replace(/(\d+)\s*(tane|adet)/g, '').replace(/\s+/g, ' ').trim();
    }
    // Sadece renk
    else if (detectedColors && !detectedShapes) {
      console.log(`🔧 [TASK FIX] Sadece renk: ${detectedColors}`);
      corrected.hedefRenk = detectedColors;
      corrected.hedefSekil = undefined;
      corrected.hedefSayi = undefined;
      // Görev metnindeki sayıları da temizle
      corrected.gorev = corrected.gorev.replace(/(\d+)\s*(tane|adet)/g, '').replace(/\s+/g, ' ').trim();
    }
    // Sadece şekil
    else if (detectedShapes && !detectedColors) {
      console.log(`🔧 [TASK FIX] Sadece şekil: ${detectedShapes}`);
      corrected.hedefSekil = detectedShapes;
      corrected.hedefRenk = undefined;
      corrected.hedefSayi = undefined;
      // Görev metnindeki sayıları da temizle
      corrected.gorev = corrected.gorev.replace(/(\d+)\s*(tane|adet)/g, '').replace(/\s+/g, ' ').trim();
    }

    // Sayı düzeltmesi (sadece gerçek hedef sayı görevleri için)
    if (detectedNumbers && (!task.hedefSayi || task.hedefSayi !== detectedNumbers)) {
      console.log(`🔧 [TASK FIX] Sayı düzeltmesi: ${task.hedefSayi} → ${detectedNumbers}`);
      corrected.hedefSayi = detectedNumbers;
      corrected.hedefRenk = undefined;
      corrected.hedefSekil = undefined;
    }
    // Eğer AI yanlışlıkla süre sayısını hedef sayısı yapmışsa temizle
    else if (task.hedefSayi && !detectedNumbers && (detectedColors || detectedShapes)) {
      console.log(`🔧 [TASK FIX] Yanlış sayı temizleme: hedefSayi ${task.hedefSayi} silindi`);
      corrected.hedefSayi = undefined;
      // Görev metnindeki sayıları da temizle
      corrected.gorev = corrected.gorev.replace(/(\d+)\s*(tane|adet)/g, '').replace(/\s+/g, ' ').trim();
    }

    return corrected;
  }

  /**
   * Sayı görevi performansı değerlendirmesi
   */
  private evaluateNumberTaskPerformance(
    sayiPerformans: NonNullable<AttentionSprintPerformance['sayiGorevPerformansi']>,
    son3Tur: AttentionSprintPerformance['son3Tur']
  ): { zorlukArtisi: number, onerilen: 'kolay' | 'orta' | 'zor' } {
    const { ortalamaSayiZorlugu, sayiBasariOrani, ortalamaReaksiyonSuresiSayi, hizliCozumSayisi } = sayiPerformans;

    // Son sayı görevlerini analiz et
    const sayiGorevleri = son3Tur.filter(tur => tur.hedefTipi === 'sayi');
    const enSonSayiGorevi = sayiGorevleri[sayiGorevleri.length - 1];

    let zorlukArtisi = 0;
    let onerilen: 'kolay' | 'orta' | 'zor' = 'orta';

    // Çok hızlı çözüm - büyük atlama
    if (hizliCozumSayisi >= 2 && ortalamaReaksiyonSuresiSayi < 2) {
      zorlukArtisi = 3;
      onerilen = 'zor';
    }
    // Hızlı ve başarılı - orta atlama
    else if (sayiBasariOrani >= 0.8 && ortalamaReaksiyonSuresiSayi < 4) {
      zorlukArtisi = 2;
      onerilen = ortalamaSayiZorlugu < 5 ? 'orta' : 'zor';
    }
    // Normal iyi performans - küçük atlama
    else if (sayiBasariOrani >= 0.6 && ortalamaReaksiyonSuresiSayi < 6) {
      zorlukArtisi = 1;
      onerilen = 'orta';
    }
    // Zorlanıyor - basitleştir
    else if (sayiBasariOrani < 0.5 || ortalamaReaksiyonSuresiSayi > 8) {
      zorlukArtisi = -1;
      onerilen = 'kolay';
    }

    return { zorlukArtisi, onerilen };
  }

  /**
   * Sayı görevi zorluk seviyesi belirleme
   */
  private determineNumberDifficulty(
    currentDifficulty: 'kolay' | 'orta' | 'zor',
    performans: AttentionSprintPerformance,
    zorlukArtisi: number
  ): { min: number, max: number } {
    // Mevcut seviye
    const currentLevel = currentDifficulty === 'kolay' ? 1 : currentDifficulty === 'orta' ? 2 : 3;

    // Yeni seviye hesapla
    const newLevel = Math.max(1, Math.min(3, currentLevel + zorlukArtisi));

    // Sayı aralıkları
    const ranges = {
      1: { min: 1, max: 3 },    // Çok kolay: 1-3
      2: { min: 2, max: 5 },    // Kolay: 2-5
      3: { min: 3, max: 7 },    // Orta: 3-7
      4: { min: 5, max: 9 }     // Zor: 5-9
    };

    return ranges[Math.min(4, newLevel)] || ranges[2];
  }
}

export const attentionSprintGenerator = new AttentionSprintGenerator();
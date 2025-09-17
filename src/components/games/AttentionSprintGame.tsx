import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { AttentionSprintTask, AttentionSprintPerformance, EmotionResult } from '../../types';
import { attentionSprintGenerator } from '../../services/attentionSprintGenerator';
import { Clock, Target, Zap, RotateCcw, Star, Brain, Play, Pause } from 'lucide-react';

interface AttentionSprintGameProps {
  studentId: string;
  studentAge?: number;
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

interface SprintRound {
  task: AttentionSprintTask;
  startTime: number;
  endTime?: number;
  success: boolean;
  reactionTime: number;
}

export const AttentionSprintGame: React.FC<AttentionSprintGameProps> = ({
  studentId,
  studentAge = 12,
  onGameComplete,
  onEmotionDetected
}) => {
  const [currentTask, setCurrentTask] = useState<AttentionSprintTask | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'active' | 'waiting' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [rounds, setRounds] = useState<SprintRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const [gameStartTime] = useState(Date.now());
  const [countdown, setCountdown] = useState(3);
  const [showTarget, setShowTarget] = useState(false);
  const [targetClicked, setTargetClicked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [distractors, setDistractors] = useState<{id: string, x: number, y: number, type: string, value: string}[]>([]);

  // Sayma modu için state'ler
  const [isCountingMode, setIsCountingMode] = useState(false);
  const [countingObjects, setCountingObjects] = useState<{
    id: string,
    x: number,
    y: number,
    value: string,
    isTarget: boolean,
    createdAt: number,
    lifespan: number
  }[]>([]);
  const [userCount, setUserCount] = useState('');
  const [totalTargetCount, setTotalTargetCount] = useState(0);
  const [countingStartTime, setCountingStartTime] = useState(0);

  // Dinamik tıklama modu için state'ler
  const [isClickingMode, setIsClickingMode] = useState(false);
  const [clickingObjects, setClickingObjects] = useState<{
    id: string,
    x: number,
    y: number,
    value: string,
    isTarget: boolean,
    createdAt: number,
    lifespan: number
  }[]>([]);
  const [correctClicks, setCorrectClicks] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [totalSpawned, setTotalSpawned] = useState(0);

  // Son görevleri takip et (çeşitlilik için)
  const [sonGorevler, setSonGorevler] = useState<string[]>([]);

  const roundStartTimeRef = useRef<number>(0);
  const hasGeneratedFirstTask = useRef(false);
  const isGeneratingRef = useRef(false);
  const isEndingRound = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalRounds = 5;

  /**
   * Görev metninden hedef zamanlamayı çıkar
   */
  const extractTargetTiming = (gorevText: string): number | null => {
    // "3 saniye sonra" → 3
    // "5 saniye bekle" → 5
    // "2 saniye sonra tıkla" → 2
    const pattern = /(\d+)\s*saniye/i;
    const match = gorevText.match(pattern);
    return match ? parseInt(match[1]) : null;
  };

  // İlk görevi yükle
  useEffect(() => {
    if (!hasGeneratedFirstTask.current && !isGenerating) {
      hasGeneratedFirstTask.current = true;
      generateFirstTask();
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  /**
   * İlk görevi üret (varsayılan performans ile)
   */
  const generateFirstTask = useCallback(async () => {
    if (isGeneratingRef.current) {
      console.log('🔄 [ATTENTION SPRINT] İlk görev üretimi zaten devam ediyor, atlanıyor...');
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);

    const initialPerformance: AttentionSprintPerformance = {
      son3Tur: [],
      ortalamaReaksiyonSuresi: 2.5,
      basariOrani: 0.7,
      odaklanmaDurumu: 'orta'
    };

    try {
      const task = await attentionSprintGenerator.generateAttentionSprint({
        performansOzeti: initialPerformance,
        studentAge,
        sonGorevler: [] // İlk görev için boş liste
      });

      setCurrentTask(task);
      setTimeLeft(task.sure_saniye);

      // Son görevleri güncelle
      setSonGorevler(prev => {
        const yeniListe = [task.gorev, ...prev];
        return yeniListe.slice(0, 5); // Son 5 görevi tut
      });
    } catch (error) {
      console.error('İlk görev üretme hatası:', error);
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [studentAge]);

  const roundsRef = useRef<SprintRound[]>([]);

  // rounds state'ini güncellediğimizde ref'i de güncelle
  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  /**
   * Performansa göre yeni görev üret
   */
  const generateNextTask = useCallback(async () => {
    if (isGeneratingRef.current) {
      console.log('🔄 [ATTENTION SPRINT] Sonraki görev üretimi zaten devam ediyor, atlanıyor...');
      return;
    }

    console.log('🎯 [ATTENTION SPRINT] Yeni görev üretimi başlıyor...');
    isGeneratingRef.current = true;
    setIsGenerating(true);

    // Ref'ten güncel rounds değerini al
    const currentRounds = roundsRef.current;

    // Son 3 turu al - gelişmiş performans verileriyle
    const son3Tur = currentRounds.slice(-3).map(round => {
      const hedefZaman = extractTargetTiming(round.task.gorev);
      const zamanlamaSapmasi = hedefZaman ? Math.abs(round.reactionTime - hedefZaman) : 0;

      return {
        basari: round.success,
        sure: round.reactionTime,
        zorluk: round.task.difficulty,
        hedefTipi: round.task.hedefTipi,
        hedefSayi: round.task.hedefSayi,
        hizliCozum: round.success && round.reactionTime < 3,
        zamanlamaSapmasi: zamanlamaSapmasi,
        hedefZaman: hedefZaman
      };
    });

    // Performans hesapla
    const basariOrani = currentRounds.length > 0 ? currentRounds.filter(r => r.success).length / currentRounds.length : 0.7;
    const ortalamaReaksiyonSuresi = currentRounds.length > 0
      ? currentRounds.reduce((sum, r) => sum + r.reactionTime, 0) / currentRounds.length
      : 2.5;

    // Odaklanma durumu belirleme
    let odaklanmaDurumu: 'yuksek' | 'orta' | 'dusuk' = 'orta';
    if (basariOrani >= 0.8 && ortalamaReaksiyonSuresi < 2) {
      odaklanmaDurumu = 'yuksek';
    } else if (basariOrani < 0.5 || ortalamaReaksiyonSuresi > 4) {
      odaklanmaDurumu = 'dusuk';
    }

    // Zamanlama görevleri için özel performans analizi
    const zamanlamaGorevleri = currentRounds.filter(r => {
      const hedefZaman = extractTargetTiming(r.task.gorev);
      return hedefZaman !== null;
    });

    const zamanlamaPerformansi = zamanlamaGorevleri.length > 0 ? {
      ortalamaSapma: zamanlamaGorevleri.reduce((sum, r) => {
        const hedefZaman = extractTargetTiming(r.task.gorev);
        const sapma = hedefZaman ? Math.abs(r.reactionTime - hedefZaman) : 0;
        return sum + sapma;
      }, 0) / zamanlamaGorevleri.length,

      sapmaStandartSapma: (() => {
        const sapmalar = zamanlamaGorevleri.map(r => {
          const hedefZaman = extractTargetTiming(r.task.gorev);
          return hedefZaman ? Math.abs(r.reactionTime - hedefZaman) : 0;
        });
        const ortalama = sapmalar.reduce((sum, sapma) => sum + sapma, 0) / sapmalar.length;
        const varyans = sapmalar.reduce((sum, sapma) => sum + Math.pow(sapma - ortalama, 2), 0) / sapmalar.length;
        return Math.sqrt(varyans);
      })(),

      idealZamanlamaOrani: zamanlamaGorevleri.filter(r => {
        const hedefZaman = extractTargetTiming(r.task.gorev);
        const sapma = hedefZaman ? Math.abs(r.reactionTime - hedefZaman) : Infinity;
        return sapma <= 1; // ±1 saniye içinde
      }).length / zamanlamaGorevleri.length,

      zamanlamaBasariOrani: zamanlamaGorevleri.filter(r => r.success).length / zamanlamaGorevleri.length

    } : undefined;

    // Sayı görevleri için özel performans analizi
    const sayiGorevleri = currentRounds.filter(r => r.task.hedefTipi === 'sayi');
    const sayiGorevPerformansi = sayiGorevleri.length > 0 ? {
      ortalamaSayiZorlugu: sayiGorevleri.reduce((sum, r) => sum + (r.task.hedefSayi || 1), 0) / sayiGorevleri.length,
      sayiBasariOrani: sayiGorevleri.filter(r => r.success).length / sayiGorevleri.length,
      ortalamaReaksiyonSuresiSayi: sayiGorevleri.reduce((sum, r) => sum + r.reactionTime, 0) / sayiGorevleri.length,
      hizliCozumSayisi: sayiGorevleri.filter(r => r.success && r.reactionTime < 3).length
    } : undefined;

    const performance: AttentionSprintPerformance = {
      son3Tur,
      ortalamaReaksiyonSuresi,
      basariOrani,
      odaklanmaDurumu,
      zamanlamaPerformansi,
      sayiGorevPerformansi
    };

    console.log('📊 [ADAPTIVE PERFORMANCE]', {
      genel: { basariOrani, ortalamaReaksiyonSuresi, odaklanmaDurumu },
      zamanlama: zamanlamaPerformansi,
      sayiGorevleri: sayiGorevPerformansi,
      son3Tur: son3Tur
    });

    try {
      console.log('🔍 [TASK GENERATION] Mevcut son görevler:', sonGorevler);

      const task = await attentionSprintGenerator.generateAttentionSprint({
        performansOzeti: performance,
        studentAge,
        sonGorevler: sonGorevler
      });

      console.log('🎯 [TASK DEBUG] Üretilen görev:', {
        gorev: task.gorev,
        hedefRenk: task.hedefRenk,
        hedefSekil: task.hedefSekil,
        hedefSayi: task.hedefSayi,
        dikkatDagitici: task.dikkatDagitici
      });

      setCurrentTask(task);
      setTimeLeft(task.sure_saniye);

      // Son görevleri güncelle (en fazla 5 görev tutuyoruz)
      setSonGorevler(prev => {
        const yeniListe = [task.gorev, ...prev];
        console.log('📝 [TASK HISTORY] Görev geçmişi güncellendi:', yeniListe);
        return yeniListe.slice(0, 5); // Son 5 görevi tut
      });

      console.log('✅ [ATTENTION SPRINT] Yeni görev hazır:', task.gorev);
    } catch (error) {
      console.error('Görev üretme hatası:', error);
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [studentAge]);

  /**
   * Oyunu başlat
   */
  const startRound = () => {
    if (!currentTask) return;

    setGameState('countdown');
    setCountdown(3);
    setShowTarget(false);
    setTargetClicked(false);

    // Geri sayım
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startTask();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Timer'ı başlat
   */
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    roundStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          endRound(false); // Süre bitti, başarısız
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Rastgele pozisyon üret
   */
  const generateRandomPosition = () => ({
    x: Math.random() * 70 + 15, // %15-85 arası
    y: Math.random() * 60 + 20  // %20-80 arası
  });

  /**
   * Yanıltıcı öğeler üret
   */
  const generateDistractors = () => {
    if (!currentTask) return [];

    const count = Math.floor(currentTask.dikkatDagitici * 5); // 0-5 arası
    const distractorList = [];

    for (let i = 0; i < count; i++) {
      const position = generateRandomPosition();
      let type = 'shape';
      let value = '⚫';

      // Görev tipine göre yanıltıcı seç
      if (currentTask.hedefRenk && currentTask.hedefSekil) {
        // Karma hedef (renk + şekil) - hedefle aynı rengi KULLANMA
        type = 'combo';
        const targetColor = currentTask.hedefRenk;
        let comboOptions: string[] = [];

        if (targetColor === 'mavi') {
          comboOptions = ['🔴', '🟢', '🟡', '🟠', '🟣', '⭐', '⭕', '⬜', '🔺', '❤️', '💎']; // Mavi hariç
        } else if (targetColor === 'kırmızı') {
          comboOptions = ['🔵', '🟢', '🟡', '🟠', '🟣', '⭐', '⭕', '⬜', '🔺', '❤️', '💎']; // Kırmızı hariç
        } else if (targetColor === 'yeşil') {
          comboOptions = ['🔴', '🔵', '🟡', '🟠', '🟣', '⭐', '⭕', '⬜', '🔺', '❤️', '💎']; // Yeşil hariç
        } else if (targetColor === 'sarı') {
          comboOptions = ['🔴', '🔵', '🟢', '🟠', '🟣', '⭐', '⭕', '⬜', '🔺', '❤️', '💎']; // Sarı hariç
        } else {
          comboOptions = ['🔴', '🔵', '🟢', '🟡', '🟠', '🟣', '⭐', '⭕', '⬜', '🔺', '❤️', '💎'];
        }

        value = comboOptions[Math.floor(Math.random() * comboOptions.length)];
      } else if (currentTask.hedefRenk) {
        type = 'color';
        const colors = ['🔴', '🔵', '🟢', '🟡', '🟠', '🟣'].filter(c => {
          const colorMap: {[key: string]: string} = {
            '🔴': 'kırmızı', '🔵': 'mavi', '🟢': 'yeşil',
            '🟡': 'sarı', '🟠': 'turuncu', '🟣': 'mor'
          };
          return colorMap[c] !== currentTask.hedefRenk;
        });
        value = colors[Math.floor(Math.random() * colors.length)];
      } else if (currentTask.hedefSekil) {
        type = 'shape';
        const shapes = ['⭐', '⭕', '⬜', '🔺', '❤️', '💎'].filter(s => {
          const shapeMap: {[key: string]: string} = {
            '⭐': 'yıldız', '⭕': 'daire', '⬜': 'kare', '🔺': 'üçgen', '❤️': 'kalp', '💎': 'elmas'
          };
          return shapeMap[s] !== currentTask.hedefSekil;
        });
        value = shapes[Math.floor(Math.random() * shapes.length)];
      } else if (currentTask.hedefSayi) {
        type = 'number';
        const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'].filter((_, idx) =>
          (idx + 1) !== currentTask.hedefSayi
        );
        value = numbers[Math.floor(Math.random() * numbers.length)];
      }

      distractorList.push({
        id: `distractor-${i}`,
        x: position.x,
        y: position.y,
        type,
        value
      });
    }

    return distractorList;
  };

  /**
   * Sayma görevi olup olmadığını kontrol et
   */
  const isCountingTask = (taskDescription: string): boolean => {
    return taskDescription.toLowerCase().includes('say') ||
           taskDescription.toLowerCase().includes('count') ||
           taskDescription.toLowerCase().includes('adet');
  };

  /**
   * Dinamik tıklama görevi olup olmadığını kontrol et
   */
  const isClickingTask = (taskDescription: string): boolean => {
    const text = taskDescription.toLowerCase();
    return (text.includes('tüm') && text.includes('tıkla')) ||
           (text.includes('hepsi') && text.includes('tıkla')) ||
           (text.includes('içinde') && text.includes('tıkla') && (text.includes('saniye') || text.includes('dakika')));
  };

  /**
   * Zorluk seviyesine göre sayma parametreleri
   */
  const getCountingParams = (difficulty: string) => {
    switch (difficulty) {
      case 'kolay':
        return {
          totalObjects: 8,      // Toplam 8 obje
          targetCount: 3,       // 3 tanesi hedef
          spawnInterval: 2000,  // 2 saniyede bir spawn
          objectLifespan: 4000, // 4 saniye yaşam süresi
          spawnDuration: 15000  // 15 saniye boyunca spawn
        };
      case 'orta':
        return {
          totalObjects: 12,
          targetCount: 5,
          spawnInterval: 1500,
          objectLifespan: 3000,
          spawnDuration: 20000
        };
      case 'zor':
        return {
          totalObjects: 16,
          targetCount: 7,
          spawnInterval: 1000,
          objectLifespan: 2000,
          spawnDuration: 25000
        };
      default:
        return {
          totalObjects: 10,
          targetCount: 4,
          spawnInterval: 1800,
          objectLifespan: 3500,
          spawnDuration: 18000
        };
    }
  };

  /**
   * Zorluk seviyesine göre tıklama parametreleri
   */
  const getClickingParams = (difficulty: string) => {
    switch (difficulty) {
      case 'kolay':
        return {
          spawnInterval: 2500,  // 2.5 saniyede bir spawn
          objectLifespan: 5000, // 5 saniye yaşam süresi
          targetRatio: 0.6,     // %60 hedef, %40 yanıltıcı
        };
      case 'orta':
        return {
          spawnInterval: 2000,  // 2 saniyede bir spawn
          objectLifespan: 4000, // 4 saniye yaşam süresi
          targetRatio: 0.5,     // %50 hedef, %50 yanıltıcı
        };
      case 'zor':
        return {
          spawnInterval: 1500,  // 1.5 saniyede bir spawn
          objectLifespan: 3000, // 3 saniye yaşam süresi
          targetRatio: 0.4,     // %40 hedef, %60 yanıltıcı
        };
      default:
        return {
          spawnInterval: 2000,
          objectLifespan: 4000,
          targetRatio: 0.5,
        };
    }
  };

  /**
   * Dinamik tıklama objeler spawn et
   */
  const startClickingSpawn = () => {
    const params = getClickingParams(currentTask?.difficulty || 'orta');
    let spawnIntervalId: NodeJS.Timeout;

    setCorrectClicks(0);
    setWrongClicks(0);
    setTotalSpawned(0);

    const spawnObject = () => {
      const shouldSpawnTarget = Math.random() < params.targetRatio;
      const position = generateRandomPosition();

      // Hedef ve yanıltıcı değerler
      let value = '';
      if (currentTask?.hedefRenk && currentTask?.hedefSekil) {
        if (shouldSpawnTarget) {
          // Karma hedefler - renk + şekil
          if (currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'üçgen') {
            value = '🔹';
          } else if (currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'daire') {
            value = '🟢';
          } else if (currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'daire') {
            value = '🔴';
          } else if (currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'daire') {
            value = '🔵';
          } else if (currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'daire') {
            value = '🟡';
          } else if (currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'üçgen') {
            value = '🔺';
          } else if (currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'kare') {
            value = '🟥';
          } else if (currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'kare') {
            value = '🟦';
          } else if (currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'kare') {
            value = '🟩';
          } else {
            value = '🔴'; // Fallback
          }
        } else {
          // Yanıltıcılar - hedefle aynı renk OLMAYAN objeler
          const targetColor = currentTask.hedefRenk;
          const targetShape = currentTask.hedefSekil;

          let wrongValues: string[] = [];
          if (targetColor === 'mavi') {
            wrongValues = ['🔴', '🟢', '🟡', '🟣', '🟠']; // Mavi hariç renkler
          } else if (targetColor === 'kırmızı') {
            wrongValues = ['🔵', '🟢', '🟡', '🟣', '🟠']; // Kırmızı hariç renkler
          } else if (targetColor === 'yeşil') {
            wrongValues = ['🔴', '🔵', '🟡', '🟣', '🟠']; // Yeşil hariç renkler
          } else if (targetColor === 'sarı') {
            wrongValues = ['🔴', '🔵', '🟢', '🟣', '🟠']; // Sarı hariç renkler
          } else {
            wrongValues = ['🔴', '🔵', '🟢', '🟡', '🔺', '⭕', '⬜', '💎'];
          }

          // Hedefle aynı şekli de ekleyebiliriz ama farklı renkte
          if (targetShape === 'daire' && targetColor !== 'yeşil') wrongValues.push('🟢');
          if (targetShape === 'daire' && targetColor !== 'kırmızı') wrongValues.push('🔴');
          if (targetShape === 'üçgen' && targetColor !== 'kırmızı') wrongValues.push('🔺');
          if (targetShape === 'kare' && targetColor !== 'mavi') wrongValues.push('🟦');

          value = wrongValues[Math.floor(Math.random() * wrongValues.length)];
        }
      } else if (currentTask?.hedefRenk) {
        const colorMap = { 'kırmızı': '🔴', 'mavi': '🔵', 'yeşil': '🟢', 'sarı': '🟡', 'mor': '🟣', 'turuncu': '🟠' };
        if (shouldSpawnTarget) {
          value = colorMap[currentTask.hedefRenk as keyof typeof colorMap] || '🔵';
        } else {
          // Hedef renk HARİCİNDEKİ renkler
          const wrongColors = Object.values(colorMap).filter(c => c !== colorMap[currentTask.hedefRenk as keyof typeof colorMap]);
          value = wrongColors[Math.floor(Math.random() * wrongColors.length)];
        }
      } else if (currentTask?.hedefSekil) {
        const shapeMap = { 'yıldız': '⭐', 'daire': '⭕', 'kare': '⬜', 'üçgen': '🔺', 'kalp': '❤️', 'elmas': '💎' };
        if (shouldSpawnTarget) {
          value = shapeMap[currentTask.hedefSekil as keyof typeof shapeMap] || '🔺';
        } else {
          // Hedef şekil HARİCİNDEKİ şekiller
          const wrongShapes = Object.values(shapeMap).filter(s => s !== shapeMap[currentTask.hedefSekil as keyof typeof shapeMap]);
          value = wrongShapes[Math.floor(Math.random() * wrongShapes.length)];
        }
      }

      const newObject = {
        id: `clicking-${Date.now()}-${Math.random()}`,
        x: position.x,
        y: position.y,
        value,
        isTarget: shouldSpawnTarget,
        createdAt: Date.now(),
        lifespan: params.objectLifespan
      };

      setClickingObjects(prev => [...prev, newObject]);
      setTotalSpawned(prev => prev + 1);

      // Objeyi yaşam süresinden sonra kaldır
      setTimeout(() => {
        setClickingObjects(prev => prev.filter(obj => obj.id !== newObject.id));
      }, params.objectLifespan);
    };

    // İlk objeyi hemen spawn et
    spawnObject();

    // Düzenli spawn
    spawnIntervalId = setInterval(spawnObject, params.spawnInterval);

    // Süre bitiminde spawn'ı durdur
    setTimeout(() => {
      clearInterval(spawnIntervalId);
    }, (currentTask?.sure_saniye || 30) * 1000);
  };

  /**
   * Dinamik objeler spawn et (sayma modu)
   */
  const startCountingSpawn = () => {
    const params = getCountingParams(currentTask?.difficulty || 'orta');
    let spawnedCount = 0;
    let targetSpawnedCount = 0;

    setTotalTargetCount(0); // Reset counter
    setCountingStartTime(Date.now());

    const spawnInterval = setInterval(() => {
      if (spawnedCount >= params.totalObjects) {
        clearInterval(spawnInterval);
        return;
      }

      // Hedef mi yoksa yanıltıcı mı spawn edeceğini karar ver
      const shouldSpawnTarget =
        targetSpawnedCount < params.targetCount &&
        (Math.random() < 0.4 || spawnedCount >= params.totalObjects - (params.targetCount - targetSpawnedCount));

      const isTarget = shouldSpawnTarget;
      if (isTarget) {
        targetSpawnedCount++;
        setTotalTargetCount(prev => prev + 1);
      }

      // Rastgele pozisyon
      const position = generateRandomPosition();

      // Hedef ve yanıltıcı değerler
      let value = '';
      if (currentTask?.hedefRenk && currentTask?.hedefSekil) {
        if (isTarget) {
          // Karma hedefler - renk + şekil
          if (currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'daire') {
            value = '🟢';
          } else if (currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'üçgen') {
            value = '🔹';
          } else if (currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'daire') {
            value = '🔴';
          } else if (currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'daire') {
            value = '🔵';
          } else {
            value = '🔴'; // Fallback
          }
        } else {
          // Yanıltıcılar - hedefle aynı renk OLMAYAN objeler
          const targetColor = currentTask.hedefRenk;
          let wrongValues: string[] = [];

          if (targetColor === 'mavi') {
            wrongValues = ['🔴', '🟢', '🟡', '🟣', '🟠'];
          } else if (targetColor === 'kırmızı') {
            wrongValues = ['🔵', '🟢', '🟡', '🟣', '🟠'];
          } else if (targetColor === 'yeşil') {
            wrongValues = ['🔴', '🔵', '🟡', '🟣', '🟠'];
          } else if (targetColor === 'sarı') {
            wrongValues = ['🔴', '🔵', '🟢', '🟣', '🟠'];
          } else {
            wrongValues = ['🔴', '🔵', '🟢', '🟡'];
          }

          value = wrongValues[Math.floor(Math.random() * wrongValues.length)];
        }
      } else if (currentTask?.hedefRenk) {
        const colorMap = { 'kırmızı': '🔴', 'mavi': '🔵', 'yeşil': '🟢', 'sarı': '🟡', 'mor': '🟣', 'turuncu': '🟠' };
        if (isTarget) {
          value = colorMap[currentTask.hedefRenk as keyof typeof colorMap] || '🟢';
        } else {
          // Hedef renk HARİCİNDEKİ renkler
          const wrongColors = Object.values(colorMap).filter(c => c !== colorMap[currentTask.hedefRenk as keyof typeof colorMap]);
          value = wrongColors[Math.floor(Math.random() * wrongColors.length)];
        }
      } else if (currentTask?.hedefSekil) {
        const shapeMap = { 'yıldız': '⭐', 'daire': '⭕', 'kare': '⬜', 'üçgen': '🔺', 'kalp': '❤️', 'elmas': '💎' };
        if (isTarget) {
          value = shapeMap[currentTask.hedefSekil as keyof typeof shapeMap] || '🔺';
        } else {
          // Hedef şekil HARİCİNDEKİ şekiller
          const wrongShapes = Object.values(shapeMap).filter(s => s !== shapeMap[currentTask.hedefSekil as keyof typeof shapeMap]);
          value = wrongShapes[Math.floor(Math.random() * wrongShapes.length)];
        }
      }

      const newObject = {
        id: `counting-${Date.now()}-${Math.random()}`,
        x: position.x,
        y: position.y,
        value,
        isTarget,
        createdAt: Date.now(),
        lifespan: params.objectLifespan
      };

      setCountingObjects(prev => [...prev, newObject]);

      // Objeyi yaşam süresinden sonra kaldır
      setTimeout(() => {
        setCountingObjects(prev => prev.filter(obj => obj.id !== newObject.id));
      }, params.objectLifespan);

      spawnedCount++;
    }, params.spawnInterval);

    // Spawn süresinden sonra durdur
    setTimeout(() => {
      clearInterval(spawnInterval);
    }, params.spawnDuration);
  };

  /**
   * Görevi başlat
   */
  const startTask = () => {
    if (!currentTask) return;

    const isCountingTask_ = isCountingTask(currentTask.gorev);
    const isClickingTask_ = isClickingTask(currentTask.gorev);

    setIsCountingMode(isCountingTask_);
    setIsClickingMode(isClickingTask_);

    setGameState('active');
    setTimeLeft(currentTask.sure_saniye);

    // DEBUG: Hedef bilgilerini logla
    console.log('🔍 [HEDEF DEBUG]', {
      gorev: currentTask.gorev,
      hedefRenk: currentTask.hedefRenk,
      hedefSekil: currentTask.hedefSekil,
      hedefSayi: currentTask.hedefSayi,
      hedefTipi: currentTask.hedefTipi,
      isCountingMode: isCountingTask_,
      isClickingMode: isClickingTask_
    });

    if (isCountingTask_) {
      // Sayma modu
      startCountingSpawn();
      startTimer();
    } else if (isClickingTask_) {
      // Dinamik tıklama modu
      startClickingSpawn();
      startTimer();
    } else {
      // Normal tek tıklama modu
      setTargetPosition(generateRandomPosition());
      setDistractors(generateDistractors());

      if (currentTask.hedefRenk || currentTask.hedefSekil || currentTask.hedefSayi) {
        const delay = Math.random() * 2000 + 1000;
        setTimeout(() => {
          setShowTarget(true);
          startTimer();
        }, delay);
      } else {
        setShowTarget(true);
        startTimer();
      }
    }
  };

  /**
   * Hedefe tıklama
   */
  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Oyun alanına tıklama eventini engelle
    if (gameState !== 'active' || !showTarget || targetClicked) return;

    setTargetClicked(true);
    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;
    endRound(true, reactionTime);
  };

  /**
   * Yanıltıcı öğeye tıklama
   */
  const handleDistractorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState !== 'active' || targetClicked) return;

    // Yanlış hedefe tıklandı
    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;
    endRound(false, reactionTime);
  };

  /**
   * Oyun alanına (yanlış yere) tıklama
   */
  const handleGameAreaClick = () => {
    if (gameState !== 'active' || !showTarget || targetClicked || isCountingMode) return;

    // Yanlış yere tıklandı, görev başarısız
    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;
    endRound(false, reactionTime);
  };

  /**
   * Sayma cevabını kontrol et
   */
  const handleCountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCountingMode || userCount.trim() === '') return;

    const countAnswer = parseInt(userCount);
    const isCorrect = countAnswer === totalTargetCount;
    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;

    console.log('🔢 [COUNTING RESULT]', {
      userAnswer: countAnswer,
      correctAnswer: totalTargetCount,
      isCorrect,
      reactionTime
    });

    endRound(isCorrect, reactionTime);
  };

  /**
   * Sayma input değişimi
   */
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Sadece sayıları kabul et
    if (value === '' || /^\d+$/.test(value)) {
      setUserCount(value);
    }
  };

  /**
   * Dinamik tıklama objesine tıklama
   */
  const handleClickingObjectClick = (objectId: string, isTargetObject: boolean) => {
    // Objeyi hemen kaldır
    setClickingObjects(prev => prev.filter(obj => obj.id !== objectId));

    if (isTargetObject) {
      setCorrectClicks(prev => prev + 1);
      console.log('✅ [CLICKING] Doğru tıklama!');
    } else {
      setWrongClicks(prev => prev + 1);
      console.log('❌ [CLICKING] Yanlış tıklama!');
    }
  };

  /**
   * Turu bitir
   */
  const endRound = (success: boolean, reactionTime?: number) => {
    if (!currentTask || isEndingRound.current) return;

    console.log('🏁 [ATTENTION SPRINT] Tur bitiriliyor...');
    isEndingRound.current = true;

    // Timer'ı temizle
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalReactionTime = reactionTime || (Date.now() - roundStartTimeRef.current) / 1000;

    // Zamanlama sapması analizi
    const hedefZaman = extractTargetTiming(currentTask.gorev);
    const zamanlamaSapmasi = hedefZaman ? Math.abs(finalReactionTime - hedefZaman) : 0;
    const idealZamanlama = hedefZaman && zamanlamaSapmasi <= 1; // ±1 saniye ideal

    // Hızlı çözüm analizi
    const isQuickSolution = success && finalReactionTime < 3; // 3 saniyeden hızlı
    const isVeryQuickSolution = success && finalReactionTime < 1.5; // 1.5 saniyeden çok hızlı

    const round: SprintRound = {
      task: currentTask,
      startTime: roundStartTimeRef.current,
      endTime: Date.now(),
      success,
      reactionTime: finalReactionTime
    };

    console.log('⚡ [PERFORMANCE ANALYSIS]', {
      görev: currentTask.gorev,
      hedefTipi: currentTask.hedefTipi,
      hedefSayi: currentTask.hedefSayi,
      başarılı: success,
      reaksiyonSüresi: finalReactionTime,
      hedefZaman: hedefZaman,
      zamanlamaSapmasi: zamanlamaSapmasi,
      idealZamanlama: idealZamanlama,
      hızlıÇözüm: isQuickSolution,
      çokHızlıÇözüm: isVeryQuickSolution,
      // Sayma modu analizi
      saymaModu: isCountingMode,
      ...(isCountingMode && {
        doğruSayı: totalTargetCount,
        kullanıcıCevabı: parseInt(userCount) || 0,
        saymaDoğruluğu: success ? 'mükemmel' : 'hatalı'
      })
    });

    setRounds(prev => [...prev, round]);

    if (success) {
      setScore(prev => prev + 1);

      // Başarı emosyonu
      const emotion: EmotionResult = {
        emotion: 'happy',
        confidence: 0.9,
        timestamp: new Date()
      };
      setEmotions(prev => [...prev, emotion]);
      onEmotionDetected?.(emotion);
    } else {
      // Başarısızlık emosyonu
      const emotion: EmotionResult = {
        emotion: 'confused',
        confidence: 0.7,
        timestamp: new Date()
      };
      setEmotions(prev => [...prev, emotion]);
      onEmotionDetected?.(emotion);
    }

    setGameState('waiting');

    // Kısa bekleme sonrası sonraki tura geç
    setTimeout(async () => {
      if (currentRound + 1 >= totalRounds) {
        completeGame();
      } else {
        setCurrentRound(prev => prev + 1);
        setShowTarget(false);
        setTargetClicked(false);
        setDistractors([]);
        // Sayma modu state'lerini temizle
        setIsCountingMode(false);
        setCountingObjects([]);
        setUserCount('');
        setTotalTargetCount(0);
        setCountingStartTime(0);
        // Tıklama modu state'lerini temizle
        setIsClickingMode(false);
        setClickingObjects([]);
        setCorrectClicks(0);
        setWrongClicks(0);
        setTotalSpawned(0);
        await generateNextTask();
        // Görev üretildikten sonra ready durumuna geç
        setGameState('ready');
      }
      isEndingRound.current = false;
    }, 2000);
  };

  /**
   * Oyunu tamamla
   */
  const completeGame = () => {
    setGameState('completed');
    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
    onGameComplete(score, gameDuration, emotions);
  };

  /**
   * Oyunu yeniden başlat
   */
  const restartGame = () => {
    // Timer'ı temizle
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRounds([]);
    roundsRef.current = [];
    setCurrentRound(0);
    setScore(0);
    setEmotions([]);
    setGameState('ready');
    setShowTarget(false);
    setTargetClicked(false);
    setTargetPosition({ x: 50, y: 50 });
    setDistractors([]);
    // Sayma modu state'lerini temizle
    setIsCountingMode(false);
    setCountingObjects([]);
    setUserCount('');
    setTotalTargetCount(0);
    setCountingStartTime(0);
    // Tıklama modu state'lerini temizle
    setIsClickingMode(false);
    setClickingObjects([]);
    setCorrectClicks(0);
    setWrongClicks(0);
    setTotalSpawned(0);
    // Son görevleri temizle
    setSonGorevler([]);
    hasGeneratedFirstTask.current = false;
    isGeneratingRef.current = false;
    isEndingRound.current = false;
    generateFirstTask();
  };

  if (gameState === 'completed') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Target className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Dikkat Sprintleri Tamamlandı!</h2>
            <p className="text-gray-600">Odaklanma becerilerin gelişiyor!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{score}/{totalRounds}</div>
                <div className="text-sm text-gray-600">Başarılı Görev</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((score / totalRounds) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Başarı Oranı</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {rounds.length > 0 ?
                    (rounds.reduce((sum, r) => sum + r.reactionTime, 0) / rounds.length).toFixed(1) :
                    '0.0'
                  }s
                </div>
                <div className="text-sm text-gray-600">Ort. Reaksiyon</div>
              </div>
            </div>
          </div>

          <Button onClick={restartGame} size="lg">
            <RotateCcw className="h-5 w-5 mr-2" />
            Tekrar Oyna
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Tur {currentRound + 1}/{totalRounds}
              </div>
              <div className="text-sm font-medium text-gray-800">
                Skor: {score}
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-purple-600">AI Adaptif</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Ana Oyun Alanı */}
      <Card>
        <CardContent className="text-center py-12">
          {isGenerating ? (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Senin için özel görev hazırlanıyor...</p>
            </div>
          ) : gameState === 'ready' ? (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Play className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dikkat Sprintleri</h2>
              <p className="text-gray-600 mb-6">
                Hızlı görevleri tamamla ve odaklanma becerilerini geliştir!
              </p>
              {currentTask && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-800 mb-2">Görevin:</h3>
                  <p className="text-blue-700">{currentTask.gorev}</p>
                  {currentTask.ipuclari.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-blue-600 font-medium mb-1">İpuçları:</p>
                      {currentTask.ipuclari.map((ipucu, index) => (
                        <p key={index} className="text-xs text-blue-600">• {ipucu}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Button onClick={startRound} size="lg" disabled={!currentTask}>
                <Zap className="h-5 w-5 mr-2" />
                Başla
              </Button>
            </div>
          ) : gameState === 'countdown' ? (
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-800">Hazırlan!</h2>
              <div className="text-6xl font-bold text-blue-600 animate-bounce">
                {countdown}
              </div>
            </div>
          ) : gameState === 'active' ? (
            <div
              className={`space-y-6 ${!isCountingMode ? 'cursor-crosshair' : ''}`}
              onClick={!isCountingMode ? handleGameAreaClick : undefined}
            >
              <h2 className="text-xl font-bold text-gray-800">{currentTask?.gorev}</h2>

              {isCountingMode ? (
                // SAYMA MODU
                <div className="space-y-6">
                  {/* Dinamik objeler */}
                  <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
                    {countingObjects.map((obj) => (
                      <div
                        key={obj.id}
                        className="absolute w-8 h-8 text-2xl animate-bounce transition-all duration-500"
                        style={{
                          left: `${obj.x}%`,
                          top: `${obj.y}%`,
                          transform: 'translate(-50%, -50%)',
                          animationDuration: `${1 + Math.random()}s`
                        }}
                      >
                        {obj.value}
                      </div>
                    ))}
                  </div>

                  {/* Sayma input */}
                  <form onSubmit={handleCountSubmit} className="space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                      <label className="text-lg font-medium">Toplam:</label>
                      <input
                        type="text"
                        value={userCount}
                        onChange={handleCountChange}
                        className="w-20 h-12 text-center text-xl font-bold border-2 border-blue-400 rounded-lg focus:outline-none focus:border-green-400"
                        placeholder="0"
                        maxLength={2}
                      />
                      <button
                        type="submit"
                        disabled={userCount.trim() === ''}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Gönder
                      </button>
                    </div>
                  </form>

                  {/* Süre göstergesi */}
                  <div className="flex items-center justify-center space-x-2 text-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-mono font-bold text-blue-600">{timeLeft}s</span>
                  </div>
                </div>
              ) : isClickingMode ? (
                // DİNAMİK TIKLAMA MODU - 50 saniye mavi üçgen tıkla gibi
                <div className="space-y-6">
                  {/* Dinamik tıklama objeleri */}
                  <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
                    {clickingObjects.map((obj) => (
                      <button
                        key={obj.id}
                        onClick={() => handleClickingObjectClick(obj.id, obj.isTarget)}
                        className={`
                          absolute w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center text-2xl shadow-lg border-2
                          ${obj.isTarget
                            ? 'bg-green-50 border-green-300 hover:bg-green-100 hover:scale-110'
                            : 'bg-red-50 border-red-300 hover:bg-red-100'
                          }
                          animate-bounce
                        `}
                        style={{
                          left: `${obj.x}%`,
                          top: `${obj.y}%`,
                          transform: 'translate(-50%, -50%)',
                          animationDuration: `${0.8 + Math.random() * 0.4}s`
                        }}
                      >
                        {obj.value}
                      </button>
                    ))}
                  </div>

                  {/* Tıklama modu skorları */}
                  <div className="flex items-center justify-center space-x-8">
                    <div className="flex items-center space-x-2 text-green-600">
                      <Star className="h-5 w-5" />
                      <span className="text-lg font-bold">Doğru: {correctClicks}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-red-600">
                      <X className="h-5 w-5" />
                      <span className="text-lg font-bold">Yanlış: {wrongClicks}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Target className="h-5 w-5" />
                      <span className="text-lg font-bold">Toplam Çıkan: {totalSpawned}</span>
                    </div>
                  </div>

                  {/* Süre göstergesi */}
                  <div className="flex items-center justify-center space-x-2 text-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-mono font-bold text-blue-600">{timeLeft}s</span>
                  </div>
                </div>
              ) : (
                // NORMAL TIKLAMA MODU
                showTarget && currentTask && (
                  <div className="relative w-full h-96">
                  {/* Yanıltıcı öğeler */}
                  {distractors.map((distractor) => (
                    <button
                      key={distractor.id}
                      onClick={handleDistractorClick}
                      className="absolute w-12 h-12 rounded-full bg-white hover:bg-red-100 transition-colors duration-200 flex items-center justify-center text-2xl shadow-lg border-2 border-gray-300"
                      style={{
                        left: `${distractor.x}%`,
                        top: `${distractor.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {distractor.value}
                    </button>
                  ))}

                  {/* Gerçek hedef - sadece küçük buton */}
                  <button
                    onClick={handleTargetClick}
                    disabled={targetClicked}
                    className={`
                      absolute w-12 h-12 rounded-full transition-colors duration-200 flex items-center justify-center text-2xl shadow-lg border-2
                      ${targetClicked
                        ? 'bg-green-100 border-green-400 scale-110'
                        : 'bg-white hover:bg-green-50 border-blue-400 hover:border-green-400'
                      }
                    `}
                    style={{
                      left: `${targetPosition.x}%`,
                      top: `${targetPosition.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                        {/* ÖNCE KARMA HEDEFLERİ KONTROL ET */}
                        {currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'daire' && '🔴'}
                        {currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'daire' && '🔵'}
                        {currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'daire' && '🟢'}
                        {currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'daire' && '🟡'}
                        {currentTask.hedefRenk === 'mor' && currentTask.hedefSekil === 'daire' && '🟣'}
                        {currentTask.hedefRenk === 'turuncu' && currentTask.hedefSekil === 'daire' && '🟠'}

                        {currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'üçgen' && '🔺'}
                        {currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'üçgen' && '🔹'}
                        {currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'üçgen' && '🔸'}
                        {currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'üçgen' && '🟨'}

                        {currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'kare' && '🟥'}
                        {currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'kare' && '🟦'}
                        {currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'kare' && '🟩'}
                        {currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'kare' && '🟨'}

                        {/* SONRA TEK HEDEFLERİ KONTROL ET - sadece karma yoksa */}
                        {/* Sadece Şekil Hedefleri */}
                        {!currentTask.hedefRenk && currentTask.hedefSekil === 'yıldız' && '⭐'}
                        {!currentTask.hedefRenk && currentTask.hedefSekil === 'daire' && '⭕'}
                        {!currentTask.hedefRenk && currentTask.hedefSekil === 'kare' && '⬜'}
                        {!currentTask.hedefRenk && currentTask.hedefSekil === 'üçgen' && '🔺'}
                        {!currentTask.hedefRenk && currentTask.hedefSekil === 'kalp' && '❤️'}
                        {!currentTask.hedefRenk && currentTask.hedefSekil === 'elmas' && '💎'}

                        {/* Sadece Renk Hedefleri */}
                        {!currentTask.hedefSekil && currentTask.hedefRenk === 'kırmızı' && '🔴'}
                        {!currentTask.hedefSekil && currentTask.hedefRenk === 'mavi' && '🔵'}
                        {!currentTask.hedefSekil && currentTask.hedefRenk === 'yeşil' && '🟢'}
                        {!currentTask.hedefSekil && currentTask.hedefRenk === 'sarı' && '🟡'}
                        {!currentTask.hedefSekil && currentTask.hedefRenk === 'mor' && '🟣'}
                        {!currentTask.hedefSekil && currentTask.hedefRenk === 'turuncu' && '🟠'}

                        {/* Sayı Hedefleri */}
                        {currentTask.hedefSayi && !currentTask.hedefRenk && !currentTask.hedefSekil && `${currentTask.hedefSayi}️⃣`}

                        {/* Varsayılan */}
                        {!currentTask.hedefSekil && !currentTask.hedefRenk && !currentTask.hedefSayi && '🎯'}
                  </button>
                </div>
                )
              )}

              {!showTarget && (
                <div className="text-gray-600">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Hazırlan...
                </div>
              )}
            </div>
          ) : gameState === 'waiting' ? (
            <div className="space-y-4">
              {rounds.length > 0 && rounds[rounds.length - 1].success ? (
                <div className="text-green-600">
                  <Star className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Harika!</h3>
                  <p>Reaksiyon süresi: {rounds[rounds.length - 1].reactionTime.toFixed(2)}s</p>
                </div>
              ) : (
                <div className="text-orange-600">
                  <Target className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Bir daha deneyelim!</h3>
                  <p>Daha hızlı olmaya çalış</p>
                </div>
              )}
              <p className="text-sm text-gray-600">Sonraki görev hazırlanıyor...</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
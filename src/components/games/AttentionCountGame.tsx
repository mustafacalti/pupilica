import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { AttentionSprintTask, AttentionSprintPerformance, EmotionResult } from '../../types';
import { attentionSprintGenerator } from '../../services/attentionSprintGenerator';
import { Clock, Target, Zap, RotateCcw, Star, Brain, Play } from 'lucide-react';

interface AttentionCountGameProps {
  studentId: string;
  studentAge?: number;
  difficulty: 'kolay' | 'orta' | 'zor';
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

interface CountRound {
  task: AttentionSprintTask;
  startTime: number;
  endTime?: number;
  success: boolean;
  reactionTime: number;
  userAnswer: number;
  correctAnswer: number;
}

export const AttentionCountGame: React.FC<AttentionCountGameProps> = ({
  studentId,
  studentAge = 12,
  difficulty,
  onGameComplete,
  onEmotionDetected
}) => {
  const [currentTask, setCurrentTask] = useState<AttentionSprintTask | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'active' | 'waiting' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [rounds, setRounds] = useState<CountRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const [gameStartTime] = useState(Date.now());
  const [countdown, setCountdown] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sayma modu için state'ler
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
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  // Dinamik zorluk için state'ler
  const [dynamicDifficulty, setDynamicDifficulty] = useState(difficulty);
  const [gameDurationMultiplier, setGameDurationMultiplier] = useState(1.0);
  const [maxObjectsOnScreen, setMaxObjectsOnScreen] = useState(() => {
    // Başlangıç değerleri
    return difficulty === 'kolay' ? 2 : difficulty === 'orta' ? 3 : 5;
  });
  const [performanceHistory, setPerformanceHistory] = useState<{
    correct: boolean;
    accuracy: number;
    round: number;
  }[]>([]);

  const roundStartTimeRef = useRef<number>(0);
  const hasGeneratedFirstTask = useRef(false);
  const isGeneratingRef = useRef(false);
  const isEndingRound = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalRounds = 5;

  const generateFirstTask = useCallback(async () => {
    if (isGeneratingRef.current) {
      console.log('🚫 [DUPLICATE CALL] generateFirstTask already running, skipping');
      return;
    }

    console.log('🎬 [TASK GENERATION] Starting task generation');
    isGeneratingRef.current = true;
    setIsGenerating(true);

    const initialPerformance: AttentionSprintPerformance = {
      son3Tur: [],
      ortalamaReaksiyonSuresi: 2.5,
      basariOrani: 0.7,
      odaklanmaDurumu: 'orta'
    };

    try {
      // AI'dan SAYMA oyunu türünde görev iste
      const task = await attentionSprintGenerator.generateAttentionSprint({
        performansOzeti: initialPerformance,
        studentAge,
        sonGorevler: ['sayma'], // Sadece sayma türü görevler iste
        forcedDifficulty: difficulty // Kullanıcının seçtiği zorluk seviyesini geç
      });

      // Eğer AI sayma görevi vermezse zorla sayma görevine çevir
      const countingTask = {
        ...task,
        difficulty,
        gorev: ensureCountingTask(task.gorev),
        hedefRenk: extractColorFromTask(task.gorev) || task.hedefRenk,
        hedefSekil: extractShapeFromTask(task.gorev) || task.hedefSekil,
        hedefSayi: undefined // Sayma oyununda hedefSayi kullanmıyoruz
      };

      console.log('🔢 [COUNT GAME] Generated counting task:', countingTask.gorev);
      setCurrentTask(countingTask);
      setTimeLeft(countingTask.sure_saniye);
    } catch (error) {
      console.error('İlk görev üretme hatası:', error);
      setCurrentTask(getFallbackCountTask());
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [studentAge, difficulty]);

  // İlk görevi yükle
  useEffect(() => {
    if (!hasGeneratedFirstTask.current && !isGenerating) {
      hasGeneratedFirstTask.current = true;
      generateFirstTask();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, [generateFirstTask]);

  // AI görevini sayma görevine zorla çevir
  const ensureCountingTask = (gorev: string): string => {
    const text = gorev.toLowerCase();

    // Eğer zaten sayma görevi ise olduğu gibi döndür
    if (text.includes('say') || text.includes('count') || text.includes('adet') || text.includes('hesapla')) {
      return gorev;
    }

    // Değilse sayma görevine çevir
    const colors = [
      { turkish: 'mavi', emoji: '🔵' },
      { turkish: 'kırmızı', emoji: '🔴' },
      { turkish: 'yeşil', emoji: '🟢' },
      { turkish: 'sarı', emoji: '🟡' }
    ];
    const shapes = [
      { turkish: 'daire', emoji: '⭕' },
      { turkish: 'kare', emoji: '⬜' },
      { turkish: 'üçgen', emoji: '🔺' },
      { turkish: 'yıldız', emoji: '⭐' }
    ];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

    return `${randomColor.emoji} ${randomColor.turkish} ${randomShape.turkish}leri say`;
  };

  // Görevden renk çıkar
  const extractColorFromTask = (gorev: string): string | undefined => {
    const colors = ['kırmızı', 'mavi', 'yeşil', 'sarı', 'mor', 'turuncu'];
    return colors.find(color => gorev.toLowerCase().includes(color));
  };

  // Görevden şekil çıkar
  const extractShapeFromTask = (gorev: string): string | undefined => {
    const shapes = ['yıldız', 'daire', 'kare', 'üçgen', 'kalp', 'elmas'];
    return shapes.find(shape => gorev.toLowerCase().includes(shape));
  };

  // Sadece sayma görevlerini filtrele veya sayma görevine çevir
  const filterCountTaskOnly = (gorev: string): string => {
    const text = gorev.toLowerCase();

    // Eğer zaten sayma görevi ise olduğu gibi döndür
    if (text.includes('say') || text.includes('count') || text.includes('adet')) {
      return gorev;
    }

    // Değilse sayma görevine çevir
    const colors = [
      { turkish: 'mavi', emoji: '🔵' },
      { turkish: 'kırmızı', emoji: '🔴' },
      { turkish: 'yeşil', emoji: '🟢' },
      { turkish: 'sarı', emoji: '🟡' }
    ];
    const shapes = [
      { turkish: 'daire', emoji: '⭕' },
      { turkish: 'kare', emoji: '⬜' },
      { turkish: 'üçgen', emoji: '🔺' },
      { turkish: 'yıldız', emoji: '⭐' }
    ];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

    return `${randomColor.emoji} ${randomColor.turkish} ${randomShape.turkish}leri say`;
  };

  const getFallbackCountTask = (): AttentionSprintTask => {
    const tasks = {
      kolay: [
        { gorev: "🔵 Mavi daireleri say", hedefRenk: "mavi", hedefSekil: "daire" },
        { gorev: "🟢 Yeşil kareleri say", hedefRenk: "yeşil", hedefSekil: "kare" },
        { gorev: "⭐ Yıldızları say", hedefSekil: "yıldız" }
      ],
      orta: [
        { gorev: "🔴 Kırmızı üçgenleri dikkatli say", hedefRenk: "kırmızı", hedefSekil: "üçgen" },
        { gorev: "🟡 Sarı daireleri hesapla", hedefRenk: "sarı", hedefSekil: "daire" },
        { gorev: "🔵 Mavi kareleri hızla say", hedefRenk: "mavi", hedefSekil: "kare" }
      ],
      zor: [
        { gorev: "🟢 Hızlı çıkan yeşil yıldızları say", hedefRenk: "yeşil", hedefSekil: "yıldız" },
        { gorev: "🔴 Karışık kırmızı daireleri hesapla", hedefRenk: "kırmızı", hedefSekil: "daire" },
        { gorev: "🔵 Parlayan mavi üçgenleri say", hedefRenk: "mavi", hedefSekil: "üçgen" }
      ]
    };

    const levelTasks = tasks[difficulty];
    const selectedTask = levelTasks[Math.floor(Math.random() * levelTasks.length)];

    return {
      id: `count_fallback_${Date.now()}`,
      ...selectedTask,
      sure_saniye: difficulty === 'kolay' ? 20 : difficulty === 'orta' ? 25 : 30,
      ipuclari: ["Dikkatli say", "Unutma sayıları"],
      dikkatDagitici: difficulty === 'kolay' ? 0.2 : difficulty === 'orta' ? 0.4 : 0.6,
      difficulty,
      hedefTipi: 'renk'
    };
  };

  // Dinamik oyun süresi ayarlama fonksiyonu
  const calculateGameDuration = (baseDuration: number) => {
    if (performanceHistory.length < 1) return baseDuration;

    const recent3 = performanceHistory.slice(-3);
    const correctCount = recent3.filter(p => p.correct).length;
    const avgAccuracy = recent3.reduce((sum, p) => sum + p.accuracy, 0) / recent3.length;

    let newMultiplier = gameDurationMultiplier;

    console.log('⏱️ [GAME DURATION] Analiz:', {
      recent3Count: recent3.length,
      correctCount,
      avgAccuracy: avgAccuracy.toFixed(2),
      currentMultiplier: gameDurationMultiplier.toFixed(2),
      baseDuration
    });

    // En az 2 oyun oynandıktan sonra performans analizine başla
    if (recent3.length < 2) {
      console.log('⏸️ [DURATION] Henüz yeterli veri yok - süre sabit kalıyor');
    }
    // Mükemmel performans - oyunu uzat (daha fazla obje çıksın)
    else if (avgAccuracy > 0.9) {
      newMultiplier = Math.min(1.5, gameDurationMultiplier + 0.2);
      console.log('⬆️ [DURATION] Mükemmel performans - oyunu uzatıyorum!');
    }
    // İyi performans - hafif uzat
    else if (avgAccuracy > 0.8) {
      newMultiplier = Math.min(1.3, gameDurationMultiplier + 0.1);
      console.log('↗️ [DURATION] İyi performans - hafif uzatıyorum');
    }
    // Orta performans - mevcut süreyi koru
    else if (avgAccuracy > 0.6) {
      // Değişiklik yok
      console.log('➡️ [DURATION] Dengeli performans - süre sabit');
    }
    // Zayıf performans - oyunu kısalt (daha az obje)
    else if (avgAccuracy < 0.5) {
      newMultiplier = Math.max(0.7, gameDurationMultiplier - 0.1);
      console.log('⬇️ [DURATION] Zayıf performans - oyunu kısaltıyorum');
    }
    // Çok kötü performans - çok kısalt
    else if (avgAccuracy < 0.3) {
      newMultiplier = Math.max(0.6, gameDurationMultiplier - 0.2);
      console.log('↘️ [DURATION] Çok kötü performans - fazla kısaltıyorum');
    }

    setGameDurationMultiplier(newMultiplier);
    const adjustedDuration = Math.round(baseDuration * newMultiplier);

    // Performansa göre maksimum obje sayısını da ayarla
    if (recent3.length >= 2) {
      const baseMaxObjects = {
        'kolay': 2,
        'orta': 3,
        'zor': 5
      };

      let newMaxObjects = maxObjectsOnScreen;

      // Mükemmel performans - daha fazla obje
      if (avgAccuracy > 0.9) {
        newMaxObjects = Math.min(baseMaxObjects[difficulty] + 2, difficulty === 'zor' ? 6 : 4);
        console.log('⬆️ [MAX OBJECTS] Mükemmel performans - daha fazla obje!');
      }
      // İyi performans - biraz artır
      else if (avgAccuracy > 0.8) {
        newMaxObjects = Math.min(baseMaxObjects[difficulty] + 1, difficulty === 'zor' ? 6 : 4);
        console.log('↗️ [MAX OBJECTS] İyi performans - obje sayısı artırıldı');
      }
      // Zayıf performans - azalt
      else if (avgAccuracy < 0.5) {
        newMaxObjects = Math.max(baseMaxObjects[difficulty] - 1, 2);
        console.log('⬇️ [MAX OBJECTS] Zayıf performans - obje sayısı azaltıldı');
      }
      // Normal performans
      else {
        newMaxObjects = baseMaxObjects[difficulty];
        console.log('➡️ [MAX OBJECTS] Normal performans - varsayılan obje sayısı');
      }

      if (newMaxObjects !== maxObjectsOnScreen) {
        console.log('🎯 [MAX OBJECTS] Ayarlandı:', {
          difficulty,
          oldMax: maxObjectsOnScreen,
          newMax: newMaxObjects,
          avgAccuracy: avgAccuracy.toFixed(2)
        });
        setMaxObjectsOnScreen(newMaxObjects);
      }
    }

    console.log('🎯 [DURATION] Süre ayarlandı:', {
      baseDuration,
      multiplier: newMultiplier.toFixed(2),
      adjustedDuration
    });

    return adjustedDuration;
  };


  // Zorluk seviyesine göre sayma parametreleri
  const getCountingParams = (difficulty: 'kolay' | 'orta' | 'zor', baseDurationSeconds: number) => {
    // Dinamik oyun süresi hesapla
    const adjustedGameDuration = calculateGameDuration(baseDurationSeconds);

    // Son 5 saniye hariç spawn et (cevap verme süresi için) - SABİT
    const answerTime = 5; // Son 5 saniye cevap verme - DEĞİŞMEZ
    const spawnDuration = Math.max((adjustedGameDuration - answerTime) * 1000, 10000); // Milisaniyeye çevir

    // Dinamik zorluk uygulaması
    const baseParams = {
      'kolay': {
        totalObjectsRatio: 4, // Her 4 saniyede 1 obje
        targetCountRatio: 8, // Hedef obje sayısı
        spawnInterval: 3000, // 3 saniyede bir
        objectLifespan: 6000, // 6 saniye yaşar
        persistanceChance: 0.0 // Kolay: yeni obje gelince eski hemen kalkar
      },
      'orta': {
        totalObjectsRatio: 3, // Her 3 saniyede 1 obje
        targetCountRatio: 6, // Hedef obje sayısı
        spawnInterval: 2500, // 2.5 saniyede bir
        objectLifespan: 5000, // 5 saniye yaşar
        persistanceChance: 0.35 // Orta: %35 şans ile eski objeler durabilir
      },
      'zor': {
        totalObjectsRatio: 2, // Her 2 saniyede 1 obje
        targetCountRatio: 4, // Hedef obje sayısı
        spawnInterval: 2000, // 2 saniyede bir
        objectLifespan: 4000, // 4 saniye yaşar
        persistanceChance: 0.7 // Zor: %70 şans ile eski objeler durabilir
      }
    };

    const base = baseParams[difficulty] || baseParams['orta'];

    // Sadece oyun süresine dayalı ayarlama (obje sayısı değişir)
    const adjustedParams = {
      totalObjects: Math.ceil(adjustedGameDuration / base.totalObjectsRatio),
      targetCount: Math.ceil(adjustedGameDuration / base.targetCountRatio),
      spawnInterval: base.spawnInterval, // Sabit - değişmez
      objectLifespan: base.objectLifespan, // Sabit - değişmez
      spawnDuration,
      persistanceChance: base.persistanceChance, // Sabit - değişmez
      adjustedGameDuration // Toplam oyun süresi (5 saniye cevap verme dahil)
    };

    console.log('🎮 [PARAMS] Süre bazlı parametreler:', {
      baseParams: base,
      baseDurationSeconds,
      adjustedGameDuration,
      durationMultiplier: gameDurationMultiplier.toFixed(2),
      adjustedParams
    });

    return adjustedParams;
  };

  // Oyunu başlat
  const startRound = () => {
    if (!currentTask) return;

    setGameState('countdown');
    setCountdown(3);

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

  // Timer'ı başlat
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
          endRound(false);
          return 0;
        }

        // Son 5 saniye uyarısı göster
        if (prev === 6) {
          setShowFinalMessage(true);
          console.log('⏰ [COUNTING] Son 5 saniye! Cevabını hazırla.');
        }

        return prev - 1;
      });
    }, 1000);
  };

  // Rastgele pozisyon üret
  const generateRandomPosition = () => ({
    x: Math.random() * 70 + 15,
    y: Math.random() * 60 + 20
  });

  // Dinamik objeler spawn et (sayma modu)
  const startCountingSpawn = () => {
    if (!currentTask) return;

    // Eğer zaten bir spawn interval çalışıyorsa iptal et
    if (spawnIntervalRef.current) {
      console.log('🚫 [DUPLICATE SPAWN] Spawn already running, clearing previous');
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }

    console.log('🎬 [SPAWN START] Starting counting spawn');
    const params = getCountingParams(difficulty, currentTask.sure_saniye);
    let spawnedCount = 0;
    let targetSpawnedCount = 0;

    console.log('🔢 [COUNTING SPAWN] Parametreler:', {
      gameDuration: currentTask.sure_saniye,
      totalObjects: params.totalObjects,
      targetCount: params.targetCount,
      spawnDuration: params.spawnDuration,
      spawnInterval: params.spawnInterval,
      persistanceChance: params.persistanceChance,
      answerTime: '5 saniye (son kısım)'
    });

    setTotalTargetCount(0);
    setCountingStartTime(Date.now());

    spawnIntervalRef.current = setInterval(() => {
      if (spawnedCount >= params.totalObjects) {
        clearInterval(spawnIntervalRef.current!);
        spawnIntervalRef.current = null;
        return;
      }

      // Zorluk moduna göre eski objeleri kaldır
      setCountingObjects(prev => {
        let filteredPrev = prev;
        let removedTargetCount = 0;

        if (difficulty === 'kolay') {
          // Kolay mod: %30 kalma şansı
          filteredPrev = prev.filter(obj => {
            const shouldStay = Math.random() < 0.3;
            if (!shouldStay && obj.isTarget) {
              removedTargetCount++;
            }
            return shouldStay;
          });

          if (removedTargetCount > 0) {
            console.log('🔄 [KOLAY MOD] Bazı eski objeler kaldırılıyor:', removedTargetCount, '(sayım değişmiyor)');
          }
        } else {
          // Orta/zor mod: persistanceChance'e göre
          filteredPrev = prev.filter(obj => {
            const shouldStay = Math.random() < params.persistanceChance;
            if (!shouldStay && obj.isTarget) {
              removedTargetCount++;
            }
            return shouldStay;
          });

          if (removedTargetCount > 0) {
            console.log(`🔄 [${difficulty.toUpperCase()} MOD] Rastgele objeler kaldırılıyor:`, removedTargetCount, '(sayım değişmiyor)');
          }
        }

        return filteredPrev;
      });

      // Kaç obje spawn edeceğini belirle
      let spawnCount = 1; // Varsayılan: 1 obje

      if (difficulty === 'orta') {
        // Orta mod: %20 şans ile 2 obje
        if (Math.random() < 0.2) {
          spawnCount = 2;
          console.log('🎲 [ORTA MOD] Çoklu spawn! 2 obje birden');
        }
      } else if (difficulty === 'zor') {
        // Zor mod: %15 şans ile 2 obje, %5 şans ile 3 obje
        const rand = Math.random();
        if (rand < 0.05) {
          spawnCount = 3;
          console.log('🎲 [ZOR MOD] Süper spawn! 3 obje birden');
        } else if (rand < 0.2) { // %15 toplam şans (0.05 + 0.15)
          spawnCount = 2;
          console.log('🎲 [ZOR MOD] Çoklu spawn! 2 obje birden');
        }
      }

      // Maksimum obje sayısına göre spawn sayısını sınırla
      const currentObjectCount = countingObjects.length;
      const availableSlots = maxObjectsOnScreen - currentObjectCount;
      spawnCount = Math.min(spawnCount, availableSlots);

      if (spawnCount <= 0) {
        console.log('🚫 [MAX LIMIT] Maksimum obje sayısına ulaşıldı:', maxObjectsOnScreen, 'spawn bekliyor');
        return;
      }

      console.log(`🎯 [SPAWN COUNT] ${spawnCount} obje spawn edilecek (maks: ${maxObjectsOnScreen}, mevcut: ${currentObjectCount})`);

      // Belirlenen sayıda obje spawn et
      for (let i = 0; i < spawnCount; i++) {
        // Hedef mi yoksa yanıltıcı mı spawn edeceğini karar ver
        const shouldSpawnTarget =
          targetSpawnedCount < params.targetCount &&
          (Math.random() < 0.4 || spawnedCount >= params.totalObjects - (params.targetCount - targetSpawnedCount));

        const isTarget = shouldSpawnTarget;
        if (isTarget) {
          targetSpawnedCount++;
          setTotalTargetCount(prev => prev + 1);
        }

        const position = generateRandomPosition();

        // Hedef ve yanıltıcı değerler
        let value = '';
        if (currentTask?.hedefRenk && currentTask?.hedefSekil) {
          if (isTarget) {
            // Karma hedefler - renk + şekil
            if (currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'daire') {
              value = '🟢';
            } else if (currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'kare') {
              value = '🟩';
            } else if (currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'daire') {
              value = '🟡';
            } else if (currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'kare') {
              value = '🟨';
            } else if (currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'üçgen') {
              value = '🔹';
            } else if (currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'daire') {
              value = '🔴';
            } else if (currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'kare') {
              value = '🟥';
            } else if (currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'daire') {
              value = '🔵';
            } else if (currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'kare') {
              value = '🟦';
            } else {
              value = '🔴';
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
            const wrongColors = Object.values(colorMap).filter(c => c !== colorMap[currentTask.hedefRenk as keyof typeof colorMap]);
            value = wrongColors[Math.floor(Math.random() * wrongColors.length)];
          }
        } else if (currentTask?.hedefSekil) {
          const shapeMap = { 'yıldız': '⭐', 'daire': '⭕', 'kare': '⬜', 'üçgen': '🔺', 'kalp': '❤️', 'elmas': '💎' };
          if (isTarget) {
            value = shapeMap[currentTask.hedefSekil as keyof typeof shapeMap] || '🔺';
          } else {
            const wrongShapes = Object.values(shapeMap).filter(s => s !== shapeMap[currentTask.hedefSekil as keyof typeof shapeMap]);
            value = wrongShapes[Math.floor(Math.random() * wrongShapes.length)];
          }
        }

        const newObject = {
          id: `counting-${Date.now()}-${Math.random()}-${i}`, // i ekleyerek unique ID
          x: position.x,
          y: position.y,
          value,
          isTarget,
          createdAt: Date.now(),
          lifespan: params.objectLifespan
        };

        setCountingObjects(prev => [...prev, newObject]);

        console.log('➕ [SPAWN]', {
          spawnIndex: i + 1,
          spawnTotal: spawnCount,
          isTarget,
          value,
          targetSpawnedCount,
          totalTargetCountCurrent: totalTargetCount,
          spawnedCount: spawnedCount + 1,
          totalObjects: params.totalObjects
        });

        // Objeyi yaşam süresinden sonra kaldır
        setTimeout(() => {
          setCountingObjects(prev => {
          const filtered = prev.filter(obj => obj.id !== newObject.id);
          // Lifespan bitince sadece ekrandan kaldır, sayımdan çıkarma!
          if (newObject.isTarget) {
            console.log('⏱️ [LIFESPAN END] Hedef obje yaşam süresi bitti, ekrandan kaldırılıyor (sayım değişmiyor)');
          }
          return filtered;
          });
        }, params.objectLifespan);
      }

      spawnedCount += spawnCount; // Spawn edilen obje sayısı kadar artır
    }, params.spawnInterval);

    // Spawn süresinden sonra durdur
    setTimeout(() => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
        console.log('⏹️ [SPAWN END] Spawn duration ended, clearing interval');
      }
    }, params.spawnDuration);
  };

  // Görevi başlat
  const startTask = () => {
    if (!currentTask) return;

    // Dinamik süre hesapla
    const params = getCountingParams(difficulty, currentTask.sure_saniye);
    const finalGameDuration = params.adjustedGameDuration;

    setGameState('active');
    setTimeLeft(finalGameDuration); // Dinamik süre kullan
    setUserCount('');
    setShowFinalMessage(false); // Reset final message

    console.log('🚀 [GAME START] Oyun başlıyor:', {
      originalDuration: currentTask.sure_saniye,
      adjustedDuration: finalGameDuration,
      answerTime: 5
    });

    // Sayma modunu başlat
    startCountingSpawn();
    startTimer();
  };

  // Sayma cevabını kontrol et
  const handleCountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userCount.trim() === '') return;

    const countAnswer = parseInt(userCount);
    const isCorrect = countAnswer === totalTargetCount;
    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;

    console.log('🔢 [COUNTING RESULT]', {
      userAnswer: countAnswer,
      correctAnswer: totalTargetCount,
      isCorrect,
      reactionTime,
      currentObjectsOnScreen: countingObjects.length,
      targetObjectsOnScreen: countingObjects.filter(obj => obj.isTarget).length
    });

    endRound(isCorrect, reactionTime, countAnswer);
  };

  // Sayma input değişimi
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setUserCount(value);
    }
  };

  // Turu bitir
  const endRound = (success: boolean, reactionTime?: number, userAnswer?: number) => {
    if (!currentTask || isEndingRound.current) return;

    isEndingRound.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalReactionTime = reactionTime || (Date.now() - roundStartTimeRef.current) / 1000;
    const finalUserAnswer = userAnswer || parseInt(userCount) || 0;

    // Doğruluk hesaplama (sapma oranı)
    const accuracy = totalTargetCount > 0 ? Math.max(0, 1 - Math.abs(finalUserAnswer - totalTargetCount) / totalTargetCount) : 0;

    // Performans geçmişine ekle
    const performanceEntry = {
      correct: success,
      accuracy: accuracy,
      round: currentRound + 1
    };

    setPerformanceHistory(prev => [...prev.slice(-4), performanceEntry]); // Son 5 performansı tut

    console.log('📈 [PERFORMANCE] Yeni kayıt:', {
      round: currentRound + 1,
      correct: success,
      accuracy: accuracy.toFixed(2),
      userAnswer: finalUserAnswer,
      correctAnswer: totalTargetCount,
      currentDurationMultiplier: gameDurationMultiplier.toFixed(2)
    });

    const round: CountRound = {
      task: currentTask,
      startTime: roundStartTimeRef.current,
      endTime: Date.now(),
      success,
      reactionTime: finalReactionTime,
      userAnswer: finalUserAnswer,
      correctAnswer: totalTargetCount
    };

    setRounds(prev => [...prev, round]);

    if (success) {
      setScore(prev => prev + 1);
      const emotion: EmotionResult = {
        emotion: 'happy',
        confidence: 0.9,
        timestamp: new Date()
      };
      setEmotions(prev => [...prev, emotion]);
      onEmotionDetected?.(emotion);
    } else {
      const emotion: EmotionResult = {
        emotion: 'confused',
        confidence: 0.7,
        timestamp: new Date()
      };
      setEmotions(prev => [...prev, emotion]);
      onEmotionDetected?.(emotion);
    }

    setGameState('waiting');

    setTimeout(() => {
      if (currentRound + 1 >= totalRounds) {
        completeGame();
      } else {
        setCurrentRound(prev => prev + 1);
        setCountingObjects([]);
        setUserCount('');
        setTotalTargetCount(0);
        setCountingStartTime(0);
        generateFirstTask();
        setGameState('ready');
      }
      isEndingRound.current = false;
    }, 2000);
  };

  // Oyunu tamamla
  const completeGame = () => {
    setGameState('completed');
    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
    onGameComplete(score, gameDuration, emotions);
  };

  // Oyunu yeniden başlat
  const restartGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRounds([]);
    setCurrentRound(0);
    setScore(0);
    setEmotions([]);
    setGameState('ready');
    setCountingObjects([]);
    setUserCount('');
    setTotalTargetCount(0);
    setCountingStartTime(0);

    // Dinamik zorluk state'lerini sıfırla
    setDynamicDifficulty(difficulty);
    setGameDurationMultiplier(1.0);
    setPerformanceHistory([]);

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
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Target className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Dikkat Sayma Oyunu Tamamlandı!</h2>
            <p className="text-gray-600">Sayma becerin gelişiyor!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{score}/{totalRounds}</div>
                <div className="text-sm text-gray-600">Doğru Sayım</div>
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
                <div className="text-sm text-gray-600">Ort. Süre</div>
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
                <span className="text-xs text-purple-600">
                  Zorluk: {difficulty}
                  {gameDurationMultiplier !== 1.0 &&
                    <span className="ml-1 text-xs bg-purple-100 px-1 rounded">
                      ⏱️ {gameDurationMultiplier > 1.0 ? '⬆️' : '⬇️'} {gameDurationMultiplier.toFixed(1)}x
                    </span>
                  }
                </span>
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
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Senin için özel sayma görevi hazırlanıyor...</p>
            </div>
          ) : gameState === 'ready' ? (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Play className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dikkat Sayma</h2>
              <p className="text-gray-600 mb-6">
                Beliren objeleri dikkatli şekilde say ve konsantrasyonunu geliştir!
              </p>
              {currentTask && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-green-800 mb-2">Görevin:</h3>
                  <p className="text-green-700">{currentTask.gorev}</p>
                  {currentTask.ipuclari.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-green-600 font-medium mb-1">İpuçları:</p>
                      {currentTask.ipuclari.map((ipucu, index) => (
                        <p key={index} className="text-xs text-green-600">• {ipucu}</p>
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
              <div className="text-6xl font-bold text-green-600 animate-bounce">
                {countdown}
              </div>
            </div>
          ) : gameState === 'active' ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">{currentTask?.gorev}</h2>

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
                    className="w-20 h-12 text-center text-xl font-bold border-2 border-green-400 rounded-lg focus:outline-none focus:border-green-600"
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
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-mono font-bold text-green-600">{timeLeft}s</span>
              </div>

              {/* Son 5 saniye uyarı mesajı */}
              {showFinalMessage && (
                <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600 animate-spin" />
                    <p className="text-orange-700 font-bold text-lg">
                      ⏰ Son {timeLeft} saniye! Cevabını yaz ve gönder!
                    </p>
                  </div>
                  <p className="text-orange-600 text-sm mt-2">
                    Objeler artık çıkmıyor, şimdi sayını gir
                  </p>
                </div>
              )}
            </div>
          ) : gameState === 'waiting' ? (
            <div className="space-y-4">
              {rounds.length > 0 && rounds[rounds.length - 1].success ? (
                <div className="text-green-600">
                  <Star className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Mükemmel!</h3>
                  <p>Doğru cevap: {rounds[rounds.length - 1].correctAnswer}</p>
                  <p>Senin cevabın: {rounds[rounds.length - 1].userAnswer}</p>
                </div>
              ) : (
                <div className="text-orange-600">
                  <Target className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Bir daha deneyelim!</h3>
                  {rounds.length > 0 && (
                    <>
                      <p>Doğru cevap: {rounds[rounds.length - 1].correctAnswer}</p>
                      <p>Senin cevabın: {rounds[rounds.length - 1].userAnswer}</p>
                    </>
                  )}
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
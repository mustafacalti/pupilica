import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { AttentionSprintTask, AttentionSprintPerformance, EmotionResult } from '../../types';
import { attentionSprintGenerator } from '../../services/attentionSprintGenerator';
import { emotionAnalysisService } from '../../services/emotionAnalysisService';
import { adaptiveDifficultyService } from '../../services/adaptiveDifficultyService';
import { cameraEmotionService } from '../../services/cameraEmotionService';
import { Clock, Target, Zap, RotateCcw, Star, Brain, Play, Camera, Eye } from 'lucide-react';

// Basit X ikonu – className kabul etsin (TS hatasını önlemek için)
const X: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className }) => (
  <span className={className}>❌</span>
);

interface AttentionDynamicGameProps {
  studentId: string;
  studentAge?: number;
  difficulty: 'kolay' | 'orta' | 'zor';
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

interface DynamicRound {
  task: AttentionSprintTask;
  startTime: number;
  endTime?: number;
  success: boolean;
  reactionTime: number; // Tur tamamlama süresi (s)
  correctClicks: number;
  wrongClicks: number;
  totalSpawned: number;
  targetSpawned: number; // Kaç hedef kutucuk çıktı
  targetHitRate: number; // Hedef kutucuk yakalama oranı (0-1)
  avgReactionTimeMs?: number; // Gerçek ortalama reaksiyon süresi (ms)
  // Yeni detaylı metrikler
  fastClicks: number; // Hızlı tıklama sayısı (ADHD kriterine göre)
  totalClicksAnalyzed: number; // Toplam analiz edilen tıklama sayısı
  fastClickRate: number; // Hızlı tıklama oranı (0-1)
  correctFastClicks: number; // Hem doğru hem hızlı tıklamalar
  fastAccuracyRate: number; // Hızlı tıklamalardaki doğruluk oranı (0-1)
}

interface ClickAnalytic {
  timestamp: number;
  reactionTime: number;
  isCorrect: boolean;
  isFast: boolean; // 3 saniye altında mı?
}

export const AttentionDynamicGame: React.FC<AttentionDynamicGameProps> = ({
  studentId,
  studentAge = 12,
  difficulty,
  onGameComplete,
  onEmotionDetected,
}) => {
  const [currentTask, setCurrentTask] = useState<AttentionSprintTask | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'active' | 'waiting' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [rounds, setRounds] = useState<DynamicRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const emotionsRef = useRef<EmotionResult[]>([]); // Real-time emotions için ref
  const [gameStartTime] = useState(Date.now());
  const [countdown, setCountdown] = useState(2); // Daha kısa countdown
  const [isGenerating, setIsGenerating] = useState(false);

  // Emotion analysis states
  const [emotionAnalysisActive, setEmotionAnalysisActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<any | null>(null);
  const [attentionMetrics, setAttentionMetrics] = useState<any | null>(null);
  const [difficultyAdjustment, setDifficultyAdjustment] = useState<any | null>(null);
  const [realtimeFeedback, setRealtimeFeedback] = useState<string>('');

  // Dinamik tıklama modu için state'ler
  const [clickingObjects, setClickingObjects] = useState<{
    id: string;
    x: number;
    y: number;
    value: string;
    isTarget: boolean;
    createdAt: number;
    lifespan: number;
  }[]>([]);
  const [correctClicks, setCorrectClicks] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  // Ref ile de takip et - state async olduğu için
  const correctClicksRef = useRef(0);
  const wrongClicksRef = useRef(0);
  const [totalSpawned, setTotalSpawned] = useState(0);
  const [targetSpawned, setTargetSpawned] = useState(0); // Hedef kutucuk sayısı
  const targetSpawnedRef = useRef(0);
  // Sadece tıklanan kutucukların reaksiyon süreleri
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const reactionTimesRef = useRef<number[]>([]);

  // Detaylı tıklama analizi için
  const [clickAnalytics, setClickAnalytics] = useState<ClickAnalytic[]>([]);
  const clickAnalyticsRef = useRef<ClickAnalytic[]>([]);

  // Şekil renkleri için CSS color mapping
  const getShapeColor = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'kırmızı': '#dc2626',
      'mavi': '#2563eb',
      'yeşil': '#16a34a',
      'sarı': '#eab308',
      'mor': '#9333ea',
      'turuncu': '#ea580c',
    };
    return colorMap[colorName] || '#dc2626';
  };

  // Şekil render fonksiyonu
  const renderShape = (value: string) => {
    if (value.includes('-')) {
      const [shape, color] = value.split('-');
      const shapeColor = getShapeColor(color);

      switch (shape) {
        case 'triangle':
          return (
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderBottom: `30px solid ${shapeColor}`,
              }}
            />
          );

        case 'circle':
          return <div className="w-8 h-8 rounded-full" style={{ backgroundColor: shapeColor }} />;

        case 'square':
          return <div className="w-8 h-8" style={{ backgroundColor: shapeColor }} />;

        case 'star':
          return (
            <div
              className="relative w-8 h-8"
              style={{
                clipPath:
                  'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                backgroundColor: shapeColor,
              }}
            />
          );

        case 'heart':
          return (
            <div className="relative w-8 h-8" style={{ transform: 'rotate(-45deg)' }}>
              <div className="w-6 h-6 rounded-full absolute top-0 left-1" style={{ backgroundColor: shapeColor }} />
              <div className="w-6 h-6 rounded-full absolute top-1 left-0" style={{ backgroundColor: shapeColor }} />
              <div className="w-4 h-4 absolute top-3 left-2" style={{ backgroundColor: shapeColor }} />
            </div>
          );

        case 'diamond':
          return <div className="w-8 h-8 transform rotate-45" style={{ backgroundColor: shapeColor }} />;

        default:
          return value;
      }
    }

    // Normal emoji değerleri için
    return value;
  };

  const roundStartTimeRef = useRef<number>(0);
  const hasGeneratedFirstTask = useRef(false);
  const isGeneratingRef = useRef(false);
  const isEndingRound = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const totalRounds = 5;

  // ADHD'li çocuklar için hızlı tıklama kriteri (milisaniye)
  const FAST_CLICK_THRESHOLD_MS = 3000; // 3 saniye altı "hızlı" sayılır

  // Emotion tracking fonksiyonları
  const startEmotionTracking = useCallback(async () => {
    console.log('🎭 [EMOTION] Emotion tracking başlatılıyor...');

    setEmotionAnalysisActive(true);

    // Prop ile çakışmayı önlemek için isim değiştirildi
    const handleDetectedEmotion = (result: any) => {
      if (!emotionAnalysisService.isGameActiveStatus()) {
        // Oyun aktif değilse emotion callback'i işleme
        return;
      }

      setCurrentEmotion(result);
      emotionAnalysisService.addEmotionResult(result);

      const metrics = emotionAnalysisService.getCurrentGameMetrics();
      setAttentionMetrics(metrics);

      const feedback = adaptiveDifficultyService.getRealtimeFeedback(metrics);
      setRealtimeFeedback(feedback.message);

      // Legacy emotion sistem için de ekle - SADECE OYUN AKTİFKEN
      const legacyEmotion: EmotionResult = {
        emotion: result.emotion,
        confidence: result.confidence,
        timestamp: result.timestamp,
      };

      setEmotions((prev) => {
        const newEmotions = [...prev.slice(-10), legacyEmotion];
        emotionsRef.current = newEmotions; // Ref'i de güncelle - real-time erişim için
        return newEmotions;
      });

      // Dışarı bildirim (prop)
      onEmotionDetected?.(legacyEmotion);
    };

    // Önce gerçek kamera dene
    let cameraSuccess = false;
    if (videoRef.current) {
      cameraSuccess = await cameraEmotionService.startEmotionTracking(
        videoRef.current,
        handleDetectedEmotion
      );
    }

    if (!cameraSuccess) {
      console.log('📱 [EMOTION] Gerçek kamera bulunamadı - Python server çalışıyor mu?');
      console.log("💡 [TIP] Terminal'de çalıştır: python emotion_server.py");
    }

    console.log('✅ [EMOTION] Emotion tracking aktif');
  }, [onEmotionDetected]);

  const stopEmotionTracking = useCallback(() => {
    console.log('⏹️ [EMOTION] Emotion tracking durduruluyor...');

    cameraEmotionService.stopEmotionTracking();
    setEmotionAnalysisActive(false);

    const finalMetrics = emotionAnalysisService.endGameSession();
    setAttentionMetrics(finalMetrics);

    console.log('🏁 [EMOTION] Final metrics:', finalMetrics);
  }, []);

  // İlk görevi AI'dan yükle
  useEffect(() => {
    if (!hasGeneratedFirstTask.current && !isGenerating) {
      console.log("🤖 [TASK] İlk görev AI'dan yükleniyor (emotion data olmadan)");
      hasGeneratedFirstTask.current = true;
      generateFirstTask();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // yalnızca mount/unmount

  // Güncel rounds array'i ile task generate et
  const generateFirstTaskWithRounds = useCallback(
    async (roundsArray: DynamicRound[], currentCorrectParam?: number, currentWrongParam?: number) => {
      if (isGeneratingRef.current) return;

      isGeneratingRef.current = true;
      setIsGenerating(true);

      // Parametre varsa kullan, yoksa state'den al
      const currentCorrectClicks = currentCorrectParam ?? correctClicks;
      const currentWrongClicks = currentWrongParam ?? wrongClicks;

      // Gerçek performans verilerini hesapla - roundsArray'den topla
      const totalCorrectFromRounds = roundsArray.reduce((sum, r) => sum + r.correctClicks, 0);
      const totalWrongFromRounds = roundsArray.reduce((sum, r) => sum + r.wrongClicks, 0);
      const totalTargetSpawnedFromRounds = roundsArray.reduce((sum, r) => sum + r.targetSpawned, 0);
      const currentCorrect = totalCorrectFromRounds + currentCorrectClicks; // Mevcut tur + geçmiş turlar
      const currentWrong = totalWrongFromRounds + currentWrongClicks;
      const currentTargetSpawned = totalTargetSpawnedFromRounds + (targetSpawnedRef.current || 0);
      const totalClicks = currentCorrect + currentWrong;
      const currentAccuracy = totalClicks > 0 ? currentCorrect / totalClicks : 0.5; // Default %50
      const targetHitRate = currentTargetSpawned > 0 ? currentCorrect / currentTargetSpawned : 0.5; // Hedef yakalama oranı

      // Gerçek reaksiyon süresi ortalaması (sadece tıklanan kutucuklar)
      const allReactionTimes = [...reactionTimesRef.current];
      roundsArray.forEach((round) => {
        if (round.avgReactionTimeMs) {
          allReactionTimes.push(round.avgReactionTimeMs);
        }
      });

      const avgReactionTime =
        allReactionTimes.length > 0
          ? allReactionTimes.reduce((sum, time) => sum + time, 0) / allReactionTimes.length / 1000 // saniyeye çevir
          : 2.5; // Default 2.5s

      // Mevcut tur için ortalama reaksiyon süresi
      const currentTurAvgReactionTime =
        reactionTimesRef.current.length > 0
          ? reactionTimesRef.current.reduce((sum, time) => sum + time, 0) /
            reactionTimesRef.current.length
          : 0;

      // Rounds'u AttentionSprintPerformance formatına çevir
      const formattedRounds = roundsArray.slice(-3).map((round) => ({
        basari: round.success,
        sure: round.reactionTime,
        zorluk: difficulty as 'kolay' | 'orta' | 'zor',
        hedefTipi: 'renk' as const, // Dinamik tıklama renk hedefli
        hizliCozum: round.reactionTime < 2.0, // 2 saniyenin altı hızlı
        zamanlamaSapmasi: Math.abs(round.reactionTime - (currentTask?.sure_saniye || 30)),
        hedefZaman: currentTask?.sure_saniye || 30,
      }));

      const hizliCozumSayisi = formattedRounds.filter((r) => r.hizliCozum).length;

      const currentMetrics = emotionAnalysisService.getCurrentGameMetrics();

      const initialPerformance: AttentionSprintPerformance = {
        son3Tur: formattedRounds as any,
        ortalamaReaksiyonSuresi: avgReactionTime,
        basariOrani: currentAccuracy,
        odaklanmaDurumu: 'ai-analiz' as any, // AI'ın analiz etmesi için placeholder
        attentionMetrics: currentMetrics as any,
        sayiGorevPerformansi: {
          ortalamaSayiZorlugu: difficulty === 'kolay' ? 3 : difficulty === 'orta' ? 5 : 7,
          sayiBasariOrani: currentAccuracy,
          ortalamaReaksiyonSuresiSayi: avgReactionTime,
          hizliCozumSayisi,
          hedefYakalamaOrani: targetHitRate,
          toplamHedefSayisi: currentTargetSpawned,
          yakalinanHedefSayisi: currentCorrect,
          yanlisTiklamaSayisi: currentWrong,
          // KÜMÜLATIF PERFORMANS (TÜM TURLAR)
          hizliTiklamaOrani:
            roundsArray.length > 0 ? roundsArray.reduce((sum, r) => sum + r.fastClickRate, 0) / roundsArray.length : 0,
          hizliTiklamaSayisi: roundsArray.reduce((sum, r) => sum + r.fastClicks, 0),
          toplamTiklamaSayisi: roundsArray.reduce((sum, r) => sum + r.totalClicksAnalyzed, 0),
          hizliVeDogruTiklamalar: roundsArray.reduce((sum, r) => sum + r.correctFastClicks, 0),
          hizliTiklamaDogrulukOrani:
            roundsArray.length > 0 ? roundsArray.reduce((sum, r) => sum + r.fastAccuracyRate, 0) / roundsArray.length : 0,
          // SON ROUND PERFORMANSI (SADECE O TUR)
          sonRoundHizliTiklamaOrani: roundsArray.length > 0 ? roundsArray[roundsArray.length - 1].fastClickRate : 0,
          sonRoundHizliTiklamaSayisi: roundsArray.length > 0 ? roundsArray[roundsArray.length - 1].fastClicks : 0,
          sonRoundToplamTiklamaSayisi: roundsArray.length > 0 ? roundsArray[roundsArray.length - 1].totalClicksAnalyzed : 0,
          sonRoundHizliVeDogruTiklamalar: roundsArray.length > 0 ? roundsArray[roundsArray.length - 1].correctFastClicks : 0,
          sonRoundHizliTiklamaDogrulukOrani: roundsArray.length > 0 ? roundsArray[roundsArray.length - 1].fastAccuracyRate : 0,
          odaklanmaSayisi: roundsArray.length,
        } as any,
      } as any;

      try {
        const currentRoundEmotions = emotionAnalysisService.getCurrentRoundEmotions();
        const fullGameEmotions = emotionAnalysisService.getFullGameEmotions();

        const emotionDataForAI = currentRoundEmotions.length > 0 ? JSON.stringify(currentRoundEmotions) : undefined;

        console.log('🤖 [AI PROMPT DATA WITH UPDATED ROUNDS]', {
          hasEmotionData: !!emotionDataForAI,
          roundEmotionCount: currentRoundEmotions.length,
          fullGameEmotionCount: fullGameEmotions.length,
          legacyEmotionCount: emotions.length,
          roundsCount: roundsArray.length,
          kumulatifFastClickData: {
            hizliTiklamaOrani: initialPerformance.sayiGorevPerformansi?.hizliTiklamaOrani,
            hizliTiklamaSayisi: initialPerformance.sayiGorevPerformansi?.hizliTiklamaSayisi,
            toplamTiklamaSayisi: initialPerformance.sayiGorevPerformansi?.toplamTiklamaSayisi,
          },
          sonRoundFastClickData: {
            sonRoundHizliTiklamaOrani: initialPerformance.sayiGorevPerformansi?.sonRoundHizliTiklamaOrani,
            sonRoundHizliTiklamaSayisi: initialPerformance.sayiGorevPerformansi?.sonRoundHizliTiklamaSayisi,
            sonRoundToplamTiklamaSayisi: initialPerformance.sayiGorevPerformansi?.sonRoundToplamTiklamaSayisi,
          }
        });

        const task = await attentionSprintGenerator.generateAttentionSprint({
          performansOzeti: initialPerformance,
          studentAge,
          sonGorevler: ['dinamik-tıklama'],
          emotionData: emotionDataForAI,
        });

        const correctedTaskText = filterDynamicTaskOnly(task.gorev);

        const filteredTask: AttentionSprintTask = {
          ...task,
          difficulty,
          gorev: correctedTaskText,
          sure_saniye: task.sure_saniye,
        } as AttentionSprintTask;

        setCurrentTask(filteredTask);
        setTimeLeft(filteredTask.sure_saniye);
      } catch (error) {
        console.error('İlk görev üretme hatası:', error);
        setCurrentTask(getFallbackDynamicTask());
      } finally {
        isGeneratingRef.current = false;
        setIsGenerating(false);
      }
    },
    [studentAge, difficulty, correctClicks, wrongClicks]
  );

  const generateFirstTask = useCallback(
    async (currentCorrectParam?: number, currentWrongParam?: number) => {
      if (isGeneratingRef.current) return;

      isGeneratingRef.current = true;
      setIsGenerating(true);

      // Parametre varsa kullan, yoksa state'den al
      const currentCorrectClicks = currentCorrectParam ?? correctClicks;
      const currentWrongClicks = currentWrongParam ?? wrongClicks;

      // Gerçek performans verilerini hesapla - rounds array'den topla
      const totalCorrectFromRounds = rounds.reduce((sum, r) => sum + r.correctClicks, 0);
      const totalWrongFromRounds = rounds.reduce((sum, r) => sum + r.wrongClicks, 0);
      const totalTargetSpawnedFromRounds = rounds.reduce((sum, r) => sum + r.targetSpawned, 0);
      const currentCorrect = totalCorrectFromRounds + currentCorrectClicks; // Mevcut tur + geçmiş turlar
      const currentWrong = totalWrongFromRounds + currentWrongClicks;
      const currentTargetSpawned = totalTargetSpawnedFromRounds + (targetSpawnedRef.current || 0);
      const totalClicks = currentCorrect + currentWrong;
      const currentAccuracy = totalClicks > 0 ? currentCorrect / totalClicks : 0.5; // Default %50
      const targetHitRate = currentTargetSpawned > 0 ? currentCorrect / currentTargetSpawned : 0.5; // Hedef yakalama oranı

      // Gerçek reaksiyon süresi ortalaması (sadece tıklanan kutucuklar)
      const allReactionTimes = [...reactionTimesRef.current];
      rounds.forEach((round) => {
        if (round.avgReactionTimeMs) {
          allReactionTimes.push(round.avgReactionTimeMs);
        }
      });

      const avgReactionTime =
        allReactionTimes.length > 0
          ? allReactionTimes.reduce((sum, time) => sum + time, 0) / allReactionTimes.length / 1000 // saniyeye çevir
          : 2.5; // Default 2.5s

      // Mevcut tur için ortalama reaksiyon süresi
      const currentTurAvgReactionTime =
        reactionTimesRef.current.length > 0
          ? reactionTimesRef.current.reduce((sum, time) => sum + time, 0) /
            reactionTimesRef.current.length
          : 0;

      // Rounds'u AttentionSprintPerformance formatına çevir
      const formattedRounds = rounds.slice(-3).map((round) => ({
        basari: round.success,
        sure: round.reactionTime,
        zorluk: difficulty as 'kolay' | 'orta' | 'zor',
        hedefTipi: 'renk' as const, // Dinamik tıklama renk hedefli
        hizliCozum: round.reactionTime < 2.0, // 2 saniyenin altı hızlı
        zamanlamaSapmasi: Math.abs(round.reactionTime - (currentTask?.sure_saniye || 30)),
        hedefZaman: currentTask?.sure_saniye || 30,
      }));

      const hizliCozumSayisi = formattedRounds.filter((r) => r.hizliCozum).length;

      const currentMetrics = emotionAnalysisService.getCurrentGameMetrics();

      const initialPerformance: AttentionSprintPerformance = {
        son3Tur: formattedRounds as any,
        ortalamaReaksiyonSuresi: avgReactionTime,
        basariOrani: currentAccuracy,
        odaklanmaDurumu: 'ai-analiz' as any, // AI'ın analiz etmesi için placeholder
        attentionMetrics: currentMetrics as any,
        sayiGorevPerformansi: {
          ortalamaSayiZorlugu: difficulty === 'kolay' ? 3 : difficulty === 'orta' ? 5 : 7,
          sayiBasariOrani: currentAccuracy,
          ortalamaReaksiyonSuresiSayi: avgReactionTime,
          hizliCozumSayisi,
          hedefYakalamaOrani: targetHitRate,
          toplamHedefSayisi: currentTargetSpawned,
          yakalinanHedefSayisi: currentCorrect,
          yanlisTiklamaSayisi: currentWrong,
          hizliTiklamaOrani:
            rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.fastClickRate, 0) / rounds.length : 0,
          hizliTiklamaSayisi: rounds.reduce((sum, r) => sum + r.fastClicks, 0),
          toplamTiklamaSayisi: rounds.reduce((sum, r) => sum + r.totalClicksAnalyzed, 0),
          hizliVeDogruTiklamalar: rounds.reduce((sum, r) => sum + r.correctFastClicks, 0),
          hizliTiklamaDogrulukOrani:
            rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.fastAccuracyRate, 0) / rounds.length : 0,
          odaklanmaSayisi: rounds.length,
        } as any,
      } as any;

      try {
        const currentRoundEmotions = emotionAnalysisService.getCurrentRoundEmotions();
        const fullGameEmotions = emotionAnalysisService.getFullGameEmotions();

        const emotionDataForAI = currentRoundEmotions.length > 0 ? JSON.stringify(currentRoundEmotions) : undefined;

        console.log('🤖 [AI PROMPT DATA]', {
          hasEmotionData: !!emotionDataForAI,
          roundEmotionCount: currentRoundEmotions.length,
          fullGameEmotionCount: fullGameEmotions.length,
          legacyEmotionCount: emotions.length,
          isFirstTask: !rounds.length,
        });

        const task = await attentionSprintGenerator.generateAttentionSprint({
          performansOzeti: initialPerformance,
          studentAge,
          sonGorevler: ['dinamik-tıklama'],
          emotionData: emotionDataForAI,
        });

        const correctedTaskText = filterDynamicTaskOnly(task.gorev);

        const filteredTask: AttentionSprintTask = {
          ...task,
          difficulty,
          gorev: correctedTaskText,
          sure_saniye: task.sure_saniye,
        } as AttentionSprintTask;

        setCurrentTask(filteredTask);
        setTimeLeft(filteredTask.sure_saniye);
      } catch (error) {
        console.error('İlk görev üretme hatası:', error);
        setCurrentTask(getFallbackDynamicTask());
      } finally {
        isGeneratingRef.current = false;
        setIsGenerating(false);
      }
    },
    // Bu fonksiyon, pek çok state okuyor ama yalnızca dış parametrelere bağımlı bırakmak daha güvenli
    [studentAge, difficulty, rounds, correctClicks, wrongClicks]
  );

  // Sadece dinamik tıklama görevlerini filtrele veya dinamik göreve çevir
  const filterDynamicTaskOnly = (gorev: string): string => {
    const text = gorev.toLowerCase();

    // Eğer zaten dinamik tıklama görevi ise olduğu gibi döndür
    if (text.includes('tıkla') || text.includes('yakala')) return gorev;

    // Değilse dinamik tıklama görevine çevir
    const colors = [
      { turkish: 'mavi', emoji: '🔵' },
      { turkish: 'kırmızı', emoji: '🔴' },
      { turkish: 'yeşil', emoji: '🟢' },
      { turkish: 'sarı', emoji: '🟡' },
    ];
    const shapes = [
      { turkish: 'daire', emoji: '⭕' },
      { turkish: 'kare', emoji: '⬜' },
      { turkish: 'üçgen', emoji: '🔺' },
      { turkish: 'yıldız', emoji: '⭐' },
    ];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

    const timeText =
      difficulty === 'kolay' ? '20 saniye' : difficulty === 'orta' ? '30 saniye' : '40 saniye';

    return `${timeText} içinde tüm ${randomColor.emoji} ${randomColor.turkish} ${randomShape.turkish}leri tıkla`;
  };

  const getFallbackDynamicTask = (): AttentionSprintTask => {
    const tasks = {
      kolay: [
        { gorev: '20 saniye içinde tüm mavi daireleri tıkla', hedefRenk: 'mavi', hedefSekil: 'daire', sure: 20 },
        { gorev: '20 saniye içinde tüm yeşil kareleri yakala', hedefRenk: 'yeşil', hedefSekil: 'kare', sure: 20 },
        { gorev: '20 saniye içinde tüm sarı yıldızları tıkla', hedefRenk: 'sarı', hedefSekil: 'yıldız', sure: 20 },
      ],
      orta: [
        { gorev: '30 saniye içinde tüm kırmızı üçgenleri tıkla', hedefRenk: 'kırmızı', hedefSekil: 'üçgen', sure: 30 },
        { gorev: '30 saniye içinde tüm mavi kareleri yakala', hedefRenk: 'mavi', hedefSekil: 'kare', sure: 30 },
        { gorev: '30 saniye içinde tüm yeşil daireleri tıkla', hedefRenk: 'yeşil', hedefSekil: 'daire', sure: 30 },
      ],
      zor: [
        { gorev: '40 saniye içinde tüm hızlı hedefleri yakala', hedefRenk: 'kırmızı', hedefSekil: 'yıldız', sure: 40 },
        { gorev: '40 saniye içinde tüm mavi üçgenleri tıkla', hedefRenk: 'mavi', hedefSekil: 'üçgen', sure: 40 },
        { gorev: '40 saniye içinde tüm karışık hedefleri yakala', hedefRenk: 'yeşil', hedefSekil: 'kare', sure: 40 },
      ],
    } as const;

    const levelTasks = tasks[difficulty];
    const selectedTask = levelTasks[Math.floor(Math.random() * levelTasks.length)];

    return {
      id: `dynamic_fallback_${Date.now()}`,
      ...selectedTask,
      sure_saniye: selectedTask.sure,
      ipuclari: ['Hızlı ol', 'Doğru hedefleri seç'],
      dikkatDagitici: difficulty === 'kolay' ? 0.3 : difficulty === 'orta' ? 0.5 : 0.7,
      difficulty,
      hedefTipi: 'renk' as any,
    } as unknown as AttentionSprintTask;
  };

  // Zorluk seviyesine göre tıklama parametreleri (default)
  const getClickingParams = (d: 'kolay' | 'orta' | 'zor') => {
    switch (d) {
      case 'kolay':
        return { spawnInterval: 3000, objectLifespan: 6000, targetRatio: 0.7 };
      case 'orta':
        return { spawnInterval: 2500, objectLifespan: 5000, targetRatio: 0.6 };
      case 'zor':
        return { spawnInterval: 2000, objectLifespan: 4000, targetRatio: 0.5 };
      default:
        return { spawnInterval: 2500, objectLifespan: 5000, targetRatio: 0.6 };
    }
  };

  // Oyunu başlat
  const startRound = async () => {
    if (!currentTask) return;

    setGameState('countdown');
    setCountdown(2); // Daha kısa countdown

    // Emotion tracking başlat - oyun başlamadan önce kamera hazırla
    await startEmotionTracking();

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
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
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          endRound(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Rastgele pozisyon üret
  const generateRandomPosition = () => ({
    x: Math.random() * 70 + 15,
    y: Math.random() * 60 + 20,
  });

  // Dinamik tıklama objeleri spawn et
  const startClickingSpawn = () => {
    const params = currentTask?.gameParams
      ? {
          spawnInterval: currentTask.gameParams.spawnInterval,
          objectLifespan: currentTask.gameParams.objectLifespan,
          targetRatio: currentTask.gameParams.targetRatio,
        }
      : getClickingParams(difficulty);

    console.log('🎮 [GAME PARAMS]', {
      source: currentTask?.gameParams ? 'AI-emotion-based' : 'default-difficulty',
      spawnInterval: `${params.spawnInterval}ms`,
      objectLifespan: `${params.objectLifespan}ms`,
      targetRatio: `${(params.targetRatio * 100).toFixed(1)}%`,
      aiParams: currentTask?.gameParams,
    });

    setCorrectClicks(0);
    setWrongClicks(0);
    setTotalSpawned(0);
    setTargetSpawned(0);
    targetSpawnedRef.current = 0;

    const spawnObject = () => {
      const shouldSpawnTarget = Math.random() < params.targetRatio;
      const position = generateRandomPosition();

      let value = '';
      if (currentTask?.hedefRenk && currentTask?.hedefSekil) {
        if (shouldSpawnTarget) {
          if (currentTask.hedefSekil === 'daire') value = `circle-${currentTask.hedefRenk}`;
          else if (currentTask.hedefSekil === 'kare') value = `square-${currentTask.hedefRenk}`;
          else if (currentTask.hedefSekil === 'üçgen') value = `triangle-${currentTask.hedefRenk}`;
          else if (currentTask.hedefSekil === 'yıldız') value = `star-${currentTask.hedefRenk}`;
          else if (currentTask.hedefSekil === 'kalp') value = `heart-${currentTask.hedefRenk}`;
          else if (currentTask.hedefSekil === 'elmas') value = `diamond-${currentTask.hedefRenk}`;
          else value = '🔴';
        } else {
          const wrongValues = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '⭕', '⬜', '🔺', '💎'];
          value = wrongValues[Math.floor(Math.random() * wrongValues.length)];
        }
      } else if (currentTask?.hedefRenk) {
        const colorMap: Record<string, string> = {
          kırmızı: '🔴',
          mavi: '🔵',
          yeşil: '🟢',
          sarı: '🟡',
          mor: '🟣',
          turuncu: '🟠',
        };
        if (shouldSpawnTarget) {
          value = colorMap[currentTask.hedefRenk] || '🔵';
        } else {
  const hr = currentTask?.hedefRenk as keyof typeof colorMap | undefined;
  const targetEmoji = hr ? colorMap[hr] : undefined;
  const pool = Object.values(colorMap).filter(c => c !== targetEmoji);
  const fallback = Object.values(colorMap)[0];
  value = (pool[Math.floor(Math.random() * pool.length)] ?? fallback);
}
      } else if (currentTask?.hedefSekil) {
        const shapeMap: Record<string, string> = {
          yıldız: 'star-kırmızı',
          daire: 'circle-kırmızı',
          kare: 'square-kırmızı',
          üçgen: 'triangle-kırmızı',
          kalp: 'heart-kırmızı',
          elmas: 'diamond-kırmızı',
        };

        if (shouldSpawnTarget) value = shapeMap[currentTask.hedefSekil] || 'triangle-kırmızı';
        else {
  const hs = currentTask?.hedefSekil;
  const wrongShapes = hs
    ? Object.values(shapeMap).filter((s) => s !== shapeMap[hs])
    : Object.values(shapeMap); // Eğer hedef şekil yoksa tüm şekiller kullanılır
  
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
        lifespan: params.objectLifespan,
      };

      setClickingObjects((prev) => [...prev, newObject]);
      setTotalSpawned((prev) => prev + 1);

      if (shouldSpawnTarget) {
        setTargetSpawned((prev) => prev + 1);
        targetSpawnedRef.current += 1;
      }

      // Objeyi yaşam süresinden sonra kaldır
      setTimeout(() => {
        setClickingObjects((prev) => prev.filter((obj) => obj.id !== newObject.id));
      }, params.objectLifespan);
    };

    // İlk objeyi hemen spawn et
    spawnObject();

    // İLK OBJE SPAWN OLDU - FRAME ANALİZİ BAŞLAT
    cameraEmotionService.startFrameAnalysis?.();

    // Düzenli spawn
    const spawnIntervalId: ReturnType<typeof setInterval> = setInterval(
      spawnObject,
      params.spawnInterval
    );

    // Süre bitiminde spawn'ı durdur
    setTimeout(() => {
      clearInterval(spawnIntervalId);
    }, (currentTask?.sure_saniye || 30) * 1000);
  };

  // Görevi başlat
  const startTask = () => {
    if (!currentTask) return;

    setGameState('active');
    setTimeLeft(currentTask.sure_saniye);
    setTotalSpawned(0);

    // OYUN BAŞLADI - emotion kaydetmeyi başlat
    emotionAnalysisService.startGameSession();
    // İLK ROUND BAŞLADI - round emotion tracking başlat
    emotionAnalysisService.startRoundSession();

    // Dinamik tıklama modunu başlat
    startClickingSpawn();
    startTimer();
  };

  // Dinamik tıklama objesine tıklama
  const handleClickingObjectClick = (objectId: string, isTargetObject: boolean) => {
    const clickTime = Date.now();

    // Tıklanan objeyi bul ve reaksiyon süresini hesapla
    const clickedObject = clickingObjects.find((obj) => obj.id === objectId);
    if (!clickedObject) return;

    const reactionTime = clickTime - clickedObject.createdAt; // milisaniye
    const isFast = reactionTime < FAST_CLICK_THRESHOLD_MS;

    console.log(`⚡ [FAST CLICK DEBUG] Reaction: ${reactionTime}ms, Threshold: ${FAST_CLICK_THRESHOLD_MS}ms, IsFast: ${isFast}`);

    // Genel reaksiyon süresi listesi
    reactionTimesRef.current.push(reactionTime);
    setReactionTimes((prev) => [...prev, reactionTime]);

    // Detaylı analiz için kaydet
    const clickData: ClickAnalytic = {
      timestamp: Date.now(),
      reactionTime,
      isCorrect: isTargetObject,
      isFast,
    };
    clickAnalyticsRef.current.push(clickData);
    setClickAnalytics((prev) => [...prev, clickData]);

    // Objeyi hemen kaldır
    setClickingObjects((prev) => prev.filter((obj) => obj.id !== objectId));

    if (isTargetObject) {
      correctClicksRef.current += 1;
      setCorrectClicks((prev) => prev + 1);
    } else {
      wrongClicksRef.current += 1;
      setWrongClicks((prev) => prev + 1);
    }
  };

  // Turu bitir
  const endRound = (success: boolean, reactionTime?: number) => {
    console.log('🚨 [END ROUND CALLED]', {
      success,
      reactionTime,
      currentTask: !!currentTask,
      isEndingRound: isEndingRound.current,
    });

    if (!currentTask || isEndingRound.current) return;

    isEndingRound.current = true;

    // HEMEN skorları yakala - ref değerlerini kullan (state async olduğu için)
    const capturedCorrect = correctClicksRef.current;
    const capturedWrong = wrongClicksRef.current;
    const capturedTargetSpawned = targetSpawnedRef.current;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalReactionTime = reactionTime || (Date.now() - roundStartTimeRef.current) / 1000;

    // Başarı ölçütü: En az %50 doğruluk oranı ve toplam 3+ tıklama
    const totalClicks = capturedCorrect + capturedWrong;
    const accuracy = totalClicks > 0 ? capturedCorrect / totalClicks : 0;
    const finalSuccess = accuracy >= 0.5 && totalClicks >= 3;

    // Mevcut tur için ortalama reaksiyon süresi hesapla
    const currentTurAvgReactionTime =
      reactionTimesRef.current.length > 0
        ? reactionTimesRef.current.reduce((sum, time) => sum + time, 0) /
          reactionTimesRef.current.length
        : 0;

    // Hedef yakalama oranını hesapla
    const targetHitRate = capturedTargetSpawned > 0 ? capturedCorrect / capturedTargetSpawned : 0;

    // Detaylı tıklama analizini hesapla
    const details = clickAnalyticsRef.current;
    const totalClicksAnalyzed = details.length;
    const fastClicks = details.filter((c) => c.isFast).length;
    const correctFastClicks = details.filter((c) => c.isFast && c.isCorrect).length;
    const fastClickRate = totalClicksAnalyzed > 0 ? fastClicks / totalClicksAnalyzed : 0;
    const fastAccuracyRate = fastClicks > 0 ? correctFastClicks / fastClicks : 0;

    console.log('📊 [FAST CLICK DETAILS]', {
      totalClicks: totalClicksAnalyzed,
      fastClicks,
      correctFastClicks,
      fastClickRate: `${(fastClickRate * 100).toFixed(1)}%`,
      fastAccuracyRate: `${(fastAccuracyRate * 100).toFixed(1)}%`,
      allClicks: details.map(c => ({
        reaction: `${c.reactionTime}ms`,
        isFast: c.isFast,
        isCorrect: c.isCorrect
      }))
    });

    const round: DynamicRound = {
      task: currentTask,
      startTime: roundStartTimeRef.current,
      endTime: Date.now(),
      success: finalSuccess,
      reactionTime: finalReactionTime,
      correctClicks: capturedCorrect,
      wrongClicks: capturedWrong,
      totalSpawned,
      targetSpawned: capturedTargetSpawned,
      targetHitRate,
      avgReactionTimeMs: currentTurAvgReactionTime,
      fastClicks,
      totalClicksAnalyzed,
      fastClickRate,
      correctFastClicks,
      fastAccuracyRate,
    };

    // ROUND BİTTİ - o round'a ait emotion'ları al
    const roundEmotions = emotionAnalysisService.endRoundSession();
    console.log('🏁 [ROUND ENDED] Round emotion data:', roundEmotions.length);

    // FRAME ANALİZİ DURDUR - Python server'a frame göndermeyi durdur
    cameraEmotionService.stopFrameAnalysis?.();

    // Tüm oyun bitmemişse final metrics alma
    if (currentRound + 1 >= totalRounds) {
      const finalMetrics = emotionAnalysisService.endGameSession();
      setAttentionMetrics(finalMetrics);
      console.log('⏹️ [GAME ENDED] Emotion kaydetme durdu, final metrics:', finalMetrics);
    }

    // Round'u ekle ve güncel rounds array'i ile task generate et
    setRounds((prev) => {
      const newRounds = [...prev, round];

      // Task generation için güncel rounds array'i kullan
      if (currentRound + 1 < totalRounds) {
        setTimeout(() => {
          generateFirstTaskWithRounds(newRounds, capturedCorrect, capturedWrong);
        }, 100);
      }

      return newRounds;
    });

    // Mini duygusal geri bildirim
    const feedbackEmotion: EmotionResult = finalSuccess
      ? { emotion: 'happy', confidence: 0.9, timestamp: new Date() }
      : { emotion: 'confused', confidence: 0.7, timestamp: new Date() };

    setEmotions((prev) => {
      const newEmotions = [...prev, feedbackEmotion];
      emotionsRef.current = newEmotions;
      return newEmotions;
    });
    onEmotionDetected?.(feedbackEmotion);

    setGameState('waiting');

    setTimeout(() => {
      if (currentRound + 1 >= totalRounds) {
        completeGame();
      } else {
        setCurrentRound((prev) => prev + 1);
        setClickingObjects([]);

        // Skorları ve metrikleri resetle
        setCorrectClicks(0);
        setWrongClicks(0);
        correctClicksRef.current = 0;
        wrongClicksRef.current = 0;
        setReactionTimes([]);
        reactionTimesRef.current = [];
        setTotalSpawned(0);
        setTargetSpawned(0);
        targetSpawnedRef.current = 0;
        setClickAnalytics([]);
        clickAnalyticsRef.current = [];

        // YENİ ROUND BAŞLADI - yeni round emotion tracking başlat
        emotionAnalysisService.startRoundSession();
        setGameState('ready');
      }
      isEndingRound.current = false;
    }, 2000);
  };

  // Oyunu tamamla
  const completeGame = () => {
    setGameState('completed');

    // Emotion tracking tamamen durdur
    stopEmotionTracking();

    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
    onGameComplete(score, gameDuration, emotions);
  };

  // Oyunu yeniden başlat
  const restartGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopEmotionTracking();

    setRounds([]);
    setCurrentRound(0);
    setScore(0);
    setEmotions([]);
    emotionsRef.current = [];
    setGameState('ready');

    // Emotion states sıfırla
    setEmotionAnalysisActive(false);
    setCurrentEmotion(null);
    setAttentionMetrics(null);
    setDifficultyAdjustment(null);
    setRealtimeFeedback('');
    setClickingObjects([]);
    setCorrectClicks(0);
    setWrongClicks(0);
    setTotalSpawned(0);
    setTargetSpawned(0);
    targetSpawnedRef.current = 0;
    setClickAnalytics([]);
    clickAnalyticsRef.current = [];
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
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Target className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Dinamik Dikkat Oyunu Tamamlandı!</h2>
            <p className="text-gray-600">Hızlı karar verme becerin gelişiyor!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{score}/{totalRounds}</div>
                <div className="text-sm text-gray-600">Başarılı Tur</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{Math.round((score / totalRounds) * 100)}%</div>
                <div className="text-sm text-gray-600">Başarı Oranı</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {rounds.length > 0 ? Math.round(rounds.reduce((sum, r) => sum + r.correctClicks, 0) / rounds.length) : 0}
                </div>
                <div className="text-sm text-gray-600">Ort. Doğru Tıklama</div>
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
      {/* Hidden video element for emotion tracking */}
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

      {/* Header */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Tur {currentRound + 1}/{totalRounds}</div>
              <div className="text-sm font-medium text-gray-800">Skor: {score}</div>
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-purple-600">Zorluk: {difficulty}</span>
              </div>

              {/* Emotion tracking status */}
              {emotionAnalysisActive && (
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      cameraEmotionService.isTrackingActive() && cameraEmotionService.isFrameAnalysisActive?.()
                        ? 'bg-green-500'
                        : cameraEmotionService.isTrackingActive()
                        ? 'bg-yellow-500'
                        : 'bg-orange-500'
                    }`}
                  ></div>
                  <Camera className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600">
                    {cameraEmotionService.isTrackingActive() && cameraEmotionService.isFrameAnalysisActive?.()
                      ? 'Analiz Aktif'
                      : cameraEmotionService.isTrackingActive()
                      ? 'Kamera Bağlı'
                      : 'Mock Mode'}
                  </span>
                </div>
              )}

              {/* Real-time emotion display */}
              {currentEmotion && (
                <div className="flex items-center space-x-2">
                  <Eye className={`h-4 w-4 ${currentEmotion.lookingAtScreen ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="text-xs text-gray-600">
                    {currentEmotion.emotion} ({(currentEmotion.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ana Oyun Alanı */}
      <Card>
        <CardContent className="text-center py-12">
          {isGenerating ? (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Senin için özel dinamik görev hazırlanıyor...</p>
            </div>
          ) : gameState === 'ready' ? (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Play className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dinamik Dikkat</h2>
              <p className="text-gray-600 mb-6">Sürekli çıkan hedefleri hızlıca yakala ve reflexlerini geliştir!</p>
              {currentTask && (
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-purple-800 mb-2">Görevin:</h3>
                  <p className="text-purple-700">{currentTask.gorev}</p>
                  {currentTask.ipuclari?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-purple-600 font-medium mb-1">İpuçları:</p>
                      {currentTask.ipuclari.map((ipucu, index) => (
                        <p key={index} className="text-xs text-purple-600">• {ipucu}</p>
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
              <div className="text-6xl font-bold text-purple-600 animate-bounce">{countdown}</div>
            </div>
          ) : gameState === 'active' ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">{currentTask?.gorev}</h2>

              {/* Dinamik tıklama objeleri */}
              <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
                {clickingObjects.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => handleClickingObjectClick(obj.id, obj.isTarget)}
                    className={`absolute w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center text-2xl shadow-lg border-2 ${
                      obj.isTarget
                        ? 'bg-green-50 border-green-300 hover:bg-green-100 hover:scale-110'
                        : 'bg-red-50 border-red-300 hover:bg-red-100'
                    } animate-bounce`}
                    style={{
                      left: `${obj.x}%`,
                      top: `${obj.y}%`,
                      transform: 'translate(-50%, -50%)',
                      animationDuration: `${0.8 + Math.random() * 0.4}s`,
                    }}
                  >
                    {renderShape(obj.value)}
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
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="font-mono font-bold text-purple-600">{timeLeft}s</span>
              </div>
            </div>
          ) : gameState === 'waiting' ? (
            <div className="space-y-4">
              {rounds.length > 0 && rounds[rounds.length - 1].success ? (
                <div className="text-green-600">
                  <Star className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Mükemmel!</h3>
                  <p>
                    Doğru: {rounds[rounds.length - 1].correctClicks}, Yanlış: {rounds[rounds.length - 1].wrongClicks}
                  </p>
                  <p>
                    Hedef Yakalama: {rounds[rounds.length - 1].correctClicks}/{rounds[rounds.length - 1].targetSpawned} (
                    {Math.round(rounds[rounds.length - 1].targetHitRate * 100)}%)
                  </p>
                  <p>
                    Hızlı Tıklama: {rounds[rounds.length - 1].fastClicks}/
                    {rounds[rounds.length - 1].totalClicksAnalyzed} (
                    {Math.round(rounds[rounds.length - 1].fastClickRate * 100)}%)
                  </p>
                  <p>
                    Hızlı+Doğru: {rounds[rounds.length - 1].correctFastClicks} (
                    {Math.round(rounds[rounds.length - 1].fastAccuracyRate * 100)}%)
                  </p>
                </div>
              ) : (
                <div className="text-orange-600">
                  <Target className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Daha iyi yapabilirsin!</h3>
                  {rounds.length > 0 && (
                    <>
                      <p>
                        Doğru: {rounds[rounds.length - 1].correctClicks}, Yanlış: {rounds[rounds.length - 1].wrongClicks}
                      </p>
                      <p>
                        Hedef Yakalama: {rounds[rounds.length - 1].correctClicks}/{rounds[rounds.length - 1].targetSpawned} (
                        {Math.round(rounds[rounds.length - 1].targetHitRate * 100)}%)
                      </p>
                      <p>
                        Hızlı Tıklama: {rounds[rounds.length - 1].fastClicks}/
                        {rounds[rounds.length - 1].totalClicksAnalyzed} (
                        {Math.round(rounds[rounds.length - 1].fastClickRate * 100)}%)
                      </p>
                      <p>Daha dikkatli olmaya çalış</p>
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

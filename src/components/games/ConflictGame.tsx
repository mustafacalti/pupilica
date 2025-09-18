import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmotionResult } from '../../types';
import { Brain, Clock, Target, Award, X, RotateCcw, TrendingUp } from 'lucide-react';
import { conflictGameAI, PerformanceMetrics, DifficultySettings } from '../../services/conflictGameAI';

interface ConflictGameProps {
  studentId: string;
  studentAge?: number;
  difficulty?: 'kolay' | 'orta' | 'zor';
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

type CommandType = 'color' | 'text';
type ColorName = 'KIRMIZI' | 'MAVİ' | 'YEŞİL' | 'SARI' | 'TURUNCU' | 'PEMBE';

interface ColorBox {
  id: number;
  textLabel: ColorName;
  textColor: ColorName;
  position: { x: number; y: number };
  isCorrect: boolean;
  isDistractor?: boolean;
}

interface GameState {
  boxes: ColorBox[];
  command: string;
  commandType: CommandType;
  targetColor: ColorName;
  score: number;
  timeRemaining: number;
  gameStarted: boolean;
  gameEnded: boolean;
  currentLevel: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  commandVisible: boolean;
  commandTimeLeft: number;
  boxesVisible: boolean;
  totalAttempts: number;
  correctAttempts: number;
  streakCounter: number;
  bestStreak: number;
  aiAnalyzing: boolean;
  feedback: {
    show: boolean;
    type: 'correct' | 'incorrect';
    message: string;
  };
}

const COLORS: ColorName[] = ['KIRMIZI', 'MAVİ', 'YEŞİL', 'SARI', 'TURUNCU', 'PEMBE'];
const COLOR_MAP = {
  KIRMIZI: '#DC2626',
  MAVİ: '#2563EB',
  YEŞİL: '#16A34A',
  SARI: '#CA8A04',
  TURUNCU: '#EA580C',
  PEMBE: '#DB2777'
};

const DISTRACTOR_ELEMENTS = ['🎯', '⚠️', '?', '⭐', '🔥', '💎', '🎪', '⚡'];

export const ConflictGame: React.FC<ConflictGameProps> = ({
  studentId,
  studentAge = 12,
  difficulty = 'orta',
  onGameComplete,
  onEmotionDetected
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const emotionCollectionRef = useRef<EmotionResult[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  // AI-driven dynamic settings - başlangıç değerleri
  const [currentSettings, setCurrentSettings] = useState<DifficultySettings>({
    boxCount: 6, // Başlangıçta daha fazla kutu
    commandVisibilityDuration: 2500,
    conflictRate: 0.5,
    distractorCount: 0,
    distractorTypes: ["none"],
    pauseTime: 600
  });

  // Performans metrikleri
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    correctAttempts: 0,
    totalAttempts: 0,
    averageReactionTime: 0,
    streakCounter: 0,
    bestStreak: 0,
    timeSpent: 0,
    difficultyLevel: 5,
    recentErrors: []
  });

  // AI feedback
  const [aiMessage, setAiMessage] = useState<string>("");
  const [aiTips, setAiTips] = useState<string[]>([]);

  const difficultySettings = useMemo(() => ({
    kolay: currentSettings,
    orta: currentSettings,
    zor: currentSettings
  }), [currentSettings]);

  const [gameState, setGameState] = useState<GameState>({
    boxes: [],
    command: '',
    commandType: 'color',
    targetColor: 'KIRMIZI',
    score: 0,
    timeRemaining: 60, // Başlangıç süresi
    gameStarted: false,
    gameEnded: false,
    currentLevel: 1,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    commandVisible: true,
    commandTimeLeft: currentSettings.commandVisibilityDuration,
    boxesVisible: false,
    totalAttempts: 0,
    correctAttempts: 0,
    streakCounter: 0,
    bestStreak: 0,
    aiAnalyzing: false,
    feedback: {
      show: false,
      type: 'correct',
      message: ''
    }
  });

  // Reaksiyon süreleri için tracking
  const reactionTimes = useRef<number[]>([]);
  const roundStartTime = useRef<number>(0);

  const generateRandomPosition = useCallback((existingPositions: { x: number; y: number }[]) => {
    const container = gameContainerRef.current;
    if (!container) {
      console.log('⚠️ [DEBUG] Container not found, using default position');
      return { x: 50 + Math.random() * 400, y: 50 + Math.random() * 300 };
    }

    const containerRect = container.getBoundingClientRect();
    const boxSize = 100;
    const padding = 20;

    // Container boyutları kontrol
    if (containerRect.width === 0 || containerRect.height === 0) {
      console.log('⚠️ [DEBUG] Container has no dimensions, using fallback');
      return { x: 50 + Math.random() * 400, y: 50 + Math.random() * 300 };
    }

    let attempts = 0;
    let position: { x: number; y: number };

    do {
      position = {
        x: Math.random() * (containerRect.width - boxSize - 2 * padding) + padding,
        y: Math.random() * (containerRect.height - boxSize - 2 * padding) + padding
      };
      attempts++;
    } while (
      attempts < 50 &&
      existingPositions.some(pos =>
        Math.abs(pos.x - position.x) < boxSize + 10 &&
        Math.abs(pos.y - position.y) < boxSize + 10
      )
    );

    // Debug: sadece sorun varsa log
    if (attempts > 10) {
      console.log('📍 [DEBUG] Position generation took', attempts, 'attempts');
    }
    return position;
  }, []);

  const generateBoxes = useCallback((targetColor: ColorName, commandType: CommandType) => {
    const settings = currentSettings;
    const boxes: ColorBox[] = [];
    const positions: { x: number; y: number }[] = [];

    console.log('🎯 [DEBUG] Generating boxes for:', { targetColor, commandType, settings });

    // Doğru hedef kutu oluştur (garantili)
    const correctPosition = generateRandomPosition(positions);
    positions.push(correctPosition);

    // Doğru kutuyu oluştur - bu garantili olarak doğru cevap olmalı
    const correctBox: ColorBox = {
      id: 0,
      textLabel: targetColor, // Başlangıçta hedef renk
      textColor: targetColor,  // Başlangıçta hedef renk
      position: correctPosition,
      isCorrect: true
    };

    // Command type'a göre doğru kutunun özelliklerini ayarla
    if (commandType === 'text') {
      // "KIRMIZI yazısını seç" komutu için
      correctBox.textLabel = targetColor; // Yazısı hedef renk olmalı
      // textColor farklı olabilir (çatışma için)
      const differentColors = COLORS.filter(c => c !== targetColor);
      correctBox.textColor = differentColors[Math.floor(Math.random() * differentColors.length)];
    } else {
      // "KIRMIZI renkli yazana tıkla" komutu için
      correctBox.textColor = targetColor; // Rengi hedef renk olmalı
      // textLabel farklı olabilir (çatışma için)
      const differentColors = COLORS.filter(c => c !== targetColor);
      correctBox.textLabel = differentColors[Math.floor(Math.random() * differentColors.length)];
    }

    console.log('✅ [DEBUG] Correct box created:', correctBox);
    boxes.push(correctBox);

    // Normal kutular oluştur - bunlar kesinlikle doğru cevap olmamalı
    // Toplam kutu sayısından doğru kutu (1) ve distractor sayısını çıkar
    const normalBoxCount = Math.max(2, settings.boxCount - 1 - (settings.distractorCount || 0));

    console.log('📊 [DEBUG] Generating', normalBoxCount, 'normal boxes + 1 correct box =', normalBoxCount + 1, 'total');

    for (let i = 1; i <= normalBoxCount; i++) {
      const position = generateRandomPosition(positions);
      positions.push(position);

      const shouldConflict = Math.random() < settings.conflictRate;
      let textLabel: ColorName;
      let textColor: ColorName;
      let attempts = 0;

      do {
        attempts++;
        if (shouldConflict) {
          // Çakışma kutusu - textLabel ile textColor farklı
          textLabel = COLORS[Math.floor(Math.random() * COLORS.length)];
          do {
            textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
          } while (textColor === textLabel);
        } else {
          // Normal kutu - textLabel ve textColor aynı
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          textLabel = color;
          textColor = color;
        }

        // Doğru cevap olup olmadığını kontrol et
        const wouldBeCorrect = commandType === 'color' ?
          textColor === targetColor :
          textLabel === targetColor;

        if (!wouldBeCorrect) break; // Doğru değilse kabul et

        // Maksimum deneme sayısına ulaşıldıysa zorla farklı yap
        if (attempts >= 10) {
          if (commandType === 'color') {
            // Renk komutu için textColor'ı hedef renkten farklı yap
            const availableColors = COLORS.filter(c => c !== targetColor);
            textColor = availableColors[Math.floor(Math.random() * availableColors.length)];
          } else {
            // Text komutu için textLabel'ı hedef renkten farklı yap
            const availableColors = COLORS.filter(c => c !== targetColor);
            textLabel = availableColors[Math.floor(Math.random() * availableColors.length)];
          }
          break;
        }
      } while (attempts < 20);

      boxes.push({
        id: i,
        textLabel,
        textColor,
        position,
        isCorrect: false
      });

      // Debug mesajı kaldırıldı - çok fazla log
    }

    // Dikkat dağıtıcı kutular - AI tarafından belirlenen tipte
    const distractorCount = settings.distractorCount;
    if (distractorCount > 0 && !settings.distractorTypes.includes("none")) {
      for (let i = normalBoxCount + 1; i <= normalBoxCount + distractorCount; i++) {
        const position = generateRandomPosition(positions);
        positions.push(position);

        let distractorContent: ColorName;
        const distractorType = settings.distractorTypes[Math.floor(Math.random() * settings.distractorTypes.length)];

        switch (distractorType) {
          case "emoji":
            distractorContent = DISTRACTOR_ELEMENTS[Math.floor(Math.random() * DISTRACTOR_ELEMENTS.length)] as ColorName;
            break;
          case "text":
            distractorContent = "?" as ColorName;
            break;
          case "shape":
            distractorContent = "●" as ColorName;
            break;
          default:
            continue; // Skip if none
        }

        boxes.push({
          id: i,
          textLabel: distractorContent,
          textColor: 'KIRMIZI', // Bu kullanılmayacak
          position,
          isCorrect: false,
          isDistractor: true
        });

        console.log(`🎭 [DEBUG] Distractor box ${i} created with type ${distractorType}`);
      }
    }

    // Son kontrol - doğru kutu var mı?
    const correctBoxes = boxes.filter(box => box.isCorrect);
    console.log('🔍 [DEBUG] Final boxes check:', {
      totalBoxes: boxes.length,
      correctBoxes: correctBoxes.length,
      normalBoxes: boxes.filter(b => !b.isCorrect && !b.isDistractor).length,
      distractorBoxes: boxes.filter(b => b.isDistractor).length
    });

    if (correctBoxes.length === 0) {
      console.error('❌ [ERROR] No correct boxes found! This should not happen.');
      // Acil durum: ilk kutuyu doğru kutu yap
      if (boxes.length > 0) {
        boxes[0].isCorrect = true;
        if (commandType === 'text') {
          boxes[0].textLabel = targetColor;
        } else {
          boxes[0].textColor = targetColor;
        }
      }
    }

    return boxes;
  }, [currentSettings, generateRandomPosition]);

  const generateNewRound = useCallback(() => {
    // Container hazır olana kadar bekle
    if (!gameContainerRef.current) {
      setTimeout(() => generateNewRound(), 100);
      return;
    }

    const commandType: CommandType = Math.random() > 0.5 ? 'color' : 'text';
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const command = commandType === 'color'
      ? `${targetColor} renkli yazana tıkla`
      : `${targetColor} yazısını seç`;

    const boxes = generateBoxes(targetColor, commandType);

    // ADIM 1: Önce komutu göster (kutular gizli)
    setGameState(prev => ({
      ...prev,
      boxes,
      command,
      commandType,
      targetColor,
      commandVisible: true,
      commandTimeLeft: currentSettings.commandVisibilityDuration,
      boxesVisible: false, // Kutular gizli başlasın
      feedback: { show: false, type: 'correct', message: '' }
    }));

    // ADIM 2: Komut süresi bitince kutları göster ve reaksiyon süresi başlasın
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        commandVisible: false,
        boxesVisible: true
      }));

      // Kutular göründüğü anda reaksiyon süresi başlasın
      roundStartTime.current = Date.now();

    }, currentSettings.commandVisibilityDuration);

  }, [generateBoxes, currentSettings]);

  const handleBoxClick = useCallback((boxId: number) => {
    const box = gameState.boxes.find(b => b.id === boxId);
    if (!box || gameState.gameEnded || gameState.aiAnalyzing || !gameState.boxesVisible) return;

    const isCorrect = box.isCorrect;
    const currentTime = Date.now();
    const reactionTime = currentTime - roundStartTime.current;

    // Reaksiyon süresini kaydet
    reactionTimes.current.push(reactionTime);

    setGameState(prev => {
      const newState = { ...prev };
      newState.totalAttempts += 1;

      if (isCorrect) {
        // Doğru cevap
        newState.correctAttempts += 1;
        newState.streakCounter += 1;
        newState.bestStreak = Math.max(newState.bestStreak, newState.streakCounter);

        const timeBonus = Math.max(0, Math.floor((prev.commandTimeLeft / 100) * 10));
        newState.score += 100 + timeBonus;
        newState.consecutiveCorrect += 1;
        newState.consecutiveWrong = 0;
        newState.feedback = {
          show: true,
          type: 'correct',
          message: `Doğru! +${100 + timeBonus} puan`
        };
      } else {
        // Yanlış cevap - streak sıfırla
        newState.streakCounter = 0;
        newState.score = Math.max(0, newState.score - 50);
        newState.timeRemaining = Math.max(0, newState.timeRemaining - 2);
        newState.consecutiveWrong += 1;
        newState.consecutiveCorrect = 0;

        // Hata türünü kaydet
        const errorType = `${prev.commandType}_error_${reactionTime < 1000 ? 'quick' : 'slow'}`;

        newState.feedback = {
          show: true,
          type: 'incorrect',
          message: 'Yanlış! -50 puan, -2 saniye'
        };

        // Performans metriklerini güncelle (hata kaydı ile)
        setPerformanceMetrics(prevMetrics => ({
          ...prevMetrics,
          recentErrors: [...prevMetrics.recentErrors.slice(-4), errorType] // Son 5 hatayı tut
        }));
      }

      return newState;
    });

    // Performans metriklerini güncelle
    setPerformanceMetrics(prevMetrics => {
      const newMetrics = {
        ...prevMetrics,
        correctAttempts: isCorrect ? prevMetrics.correctAttempts + 1 : prevMetrics.correctAttempts,
        totalAttempts: prevMetrics.totalAttempts + 1,
        averageReactionTime: reactionTimes.current.length > 0
          ? reactionTimes.current.reduce((sum, time) => sum + time, 0) / reactionTimes.current.length
          : 0,
        streakCounter: isCorrect ? prevMetrics.streakCounter + 1 : 0,
        bestStreak: Math.max(prevMetrics.bestStreak, isCorrect ? prevMetrics.streakCounter + 1 : 0),
        timeSpent: Date.now() - gameStartTimeRef.current,
        difficultyLevel: Math.round(((currentSettings.boxCount - 2) / 8 + currentSettings.conflictRate) * 5)
      };
      return newMetrics;
    });

    // AI adaptasyon kontrolü - sadece yeterli veri varsa
    const newTotalAttempts = gameState.totalAttempts + 1;
    if (newTotalAttempts >= 5 && newTotalAttempts % 3 === 0) {
      console.log('🚀 AI Tetikleniyor! Deneme sayısı:', newTotalAttempts);

      // AI analiz başlıyor - oyunu durdur
      setGameState(prev => ({
        ...prev,
        aiAnalyzing: true,
        boxesVisible: true // boxesVisible durumunu koru
      }));

      checkForAdaptation().then(() => {
        // AI analiz bitti - oyunu devam ettir
        setGameState(prev => ({
          ...prev,
          aiAnalyzing: false,
          boxesVisible: false // Yeni round başlayacak, kutları gizle
        }));

        setTimeout(() => {
          generateNewRound();
        }, currentSettings.pauseTime);
      });
    } else {
      if (newTotalAttempts < 5) {
        console.log('📊 Veri toplaniyor... Deneme:', newTotalAttempts, '/5');
      }

      // Normal akış - AI analizi yok
      setTimeout(() => {
        generateNewRound();
      }, currentSettings.pauseTime);
    }
  }, [gameState.boxes, gameState.gameEnded, gameState.boxesVisible, gameState.aiAnalyzing, gameState.totalAttempts, currentSettings, generateNewRound]);

  // AI tabanlı adaptif zorluk kontrolü
  const checkForAdaptation = useCallback(async () => {
    // Minimum veri kontrolü
    if (performanceMetrics.totalAttempts < 3) {
      console.log('⚠️ Yetersiz veri, AI analizi atlanıyor. Deneme:', performanceMetrics.totalAttempts);
      setAiMessage("Daha fazla veri toplanıyor... 📊");
      setTimeout(() => setAiMessage(""), 2000);
      return;
    }

    try {
      console.log('🤖 AI Adaptasyon kontrolü başlıyor...', performanceMetrics);

      // AI çalıştığını göster
      setAiMessage("AI analiz ediyor... 🤖");

      const aiRecommendation = await conflictGameAI.getAdaptiveDifficulty(performanceMetrics);

      // AI önerisini uygula
      setCurrentSettings(aiRecommendation.newSettings);
      setAiMessage(aiRecommendation.encouragement);
      setAiTips(aiRecommendation.tips);

      console.log('✅ AI Adaptasyon tamamlandı:', {
        newSettings: aiRecommendation.newSettings,
        reasoning: aiRecommendation.reasoning,
        oldSettings: currentSettings
      });

      // AI mesajını daha uzun göster
      setTimeout(() => {
        setAiMessage("");
      }, 5000);

    } catch (error) {
      console.error('❌ AI Adaptasyon hatası:', error);

      // Hata durumunda basit adaptasyon yap
      const accuracy = performanceMetrics.totalAttempts > 0 ?
        performanceMetrics.correctAttempts / performanceMetrics.totalAttempts : 0;

      if (accuracy > 0.8) {
        setCurrentSettings(prev => ({
          ...prev,
          boxCount: Math.min(8, prev.boxCount + 1),
          conflictRate: Math.min(0.9, prev.conflictRate + 0.1)
        }));
        setAiMessage("Harika performans! Zorluk artırıldı 🚀");
      } else if (accuracy < 0.5) {
        setCurrentSettings(prev => ({
          ...prev,
          boxCount: Math.max(3, prev.boxCount - 1),
          conflictRate: Math.max(0.3, prev.conflictRate - 0.1)
        }));
        setAiMessage("Kolaylaştırdım, sen yapabilirsin! 💪");
      } else {
        setAiMessage("Güzel devam ediyorsun! 👍");
      }

      setTimeout(() => {
        setAiMessage("");
      }, 4000);
    }
  }, [performanceMetrics, currentSettings]);

  const startGame = useCallback(() => {
    // Performans metriklerini sıfırla
    setPerformanceMetrics({
      correctAttempts: 0,
      totalAttempts: 0,
      averageReactionTime: 0,
      streakCounter: 0,
      bestStreak: 0,
      timeSpent: 0,
      difficultyLevel: 5,
      recentErrors: []
    });

    // Reaksiyon sürelerini sıfırla
    reactionTimes.current = [];

    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      gameEnded: false,
      score: 0,
      timeRemaining: 60, // Sabit başlangıç süresi
      currentLevel: 1,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      streakCounter: 0,
      bestStreak: 0,
      boxesVisible: false
    }));

    gameStartTimeRef.current = Date.now();
    emotionCollectionRef.current = [];

    generateNewRound();

    // İlk AI analizi oyundan sonra (veriler toplandıktan sonra)
    // setTimeout kaldırıldı - sadece oyun içi adaptasyon olacak
  }, [generateNewRound]);

  const endGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameEnded: true }));
    const duration = Date.now() - gameStartTimeRef.current;
    onGameComplete(gameState.score, duration, emotionCollectionRef.current);
  }, [gameState.score, onGameComplete]);

  const restartGame = useCallback(() => {
    // Settings'leri başlangıç değerlerine sıfırla
    setCurrentSettings({
      boxCount: 6, // Başlangıçta daha fazla kutu
      commandVisibilityDuration: 2500,
      conflictRate: 0.5,
      distractorCount: 0,
      distractorTypes: ["none"],
      pauseTime: 600
    });

    setAiMessage("");
    setAiTips([]);

    setGameState(prev => ({
      ...prev,
      gameStarted: false,
      gameEnded: false,
      score: 0,
      timeRemaining: 60,
      currentLevel: 1,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      streakCounter: 0,
      bestStreak: 0,
      aiAnalyzing: false,
      boxesVisible: false,
      boxes: []
    }));
  }, []);

  // Zamanlayıcı efekti - AI analizi sırasında durur
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameEnded || gameState.aiAnalyzing) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeRemaining <= 1) {
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStarted, gameState.gameEnded, gameState.aiAnalyzing]);

  // Komut zamanlayıcısı artık manuel kontrol - useEffect kaldırıldı

  // Oyun sonu kontrolü
  useEffect(() => {
    if (gameState.gameStarted && gameState.timeRemaining === 0 && !gameState.gameEnded) {
      endGame();
    }
  }, [gameState.gameStarted, gameState.timeRemaining, gameState.gameEnded, endGame]);

  // Feedback temizleme
  useEffect(() => {
    if (gameState.feedback.show) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          feedback: { ...prev.feedback, show: false }
        }));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.feedback.show]);

  if (!gameState.gameStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Çatışma Oyunu</h1>
            <p className="text-gray-600 text-lg mb-6">
              Stroop etkisiyle dikkatini geliştir! Yazan kelimeyle renk farklı olabilir.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800 mb-1">Renk Odaklı</h3>
                <p className="text-sm text-blue-600">Belirtilen renkteki yazıyı bul</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <Brain className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 mb-1">Kelime Odaklı</h3>
                <p className="text-sm text-green-600">Belirtilen kelimeyi bul</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-800 mb-1">Zamana Karşı</h3>
                <p className="text-sm text-purple-600">60 saniyede en yüksek skoru yap</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 rounded-lg max-w-md mx-auto">
              <h4 className="font-semibold text-yellow-800 mb-2">Nasıl Oynanır?</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Ekranda çıkan komutu oku</li>
                <li>• Komuta uygun kutuyu tıkla</li>
                <li>• Dikkat: Kelime ve renk farklı olabilir!</li>
                <li>• Doğru: +100 puan, Yanlış: -50 puan</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <Button
                onClick={startGame}
                size="lg"
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3"
              >
                <Target className="h-5 w-5 mr-2" />
                Oyunu Başlat - {difficulty === 'kolay' ? 'Kolay' : difficulty === 'orta' ? 'Orta' : 'Zor'}
              </Button>

              <Button
                onClick={() => checkForAdaptation()}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Test Et
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState.gameEnded) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Award className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">Oyun Tamamlandı!</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{gameState.score}</div>
                <div className="text-sm text-blue-800">Toplam Puan</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  %{gameState.totalAttempts > 0 ? Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100) : 0}
                </div>
                <div className="text-sm text-green-800">Doğruluk</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{gameState.bestStreak}</div>
                <div className="text-sm text-purple-800">En İyi Seri</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceMetrics.averageReactionTime > 0 ? Math.round(performanceMetrics.averageReactionTime) : 0}ms
                </div>
                <div className="text-sm text-orange-800">Ort. Reaksiyon</div>
              </div>
            </div>

            {/* AI Performans Analizi */}
            {aiTips.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg max-w-md mx-auto mb-6">
                <div className="flex items-center mb-2">
                  <Brain className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-800">AI Analizi</span>
                </div>
                <div className="space-y-1">
                  {aiTips.map((tip, index) => (
                    <div key={index} className="text-sm text-blue-700">• {tip}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={restartGame}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Tekrar Oyna
              </Button>
              <Button
                onClick={() => onGameComplete(gameState.score, Date.now() - gameStartTimeRef.current, emotionCollectionRef.current)}
                variant="outline"
              >
                Bitir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Üst panel - Komut ve istatistikler */}
      <div className="max-w-6xl mx-auto mb-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                {gameState.commandVisible && (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl shadow-lg">
                    <div className="font-bold text-2xl text-center">{gameState.command}</div>
                    <div className="text-sm text-center mt-2 opacity-90">
                      Komutu oku ve hatırla!
                    </div>
                  </div>
                )}
                {!gameState.commandVisible && !gameState.boxesVisible && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg">
                    <div className="font-bold text-lg text-center">Kutular hazırlanıyor...</div>
                  </div>
                )}
                {!gameState.commandVisible && gameState.boxesVisible && (
                  <div className="text-gray-600 italic text-lg font-semibold">Komutu hatırla ve doğru kutuyu seç!</div>
                )}
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">{gameState.timeRemaining}s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{gameState.score}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold">
                    {gameState.totalAttempts > 0 ? Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100) : 0}% Doğru
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold">Seri: {gameState.streakCounter}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-xs">
                    AI: {currentSettings.boxCount} kutu, %{Math.round(currentSettings.conflictRate * 100)} çatışma
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Oyun alanı */}
      <div className="max-w-6xl mx-auto">
        <div
          ref={gameContainerRef}
          className="relative w-full h-[600px] bg-white rounded-xl shadow-lg overflow-hidden"
          style={{ position: 'relative' }}
        >
          {gameState.boxesVisible && gameState.boxes.map((box) => (
            <div
              key={box.id}
              className="absolute cursor-pointer transform hover:scale-105 transition-transform duration-150"
              style={{
                left: box.position.x,
                top: box.position.y,
                width: '100px',
                height: '100px'
              }}
              onClick={() => handleBoxClick(box.id)}
            >
              <div className="w-full h-full bg-white rounded-lg shadow-md border-2 border-gray-200 flex items-center justify-center hover:shadow-lg">
                {box.isDistractor ? (
                  <div className="text-4xl">{box.textLabel}</div>
                ) : (
                  <div
                    className="text-xl font-bold"
                    style={{ color: COLOR_MAP[box.textColor] }}
                  >
                    {box.textLabel}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analyzing Overlay */}
      {gameState.aiAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-6 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <Brain className="h-6 w-6" />
              <span className="font-semibold text-lg">AI performansını analiz ediyor...</span>
            </div>
            <div className="text-center mt-2 text-blue-100 text-sm">
              Oyun kısa sürede devam edecek
            </div>
          </div>
        </div>
      )}

      {/* AI Encouragement Message */}
      {aiMessage && !gameState.aiAnalyzing && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-lg">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span className="font-semibold">{aiMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {gameState.feedback.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`
            px-8 py-4 rounded-xl text-white text-xl font-bold shadow-lg
            ${gameState.feedback.type === 'correct'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-red-500 to-pink-500'
            }
          `}>
            {gameState.feedback.message}
          </div>
        </div>
      )}
    </div>
  );
};
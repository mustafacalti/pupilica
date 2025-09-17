import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { AttentionSprintTask, AttentionSprintPerformance, EmotionResult } from '../../types';
import { attentionSprintGenerator } from '../../services/attentionSprintGenerator';
import { Clock, Target, Zap, RotateCcw, Star, Brain, Play } from 'lucide-react';

interface AttentionClickGameProps {
  studentId: string;
  studentAge?: number;
  difficulty: 'kolay' | 'orta' | 'zor';
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

interface ClickRound {
  task: AttentionSprintTask;
  startTime: number;
  endTime?: number;
  success: boolean;
  reactionTime: number;
}

export const AttentionClickGame: React.FC<AttentionClickGameProps> = ({
  studentId,
  studentAge = 12,
  difficulty,
  onGameComplete,
  onEmotionDetected
}) => {
  console.log('🎯 [AttentionClickGame] Component initialized with props:', {
    studentId,
    studentAge,
    difficulty
  });
  const [currentTask, setCurrentTask] = useState<AttentionSprintTask | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'active' | 'waiting' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [rounds, setRounds] = useState<ClickRound[]>([]);
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

  const roundStartTimeRef = useRef<number>(0);
  const hasGeneratedFirstTask = useRef(false);
  const isGeneratingRef = useRef(false);
  const isEndingRound = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalRounds = 5;

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
    };
  }, []);

  const generateFirstTask = useCallback(async () => {
    if (isGeneratingRef.current) return;

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
        sonGorevler: ['tıklama'] // Normal tıklama oyunu iste
      });

      // Sadece normal tıklama görevlerini filtrele
      const filteredTask = {
        ...task,
        difficulty,
        gorev: filterClickTaskOnly(task.gorev)
      };

      setCurrentTask(filteredTask);
      setTimeLeft(filteredTask.sure_saniye);
    } catch (error) {
      console.error('İlk görev üretme hatası:', error);
      setCurrentTask(getFallbackClickTask());
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [studentAge, difficulty]);

  // Sadece normal tıklama görevlerini filtrele
  const filterClickTaskOnly = (gorev: string): string => {
    const text = gorev.toLowerCase();

    // Sayma veya dinamik tıklama görevleri değilse olduğu gibi döndür
    if (!text.includes('say') && !text.includes('count') && !text.includes('adet') &&
        !text.includes('tüm') && !text.includes('hepsi')) {
      return gorev;
    }

    // Fallback olarak basit tıklama görevi üret
    const colors = ['🔴 Kırmızı', '🔵 Mavi', '🟢 Yeşil', '🟡 Sarı'];
    const shapes = ['daire', 'kare', 'üçgen', 'yıldız'];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

    return `${randomColor} ${randomShape}i tıkla`;
  };

  const getFallbackClickTask = (): AttentionSprintTask => {
    const tasks = {
      kolay: [
        { gorev: "🔴 Kırmızı daire tıkla", hedefRenk: "kırmızı", hedefSekil: "daire" },
        { gorev: "🔵 Mavi kare tıkla", hedefRenk: "mavi", hedefSekil: "kare" },
        { gorev: "🟢 Yeşil yıldız tıkla", hedefRenk: "yeşil", hedefSekil: "yıldız" }
      ],
      orta: [
        { gorev: "🔴 Kırmızı üçgen 2 saniye sonra tıkla", hedefRenk: "kırmızı", hedefSekil: "üçgen" },
        { gorev: "🔵 Mavi daire belirdiğinde tıkla", hedefRenk: "mavi", hedefSekil: "daire" },
        { gorev: "🟡 Sarı kare gördüğünde bas", hedefRenk: "sarı", hedefSekil: "kare" }
      ],
      zor: [
        { gorev: "🔴 Kırmızı yıldız çıktığında hemen tıkla", hedefRenk: "kırmızı", hedefSekil: "yıldız" },
        { gorev: "🔵 Mavi üçgen görünür görünmez bas", hedefRenk: "mavi", hedefSekil: "üçgen" },
        { gorev: "🟢 Yeşil daire belirdiğinde anında tıkla", hedefRenk: "yeşil", hedefSekil: "daire" }
      ]
    };

    const levelTasks = tasks[difficulty];
    const selectedTask = levelTasks[Math.floor(Math.random() * levelTasks.length)];

    return {
      id: `click_fallback_${Date.now()}`,
      ...selectedTask,
      sure_saniye: difficulty === 'kolay' ? 30 : difficulty === 'orta' ? 40 : 50,
      ipuclari: ["Hedefe odaklan", "Hızlı reaksiyon göster"],
      dikkatDagitici: difficulty === 'kolay' ? 0 : difficulty === 'orta' ? 0.3 : 0.5,
      difficulty,
      hedefTipi: 'renk'
    };
  };

  // Oyunu başlat
  const startRound = () => {
    if (!currentTask) return;

    setGameState('countdown');
    setCountdown(3);
    setShowTarget(false);
    setTargetClicked(false);

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
        return prev - 1;
      });
    }, 1000);
  };

  // Rastgele pozisyon üret
  const generateRandomPosition = () => ({
    x: Math.random() * 70 + 15,
    y: Math.random() * 60 + 20
  });

  // Yanıltıcı öğeler üret
  const generateDistractors = () => {
    if (!currentTask) return [];

    const count = Math.floor(currentTask.dikkatDagitici * 5);
    const distractorList = [];

    for (let i = 0; i < count; i++) {
      const position = generateRandomPosition();
      let type = 'shape';
      let value = '⚫';

      if (currentTask.hedefRenk && currentTask.hedefSekil) {
        // Karma hedef
        type = 'combo';
        const targetColor = currentTask.hedefRenk;
        let comboOptions: string[] = [];

        if (targetColor === 'mavi') {
          comboOptions = ['🔴', '🟢', '🟡', '🟠', '🟣'];
        } else if (targetColor === 'kırmızı') {
          comboOptions = ['🔵', '🟢', '🟡', '🟠', '🟣'];
        } else if (targetColor === 'yeşil') {
          comboOptions = ['🔴', '🔵', '🟡', '🟠', '🟣'];
        } else if (targetColor === 'sarı') {
          comboOptions = ['🔴', '🔵', '🟢', '🟠', '🟣'];
        }

        value = comboOptions[Math.floor(Math.random() * comboOptions.length)] || '⚫';
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

  // Görevi başlat
  const startTask = () => {
    if (!currentTask) return;

    setGameState('active');
    setTimeLeft(currentTask.sure_saniye);
    setTargetPosition(generateRandomPosition());
    setDistractors(generateDistractors());

    const delay = Math.random() * 2000 + 1000;
    setTimeout(() => {
      setShowTarget(true);
      startTimer();
    }, delay);
  };

  // Hedefe tıklama
  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState !== 'active' || !showTarget || targetClicked) return;

    setTargetClicked(true);
    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;
    endRound(true, reactionTime);
  };

  // Yanıltıcı öğeye tıklama
  const handleDistractorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState !== 'active' || targetClicked) return;

    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;
    endRound(false, reactionTime);
  };

  // Oyun alanına tıklama
  const handleGameAreaClick = () => {
    if (gameState !== 'active' || !showTarget || targetClicked) return;

    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;
    endRound(false, reactionTime);
  };

  // Turu bitir
  const endRound = (success: boolean, reactionTime?: number) => {
    if (!currentTask || isEndingRound.current) return;

    isEndingRound.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalReactionTime = reactionTime || (Date.now() - roundStartTimeRef.current) / 1000;

    const round: ClickRound = {
      task: currentTask,
      startTime: roundStartTimeRef.current,
      endTime: Date.now(),
      success,
      reactionTime: finalReactionTime
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
        setShowTarget(false);
        setTargetClicked(false);
        setDistractors([]);
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
    setShowTarget(false);
    setTargetClicked(false);
    setTargetPosition({ x: 50, y: 50 });
    setDistractors([]);
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Dikkat Tıklama Oyunu Tamamlandı!</h2>
            <p className="text-gray-600">Hızlı reaksiyon becerin gelişiyor!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{score}/{totalRounds}</div>
                <div className="text-sm text-gray-600">Başarılı Tıklama</div>
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
                <span className="text-xs text-purple-600">Zorluk: {difficulty}</span>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dikkat Tıklama</h2>
              <p className="text-gray-600 mb-6">
                Hızlıca doğru hedefe tıkla ve reaksiyon sürenı geliştir!
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
            <div className="space-y-6 cursor-crosshair" onClick={handleGameAreaClick}>
              <h2 className="text-xl font-bold text-gray-800">{currentTask?.gorev}</h2>

              {showTarget && currentTask && (
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

                  {/* Gerçek hedef */}
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
                    {/* Hedef gösterimi */}
                    {currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'daire' && '🔴'}
                    {currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'daire' && '🔵'}
                    {currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'daire' && '🟢'}
                    {currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'daire' && '🟡'}
                    {currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'kare' && '🟥'}
                    {currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'kare' && '🟦'}
                    {currentTask.hedefRenk === 'yeşil' && currentTask.hedefSekil === 'kare' && '🟩'}
                    {currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'kare' && '🟨'}
                    {currentTask.hedefRenk === 'kırmızı' && currentTask.hedefSekil === 'üçgen' && '🔺'}
                    {currentTask.hedefRenk === 'mavi' && currentTask.hedefSekil === 'üçgen' && '🔹'}
                    {!currentTask.hedefRenk && currentTask.hedefSekil === 'yıldız' && '⭐'}
                    {!currentTask.hedefRenk && currentTask.hedefSekil === 'daire' && '⭕'}
                    {!currentTask.hedefSekil && currentTask.hedefRenk === 'kırmızı' && '🔴'}
                    {!currentTask.hedefSekil && currentTask.hedefRenk === 'mavi' && '🔵'}
                    {!currentTask.hedefSekil && currentTask.hedefRenk === 'yeşil' && '🟢'}
                    {!currentTask.hedefSekil && currentTask.hedefRenk === 'sarı' && '🟡'}
                    {!currentTask.hedefSekil && !currentTask.hedefRenk && !currentTask.hedefSayi && '🎯'}
                  </button>
                </div>
              )}

              {!showTarget && (
                <div className="text-gray-600">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Hazırlan...
                </div>
              )}

              {/* Süre göstergesi */}
              <div className="flex items-center justify-center space-x-2 text-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-mono font-bold text-blue-600">{timeLeft}s</span>
              </div>
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
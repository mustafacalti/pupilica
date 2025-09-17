import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { AttentionSprintTask, AttentionSprintPerformance, EmotionResult } from '../../types';
import { attentionSprintGenerator } from '../../services/attentionSprintGenerator';
import { Clock, Target, Zap, RotateCcw, Star, Brain, Play } from 'lucide-react';
const X = () => <span>❌</span>; // Fallback icon

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
  reactionTime: number;
  correctClicks: number;
  wrongClicks: number;
  totalSpawned: number;
}

export const AttentionDynamicGame: React.FC<AttentionDynamicGameProps> = ({
  studentId,
  studentAge = 12,
  difficulty,
  onGameComplete,
  onEmotionDetected
}) => {
  const [currentTask, setCurrentTask] = useState<AttentionSprintTask | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'active' | 'waiting' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [rounds, setRounds] = useState<DynamicRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const [gameStartTime] = useState(Date.now());
  const [countdown, setCountdown] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dinamik tıklama modu için state'ler
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
        sonGorevler: ['dinamik-tıklama'] // Dinamik tıklama oyunu iste
      });

      // Sadece dinamik tıklama görevlerini filtrele veya dinamik göreve çevir
      const filteredTask = {
        ...task,
        difficulty,
        gorev: filterDynamicTaskOnly(task.gorev),
        sure_saniye: difficulty === 'kolay' ? 20 : difficulty === 'orta' ? 30 : 40
      };

      setCurrentTask(filteredTask);
      setTimeLeft(filteredTask.sure_saniye);
    } catch (error) {
      console.error('İlk görev üretme hatası:', error);
      setCurrentTask(getFallbackDynamicTask());
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [studentAge, difficulty]);

  // Sadece dinamik tıklama görevlerini filtrele veya dinamik göreve çevir
  const filterDynamicTaskOnly = (gorev: string): string => {
    const text = gorev.toLowerCase();

    // Eğer zaten dinamik tıklama görevi ise olduğu gibi döndür
    if ((text.includes('tüm') && text.includes('tıkla')) ||
        (text.includes('hepsi') && text.includes('tıkla')) ||
        (text.includes('içinde') && text.includes('tıkla') && text.includes('saniye'))) {
      return gorev;
    }

    // Değilse dinamik tıklama görevine çevir
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

    const timeText = difficulty === 'kolay' ? '20 saniye' : difficulty === 'orta' ? '30 saniye' : '40 saniye';

    return `${timeText} içinde tüm ${randomColor.emoji} ${randomColor.turkish} ${randomShape.turkish}leri tıkla`;
  };

  const getFallbackDynamicTask = (): AttentionSprintTask => {
    const tasks = {
      kolay: [
        { gorev: "20 saniye içinde tüm mavi daireleri tıkla", hedefRenk: "mavi", hedefSekil: "daire", sure: 20 },
        { gorev: "20 saniye içinde tüm yeşil kareleri yakala", hedefRenk: "yeşil", hedefSekil: "kare", sure: 20 },
        { gorev: "20 saniye içinde tüm sarı yıldızları tıkla", hedefRenk: "sarı", hedefSekil: "yıldız", sure: 20 }
      ],
      orta: [
        { gorev: "30 saniye içinde tüm kırmızı üçgenleri tıkla", hedefRenk: "kırmızı", hedefSekil: "üçgen", sure: 30 },
        { gorev: "30 saniye içinde tüm mavi kareleri yakala", hedefRenk: "mavi", hedefSekil: "kare", sure: 30 },
        { gorev: "30 saniye içinde tüm yeşil daireleri tıkla", hedefRenk: "yeşil", hedefSekil: "daire", sure: 30 }
      ],
      zor: [
        { gorev: "40 saniye içinde tüm hızlı hedefleri yakala", hedefRenk: "kırmızı", hedefSekil: "yıldız", sure: 40 },
        { gorev: "40 saniye içinde tüm mavi üçgenleri tıkla", hedefRenk: "mavi", hedefSekil: "üçgen", sure: 40 },
        { gorev: "40 saniye içinde tüm karışık hedefleri yakala", hedefRenk: "yeşil", hedefSekil: "kare", sure: 40 }
      ]
    };

    const levelTasks = tasks[difficulty];
    const selectedTask = levelTasks[Math.floor(Math.random() * levelTasks.length)];

    return {
      id: `dynamic_fallback_${Date.now()}`,
      ...selectedTask,
      sure_saniye: selectedTask.sure,
      ipuclari: ["Hızlı ol", "Doğru hedefleri seç"],
      dikkatDagitici: difficulty === 'kolay' ? 0.3 : difficulty === 'orta' ? 0.5 : 0.7,
      difficulty,
      hedefTipi: 'renk'
    };
  };

  // Zorluk seviyesine göre tıklama parametreleri
  const getClickingParams = (difficulty: 'kolay' | 'orta' | 'zor') => {
    switch (difficulty) {
      case 'kolay':
        return {
          spawnInterval: 3000,    // 3 saniyede bir spawn
          objectLifespan: 6000,   // 6 saniye yaşam süresi
          targetRatio: 0.7,       // %70 hedef, %30 yanıltıcı
        };
      case 'orta':
        return {
          spawnInterval: 2500,    // 2.5 saniyede bir spawn
          objectLifespan: 5000,   // 5 saniye yaşam süresi
          targetRatio: 0.6,       // %60 hedef, %40 yanıltıcı
        };
      case 'zor':
        return {
          spawnInterval: 2000,    // 2 saniyede bir spawn
          objectLifespan: 4000,   // 4 saniye yaşam süresi
          targetRatio: 0.5,       // %50 hedef, %50 yanıltıcı
        };
      default:
        return {
          spawnInterval: 2500,
          objectLifespan: 5000,
          targetRatio: 0.6,
        };
    }
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
    y: Math.random() * 60 + 20
  });

  // Dinamik tıklama objeler spawn et
  const startClickingSpawn = () => {
    const params = getClickingParams(difficulty);
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
          } else if (currentTask.hedefRenk === 'sarı' && currentTask.hedefSekil === 'yıldız') {
            value = '⭐';
          } else {
            value = '🔴';
          }
        } else {
          // Yanıltıcılar
          const wrongValues = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '⭕', '⬜', '🔺', '💎'];
          value = wrongValues[Math.floor(Math.random() * wrongValues.length)];
        }
      } else if (currentTask?.hedefRenk) {
        const colorMap = { 'kırmızı': '🔴', 'mavi': '🔵', 'yeşil': '🟢', 'sarı': '🟡', 'mor': '🟣', 'turuncu': '🟠' };
        if (shouldSpawnTarget) {
          value = colorMap[currentTask.hedefRenk as keyof typeof colorMap] || '🔵';
        } else {
          const wrongColors = Object.values(colorMap).filter(c => c !== colorMap[currentTask.hedefRenk as keyof typeof colorMap]);
          value = wrongColors[Math.floor(Math.random() * wrongColors.length)];
        }
      } else if (currentTask?.hedefSekil) {
        const shapeMap = { 'yıldız': '⭐', 'daire': '⭕', 'kare': '⬜', 'üçgen': '🔺', 'kalp': '❤️', 'elmas': '💎' };
        if (shouldSpawnTarget) {
          value = shapeMap[currentTask.hedefSekil as keyof typeof shapeMap] || '🔺';
        } else {
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

  // Görevi başlat
  const startTask = () => {
    if (!currentTask) return;

    setGameState('active');
    setTimeLeft(currentTask.sure_saniye);
    setCorrectClicks(0);
    setWrongClicks(0);
    setTotalSpawned(0);

    // Dinamik tıklama modunu başlat
    startClickingSpawn();
    startTimer();
  };

  // Dinamik tıklama objesine tıklama
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

  // Turu bitir
  const endRound = (success: boolean, reactionTime?: number) => {
    if (!currentTask || isEndingRound.current) return;

    isEndingRound.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalReactionTime = reactionTime || (Date.now() - roundStartTimeRef.current) / 1000;

    // Başarı ölçütü: En az %50 doğruluk oranı ve toplam 3+ tıklama
    const totalClicks = correctClicks + wrongClicks;
    const accuracy = totalClicks > 0 ? correctClicks / totalClicks : 0;
    const finalSuccess = accuracy >= 0.5 && totalClicks >= 3;

    const round: DynamicRound = {
      task: currentTask,
      startTime: roundStartTimeRef.current,
      endTime: Date.now(),
      success: finalSuccess,
      reactionTime: finalReactionTime,
      correctClicks,
      wrongClicks,
      totalSpawned
    };

    setRounds(prev => [...prev, round]);

    if (finalSuccess) {
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
        setClickingObjects([]);
        setCorrectClicks(0);
        setWrongClicks(0);
        setTotalSpawned(0);
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
    setClickingObjects([]);
    setCorrectClicks(0);
    setWrongClicks(0);
    setTotalSpawned(0);
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
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((score / totalRounds) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Başarı Oranı</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {rounds.length > 0 ?
                    Math.round(rounds.reduce((sum, r) => sum + r.correctClicks, 0) / rounds.length) :
                    0
                  }
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
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Senin için özel dinamik görev hazırlanıyor...</p>
            </div>
          ) : gameState === 'ready' ? (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Play className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dinamik Dikkat</h2>
              <p className="text-gray-600 mb-6">
                Sürekli çıkan hedefleri hızlıca yakala ve reflexlerini geliştir!
              </p>
              {currentTask && (
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-purple-800 mb-2">Görevin:</h3>
                  <p className="text-purple-700">{currentTask.gorev}</p>
                  {currentTask.ipuclari.length > 0 && (
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
              <div className="text-6xl font-bold text-purple-600 animate-bounce">
                {countdown}
              </div>
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
                  <p>Doğru: {rounds[rounds.length - 1].correctClicks}, Yanlış: {rounds[rounds.length - 1].wrongClicks}</p>
                  <p>Doğruluk: {Math.round((rounds[rounds.length - 1].correctClicks / Math.max(1, rounds[rounds.length - 1].correctClicks + rounds[rounds.length - 1].wrongClicks)) * 100)}%</p>
                </div>
              ) : (
                <div className="text-orange-600">
                  <Target className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Daha iyi yapabilirsin!</h3>
                  {rounds.length > 0 && (
                    <>
                      <p>Doğru: {rounds[rounds.length - 1].correctClicks}, Yanlış: {rounds[rounds.length - 1].wrongClicks}</p>
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
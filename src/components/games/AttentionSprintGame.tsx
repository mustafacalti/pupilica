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
        studentAge
      });

      setCurrentTask(task);
      setTimeLeft(task.sure_saniye);
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

    // Son 3 turu al
    const son3Tur = currentRounds.slice(-3).map(round => ({
      basari: round.success,
      sure: round.reactionTime,
      zorluk: round.task.difficulty
    }));

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

    const performance: AttentionSprintPerformance = {
      son3Tur,
      ortalamaReaksiyonSuresi,
      basariOrani,
      odaklanmaDurumu
    };

    try {
      const task = await attentionSprintGenerator.generateAttentionSprint({
        performansOzeti: performance,
        studentAge
      });

      setCurrentTask(task);
      setTimeLeft(task.sure_saniye);
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
   * Görevi başlat
   */
  const startTask = () => {
    if (!currentTask) return;

    setGameState('active');
    setTimeLeft(currentTask.sure_saniye);

    // Hedef gösterme (görev tipine göre)
    if (currentTask.hedefRenk || currentTask.hedefSekil) {
      // 1-3 saniye arasında rastgele gecikme
      const delay = Math.random() * 2000 + 1000;
      setTimeout(() => {
        setShowTarget(true);
        startTimer(); // Hedef göründüğünde timer başlat
      }, delay);
    } else {
      setShowTarget(true);
      startTimer(); // Hemen hedef görünüyorsa timer başlat
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
   * Oyun alanına (yanlış yere) tıklama
   */
  const handleGameAreaClick = () => {
    if (gameState !== 'active' || !showTarget || targetClicked) return;

    // Yanlış yere tıklandı, görev başarısız
    const reactionTime = (Date.now() - roundStartTimeRef.current) / 1000;
    endRound(false, reactionTime);
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

    const round: SprintRound = {
      task: currentTask,
      startTime: roundStartTimeRef.current,
      endTime: Date.now(),
      success,
      reactionTime: finalReactionTime
    };

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
              className="space-y-6 cursor-crosshair"
              onClick={handleGameAreaClick}
            >
              <h2 className="text-xl font-bold text-gray-800">{currentTask?.gorev}</h2>

              {showTarget && currentTask && (
                <div className="relative">
                  {/* Büyük zemin yuvarlağı - tıklanamaz */}
                  <div
                    className={`
                      w-32 h-32 rounded-full border-4 transition-all duration-200 relative flex items-center justify-center
                      ${targetClicked
                        ? 'bg-green-500 border-green-600 scale-110'
                        : 'bg-blue-500 border-blue-600 animate-pulse'
                      }
                    `}
                  >
                    {/* Küçük hedef alan - sadece bu tıklanabilir */}
                    <button
                      onClick={handleTargetClick}
                      disabled={targetClicked}
                      className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center text-2xl shadow-lg"
                    >
                      {currentTask.hedefSekil === 'yıldız' && '⭐'}
                      {currentTask.hedefSekil === 'daire' && '⭕'}
                      {currentTask.hedefSekil === 'kare' && '⬜'}
                      {currentTask.hedefRenk === 'kırmızı' && '🔴'}
                      {currentTask.hedefRenk === 'mavi' && '🔵'}
                      {currentTask.hedefRenk === 'yeşil' && '🟢'}
                      {currentTask.hedefRenk === 'sarı' && '🟡'}
                      {!currentTask.hedefSekil && !currentTask.hedefRenk && '🎯'}
                    </button>
                  </div>

                  {/* Dikkat dağıtıcılar */}
                  {currentTask.dikkatDagitici > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: Math.ceil(currentTask.dikkatDagitici * 3) }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-8 h-8 bg-gray-300 rounded opacity-50 animate-bounce"
                          style={{
                            left: `${20 + (i * 25)}%`,
                            top: `${30 + (i * 20)}%`,
                            animationDelay: `${i * 0.2}s`
                          }}
                        >
                          ⚫
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
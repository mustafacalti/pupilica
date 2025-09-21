import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Target, Eye, Zap, ArrowLeft, Play, Pause, Sparkles, Camera } from 'lucide-react';
import { aiStoryService, AIStoryRequest, StoryScene, DynamicSceneRequest } from '../../services/aiStoryService';
import { saveStoryAttentionGameData, StoryAttentionGameData } from '../../services/firestore';
import { emotionAnalysisService } from '../../services/emotionAnalysisService';
import { cameraEmotionService } from '../../services/cameraEmotionService';

interface StoryAttentionGameProps {
  studentId: string;
  studentAge: number;
  onGameComplete: (score?: number, duration?: number, attentionData?: any) => void;
}

interface AttentionData {
  selectiveAttention: number;
  sustainedAttention: number;
  dividedAttention: number;
  impulseControl: number;
  reactionTime: number[];
  distractorClicks: number;
  correctChoices: number;
  totalChoices: number;
}


export const StoryAttentionGame: React.FC<StoryAttentionGameProps> = ({
  studentId,
  studentAge,
  onGameComplete
}) => {
  const [currentScene, setCurrentScene] = useState<StoryScene | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [storyTheme, setStoryTheme] = useState<'adventure' | 'space' | 'underwater'>('adventure');
  const [sceneNumber, setSceneNumber] = useState(1);
  const [lastChoice, setLastChoice] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [attentionData, setAttentionData] = useState<AttentionData>({
    selectiveAttention: 0,
    sustainedAttention: 0,
    dividedAttention: 0,
    impulseControl: 0,
    reactionTime: [],
    distractorClicks: 0,
    correctChoices: 0,
    totalChoices: 0
  });
  const [sceneStartTime, setSceneStartTime] = useState<number>(0);
  const [backgroundSymbolVisible, setBackgroundSymbolVisible] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [pendingEmotionData, setPendingEmotionData] = useState<any>(null);

  // Emotion analysis states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emotionAnalysisActive, setEmotionAnalysisActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<any | null>(null);
  const [attentionMetrics, setAttentionMetrics] = useState<any | null>(null);

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
  }, []);

  const stopEmotionTracking = useCallback(() => {
    console.log('⏹️ [EMOTION] Emotion tracking durduruluyor...');

    cameraEmotionService.stopEmotionTracking();
    setEmotionAnalysisActive(false);

    const finalMetrics = emotionAnalysisService.endGameSession();
    setAttentionMetrics(finalMetrics);

    console.log('🏁 [EMOTION] Final metrics:', finalMetrics);
  }, []);

  // Dinamik sahne oluşturma
  const generateNextScene = useCallback(async (sceneEmotionData?: any) => {
    // Önce pending emotion data'yı kullan, yoksa parametre olarak gelen veriyi kullan
    const emotionDataToUse = sceneEmotionData || pendingEmotionData;
    console.log('🚨 [DEBUG] generateNextScene called:', { sceneNumber, isLoadingStory, currentSceneId: currentScene?.id });

    if (isLoadingStory) {
      console.log('Already loading story, skipping...');
      return;
    }

    setIsLoadingStory(true);
    try {
      const themeNames = {
        'adventure': 'Orman Macerası',
        'space': 'Uzay Keşfi',
        'underwater': 'Deniz Altı Maceraları'
      };

      // Emotion data'yı AI'ya gönder
      let emotionDataString = '';
      // emotionDataToUse direkt array (endRoundSession'dan geliyor) veya emotions property'si olan obje olabilir
      const emotionsArray = Array.isArray(emotionDataToUse) ? emotionDataToUse : emotionDataToUse?.emotions;

      if (emotionsArray && emotionsArray.length > 0) {
        emotionDataString = emotionsArray.map((emotion: any, index: number) =>
          `${index + 1}. ${emotion.timestamp}: ${emotion.emotion} (${(emotion.confidence * 100).toFixed(1)}%)`
        ).join('\n');
      }

      const request: DynamicSceneRequest = {
        studentAge,
        theme: themeNames[storyTheme],
        previousStory: currentScene?.story || undefined,
        userChoice: lastChoice,
        sceneNumber,
        emotionData: emotionDataString || undefined
      };

      console.log('🎭 [EMOTION DEBUG] Sahne emotion verisi detayı:');
      console.log('🎭 [EMOTION DEBUG] Ham sceneEmotionData:', sceneEmotionData);
      console.log('🎭 [EMOTION DEBUG] PendingEmotionData:', pendingEmotionData);
      console.log('🎭 [EMOTION DEBUG] EmotionDataToUse:', emotionDataToUse);
      console.log('🎭 [EMOTION DEBUG] Emotion array uzunluğu:', emotionsArray?.length || 0);
      console.log('🎭 [EMOTION DEBUG] Emotions array:', emotionsArray);
      console.log('🎭 [EMOTION DEBUG] AI\'ya gönderilen emotion string:');
      console.log(emotionDataString || 'BOŞ - Emotion data yok');
      console.log('🎭 [EMOTION DEBUG] Request object:', request);

      const newScene = await aiStoryService.generateNextScene(request);
      setCurrentScene(newScene);

      // YENİ SAHNE BAŞLADI - yeni emotion session başlat
      console.log('🎭 [STORY GAME] Yeni sahne başladı, emotion session başlatılıyor...');
      emotionAnalysisService.startRoundSession();

      // Emotion data kullanıldı, pending'i temizle
      if (emotionDataToUse) {
        setPendingEmotionData(null);
      }

    } catch (error) {
      console.error('Dynamic scene generation failed:', error);
    } finally {
      setIsLoadingStory(false);
    }
  }, [studentAge, storyTheme, lastChoice, isLoadingStory, currentScene?.story, sceneNumber, pendingEmotionData]);

  // SceneNumber değiştiğinde yeni sahne oluştur (sadece emotion data olmadan)
  useEffect(() => {
    if (gameStarted && !gameEnded && sceneNumber > 1 && !isLoadingStory && currentScene?.id !== sceneNumber) {
      console.log('Generating next scene for scene number:', sceneNumber);
      // Emotion data olmadan sahne oluştur (fallback için)
      setTimeout(() => {
        if (!isLoadingStory) {
          generateNextScene();
        }
      }, 200); // HandleNextScene'daki emotion call'dan sonra çalışsın
    }
  }, [sceneNumber, gameStarted, gameEnded, generateNextScene, isLoadingStory, currentScene]);

  // Oyun bittiğinde final verileri hesapla
  useEffect(() => {
    if (gameEnded && showFinalReport) {
      const calculateFinalScores = (data: AttentionData) => {
        const avgReactionTime = data.reactionTime.length > 0
          ? data.reactionTime.reduce((a, b) => a + b, 0) / data.reactionTime.length
          : 0;

        const accuracy = data.totalChoices > 0 ? (data.correctChoices / data.totalChoices) * 100 : 0;
        const selectiveAttention = Math.max(0, 100 - (data.distractorClicks * 20));
        const sustainedAttention = Math.max(0, 100 - ((data.reactionTime.length - data.correctChoices) * 10));
        const dividedAttention = Math.max(0, 100 - (data.distractorClicks * 15));
        const impulseControl = Math.max(0, 100 - (data.impulseControl * 25));

        return {
          ...data,
          selectiveAttention,
          sustainedAttention,
          dividedAttention,
          impulseControl,
          avgReactionTime,
          accuracy
        };
      };

      const finalData = calculateFinalScores(attentionData);
      setAttentionData(finalData);

      // Veri kaydetme işlemini burada yap
      const overallScore = (finalData.accuracy + finalData.selectiveAttention +
                           finalData.sustainedAttention + finalData.dividedAttention +
                           finalData.impulseControl) / 5;

      const gameData: StoryAttentionGameData = {
        studentId,
        studentAge,
        gameType: 'story-attention',
        score: Math.round(overallScore),
        duration: Date.now() - sceneStartTime,
        storyTheme: storyTheme,
        attentionData: {
          selectiveAttention: finalData.selectiveAttention,
          sustainedAttention: finalData.sustainedAttention,
          dividedAttention: finalData.dividedAttention,
          impulseControl: finalData.impulseControl,
          avgReactionTime: finalData.avgReactionTime || 0,
          accuracy: finalData.accuracy || 0,
          distractorClicks: finalData.distractorClicks,
          correctChoices: finalData.correctChoices,
          totalChoices: finalData.totalChoices
        },
        timestamp: new Date().toISOString()
      };

      saveStoryAttentionGameData(gameData).catch(error => {
        console.error('Failed to save story attention game data:', error);
      });
    }
  }, [gameEnded, showFinalReport, attentionData, studentId, studentAge, sceneStartTime, storyTheme]);

  useEffect(() => {
    if (gameStarted && !gameEnded && currentScene) {
      setSceneStartTime(Date.now());

      // Background task simülasyonu
      if (currentScene.backgroundTask) {
        const interval = setInterval(() => {
          setBackgroundSymbolVisible(true);
          setTimeout(() => setBackgroundSymbolVisible(false), 1500);
        }, 3000 + Math.random() * 2000);

        return () => clearInterval(interval);
      }

      // Emergency task simülasyonu
      if (currentScene.emergencyTask) {
        const timeout = setTimeout(() => {
          setEmergencyActive(true);
          setTimeout(() => {
            setEmergencyActive(false);
            // Otomatik olarak bir sonraki sahneye geç
            handleNextScene();
          }, currentScene.emergencyTask.duration);
        }, 2000 + Math.random() * 3000);

        return () => clearTimeout(timeout);
      }
    }
  }, [sceneNumber, gameStarted, gameEnded, currentScene]);

  const handleChoiceClick = useCallback((choiceId: string) => {
    console.log('Choice clicked:', choiceId);

    if (!currentScene || emergencyActive || isLoadingStory) return;

    const reactionTime = Date.now() - sceneStartTime;
    const choice = currentScene.choices.find(c => c.id === choiceId);

    if (!choice) return;

    console.log('Selected choice:', choice.text);

    // Seçim metnini kaydet
    setLastChoice(choice.text);

    // EMOTION SESSION MANAGEMENT - Sahne boyunca toplanan emotion verilerini al
    console.log('🎭 [STORY GAME] Sahne tamamlandı, emotion verisi alınıyor...');

    // Sahne emotion session'ını bitir ve veriyi al
    const sceneEmotionData = emotionAnalysisService.endRoundSession();
    console.log('🎭 [STORY GAME] Sahne emotion verisi:', sceneEmotionData);

    // Emotion data'yı pending state'e kaydet - useEffect tarafından kullanılacak
    setPendingEmotionData(sceneEmotionData);

    setAttentionData(prev => {
      const newData = {
        ...prev,
        reactionTime: [...prev.reactionTime, reactionTime],
        totalChoices: prev.totalChoices + 1
      };

      // Mood-based scoring yerine artık tüm seçimler geçerli
      newData.correctChoices++;

      if (choice.isDistractor) {
        newData.distractorClicks++;
      }

      // Impulse control - çok hızlı tıklama (< 500ms)
      if (reactionTime < 500) {
        newData.impulseControl += 1;
      }

      return newData;
    });

    handleNextScene();
  }, [currentScene, sceneStartTime, emergencyActive]);

  const handleBackgroundSymbolClick = useCallback(() => {
    // Background task'a tıklama - dikkat bölünmesi hatası
    setAttentionData(prev => ({
      ...prev,
      distractorClicks: prev.distractorClicks + 1
    }));
    setBackgroundSymbolVisible(false);
  }, []);

  const handleEmergencyClick = useCallback(() => {
    const reactionTime = Date.now() - sceneStartTime;
    setAttentionData(prev => ({
      ...prev,
      reactionTime: [...prev.reactionTime, reactionTime]
    }));
    setEmergencyActive(false);
    handleNextScene();
  }, [sceneStartTime]);

  const handleNextScene = useCallback(() => {
    console.log('Handling next scene. Current scene number:', sceneNumber);

    // Maksimum 5 sahne sonra oyunu bitir
    if (sceneNumber >= 5) {
      console.log('Game ending - reached max scenes');
      setGameEnded(true);
      setShowFinalReport(true);
    } else {
      console.log('Moving to next scene:', sceneNumber + 1);
      setSceneNumber(prev => prev + 1);
      // useEffect sceneNumber değiştiğinde generateNextScene'i çağıracak
      // pendingEmotionData otomatik olarak kullanılacak
    }
  }, [sceneNumber]);

  // Game end kontrolü - emotion tracking durdur
  useEffect(() => {
    if (gameEnded) {
      console.log('🏁 [STORY GAME] Oyun bitti, emotion tracking durduruluyor...');

      // FRAME ANALİZİ DURDUR - Python server'a frame göndermeyi durdur
      cameraEmotionService.stopFrameAnalysis?.();

      // Emotion tracking tamamen durdur
      stopEmotionTracking();
    }
  }, [gameEnded, stopEmotionTracking]);

  const startGame = async (theme: 'adventure' | 'space' | 'underwater' = 'adventure') => {
    // Emotion tracking başlat - oyun başlamadan önce kamera hazırla
    await startEmotionTracking();

    setStoryTheme(theme);
    setGameStarted(true);
    setSceneNumber(1);
    setLastChoice('');

    // OYUN BAŞLADI - emotion kaydetmeyi başlat
    emotionAnalysisService.startGameSession();
    // İLK SAHNE BAŞLADI - scene emotion tracking başlat
    emotionAnalysisService.startRoundSession();

    // İLK SAHNE BAŞLADI - FRAME ANALİZİ BAŞLAT
    cameraEmotionService.startFrameAnalysis?.();

    await generateNextScene();
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setSceneNumber(1);
    setCurrentScene(null);
    setShowFinalReport(false);
    setLastChoice('');
    setIsLoadingStory(false);

    // Emotion states sıfırla
    setEmotionAnalysisActive(false);
    setCurrentEmotion(null);
    setAttentionMetrics(null);
    setAttentionData({
      selectiveAttention: 0,
      sustainedAttention: 0,
      dividedAttention: 0,
      impulseControl: 0,
      reactionTime: [],
      distractorClicks: 0,
      correctChoices: 0,
      totalChoices: 0
    });
  };

  if (showFinalReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        {/* Hidden video for camera access */}
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Hikaye Tamamlandı!</h2>
              <p className="text-gray-600">Dikkat becerilerinin analizi</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <Eye className="h-8 w-8 mb-4" />
                <h3 className="text-lg font-bold">Seçici Dikkat</h3>
                <p className="text-2xl font-bold">{Math.round(attentionData.selectiveAttention)}%</p>
                <p className="text-blue-100 text-sm">Çeldiricileri görmezden gelme</p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <Target className="h-8 w-8 mb-4" />
                <h3 className="text-lg font-bold">Sürekli Dikkat</h3>
                <p className="text-2xl font-bold">{Math.round(attentionData.sustainedAttention)}%</p>
                <p className="text-green-100 text-sm">Dikkatin devamlılığı</p>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                <Zap className="h-8 w-8 mb-4" />
                <h3 className="text-lg font-bold">Bölünmüş Dikkat</h3>
                <p className="text-2xl font-bold">{Math.round(attentionData.dividedAttention)}%</p>
                <p className="text-purple-100 text-sm">Çoklu görev yetisi</p>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-lg text-white">
                <Pause className="h-8 w-8 mb-4" />
                <h3 className="text-lg font-bold">Dürtü Kontrolü</h3>
                <p className="text-2xl font-bold">{Math.round(attentionData.impulseControl)}%</p>
                <p className="text-orange-100 text-sm">Hızlı karar verme kontrolü</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Detaylı Analiz</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Toplam Doğru Cevap:</span> {attentionData.correctChoices}/{attentionData.totalChoices}</p>
                  <p><span className="font-medium">Başarı Oranı:</span> {Math.round((attentionData.correctChoices / attentionData.totalChoices) * 100)}%</p>
                </div>
                <div>
                  <p><span className="font-medium">Çeldirici Tıklama:</span> {attentionData.distractorClicks}</p>
                  <p><span className="font-medium">Ortalama Tepki Süresi:</span> {Math.round(attentionData.reactionTime.reduce((a, b) => a + b, 0) / attentionData.reactionTime.length)}ms</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Tekrar Oyna
              </button>
              <button
                onClick={() => onGameComplete(
                  Math.round((attentionData.selectiveAttention + attentionData.sustainedAttention +
                            attentionData.dividedAttention + attentionData.impulseControl) / 4),
                  Date.now() - sceneStartTime,
                  attentionData
                )}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Ana Menüye Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        {/* Hidden video for camera access */}
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-purple-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Hikaye Tabanlı Dikkat Oyunu</h2>
              <p className="text-gray-600 mb-8">
                Ali'nin macerasında ona yardım et! Bu oyun dikkat becerilerini ölçer:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600 mb-2" />
                  <h3 className="font-bold text-blue-800">Seçici Dikkat</h3>
                  <p className="text-blue-700 text-sm">Çeldiricileri görmezden gel</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <Target className="h-6 w-6 text-green-600 mb-2" />
                  <h3 className="font-bold text-green-800">Sürekli Dikkat</h3>
                  <p className="text-green-700 text-sm">Dikkati uzun süre koru</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600 mb-2" />
                  <h3 className="font-bold text-purple-800">Bölünmüş Dikkat</h3>
                  <p className="text-purple-700 text-sm">Aynı anda iki işi yap</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <Pause className="h-6 w-6 text-orange-600 mb-2" />
                  <h3 className="font-bold text-orange-800">Dürtü Kontrolü</h3>
                  <p className="text-orange-700 text-sm">Düşünmeden hareket etme</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 text-center mb-4">Hangi hikayeyi oynamak istiyorsun?</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => startGame('adventure')}
                    disabled={isLoadingStory}
                    className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <div className="text-3xl mb-2">🌲</div>
                    <h4 className="font-bold">Orman Macerası</h4>
                    <p className="text-sm text-green-100">Ali'nin büyülü orman yolculuğu</p>
                  </button>

                  <button
                    onClick={() => startGame('space')}
                    disabled={isLoadingStory}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <div className="text-3xl mb-2">🚀</div>
                    <h4 className="font-bold">Uzay Keşfi</h4>
                    <p className="text-sm text-blue-100">Aylin'in gezegen maceraları</p>
                  </button>

                  <button
                    onClick={() => startGame('underwater')}
                    disabled={isLoadingStory}
                    className="bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <div className="text-3xl mb-2">🐠</div>
                    <h4 className="font-bold">Deniz Altı</h4>
                    <p className="text-sm text-teal-100">Cem'in okyanus keşfi</p>
                  </button>
                </div>

                {isLoadingStory && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Hikaye hazırlanıyor...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      {/* Hidden video for camera access */}
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

      {/* Background task symbol */}
      {backgroundSymbolVisible && currentScene?.backgroundTask && (
        <div
          className="fixed top-20 right-20 text-4xl cursor-pointer animate-bounce z-10"
          onClick={handleBackgroundSymbolClick}
        >
          {currentScene.backgroundTask.targetSymbol}
        </div>
      )}

      {/* Emergency task */}
      {emergencyActive && currentScene?.emergencyTask && (
        <div className="fixed inset-0 bg-red-500/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center animate-pulse">
            <div className="text-6xl mb-4">{currentScene.emergencyTask.symbol}</div>
            <h3 className="text-2xl font-bold text-red-600 mb-4">
              {currentScene.emergencyTask.instruction}
            </h3>
            <button
              onClick={handleEmergencyClick}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg animate-pulse"
            >
              🏃‍♂️ KAÇ!
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Sahne {sceneNumber} / 5
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((sceneNumber / 5) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(sceneNumber / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Story scene */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Emotion tracking indicator */}
          {emotionAnalysisActive && (
            <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Kamera Aktif</span>
              </div>
              {currentEmotion && (
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Şu an:</span> {currentEmotion.dominantEmotion || 'Analiz ediliyor...'}
                  {currentEmotion.confidence && (
                    <span className="ml-1">({(currentEmotion.confidence * 100).toFixed(0)}%)</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="text-center mb-8">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {currentScene?.story}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {currentScene?.question}
            </p>
          </div>

          {/* Loading durumu */}
          {isLoadingStory && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-purple-600 mb-2">Hikaye devam ediyor...</h3>
              <p className="text-gray-600">Seçiminize göre yeni macera hazırlanıyor!</p>
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
            </div>
          )}

          {/* Seçim sonrası feedback */}
          {lastChoice && !isLoadingStory && sceneNumber > 1 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="text-2xl">✅</div>
                <div>
                  <h4 className="font-bold text-green-800">Seçimin: {lastChoice}</h4>
                  <p className="text-green-700 text-sm">Hikaye bu seçiminle devam ediyor...</p>
                </div>
              </div>
            </div>
          )}

          {/* Choices */}
          {!isLoadingStory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentScene?.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceClick(choice.id)}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                    choice.isDistractor
                      ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                      : choice.stroopConflict
                      ? 'border-red-300 bg-red-50 hover:bg-red-100'
                      : 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                  } ${isLoadingStory ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={choice.color ? {
                    borderColor: choice.color,
                    backgroundColor: choice.color + '20'
                  } : {}}
                  disabled={emergencyActive || isLoadingStory}
                >
                  <span
                    className="text-lg font-bold"
                    style={choice.color && choice.stroopConflict ? { color: choice.color } : {}}
                  >
                    {choice.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Background task instruction */}
          {currentScene?.backgroundTask && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-center text-yellow-800 font-medium">
                ⚠️ {currentScene.backgroundTask.instruction}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
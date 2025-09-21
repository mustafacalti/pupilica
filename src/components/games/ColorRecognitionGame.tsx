import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmotionResult } from '../../types';
import { ollamaService } from '../../services/ollamaService';
import { Clock, RotateCcw, Star, Palette, Brain, Camera, Target } from 'lucide-react';

interface ColorRecognitionGameProps {
  studentId: string;
  studentAge?: number;
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

const GAME_COLORS = [
  { name: 'Kırmızı', hex: '#FF0000', bgColor: 'bg-red-500' },
  { name: 'Mavi', hex: '#0000FF', bgColor: 'bg-blue-500' },
  { name: 'Yeşil', hex: '#00FF00', bgColor: 'bg-green-500' },
  { name: 'Sarı', hex: '#FFFF00', bgColor: 'bg-yellow-500' },
  { name: 'Turuncu', hex: '#FFA500', bgColor: 'bg-orange-500' },
  { name: 'Mor', hex: '#800080', bgColor: 'bg-purple-500' },
  { name: 'Pembe', hex: '#FFC0CB', bgColor: 'bg-pink-500' },
  { name: 'Beyaz', hex: '#FFFFFF', bgColor: 'bg-white' },
  { name: 'Siyah', hex: '#000000', bgColor: 'bg-black' }
];

export const ColorRecognitionGame: React.FC<ColorRecognitionGameProps> = ({
  studentId,
  studentAge = 6,
  onGameComplete,
  onEmotionDetected
}) => {
  const [gameState, setGameState] = useState<'idle' | 'asking-ai' | 'waiting-for-color' | 'counting' | 'success' | 'failed' | 'completed'>('idle');
  const [targetColor, setTargetColor] = useState<typeof GAME_COLORS[0] | null>(null);
  const [countdownTime, setCountdownTime] = useState(5);
  const [gameTimeLeft, setGameTimeLeft] = useState(60); // 1 dakika oyun süresi
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameStartTime] = useState(Date.now());
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const [isVideoActive, setIsVideoActive] = useState(false);

  // isVideoActive değişimini takip et
  useEffect(() => {
    console.log('🎬 isVideoActive değişti:', isVideoActive);
  }, [isVideoActive]);
  const [colorDetected, setColorDetected] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [colorHoldTime, setColorHoldTime] = useState(0); // Rengi ne kadar süredir tutuyor
  const [cameraError, setCameraError] = useState<string>('');
  const [detectedRGB, setDetectedRGB] = useState<{r: number, g: number, b: number} | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const colorCheckRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalRounds = 5;

  // Kamera başlatma
  const startCamera = useCallback(async () => {
    console.log('🎥 Kamera başlatılmaya çalışılıyor...');
    console.log('🔍 Video ref durumu:', {
      current: !!videoRef.current,
      isConnected: videoRef.current?.isConnected,
      parentElement: !!videoRef.current?.parentElement
    });

    // Video element kontrolü
    if (!videoRef.current) {
      console.error('❌ Video element henüz mevcut değil, DOM mount bekleniyor...');
      setCameraError('Video element henüz hazır değil');
      // 500ms sonra tekrar dene
      setTimeout(() => {
        if (videoRef.current) {
          console.log('🔄 Video element bulundu, tekrar deneniyor...');
          startCamera();
        }
      }, 500);
      return;
    }

    // Browser desteği kontrolü
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'Browser kamera desteği yok. Lütfen modern bir tarayıcı kullanın.';
      console.error('❌', errorMsg);
      setCameraError(errorMsg);
      setIsVideoActive(false);
      return;
    }

    try {
      // Önce basit bir istekle deneyelim
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      console.log('✅ Kamera akışı alındı:', stream);

      if (videoRef.current) {
        console.log('🎬 Video element bulundu, stream atanıyor...');
        console.log('🏗️ Video element DOM durumu:', {
          isConnected: videoRef.current.isConnected,
          parentElement: !!videoRef.current.parentElement,
          tagName: videoRef.current.tagName,
          autoplay: videoRef.current.autoplay,
          playsInline: videoRef.current.playsInline,
          muted: videoRef.current.muted
        });
        console.log('📊 Video element durumu:', {
          readyState: videoRef.current.readyState,
          networkState: videoRef.current.networkState,
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight
        });

        videoRef.current.srcObject = stream;

        // Mevcut event listener'ları temizle
        videoRef.current.onloadedmetadata = null;
        videoRef.current.onerror = null;

        // Video yüklendiğinde otomatik oynatma
        const handleMetadataLoaded = () => {
          console.log('📹 Video metadata yüklendi');
          console.log('📏 Video boyutları:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          console.log('📊 Video readyState:', videoRef.current?.readyState);

          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('▶️ Video oynatılmaya başladı');
              console.log('✅ setIsVideoActive(true) çağrılıyor');
              setIsVideoActive(true);
              setCameraError(''); // Başarılı olduğunda error'ı temizle
            }).catch(playError => {
              console.error('❌ Video oynatma hatası:', playError);
              setCameraError('Video oynatılamıyor. Lütfen tarayıcıyı yenileyin.');
              setIsVideoActive(false);
            });
          }
        };

        // Hata durumları için event listener
        const handleVideoError = (e: Event) => {
          console.error('❌ Video element hatası:', e);
          setCameraError('Video element hatası oluştu.');
          setIsVideoActive(false);
        };

        // Event listener'ları ekle
        console.log('🔧 Event listener\'lar ekleniyor...');
        videoRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
        videoRef.current.addEventListener('error', handleVideoError);

        // Stream atandıktan sonraki durum
        console.log('📊 Stream atama sonrası durum:', {
          readyState: videoRef.current.readyState,
          networkState: videoRef.current.networkState,
          srcObject: !!videoRef.current.srcObject
        });

        // Eğer metadata zaten yüklendiyse hemen çalıştır
        if (videoRef.current.readyState >= 1) {
          console.log('📹 Metadata zaten yüklü, direkt oynatılıyor');
          handleMetadataLoaded();
        } else {
          console.log('⏳ Metadata yüklenmesi bekleniyor...');
        }

        // Immediate play attempt (bazı browser'larda gerekli)
        const immediatePlayAttempt = () => {
          if (videoRef.current && videoRef.current.srcObject) {
            console.log('🚀 Immediate play attempt...');
            videoRef.current.play().then(() => {
              console.log('✅ Immediate play başarılı');
              if (!isVideoActive) {
                setIsVideoActive(true);
                setCameraError('');
              }
            }).catch(err => {
              console.log('⏸️ Immediate play başarısız (normal):', err.message);
            });
          }
        };

        // Kısa bir delay ile immediate play
        setTimeout(immediatePlayAttempt, 100);

        // Video can play olduğunda da kontrol et
        const handleCanPlay = () => {
          console.log('✅ Video oynatılabilir durumda');
          console.log('🔍 isVideoActive mevcut değeri:', isVideoActive);
          if (!isVideoActive) {
            console.log('📺 setIsVideoActive(true) çağrılıyor (canplay event)');
            setIsVideoActive(true);
            setCameraError('');
          }
        };

        videoRef.current.addEventListener('canplay', handleCanPlay);

        // Agresif kontrol - 500ms'de bir
        const aggressiveCheck = () => {
          if (videoRef.current && !isVideoActive) {
            console.log('🔄 Agresif kontrol...', {
              readyState: videoRef.current.readyState,
              videoWidth: videoRef.current.videoWidth,
              videoHeight: videoRef.current.videoHeight,
              srcObject: !!videoRef.current.srcObject,
              currentTime: videoRef.current.currentTime
            });

            // Video metadata var ve stream aktif ise
            if (videoRef.current.srcObject && (
              videoRef.current.readyState >= 1 ||
              videoRef.current.videoWidth > 0 ||
              videoRef.current.currentTime > 0
            )) {
              console.log('🚀 AGRESIF AKTİFLEŞTİRME: setIsVideoActive(true)');
              setIsVideoActive(true);
              setCameraError('');
              return; // Stop checking
            }
          }

          // Continue checking if not active
          if (!isVideoActive) {
            setTimeout(aggressiveCheck, 500);
          }
        };

        // Start aggressive checking after 500ms
        setTimeout(aggressiveCheck, 500);
      }
    } catch (error) {
      console.error('❌ Kamera erişimi başarısız:', error);
      console.error('Hata tipi:', error.name);
      console.error('Hata mesajı:', error.message);

      // Kullanıcıya daha detaylı hata mesajı göster
      let errorMsg = '';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini aktifleştirin.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Kamera bulunamadı. Lütfen kameranızın bağlı ve çalışır durumda olduğunu kontrol edin.';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'HTTPS gerekli. Lütfen sayfayı HTTPS üzerinden açın.';
      } else {
        errorMsg = `Kamera hatası: ${error.message}`;
      }

      setCameraError(errorMsg);
      setIsVideoActive(false);
    }
  }, []);

  // Kamera durdurma
  const stopCamera = useCallback(() => {
    console.log('🛑 Kamera durduruluyor...');

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        console.log('⏹️ Track durduruluyor:', track.kind);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }

    // Event listener'ları temizle
    if (videoRef.current) {
      videoRef.current.removeEventListener('loadedmetadata', () => {});
      videoRef.current.removeEventListener('error', () => {});
      videoRef.current.removeEventListener('canplay', () => {});
    }

    setIsVideoActive(false);
    setCameraError('');
  }, []);

  // Oyunu bitir
  const completeGame = useCallback(() => {
    setGameState('completed');
    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);

    // Timer'ları temizle
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (colorCheckRef.current) clearInterval(colorCheckRef.current);

    stopCamera();
    onGameComplete(score, gameDuration, emotions);
  }, [score, emotions, gameStartTime, onGameComplete, stopCamera]);

  // Oyunu başlat
  const startGame = useCallback(async () => {
    setGameState('asking-ai');
    setGameTimeLeft(60);
    await startCamera();

    // 1 dakika oyun timer'ı başlat
    gameTimerRef.current = setInterval(() => {
      setGameTimeLeft(prev => {
        if (prev <= 1) {
          completeGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    askAIForColor();
  }, [startCamera, completeGame]);

  // Renk algılama (basit RGB analizi)
  const detectColor = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !targetColor) {
      console.log('🔍 detectColor: Eksik element', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        targetColor: !!targetColor
      });
      return false;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (!ctx) {
      console.log('❌ Canvas context alınamadı');
      return false;
    }

    // Video boyutları kontrolü
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('⚠️ Video boyutları henüz yüklenmedi:', video.videoWidth, 'x', video.videoHeight);
      return false;
    }

    try {
      // Video'dan frame al
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Merkez alanını analiz et
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const sampleSize = 80; // 80x80 piksel alan (daha büyük)

      const imageData = ctx.getImageData(
        centerX - sampleSize/2,
        centerY - sampleSize/2,
        sampleSize,
        sampleSize
      );

      // Ortalama RGB değerlerini hesapla
      let r = 0, g = 0, b = 0;
      const pixelCount = imageData.data.length / 4;

      for (let i = 0; i < imageData.data.length; i += 4) {
        r += imageData.data[i];
        g += imageData.data[i + 1];
        b += imageData.data[i + 2];
      }

      r = Math.round(r / pixelCount);
      g = Math.round(g / pixelCount);
      b = Math.round(b / pixelCount);

      // Algılanan rengi state'e kaydet
      setDetectedRGB({ r, g, b });

      // Hedef renge yakınlık kontrolü
      const targetRgb = hexToRgb(targetColor.hex);
      if (!targetRgb) {
        console.log('❌ Target RGB dönüştürülemedi:', targetColor.hex);
        return false;
      }

      const distance = Math.sqrt(
        Math.pow(r - targetRgb.r, 2) +
        Math.pow(g - targetRgb.g, 2) +
        Math.pow(b - targetRgb.b, 2)
      );

      // Debug: Her 20 kontrolde bir log (daha az spam)
      if (Math.random() < 0.05) {
        console.log('🎨 Renk analizi:', {
          detected: `rgb(${r}, ${g}, ${b})`,
          target: `rgb(${targetRgb.r}, ${targetRgb.g}, ${targetRgb.b})`,
          targetName: targetColor.name,
          distance: distance.toFixed(1),
          threshold: 120,
          match: distance < 120
        });
      }

      // Eşik değeri optimize edildi - daha hassas tanıma için
      return distance < 120;
    } catch (error) {
      console.error('❌ Renk algılama hatası:', error);
      return false;
    }
  }, [targetColor]);

  // Renk algılamayı başlat
  const startColorDetection = useCallback(() => {
    if (!targetColor) {
      console.log('⚠️ Target color henüz belirlenmedi, renk algılama başlatılamıyor');
      return;
    }

    // Eğer zaten çalışan bir interval varsa, yeni başlatma
    if (colorCheckRef.current) {
      console.log('⚠️ Renk algılama zaten çalışıyor, yeni başlatılmıyor');
      return;
    }

    console.log('🎯 Renk algılama başlatılıyor...', {
      targetColor: targetColor?.name,
      gameTimeLeft: gameTimeLeft
    });

    setColorHoldTime(0);
    setColorDetected(false);

    // Sürekli renk kontrolü
    colorCheckRef.current = setInterval(() => {
      const colorMatch = detectColor();

      if (colorMatch) {
        console.log('✅ Renk eşleşti!');
        setColorDetected(true);
        setColorHoldTime(prev => {
          const newTime = prev + 0.1; // Her 100ms'de 0.1 saniye ekle

          if (newTime >= 5) {
            // 5 saniye rengi tuttu - başarı!
            console.log('🎉 5 saniye tamamlandı! Başarı!');
            if (colorCheckRef.current) {
              clearInterval(colorCheckRef.current);
              colorCheckRef.current = null;
            }
            setGameState('success');
            setScore(prev => prev + 1);

            // Başarı emotion'ı
            const emotion: EmotionResult = {
              emotion: 'happy',
              confidence: 0.9,
              timestamp: new Date()
            };
            setEmotions(prev => [...prev, emotion]);
            onEmotionDetected?.(emotion);

            // 2 saniye sonra yeni renk seç
            setTimeout(() => {
              if (gameTimeLeft > 0) {
                console.log('🔄 Yeni renk seçiliyor...');
                askAIForColor();
              } else {
                console.log('⏰ Oyun süresi doldu');
              }
            }, 2000);
          }
          return newTime;
        });
      } else {
        if (colorDetected) {
          console.log('❌ Renk kaybedildi, süre sıfırlanıyor');
        }
        setColorDetected(false);
        setColorHoldTime(0); // Renk kaybolduğunda sıfırla
      }
    }, 100); // 100ms'de bir kontrol et

    console.log('✅ Renk algılama interval başlatıldı');
  }, [detectColor, onEmotionDetected, gameTimeLeft, targetColor, colorDetected]);

  // AI'dan renk seçimi
  const askAIForColor = useCallback(async () => {
    console.log('🤖 AI renk seçimi başlıyor...');
    setGameState('asking-ai');
    setAiResponse('');

    try {
      const colorNames = GAME_COLORS.map(c => c.name).join(', ');
      const randomSeed = Math.floor(Math.random() * 1000);
      const prompt = `SADECE TEK KELİME RENK İSMİ SÖYLE!

Renkler: ${colorNames}

SADECE BİR RENGİN İSMİNİ YAZ, BAŞKA HİÇBİR ŞEY YAZMA!
Örnek: Mavi
Örnek: Kırmızı

Şimdi sadece bir renk ismi yaz:`;

      console.log('📤 AI\'ya gönderilen prompt:', prompt);

      const rawResponse = await ollamaService.generateSimpleResponse(prompt);
      console.log('📥 AI\'dan gelen ham yanıt:', rawResponse);

      // Response'u temizle - agresif temizleme
      let cleanResponse = rawResponse
        .replace(/<think>[\s\S]*?<\/think>/gs, '') // think tag'lerini kaldır (multiline)
        .replace(/<think>[\s\S]*/gs, '') // açık think tag'i varsa kalan kısmı sil
        .replace(/<.*?>/g, '') // diğer HTML tag'lerini kaldır
        .replace(/Tamam,.*$/gs, '') // "Tamam, ..." ile başlayan her şeyi sil
        .replace(/Hmm,.*$/gs, '') // "Hmm, ..." ile başlayan her şeyi sil
        .replace(/Oyun #\d+.*$/gs, '') // "Oyun #343 ..." ile başlayan her şeyi sil
        .replace(/kullanıcı.*$/gs, '') // "kullanıcı ..." ile başlayan her şeyi sil
        .replace(/.*?listesi.*$/gs, '') // liste kelimesi içeren satırları sil
        .replace(/.*?seç.*$/gs, '') // seç kelimesi içeren satırları sil
        .replace(/\n+/g, ' ') // çoklu satırları tek satır yap
        .trim();

      // Eğer hala boşsa veya çok kısa ise direct fallback
      if (!cleanResponse || cleanResponse.length < 2) {
        console.log('🎲 AI yanıtı boş/kısa, direkt fallback kullanılıyor');
        const randomColor = GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];
        console.log('🎲 Rastgele seçilen renk:', randomColor.name);
        setTargetColor(randomColor);
        setGameState('counting');
        return;
      }

      console.log('🧹 Temizlenmiş AI yanıtı:', cleanResponse);
      setAiResponse(cleanResponse);

      // AI'nin verdiği yanıttan rengi bul
      const selectedColor = GAME_COLORS.find(color =>
        cleanResponse.toLowerCase().includes(color.name.toLowerCase()) ||
        color.name.toLowerCase().includes(cleanResponse.toLowerCase())
      );

      if (selectedColor) {
        console.log('✅ AI renk seçimi başarılı:', selectedColor.name);
        setTargetColor(selectedColor);
        setGameState('counting');
        // useEffect ile startColorDetection çağrılacak
      } else {
        console.log('⚠️ AI yanıtından renk bulunamadı, fallback kullanılıyor');
        console.log('🔍 Aranan response:', cleanResponse);
        // Fallback: rastgele renk seç
        const randomColor = GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];
        console.log('🎲 Rastgele seçilen renk:', randomColor.name);
        setTargetColor(randomColor);
        setGameState('counting');
        // useEffect ile startColorDetection çağrılacak
      }
    } catch (error) {
      console.error('❌ AI renk seçimi başarısız:', error);
      // Fallback: rastgele renk seç
      const randomColor = GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];
      console.log('🎲 Hata sonrası rastgele seçilen renk:', randomColor.name);
      setTargetColor(randomColor);
      setGameState('counting');
      // useEffect ile startColorDetection çağrılacak
    }
  }, []);

  // Hex to RGB converter
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // targetColor değiştiğinde renk algılamayı başlat (debounced)
  useEffect(() => {
    if (targetColor && gameState === 'counting') {
      console.log('🎯 Target color değişti, renk algılama başlatılıyor:', targetColor.name);

      // Önceki interval'ı temizle
      if (colorCheckRef.current) {
        clearInterval(colorCheckRef.current);
        colorCheckRef.current = null;
      }

      // Kısa bir delay ile başlat (debounce)
      const timeoutId = setTimeout(() => {
        startColorDetection();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [targetColor, gameState]); // startColorDetection'ı dependency'den çıkardım

  // Component mount olduğunda otomatik kamera başlat (sadece bir kez)
  useEffect(() => {
    console.log('🚀 Component mount oldu, kamera başlatılıyor...');
    // Kısa bir delay ile kamera başlat (DOM'un hazır olması için)
    const timer = setTimeout(() => {
      startCamera();
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Sadece mount time'da çalışır

  // Temizleme
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (colorCheckRef.current) clearInterval(colorCheckRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      stopCamera();
    };
  }, [stopCamera]);

  // Oyunu yeniden başlat
  const restartGame = () => {
    setScore(0);
    setRound(1);
    setEmotions([]);
    setGameState('idle');
    setTargetColor(null);
    setGameTimeLeft(60);
    setColorHoldTime(0);
    setColorDetected(false);
    setCameraError('');

    // Timer'ları temizle
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (colorCheckRef.current) clearInterval(colorCheckRef.current);

    stopCamera();
  };

  // Tamamlanma ekranı
  if (gameState === 'completed') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Palette className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">1 Dakika Tamamlandı!</h2>
            <p className="text-gray-600">AI ile renk tanıma oyununu başarıyla bitirdin!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {score}
              </div>
              <div className="text-sm text-gray-600">Başarılı Renk Tanıma</div>
              <div className="text-xs text-gray-500 mt-1">1 dakika içinde</div>
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
      {/* Gizli Video Element - Her zaman DOM'da */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {/* Game Header */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Süre: {Math.floor(gameTimeLeft / 60)}:{(gameTimeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm font-medium text-gray-800">
                Skor: {score}
              </div>
              {gameState === 'counting' && targetColor && (
                <div className="text-sm text-blue-600">
                  {targetColor.name}: {colorHoldTime.toFixed(1)}/5.0s
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">AI Destekli</span>
              {isVideoActive && (
                <Camera className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Game Card */}
      <Card>
        <CardContent className="text-center py-8">
          {gameState === 'idle' && (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                AI Renk Tanıma Oyunu
              </h2>
              <p className="text-gray-600">
                1 dakika süresince AI'nin seçtiği renkleri kameraya göster!<br/>
                Her rengi 5 saniye tuttuğunda puan kazanırsın.
              </p>

              {/* Kamera durumu */}
              {cameraError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-red-700 mb-2">
                    <Camera className="h-5 w-5" />
                    <span className="font-medium">Kamera Sorunu</span>
                  </div>
                  <p className="text-red-600 text-sm mb-3">{cameraError}</p>
                  <Button onClick={startCamera} size="sm" className="bg-red-600 hover:bg-red-700">
                    Kamerayı Tekrar Dene
                  </Button>
                </div>
              ) : isVideoActive ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Camera className="h-5 w-5" />
                    <span className="font-medium">Kamera Hazır ✓</span>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-700 mb-2">
                    <Camera className="h-5 w-5" />
                    <span className="font-medium">Kamera Gerekli</span>
                  </div>
                  <p className="text-blue-600 text-sm mb-3">Bu oyun kamera erişimi gerektirir</p>
                  <Button onClick={startCamera} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Kamerayı Test Et
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={startGame}
                  size="lg"
                  disabled={!isVideoActive}
                  className={`${!isVideoActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Oyunu Başlat
                </Button>

                {/* Debug bilgisi */}
                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded space-y-1">
                  <div>Debug: isVideoActive = {isVideoActive.toString()}</div>
                  <div>Video ref: {videoRef.current ? 'mevcut' : 'yok'}</div>
                  {videoRef.current && (
                    <div>Video readyState: {videoRef.current.readyState}</div>
                  )}
                  {cameraError && <div className="text-red-500">Error: {cameraError}</div>}
                </div>

                {/* Kamera önizleme - idle state'te */}
                {isVideoActive && (
                  <div className="relative inline-block">
                    <div className="w-60 h-45 rounded-lg border-2 border-gray-300 shadow-lg bg-black relative overflow-hidden">
                      <video
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        ref={(videoDisplay) => {
                          if (videoDisplay && videoRef.current?.srcObject) {
                            videoDisplay.srcObject = videoRef.current.srcObject;
                          }
                        }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        Kamera Hazır
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState === 'asking-ai' && (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h2 className="text-xl font-bold text-gray-800">AI Renk Seçiyor...</h2>
              <p className="text-gray-600">Gemma 9B model çalışıyor</p>
            </div>
          )}


          {gameState === 'counting' && targetColor && (
            <div className="space-y-6">
              {/* Hedef Renk */}
              <div className="space-y-4">
                {aiResponse && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-blue-800 font-medium">AI: "{aiResponse}"</p>
                  </div>
                )}
                <div className={`w-32 h-32 mx-auto rounded-full ${targetColor.bgColor} shadow-xl border-4 border-gray-300`}></div>
                <h2 className="text-3xl font-bold text-gray-800">{targetColor.name}</h2>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <p className="text-gray-600">Bu rengi kameraya 5 saniye göster!</p>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-100 ${
                      colorDetected ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${(colorHoldTime / 5) * 100}%` }}
                  ></div>
                </div>

                <div className="text-center">
                  <span className={`text-2xl font-bold ${colorDetected ? 'text-green-600' : 'text-gray-500'}`}>
                    {colorHoldTime.toFixed(1)}/5.0s
                  </span>
                </div>

                {colorDetected && (
                  <div className="text-green-600 font-medium">
                    ✅ Renk algılandı! Tutmaya devam et...
                  </div>
                )}

                {/* Algılanan renk debug bilgisi */}
                {detectedRGB && (
                  <div className="text-xs bg-gray-100 p-2 rounded space-y-1">
                    <div>Algılanan: rgb({detectedRGB.r}, {detectedRGB.g}, {detectedRGB.b})</div>
                    <div className="flex items-center space-x-2">
                      <span>Örnek:</span>
                      <div
                        className="w-8 h-4 border rounded"
                        style={{ backgroundColor: `rgb(${detectedRGB.r}, ${detectedRGB.g}, ${detectedRGB.b})` }}
                      ></div>
                    </div>
                    {targetColor && (
                      <div className="flex items-center space-x-2">
                        <span>Hedef:</span>
                        <div
                          className="w-8 h-4 border rounded"
                          style={{ backgroundColor: targetColor.hex }}
                        ></div>
                        <span>{targetColor.hex}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kamera Görüntüsü */}
              <div className="space-y-4">
                {/* Video görüntüsü - sadece kamera aktifken görünür */}
                {isVideoActive ? (
                  <div className="relative inline-block">
                    <div className="w-80 h-60 rounded-lg border-4 border-gray-300 shadow-lg bg-black relative overflow-hidden">
                      {/* Video clone - sadece görüntü için */}
                      <video
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        ref={(videoDisplay) => {
                          if (videoDisplay && videoRef.current?.srcObject) {
                            videoDisplay.srcObject = videoRef.current.srcObject;
                          }
                        }}
                      />

                      {/* Ortadaki hedef kutu */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className={`w-16 h-16 border-4 ${colorDetected ? 'border-green-400' : 'border-yellow-400'} rounded-lg pointer-events-none animate-pulse`}>
                          <div className="w-full h-full bg-transparent"></div>
                        </div>
                      </div>

                      {/* Köşedeki renk ipucu */}
                      <div className="absolute top-2 right-2">
                        <div className={`w-8 h-8 rounded-full ${targetColor.bgColor} border-2 border-white shadow-md`}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2 text-red-700 mb-2">
                      <Camera className="h-5 w-5" />
                      <span className="font-medium">Kamera Problemi</span>
                    </div>
                    <p className="text-red-600 text-sm mb-3">
                      {cameraError || 'Kamera erişilemedi'}
                    </p>
                    <Button onClick={startCamera} size="sm" className="bg-red-600 hover:bg-red-700">
                      Kamerayı Yeniden Başlat
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState === 'success' && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                <Star className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Başarılı!</h2>
              <p className="text-gray-600">+1 Puan! Yeni renk yükleniyor... 🌈</p>

              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden canvas for color detection */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};
import { EmotionAnalysisResult, emotionAnalysisService } from './emotionAnalysisService';

export interface CameraEmotionData {
  emotion: string;
  confidence: number;
  gaze_status: string;
  gaze_x?: number;
  looking_at_screen: boolean;
  lookingAtScreen: boolean; // Python camelCase
  faceDetected: boolean; // Python field
  timestamp: string;
}

class CameraEmotionService {
  private isActive = false;
  private isAnalysisActive = false; // Frame analizi aktif mi?
  private pythonServerUrl = 'http://172.16.0.4:5000'; // Python server
  private pollInterval: NodeJS.Timeout | null = null;
  private onEmotionCallback?: (result: EmotionAnalysisResult) => void;
  private videoRef: React.RefObject<HTMLVideoElement> | null = null;
  private lastAnalysisTime = 0; // Son analiz zamanı (strict timing için)
  private readonly ANALYSIS_INTERVAL = 3000; // 3 saniye strict interval

  /**
   * Kamera erişimini kontrol et
   */
  async checkCameraAvailability(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Hemen kapat
      return true;
    } catch (error) {
      console.log('📷 [CAMERA] Kamera erişimi yok:', error);
      return false;
    }
  }

  /**
   * Python emotion analysis server'ının çalışıp çalışmadığını kontrol et
   */
  async checkPythonServer(): Promise<boolean> {
    try {
      const response = await fetch(`${this.pythonServerUrl}/health`, {
        method: 'GET',
        timeout: 2000
      });
      return response.ok;
    } catch (error) {
      console.log('🐍 [PYTHON] Python server erişilemiyor:', error);
      return false;
    }
  }

  /**
   * Real-time emotion tracking başlat
   */
  async startEmotionTracking(
    videoElement: HTMLVideoElement,
    onEmotionDetected: (result: EmotionAnalysisResult) => void
  ): Promise<boolean> {
    console.log('🎭 [EMOTION] Real-time tracking başlatılıyor...');

    // Kamera erişimi kontrolü
    const cameraAvailable = await this.checkCameraAvailability();
    if (!cameraAvailable) {
      console.log('❌ [EMOTION] Kamera erişimi yok, mock mode kullanılacak');
      return false;
    }

    // Python server kontrolü
    const serverAvailable = await this.checkPythonServer();
    if (!serverAvailable) {
      console.log('❌ [EMOTION] Python server çalışmıyor, mock mode kullanılacak');
      return false;
    }

    try {
      // Kamera stream'i başlat
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      videoElement.srcObject = stream;
      await videoElement.play();

      this.onEmotionCallback = onEmotionDetected;
      this.isActive = true;

      // Python server'da kamera BAŞLATMA - React frontend kamerayı kullanacak
      // await fetch(`${this.pythonServerUrl}/start_camera`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // });

      // Video frame'ini düzenli olarak capture et ve analiz et
      // Interval 1 saniye ama strict timing kontrolü ile gerçekten 3 saniyede bir analiz
      this.pollInterval = setInterval(() => {
        this.captureAndAnalyzeFrame(videoElement);
      }, 1000); // 1 saniyede bir kontrol, ama analiz 3 saniyede bir

      console.log('✅ [EMOTION] Real-time kamera tracking aktif');
      return true;

    } catch (error) {
      console.error('❌ [EMOTION] Kamera başlatma hatası:', error);
      return false;
    }
  }

  /**
   * Video frame'ini capture et ve Python'a gönder
   */
  private async captureAndAnalyzeFrame(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isActive || !this.isAnalysisActive) return;

    // Oyun aktif değilse frame analiz etme (double check)
    if (!emotionAnalysisService.isGameActiveStatus()) {
      console.log('⏸️ [CAMERA FRAME] Oyun aktif değil, frame analizi atlanıyor');
      return;
    }

    // STRICT TIMING KONTROLÜ - 3 saniyede bir kesin analiz
    const now = Date.now();
    if (this.lastAnalysisTime > 0 && (now - this.lastAnalysisTime) < this.ANALYSIS_INTERVAL) {
      console.log('⏱️ [TIMING] Analiz çok erken, atlanıyor', {
        timeSinceLastAnalysis: `${now - this.lastAnalysisTime}ms`,
        required: `${this.ANALYSIS_INTERVAL}ms`
      });
      return;
    }

    this.lastAnalysisTime = now;

    try {
      // Video frame'ini canvas'a çiz
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Canvas'ı base64'e çevir
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Python server'a frame gönder
      const response = await fetch(`${this.pythonServerUrl}/analyze_frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frame: imageData.split(',')[1] // base64 kısmını al
        })
      });

      if (response.ok) {
        const data: CameraEmotionData = await response.json();
        const emotionResult = this.convertToEmotionResult(data);

        console.log('✅ [FRAME ANALYSIS] Analiz tamamlandı', {
          emotion: emotionResult.emotion,
          confidence: `${(emotionResult.confidence * 100).toFixed(1)}%`,
          gaze: emotionResult.gazeStatus,
          timeSinceLastAnalysis: `${Date.now() - this.lastAnalysisTime}ms`
        });

        if (this.onEmotionCallback) {
          this.onEmotionCallback(emotionResult);
        }
      }
    } catch (error) {
      console.log('🔍 [FRAME] Frame analiz hatası:', error);
    }
  }

  /**
   * Python server'dan emotion data çek (fallback)
   */
  private async pollEmotionData(): Promise<void> {
    if (!this.isActive) return;

    try {
      const response = await fetch(`${this.pythonServerUrl}/emotion_data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data: CameraEmotionData = await response.json();
        const emotionResult = this.convertToEmotionResult(data);

        if (this.onEmotionCallback) {
          this.onEmotionCallback(emotionResult);
        }
      }
    } catch (error) {
      // Sessizce geç, server offline olabilir
    }
  }

  /**
   * Python data'sını EmotionAnalysisResult'a çevir
   */
  private convertToEmotionResult(data: CameraEmotionData): EmotionAnalysisResult {
    // Emotion mapping - Python server basit emotion'lar gönderiyor
    const emotionMap: Record<string, EmotionAnalysisResult['emotion']> = {
      'happy': 'happy',
      'sad': 'sad',
      'bored': 'bored',
      'confused': 'confused',
      'surprised': 'surprised',
      'angry': 'angry',
      'neutral': 'neutral',
      'focused': 'focused', // focused kalır focused olarak
      'frustrated': 'angry' // frustrated -> angry mapping
    };

    const emotion = emotionMap[data.emotion] || 'neutral';

    // Gaze status mapping - Python server lookingAtScreen boolean gönderiyor
    let gazeStatus: EmotionAnalysisResult['gazeStatus'] = 'no-face';
    const lookingAtScreen = data.lookingAtScreen || data.looking_at_screen || false; // Fallback

    if (data.faceDetected) {
      gazeStatus = lookingAtScreen ? 'looking' : 'not-looking';
    }

    console.log('🔍 [GAZE MAPPING DEBUG]', {
      faceDetected: data.faceDetected,
      lookingAtScreen_snake: data.looking_at_screen,
      lookingAtScreen_camel: data.lookingAtScreen,
      finalLookingAtScreen: lookingAtScreen,
      gazeStatus
    });

    return {
      emotion,
      confidence: data.confidence,
      timestamp: new Date(),
      gazeStatus,
      gazeX: data.gaze_x,
      lookingAtScreen: lookingAtScreen
    };
  }

  /**
   * Emotion tracking'i durdur
   */
  stopEmotionTracking(): void {
    console.log('⏹️ [EMOTION] Real-time tracking durduruluyor...');

    this.isActive = false;
    this.isAnalysisActive = false; // Frame analysis'i de durdur

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Python server'da kamera durdur
    fetch(`${this.pythonServerUrl}/stop_camera`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {}); // Hata olsa da devam et

    this.onEmotionCallback = undefined;
  }

  /**
   * Mock emotion simulation (kamera yoksa)
   */
  startMockEmotionSimulation(
    onEmotionDetected: (result: EmotionAnalysisResult) => void,
    gameContext: {
      isPlaying: boolean;
      correctClicks: number;
      wrongClicks: number;
      timeLeft: number;
    }
  ): void {
    console.log('🎭 [MOCK] Mock emotion simulation başlatılıyor...');

    let emotionState = 'neutral';
    let lookingPercentage = 0.8; // %80 ekrana bakma
    let sessionTime = 0;

    const simulateEmotion = () => {
      if (!this.isActive) return;

      sessionTime += 1;
      const { correctClicks, wrongClicks, timeLeft, isPlaying } = gameContext;
      const accuracy = correctClicks + wrongClicks > 0 ? correctClicks / (correctClicks + wrongClicks) : 0.5;

      // Context-based emotion simulation
      if (!isPlaying) {
        emotionState = 'neutral';
      } else if (accuracy > 0.8 && correctClicks > 5) {
        emotionState = Math.random() > 0.7 ? 'happy' : 'neutral';
      } else if (accuracy < 0.3 && wrongClicks > 3) {
        emotionState = Math.random() > 0.6 ? 'confused' : Math.random() > 0.5 ? 'sad' : 'neutral';
      } else if (timeLeft < 10 && accuracy > 0.6) {
        emotionState = Math.random() > 0.7 ? 'surprised' : 'neutral';
      } else if (sessionTime > 30 && accuracy < 0.5) {
        emotionState = Math.random() > 0.6 ? 'bored' : 'neutral';
      }

      // Gaze simulation
      const distracted = Math.random() < 0.15; // %15 dikkat dağınıklığı
      const currentlyLooking = !distracted;

      if (distracted) {
        lookingPercentage = Math.max(0.4, lookingPercentage - 0.1);
      } else {
        lookingPercentage = Math.min(0.95, lookingPercentage + 0.05);
      }

      const mockResult: EmotionAnalysisResult = {
        emotion: emotionState as EmotionAnalysisResult['emotion'],
        confidence: 0.7 + Math.random() * 0.25,
        timestamp: new Date(),
        gazeStatus: currentlyLooking ? 'looking' : 'not-looking',
        gazeX: currentlyLooking ? 320 + (Math.random() - 0.5) * 100 : Math.random() * 640,
        lookingAtScreen: currentlyLooking
      };

      onEmotionDetected(mockResult);
    };

    this.isActive = true;
    this.pollInterval = setInterval(simulateEmotion, 1000); // 1 saniyede bir

    console.log('✅ [MOCK] Mock emotion simulation aktif');
  }

  /**
   * Frame analizi başlat (sadece aktif oyun sırasında)
   */
  startFrameAnalysis(): void {
    if (!this.isActive) {
      console.log('⚠️ [CAMERA] Kamera bağlantısı yok, frame analizi başlatılamıyor');
      return;
    }

    this.isAnalysisActive = true;
    this.lastAnalysisTime = 0; // Timing'i sıfırla - ilk analiz hemen yapılabilsin
    console.log('🎥 [CAMERA] Frame analizi başlatıldı, strict 3s timing aktif');
  }

  /**
   * Frame analizi durdur (oyun bittiğinde)
   */
  stopFrameAnalysis(): void {
    this.isAnalysisActive = false;
    console.log('⏸️ [CAMERA] Frame analizi durduruldu');
  }

  /**
   * Service aktif mi?
   */
  isTrackingActive(): boolean {
    return this.isActive;
  }

  /**
   * Frame analizi aktif mi?
   */
  isFrameAnalysisActive(): boolean {
    return this.isAnalysisActive;
  }
}

export const cameraEmotionService = new CameraEmotionService();
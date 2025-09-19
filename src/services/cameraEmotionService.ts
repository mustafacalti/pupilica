import { EmotionAnalysisResult } from './emotionAnalysisService';

export interface CameraEmotionData {
  emotion: string;
  confidence: number;
  gaze_status: string;
  gaze_x?: number;
  looking_at_screen: boolean;
  timestamp: string;
}

class CameraEmotionService {
  private isActive = false;
  private pythonServerUrl = 'http://localhost:8000'; // Python server
  private pollInterval: NodeJS.Timeout | null = null;
  private onEmotionCallback?: (result: EmotionAnalysisResult) => void;
  private videoRef: React.RefObject<HTMLVideoElement> | null = null;

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

      // Python server'dan düzenli olarak emotion data çek
      this.pollInterval = setInterval(() => {
        this.pollEmotionData();
      }, 500); // 500ms'de bir analiz

      console.log('✅ [EMOTION] Real-time kamera tracking aktif');
      return true;

    } catch (error) {
      console.error('❌ [EMOTION] Kamera başlatma hatası:', error);
      return false;
    }
  }

  /**
   * Python server'dan emotion data çek
   */
  private async pollEmotionData(): Promise<void> {
    if (!this.isActive) return;

    try {
      const response = await fetch(`${this.pythonServerUrl}/emotion-data`, {
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
    // Emotion mapping
    const emotionMap: Record<string, EmotionAnalysisResult['emotion']> = {
      'a happy child': 'happy',
      'a sad child': 'sad',
      'a bored child': 'bored',
      'a confused child': 'confused',
      'a surprised child': 'surprised',
      'an angry child': 'angry',
      'a neutral child': 'neutral'
    };

    const emotion = emotionMap[data.emotion] || 'neutral';

    // Gaze status mapping
    let gazeStatus: EmotionAnalysisResult['gazeStatus'] = 'no-face';
    if (data.gaze_status === 'LOOKING AT SCREEN') gazeStatus = 'looking';
    else if (data.gaze_status === 'NOT LOOKING AT SCREEN') gazeStatus = 'not-looking';

    return {
      emotion,
      confidence: data.confidence,
      timestamp: new Date(),
      gazeStatus,
      gazeX: data.gaze_x,
      lookingAtScreen: data.looking_at_screen
    };
  }

  /**
   * Emotion tracking'i durdur
   */
  stopEmotionTracking(): void {
    console.log('⏹️ [EMOTION] Real-time tracking durduruluyor...');

    this.isActive = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

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
   * Service aktif mi?
   */
  isTrackingActive(): boolean {
    return this.isActive;
  }
}

export const cameraEmotionService = new CameraEmotionService();
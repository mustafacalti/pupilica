import * as tf from '@tensorflow/tfjs';
import { EmotionResult } from '../types';

class EmotionDetectionService {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;
  private mediaStream: MediaStream | null = null;

  // Emotion labels (simplified for demo)
  private emotions = ['happy', 'sad', 'angry', 'neutral', 'focused', 'confused'];

  async loadModel(): Promise<void> {
    try {
      // For demo purposes, we'll create a simple mock model
      // In production, you would load a pre-trained emotion detection model
      this.model = await this.createMockModel();
      this.isModelLoaded = true;
      console.log('Emotion detection model loaded successfully');
    } catch (error) {
      console.error('Error loading emotion detection model:', error);
      // Fallback to mock detection
      this.isModelLoaded = false;
    }
  }

  private async createMockModel(): Promise<tf.LayersModel> {
    // Create a simple mock model for demonstration
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [100], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: this.emotions.length, activation: 'softmax' })
      ]
    });

    return model;
  }

  async startCamera(): Promise<HTMLVideoElement | null> {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      const videoElement = document.createElement('video');
      videoElement.srcObject = this.mediaStream;
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.playsInline = true;

      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve(videoElement);
        };
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      return null;
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  async detectEmotion(videoElement?: HTMLVideoElement): Promise<EmotionResult> {
    try {
      if (!this.isModelLoaded || !this.model) {
        // Return mock emotion for demo
        return this.generateMockEmotion();
      }

      if (!videoElement) {
        return this.generateMockEmotion();
      }

      // For a real implementation, you would:
      // 1. Extract face from video frame
      // 2. Preprocess the face image
      // 3. Run inference with the emotion model
      // 4. Return the emotion with confidence

      // For now, return mock emotion
      return this.generateMockEmotion();

    } catch (error) {
      console.error('Error detecting emotion:', error);
      return this.generateMockEmotion();
    }
  }

  private generateMockEmotion(): EmotionResult {
    // Generate realistic mock emotions based on typical distributions
    const emotionWeights = {
      'neutral': 0.3,
      'happy': 0.25,
      'focused': 0.2,
      'confused': 0.15,
      'sad': 0.07,
      'angry': 0.03
    };

    const randomValue = Math.random();
    let cumulativeWeight = 0;
    let selectedEmotion = 'neutral';

    for (const [emotion, weight] of Object.entries(emotionWeights)) {
      cumulativeWeight += weight;
      if (randomValue <= cumulativeWeight) {
        selectedEmotion = emotion;
        break;
      }
    }

    // Generate confidence based on emotion type
    const baseConfidence = {
      'neutral': 0.8,
      'happy': 0.9,
      'focused': 0.85,
      'confused': 0.75,
      'sad': 0.8,
      'angry': 0.7
    };

    const confidence = (baseConfidence[selectedEmotion as keyof typeof baseConfidence] || 0.8) +
                     (Math.random() - 0.5) * 0.2;

    return {
      emotion: selectedEmotion as EmotionResult['emotion'],
      confidence: Math.max(0.5, Math.min(1.0, confidence)),
      timestamp: new Date()
    };
  }

  async detectEmotionFromFace(imageData: ImageData): Promise<EmotionResult> {
    try {
      // Convert ImageData to tensor
      const tensor = tf.browser.fromPixels(imageData)
        .resizeNearestNeighbor([224, 224])
        .expandDims(0)
        .div(255.0);

      if (this.model) {
        const prediction = this.model.predict(tensor) as tf.Tensor;
        const probabilities = await prediction.data();

        // Find the emotion with highest probability
        let maxProb = 0;
        let emotionIndex = 0;

        for (let i = 0; i < probabilities.length; i++) {
          if (probabilities[i] > maxProb) {
            maxProb = probabilities[i];
            emotionIndex = i;
          }
        }

        tensor.dispose();
        prediction.dispose();

        return {
          emotion: this.emotions[emotionIndex] as EmotionResult['emotion'],
          confidence: maxProb,
          timestamp: new Date()
        };
      }

      tensor.dispose();
      return this.generateMockEmotion();

    } catch (error) {
      console.error('Error in face emotion detection:', error);
      return this.generateMockEmotion();
    }
  }

  // Continuous emotion monitoring
  startEmotionMonitoring(
    videoElement: HTMLVideoElement,
    onEmotionDetected: (emotion: EmotionResult) => void,
    intervalMs: number = 3000
  ): () => void {
    const interval = setInterval(async () => {
      try {
        const emotion = await this.detectEmotion(videoElement);
        onEmotionDetected(emotion);
      } catch (error) {
        console.error('Error in emotion monitoring:', error);
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }

  // Analyze emotion patterns
  analyzeEmotionPattern(emotions: EmotionResult[]): {
    dominant: string;
    average_confidence: number;
    distribution: { [key: string]: number };
  } {
    if (emotions.length === 0) {
      return {
        dominant: 'neutral',
        average_confidence: 0.5,
        distribution: {}
      };
    }

    const distribution: { [key: string]: number } = {};
    let totalConfidence = 0;

    emotions.forEach(emotion => {
      distribution[emotion.emotion] = (distribution[emotion.emotion] || 0) + 1;
      totalConfidence += emotion.confidence;
    });

    // Normalize distribution
    Object.keys(distribution).forEach(key => {
      distribution[key] = distribution[key] / emotions.length;
    });

    // Find dominant emotion
    const dominant = Object.keys(distribution).reduce((a, b) =>
      distribution[a] > distribution[b] ? a : b
    );

    return {
      dominant,
      average_confidence: totalConfidence / emotions.length,
      distribution
    };
  }

  isModelReady(): boolean {
    return this.isModelLoaded;
  }

  // Get camera permissions status
  async checkCameraPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  }
}

export const emotionDetectionService = new EmotionDetectionService();
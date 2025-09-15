import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmotionResult } from '../../types';
import { emotionDetectionService } from '../../services/emotion';
import { Camera, CameraOff, Eye, EyeOff } from 'lucide-react';

interface EmotionMonitorProps {
  onEmotionDetected?: (emotion: EmotionResult) => void;
  isGameActive?: boolean;
  studentName?: string;
}

export const EmotionMonitor: React.FC<EmotionMonitorProps> = ({
  onEmotionDetected,
  isGameActive = false,
  studentName = 'Öğrenci'
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState<EmotionResult[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const monitoringIntervalRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initializeEmotionDetection();
    return () => {
      stopMonitoring();
    };
  }, []);

  useEffect(() => {
    if (isGameActive && !isActive) {
      startMonitoring();
    } else if (!isGameActive && isActive) {
      stopMonitoring();
    }
  }, [isGameActive]);

  const initializeEmotionDetection = async () => {
    try {
      await emotionDetectionService.loadModel();
      setIsModelLoaded(true);
    } catch (error) {
      console.error('Error initializing emotion detection:', error);
      setIsModelLoaded(false);
    }
  };

  const startMonitoring = async () => {
    try {
      setCameraError(null);

      const hasPermission = await emotionDetectionService.checkCameraPermission();
      if (!hasPermission) {
        setCameraError('Kamera izni gerekli. Lütfen tarayıcı ayarlarından kamera erişimine izin verin.');
        return;
      }

      const videoElement = await emotionDetectionService.startCamera();
      if (!videoElement) {
        setCameraError('Kamera erişimi sağlanamadı.');
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = videoElement.srcObject;
      }

      setIsActive(true);

      // Start emotion monitoring
      monitoringIntervalRef.current = emotionDetectionService.startEmotionMonitoring(
        videoElement,
        handleEmotionDetected,
        3000 // Check every 3 seconds
      );

    } catch (error) {
      console.error('Error starting emotion monitoring:', error);
      setCameraError('Duygu tanıma başlatılırken hata oluştu.');
    }
  };

  const stopMonitoring = () => {
    setIsActive(false);
    emotionDetectionService.stopCamera();

    if (monitoringIntervalRef.current) {
      monitoringIntervalRef.current();
      monitoringIntervalRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraError(null);
  };

  const handleEmotionDetected = (emotion: EmotionResult) => {
    setCurrentEmotion(emotion);
    setEmotionHistory(prev => [...prev.slice(-9), emotion]); // Keep last 10 emotions

    onEmotionDetected?.(emotion);
  };

  const getEmotionColor = (emotion: string) => {
    const colors = {
      happy: 'text-green-600 bg-green-50',
      sad: 'text-blue-600 bg-blue-50',
      angry: 'text-red-600 bg-red-50',
      neutral: 'text-gray-600 bg-gray-50',
      focused: 'text-purple-600 bg-purple-50',
      confused: 'text-yellow-600 bg-yellow-50'
    };
    return colors[emotion as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      neutral: '😐',
      focused: '🧐',
      confused: '😕'
    };
    return emojis[emotion as keyof typeof emojis] || '😐';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2 text-primary" />
            Duygu Analizi
          </CardTitle>
          {!isGameActive && (
            <Button
              onClick={isActive ? stopMonitoring : startMonitoring}
              variant={isActive ? 'danger' : 'primary'}
              size="sm"
            >
              {isActive ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Durdur
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Başlat
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isModelLoaded && (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">AI model yükleniyor...</p>
          </div>
        )}

        {cameraError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 text-sm">{cameraError}</p>
          </div>
        )}

        {isActive && (
          <div className="space-y-4">
            {/* Video Preview (Hidden in production, visible for debugging) */}
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-32 bg-gray-200 rounded-lg object-cover"
                autoPlay
                muted
                playsInline
                style={{ transform: 'scaleX(-1)' }} // Mirror effect
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ display: 'none' }}
              />
            </div>

            {/* Current Emotion Display */}
            {currentEmotion && (
              <div className={`p-4 rounded-lg ${getEmotionColor(currentEmotion.emotion)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getEmotionEmoji(currentEmotion.emotion)}</span>
                    <div>
                      <div className="font-medium capitalize">
                        {currentEmotion.emotion}
                      </div>
                      <div className={`text-sm ${getConfidenceColor(currentEmotion.confidence)}`}>
                        Güven: %{Math.round(currentEmotion.confidence * 100)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(currentEmotion.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}

            {/* Emotion History */}
            {emotionHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Son Duygular
                </h4>
                <div className="flex space-x-1">
                  {emotionHistory.slice(-8).map((emotion, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getEmotionColor(emotion.emotion)}`}
                      title={`${emotion.emotion} (%${Math.round(emotion.confidence * 100)})`}
                    >
                      {getEmotionEmoji(emotion.emotion)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Indicator */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Aktif izleniyor</span>
              </div>
              <div className="text-gray-500">
                {studentName} için
              </div>
            </div>
          </div>
        )}

        {!isActive && !cameraError && isModelLoaded && (
          <div className="text-center py-8">
            <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Duygu analizi kapalı</p>
            <p className="text-sm text-gray-500">
              Öğrenci oyun oynarken duygusal durumu takip edilecek
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
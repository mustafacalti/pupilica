import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { GameQuestion, EmotionResult } from '../../types';
import { huggingFaceService } from '../../services/huggingface';
import { adaptiveQuestionGenerator } from '../../services/adaptiveQuestionGenerator';
import { performanceTracker } from '../../services/performanceTracker';
import { Clock, RotateCcw, Mic, MicOff, Star, Brain } from 'lucide-react';

interface NumberGameProps {
  studentId: string;
  studentAge?: number;
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
  useAdaptiveAI?: boolean;
}

export const NumberGame: React.FC<NumberGameProps> = ({
  studentId,
  studentAge = 6,
  onGameComplete,
  onEmotionDetected,
  useAdaptiveAI = true
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'answered' | 'completed'>('loading');
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [gameStartTime] = useState(Date.now());
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [adaptiveInsight, setAdaptiveInsight] = useState<string>('');

  const totalQuestions = 5;

  const generateQuestion = useCallback(async () => {
    setGameState('loading');
    setIsAIGenerating(true);

    try {
      let question: GameQuestion;

      if (useAdaptiveAI) {
        // Use AI-powered adaptive question generation
        const currentEmotion = emotions.length > 0 ? emotions[emotions.length - 1] : undefined;
        question = await adaptiveQuestionGenerator.generateQuestionWithContext(
          studentId,
          'number',
          studentAge,
          currentEmotion
        );

        // Get performance insights
        const insights = performanceTracker.getInsights(studentId);
        if (insights.length > 0) {
          setAdaptiveInsight(insights[0]);
        }
      } else {
        // Use traditional question generation
        question = await huggingFaceService.generateNumberQuestion({ min: 1, max: 10 }, studentAge);
      }

      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setTimeLeft(60);
      setGameState('playing');
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback to traditional generation
      const fallbackQuestion = await huggingFaceService.generateNumberQuestion({ min: 1, max: 10 }, studentAge);
      setCurrentQuestion(fallbackQuestion);
      setSelectedAnswer(null);
      setTimeLeft(60);
      setGameState('playing');
    } finally {
      setIsAIGenerating(false);
    }
  }, [studentId, studentAge, useAdaptiveAI, emotions]);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeUp();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);

  const handleTimeUp = () => {
    setSelectedAnswer(-1);
    setGameState('answered');
    const emotion: EmotionResult = {
      emotion: 'confused',
      confidence: 0.8,
      timestamp: new Date()
    };
    setEmotions(prev => [...prev, emotion]);
    onEmotionDetected?.(emotion);

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (gameState !== 'playing') return;

    setSelectedAnswer(answerIndex);
    setGameState('answered');

    const isCorrect = answerIndex === currentQuestion?.correctAnswer;

    if (isCorrect) {
      setScore(score + 1);
      const emotion: EmotionResult = {
        emotion: 'happy',
        confidence: 0.9,
        timestamp: new Date()
      };
      setEmotions(prev => [...prev, emotion]);
      onEmotionDetected?.(emotion);
    } else {
      const emotion: EmotionResult = {
        emotion: 'sad',
        confidence: 0.7,
        timestamp: new Date()
      };
      setEmotions(prev => [...prev, emotion]);
      onEmotionDetected?.(emotion);
    }

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tarayıcınız ses tanımayı desteklemiyor');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);

    const recognition = new ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition)();
    recognition.lang = 'tr-TR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      const number = parseInt(result);

      if (!isNaN(number) && currentQuestion) {
        const answerIndex = currentQuestion.options.findIndex(option => parseInt(option) === number);
        if (answerIndex !== -1) {
          handleAnswerSelect(answerIndex);
        }
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const nextQuestion = () => {
    if (questionNumber >= totalQuestions) {
      completeGame();
    } else {
      setQuestionNumber(questionNumber + 1);
      generateQuestion();
    }
  };

  const completeGame = () => {
    setGameState('completed');
    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);

    // Record performance data for adaptive AI
    if (useAdaptiveAI) {
      performanceTracker.recordGameResult(
        studentId,
        score,
        totalQuestions,
        gameDuration,
        'number',
        emotions
      );
    }

    onGameComplete(score, gameDuration, emotions);
  };

  const restartGame = () => {
    setScore(0);
    setQuestionNumber(1);
    setEmotions([]);
    setAdaptiveInsight('');
    // Initialize player performance for new game
    if (useAdaptiveAI) {
      performanceTracker.initializePlayer(studentId, studentAge);
    }
    generateQuestion();
  };

  if (gameState === 'completed') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Star className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sayı Oyunu Tamamlandı!</h2>
            <p className="text-gray-600">Matematik becerilerin gelişiyor!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {score}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Doğru Sayı</div>
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

  if (gameState === 'loading' || !currentQuestion) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          {isAIGenerating && useAdaptiveAI ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Brain className="h-5 w-5 text-green-600" />
                <p className="text-gray-600">AI sayı sorusu üretiyor...</p>
              </div>
              <p className="text-sm text-gray-500">Performansına göre uyarlanıyor</p>
            </div>
          ) : (
            <p className="text-gray-600">Sayı sorusu hazırlanıyor...</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const renderObjects = () => {
    if (!currentQuestion) return null;

    const correctAnswer = parseInt(currentQuestion.options[currentQuestion.correctAnswer]);
    const objects = '🐶'.repeat(correctAnswer);

    return (
      <div className="text-6xl mb-6 leading-relaxed">
        {objects}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Game Header */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Soru {questionNumber}/{totalQuestions}
              </div>
              <div className="text-sm font-medium text-gray-800">
                Skor: {score}
              </div>
              {useAdaptiveAI && currentQuestion?.difficulty && (
                <div className={`text-xs px-2 py-1 rounded-full ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentQuestion.difficulty === 'easy' ? 'Kolay' :
                   currentQuestion.difficulty === 'medium' ? 'Orta' : 'Zor'}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {useAdaptiveAI && (
                <div title="AI Powered">
                  <Brain className="h-4 w-4 text-green-600" />
                </div>
              )}
              <Clock className="h-4 w-4 text-gray-600" />
              <span className={`font-medium ${timeLeft <= 15 ? 'text-red-600' : 'text-gray-800'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Adaptive Insight */}
          {useAdaptiveAI && adaptiveInsight && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">{adaptiveInsight}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

          {/* Objects Display */}
          <div className="mb-8">
            {renderObjects()}
          </div>

          {/* Voice Input Button */}
          <div className="mb-6">
            <Button
              onClick={toggleVoiceInput}
              variant={isListening ? 'danger' : 'secondary'}
              size="lg"
              className="mb-4"
            >
              {isListening ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
              {isListening ? 'Dinlemeyi Durdur' : 'Sesli Cevap Ver'}
            </Button>
            {isListening && (
              <p className="text-sm text-gray-600">Cevabınızı söyleyin...</p>
            )}
          </div>

          {/* Number Options */}
          <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'h-16 text-xl font-bold hover:scale-105 transition-transform';

              if (gameState === 'answered') {
                if (index === currentQuestion.correctAnswer) {
                  buttonClass += ' bg-green-100 border-green-500 text-green-700';
                } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                  buttonClass += ' bg-red-100 border-red-500 text-red-700';
                } else {
                  buttonClass += ' opacity-50';
                }
              }

              return (
                <button
                  key={index}
                  className={`border-2 border-gray-300 rounded-lg ${buttonClass}`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={gameState !== 'playing'}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { GameQuestion, EmotionResult } from '../../types';
import { huggingFaceService } from '../../services/huggingface';
import { Clock, RotateCcw, Star, Palette } from 'lucide-react';

interface ColorGameProps {
  studentId: string;
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

export const ColorGame: React.FC<ColorGameProps> = ({
  studentId,
  onGameComplete,
  onEmotionDetected
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'answered' | 'completed'>('loading');
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const [gameStartTime] = useState(Date.now());

  const totalQuestions = 5;

  const generateQuestion = useCallback(async () => {
    setGameState('loading');
    try {
      const question = await huggingFaceService.generateColorQuestion();
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setTimeLeft(30);
      setGameState('playing');
    } catch (error) {
      console.error('Error generating question:', error);
    }
  }, []);

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
    onGameComplete(score, gameDuration, emotions);
  };

  const restartGame = () => {
    setScore(0);
    setQuestionNumber(1);
    setEmotions([]);
    generateQuestion();
  };

  if (gameState === 'completed') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Palette className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Renk Oyunu Tamamlandı!</h2>
            <p className="text-gray-600">Renkler konusunda çok başarılısın!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {score}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Doğru Renk</div>
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
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Renk sorusu hazırlanıyor...</p>
        </CardContent>
      </Card>
    );
  }

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
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className={`font-medium ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-800'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            {currentQuestion.question}
          </h2>

          {/* Color Options */}
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'w-24 h-24 text-6xl hover:scale-110 transition-transform rounded-full border-4';

              if (gameState === 'answered') {
                if (index === currentQuestion.correctAnswer) {
                  buttonClass += ' border-green-500 shadow-lg shadow-green-200';
                } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                  buttonClass += ' border-red-500 shadow-lg shadow-red-200';
                } else {
                  buttonClass += ' opacity-50 border-gray-300';
                }
              } else {
                buttonClass += ' border-gray-300 hover:border-gray-400';
              }

              return (
                <button
                  key={index}
                  className={buttonClass}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={gameState !== 'playing'}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {gameState === 'answered' && (
            <div className="mt-8">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <Star className="h-6 w-6" />
                  <p className="text-lg font-medium">Harika! Doğru renk! 🌈</p>
                </div>
              ) : (
                <p className="text-lg font-medium text-red-600">
                  Yanlış renk. Tekrar deneyelim! 🎨
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
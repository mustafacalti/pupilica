import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { GameQuestion, EmotionResult } from '../../types';
import { huggingFaceService } from '../../services/huggingface';
import { Clock, RotateCcw, Volume2, CheckCircle, XCircle, Star } from 'lucide-react';

interface WordImageGameProps {
  studentId: string;
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

export const WordImageGame: React.FC<WordImageGameProps> = ({
  studentId,
  onGameComplete,
  onEmotionDetected
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'answered' | 'completed'>('loading');
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [gameStartTime] = useState(Date.now());

  const totalQuestions = 5;

  const generateQuestion = useCallback(async () => {
    setGameState('loading');
    try {
      const question = await huggingFaceService.generateWordImageQuestion('animals', 'easy', 6);
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setTimeLeft(45);
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
    setFeedback('Süre doldu! Bir sonraki soruya geçelim.');
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
      setFeedback('Harika! Doğru cevap! 🎉');

      const emotion: EmotionResult = {
        emotion: 'happy',
        confidence: 0.9,
        timestamp: new Date()
      };
      setEmotions(prev => [...prev, emotion]);
      onEmotionDetected?.(emotion);
    } else {
      setFeedback('Yanlış cevap. Bir dahaki sefere! 😊');

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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const getScoreColor = () => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage === 100) return 'Mükemmel! 🏆';
    if (percentage >= 80) return 'Harika! 🌟';
    if (percentage >= 60) return 'İyi! 👏';
    return 'Daha çok pratik yapalım! 💪';
  };

  if (gameState === 'completed') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Star className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oyun Tamamlandı!</h2>
            <p className="text-gray-600">Harika bir performans sergiledi!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor()}`}>
                  {score}/{totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Doğru Cevap</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  %{Math.round((score / totalQuestions) * 100)}
                </div>
                <div className="text-sm text-gray-600">Başarı Oranı</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">
                  {emotions.length}
                </div>
                <div className="text-sm text-gray-600">Duygusal Tepki</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-lg font-medium text-gray-800">{getScoreMessage()}</p>
          </div>

          <Button onClick={restartGame} size="lg" className="mr-4">
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
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yeni soru hazırlanıyor...</p>
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
                Skor: {score}/{questionNumber - 1}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className={`font-medium ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-800'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent className="text-center py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => speakText(currentQuestion.question)}
              className="mb-4"
            >
              <Volume2 className="h-5 w-5 mr-2" />
              Soruyu Dinle
            </Button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'h-24 text-4xl hover:scale-105 transition-transform';

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

          {/* Feedback */}
          {gameState === 'answered' && feedback && (
            <div className="mt-6 flex items-center justify-center space-x-2">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <p className="text-lg font-medium text-gray-800">{feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
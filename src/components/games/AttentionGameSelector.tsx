import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmotionResult } from '../../types';
import { AttentionClickGame } from './AttentionClickGame';
import { AttentionCountGame } from './AttentionCountGame';
import { AttentionDynamicGame } from './AttentionDynamicGame';
import {
  Target,
  Hash,
  Zap,
  Brain,
  ArrowLeft,
  Star,
  Clock,
  MousePointer
} from 'lucide-react';

interface AttentionGameSelectorProps {
  studentId: string;
  studentAge?: number;
  onGameComplete: (score: number, duration: number, emotions: EmotionResult[]) => void;
  onEmotionDetected?: (emotion: EmotionResult) => void;
}

type GameType = 'click' | 'count' | 'dynamic';
type DifficultyLevel = 'kolay' | 'orta' | 'zor';

interface GameInfo {
  id: GameType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  features: string[];
}

export const AttentionGameSelector: React.FC<AttentionGameSelectorProps> = ({
  studentId,
  studentAge = 12,
  onGameComplete,
  onEmotionDetected
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('orta');
  const [gameStarted, setGameStarted] = useState(false);

  const gameTypes: GameInfo[] = [
    {
      id: 'click',
      name: 'Dikkat Tıklama',
      description: 'Hızlı reaksiyon gerektiren tek hedef tıklama oyunu',
      icon: <MousePointer className="h-8 w-8" />,
      color: 'blue',
      bgGradient: 'from-blue-500 to-purple-500',
      features: [
        'Tek hedef odaklanma',
        'Hızlı reaksiyon geliştirme',
        'Dikkat dağıtıcılarla mücadele',
        'Zamanlama becerileri'
      ]
    },
    {
      id: 'count',
      name: 'Dikkat Sayma',
      description: 'Beliren objeleri sayarak konsantrasyon geliştirme',
      icon: <Hash className="h-8 w-8" />,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500',
      features: [
        'Sayısal dikkat',
        'Görsel takip',
        'Konsantrasyon geliştirme',
        'Bellek destekleme'
      ]
    },
    {
      id: 'dynamic',
      name: 'Dinamik Dikkat',
      description: 'Sürekli çıkan hedefleri hızla yakalama',
      icon: <Zap className="h-8 w-8" />,
      color: 'purple',
      bgGradient: 'from-purple-500 to-pink-500',
      features: [
        'Çoklu hedef takibi',
        'Hızlı karar verme',
        'Reflexleri geliştirme',
        'Sürekli dikkat'
      ]
    }
  ];

  const difficultyLevels = [
    {
      id: 'kolay' as DifficultyLevel,
      name: 'Kolay',
      description: 'Yeni başlayanlar için',
      color: 'green',
      features: ['Az dikkat dağıtıcı', 'Uzun süre limiti', 'Basit hedefler']
    },
    {
      id: 'orta' as DifficultyLevel,
      name: 'Orta',
      description: 'Deneyimliler için',
      color: 'yellow',
      features: ['Orta dikkat dağıtıcı', 'Normal süre', 'Karmaşık hedefler']
    },
    {
      id: 'zor' as DifficultyLevel,
      name: 'Zor',
      description: 'Uzmanlar için',
      color: 'red',
      features: ['Çok dikkat dağıtıcı', 'Kısa süre', 'Karışık hedefler']
    }
  ];

  const handleGameSelect = (gameType: GameType) => {
    console.log('🎮 [DEBUG] Game selected:', gameType);
    setSelectedGame(gameType);
  };

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    console.log('🎯 [DEBUG] Difficulty selected:', difficulty);
    setSelectedDifficulty(difficulty);
    console.log('🎯 [DEBUG] Selected difficulty updated to:', difficulty);
  };

  const handleStartGame = () => {
    console.log('🎮 [DEBUG] Starting game:', selectedGame, 'difficulty:', selectedDifficulty);
    setGameStarted(true);
  };

  const handleBackToSelector = () => {
    setSelectedGame(null);
    setSelectedDifficulty('orta');
    setGameStarted(false);
  };

  const handleGameCompleteWithReturn = (score: number, duration: number, emotions: EmotionResult[]) => {
    onGameComplete(score, duration, emotions);
    setGameStarted(false);
  };

  // Eğer oyun başladıysa, seçilen oyunu render et
  if (gameStarted && selectedGame) {
    console.log('🚀 [DEBUG] Rendering game:', selectedGame, 'with props:', {
      studentId,
      studentAge,
      difficulty: selectedDifficulty
    });

    const commonProps = {
      studentId,
      studentAge,
      difficulty: selectedDifficulty,
      onGameComplete: handleGameCompleteWithReturn,
      onEmotionDetected
    };

    try {
      switch (selectedGame) {
        case 'click':
          console.log('🎯 [DEBUG] Loading AttentionClickGame');
          return <AttentionClickGame {...commonProps} />;
        case 'count':
          console.log('🔢 [DEBUG] Loading AttentionCountGame');
          return <AttentionCountGame {...commonProps} />;
        case 'dynamic':
          console.log('⚡ [DEBUG] Loading AttentionDynamicGame');
          return <AttentionDynamicGame {...commonProps} />;
        default:
          console.error('❌ [DEBUG] Unknown game type:', selectedGame);
          return null;
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error rendering game:', error);
      return (
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Oyun Yüklenirken Hata Oluştu</h2>
          <p className="text-gray-600 mb-4">Hata: {error.message}</p>
          <Button onClick={handleBackToSelector}>
            Geri Dön
          </Button>
        </div>
      );
    }
  }

  // Zorluk seçimi ekranı
  if (selectedGame) {
    const gameInfo = gameTypes.find(g => g.id === selectedGame)!;
    console.log('🎯 [DEBUG] Zorluk seçim ekranı açıldı. Oyun:', selectedGame, 'Mevcut zorluk:', selectedDifficulty);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelector}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
              </Button>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${gameInfo.bgGradient} flex items-center justify-center text-white`}>
                  {gameInfo.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{gameInfo.name}</h2>
                  <p className="text-sm text-gray-600">Zorluk seviyesi seç</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-purple-600">Adaptif AI</span>
            </div>
          </CardContent>
        </Card>

        {/* Zorluk Seçimi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {difficultyLevels.map((level) => (
            <Card
              key={level.id}
              className={`
                cursor-pointer transition-all duration-200 hover:scale-105 pointer-events-auto
                ${selectedDifficulty === level.id
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ [DEBUG] Card clicked for difficulty:', level.id, 'Game:', selectedGame);
                handleDifficultySelect(level.id);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                console.log('🖱️ [DEBUG] MouseDown for difficulty:', level.id);
                handleDifficultySelect(level.id);
              }}
              style={{ zIndex: 1 }}
            >
              <CardContent className="text-center py-8 pointer-events-none">
                <div className="mb-4">
                  <div className={`
                    w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold
                    ${level.color === 'green' ? 'bg-green-100 text-green-600' :
                      level.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }
                  `}>
                    {level.id === 'kolay' ? '1' : level.id === 'orta' ? '2' : '3'}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">{level.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{level.description}</p>

                <div className="space-y-2">
                  {level.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-center space-x-2 text-sm text-gray-700">
                      <Star className="h-3 w-3 text-gray-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {selectedDifficulty === level.id && (
                  <div className="mt-4">
                    <div className="w-6 h-6 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pointer-events-auto">
                  <button
                    className="w-full py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔘 [DEBUG] Button clicked for difficulty:', level.id);
                      handleDifficultySelect(level.id);
                    }}
                  >
                    {selectedDifficulty === level.id ? '✓ Seçili' : 'Seç'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Başlat Butonu */}
        <div className="text-center">
          <Button
            onClick={handleStartGame}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3"
          >
            <Target className="h-5 w-5 mr-2" />
            {gameInfo.name} - {difficultyLevels.find(d => d.id === selectedDifficulty)?.name} Başlat
          </Button>
        </div>
      </div>
    );
  }

  // Ana oyun seçim ekranı
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="text-center py-8">
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Brain className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dikkat Oyunları</h1>
          <p className="text-gray-600 text-lg">
            Dikkat dağınıklığıyla başa çıkmak için özel olarak tasarlanmış oyunlar
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-purple-600">
            <Clock className="h-4 w-4" />
            <span>AI destekli adaptif zorluk sistemi</span>
          </div>
        </CardContent>
      </Card>

      {/* Oyun Türleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gameTypes.map((game) => (
          <Card
            key={game.id}
            className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
            onClick={() => handleGameSelect(game.id)}
          >
            <CardContent className="text-center py-8">
              <div className="mb-6">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${game.bgGradient} flex items-center justify-center text-white`}>
                  {game.icon}
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-3">{game.name}</h3>
              <p className="text-gray-600 text-sm mb-6">{game.description}</p>

              <div className="space-y-3">
                {game.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                    <div className={`w-2 h-2 rounded-full ${
                      game.color === 'blue' ? 'bg-blue-400' :
                      game.color === 'green' ? 'bg-green-400' :
                      'bg-purple-400'
                    }`}></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => handleGameSelect(game.id)}
                  className={`w-full ${
                    game.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                    game.color === 'green' ? 'bg-green-500 hover:bg-green-600' :
                    'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                >
                  Oyna
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bilgi kartı */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="py-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Destekli Adaptif Sistem</h3>
              <p className="text-gray-700 text-sm">
                Her oyun, performansına göre otomatik olarak zorluk seviyesini ayarlar.
                Başarı oranına, reaksiyon süresine ve odaklanma durumuna göre
                kişiselleştirilmiş görevler üretir. Bu sayede her zaman en uygun
                zorluk seviyesinde oynayarak dikkat becerilerini geliştirebilirsin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
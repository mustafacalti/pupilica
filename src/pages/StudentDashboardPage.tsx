import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AttentionClickGame } from '../components/games/AttentionClickGame';
import { AttentionCountGame } from '../components/games/AttentionCountGame';
import { AttentionDynamicGame } from '../components/games/AttentionDynamicGame';
import { ConflictGame } from '../components/games/ConflictGame';
import { ColorRecognitionGame } from '../components/games/ColorRecognitionGame';
import { StoryAttentionGame } from '../components/games/StoryAttentionGame';
import { Brain, MousePointer, Hash, Zap, Palette, Camera, LogOut, User, Trophy, Clock, Sparkles } from 'lucide-react';

type GameType = 'attention-click' | 'attention-count' | 'attention-dynamic' | 'conflict' | 'color-recognition' | 'story-attention' | null;

export const StudentDashboardPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [selectedGame, setSelectedGame] = useState<GameType>(null);
  const [stats] = useState({
    gamesPlayed: 12,
    totalScore: 850,
    averageScore: 71,
    timeSpent: 145 // dakika
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };

  const handleGameComplete = (score?: number, duration?: number, emotions?: any[]) => {
    setSelectedGame(null);
    // İsteğe bağlı: Oyun sonuç verilerini kaydet
    if (score !== undefined) {
      console.log('Oyun tamamlandı:', { score, duration, emotions });
    }
  };

  const renderGame = () => {
    if (!currentUser?.id) return null;

    switch (selectedGame) {
      case 'attention-click':
        return <AttentionClickGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 12}
          difficulty="orta"
          onGameComplete={handleGameComplete}
        />;
      case 'attention-count':
        return <AttentionCountGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 12}
          difficulty="orta"
          onGameComplete={handleGameComplete}
        />;
      case 'attention-dynamic':
        return <AttentionDynamicGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 12}
          difficulty="orta"
          onGameComplete={handleGameComplete}
        />;
      case 'conflict':
        return <ConflictGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 12}
          difficulty="orta"
          onGameComplete={handleGameComplete}
        />;
      case 'color-recognition':
        return <ColorRecognitionGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 12}
          onGameComplete={handleGameComplete}
        />;
      case 'story-attention':
        return <StoryAttentionGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 8}
          onGameComplete={handleGameComplete}
        />;
      default:
        return null;
    }
  };

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedGame(null)}
            className="mb-4 bg-white text-gray-700 px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            ← Geri Dön
          </button>
          {renderGame()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">NeuroLearn AI</h1>
                <p className="text-sm text-gray-600">Öğrenci Paneli</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">{currentUser?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Hoş Geldin, {currentUser?.name}! 🌟
          </h2>
          <p className="text-gray-600 text-lg">
            Hangi oyunu oynamak istiyorsun?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Oynanan Oyun</p>
                <p className="text-2xl font-bold text-primary">{stats.gamesPlayed}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Puan</p>
                <p className="text-2xl font-bold text-success">{stats.totalScore}</p>
              </div>
              <Trophy className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Puan</p>
                <p className="text-2xl font-bold text-warning">{stats.averageScore}</p>
              </div>
              <Trophy className="h-8 w-8 text-warning" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Geçirilen Süre</p>
                <p className="text-2xl font-bold text-purple-600">{stats.timeSpent}dk</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Attention Click Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
              <MousePointer className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Dikkat Tıklama</h3>
              <p className="text-blue-100">
                Hızlı reaksiyon gerektiren tek hedef tıklama oyunu
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Özellik</span>
                  <span>Tek Hedef</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Tek hedef odaklanma • Hızlı reaksiyon • Dikkat dağıtıcılar
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('attention-click')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Oyunu Başlat
              </button>
            </div>
          </div>

          {/* Attention Count Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
              <Hash className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Dikkat Sayma</h3>
              <p className="text-green-100">
                Beliren objeleri sayarak konsantrasyon geliştirme
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Özellik</span>
                  <span>Sayısal Dikkat</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Sayısal dikkat • Görsel takip • Konsantrasyon • Bellek
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('attention-count')}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Oyunu Başlat
              </button>
            </div>
          </div>

          {/* Attention Dynamic Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <Zap className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Dinamik Dikkat</h3>
              <p className="text-purple-100">
                Sürekli çıkan hedefleri hızla yakalama
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Özellik</span>
                  <span>Çoklu Hedef</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Çoklu hedef takibi • Hızlı karar • Refleks • Sürekli dikkat
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('attention-dynamic')}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Oyunu Başlat
              </button>
            </div>
          </div>

          {/* Conflict Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <Palette className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Çatışma Oyunu</h3>
              <p className="text-red-100">
                Stroop etkisi ile dikkat geliştirme
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Özellik</span>
                  <span>Stroop Etkisi</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Stroop etkisi • Renk-kelime çatışması • Bilişsel esneklik
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('conflict')}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Oyunu Başlat
              </button>
            </div>
          </div>

          {/* Color Recognition Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
              <Camera className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">AI Renk Tanıma</h3>
              <p className="text-indigo-100">
                AI seçtiği rengi kameraya gösterme oyunu
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Özellik</span>
                  <span>AI Destekli</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  AI renk seçimi • Gerçek zamanlı tanıma • Kamera etkileşimi
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('color-recognition')}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Oyunu Başlat
              </button>
            </div>
          </div>

          {/* Story Attention Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
              <Sparkles className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Hikaye Dikkat Oyunu</h3>
              <p className="text-pink-100">
                Ali'nin macerasında dikkat becerilerini test et
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Dikkat Türü</span>
                  <span>4 Boyut</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Seçici • Sürekli • Bölünmüş • Dürtü Kontrolü
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('story-attention')}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Hikayeyi Başlat
              </button>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-12 text-center bg-white rounded-lg p-8 shadow-sm">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Harika İş Çıkarıyorsun!</h3>
          <p className="text-gray-600">
            Her oyun oynayışında daha da iyi oluyorsun. Böyle devam et! 🌟
          </p>
        </div>
      </div>
    </div>
  );
};
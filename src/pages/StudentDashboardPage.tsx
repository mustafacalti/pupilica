import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { WordImageGame } from '../components/games/WordImageGame';
import { NumberGame } from '../components/games/NumberGame';
import { ColorGame } from '../components/games/ColorGame';
import { Brain, BookOpen, Hash, Palette, LogOut, User, Trophy, Clock } from 'lucide-react';

type GameType = 'word-image' | 'number' | 'color' | null;

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

  const handleGameComplete = () => {
    setSelectedGame(null);
  };

  const renderGame = () => {
    if (!currentUser?.id) return null;

    switch (selectedGame) {
      case 'word-image':
        return <WordImageGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 6}
          onGameComplete={handleGameComplete}
        />;
      case 'number':
        return <NumberGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 6}
          onGameComplete={handleGameComplete}
        />;
      case 'color':
        return <ColorGame
          studentId={currentUser.id}
          studentAge={currentUser.age || 6}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Word-Image Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <BookOpen className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Kelime-Resim Eşleştirme</h3>
              <p className="text-blue-100">
                Kelimeler ve resimler arasında bağlantı kur
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Son Puan</span>
                  <span>85/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('word-image')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Oyunu Başlat
              </button>
            </div>
          </div>

          {/* Number Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <Hash className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Sayı Öğrenme</h3>
              <p className="text-green-100">
                Sayıları sayarak matematik öğren
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Son Puan</span>
                  <span>72/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('number')}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Oyunu Başlat
              </button>
            </div>
          </div>

          {/* Color Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
              <Palette className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Renk Eşleştirme</h3>
              <p className="text-purple-100">
                Renkleri eşleştirerek öğren
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Son Puan</span>
                  <span>91/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '91%' }}></div>
                </div>
              </div>
              <button
                onClick={() => setSelectedGame('color')}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Oyunu Başlat
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
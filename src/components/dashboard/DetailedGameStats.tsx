import React, { useState } from 'react';
import { Activity } from '../../types';
import { mockActivities, gameTypeLabels, emotionLabels } from '../../data/mockData';
import { GameDetailModal } from './GameDetailModal';
import { TrendingUp, Clock, Target, Smile, Calendar, BarChart3, Eye } from 'lucide-react';

interface DetailedGameStatsProps {
  studentId: string;
  studentName: string;
}

export const DetailedGameStats: React.FC<DetailedGameStatsProps> = ({ studentId, studentName }) => {
  const [selectedGame, setSelectedGame] = useState<{ gameType: string; isOpen: boolean }>({
    gameType: '',
    isOpen: false
  });

  const studentActivities = mockActivities.filter(activity => activity.studentId === studentId);

  const openGameModal = (gameType: string) => {
    setSelectedGame({ gameType, isOpen: true });
  };

  const closeGameModal = () => {
    setSelectedGame({ gameType: '', isOpen: false });
  };

  if (studentActivities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          {studentName} - Oyun Detayları
        </h4>
        <p className="text-gray-600 text-center py-8">Henüz oyun verisi bulunmuyor</p>
      </div>
    );
  }

  // Oyun tiplerine göre grupla
  const gameTypeStats = studentActivities.reduce((acc, activity) => {
    const gameType = activity.gameType;
    if (!acc[gameType]) {
      acc[gameType] = {
        count: 0,
        totalScore: 0,
        totalDuration: 0,
        activities: []
      };
    }
    acc[gameType].count++;
    acc[gameType].totalScore += activity.score;
    acc[gameType].totalDuration += activity.duration;
    acc[gameType].activities.push(activity);
    return acc;
  }, {} as Record<string, { count: number; totalScore: number; totalDuration: number; activities: Activity[] }>);

  // En son aktivite
  const lastActivity = studentActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  // Genel istatistikler
  const totalGames = studentActivities.length;
  const averageScore = Math.round(studentActivities.reduce((sum, act) => sum + act.score, 0) / totalGames);
  const totalTime = Math.round(studentActivities.reduce((sum, act) => sum + act.duration, 0) / 60); // dakika

  // Duygu analizi
  const allEmotions = studentActivities.flatMap(act => act.emotions);
  const emotionCounts = allEmotions.reduce((acc, emotion) => {
    acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantEmotion = Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="space-y-6">
      {/* Genel Özet */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          {studentName} - Oyun İstatistikleri Özeti
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{totalGames}</div>
            <div className="text-sm text-gray-600">Toplam Oyun</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{averageScore}%</div>
            <div className="text-sm text-gray-600">Ortalama Başarı</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <Clock className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{totalTime}dk</div>
            <div className="text-sm text-gray-600">Toplam Süre</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <Smile className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl">{emotionLabels[dominantEmotion?.[0]]?.split(' ')[0] || '😐'}</div>
            <div className="text-sm text-gray-600">Genel Ruh Hali</div>
          </div>
        </div>
      </div>

      {/* Oyun Tiplerinin Detayı */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h5 className="font-semibold text-gray-800 mb-4">Oyun Türlerine Göre Performans</h5>

        <div className="space-y-4">
          {Object.entries(gameTypeStats).map(([gameType, stats]) => {
            const avgScore = Math.round(stats.totalScore / stats.count);
            const avgDuration = Math.round(stats.totalDuration / stats.count / 60); // dakika

            return (
              <div key={gameType} className="border border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h6 className="font-medium text-gray-800">
                    🎮 {gameTypeLabels[gameType] || gameType}
                  </h6>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{stats.count} oyun</span>
                    <button
                      onClick={() => openGameModal(gameType)}
                      className="flex items-center px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Detay
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{avgScore}%</div>
                    <div className="text-xs text-gray-600">Ortalama Başarı</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{avgDuration}dk</div>
                    <div className="text-xs text-gray-600">Ortalama Süre</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-purple-600">{stats.count}</div>
                    <div className="text-xs text-gray-600">Oynama Sayısı</div>
                  </div>
                </div>

                {/* Son 3 oyunun skorları */}
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">Son oyun skorları:</div>
                  <div className="flex space-x-2">
                    {stats.activities.slice(-3).map((activity, index) => (
                      <div key={index} className="flex-1">
                        <div
                          className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{ width: `${activity.score}%` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1">{activity.score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Son Aktivite Detayı */}
      {lastActivity && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Son Oyun Detayı
          </h5>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Oyun Türü</div>
                <div className="font-medium">{gameTypeLabels[lastActivity.gameType]}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tarih</div>
                <div className="font-medium">{lastActivity.createdAt.toLocaleDateString('tr-TR')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Başarı Oranı</div>
                <div className="font-medium text-green-600">{lastActivity.score}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Süre</div>
                <div className="font-medium">{Math.round(lastActivity.duration / 60)} dakika</div>
              </div>
            </div>

            {lastActivity.emotions.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Oyun sırasındaki duygular:</div>
                <div className="flex space-x-2">
                  {lastActivity.emotions.map((emotion, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {emotionLabels[emotion.emotion]} (%{Math.round(emotion.confidence * 100)})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Detail Modal */}
      <GameDetailModal
        isOpen={selectedGame.isOpen}
        onClose={closeGameModal}
        studentId={studentId}
        gameType={selectedGame.gameType}
        studentName={studentName}
      />
    </div>
  );
};
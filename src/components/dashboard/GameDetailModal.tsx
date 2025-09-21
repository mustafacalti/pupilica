import React from 'react';
import { Activity } from '../../types';
import { mockActivities, gameTypeLabels, emotionLabels } from '../../data/mockData';
import { X, Calendar, Clock, TrendingUp, Heart, Target, Star } from 'lucide-react';

interface GameDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  gameType: string;
  studentName: string;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  isOpen,
  onClose,
  studentId,
  gameType,
  studentName
}) => {
  if (!isOpen) return null;

  const gameActivities = mockActivities.filter(
    activity => activity.studentId === studentId && activity.gameType === gameType
  );

  if (gameActivities.length === 0) {
    return null;
  }

  // Oyun istatistikleri
  const totalGames = gameActivities.length;
  const averageScore = Math.round(gameActivities.reduce((sum, act) => sum + act.score, 0) / totalGames);
  const bestScore = Math.max(...gameActivities.map(act => act.score));
  const averageTime = Math.round(gameActivities.reduce((sum, act) => sum + act.duration, 0) / totalGames / 60);

  // İlerleme analizi
  const firstGame = gameActivities.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const lastGame = gameActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const improvement = lastGame.score - firstGame.score;

  // Duygu analizi
  const allEmotions = gameActivities.flatMap(act => act.emotions);
  const emotionCounts = allEmotions.reduce((acc, emotion) => {
    acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topEmotions = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Oyun açıklamaları
  const gameDescriptions: Record<string, string> = {
    'word-image': 'Kelimeler ve resimler arasında bağlantı kurma becerilerini geliştiren oyun. Görsel algı ve dil becerilerini güçlendirir.',
    'number': 'Sayısal kavramları öğrenme ve matematik becerilerini geliştirme oyunu. Sayı tanıma ve basit işlemler içerir.',
    'color': 'Renk algısı ve eşleştirme becerilerini geliştiren oyun. Görsel dikkat ve kategorize etme yeteneklerini artırır.',
    'attention-sprint': 'Dikkat süresi ve odaklanma becerilerini geliştiren hızlı tempolu oyun. Sürdürülebilir dikkat ve tepki hızını artırır.'
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{gameTypeLabels[gameType]}</h3>
              <p className="text-blue-100 mt-1">{studentName} - Oyun Detayları</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Oyun Açıklaması */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Bu Oyun Hakkında</h4>
            <p className="text-blue-700 text-sm">{gameDescriptions[gameType]}</p>
          </div>

          {/* Genel İstatistikler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">{totalGames}</div>
              <div className="text-sm text-green-600">Toplam Oyun</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">{averageScore}%</div>
              <div className="text-sm text-blue-600">Ortalama Başarı</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center border border-yellow-200">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-800">{bestScore}%</div>
              <div className="text-sm text-yellow-600">En İyi Skor</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-800">{averageTime}dk</div>
              <div className="text-sm text-purple-600">Ortalama Süre</div>
            </div>
          </div>

          {/* İlerleme Analizi */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              İlerleme Analizi
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-2">İlk Oyun vs Son Oyun</div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">{firstGame.score}%</div>
                    <div className="text-xs text-gray-500">İlk Skor</div>
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        improvement >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.abs(improvement) * 2}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">{lastGame.score}%</div>
                    <div className="text-xs text-gray-500">Son Skor</div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className={`text-sm font-medium ${
                    improvement >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {improvement >= 0 ? '+' : ''}{improvement} puan değişim
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">En Çok Hissedilen Duygular</div>
                <div className="space-y-2">
                  {topEmotions.map(([emotion, count], index) => (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className="text-sm">
                        {emotionLabels[emotion]}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                            style={{ width: `${(count / allEmotions.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Oyun Geçmişi */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Son Oyunlar ({gameActivities.length})
            </h4>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {gameActivities
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {activity.createdAt.toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round(activity.duration / 60)} dakika
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`font-semibold ${
                        activity.score >= 80 ? 'text-green-600' :
                        activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {activity.score}%
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      {activity.emotions.slice(0, 2).map((emotion, emotionIndex) => (
                        <span key={emotionIndex} className="text-lg">
                          {emotionLabels[emotion.emotion]?.split(' ')[0] || '😐'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Oyun Önerileri */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              AI Önerileri
            </h4>
            <div className="text-sm text-green-700">
              {averageScore >= 80 ? (
                <p>Mükemmel performans! Bu oyun türünde zorluğu artırarak daha karmaşık senaryolar denenebilir.</p>
              ) : averageScore >= 60 ? (
                <p>İyi ilerleme kaydediliyor. Düzenli pratik ile başarı daha da artacaktır.</p>
              ) : (
                <p>Bu oyun türünde daha fazla pratik yaparak temel becerileri güçlendirmek faydalı olacaktır.</p>
              )}

              {improvement > 10 && (
                <p className="mt-2 font-medium">🎉 Son zamanlarda bu oyunda harika bir gelişim gösteriyor!</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
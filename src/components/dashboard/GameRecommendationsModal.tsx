import React from 'react';
import { X, Target, Trophy, Clock, Zap } from 'lucide-react';

interface GameRecommendation {
  id: string;
  name: string;
  description: string;
  reason: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  duration: string;
  focus: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface GameRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
}

export const GameRecommendationsModal: React.FC<GameRecommendationsModalProps> = ({
  isOpen,
  onClose,
  studentName
}) => {
  if (!isOpen) return null;

  // Dikkat verilerine göre oyun önerileri oluştur
  const getGameRecommendations = (): GameRecommendation[] => {
    // Simüle edilmiş performans verileri (gerçek uygulamada API'den gelecek)
    const mockPerformance = {
      averageScore: 78,
      attentionSpan: 12, // dakika
      weakAreas: ['impulse-control', 'sustained-attention'],
      strongAreas: ['selective-attention'],
      recentGames: ['count', 'dynamic']
    };

    const recommendations: GameRecommendation[] = [];

    // Düşük dikkat süresi için öneri
    if (mockPerformance.attentionSpan < 15) {
      recommendations.push({
        id: 'attention-builder',
        name: 'Dikkat Geliştirici',
        description: 'Kademeli olarak dikkat süresini artıran özel egzersizler',
        reason: 'Dikkat süreniz ortalama 12 dakika, hedef 20+ dakika',
        difficulty: 'Orta',
        duration: '8-12 dk',
        focus: 'Sürdürülebilir Dikkat',
        icon: Clock,
        color: 'bg-blue-500'
      });
    }

    // Dürtü kontrolü zayıfsa
    if (mockPerformance.weakAreas.includes('impulse-control')) {
      recommendations.push({
        id: 'impulse-control',
        name: 'Çatışma Oyunu+',
        description: 'Dürtü kontrolünü geliştiren gelişmiş çatışma senaryoları',
        reason: 'Dürtü kontrolü alanında gelişim fırsatı tespit edildi',
        difficulty: 'Orta',
        duration: '10-15 dk',
        focus: 'Dürtü Kontrolü',
        icon: Target,
        color: 'bg-orange-500'
      });
    }

    // Başarı oranı düşükse
    if (mockPerformance.averageScore < 80) {
      recommendations.push({
        id: 'confidence-builder',
        name: 'Başarı Artırıcı',
        description: 'Özgüven artırıcı kolay başlangıçlı oyunlar',
        reason: 'Ortalama başarı %78, motivasyonu artırmak için',
        difficulty: 'Kolay',
        duration: '5-10 dk',
        focus: 'Özgüven Geliştirme',
        icon: Trophy,
        color: 'bg-green-500'
      });
    }

    // Sürdürülebilir dikkat zayıfsa
    if (mockPerformance.weakAreas.includes('sustained-attention')) {
      recommendations.push({
        id: 'sustained-focus',
        name: 'Uzun Süreli Odaklanma',
        description: 'Dikkat süresini geliştirici uzun aktiviteler',
        reason: 'Sürdürülebilir dikkat alanında güçlenme gerekli',
        difficulty: 'Zor',
        duration: '15-20 dk',
        focus: 'Sürdürülebilir Dikkat',
        icon: Zap,
        color: 'bg-purple-500'
      });
    }

    // En az 3 öneri göster
    if (recommendations.length < 3) {
      recommendations.push({
        id: 'balanced-training',
        name: 'Dengeli Antrenman',
        description: 'Tüm dikkat türlerini dengeli şekilde geliştiren oyun seti',
        reason: 'Genel performans artışı için öneriliyor',
        difficulty: 'Orta',
        duration: '12-18 dk',
        focus: 'Genel Gelişim',
        icon: Target,
        color: 'bg-indigo-500'
      });
    }

    return recommendations.slice(0, 4);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                🎯 {studentName ? `${studentName} için` : 'Size'} Özel Oyun Önerileri
              </h2>
              <p className="text-blue-100">Performans verileriniz analiz edilerek kişiselleştirilmiş öneriler hazırlandı</p>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Mevcut Performans Durumu</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">78%</div>
              <div className="text-sm text-gray-600">Ortalama Başarı</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">12 dk</div>
              <div className="text-sm text-gray-600">Dikkat Süresi</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">24</div>
              <div className="text-sm text-gray-600">Bu Hafta Oynanan</div>
            </div>
          </div>
        </div>

        {/* Game Recommendations */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Önerilen Oyunlar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getGameRecommendations().map((game) => {
              const IconComponent = game.icon;
              return (
                <div key={game.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className={`${game.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{game.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          game.difficulty === 'Kolay' ? 'bg-green-100 text-green-700' :
                          game.difficulty === 'Orta' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {game.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{game.description}</p>
                      <div className="bg-blue-50 p-3 rounded-lg mb-3">
                        <div className="text-xs text-blue-700 font-medium mb-1">Neden Öneriliyor:</div>
                        <div className="text-sm text-blue-800">{game.reason}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>⏱️ {game.duration}</span>
                          <span>🎯 {game.focus}</span>
                        </div>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">
                          Oyna
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t rounded-b-xl">
          <div className="text-sm text-gray-600 text-center">
            💡 <strong>İpucu:</strong> Oyunları düzenli oynamak dikkat becerilerinizi sürekli geliştirir.
            Günde 15-20 dakika yeterlidir.
          </div>
        </div>
      </div>
    </div>
  );
};
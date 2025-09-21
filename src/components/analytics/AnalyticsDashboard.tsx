import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Calendar, Target, Award, Zap } from 'lucide-react';
import { mockActivities, mockStudents, getEmotionAnalysis, calculateGameStats, getWeeklyProgress } from '../../data/mockData';

interface AnalyticsDashboardProps {
  students: Array<{ id: string; name: string }>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ students }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');

  // Filtered data based on selection
  const getFilteredActivities = () => {
    let activities = mockActivities;

    if (selectedStudent !== 'all') {
      activities = activities.filter(act => act.studentId === selectedStudent);
    }

    const now = new Date();
    if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      activities = activities.filter(act => act.createdAt >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      activities = activities.filter(act => act.createdAt >= monthAgo);
    }

    return activities;
  };

  const filteredActivities = getFilteredActivities();

  // Performance Trend Data (30 günlük)
  const getPerformanceTrend = () => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        score: Math.floor(Math.random() * 30) + 70, // 70-100 arası
        activities: Math.floor(Math.random() * 5) + 1 // 1-5 arası
      };
    });
    return days;
  };

  // Game Type Distribution
  const getGameTypeDistribution = () => {
    const gameTypes = filteredActivities.reduce((acc, activity) => {
      acc[activity.gameType] = (acc[activity.gameType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const gameTypeLabels: Record<string, string> = {
      'click': 'Dikkat Tıklama',
      'count': 'Dikkat Sayma',
      'dynamic': 'Dinamik Dikkat',
      'conflict': 'Çatışma Oyunu',
      'colorRecognition': 'AI Renk Tanıma'
    };

    return Object.entries(gameTypes).map(([type, count]) => ({
      name: gameTypeLabels[type] || type,
      value: count,
      percentage: Math.round((count / filteredActivities.length) * 100)
    }));
  };

  // Emotion Analysis Over Time
  const getEmotionTrend = () => {
    const emotions = ['happy', 'focused', 'neutral', 'confused', 'sad'];
    return emotions.map(emotion => ({
      emotion,
      data: Array.from({ length: 7 }, (_, i) => ({
        day: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i],
        value: Math.floor(Math.random() * 80) + 20
      }))
    }));
  };

  // Daily Activity Pattern
  const getDailyPattern = () => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      activities: Math.floor(Math.random() * 10),
      performance: Math.floor(Math.random() * 40) + 60
    }));
    return hours;
  };

  // Success Rate by Game Type
  const getSuccessRateByGame = () => {
    const gameTypes = ['click', 'count', 'dynamic', 'conflict', 'colorRecognition'];
    return gameTypes.map(type => {
      const typeActivities = filteredActivities.filter(act => act.gameType === type);
      const avgScore = typeActivities.length > 0
        ? typeActivities.reduce((sum, act) => sum + act.score, 0) / typeActivities.length
        : 0;

      return {
        type: type,
        name: {
          'click': 'Dikkat Tıklama',
          'count': 'Dikkat Sayma',
          'dynamic': 'Dinamik Dikkat',
          'conflict': 'Çatışma Oyunu',
          'colorRecognition': 'AI Renk Tanıma'
        }[type],
        score: Math.round(avgScore),
        count: typeActivities.length
      };
    });
  };

  const performanceTrend = getPerformanceTrend();
  const gameDistribution = getGameTypeDistribution();
  const emotionTrend = getEmotionTrend();
  const dailyPattern = getDailyPattern();
  const successRates = getSuccessRateByGame();

  const emotionColors: Record<string, string> = {
    'happy': '#10B981',
    'focused': '#3B82F6',
    'neutral': '#6B7280',
    'confused': '#F59E0B',
    'sad': '#EF4444'
  };

  const emotionLabels: Record<string, string> = {
    'happy': '😊 Mutlu',
    'focused': '🎯 Odaklanmış',
    'neutral': '😐 Nötr',
    'confused': '😕 Şaşkın',
    'sad': '😢 Üzgün'
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2" />
            Gelişim Analitiği
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Student Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Çocuk Seçimi</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Tüm Çocuklar</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Zaman Aralığı</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['week', 'month', 'all'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {{ week: 'Son 7 Gün', month: 'Son 30 Gün', all: 'Tüm Zamanlar' }[period]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Performans Trendi (Son 30 Gün)
        </h3>
        <div className="h-64 flex items-end space-x-1">
          {performanceTrend.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="relative w-full bg-gray-100 rounded-t-sm" style={{ height: '200px' }}>
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-blue-400 rounded-t-sm transition-all duration-500"
                  style={{ height: `${(day.score / 100) * 100}%` }}
                ></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                  {day.score}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{day.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Distribution & Success Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Game Type Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Oyun Türü Dağılımı
          </h3>
          <div className="space-y-3">
            {gameDistribution.map((game, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
              return (
                <div key={game.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
                    <span className="text-sm font-medium">{game.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[index % colors.length].replace('bg-', 'bg-')}`}
                        style={{ width: `${game.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{game.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Success Rate by Game */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Oyun Türüne Göre Başarı
          </h3>
          <div className="space-y-4">
            {successRates.map((game, index) => (
              <div key={game.type} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{game.name}</span>
                  <span className="text-gray-600">{game.score}% ({game.count} oyun)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      game.score >= 80 ? 'bg-green-500' :
                      game.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${game.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attention & Emotion Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attention Span Tracking */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Dikkat Süresi Analizi
          </h3>
          <div className="space-y-4">
            {Array.from({ length: 7 }, (_, i) => {
              const day = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i];
              const attention = Math.floor(Math.random() * 15) + 5; // 5-20 dakika
              const distractions = Math.floor(Math.random() * 8) + 2; // 2-10 dikkat dağılması
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-8">{day}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              attention >= 15 ? 'bg-green-500' :
                              attention >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(attention / 20) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{attention} dk</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {distractions} dikkat dağılması
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emotion Performance Correlation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Duygu-Performans İlişkisi
          </h3>
          <div className="space-y-3">
            {[
              { emotion: '😊 Mutlu', score: 85, color: 'bg-green-500' },
              { emotion: '🎯 Odaklanmış', score: 92, color: 'bg-blue-500' },
              { emotion: '😐 Nötr', score: 72, color: 'bg-gray-500' },
              { emotion: '😕 Şaşkın', score: 58, color: 'bg-yellow-500' },
              { emotion: '😢 Üzgün', score: 45, color: 'bg-red-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm w-20">{item.emotion}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium">{item.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hyperfocus vs Normal Attention */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Hiperfokus vs Normal Dikkat Analizi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
            <div className="text-sm text-gray-600">Hiperfokus Seansları</div>
            <div className="text-xs text-gray-500 mt-1">Ortalama 25 dk</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">18</div>
            <div className="text-sm text-gray-600">Normal Seanslar</div>
            <div className="text-xs text-gray-500 mt-1">Ortalama 12 dk</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">%78</div>
            <div className="text-sm text-gray-600">Hiperfokus Başarısı</div>
            <div className="text-xs text-gray-500 mt-1">Normal: %65</div>
          </div>
        </div>
      </div>

      {/* Reaction Time Variability */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Tepki Süresi Değişkenliği
        </h3>
        <div className="h-32 flex items-end space-x-1">
          {Array.from({ length: 20 }, (_, i) => {
            const reactionTime = Math.floor(Math.random() * 800) + 200; // 200-1000ms
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="relative w-full bg-gray-100 rounded-t-sm" style={{ height: '100px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-sm ${
                      reactionTime > 700 ? 'bg-red-400' :
                      reactionTime > 500 ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    style={{ height: `${(reactionTime / 1000) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{i + 1}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">425ms</div>
            <div className="text-xs text-gray-500">Ortalama</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">±180ms</div>
            <div className="text-xs text-gray-500">Standart Sapma</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">2.1</div>
            <div className="text-xs text-gray-500">Değişkenlik Katsayısı</div>
          </div>
        </div>
      </div>

      {/* Daily Activity Pattern */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Günlük Aktivite Deseni
        </h3>
        <div className="h-32 flex items-end space-x-1">
          {dailyPattern.filter(hour => hour.hour >= 8 && hour.hour <= 20).map((hour) => (
            <div key={hour.hour} className="flex-1 flex flex-col items-center">
              <div className="relative w-full bg-gray-100 rounded-t-sm" style={{ height: '100px' }}>
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-sm"
                  style={{ height: `${(hour.activities / 10) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{hour.hour}:00</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-600 text-center">
          En aktif saatler: 14:00-16:00 arası
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{filteredActivities.length}</div>
              <div className="text-blue-100 text-sm">Toplam Oyun</div>
            </div>
            <Award className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {Math.round(filteredActivities.reduce((sum, act) => sum + act.score, 0) / filteredActivities.length) || 0}%
              </div>
              <div className="text-green-100 text-sm">Ortalama Başarı</div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {Math.round(filteredActivities.reduce((sum, act) => sum + act.duration, 0) / 60)} dk
              </div>
              <div className="text-purple-100 text-sm">Toplam Süre</div>
            </div>
            <Calendar className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {selectedStudent === 'all' ? students.length : 1}
              </div>
              <div className="text-yellow-100 text-sm">Aktif Çocuk</div>
            </div>
            <Zap className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
      </div>
    </div>
  );
};
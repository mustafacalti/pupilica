import React, { useState } from 'react';
import { Brain, Focus, Heart, AlertTriangle, TrendingUp, Clock, Target, Zap } from 'lucide-react';

interface ADHDAnalyticsProps {
  students: Array<{ id: string; name: string }>;
}

export const ADHDAnalyticsDashboard: React.FC<ADHDAnalyticsProps> = ({ students }) => {
  const [selectedStudent, setSelectedStudent] = useState<string>(students[0]?.id || '');

  // ADHD için kritik dikkat metrikleri
  const getAttentionMetrics = () => {
    return {
      // Sürdürülen dikkat süresi (saniye)
      sustainedAttentionTime: [45, 52, 38, 61, 55, 48, 59], // Son 7 gün

      // Dikkat dağılma olayları (günlük)
      distractionEvents: [8, 6, 12, 4, 7, 9, 5],

      // Ekrana odaklanma oranı (%)
      screenFocusPercentage: [65, 72, 58, 78, 71, 69, 75],

      // Görev tamamlama oranı (%)
      taskCompletionRate: [70, 85, 60, 90, 80, 75, 88]
    };
  };

  // Duygu-Performans korelasyonu
  const getEmotionPerformanceData = () => {
    return [
      { emotion: 'Mutlu', emoji: '😊', avgScore: 85, attentionTime: 58, completionRate: 88, color: '#10B981' },
      { emotion: 'Odaklanmış', emoji: '🎯', avgScore: 92, attentionTime: 65, completionRate: 95, color: '#3B82F6' },
      { emotion: 'Nötr', emoji: '😐', avgScore: 75, attentionTime: 45, completionRate: 78, color: '#6B7280' },
      { emotion: 'Huzursuz', emoji: '😤', avgScore: 62, attentionTime: 32, completionRate: 65, color: '#F59E0B' },
      { emotion: 'Yorgun', emoji: '😴', avgScore: 58, attentionTime: 28, completionRate: 60, color: '#EF4444' }
    ];
  };

  // Dikkat dağılma pattern'leri
  const getDistractionPatterns = () => {
    return {
      timeOfDay: [
        { time: '09:00', level: 3, label: 'Sabah' },
        { time: '11:00', level: 5, label: 'Öğleden Önce' },
        { time: '13:00', level: 8, label: 'Öğle' },
        { time: '15:00', level: 4, label: 'Öğleden Sonra' },
        { time: '17:00', level: 6, label: 'Akşam' },
        { time: '19:00', level: 9, label: 'Gece' }
      ],
      triggers: [
        { name: 'Sesli Uyaranlar', frequency: 45, impact: 'Yüksek' },
        { name: 'Görsel Değişim', frequency: 32, impact: 'Orta' },
        { name: 'Zorluk Artışı', frequency: 28, impact: 'Yüksek' },
        { name: 'Tekrar Eden Görevler', frequency: 38, impact: 'Orta' },
        { name: 'Uzun Süreli Oyun', frequency: 42, impact: 'Yüksek' }
      ]
    };
  };

  // Hiperfokus vs Normal Dikkat Analizi
  const getHyperfocusData = () => {
    return {
      sessions: [
        { date: '20/03', type: 'Hiperfokus', duration: 45, score: 95, distractions: 1 },
        { date: '21/03', type: 'Normal', duration: 25, score: 78, distractions: 6 },
        { date: '22/03', type: 'Hiperfokus', duration: 52, score: 88, distractions: 2 },
        { date: '23/03', type: 'Normal', duration: 18, score: 65, distractions: 8 },
        { date: '24/03', type: 'Normal', duration: 22, score: 72, distractions: 5 },
        { date: '25/03', type: 'Hiperfokus', duration: 38, score: 92, distractions: 1 },
        { date: '26/03', type: 'Normal', duration: 28, score: 75, distractions: 4 }
      ]
    };
  };

  // Reaksiyon süresi variabilite (ADHD için kritik)
  const getReactionTimeVariability = () => {
    return {
      daily: [
        { day: 'Pzt', avg: 450, std: 120, consistency: 'Düşük' },
        { day: 'Sal', avg: 380, std: 85, consistency: 'Orta' },
        { day: 'Çar', avg: 520, std: 150, consistency: 'Düşük' },
        { day: 'Per', avg: 410, std: 90, consistency: 'Orta' },
        { day: 'Cum', avg: 365, std: 70, consistency: 'Yüksek' },
        { day: 'Cmt', avg: 480, std: 130, consistency: 'Düşük' },
        { day: 'Paz', avg: 420, std: 95, consistency: 'Orta' }
      ]
    };
  };

  const attentionMetrics = getAttentionMetrics();
  const emotionPerformance = getEmotionPerformanceData();
  const distractionPatterns = getDistractionPatterns();
  const hyperfocusData = getHyperfocusData();
  const reactionTimeData = getReactionTimeVariability();

  return (
    <div className="space-y-6">
      {/* ADHD-Specific Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Brain className="h-6 w-6 mr-2" />
              ADHD Odaklı Dikkat Analizi
            </h2>
            <p className="text-purple-100 mt-1">Dikkat eksikliği ve hiperaktivite için özel metrikler</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {attentionMetrics.sustainedAttentionTime[attentionMetrics.sustainedAttentionTime.length - 1]}s
            </div>
            <div className="text-purple-200 text-sm">Bugünkü En Uzun Dikkat</div>
          </div>
        </div>

        {/* Student Selector */}
        <div className="mt-4">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/70"
          >
            {students.map(student => (
              <option key={student.id} value={student.id} className="text-gray-800">
                {student.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dikkat Sürdürme & Dağılma Metrikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sürdürülen Dikkat Süresi */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Focus className="h-5 w-5 mr-2 text-blue-500" />
            Sürdürülen Dikkat Süresi (Son 7 Gün)
          </h3>
          <div className="h-48 flex items-end space-x-2">
            {attentionMetrics.sustainedAttentionTime.map((time, index) => {
              const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
              const height = (time / 70) * 100; // Max 70 saniye için normalize
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full bg-gray-100 rounded-t-sm" style={{ height: '160px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-500 ${
                        time > 55 ? 'bg-gradient-to-t from-green-500 to-green-400' :
                        time > 40 ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' :
                        'bg-gradient-to-t from-red-500 to-red-400'
                      }`}
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700">
                      {time}s
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{days[index]}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Hedef:</strong> 60+ saniye sürdürülebilir dikkat
            </div>
          </div>
        </div>

        {/* Dikkat Dağılma Olayları */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Dikkat Dağılma Olayları
          </h3>
          <div className="h-48 flex items-end space-x-2">
            {attentionMetrics.distractionEvents.map((events, index) => {
              const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
              const height = (events / 15) * 100; // Max 15 olay için normalize
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full bg-gray-100 rounded-t-sm" style={{ height: '160px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-500 ${
                        events < 5 ? 'bg-gradient-to-t from-green-500 to-green-400' :
                        events < 8 ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' :
                        'bg-gradient-to-t from-red-500 to-red-400'
                      }`}
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700">
                      {events}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{days[index]}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <div className="text-sm text-orange-800">
              <strong>İdeal:</strong> Günde 5'ten az dikkat dağılması
            </div>
          </div>
        </div>
      </div>

      {/* Duygu-Performans Korelasyonu */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Heart className="h-5 w-5 mr-2 text-pink-500" />
          Duygu Durumu - Performans İlişkisi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {emotionPerformance.map((emotion, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">{emotion.emoji}</div>
              <div className="font-medium text-gray-800 mb-3">{emotion.emotion}</div>

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600">Başarı Oranı</div>
                  <div className="text-lg font-bold" style={{ color: emotion.color }}>
                    {emotion.avgScore}%
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Dikkat Süresi</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {emotion.attentionTime}s
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${emotion.completionRate}%`,
                      backgroundColor: emotion.color
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">Tamamlama: {emotion.completionRate}%</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="text-green-800 font-semibold mb-2">🎯 ADHD İçin Öneriler:</div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• En iyi performans "Odaklanmış" ve "Mutlu" duygularda</li>
            <li>• "Huzursuz" durumdayken kısa molalar verin</li>
            <li>• Oyun öncesi rahatlatıcı aktiviteler yapın</li>
          </ul>
        </div>
      </div>

      {/* Hiperfokus vs Normal Dikkat */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-purple-500" />
          Hiperfokus vs Normal Dikkat Analizi
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hiperfokus İstatistikleri */}
          <div>
            <h4 className="font-semibold text-purple-700 mb-3">Hiperfokus Seansları</h4>
            <div className="space-y-3">
              {hyperfocusData.sessions.filter(s => s.type === 'Hiperfokus').map((session, index) => (
                <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-purple-800">{session.date}</span>
                    <span className="text-purple-600 text-sm">⚡ Hiperfokus</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <div>
                      <div className="text-purple-600">Süre</div>
                      <div className="font-bold">{session.duration}dk</div>
                    </div>
                    <div>
                      <div className="text-purple-600">Skor</div>
                      <div className="font-bold">{session.score}%</div>
                    </div>
                    <div>
                      <div className="text-purple-600">Dağılma</div>
                      <div className="font-bold">{session.distractions}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Normal Dikkat İstatistikleri */}
          <div>
            <h4 className="font-semibold text-blue-700 mb-3">Normal Dikkat Seansları</h4>
            <div className="space-y-3">
              {hyperfocusData.sessions.filter(s => s.type === 'Normal').map((session, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-800">{session.date}</span>
                    <span className="text-blue-600 text-sm">🎯 Normal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <div>
                      <div className="text-blue-600">Süre</div>
                      <div className="font-bold">{session.duration}dk</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Skor</div>
                      <div className="font-bold">{session.score}%</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Dağılma</div>
                      <div className="font-bold">{session.distractions}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="text-yellow-800 font-semibold mb-2">💡 ADHD Hiperfokus İpuçları:</div>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Hiperfokus anlarını fark edin ve destekleyin</li>
            <li>• Bu dönemlerde zorlu görevleri planlayın</li>
            <li>• Hiperfokus sonrası dinlenme molası verin</li>
          </ul>
        </div>
      </div>

      {/* Dikkat Dağılma Pattern'leri */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-orange-500" />
          Dikkat Dağılma Pattern'leri ve Tetikleyiciler
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saatlik Dağılma */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Günlük Dikkat Dağılma Seviyeleri</h4>
            <div className="space-y-2">
              {distractionPatterns.timeOfDay.map((time, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-700">{time.time}</span>
                    <span className="text-sm text-gray-600">{time.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          time.level <= 3 ? 'bg-green-500' :
                          time.level <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(time.level / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-6">{time.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tetikleyiciler */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Dikkat Dağılma Tetikleyicileri</h4>
            <div className="space-y-3">
              {distractionPatterns.triggers.map((trigger, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">{trigger.name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trigger.impact === 'Yüksek' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {trigger.impact} Etki
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                        style={{ width: `${trigger.frequency}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{trigger.frequency}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reaksiyon Süresi Tutarlılığı */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-indigo-500" />
          Reaksiyon Süresi Tutarlılığı (ADHD'de Kritik)
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {reactionTimeData.daily.map((day, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-800 mb-2">{day.day}</div>
              <div className="text-sm text-gray-600 mb-1">Ort: {day.avg}ms</div>
              <div className="text-xs text-gray-500 mb-2">Değişim: ±{day.std}ms</div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                day.consistency === 'Yüksek' ? 'bg-green-100 text-green-700' :
                day.consistency === 'Orta' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {day.consistency}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
          <div className="text-indigo-800 font-semibold mb-2">📊 ADHD Tutarlılık Analizi:</div>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• Yüksek variabilite ADHD'nin tipik belirtisidir</li>
            <li>• Tutarlı günlerde daha iyi performans gözlemlenir</li>
            <li>• Düzenli rutin tutarlılığı artırır</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
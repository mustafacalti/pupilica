import React, { useState } from 'react';
import { Student } from '../../types';
import { calculateGameStats, getEmotionAnalysis, getWeeklyProgress, emotionLabels } from '../../data/mockData';
import { DetailedGameStats } from './DetailedGameStats';
import { User, TrendingUp, Clock, Trophy, Heart, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

interface ParentStudentListProps {
  students: Student[];
  loading: boolean;
  onViewStudent: (student: Student) => void;
}

export const ParentStudentList: React.FC<ParentStudentListProps> = ({
  students,
  loading,
  onViewStudent,
}) => {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const toggleStudentDetails = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Henüz çocuk eklenmemiş</h3>
        <p className="text-gray-600">
          Çocuğunuzun öğrenme sürecini takip etmek için lütfen sistem yöneticisi ile iletişime geçin.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Çocuklarınız ({students.length})
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {students.map((student) => {
          const gameStats = calculateGameStats(student.id);
          const emotionAnalysis = getEmotionAnalysis(student.id);
          const weeklyProgress = getWeeklyProgress(student.id);
          const averageWeeklyScore = Math.round(
            weeklyProgress.reduce((sum, day) => sum + day.score, 0) / weeklyProgress.length
          );

          return (
            <div
              key={student.id}
              className="border border-gray-200 rounded-lg p-5 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-800">{student.name}</h4>
                    <p className="text-sm text-gray-600">{student.age} yaş</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {averageWeeklyScore} puan ortalaması
                  </div>
                  <div className="text-2xl">
                    {emotionLabels[emotionAnalysis.dominantEmotion]?.split(' ')[0] || '😐'}
                  </div>
                </div>
              </div>

              {/* İstatistik kartları */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-800">{gameStats.totalGames}</div>
                  <div className="text-xs text-gray-600">Oyun Oynandı</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-800">{gameStats.averageScore}%</div>
                  <div className="text-xs text-gray-600">Ortalama Başarı</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-800">{gameStats.totalPlayTime}dk</div>
                  <div className="text-xs text-gray-600">Toplam Süre</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Heart className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-gray-800">{emotionAnalysis.averageConfidence}%</div>
                  <div className="text-xs text-gray-600">Duygu Güveni</div>
                </div>
              </div>

              {/* Haftalık ilerleme grafiği */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Haftalık İlerleme
                  </h5>
                  <span className="text-xs text-gray-500">Son 7 gün</span>
                </div>
                <div className="flex items-end space-x-1 h-16">
                  {weeklyProgress.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-primary to-secondary rounded-sm"
                        style={{ height: `${(day.score / 100) * 100}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sevdiği oyun tipi ve Detay butonu */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">En sevdiği oyun:</span>
                  <span className="ml-2 text-sm font-medium text-gray-800">{gameStats.favoriteGame}</span>
                </div>
                <div className="flex items-center space-x-4">
                  {gameStats.lastActivity && (
                    <div className="text-xs text-gray-500">
                      Son aktivite: {gameStats.lastActivity.createdAt.toLocaleDateString('tr-TR')}
                    </div>
                  )}
                  <button
                    onClick={() => toggleStudentDetails(student.id)}
                    className="flex items-center px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                  >
                    {expandedStudent === student.id ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Detayları Gizle
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Detayları Göster
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Notlar */}
              {student.notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{student.notes}</p>
                </div>
              )}

              {/* Detaylı İstatistikler - Genişletilebilir */}
              {expandedStudent === student.id && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <DetailedGameStats studentId={student.id} studentName={student.name} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
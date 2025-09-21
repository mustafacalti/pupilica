import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/dashboard/Header';
import { StatsCards } from '../components/dashboard/StatsCards';
import { ParentStudentList } from '../components/dashboard/ParentStudentList';
import { AIInsightsPanel } from '../components/dashboard/AIInsightsPanel';
import { ExpertChat } from '../components/chat/ExpertChat';
import { GameCalendar } from '../components/calendar/GameCalendar';
import { Student, AIInsight, PerformanceStats, EmotionResult } from '../types';
import { getStudentsByParent, getAIInsightsByStudent } from '../services/firestore';
import { mockStudents, mockAIInsights, calculateGameStats } from '../data/mockData';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus] = useState<'connected' | 'disconnected' | 'processing'>('connected');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarSessions, setCalendarSessions] = useState<any[]>([]);


  const [stats, setStats] = useState<PerformanceStats>({
    weeklyProgress: 85,
    completedActivities: 24,
    averageSuccess: 78,
    aiRecommendations: 5
  });

  const loadData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Debug: Kullanıcı ID'sini konsola yazdır
      console.log('Current User ID:', currentUser.id);
      console.log('Available mock students:', mockStudents);

      // Mock veri kullan - şimdilik tüm mock öğrencileri bu kullanıcıya ata
      const studentsData = mockStudents.slice(0, 2); // İlk 2 çocuğu al (Ahmet ve Ayşe)
      console.log('Filtered students for user:', studentsData);
      setStudents(studentsData);

      // Mock AI öngörülerini filtrele
      const allInsights = mockAIInsights.filter(insight =>
        studentsData.some(student => student.id === insight.studentId)
      );

      allInsights.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setInsights(allInsights.slice(0, 10));

      // İstatistikleri güncelle
      const totalActivities = studentsData.reduce((total, student) => {
        const gameStats = calculateGameStats(student.id);
        return total + gameStats.totalGames;
      }, 0);

      const averageSuccess = studentsData.length > 0 ? Math.round(studentsData.reduce((total, student) => {
        const gameStats = calculateGameStats(student.id);
        return total + gameStats.averageScore;
      }, 0) / studentsData.length) : 0;

      setStats({
        weeklyProgress: 85,
        completedActivities: totalActivities,
        averageSuccess: averageSuccess,
        aiRecommendations: allInsights.length
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  const handleViewStudent = (student: Student) => {
    console.log('View student:', student);
    // Burada student detay sayfasına yönlendirme yapılabilir
  };

  const handleChatScheduleGenerated = (sessions: any[]) => {
    setCalendarSessions(prev => [...prev, ...sessions]);
    // Bildirim göster
    console.log('AI Chat\'ten takvim seansları eklendi:', sessions);
  };


  return (
    <>
      <Header aiStatus={aiStatus} />

      <main className="w-full py-3 px-4">
        <div className="space-y-4">
          {/* Welcome & Stats Section */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Welcome Card */}
            <div className="xl:col-span-3 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">
                    Hoş geldiniz, {currentUser?.name}! 👋
                  </h1>
                  <p className="text-blue-100 text-base mb-3">
                    PeakFocus AI ile çocuğunuzun gelişimini takip edin
                  </p>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-2 bg-white/10 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">AI Aktif</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/10 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="font-medium">{students.length} Çocuk</span>
                    </div>
                  </div>
                </div>
                <div className="hidden xl:block ml-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🧠</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="xl:col-span-2 grid grid-cols-2 xl:grid-cols-1 gap-2">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-3 text-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">{stats.completedActivities}</div>
                    <div className="text-xs text-emerald-100">Oyun Seansı</div>
                  </div>
                  <div className="text-lg">🎯</div>
                </div>
                <div className="text-xs text-emerald-100 mt-1">Bu hafta +{Math.floor(Math.random() * 8) + 5}</div>
              </div>

              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-3 text-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">{stats.averageSuccess}%</div>
                    <div className="text-xs text-amber-100">Başarı Oranı</div>
                  </div>
                  <div className="text-lg">⭐</div>
                </div>
                <div className="text-xs text-amber-100 mt-1">Hedef: %85</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
            {/* Left Content - Students */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    👥 Çocuklarım
                    <span className="ml-2 text-xs font-normal text-gray-500 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {students.length} Çocuk
                    </span>
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm">Çocuklarınızın güncel durumu ve son aktiviteleri</p>
                </div>
                <ParentStudentList
                  students={students}
                  loading={loading}
                  onViewStudent={handleViewStudent}
                />
              </div>
            </div>

            {/* Center Content - AI Insights */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-full">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    🤖 AI Öngörüleri
                    <span className="ml-2 text-xs font-normal text-gray-500 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Aktif
                    </span>
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm">Gelişim analizi ve öneriler</p>
                </div>
                <AIInsightsPanel
                  insights={insights}
                  loading={loading}
                />
              </div>
            </div>

            {/* Right Content - Quick Actions */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  ⚡ Hızlı İşlemler
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/analytics')}
                    className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-200 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="text-blue-600 font-semibold mb-1 group-hover:text-blue-700 text-base">📊</div>
                    <div className="text-blue-600 font-medium mb-1 group-hover:text-blue-700 text-sm">Gelişim Analizi</div>
                    <div className="text-xs text-gray-600">Detaylı performans grafikleri</div>
                  </button>
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-200 hover:shadow-sm transition-all text-left group">
                    <div className="text-orange-600 font-semibold mb-1 group-hover:text-orange-700 text-base">🎯</div>
                    <div className="text-orange-600 font-medium mb-1 group-hover:text-orange-700 text-sm">Oyun Önerileri</div>
                    <div className="text-xs text-gray-600">AI destekli kişisel öneriler</div>
                  </button>
                  <button
                    onClick={() => setShowCalendar(true)}
                    className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-200 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="text-purple-600 font-semibold mb-1 group-hover:text-purple-700 text-base">📅</div>
                    <div className="text-purple-600 font-medium mb-1 group-hover:text-purple-700 text-sm">Oyun Takvimi</div>
                    <div className="text-xs text-gray-600">Oyun seanslarını planla</div>
                  </button>

                  {/* Progress Ring */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-2 font-medium">Haftalık İlerleme</div>
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                          <circle
                            cx="40"
                            cy="40"
                            r="30"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-gray-200"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="30"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 30}`}
                            strokeDashoffset={`${2 * Math.PI * 30 * (1 - stats.weeklyProgress / 100)}`}
                            className="text-blue-500"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-800">{stats.weeklyProgress}%</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Hedef: %90</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Expert Chat - Floating */}
      <ExpertChat
        studentName={students.length > 0 ? students[0].name : undefined}
        students={students.map(s => ({ id: s.id, name: s.name }))}
        onScheduleGenerated={handleChatScheduleGenerated}
      />

      {/* Game Calendar Modal */}
      <GameCalendar
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        students={students.map(s => ({ id: s.id, name: s.name }))}
        externalSessions={calendarSessions}
      />

    </>
  );
};
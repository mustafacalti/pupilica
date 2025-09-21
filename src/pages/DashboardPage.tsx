import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/dashboard/Header';
import { StatsCards } from '../components/dashboard/StatsCards';
import { ParentStudentList } from '../components/dashboard/ParentStudentList';
import { AIInsightsPanel } from '../components/dashboard/AIInsightsPanel';
import { ExpertChat } from '../components/chat/ExpertChat';
import { GameCalendar } from '../components/calendar/GameCalendar';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { Student, AIInsight, PerformanceStats, EmotionResult } from '../types';
import { getStudentsByParent, getAIInsightsByStudent } from '../services/firestore';
import { mockStudents, mockAIInsights, calculateGameStats } from '../data/mockData';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus] = useState<'connected' | 'disconnected' | 'processing'>('connected');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
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
    <div className="min-h-screen bg-gray-50">
      <Header aiStatus={aiStatus} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              Hoş geldiniz, {currentUser?.name}! 👋
            </h2>
            <p className="text-blue-100">
              NeuroLearn AI ile çocuğunuzun gelişimini takip edin ve öğrenme sürecini destekleyin.
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards stats={stats} loading={loading} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student List - Takes 2 columns */}
            <div className="lg:col-span-2">
              <ParentStudentList
                students={students}
                loading={loading}
                onViewStudent={handleViewStudent}
              />
            </div>

            {/* AI Insights Panel - Takes 1 column */}
            <div className="lg:col-span-1">
              <AIInsightsPanel
                insights={insights}
                loading={loading}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Hızlı İşlemler</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowAnalytics(true)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-primary font-medium mb-1">📊 Gelişim Analizi</div>
                <div className="text-sm text-gray-600">Detaylı grafikler ve analitik raporlar</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="text-secondary font-medium mb-1">🎯 Oyun Önerileri</div>
                <div className="text-sm text-gray-600">AI destekli kişisel oyun önerilerini inceleyin</div>
              </button>
              <button
                onClick={() => setShowCalendar(true)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="text-purple-600 font-medium mb-1">📅 Oyun Takvimi</div>
                <div className="text-sm text-gray-600">Oyun seanslarını planlayın ve takip edin</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="text-success font-medium mb-1">💬 Uzman Desteği</div>
                <div className="text-sm text-gray-600">Gelişim uzmanı ile iletişim kurun</div>
              </button>
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

      {/* Analytics Modal */}
      {showAnalytics && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAnalytics(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
               onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">📊 Gelişim Analizi</h3>
                  <p className="text-blue-100 mt-1">Detaylı performans grafikleri ve istatistikler</p>
                </div>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Analytics Content */}
            <div className="p-6">
              <AnalyticsDashboard students={students.map(s => ({ id: s.id, name: s.name }))} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
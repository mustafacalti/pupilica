import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/dashboard/Header';
import { StatsCards } from '../components/dashboard/StatsCards';
import { StudentList } from '../components/dashboard/StudentList';
import { AIInsightsPanel } from '../components/dashboard/AIInsightsPanel';
import { Student, AIInsight, PerformanceStats, EmotionResult } from '../types';
import { getStudentsByTeacher, getAIInsightsByStudent } from '../services/firestore';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus] = useState<'connected' | 'disconnected' | 'processing'>('connected');

  const [stats] = useState<PerformanceStats>({
    weeklyProgress: 85,
    completedActivities: 24,
    averageSuccess: 78,
    aiRecommendations: 5
  });

  const loadData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const studentsData = await getStudentsByTeacher(currentUser.id);
      setStudents(studentsData);

      const allInsights: AIInsight[] = [];
      for (const student of studentsData) {
        const studentInsights = await getAIInsightsByStudent(student.id);
        allInsights.push(...studentInsights);
      }

      allInsights.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setInsights(allInsights.slice(0, 10));

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

  const handleAddStudent = () => {
    console.log('Add student clicked');
  };

  const handleViewStudent = (student: Student) => {
    console.log('View student:', student);
  };

  const handleEditStudent = (student: Student) => {
    console.log('Edit student:', student);
  };

  const handleDeleteStudent = (studentId: string) => {
    console.log('Delete student:', studentId);
  };

  const getStudentLastEmotion = (studentId: string): EmotionResult | null => {
    return {
      emotion: 'happy',
      confidence: 0.95,
      timestamp: new Date()
    };
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
              NeuroLearn AI ile öğrencilerinizin gelişimini takip edin ve yapay zeka destekli öğrenme deneyimi sunun.
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards stats={stats} loading={loading} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student List - Takes 2 columns */}
            <div className="lg:col-span-2">
              <StudentList
                students={students}
                loading={loading}
                onAddStudent={handleAddStudent}
                onViewStudent={handleViewStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                getStudentLastEmotion={getStudentLastEmotion}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="text-primary font-medium mb-1">🎮 Yeni Oyun Başlat</div>
                <div className="text-sm text-gray-600">Öğrenciler için eğitim oyunu başlatın</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="text-secondary font-medium mb-1">📊 Detaylı Rapor</div>
                <div className="text-sm text-gray-600">Öğrenci gelişim raporlarını inceleyin</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="text-success font-medium mb-1">🤖 AI Önerileri</div>
                <div className="text-sm text-gray-600">Yapay zeka önerilerini görüntüleyin</div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
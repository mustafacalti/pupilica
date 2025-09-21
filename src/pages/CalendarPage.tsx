import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/dashboard/Header';
import { GameCalendar } from '../components/calendar/GameCalendar';
import { Student } from '../types';
import { mockStudents } from '../data/mockData';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CalendarPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus] = useState<'connected' | 'disconnected' | 'processing'>('connected');
  const [calendarSessions, setCalendarSessions] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const studentsData = mockStudents.slice(0, 2);
      setStudents(studentsData);
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

  return (
    <>
      <Header aiStatus={aiStatus} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    📅 Oyun Takvimi
                    <span className="ml-3 text-sm font-normal text-gray-500 bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                      AI Planlayıcı
                    </span>
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {currentUser?.name} - Çocuklarınızın oyun seanslarını planlayın ve takip edin
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>AI Aktif</span>
                </div>
                <div className="text-sm text-gray-500">
                  {students.length} çocuk için planlama
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-gray-600">Takvim yükleniyor...</span>
              </div>
            ) : (
              <GameCalendar
                isOpen={true}
                onClose={() => {}} // Calendar always open on this page
                students={students.map(s => ({ id: s.id, name: s.name }))}
                externalSessions={calendarSessions}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
};
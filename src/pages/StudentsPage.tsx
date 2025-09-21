import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/dashboard/Header';
import { ParentStudentList } from '../components/dashboard/ParentStudentList';
import { DetailedGameStats } from '../components/dashboard/DetailedGameStats';
import { Student } from '../types';
import { mockStudents } from '../data/mockData';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus] = useState<'connected' | 'disconnected' | 'processing'>('connected');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
  };

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
                    👥 Çocuklarım
                    <span className="ml-3 text-sm font-normal text-gray-500 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {students.length} Çocuk
                    </span>
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {currentUser?.name} - Çocuklarınızın profilleri ve detaylı gelişim takibi
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Yeni Çocuk Ekle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Students List */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Çocuk bilgileri yükleniyor...</span>
                  </div>
                ) : (
                  <ParentStudentList
                    students={students}
                    loading={loading}
                    onViewStudent={handleViewStudent}
                  />
                )}
              </div>
            </div>

            {/* Student Details Sidebar */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                {selectedStudent ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {selectedStudent.name} - Detaylar
                    </h3>
                    <DetailedGameStats
                      student={selectedStudent}
                      onClose={() => setSelectedStudent(null)}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Çocuk Seçin</h3>
                    <p className="text-gray-600 text-sm">
                      Detaylı bilgiler için soldaki listeden bir çocuk seçin
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
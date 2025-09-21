import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, GamepadIcon, Target, Bell } from 'lucide-react';
import { AIScheduler } from './AIScheduler';

interface GameSession {
  id: string;
  studentId: string;
  studentName: string;
  gameType: string;
  date: Date;
  duration: number; // dakika
  reminder: boolean;
  status: 'planned' | 'completed' | 'missed';
  aiGenerated?: boolean;
}

interface GameCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  students: Array<{ id: string; name: string }>;
  externalSessions?: GameSession[];
}

export const GameCalendar: React.FC<GameCalendarProps> = ({ isOpen, onClose, students, externalSessions = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessions, setSessions] = useState<GameSession[]>([
    // Mock data
    {
      id: '1',
      studentId: 'mustafa-child-1',
      studentName: 'Ahmet Deneme',
      gameType: 'number',
      date: new Date(2024, 2, 20, 10, 0), // 20 Mart 2024, 10:00
      duration: 20,
      reminder: true,
      status: 'planned'
    },
    {
      id: '2',
      studentId: 'mustafa-child-2',
      studentName: 'Ayşe Deneme',
      gameType: 'color',
      date: new Date(2024, 2, 21, 14, 30), // 21 Mart 2024, 14:30
      duration: 15,
      reminder: true,
      status: 'planned'
    }
  ]);

  const [newSession, setNewSession] = useState({
    studentId: '',
    gameType: 'number',
    date: '',
    time: '',
    duration: 20,
    reminder: true
  });

  // External sessions'ları entegre et - Hook'ları en üstte tanımla
  useEffect(() => {
    if (externalSessions.length > 0) {
      setSessions(prev => [...prev, ...externalSessions]);
    }
  }, [externalSessions]);

  if (!isOpen) return null;

  const gameTypes = {
    'count': '🔢 Dikkat Sayma',
    'conflict': '🎨 Çatışma Oyunu',
    'click': '🎯 Dikkat Tıklama',
    'dynamic': '⚡ Dinamik Dikkat',
    'colorRecognition': '📷 AI Renk Tanıma'
  };

  // Takvim günlerini oluştur
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Önceki ayın son günleri
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Bu ayın günleri
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Sonraki ayın ilk günleri (6 satır için)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session =>
      session.date.toDateString() === date.toDateString()
    );
  };

  const addGameSession = () => {
    if (!newSession.studentId || !newSession.date || !newSession.time) return;

    const student = students.find(s => s.id === newSession.studentId);
    if (!student) return;

    const [hours, minutes] = newSession.time.split(':').map(Number);
    const sessionDate = new Date(newSession.date);
    sessionDate.setHours(hours, minutes);

    const gameSession: GameSession = {
      id: Date.now().toString(),
      studentId: newSession.studentId,
      studentName: student.name,
      gameType: newSession.gameType,
      date: sessionDate,
      duration: newSession.duration,
      reminder: newSession.reminder,
      status: 'planned'
    };

    setSessions(prev => [...prev, gameSession]);
    setNewSession({
      studentId: '',
      gameType: 'number',
      date: '',
      time: '',
      duration: 20,
      reminder: true
    });
    setShowAddSession(false);
  };

  const removeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleAISessionsGenerated = (aiSessions: GameSession[]) => {
    setSessions(prev => [...prev, ...aiSessions]);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
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
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6" />
              <div>
                <h3 className="text-2xl font-bold">Oyun Takvimi</h3>
                <p className="text-blue-100">Oyun seanslarınızı planlayın ve takip edin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Takvim */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-4">

                {/* Takvim Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ←
                  </button>
                  <h4 className="text-lg font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h4>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    →
                  </button>
                </div>

                {/* Gün başlıkları */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Takvim günleri */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map(({ date, isCurrentMonth }, index) => {
                    const daySessions = getSessionsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate?.toDateString() === date.toDateString();

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`
                          p-2 h-20 border border-gray-100 cursor-pointer transition-colors
                          ${!isCurrentMonth ? 'text-gray-300 bg-gray-50' : 'hover:bg-blue-50'}
                          ${isToday ? 'bg-blue-100 border-blue-300' : ''}
                          ${isSelected ? 'bg-primary/10 border-primary' : ''}
                        `}
                      >
                        <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>
                          {date.getDate()}
                        </div>

                        {/* Oyun seansları */}
                        <div className="mt-1 space-y-1">
                          {daySessions.slice(0, 2).map(session => (
                            <div
                              key={session.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${
                                session.aiGenerated
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-primary/20 text-primary'
                              }`}
                            >
                              {session.aiGenerated && '🤖 '}
                              {session.studentName.split(' ')[0]}
                            </div>
                          ))}
                          {daySessions.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{daySessions.length - 2} daha
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Yan Panel */}
            <div className="space-y-4">

              {/* AI Scheduler */}
              <AIScheduler
                students={students}
                onSessionsGenerated={handleAISessionsGenerated}
              />

              {/* Yeni Seans Ekle */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Oyun Seansı
                  </h5>
                </div>

                {!showAddSession ? (
                  <button
                    onClick={() => setShowAddSession(true)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
                  >
                    + Oyun Seansı Ekle
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Çocuk
                      </label>
                      <select
                        value={newSession.studentId}
                        onChange={(e) => setNewSession(prev => ({ ...prev, studentId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Çocuk seçin</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Oyun Türü
                      </label>
                      <select
                        value={newSession.gameType}
                        onChange={(e) => setNewSession(prev => ({ ...prev, gameType: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        {Object.entries(gameTypes).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tarih
                      </label>
                      <input
                        type="date"
                        value={newSession.date}
                        onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saat
                      </label>
                      <input
                        type="time"
                        value={newSession.time}
                        onChange={(e) => setNewSession(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Süre (dakika)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={newSession.duration}
                        onChange={(e) => setNewSession(prev => ({ ...prev, duration: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reminder"
                        checked={newSession.reminder}
                        onChange={(e) => setNewSession(prev => ({ ...prev, reminder: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="reminder" className="text-sm text-gray-700 flex items-center">
                        <Bell className="h-4 w-4 mr-1" />
                        Hatırlatma
                      </label>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={addGameSession}
                        className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Ekle
                      </button>
                      <button
                        onClick={() => setShowAddSession(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Seçilen Günün Seansları */}
              {selectedDate && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold mb-3">
                    {selectedDate.toLocaleDateString('tr-TR')} - Oyun Seansları
                  </h5>

                  {getSessionsForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 text-sm">Bu gün için planlanmış oyun yok</p>
                  ) : (
                    <div className="space-y-2">
                      {getSessionsForDate(selectedDate).map(session => (
                        <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${
                          session.aiGenerated ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                        }`}>
                          <div className="flex-1">
                            <div className="font-medium text-sm flex items-center">
                              {session.aiGenerated && <span className="text-purple-600 mr-1">🤖</span>}
                              {session.studentName}
                              {session.aiGenerated && <span className="ml-2 text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded">AI</span>}
                            </div>
                            <div className="text-xs text-gray-600">
                              {gameTypes[session.gameType]} • {session.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {session.duration}dk
                            </div>
                            {session.reminder && (
                              <div className="text-xs text-blue-600 flex items-center mt-1">
                                <Bell className="h-3 w-3 mr-1" />
                                Hatırlatma aktif
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeSession(session.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hızlı İstatistikler */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 mb-3">Bu Hafta</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Toplam Seans:</span>
                    <span className="font-medium">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Tamamlanan:</span>
                    <span className="font-medium">{sessions.filter(s => s.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Planlanan:</span>
                    <span className="font-medium">{sessions.filter(s => s.status === 'planned').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
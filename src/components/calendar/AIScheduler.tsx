import React, { useState } from 'react';
import { Bot, Sparkles, Clock, Calendar, Target, Send, Loader2, CheckCircle } from 'lucide-react';

interface GameSession {
  id: string;
  studentId: string;
  studentName: string;
  gameType: string;
  date: Date;
  duration: number;
  reminder: boolean;
  status: 'planned' | 'completed' | 'missed';
  aiGenerated?: boolean;
}

interface AISchedulerProps {
  students: Array<{ id: string; name: string }>;
  onSessionsGenerated: (sessions: GameSession[]) => void;
}

export const AIScheduler: React.FC<AISchedulerProps> = ({ students, onSessionsGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSessions, setGeneratedSessions] = useState<GameSession[]>([]);
  const [showResults, setShowResults] = useState(false);

  const gameTypes = {
    'count': '🔢 Dikkat Sayma',
    'conflict': '🎨 Çatışma Oyunu',
    'click': '🎯 Dikkat Tıklama',
    'dynamic': '⚡ Dinamik Dikkat',
    'colorRecognition': '📷 AI Renk Tanıma'
  };

  // AI prompt örnekleri
  const promptExamples = [
    "Ahmet için haftada 3 kez sayı oyunları, Ayşe için haftada 2 kez renk oyunları planla",
    "Bu hafta her çocuk için günde 15 dakika, farklı oyun türleri ile program oluştur",
    "Ahmet pazartesi ve çarşamba dikkat oyunları, Ayşe salı ve perşembe kelime oyunları",
    "Hafta sonu dahil 7 gün boyunca dengeli bir oyun programı hazırla"
  ];

  const parseAIPrompt = (userPrompt: string): GameSession[] => {
    const sessions: GameSession[] = [];
    const currentDate = new Date();

    // AI parsing logic - gerçek hayatta GPT-4 kullanılabilir
    const prompt = userPrompt.toLowerCase();

    // Basit parsing logic
    const studentMentions = students.filter(student =>
      prompt.includes(student.name.toLowerCase()) ||
      prompt.includes(student.name.split(' ')[0].toLowerCase())
    );

    // Eğer hiç öğrenci belirtilmemişse, tüm öğrenciler için plan yap
    const targetStudents = studentMentions.length > 0 ? studentMentions : students;

    // Oyun türlerini algıla
    const mentionedGameTypes = Object.keys(gameTypes).filter(gameType => {
      const gameKeywords = {
        'count': ['sayı', 'matematik', 'rakam', 'sayma'],
        'conflict': ['renk', 'renkli', 'çatışma', 'stroop'],
        'click': ['kelime', 'resim', 'word', 'tıklama', 'hızlı'],
        'dynamic': ['dikkat', 'odak', 'attention', 'dinamik', 'hareket'],
        'colorRecognition': ['renk tanıma', 'kamera', 'ai']
      };
      return gameKeywords[gameType].some(keyword => prompt.includes(keyword));
    });

    // Süre algılama
    const durationMatch = prompt.match(/(\d+)\s*(dakika|dk|minute)/);
    const defaultDuration = durationMatch ? parseInt(durationMatch[1]) : 20;

    // Frekans algılama
    const frequencyMatch = prompt.match(/(\d+)\s*(kez|kere|defa)/);
    const weeklyFrequency = frequencyMatch ? parseInt(frequencyMatch[1]) : 3;

    // Günleri algıla
    const dayMentions = {
      'pazartesi': 1, 'pzt': 1,
      'salı': 2, 'sal': 2,
      'çarşamba': 3, 'çar': 3,
      'perşembe': 4, 'per': 4,
      'cuma': 5, 'cum': 5,
      'cumartesi': 6, 'cmt': 6,
      'pazar': 0, 'paz': 0
    };

    const mentionedDays = Object.entries(dayMentions).filter(([day]) =>
      prompt.includes(day)
    ).map(([, dayNum]) => dayNum);

    // Her öğrenci için seanslar oluştur
    targetStudents.forEach((student, studentIndex) => {
      const studentGameTypes = mentionedGameTypes.length > 0 ? mentionedGameTypes : Object.keys(gameTypes);
      const sessionsPerWeek = Math.max(1, Math.min(weeklyFrequency, 7));

      for (let i = 0; i < sessionsPerWeek; i++) {
        const gameType = studentGameTypes[i % studentGameTypes.length];

        // Tarih belirleme
        let sessionDate: Date;

        if (mentionedDays.length > 0) {
          // Belirtilen günleri kullan
          const dayIndex = i % mentionedDays.length;
          const targetDay = mentionedDays[dayIndex];
          sessionDate = new Date(currentDate);
          const daysUntilTarget = (targetDay - currentDate.getDay() + 7) % 7;
          sessionDate.setDate(currentDate.getDate() + daysUntilTarget);
        } else {
          // Haftayı eşit böl
          sessionDate = new Date(currentDate);
          const daysAhead = Math.floor((i * 7) / sessionsPerWeek) + 1;
          sessionDate.setDate(currentDate.getDate() + daysAhead);
        }

        // Saat belirleme (çocuk sayısına göre farklı saatler)
        const baseHour = 14 + (studentIndex * 2); // 14:00, 16:00, vs.
        const sessionHour = baseHour + Math.floor(i / 2);
        sessionDate.setHours(sessionHour, i % 2 === 0 ? 0 : 30, 0, 0);

        const session: GameSession = {
          id: `ai-${Date.now()}-${studentIndex}-${i}`,
          studentId: student.id,
          studentName: student.name,
          gameType: gameType,
          date: sessionDate,
          duration: defaultDuration,
          reminder: true,
          status: 'planned',
          aiGenerated: true
        };

        sessions.push(session);
      }
    });

    // Tarihe göre sırala
    return sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const generateSchedule = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setShowResults(false);

    // AI processing simulation
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const sessions = parseAIPrompt(prompt);
      setGeneratedSessions(sessions);
      setShowResults(true);
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applySchedule = () => {
    onSessionsGenerated(generatedSessions);
    setPrompt('');
    setGeneratedSessions([]);
    setShowResults(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateSchedule();
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Bot className="h-6 w-6 text-purple-600 mr-2" />
        <h4 className="text-lg font-semibold text-purple-800">AI Takvim Planlayıcısı</h4>
        <Sparkles className="h-5 w-5 text-purple-500 ml-2" />
      </div>

      <p className="text-purple-700 text-sm mb-4">
        AI'dan oyun programı isteyiniz. Hangi çocuk, hangi oyunları, ne zaman oynayacağını belirtin.
      </p>

      {/* Prompt Örnekleri */}
      <div className="mb-4">
        <p className="text-sm font-medium text-purple-700 mb-2">Örnek komutlar:</p>
        <div className="grid grid-cols-1 gap-2">
          {promptExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              className="text-left text-xs bg-white/70 hover:bg-white/90 text-purple-600 p-2 rounded border border-purple-200 transition-colors"
            >
              💡 {example}
            </button>
          ))}
        </div>
      </div>

      {/* AI Prompt Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-purple-700 mb-2">
            AI Planlama Talebi
          </label>
          <div className="flex space-x-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Örn: Ahmet için haftada 3 kez sayı oyunları, Ayşe için haftada 2 kez renk oyunları planla..."
              className="flex-1 resize-none border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
            <button
              onClick={generateSchedule}
              disabled={!prompt.trim() || isGenerating}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* AI Processing */}
        {isGenerating && (
          <div className="bg-white/70 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-purple-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">AI oyun programını hazırlıyor...</span>
            </div>
            <div className="text-xs text-purple-500 mt-2">
              Çocukların geçmiş verilerini analiz ediyor ve optimal program oluşturuyor
            </div>
          </div>
        )}

        {/* Generated Results */}
        {showResults && generatedSessions.length > 0 && (
          <div className="bg-white/90 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-purple-800 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                AI Tarafından Oluşturulan Program ({generatedSessions.length} seans)
              </h5>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {generatedSessions.map((session, index) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-purple-50/70 rounded-lg border border-purple-100">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-purple-800">
                      {session.studentName} - {gameTypes[session.gameType]}
                    </div>
                    <div className="text-xs text-purple-600 flex items-center space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {session.date.toLocaleDateString('tr-TR')}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {session.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        {session.duration}dk
                      </span>
                    </div>
                  </div>
                  <div className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">
                    AI
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={applySchedule}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                ✅ Programı Takvime Ekle
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  setGeneratedSessions([]);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ❌ İptal Et
              </button>
            </div>
          </div>
        )}

        {showResults && generatedSessions.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <p className="text-orange-700 text-sm">
              AI bu talep için program oluşturamadı. Lütfen daha detaylı bir açıklama deneyin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ExpertChatProps {
  studentName?: string;
  students?: Array<{ id: string; name: string }>;
  onScheduleGenerated?: (sessions: any[]) => void;
}

export const ExpertChat: React.FC<ExpertChatProps> = ({ studentName, students = [], onScheduleGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Takvim planlama fonksiyonu
  const parseScheduleRequest = (userMessage: string): any[] => {
    const sessions: any[] = [];
    const currentDate = new Date();
    const message = userMessage.toLowerCase();

    // Takvim anahtar kelimeleri
    const scheduleKeywords = ['planla', 'takvim', 'program', 'zamanla', 'oyun planı', 'seans'];
    const isScheduleRequest = scheduleKeywords.some(keyword => message.includes(keyword));

    if (!isScheduleRequest || students.length === 0) return [];

    // Öğrenci analizi
    const studentMentions = students.filter(student =>
      message.includes(student.name.toLowerCase()) ||
      message.includes(student.name.split(' ')[0].toLowerCase())
    );

    const targetStudents = studentMentions.length > 0 ? studentMentions : students;

    // Oyun türlerini algıla
    const gameTypeKeywords = {
      'count': ['sayı', 'matematik', 'rakam', 'sayma'],
      'conflict': ['renk', 'renkli', 'çatışma', 'stroop'],
      'click': ['kelime', 'resim', 'word', 'tıklama', 'hızlı'],
      'dynamic': ['dikkat', 'odak', 'attention', 'dinamik', 'hareket'],
      'colorRecognition': ['renk tanıma', 'kamera', 'ai']
    };

    const mentionedGameTypes = Object.keys(gameTypeKeywords).filter(gameType =>
      gameTypeKeywords[gameType].some(keyword => message.includes(keyword))
    );

    // Süre ve frekans analizi
    const durationMatch = message.match(/(\d+)\s*(dakika|dk|minute)/);
    const defaultDuration = durationMatch ? parseInt(durationMatch[1]) : 20;

    const frequencyMatch = message.match(/(\d+)\s*(kez|kere|defa)/);
    const weeklyFrequency = frequencyMatch ? parseInt(frequencyMatch[1]) : 3;

    // Günleri algıla
    const dayMentions = {
      'pazartesi': 1, 'pzt': 1, 'salı': 2, 'sal': 2, 'çarşamba': 3, 'çar': 3,
      'perşembe': 4, 'per': 4, 'cuma': 5, 'cum': 5, 'cumartesi': 6, 'cmt': 6, 'pazar': 0, 'paz': 0
    };

    const mentionedDays = Object.entries(dayMentions).filter(([day]) =>
      message.includes(day)
    ).map(([, dayNum]) => dayNum);

    // Seanslar oluştur
    targetStudents.forEach((student, studentIndex) => {
      const studentGameTypes = mentionedGameTypes.length > 0 ? mentionedGameTypes : Object.keys(gameTypeKeywords);
      const sessionsPerWeek = Math.max(1, Math.min(weeklyFrequency, 7));

      for (let i = 0; i < sessionsPerWeek; i++) {
        const gameType = studentGameTypes[i % studentGameTypes.length];

        let sessionDate: Date;
        if (mentionedDays.length > 0) {
          const dayIndex = i % mentionedDays.length;
          const targetDay = mentionedDays[dayIndex];
          sessionDate = new Date(currentDate);
          const daysUntilTarget = (targetDay - currentDate.getDay() + 7) % 7;
          sessionDate.setDate(currentDate.getDate() + daysUntilTarget);
        } else {
          sessionDate = new Date(currentDate);
          const daysAhead = Math.floor((i * 7) / sessionsPerWeek) + 1;
          sessionDate.setDate(currentDate.getDate() + daysAhead);
        }

        const baseHour = 14 + (studentIndex * 2);
        const sessionHour = baseHour + Math.floor(i / 2);
        sessionDate.setHours(sessionHour, i % 2 === 0 ? 0 : 30, 0, 0);

        const session = {
          id: `ai-chat-${Date.now()}-${studentIndex}-${i}`,
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

    return sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // AI Uzman yanıtları
  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Takvim planlama talebi kontrolü
    const scheduleKeywords = ['planla', 'takvim', 'program', 'zamanla', 'oyun planı', 'seans'];
    const isScheduleRequest = scheduleKeywords.some(keyword => message.includes(keyword));

    if (isScheduleRequest && students.length > 0) {
      const generatedSessions = parseScheduleRequest(userMessage);

      if (generatedSessions.length > 0 && onScheduleGenerated) {
        // Takvim seanslarını üst bileşene gönder
        setTimeout(() => {
          onScheduleGenerated(generatedSessions);
        }, 1000);

        const gameTypes = {
          'count': '🔢 Dikkat Sayma',
          'conflict': '🎨 Çatışma Oyunu',
          'click': '🎯 Dikkat Tıklama',
          'dynamic': '⚡ Dinamik Dikkat',
          'colorRecognition': '📷 AI Renk Tanıma'
        };

        const sessionsText = generatedSessions.map(session =>
          `• ${session.studentName} - ${gameTypes[session.gameType]} (${session.date.toLocaleDateString('tr-TR')} ${session.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})`
        ).join('\n');

        return `✅ Mükemmel! Size ${generatedSessions.length} oyun seansı planladım:\n\n${sessionsText}\n\n🤖 Bu seanslar otomatik olarak takvime eklenecek. Takvim sayfasında mor renkli seanslar olarak görebilirsiniz.\n\n📅 Takvimi açmak için "Hızlı İşlemler" bölümündeki "Oyun Takvimi" butonuna tıklayabilirsiniz.`;
      }

      return `Takvim planlaması için daha detaylı bilgi vermelisiniz. Örneğin:\n\n• "Ahmet için haftada 3 kez sayı oyunları planla"\n• "Her çocuk için günde 20 dakika oyun zamanla"\n• "Pazartesi ve çarşamba dikkat oyunları ekle"\n\nHangi çocuk, hangi oyun türü ve ne sıklıkla oynamak istediğinizi belirtin.`;
    }

    if (message.includes('dikkat') || message.includes('odaklanma')) {
      return `Dikkat gelişimi için şunları önerebilirim:\n\n• Dikkat sprint oyunlarını günde 10-15 dakika oynayın\n• Tek bir aktiviteye odaklanma süresini kademeli olarak artırın\n• Oyun sırasında çevre seslerini minimize edin\n• Başarılı odaklanma anlarını ödüllendirin\n\n${studentName ? `${studentName} için özel olarak, mevcut dikkat süresi verilerinize bakarak daha detaylı öneriler verebilirim.` : ''}`;
    }

    if (message.includes('duygu') || message.includes('mood') || message.includes('üzgün') || message.includes('mutlu')) {
      return `Duygusal gelişim çok önemli. Şunları dikkate alın:\n\n• Oyun sırasındaki duygu değişimlerini takip edin\n• Pozitif duygular hakimken öğrenme daha etkili oluyor\n• Negatif duygular varsa ara verin ve rahatlatıcı aktiviteler yapın\n• Duyguları ifade etmeyi öğretin\n\n${studentName ? `${studentName}'in son oyunlardaki duygu analizlerine göre, genel olarak pozitif bir ruh halinde. Bu harika bir gelişim!` : ''}`;
    }

    if (message.includes('oyun') || message.includes('game') || message.includes('aktivite')) {
      return `Oyun seçimi için önerilerim:\n\n• Çocuğun sevdiği oyun türlerini önceliklendirin\n• Zorluğu kademeli olarak artırın\n• Günde 30-45 dakika ideal oyun süresi\n• Farklı oyun türlerini dengeleyin (sayı, renk, dikkat, kelime)\n\n${studentName ? `${studentName}'in en sevdiği oyun türü verilerinize göre kişisel öneriler hazırlayabilirim.` : ''}`;
    }

    if (message.includes('gelişim') || message.includes('ilerleme') || message.includes('başarı')) {
      return `Gelişim takibi için:\n\n• Haftalık ilerleme grafiklerini düzenli inceleyin\n• Küçük başarıları kutlayın\n• Gerilemeler normaldir, sabırlı olun\n• Uzun vadeli hedefler belirleyin\n\n${studentName ? `${studentName}'in son verilerine bakarak, çok iyi bir ilerleme kaydediyor!` : ''}`;
    }

    if (message.includes('merhaba') || message.includes('selam') || message.includes('hello')) {
      return `Merhaba! Ben PeakFokus AI Uzmanı. ${studentName ? `${studentName}'in gelişimi` : 'Çocuğunuzun gelişimi'} hakkında sorularınızı yanıtlamaya hazırım.\n\nSize şu konularda yardımcı olabilirim:\n• Dikkat gelişimi\n• Duygusal durum\n• Oyun önerileri\n• Gelişim takibi\n• Öğrenme stratejileri\n\nNasıl yardımcı olabilirim?`;
    }

    // Genel yanıt
    return `Anlayabildiğim kadarıyla ${message} konusunda yardım istiyorsunuz.\n\nBen PeakFokus AI Uzmanı olarak şu konularda detaylı yardım sağlayabilirim:\n\n• 🎯 Dikkat ve odaklanma teknikleri\n• 😊 Duygusal gelişim desteği\n• 🎮 Oyun önerileri ve stratejileri\n• 📈 Gelişim takibi ve değerlendirme\n• 🧠 Öğrenme zorluklarına çözümler\n\nDaha spesifik bir soru sorabilirsiniz. ${studentName ? `${studentName}'in` : 'Çocuğunuzun'} hangi konudaki gelişimi hakkında konuşmak istersiniz?`;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // AI yanıtı için 1-2 saniye gecikme
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, Math.random() * 1000 + 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // İlk açılışta hoş geldin mesajı
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Merhaba! Ben PeakFokus AI Uzmanı. ${studentName ? `${studentName}'in gelişimi` : 'Çocuğunuzun gelişimi'} hakkında sorularınızı yanıtlamaya hazırım.\n\nSize nasıl yardımcı olabilirim?`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, studentName]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">AI Uzman Desteği</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto h-[480px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                    message.sender === 'user' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                    <div className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Uzmanımıza sorunuzu yazın..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={2}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, User, Target, Trophy, Clock, Zap } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface FloatingChatButtonProps {
  studentName?: string;
}

interface GameRecommendation {
  id: string;
  name: string;
  description: string;
  reason: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  duration: string;
  focus: string;
  icon: React.ComponentType<any>;
  color: string;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ studentName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showGameRecommendations, setShowGameRecommendations] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Merhaba! Size nasıl yardımcı olabilirim? Aşağıdaki komutları kullanabilirsiniz:',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');

  const quickCommands = [
    { label: 'Oyun önerileri', command: '/oyun-onerileri' },
    { label: 'Gelişim raporu', command: '/gelisim-raporu' },
    { label: 'Dikkat egzersizleri', command: '/dikkat-egzersizleri' },
    { label: 'Motivasyon ipuçları', command: '/motivasyon' },
    { label: 'Problem çözme', command: '/problem-cozme' },
    { label: 'Yardım', command: '/yardim' }
  ];

  // Dikkat verilerine göre oyun önerileri oluştur
  const getGameRecommendations = (): GameRecommendation[] => {
    // Simüle edilmiş performans verileri (gerçek uygulamada API'den gelecek)
    const mockPerformance = {
      averageScore: 78,
      attentionSpan: 12, // dakika
      weakAreas: ['impulse-control', 'sustained-attention'],
      strongAreas: ['selective-attention'],
      recentGames: ['count', 'dynamic']
    };

    const recommendations: GameRecommendation[] = [];

    // Düşük dikkat süresi için öneri
    if (mockPerformance.attentionSpan < 15) {
      recommendations.push({
        id: 'attention-builder',
        name: 'Dikkat Geliştirici',
        description: 'Kademeli olarak dikkat süresini artıran özel egzersizler',
        reason: 'Dikkat süreniz ortalama 12 dakika, hedef 20+ dakika',
        difficulty: 'Orta',
        duration: '8-12 dk',
        focus: 'Sürdürülebilir Dikkat',
        icon: Clock,
        color: 'bg-blue-500'
      });
    }

    // Dürtü kontrolü zayıfsa
    if (mockPerformance.weakAreas.includes('impulse-control')) {
      recommendations.push({
        id: 'impulse-control',
        name: 'Çatışma Oyunu+',
        description: 'Dürtü kontrolünü geliştiren gelişmiş çatışma senaryoları',
        reason: 'Dürtü kontrolü alanında gelişim fırsatı tespit edildi',
        difficulty: 'Orta',
        duration: '10-15 dk',
        focus: 'Dürtü Kontrolü',
        icon: Target,
        color: 'bg-orange-500'
      });
    }

    // Başarı oranı düşükse
    if (mockPerformance.averageScore < 80) {
      recommendations.push({
        id: 'confidence-builder',
        name: 'Başarı Artırıcı',
        description: 'Özgüven artırıcı kolay başlangıçlı oyunlar',
        reason: 'Ortalama başarı %78, motivasyonu artırmak için',
        difficulty: 'Kolay',
        duration: '5-10 dk',
        focus: 'Özgüven Geliştirme',
        icon: Trophy,
        color: 'bg-green-500'
      });
    }

    // Sürdürülebilir dikkat zayıfsa
    if (mockPerformance.weakAreas.includes('sustained-attention')) {
      recommendations.push({
        id: 'sustained-focus',
        name: 'Uzun Süreli Odaklanma',
        description: 'Dikkat süresini punktirici uzun aktiviteler',
        reason: 'Sürdürülebilir dikkat alanında güçlenme gerekli',
        difficulty: 'Zor',
        duration: '15-20 dk',
        focus: 'Sürdürülebilir Dikkat',
        icon: Zap,
        color: 'bg-purple-500'
      });
    }

    // En az 3 öneri göster
    if (recommendations.length < 3) {
      recommendations.push({
        id: 'balanced-training',
        name: 'Dengeli Antrenman',
        description: 'Tüm dikkat türlerini dengeli şekilde geliştiren oyun seti',
        reason: 'Genel performans artışı için öneriliyor',
        difficulty: 'Orta',
        duration: '12-18 dk',
        focus: 'Genel Gelişim',
        icon: Target,
        color: 'bg-indigo-500'
      });
    }

    return recommendations.slice(0, 4);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Oyun önerileri için özel işlem
    if (text === '/oyun-onerileri') {
      setShowGameRecommendations(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // AI yanıtı simülasyonu
    setTimeout(() => {
      const aiResponse = generateAIResponse(text);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const generateAIResponse = (command: string): string => {
    switch (command) {

      case '/gelisim-raporu':
        return `${studentName ? studentName + '\'nin' : 'Çocuğunuzun'} gelişim özeti:\n\n📊 Bu hafta 12 oyun seansı tamamlandı\n⭐ Ortalama başarı: %78\n📈 Dikkat süresi: 15 dakikaya yükseldi\n🎯 En başarılı alan: Sayısal dikkat\n\nDetaylı raporu Analytics sayfasında görüntüleyebilirsiniz.`;

      case '/dikkat-egzersizleri':
        return `Dikkat geliştirici egzersizler:\n\n🧘 Nefes egzersizi (5 dakika)\n👁️ Göz takip egzersizi\n🎵 Ses odaklama egzersizi\n🖐️ El-göz koordinasyonu\n\nHangisini denemek istersiniz?`;

      case '/motivasyon':
        return `Motivasyon ipuçları:\n\n🌟 Küçük başarıları kutlayın\n🎁 Oyun sonrası pozitif pekiştirme verin\n⏰ Düzenli oyun saatleri oluşturun\n👨‍👩‍👧‍👦 Aile olarak oyunlara katılın\n\nMotivasyonu artırmak için hangi yöntemi deneyelim?`;

      case '/problem-cozme':
        return `Yaşadığınız zorluklar için çözümler:\n\n😔 Oyuna isteksizlik → Oyun türünü değiştirin\n⏱️ Kısa dikkat süresi → Oyun süresini kısaltın\n😤 Hayal kırıklığı → Zorluk seviyesini düşürün\n📱 Teknoloji bağımlılığı → Oyunları ödül sistemi yapın\n\nHangi konuda yardıma ihtiyacınız var?`;

      case '/yardim':
        return `Kullanabileceğiniz komutlar:\n\n• /oyun-onerileri - Kişiselleştirilmiş oyun önerileri\n• /gelisim-raporu - Haftalık gelişim özeti\n• /dikkat-egzersizleri - Dikkat geliştirici aktiviteler\n• /motivasyon - Motivasyon artırıcı ipuçları\n• /problem-cozme - Yaşanan zorluklara çözümler\n\nDilediğiniz komutu yazabilir veya doğrudan soru sorabilirsiniz.`;

      default:
        return `Anlıyorum. ${studentName ? studentName + ' hakkında' : 'Çocuğunuz hakkında'} daha spesifik bilgi vermek için lütfen şu komutlardan birini kullanın:\n\n${quickCommands.map(cmd => `• ${cmd.command} - ${cmd.label}`).join('\n')}\n\nYa da doğrudan sorununuzu yazabilirsiniz.`;
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[480px] h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span className="font-medium">AI Asistan</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Commands */}
          <div className="p-4 border-b bg-gray-50">
            <div className="text-sm text-gray-700 mb-3 font-medium">Hızlı Komutlar:</div>
            <div className="grid grid-cols-2 gap-2">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => handleSendMessage(cmd.command)}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-left"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-sm ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.text}</div>
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
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                placeholder="Mesajınızı yazın veya komut kullanın..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Recommendations Popup */}
      {showGameRecommendations && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4"
          onClick={() => setShowGameRecommendations(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    🎯 {studentName ? `${studentName} için` : 'Size'} Özel Oyun Önerileri
                  </h2>
                  <p className="text-blue-100">Performans verileriniz analiz edilerek kişiselleştirilmiş öneriler hazırlandı</p>
                </div>
                <button
                  onClick={() => setShowGameRecommendations(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Mevcut Performans Durumu</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">78%</div>
                  <div className="text-sm text-gray-600">Ortalama Başarı</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-orange-600">12 dk</div>
                  <div className="text-sm text-gray-600">Dikkat Süresi</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">24</div>
                  <div className="text-sm text-gray-600">Bu Hafta Oynanan</div>
                </div>
              </div>
            </div>

            {/* Game Recommendations */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Önerilen Oyunlar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getGameRecommendations().map((game) => {
                  const IconComponent = game.icon;
                  return (
                    <div key={game.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className={`${game.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-800">{game.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              game.difficulty === 'Kolay' ? 'bg-green-100 text-green-700' :
                              game.difficulty === 'Orta' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {game.difficulty}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{game.description}</p>
                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <div className="text-xs text-blue-700 font-medium mb-1">Neden Öneriliyor:</div>
                            <div className="text-sm text-blue-800">{game.reason}</div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>⏱️ {game.duration}</span>
                              <span>🎯 {game.focus}</span>
                            </div>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">
                              Oyna
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t rounded-b-xl">
              <div className="text-sm text-gray-600 text-center">
                💡 <strong>İpucu:</strong> Oyunları düzenli oynamak dikkat becerilerinizi sürekli geliştirir.
                Günde 15-20 dakika yeterlidir.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
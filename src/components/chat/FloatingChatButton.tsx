import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface FloatingChatButtonProps {
  studentName?: string;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ studentName }) => {
  const [isOpen, setIsOpen] = useState(false);
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
    { label: 'Gelişim raporu', command: '/gelisim-raporu' },
    { label: 'Dikkat egzersizleri', command: '/dikkat-egzersizleri' },
    { label: 'Motivasyon ipuçları', command: '/motivasyon' },
    { label: 'Problem çözme', command: '/problem-cozme' },
    { label: 'Yardım', command: '/yardim' }
  ];


  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

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
        return `Kullanabileceğiniz komutlar:\n\n• /gelisim-raporu - Haftalık gelişim özeti\n• /dikkat-egzersizleri - Dikkat geliştirici aktiviteler\n• /motivasyon - Motivasyon artırıcı ipuçları\n• /problem-cozme - Yaşanan zorluklara çözümler\n\n💡 Oyun önerileri için dashboard'daki "Oyun Önerileri" butonunu kullanabilirsiniz.\n\nDilediğiniz komutu yazabilir veya doğrudan soru sorabilirsiniz.`;

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
    </>
  );
};
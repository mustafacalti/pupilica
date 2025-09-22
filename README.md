# PeakFokus AI - DEHB'li (ADHD) Öğrenciler İçin Eğitim Platformu

DEHB'li (ADHD) öğrenciler için yapay zeka destekli eğitim platformu. Bu platform, öğretmenlerin öğrencilerini takip etmesini sağlar ve AI teknolojileri ile kişiselleştirilmiş öğrenme deneyimi sunar.

## 🚀 Özellikler

### 🎯 Ana Özellikler
- **Öğretmen Dashboard'u** - Öğrenci yönetimi ve AI insights ile güçlü takip
- **Öğrenci Oyun Arayüzü** - 5 eğitim oyunu (kelime-resim, sayı, renk)
- **AI Entegrasyonları** - İçerik üretimi, duygu analizi, ses tanıma, zorluk belirleme
- **Analytics Dashboard** - Gerçek zamanlı raporlama

### 🎮 Eğitim Oyunları

#### 1. Dikkat Sayma Oyunu (COUNT GAME)

* **Oyunun Amacı:** Kullanıcının hızlı tepki verme ve odaklanma becerisini geliştirmeyi amaçlar.
* **Oyun Mekaniği:** Ekranda rastgele beliren duygu isimleri karşısında, 60 saniye içinde doğru zamanda boşluk tuşuna basma üzerine kuruludur.
* **Veri Toplama:** Oyun sırasında toplanan veriler şunlardır:
    * **Puan:** Oyuncunun kaç defa doğru tepki verdiğini gösteren nihai skor.
    * **Duygular:** Oyun boyunca ekranda gösterilen duyguların bir listesi. Bu veriler, duygu analizi için kullanılır.
    * **Metrikler:** Oyuncunun oyuna ne kadar odaklandığını (`focusTime`) ve ekrana ne kadar süre baktığını (`gazeDuration`) gösterir.
    * **Başarı Puanı:** Kullanıcının genel performansını yansıtan ve ana dashboard'da gösterilen genel başarı skoru.

#### 2. Dinamik Dikkat (Dynamic Attention Game)

* **Oyunun Amacı:** Kullanıcının seçici dikkatini, reaksiyon süresini ve bilişsel esnekliğini dinamik bir ortamda ölçer ve geliştirir.
* **Oyun Mekaniği:**
    * Oyun, farklı renk ve şekillerdeki hedeflerin ekranda rastgele belirdiği dinamik bir alandır.
    * Oyuncu, yapay zeka tarafından belirlenen kurala (örneğin: "tüm mavi kareleri tıkla") uymak zorundadır.
    * Oyunun zorluğu, oyuncunun performansı ve duygusal durumu gibi metriklerle gerçek zamanlı olarak ayarlanır. Bu, oyun hızının ve hedef-yanıltıcı oranı gibi parametrelerin değişmesiyle gerçekleşir.
* **Veri Toplama:** Oyun, oyuncunun performansını ve davranışını anlamak için ayrıntılı veriler toplar:
    * **Puan ve Doğruluk:** Doğru ve yanlış tıklama sayıları (`correctClicks`, `wrongClicks`) ile genel başarı oranı (`basariOrani`) kaydedilir.
    * **Reaksiyon Süresi:** Oyuncunun bir hedefe ne kadar sürede tıkladığı (`reactionTime`, `avgReactionTimeMs`) milisaniye cinsinden takip edilir.
    * **Duygu Analizi:** Kamera aracılığıyla kullanıcının oyun sırasındaki duyguları (`emotions`) analiz edilir ve kaydedilir`].
    * **Odaklanma Metrikleri:** Bu duygusal verilere dayanarak, oyuncunun odaklanma süresi (`focusTime`) ve ekrana bakma süresi (`gazeDuration`) gibi metrikler hesaplanır.
    * **Hızlı Tıklama Analizi:** Özellikle 3 saniyenin altındaki hızlı tıklamalar (`fastClicks`) analiz edilerek, hızlı tıklama oranı ve doğruluğu gibi daha derin metrikler elde edilir.

#### 3. Dikkat Sayma Oyunu

* **Amaç:** Kullanıcının hızlı tepki verme ve odaklanma becerisini geliştirmeyi amaçlar.
* **Oyun Mekaniği:** Ekranda beliren duygu isimleri karşısında, 60 saniye içinde doğru zamanda boşluk tuşuna basmaya dayanır.
* **Özellikler:** Yapay zeka ile otomatik soru üretimi, 4 seçenekli çoktan seçmeli, 45 saniyelik bir zamanlayıcı, sesli geri bildirim ve emoji/resim kartları içerir.
  
* **Veri Toplama:**
  
* **Toplanan Veriler:** Oyun süresince puan, duygular (mutlu, üzgün, sıkılmış vb.), odaklanma süresi (`focusTime`), ekrana bakma süresi (`gazeDuration`) ve başarı puanı toplanır.
* **Kullanıcı Verileri:** Kullanıcılar için ad, e-posta, rol (öğrenci/öğretmen) ve doğum tarihi gibi bilgiler saklanır.
* **Veritabanı:** Oyun oturumları ve kullanıcı bilgileri bir veritabanında (Google Cloud'da olduğu görülüyor) kaydedilir.
* **Analiz:** Kullanıcı paneli, genel başarı puanlarını (grafik olarak) ve oyun sırasında hissedilen duyguların analizini (pasta grafiği olarak) gösterir.

* ### 4. Renk Tanıma Oyunu
* **Oyun Amacı**: Kullanıcıların hızlı tepki verme ve odaklanma yeteneklerini geliştirmeyi amaçlar.
* **Oyun Mekaniği**: Ekranda rastgele beliren duygu isimleri karşısında, 60 saniye içinde doğru zamanda boşluk tuşuna basmaya dayanır.
* **Teknik Yapı**: Oyun, AI ile otomatik soru üretimi yapar.
    * 4 seçenekli çoktan seçmeli formatı vardır.
    * 45 saniyelik bir zamanlayıcı kullanır.
    * Sesli geri bildirim ve emoji/resim kartları içerir.

    * ** Veri Toplama ve Analiz **

* **Toplanan Veriler**: Oyun sırasında kullanıcının performansına ve davranışına ilişkin veriler toplanır.
    * **Puan**: Doğru tepki sayısını gösteren nihai skor.
    * **Duygular**: Oyun boyunca ekranda gösterilen duygu isimleri listesi, duygu analizi için kullanılır.
    * **Metrikler**: Kullanıcının ne kadar odaklandığını (`focusTime`) ve ekrana ne kadar süre baktığını (`gazeDuration`) gösterir.
    * **Başarı Puanı**: Kullanıcının genel performansını yansıtan ve ana dashboard'da gösterilen genel skorudur.
* **Kullanıcı Dashboard'u**: Kullanıcılar için toplanan verileri gösteren bir arayüzdür.
    * **Genel Başarı Puanı**: Kullanıcıların genel başarı puanları bir çubuk grafikte gösterilir.
    * **Duygu Analizi**: Oyun sırasındaki duygular, bir pasta grafiği ile analiz edilir.


### 5. Hikayeye dikkat oyunu

* **Oyun Başlangıcı**: Kullanıcı oyunun temasını (`adventure`, `space`, `underwater`) seçerek oyunu başlatır. Bu seçim, hikayenin gidişatını belirler. Oyun başladığında, `startGame` fonksiyonu çağrılır ve bu fonksiyon **duygu takibi (`emotion tracking`)** işlemini başlatır.
* **Dinamik Hikaye Oluşturma**: `aiStoryService` kullanılarak yapay zeka tarafından dinamik olarak hikaye sahneleri (`StoryScene`) oluşturulur. Bu sahneler, kullanıcının daha önceki seçimlerine (`lastChoice`), yaşa (`studentAge`) ve toplanan duygu verilerine (`emotionData`) göre şekillenir.
* **Kullanıcı Etkileşimi**: Her sahnede, kullanıcının hikayeyi ilerletmek için seçmesi gereken seçenekler (`choices`) bulunur. Kullanıcı bir seçeneğe tıkladığında, `handleChoiceClick` fonksiyonu tetiklenir ve kullanıcının tepki süresi hesaplanır.
* **Oyun İçi Görevler**:
    * **Arka Plan Görevi (`backgroundTask`)**: Ekranda periyodik olarak beliren bir sembolü yakalamayı gerektirir. Bu, kullanıcının **bölünmüş dikkatini** ölçer. Sembole tıklama (`handleBackgroundSymbolClick`), "çeldirici tıklama" (`distractorClicks`) olarak kaydedilir.
    * **Acil Durum Görevi (`emergencyTask`)**: Aniden ortaya çıkan ve kullanıcının hızlı tepki vermesini gerektiren bir görevdir. Bu, kullanıcının **dürtü kontrolünü** ve **tepki süresini** test eder.

### Dikkat Metriklerinin Hesaplanması

Oyun, kullanıcının performansını ölçmek için çeşitli metrikler toplar ve bunları `attentionData` state'inde saklar. Oyun bittiğinde, `calculateFinalScores` fonksiyonu bu verileri kullanarak son dikkat puanlarını hesaplar.

* **Seçici Dikkat**: Çeldirici tıklamaların sayısına göre hesaplanır (`100 - (distractorClicks * 20)`). Çeldiricilere ne kadar az tıklanırsa puan o kadar yüksek olur.
* **Sürekli Dikkat**: Yanlış cevaplar ve tepki süresine göre hesaplanır (`100 - ((reactionTime.length - correctChoices) * 10)`). Dikkatin devamlılığını ölçer.
* **Bölünmüş Dikkat**: Yine çeldirici tıklamaların sayısına göre hesaplanır (`100 - (distractorClicks * 15)`). Çoklu görev yeteneğini değerlendirir.
* **Dürtü Kontrolü**: Çok hızlı tıklamaların sayısına göre hesaplanır (`reactionTime < 500ms`). Hızlı ve düşünmeden yapılan tıklamalar puanı düşürür.

### Duygu Analizi ve Veritabanı Kaydı

* **Kamera Entegrasyonu**: Oyun, kullanıcıların duygu durumlarını analiz etmek için kamera erişimi ister ve `cameraEmotionService` ile bir Python sunucusuna bağlanır. `startEmotionTracking` fonksiyonu bu süreci başlatır.
* **Duygu Verileri**: `emotionAnalysisService` her sahne için duygu verilerini toplar ve bu veriler daha sonra hikayenin akışını dinamik olarak etkilemek için yapay zekaya gönderilir.
* **Veri Saklama**: Oyun tamamlandığında, hesaplanan tüm dikkat metrikleri (`selectiveAttention`, `sustainedAttention`, `dividedAttention`, `impulseControl` vb.) ve diğer oyun bilgileri (`score`, `duration`, `studentId` gibi), `saveStoryAttentionGameData` fonksiyonu aracılığıyla **Firestore** veritabanına kaydedilir. Bu, öğrencinin performansının izlenmesini sağlar.


### 🤖 AI Özellikleri

#### İçerik Üretimi (Hugging Face API)
- Otomatik soru üretimi
- Kişiselleştirilmiş içerik
- Yaş ve zorluk seviyesine göre uyarlama

#### Duygu Analizi (TensorFlow.js)
- Gerçek zamanlı duygu tanıma
- Kamera tabanlı analiz
- 6 farklı duygu durumu (mutlu, üzgün, kızgın, nötr, kafası karışık, şaşırmış)

#### Ses Tanıma (Web Speech API)
- Sesli cevap verme
- Türkçe dil desteği
- Oyun içi etkileşim

## 🛠️ Teknik Stack

### Frontend
- **React 18** - Modern component yapısı
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library

### Backend & Database
- **Firebase Authentication** - Kullanıcı yönetimi
- **Firestore** - NoSQL veritabanı
- **Firebase Hosting** - Static site hosting

### AI & ML
- **Hugging Face API** - NLP ve content generation
- **TensorFlow.js** - Browser-based ML
- **Web Speech API** - Ses tanıma

### Charts & Analytics
- **Chart.js** - Grafik ve analytics
- **React Chart.js 2** - React wrapper

## 🚀 Kurulum

### 1. Dependencies'i Yükleyin
```bash
npm install
```

### 2. Environment Variables
`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değerleri doldurun:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Hugging Face API
REACT_APP_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

### 3. Uygulamayı Başlatın
```bash
npm start
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📊 Available Scripts

### `npm start`
Geliştirme modunda uygulamayı başlatır.

### `npm test`
Test runner'ı başlatır.

### `npm run build`
Production için build oluşturur.

## 📁 Proje Yapısı

```
src/
├── components/
│   ├── auth/           # Authentication bileşenleri
│   ├── dashboard/      # Dashboard bileşenleri
│   ├── games/          # Oyun bileşenleri
│   ├── ui/            # Genel UI bileşenleri
│   └── ai/            # AI bileşenleri
├── pages/             # Sayfa bileşenleri
├── hooks/             # Custom React hooks
├── services/          # API servis katmanı
├── utils/             # Yardımcı fonksiyonlar
└── types/             # TypeScript type tanımları
```

## 🎨 UI/UX Tasarım

### Renk Paleti
- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)

### Tasarım Prensipleri
- **Accessibility First** - Yüksek kontrast, screen reader uyumlu
- **Mobile Responsive** - Tablet ve mobil cihaz desteği
- **Kolay Kullanım** - Otizmli öğrenciler için basitleştirilmiş UI

## 🤖 AI Features

### Demo-Ready Özellikleri
- **Generate Question** button - Hugging Face API'den yeni soru
- **Live emotion indicator** - Kamera varsa emotion detection
- **Voice interaction** - Mikrofon butonları
- **Real-time charts** - Canlı güncellenen grafikler
- **AI recommendations** - Smart notifications

## 🚢 Deployment

### Firebase Hosting
```bash
npm run build
firebase login
firebase init hosting
firebase deploy
```

---

**PeakFokus AI** - DEHB'li (ADHD) öğrenciler için yapay zeka destekli eğitim platformu 🧠✨

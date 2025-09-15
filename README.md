# NeuroLearn AI - Otizm Eğitim Platformu

Otizmli öğrenciler için yapay zeka destekli eğitim platformu. Bu platform, öğretmenlerin öğrencilerini takip etmesini sağlar ve AI teknolojileri ile kişiselleştirilmiş öğrenme deneyimi sunar.

## 🚀 Özellikler

### 🎯 Ana Özellikler
- **Öğretmen Dashboard'u** - Öğrenci yönetimi ve AI insights
- **Öğrenci Oyun Arayüzü** - 3 eğitim oyunu (kelime-resim, sayı, renk)
- **AI Entegrasyonları** - İçerik üretimi, duygu analizi, ses tanıma
- **Analytics Dashboard** - Gerçek zamanlı raporlama

### 🎮 Eğitim Oyunları

#### 1. Kelime-Resim Eşleştirme
- AI ile otomatik soru üretimi
- 4 seçenekli multiple choice
- Timer (45 saniye)
- Sesli feedback
- Emoji/resim kartları

#### 2. Sayı Öğrenme
- "Kaç tane [nesne] var?" soruları
- Görsel nesneler (emoji'ler)
- Sayı butonları (1-10)
- Sesli cevap verme özelliği

#### 3. Renk Eşleştirme
- Renk kartlarını eşleştirme
- Drag & drop interaction
- Progress feedback

### 🤖 AI Özellikleri

#### İçerik Üretimi (Hugging Face API)
- Otomatik soru üretimi
- Kişiselleştirilmiş içerik
- Yaş ve zorluk seviyesine göre uyarlama

#### Duygu Analizi (TensorFlow.js)
- Gerçek zamanlı duygu tanıma
- Kamera tabanlı analiz
- 6 farklı duygu durumu (mutlu, üzgün, kızgın, nötr, odaklanmış, kafası karışık)

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

**NeuroLearn AI** - Otizmli öğrenciler için yapay zeka destekli eğitim platformu 🧠✨

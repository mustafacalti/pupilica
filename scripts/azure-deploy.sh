#!/bin/bash

# Azure VM'de PeakFocus AI ve Ollama deployment script'i
# Kullanım: bash azure-deploy.sh

set -e

echo "🚀 PeakFocus AI Azure Deployment Başlıyor..."

# Sistem güncelleme
echo "📦 Sistem güncelleniyor..."
sudo apt update && sudo apt upgrade -y

# Node.js kurulum (v20 LTS)
echo "📱 Node.js v20 kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kurulum (process manager)
echo "⚙️ PM2 kuruluyor..."
sudo npm install -g pm2

# Ollama kontrol ve servis durumu
echo "🤖 Ollama servis durumu kontrol ediliyor..."
if systemctl is-active --quiet ollama; then
    echo "✅ Ollama servisi çalışıyor"
else
    echo "🔧 Ollama servisi başlatılıyor..."
    sudo systemctl start ollama
    sudo systemctl enable ollama
fi

# Qwen2 model kontrol
echo "🧠 Qwen2 0.5B model kontrol ediliyor..."
if ollama list | grep -q "qwen2:0.5b"; then
    echo "✅ Qwen2 0.5B modeli mevcut"
else
    echo "📥 Qwen2 0.5B modeli indiriliyor..."
    ollama pull qwen2:0.5b
fi

# Port 11434'ü firewall'da aç
echo "🔥 Firewall port 11434 açılıyor..."
sudo ufw allow 11434/tcp
sudo ufw allow 5173/tcp  # Vite dev server için

# Test Ollama API
echo "🔍 Ollama API testi..."
curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama API çalışıyor" || echo "❌ Ollama API hatası"

# Test Turkish prompt
echo "🇹🇷 Türkçe prompt testi..."
TURKISH_TEST=$(curl -s http://localhost:11434/api/generate -d '{
  "model": "qwen2:0.5b",
  "prompt": "Merhaba, nasılsın? Kısa Türkçe cevap ver:",
  "stream": false,
  "options": {
    "num_predict": 50,
    "temperature": 0.7
  }
}' | jq -r '.response' 2>/dev/null || echo "API test hatası")

echo "🤖 Türkçe yanıt: $TURKISH_TEST"

# Proje dizinini oluştur
PROJECT_DIR="/home/azureuser/pupilica"
echo "📁 Proje dizini: $PROJECT_DIR"

# Git kontrol
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📥 Git repo klonlanıyor..."
    cd /home/azureuser
    # Git repo URL'nizi buraya yazın
    # git clone https://github.com/yourusername/pupilica.git
    echo "⚠️  Git repo URL'si gerekli - manuel olarak klonlayın"
else
    echo "✅ Proje dizini mevcut"
    cd "$PROJECT_DIR"
    git pull origin main 2>/dev/null || echo "⚠️  Git pull hatası - manuel güncelleme gerekebilir"
fi

# Environment dosyasını production için hazırla
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    echo "⚙️ Environment dosyası hazırlanıyor..."

    # .env.production'dan .env.local'a kopyala
    cp .env.production .env.local

    # Node modules yükle
    echo "📦 Dependencies yükleniyor..."
    npm install

    # Build işlemi
    echo "🔨 Production build..."
    npm run build

    # PM2 ile başlat
    echo "🚀 PM2 ile uygulama başlatılıyor..."

    # PM2 ecosystem dosyası oluştur
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'peakfocus-ai',
    script: 'npm',
    args: 'run preview -- --host 0.0.0.0 --port 5173',
    cwd: '/home/azureuser/pupilica',
    env: {
      NODE_ENV: 'production',
      PORT: 5173
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/peakfocus-error.log',
    out_file: '/var/log/peakfocus-out.log',
    log_file: '/var/log/peakfocus-combined.log'
  }]
};
EOF

    # PM2 eski process'i durdur ve yenisini başlat
    pm2 delete peakfocus-ai 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup

    echo "✅ Uygulama PM2 ile başlatıldı"
else
    echo "❌ Proje dizini bulunamadı"
fi

# Nginx kurulum ve konfigürasyon (opsiyonel)
read -p "🌐 Nginx reverse proxy kurulsun mu? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Nginx kuruluyor..."
    sudo apt install -y nginx

    # Nginx config
    sudo tee /etc/nginx/sites-available/peakfocus > /dev/null << 'EOF'
server {
    listen 80;
    server_name teamytu.francecentral.cloudapp.azure.com;

    # PeakFocus AI React App
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Ollama API Proxy
    location /ollama/ {
        proxy_pass http://localhost:11434/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    # Nginx config'i aktifleştir
    sudo ln -sf /etc/nginx/sites-available/peakfocus /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
    sudo systemctl enable nginx

    echo "✅ Nginx reverse proxy kuruldu"
fi

# Status summary
echo ""
echo "🎉 Azure Deployment Tamamlandı!"
echo "======================================"
echo "🌐 Web URL: http://teamytu.francecentral.cloudapp.azure.com"
echo "🤖 Ollama API: http://teamytu.francecentral.cloudapp.azure.com:11434"
echo "📊 PM2 Status: pm2 status"
echo "📋 PM2 Logs: pm2 logs peakfocus-ai"
echo "🔧 Ollama Status: systemctl status ollama"
echo ""
echo "🔍 Test komutları:"
echo "curl http://localhost:11434/api/tags"
echo "curl http://localhost:5173"
echo ""
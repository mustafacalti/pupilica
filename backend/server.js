const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`🌐 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// Ollama API URL - production'da Azure IP'si kullanılacak
const OLLAMA_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'http://172.16.0.4:11434'
  : 'http://localhost:11434';

console.log(`🤖 Ollama Base URL: ${OLLAMA_BASE_URL}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'PeakFocus AI Ollama Proxy',
    timestamp: new Date().toISOString(),
    ollamaUrl: OLLAMA_BASE_URL
  });
});

// Ollama Tags endpoint - available models
app.get('/api/tags', async (req, res) => {
  try {
    console.log('📋 [OLLAMA] Model listesi isteniyor...');

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ollama API hatası: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ [OLLAMA] ${data.models?.length || 0} model bulundu`);

    res.json(data);
  } catch (error) {
    console.error('❌ [OLLAMA] Tags hatası:', error.message);
    res.status(500).json({
      error: 'Ollama servisine erişilemedi',
      details: error.message
    });
  }
});

// Ollama Generate endpoint - text generation
app.post('/api/generate', async (req, res) => {
  try {
    const { model, prompt, stream = false, options = {} } = req.body;

    console.log(`🤖 [OLLAMA] Generate isteği:`, {
      model: model || 'Model belirtilmedi',
      prompt: prompt ? `${prompt.substring(0, 50)}...` : 'Prompt yok',
      stream,
      options
    });

    // Default options for Turkish and CPU optimization
    const defaultOptions = {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: 150,
      top_k: 40,
      ...options
    };

    const requestBody = {
      model: model || 'qwen2:0.5b',
      prompt,
      stream,
      options: defaultOptions
    };

    const startTime = Date.now();

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000 // 30 saniye timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama API hatası: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    console.log(`✅ [OLLAMA] Yanıt alındı (${responseTime}ms):`, {
      responseLength: data.response?.length || 0,
      done: data.done,
      totalDuration: data.total_duration,
      loadDuration: data.load_duration
    });

    res.json(data);
  } catch (error) {
    console.error('❌ [OLLAMA] Generate hatası:', error.message);
    res.status(500).json({
      error: 'Ollama text generation hatası',
      details: error.message
    });
  }
});

// Ollama Chat endpoint - chat completions
app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages, stream = false, options = {} } = req.body;

    console.log(`💬 [OLLAMA] Chat isteği:`, {
      model: model || 'Model belirtilmedi',
      messageCount: messages?.length || 0,
      stream,
      options
    });

    const defaultOptions = {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: 200,
      top_k: 40,
      ...options
    };

    const requestBody = {
      model: model || 'qwen2:0.5b',
      messages,
      stream,
      options: defaultOptions
    };

    const startTime = Date.now();

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 45000 // 45 saniye timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama API hatası: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    console.log(`✅ [OLLAMA] Chat yanıtı alındı (${responseTime}ms):`, {
      responseLength: data.message?.content?.length || 0,
      done: data.done
    });

    res.json(data);
  } catch (error) {
    console.error('❌ [OLLAMA] Chat hatası:', error.message);
    res.status(500).json({
      error: 'Ollama chat hatası',
      details: error.message
    });
  }
});

// Turkish prompt optimizer - Türkçe yanıt için prompt optimize eder
app.post('/api/turkish-generate', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt gerekli' });
    }

    // Türkçe yanıt için optimize edilmiş prompt
    const turkishPrompt = `Sen Türkçe konuşan bir yapay zeka asistanısın. Aşağıdaki talebe SADECE TÜRKÇE olarak kısa ve net bir şekilde cevap ver. İngilizce kelime kullanma.

Talep: ${prompt}

Türkçe Yanıt:`;

    console.log(`🇹🇷 [TURKISH] Türkçe generate isteği:`, {
      originalPrompt: prompt.substring(0, 50) + '...',
      options
    });

    const optimizedOptions = {
      temperature: 0.6, // Daha tutarlı Türkçe için
      top_p: 0.8,
      num_predict: 100, // Kısa yanıt için
      top_k: 30,
      ...options
    };

    const requestBody = {
      model: 'qwen2:0.5b',
      prompt: turkishPrompt,
      stream: false,
      options: optimizedOptions
    };

    const startTime = Date.now();

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 25000
    });

    if (!response.ok) {
      throw new Error(`Ollama API hatası: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    // Yanıtı temizle - sadece Türkçe kısmı al
    let cleanResponse = data.response || '';
    cleanResponse = cleanResponse.replace(/^(Türkçe Yanıt:|Yanıt:)/i, '').trim();
    cleanResponse = cleanResponse.split('\n')[0]; // İlk satırı al

    console.log(`✅ [TURKISH] Türkçe yanıt hazır (${responseTime}ms):`, {
      originalLength: data.response?.length || 0,
      cleanedLength: cleanResponse.length,
      response: cleanResponse
    });

    res.json({
      ...data,
      response: cleanResponse,
      original_response: data.response
    });
  } catch (error) {
    console.error('❌ [TURKISH] Türkçe generate hatası:', error.message);
    res.status(500).json({
      error: 'Türkçe yanıt üretme hatası',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 [SERVER] Beklenmeyen hata:', error);
  res.status(500).json({
    error: 'Server hatası',
    details: process.env.NODE_ENV === 'development' ? error.message : 'İç server hatası'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint bulunamadı',
    availableEndpoints: [
      'GET /health',
      'GET /api/tags',
      'POST /api/generate',
      'POST /api/chat',
      'POST /api/turkish-generate'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 =================================');
  console.log(`🤖 PeakFocus AI Ollama Proxy Server`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔗 Ollama URL: ${OLLAMA_BASE_URL}`);
  console.log(`🇹🇷 Turkish Optimization: Enabled`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  console.log('🚀 =================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 [SERVER] SIGTERM alındı, server kapatılıyor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 [SERVER] SIGINT alındı, server kapatılıyor...');
  process.exit(0);
});
interface StoryScene {
  id: number;
  story: string;
  question: string;
  choices: {
    id: string;
    text: string;
    color?: string;
    isCorrect: boolean;
    isDistractor?: boolean;
    stroopConflict?: boolean;
  }[];
  emergencyTask?: {
    symbol: string;
    duration: number;
    instruction: string;
  };
  backgroundTask?: {
    targetSymbol: string;
    instruction: string;
  };
}

interface AIStoryRequest {
  studentAge: number;
  attentionLevel: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  theme?: string;
  sceneCount?: number;
}

interface AIStoryResponse {
  scenes: StoryScene[];
  difficulty: string;
  estimatedDuration: number;
  theme: string;
}

class AIStoryService {
  private apiEndpoint = import.meta.env.VITE_AI_STORY_API || 'http://localhost:11434/api/generate';
  private fallbackScenes: StoryScene[] = [
    {
      id: 1,
      story: "Ali büyülü bir ormana girdi. Önünde iki kapı belirdi.",
      question: "Ali hangi kapıyı seçmeli?",
      choices: [
        { id: 'a', text: '🟢 Yeşil Kapı', color: '#10B981', isCorrect: true },
        { id: 'b', text: '🔴 Kırmızı Kapı', color: '#EF4444', isCorrect: false },
        { id: 'c', text: '🎁 Parlak Kutu', color: '#F59E0B', isCorrect: false, isDistractor: true }
      ]
    },
    {
      id: 2,
      story: "Ali doğru renge sahip kapıdan geçmeli.",
      question: "Hangi seçenek doğru RENGE sahip?",
      choices: [
        { id: 'a', text: 'MAVİ', color: '#EF4444', isCorrect: false, stroopConflict: true },
        { id: 'b', text: 'KIRMIZI', color: '#3B82F6', isCorrect: false, stroopConflict: true },
        { id: 'c', text: 'YEŞİL', color: '#10B981', isCorrect: true },
        { id: 'd', text: '💎 Elmas', color: '#8B5CF6', isCorrect: false, isDistractor: true }
      ]
    },
    {
      id: 3,
      story: "Ali köprüden geçerken dikkatli olmalı. Tehlikeli yaratıklar var!",
      question: "Ali hangi köprüyü seçmeli?",
      choices: [
        { id: 'a', text: '🌉 Güvenli Köprü', isCorrect: true },
        { id: 'b', text: '⚡ Yıldırım Köprü', isCorrect: false },
        { id: 'c', text: '🍭 Şeker Köprü', isCorrect: false, isDistractor: true }
      ],
      backgroundTask: {
        targetSymbol: '🐍',
        instruction: 'Yılan göründüğünde DOKUNMA!'
      }
    },
    {
      id: 4,
      story: "Ejderha aniden ortaya çıktı! Hızla kaçmak gerekiyor!",
      question: "Acil durum! Ne yapmalı?",
      choices: [
        { id: 'a', text: '🏃‍♂️ KAÇ', isCorrect: true },
        { id: 'b', text: '⚔️ SAVAŞ', isCorrect: false },
        { id: 'c', text: '🎪 DANS ET', isCorrect: false, isDistractor: true }
      ],
      emergencyTask: {
        symbol: '🚨',
        duration: 2000,
        instruction: 'HIZLA KAÇ butonuna bas!'
      }
    },
    {
      id: 5,
      story: "Ali hazine odasına ulaştı. Doğru renkteki sandığı seçmeli.",
      question: "Hangi renk yazısı doğru renkte yazılmış?",
      choices: [
        { id: 'a', text: 'SARI', color: '#10B981', isCorrect: false, stroopConflict: true },
        { id: 'b', text: 'PEMBE', color: '#EC4899', isCorrect: true },
        { id: 'c', text: 'TURUNCU', color: '#3B82F6', isCorrect: false, stroopConflict: true },
        { id: 'd', text: '🌟 Yıldız', color: '#F59E0B', isCorrect: false, isDistractor: true }
      ]
    },
    {
      id: 6,
      story: "Ali büyücünün testine girdi. Aynı anda iki işi yapması gerekiyor!",
      question: "Ali hangi büyüyü seçmeli?",
      choices: [
        { id: 'a', text: '✨ İyileştirme Büyüsü', isCorrect: true },
        { id: 'b', text: '💥 Patlama Büyüsü', isCorrect: false },
        { id: 'c', text: '🎭 Yanılsama Büyüsü', isCorrect: false, isDistractor: true }
      ],
      backgroundTask: {
        targetSymbol: '🦉',
        instruction: 'Baykuş göründüğünde DOKUNMA!'
      }
    }
  ];

  async generateStory(request: AIStoryRequest): Promise<AIStoryResponse> {
    try {
      // AI servisi ile deneyelim - timeout artırıldı
      const response = await this.callAIService(request);
      if (response.scenes && response.scenes.length > 0) {
        return response;
      }

      // AI servisi başarısız olursa fallback kullan
      console.warn('AI service returned empty scenes, using fallback');
      return this.generateFallbackStory(request);
    } catch (error) {
      console.warn('AI Story Service failed, using fallback:', error);
      return this.generateFallbackStory(request);
    }
  }

  private async callAIService(request: AIStoryRequest): Promise<AIStoryResponse> {
    const prompt = this.constructPrompt(request);

    // Ollama API çağrısı - timeout kaldırıldı
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'hf.co/umutkkgz/Kaira-Turkish-Gemma-9B-T1-GGUF:Q3_K_M', // Türkçe Gemma model
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2000 // Token limitini artırdık
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama error response:', errorText);
      throw new Error(`Ollama Service responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Ollama response:', data);
    return this.parseOllamaResponse(data, request);
  }

  private constructPrompt(request: AIStoryRequest): string {
    return `${request.studentAge} yaşındaki bir çocuk için Türkçe hikaye oyunu oluştur. ${request.sceneCount || 4} sahne olsun.

Tema: ${request.theme || 'Ali\'nin maceraları'}

Her sahne için:
- Kısa hikaye (1-2 cümle)
- Soru
- 3-4 seçenek (1 doğru, diğerleri yanlış, bazıları çeldirici)

JSON formatında döndür:
{
  "scenes": [
    {
      "id": 1,
      "story": "Ali ormana girdi.",
      "question": "Hangi yolu seçmeli?",
      "choices": [
        {"id": "a", "text": "🟢 Yeşil yol", "isCorrect": true},
        {"id": "b", "text": "🔴 Kırmızı yol", "isCorrect": false},
        {"id": "c", "text": "💎 Parlayan taş", "isCorrect": false, "isDistractor": true}
      ]
    }
  ]
}

Sadece JSON döndür, başka açıklama yazma.`;
  }

  private parseOllamaResponse(ollamaData: any, request: AIStoryRequest): AIStoryResponse {
    try {
      // Ollama response formatından hikaye verisini çıkar
      const responseText = ollamaData.response || '';
      console.log('Full Ollama response text:', responseText);

      // JSON formatındaki hikaye verisini bul - daha esnek regex
      let jsonMatch = responseText.match(/\{[\s\S]*?"scenes"[\s\S]*?\]/);

      if (!jsonMatch) {
        // İkinci deneme: sadece scenes array'ini bul
        jsonMatch = responseText.match(/"scenes":\s*\[[\s\S]*?\]/);
        if (jsonMatch) {
          jsonMatch[0] = `{${jsonMatch[0]}}`;
        }
      }

      if (!jsonMatch) {
        console.error('No valid JSON found in response');
        throw new Error('No JSON found in Ollama response');
      }

      let jsonText = jsonMatch[0];

      // Eksik kapatma parantezlerini düzelt
      if (!jsonText.endsWith('}')) {
        // Son sahnenin kapanmamış olma durumu
        const lastSceneIndex = jsonText.lastIndexOf('{');
        if (lastSceneIndex > -1) {
          // Son sahneyi kapa
          jsonText = jsonText.substring(0, lastSceneIndex) + ']}';
        }
      }

      console.log('Parsed JSON text:', jsonText);

      const parsedData = JSON.parse(jsonText);
      const scenes = parsedData.scenes || [];

      return {
        scenes: scenes.map((scene: any, index: number) => ({
          id: scene.id || index + 1,
          story: scene.story || `Sahne ${index + 1}`,
          question: scene.question || 'Ne yapmalı?',
          choices: scene.choices?.map((choice: any, choiceIndex: number) => ({
            id: choice.id || String.fromCharCode(97 + choiceIndex), // 'a', 'b', 'c'...
            text: choice.text || `Seçenek ${choiceIndex + 1}`,
            color: choice.color,
            isCorrect: choice.isCorrect || false,
            isDistractor: choice.isDistractor || false,
            stroopConflict: choice.stroopConflict || false
          })) || [
            { id: 'a', text: '🟢 Devam et', isCorrect: true, isDistractor: false, stroopConflict: false },
            { id: 'b', text: '🔴 Dur', isCorrect: false, isDistractor: false, stroopConflict: false }
          ],
          emergencyTask: scene.emergencyTask,
          backgroundTask: scene.backgroundTask
        })),
        difficulty: this.calculateDifficulty(request.attentionLevel),
        estimatedDuration: (request.sceneCount || 4) * 90,
        theme: request.theme || 'Adventure'
      };
    } catch (error) {
      console.error('Failed to parse Ollama response:', error);
      console.error('Original response:', ollamaData);
      throw error;
    }
  }

  private parseAIResponse(aiData: any, request: AIStoryRequest): AIStoryResponse {
    try {
      // AI yanıtını parse et ve StoryScene formatına dönüştür
      const scenes = aiData.scenes || aiData.content?.scenes || [];

      return {
        scenes: scenes.map((scene: any, index: number) => ({
          id: scene.id || index + 1,
          story: scene.story || '',
          question: scene.question || '',
          choices: scene.choices?.map((choice: any, choiceIndex: number) => ({
            id: choice.id || String.fromCharCode(97 + choiceIndex), // 'a', 'b', 'c'...
            text: choice.text || '',
            color: choice.color,
            isCorrect: choice.isCorrect || false,
            isDistractor: choice.isDistractor || false,
            stroopConflict: choice.stroopConflict || false
          })) || [],
          emergencyTask: scene.emergencyTask,
          backgroundTask: scene.backgroundTask
        })),
        difficulty: this.calculateDifficulty(request.attentionLevel),
        estimatedDuration: (request.sceneCount || 4) * 90, // seconds per scene
        theme: request.theme || 'Adventure'
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw error;
    }
  }

  private generateFallbackStory(request: AIStoryRequest): AIStoryResponse {
    // Yaşa uygun sahneleri filtrele ve seç
    let selectedScenes = this.fallbackScenes;

    if (request.sceneCount && request.sceneCount < this.fallbackScenes.length) {
      selectedScenes = this.fallbackScenes.slice(0, request.sceneCount);
    }

    // Yaşa göre zorluğu ayarla
    if (request.studentAge < 6) {
      // Küçük çocuklar için basitleştir
      selectedScenes = selectedScenes.map(scene => ({
        ...scene,
        choices: scene.choices.filter(choice => !choice.stroopConflict || choice.isCorrect),
        emergencyTask: undefined // Acil görevleri kaldır
      }));
    }

    return {
      scenes: selectedScenes,
      difficulty: this.calculateDifficulty(request.attentionLevel),
      estimatedDuration: selectedScenes.length * 90,
      theme: request.theme || 'Macera'
    };
  }

  private calculateDifficulty(level: string): string {
    switch (level) {
      case 'beginner': return 'Kolay';
      case 'intermediate': return 'Orta';
      case 'advanced': return 'Zor';
      default: return 'Orta';
    }
  }

  // Hikaye şablonları oluştur
  generateTemplate(theme: string, age: number): Partial<AIStoryRequest> {
    const templates = {
      'adventure': {
        theme: 'Ali\'nin büyülü orman macerası',
        sceneCount: age < 6 ? 3 : age < 8 ? 4 : 6
      },
      'space': {
        theme: 'Uzay kahramanı Aylin\'in gezegen keşfi',
        sceneCount: age < 6 ? 3 : age < 8 ? 4 : 6
      },
      'underwater': {
        theme: 'Denizaltı kaşifi Cem\'in okyanus yolculuğu',
        sceneCount: age < 6 ? 3 : age < 8 ? 4 : 6
      }
    };

    return templates[theme as keyof typeof templates] || templates.adventure;
  }
}

export const aiStoryService = new AIStoryService();
export type { StoryScene, AIStoryRequest, AIStoryResponse };
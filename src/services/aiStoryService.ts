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

interface DynamicSceneRequest {
  studentAge: number;
  theme: string;
  previousStory?: string;
  userChoice?: string;
  sceneNumber: number;
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

  // Dinamik sahne oluşturma - her seçimden sonra çağrılır
  async generateNextScene(request: DynamicSceneRequest): Promise<StoryScene> {
    try {
      const response = await this.callDynamicSceneService(request);
      return response;
    } catch (error) {
      console.warn('Dynamic scene generation failed, using fallback:', error);
      return this.generateFallbackScene(request);
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
        model: 'alibayram/turkish-gemma-9b-v0.1:latest', // Colab'daki model
        prompt: prompt,
        stream: false,
        options: {
          num_ctx: 2048,
          num_batch: 256,
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1
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

  private async callDynamicSceneService(request: DynamicSceneRequest): Promise<StoryScene> {
    const prompt = this.constructDynamicPrompt(request);

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'alibayram/turkish-gemma-9b-v0.1:latest',
        prompt: prompt,
        stream: false,
        options: {
          num_ctx: 1024,
          num_batch: 256,
          temperature: 0.8, // Biraz daha yaratıcı olsun
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dynamic scene error:', errorText);
      throw new Error(`Dynamic Scene Service error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Dynamic scene response:', data);
    return this.parseDynamicSceneResponse(data, request);
  }

  private constructDynamicPrompt(request: DynamicSceneRequest): string {
    let prompt = `${request.studentAge} yaşındaki çocuk için ${request.theme} temalı hikaye devamı oluştur.

Sahne ${request.sceneNumber}:`;

    if (request.previousStory && request.userChoice) {
      prompt += `
Önceki durum: ${request.previousStory}
Çocuğun seçimi: ${request.userChoice}

Bu seçime göre hikayeyi devam ettir.`;
    } else {
      prompt += `
Bu hikayenin başlangıç sahnesi. Çocuk için ilginç bir durumla başla.`;
    }

    prompt += `

Tek bir sahne JSON'ı döndür:
{
  "id": ${request.sceneNumber},
  "story": "Kısa hikaye (1-2 cümle)",
  "question": "Çocuğa soru?",
  "choices": [
    {"id": "a", "text": "🟢 Seçenek 1", "isCorrect": true},
    {"id": "b", "text": "🔴 Seçenek 2", "isCorrect": false},
    {"id": "c", "text": "💎 Çeldirici seçenek", "isCorrect": false, "isDistractor": true}
  ]
}

Sadece JSON döndür.`;

    return prompt;
  }

  private parseDynamicSceneResponse(data: any, request: DynamicSceneRequest): StoryScene {
    try {
      const responseText = data.response || '';
      console.log('Dynamic scene response text:', responseText);

      // JSON temizleme
      let cleanedText = responseText;
      if (cleanedText.includes('```json')) {
        cleanedText = cleanedText.replace(/```json\s*/, '');
      }
      if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```\s*$/, '');
      }

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in dynamic scene response');
      }

      let jsonText = jsonMatch[0];
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
      jsonText = jsonText.trim();

      console.log('Parsed dynamic scene JSON:', jsonText);

      const scene = JSON.parse(jsonText);

      return {
        id: scene.id || request.sceneNumber,
        story: scene.story || `Sahne ${request.sceneNumber}`,
        question: scene.question || 'Ne yapmalı?',
        choices: scene.choices?.map((choice: any, index: number) => ({
          id: choice.id || String.fromCharCode(97 + index),
          text: choice.text || `Seçenek ${index + 1}`,
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
      };
    } catch (error) {
      console.error('Dynamic scene parse error:', error);
      throw error;
    }
  }

  private generateFallbackScene(request: DynamicSceneRequest): StoryScene {
    const fallbackScenes = [
      {
        story: `Ali yeni bir yola çıktı. (Sahne ${request.sceneNumber})`,
        question: 'Hangi yönde gitmeli?',
        choices: [
          { id: 'a', text: '🟢 Sağa git', isCorrect: true },
          { id: 'b', text: '🔴 Sola git', isCorrect: false },
          { id: 'c', text: '💎 Parlak taş', isCorrect: false, isDistractor: true }
        ]
      },
      {
        story: `Ali ilginç bir yaratıkla karşılaştı. (Sahne ${request.sceneNumber})`,
        question: 'Ne yapmalı?',
        choices: [
          { id: 'a', text: '🟢 Dostça yaklaş', isCorrect: true },
          { id: 'b', text: '🔴 Kaç', isCorrect: false },
          { id: 'c', text: '🎁 Hediye ver', isCorrect: false, isDistractor: true }
        ]
      }
    ];

    const scene = fallbackScenes[request.sceneNumber % 2];

    return {
      id: request.sceneNumber,
      story: scene.story,
      question: scene.question,
      choices: scene.choices.map((choice, index) => ({
        ...choice,
        isDistractor: choice.isDistractor || false,
        stroopConflict: false
      }))
    };
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

      // ```json ve ``` etiketlerini temizle
      let cleanedText = responseText;
      if (cleanedText.includes('```json')) {
        cleanedText = cleanedText.replace(/```json\s*/, '');
      }
      if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```\s*$/, '');
      }

      // JSON formatındaki hikaye verisini bul
      let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.error('No valid JSON found in response');
        throw new Error('No JSON found in Ollama response');
      }

      let jsonText = jsonMatch[0];

      // Trailing comma'ları temizle
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

      // JSON'ı düzelt ve temizle
      jsonText = jsonText.trim();

      console.log('Cleaned JSON text:', jsonText);

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
export type { StoryScene, AIStoryRequest, AIStoryResponse, DynamicSceneRequest };
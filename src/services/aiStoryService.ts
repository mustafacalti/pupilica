interface StoryScene {
  id: number;
  story: string;
  question: string;
  choices: {
    id: string;
    text: string;
    color?: string;
    mood: string;
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
  emotionData?: string;
}

interface AIStoryResponse {
  scenes: StoryScene[];
  difficulty: string;
  estimatedDuration: number;
  theme: string;
}

class AIStoryService {
  private apiEndpoint = '/ollama/generate';
  private fallbackScenes: StoryScene[] = [
    {
      id: 1,
      story: "Ali büyülü bir ormana girdi. Önünde iki kapı belirdi.",
      question: "Ali hangi kapıyı seçmeli?",
      choices: [
        { id: 'a', text: '🟢 Yeşil Kapı', color: '#10B981', mood: 'maceracı' },
        { id: 'b', text: '🔴 Kırmızı Kapı', color: '#EF4444', mood: 'temkinli' }
      ]
    },
    {
      id: 2,
      story: "Ali doğru renge sahip kapıdan geçmeli.",
      question: "Hangi seçenek doğru RENGE sahip?",
      choices: [
        { id: 'a', text: 'MAVİ', color: '#EF4444', mood: 'dikkatli', stroopConflict: true },
        { id: 'b', text: 'YEŞİL', color: '#10B981', mood: 'meraklı' }
      ]
    },
    {
      id: 3,
      story: "Ali köprüden geçerken dikkatli olmalı. Tehlikeli yaratıklar var!",
      question: "Ali hangi köprüyü seçmeli?",
      choices: [
        { id: 'a', text: '🌉 Güvenli Köprü', mood: 'sakin' },
        { id: 'b', text: '⚡ Yıldırım Köprü', mood: 'cesur' }
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
        { id: 'a', text: '🏃‍♂️ KAÇ', mood: 'temkinli' },
        { id: 'b', text: '⚔️ SAVAŞ', mood: 'cesur' }
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
        { id: 'a', text: 'SARI', color: '#10B981', mood: 'dikkatli', stroopConflict: true },
        { id: 'b', text: 'PEMBE', color: '#EC4899', mood: 'meraklı' }
      ]
    },
    {
      id: 6,
      story: "Ali büyücünün testine girdi. Aynı anda iki işi yapması gerekiyor!",
      question: "Ali hangi büyüyü seçmeli?",
      choices: [
        { id: 'a', text: '✨ İyileştirme Büyüsü', mood: 'sakin' },
        { id: 'b', text: '💥 Patlama Büyüsü', mood: 'maceracı' }
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
        model: 'gemma2:2b',
        prompt: prompt,
        stream: false,
        options: {
          num_ctx: 2048,
          num_batch: 512,
          num_predict: 200, // Daha uzun hikaye için biraz fazla
          temperature: 0.6,
          top_p: 0.8,
          repeat_penalty: 1.1,
          stop: ["}]}", "```"]
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
        model: 'gemma2:2b',
        prompt: prompt,
        stream: false,
        options: {
          num_ctx: 512, // Küçültüldü - eski context'i unutsun
          num_batch: 256,
          num_predict: 250, // JSON tamamlanması için artırıldı
          temperature: 0.4,
          top_p: 0.6,
          top_k: 20,
          repeat_penalty: 1.2, // Tekrarı önlemek için artırıldı
          // stop: ["}]}", "```"], // Stop token'ları kaldırıldı
          num_thread: 4,
          seed: Math.floor(Math.random() * 1000000) // Random seed - cache'i boz
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

    // Emotion data integration
    if (request.emotionData) {
      prompt += `

KAMERA VERİSİ - ÇOCUĞUN DUYGUSAL DURUMU (Son sahne boyunca):
${request.emotionData}

DİKKAT: Bu emotion data'dan çok boyutlu analiz yap:

DUYGUSAL DURUM ANALİZİ:
- Hangi duygu baskın? Son trend nasıl?
- Emotion stabilite: Sabit mi değişken mi?
- Pozitif/negatif emotion dengesi?

ÖĞRENME STİLİ ÇIKARIMI:
- confused→happy geçişi = Yavaş öğrenen ama başarılı mı?
- happy→bored pattern = Hızla sıkılan, challenge isteyen mi?
- surprised spike'ları = Yenilikçi görevleri seven mi?

MOTİVASYON/STRES ANALİZİ:
- İçsel motivasyon: happy/neutral dominant mı?
- Frustration tolerance: angry/confused nasıl?
- Kaygı seviyesi: emotion volatility yüksek mi?

HİKAYE ADAPTASYONU:
Bu analizlere göre hikaye yolunu belirle:
- Mutlu/heyecanlı ise: Momentum sürdürecek, biraz daha heyecanlı macera
- Kafa karışık/yorgun ise: Basit, net hikaye, az seçenek
- Odaklanmış ise: Bu durumu koruyacak dengeli macera
- Stresli/sinirli ise: Sakinleştirici, pozitif, başarıya odaklı hikaye yolu

Çocuğun mevcut duygusal durumuna uygun hikaye yolunu seç.`;
    }

    prompt += `

MOOD BELİRLEME:
Emotion analizine göre uygun mood'ları seç:
- Mutlu/Heyecanlı → "maceracı", "cesur"
- Sakin/Yorgun → "sakin", "temkinli"
- Meraklı/Odaklı → "meraklı", "dikkatli"
- Karışık/Stresli → "sakin", "temkinli"

Tek bir sahne JSON'ı döndür:
{
  "id": ${request.sceneNumber},
  "story": "Kısa hikaye (1-2 cümle)",
  "question": "Çocuğa soru?",
  "choices": [
    {"id": "a", "text": "🟢 Seçenek 1", "mood": "EMOTION_ANALİZİNE_GÖRE_BELİRLE"},
    {"id": "b", "text": "🔴 Seçenek 2", "mood": "EMOTION_ANALİZİNE_GÖRE_BELİRLE"}
  ]
}

Mood seçenekleri: maceracı, temkinli, meraklı, sakin, cesur, dikkatli
Sadece JSON döndür.`;

    return prompt;
  }

  private parseDynamicSceneResponse(data: any, request: DynamicSceneRequest): StoryScene {
    try {
      const responseText = data.response || '';
      console.log('Dynamic scene response text:', responseText);

      // JSON temizleme - sadece ilk JSON'ı al
      let cleanedText = responseText;

      // ```json ve ``` temizle
      cleanedText = cleanedText.replace(/```json\s*/g, '');
      cleanedText = cleanedText.replace(/```[\s\S]*/g, '');

      // İlk JSON objesini bul
      const jsonMatch = cleanedText.match(/\{[^{}]*\{[^{}]*\}[^{}]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in dynamic scene response');
      }

      let jsonText = jsonMatch[0];

      // JSON'dan sonraki açıklamaları temizle
      const jsonEndIndex = jsonText.lastIndexOf('}');
      if (jsonEndIndex > 0) {
        jsonText = jsonText.substring(0, jsonEndIndex + 1);
      }

      // Eksik JSON'ı akıllıca tamamla - artık sadece 2 choice var
      if (jsonText.includes('"choices": [')) {
        // Eksik ikinci choice'u tamamla
        const choicesPattern = /"choices":\s*\[\s*{[^}]*}[^}\]]*$/;
        if (choicesPattern.test(jsonText)) {
          // İkinci choice eksik, basit bir tane ekle
          const lastBraceIndex = jsonText.lastIndexOf('}');
          if (lastBraceIndex > 0) {
            jsonText = jsonText.substring(0, lastBraceIndex + 1);
            jsonText += ',{"id":"b","text":"🔴 Devam et","mood":"sakin"}]';
          }
        }

        // Array'i kapat
        if (!jsonText.endsWith(']}')) {
          if (!jsonText.endsWith(']')) {
            jsonText += ']';
          }
          if (!jsonText.endsWith('}')) {
            jsonText += '}';
          }
        }
      }

      // isCorrect varsa hata ver - artık mood kullanması gerekiyor
      if (jsonText.includes('"isCorrect"')) {
        throw new Error('Model hala isCorrect kullanıyor, mood kullanması gerekiyor');
      }

      // Trailing comma'ları temizle
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
          mood: choice.mood || 'normal',
          isDistractor: choice.isDistractor || false,
          stroopConflict: choice.stroopConflict || false
        })) || [
          { id: 'a', text: '🟢 Devam et', mood: 'normal', isDistractor: false, stroopConflict: false },
          { id: 'b', text: '🔴 Dur', mood: 'temkinli', isDistractor: false, stroopConflict: false }
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
          { id: 'a', text: '🟢 Sağa git', mood: 'maceracı' },
          { id: 'b', text: '🔴 Sola git', mood: 'temkinli' }
        ]
      },
      {
        story: `Ali ilginç bir yaratıkla karşılaştı. (Sahne ${request.sceneNumber})`,
        question: 'Ne yapmalı?',
        choices: [
          { id: 'a', text: '🟢 Dostça yaklaş', mood: 'cesur' },
          { id: 'b', text: '🔴 Kaç', mood: 'dikkatli' }
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
        isDistractor: false,
        stroopConflict: false
      }))
    };
  }

  private constructPrompt(request: AIStoryRequest): string {
    return `${request.studentAge} yaş çocuk için hikaye. ${request.sceneCount || 4} sahne.

Tema: ${request.theme || 'Ali macera'}

ÖNEMLİ: mood field kullan, isCorrect kullanma!

{"scenes":[{"id":1,"story":"Hikaye","question":"Soru?","choices":[{"id":"a","text":"🟢 Seçenek","mood":"maceracı"},{"id":"b","text":"🔴 Seçenek","mood":"sakin"}]}]}

Mood: maceracı,temkinli,meraklı,sakin,cesur,dikkatli`;
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
            mood: choice.mood || 'normal',
            isDistractor: choice.isDistractor || false,
            stroopConflict: choice.stroopConflict || false
          })) || [
            { id: 'a', text: '🟢 Devam et', mood: 'normal', isDistractor: false, stroopConflict: false },
            { id: 'b', text: '🔴 Dur', mood: 'temkinli', isDistractor: false, stroopConflict: false }
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
            mood: choice.mood || 'normal',
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
        choices: scene.choices.filter(choice => !choice.stroopConflict),
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
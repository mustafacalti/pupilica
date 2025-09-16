import { GameQuestion, QuestionGenerationContext, EmotionResult } from '../types';
import { performanceTracker } from './performanceTracker';
import { ollamaService, OllamaQuestionRequest } from './ollamaService';

class AdaptiveQuestionGenerator {

  async generateAdaptiveQuestion(context: QuestionGenerationContext): Promise<GameQuestion> {
    console.log('🧠 [ADAPTIVE DEBUG] generateAdaptiveQuestion çağrıldı:', {
      gameType: context.gameType,
      studentAge: context.studentAge,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 5).join('\n')
    });

    const { performance, currentEmotion, gameType, studentAge } = context;

    // Determine adaptation strategy
    const adaptationStrategy = this.determineAdaptationStrategy(performance, currentEmotion);

    // Generate question based on game type and adaptation
    switch (gameType) {
      case 'word-image':
        return this.generateAdaptiveWordImageQuestion(context, adaptationStrategy);
      case 'number':
        return this.generateAdaptiveNumberQuestion(context, adaptationStrategy);
      case 'color':
        return this.generateAdaptiveColorQuestion(context, adaptationStrategy);
      case 'attention-sprint':
        // Attention sprint oyunu için özel handling gerekmiyor
        // AttentionSprintGame kendi servisini kullanır
        throw new Error('Attention sprint oyunu AttentionSprintGenerator kullanır');
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }
  }

  private determineAdaptationStrategy(
    performance: any,
    currentEmotion?: EmotionResult
  ): 'encourage' | 'challenge' | 'simplify' | 'refocus' | 'energize' {
    const recentAverage = performance.recentScores.length > 0
      ? performance.recentScores.slice(-3).reduce((a: number, b: number) => a + b, 0) / Math.min(3, performance.recentScores.length)
      : 0.5;

    // ADHD için özel strateji belirleme

    // Çok iyi performans - dikkat dağılmasını önlemek için motivasyonu koruyarak zorlaştır
    if (recentAverage >= 0.8 && currentEmotion?.emotion === 'happy') {
      return 'challenge';
    }

    // İyi performans ama muhtemelen sıkılma başlangıcı - enerjilendir
    if (recentAverage >= 0.6 && recentAverage < 0.8) {
      return 'energize';
    }

    // Düşük performans - dikkat dağınıklığı var, basitleştir ve odaklan
    if (recentAverage <= 0.4 || currentEmotion?.emotion === 'sad') {
      return 'simplify';
    }

    // Karışıklık durumu - ADHD'de sık, yeniden odaklanma gerekli
    if (currentEmotion?.emotion === 'confused') {
      return 'refocus';
    }

    // Varsayılan: ADHD çocukları için sürekli pozitif pekiştirme
    return 'encourage';
  }

  private async generateAdaptiveWordImageQuestion(
    context: QuestionGenerationContext,
    strategy: string
  ): Promise<GameQuestion> {
    const { performance, studentAge } = context;

    // Determine subject based on age and strategy
    const subject = this.getSubjectForWordImage(studentAge, strategy);
    const difficulty = this.mapDifficultyToTurkish(performance.currentDifficulty);

    try {
      // Use Ollama to generate question
      const ollamaRequest: OllamaQuestionRequest = {
        subject: subject,
        difficulty: difficulty,
        questionType: 'çoktan seçmeli'
      };

      const generatedQuestion = await ollamaService.generateQuestion(ollamaRequest);

      return {
        ...generatedQuestion,
        difficulty: performance.currentDifficulty,
        adaptedFor: strategy === 'challenge' ? 'success' : strategy === 'simplify' ? 'struggle' : 'confusion',
        gameType: 'word-image'
      };
    } catch (error) {
      console.error('Ollama question generation failed, using adaptive fallback:', error);
    }

    // Fallback to enhanced traditional generation
    return this.generateAdaptiveFallbackWordImage(strategy, performance.currentDifficulty, studentAge);
  }

  private buildWordImagePrompt(strategy: string, difficulty: string, age: number): string {
    const difficultyAdjectives = {
      easy: 'very simple',
      medium: 'moderately challenging',
      hard: 'challenging'
    };

    const strategyInstructions = {
      encourage: 'Create an encouraging and positive question',
      challenge: 'Create a more challenging question to push the student',
      simplify: 'Create a very simple and confidence-building question',
      refocus: 'Create a clear, focused question without distractions'
    };

    return `Generate a ${difficultyAdjectives[difficulty as keyof typeof difficultyAdjectives]} word-image matching question for a ${age}-year-old child. ${strategyInstructions[strategy as keyof typeof strategyInstructions]}.

Format the response as:
Question: [question text]
Options: [option1, option2, option3, option4]
Correct: [index of correct answer 0-3]

Example:
Question: Which animal says "woof woof"?
Options: 🐶, 🐱, 🐸, 🦋
Correct: 0

Topic should be about animals, fruits, or vehicles. Use simple emojis as options.`;
  }

  private parseAIQuestionResponse(response: string, gameType: string): GameQuestion | null {
    try {
      const lines = response.split('\n').filter(line => line.trim());

      let question = '';
      let options: string[] = [];
      let correctAnswer = 0;

      for (const line of lines) {
        if (line.startsWith('Question:')) {
          question = line.replace('Question:', '').trim();
        } else if (line.startsWith('Options:')) {
          options = line.replace('Options:', '').trim().split(',').map(opt => opt.trim());
        } else if (line.startsWith('Correct:')) {
          correctAnswer = parseInt(line.replace('Correct:', '').trim()) || 0;
        }
      }

      if (question && options.length >= 4) {
        return {
          id: `ai_${gameType}_${Date.now()}`,
          question,
          options: options.slice(0, 4),
          correctAnswer: Math.max(0, Math.min(3, correctAnswer)),
          confidence: 0.9,
          gameType
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }
    return null;
  }

  private generateAdaptiveFallbackWordImage(strategy: string, difficulty: string, age: number): GameQuestion {
    const topics = {
      animals: {
        easy: [
          { question: "Hangi hayvan köpek?", options: ["🐶", "🐱", "🐸", "🦋"], correct: 0 },
          { question: "Hangi hayvan kedi?", options: ["🐱", "🐶", "🐸", "🦋"], correct: 0 }
        ],
        medium: [
          { question: "Hangi hayvan çiftlikte yaşar?", options: ["🐄", "🐧", "🦁", "🐙"], correct: 0 },
          { question: "Hangi hayvan denizde yaşar?", options: ["🐠", "🐶", "🐱", "🐸"], correct: 0 }
        ],
        hard: [
          { question: "Hangi hayvan gece aktiftir?", options: ["🦉", "🐶", "🐸", "🦋"], correct: 0 },
          { question: "Hangi hayvan soğuk bölgelerde yaşar?", options: ["🐧", "🦁", "🐴", "🐄"], correct: 0 }
        ]
      }
    };

    const selectedTopic = topics.animals[difficulty as keyof typeof topics.animals];
    const baseQuestion = selectedTopic[Math.floor(Math.random() * selectedTopic.length)];

    // Apply strategy modifications
    let modifiedQuestion = baseQuestion.question;
    if (strategy === 'encourage') {
      modifiedQuestion = `Harika! ${modifiedQuestion}`;
    } else if (strategy === 'simplify') {
      modifiedQuestion = `Kolay soru: ${modifiedQuestion}`;
    } else if (strategy === 'challenge') {
      modifiedQuestion = `Zor soru: ${modifiedQuestion}`;
    }

    return {
      id: `adaptive_word_${Date.now()}`,
      question: modifiedQuestion,
      options: baseQuestion.options,
      correctAnswer: baseQuestion.correct,
      confidence: 0.85,
      gameType: 'word-image',
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      adaptedFor: strategy === 'challenge' ? 'success' : strategy === 'simplify' ? 'struggle' : 'confusion'
    };
  }

  private async generateAdaptiveNumberQuestion(
    context: QuestionGenerationContext,
    strategy: string
  ): Promise<GameQuestion> {
    const { performance, studentAge } = context;

    // Determine number range based on difficulty and age
    const ranges = {
      easy: { min: 1, max: 5 },
      medium: { min: 1, max: 10 },
      hard: { min: 5, max: 15 }
    };

    const range = ranges[performance.currentDifficulty as keyof typeof ranges];
    const targetNumber = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    // Generate wrong answers
    const wrongAnswers: number[] = [];
    while (wrongAnswers.length < 3) {
      let wrong: number;
      if (strategy === 'simplify') {
        // Make wrong answers more obviously wrong
        wrong = Math.random() < 0.5
          ? Math.max(1, targetNumber - Math.floor(Math.random() * 3) - 1)
          : Math.min(range.max, targetNumber + Math.floor(Math.random() * 3) + 1);
      } else {
        // Normal wrong answer generation
        wrong = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      }

      if (wrong !== targetNumber && !wrongAnswers.includes(wrong)) {
        wrongAnswers.push(wrong);
      }
    }

    const allOptions = [targetNumber, ...wrongAnswers].sort(() => Math.random() - 0.5);
    const correctIndex = allOptions.indexOf(targetNumber);

    // Strategy-based question text
    let questionText = `Kaç tane 🐶 var?`;
    if (strategy === 'encourage') {
      questionText = `Harika! ${questionText}`;
    } else if (strategy === 'challenge') {
      questionText = `Dikkatlice say: ${questionText}`;
    } else if (strategy === 'simplify') {
      questionText = `Kolay soru: ${questionText}`;
    }

    return {
      id: `adaptive_number_${Date.now()}`,
      question: questionText,
      options: allOptions.map(String),
      correctAnswer: correctIndex,
      confidence: 0.9,
      gameType: 'number',
      difficulty: performance.currentDifficulty,
      adaptedFor: strategy === 'challenge' ? 'success' : strategy === 'simplify' ? 'struggle' : 'confusion'
    };
  }

  private async generateAdaptiveColorQuestion(
    context: QuestionGenerationContext,
    strategy: string
  ): Promise<GameQuestion> {
    const { performance } = context;

    const colors = [
      { name: "kırmızı", emoji: "🔴" },
      { name: "mavi", emoji: "🔵" },
      { name: "yeşil", emoji: "🟢" },
      { name: "sarı", emoji: "🟡" },
      { name: "mor", emoji: "🟣" },
      { name: "turuncu", emoji: "🟠" }
    ];

    let availableColors = colors;

    // Adjust difficulty by limiting color options
    if (performance.currentDifficulty === 'easy') {
      availableColors = colors.slice(0, 4); // Only basic colors
    } else if (strategy === 'simplify') {
      availableColors = colors.slice(0, 3); // Even fewer colors
    }

    const targetColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    const wrongColors = availableColors
      .filter(c => c.name !== targetColor.name)
      .slice(0, 3);

    const allOptions = [targetColor, ...wrongColors].sort(() => Math.random() - 0.5);
    const correctIndex = allOptions.findIndex(c => c.name === targetColor.name);

    // Strategy-based question text
    let questionText = `Hangi renk ${targetColor.name}?`;
    if (strategy === 'encourage') {
      questionText = `Çok güzel! ${questionText}`;
    } else if (strategy === 'challenge') {
      questionText = `Dikkat et: ${questionText}`;
    } else if (strategy === 'simplify') {
      questionText = `Basit soru: ${questionText}`;
    }

    return {
      id: `adaptive_color_${Date.now()}`,
      question: questionText,
      options: allOptions.map(c => c.emoji),
      correctAnswer: correctIndex,
      confidence: 0.9,
      gameType: 'color',
      difficulty: performance.currentDifficulty,
      adaptedFor: strategy === 'challenge' ? 'success' : strategy === 'simplify' ? 'struggle' : 'confusion'
    };
  }

  async generateQuestionWithContext(
    studentId: string,
    gameType: 'word-image' | 'number' | 'color',
    studentAge: number,
    currentEmotion?: EmotionResult
  ): Promise<GameQuestion> {
    console.log('🎯 [ADAPTIVE DEBUG] generateQuestionWithContext çağrıldı:', {
      studentId,
      gameType,
      studentAge,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 5).join('\n')
    });
    // Initialize player if needed
    performanceTracker.initializePlayer(studentId, studentAge);

    const performance = performanceTracker.getPerformance(studentId);
    if (!performance) {
      throw new Error('Could not retrieve student performance data');
    }

    const context: QuestionGenerationContext = {
      performance,
      currentEmotion,
      gameType,
      previousQuestions: [], // Could be implemented to avoid repetition
      studentAge,
      adaptiveMode: true
    };

    return this.generateAdaptiveQuestion(context);
  }

  /**
   * ADHD çocukları için yaş ve strateji bazında uygun konu seçer
   */
  private getSubjectForWordImage(age: number, strategy: string): string {
    // ADHD çocukları için görsel ve ilgi çekici konular
    const adhdFriendlySubjects = {
      easy: ['Sevimli Hayvanlar', 'Parlak Renkler', 'Lezzetli Meyveler', 'Eğlenceli Oyuncaklar'],
      medium: ['Hızlı Hayvanlar', 'Cool Taşıtlar', 'Maceralı Doğa', 'Süper Kahramanlar'],
      hard: ['Uzay ve Gezegenler', 'Dinozorlar', 'Harika Icatlar', 'Büyülü Bilim']
    };

    let subjects: string[];
    if (age <= 6) {
      subjects = adhdFriendlySubjects.easy;
    } else if (age <= 10) {
      subjects = adhdFriendlySubjects.medium;
    } else {
      subjects = adhdFriendlySubjects.hard;
    }

    // ADHD stratejilerine göre konu seçimi
    switch (strategy) {
      case 'simplify':
        subjects = adhdFriendlySubjects.easy; // En basit, dikkat dağıtmayan
        break;
      case 'energize':
        subjects = ['Süper Hızlı Hayvanlar', 'Çılgın Renkler', 'Aksiyon Arabalar']; // Enerjik konular
        break;
      case 'challenge':
        if (age > 7) subjects = adhdFriendlySubjects.hard; // Yaşa uygun zorluk
        break;
      case 'refocus':
        subjects = ['Sakin Hayvanlar', 'Yumuşak Renkler', 'Huzurlu Doğa']; // Odaklanmayı artıran
        break;
    }

    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  /**
   * İngilizce zorluk seviyesini Türkçeye çevirir
   */
  private mapDifficultyToTurkish(difficulty: string): 'kolay' | 'orta' | 'zor' {
    const difficultyMap: Record<string, 'kolay' | 'orta' | 'zor'> = {
      'easy': 'kolay',
      'medium': 'orta',
      'hard': 'zor'
    };

    return difficultyMap[difficulty] || 'orta';
  }

  /**
   * ADHD çocukları için özel matematik soruları
   */
  async generateOllamaMathQuestion(
    subject: string = 'Temel Matematik',
    difficulty: 'kolay' | 'orta' | 'zor' = 'orta',
    age: number = 8
  ): Promise<GameQuestion> {
    // ADHD çocukları için görsel ve ilgi çekici matematik konuları
    const adhdMathSubjects = [
      'Eğlenceli sayma (oyuncaklar, hayvanlar ile)',
      'Görsel toplama (emojiler ile)',
      'Kolay çıkarma (çizgi film karakterleri ile)',
      'Renkli şekiller tanıma',
      'Günlük yaşamdan sayılar (yaş, saat, para)'
    ];

    const selectedSubject = adhdMathSubjects[Math.floor(Math.random() * adhdMathSubjects.length)];

    try {
      const ollamaRequest: OllamaQuestionRequest = {
        subject: `${selectedSubject} (${age} yaş için uygun)`,
        difficulty: difficulty,
        questionType: 'çoktan seçmeli'
      };

      const question = await ollamaService.generateQuestion(ollamaRequest);
      return {
        ...question,
        gameType: 'number'
      };
    } catch (error) {
      console.error('Ollama matematik sorusu üretme hatası:', error);
      throw error;
    }
  }

  /**
   * ADHD çocukları için eğlenceli fen bilgisi soruları
   */
  async generateOllamaScienceQuestion(
    difficulty: 'kolay' | 'orta' | 'zor' = 'orta',
    age: number = 10
  ): Promise<GameQuestion> {
    // ADHD çocukları için ilgi çekici ve görsel fen konuları
    const adhdScienceSubjects = [
      'Sevimli hayvanların yaşam alanları',
      'Gökyüzündeki renkli olaylar (gökkuşağı, bulutlar)',
      'Eğlenceli deneyimler (mıknatıs, su-yağ)',
      'Uzaydaki parlak gezegen ve yıldızlar',
      'Bitkilerin büyümesi ve çiçek açması',
      'Mevsim değişimleri ve doğadaki renkler'
    ];

    const selectedSubject = adhdScienceSubjects[Math.floor(Math.random() * adhdScienceSubjects.length)];

    try {
      const ollamaRequest: OllamaQuestionRequest = {
        subject: `${selectedSubject} (${age} yaş çocuk için basit)`,
        difficulty: difficulty,
        questionType: 'çoktan seçmeli'
      };

      return await ollamaService.generateQuestion(ollamaRequest);
    } catch (error) {
      console.error('Ollama fen bilgisi sorusu üretme hatası:', error);
      throw error;
    }
  }
}

export const adaptiveQuestionGenerator = new AdaptiveQuestionGenerator();
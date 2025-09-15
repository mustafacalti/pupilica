import { GameQuestion, QuestionGenerationContext, EmotionResult } from '../types';
import { huggingFaceService } from './huggingface';
import { performanceTracker } from './performanceTracker';

class AdaptiveQuestionGenerator {

  async generateAdaptiveQuestion(context: QuestionGenerationContext): Promise<GameQuestion> {
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
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }
  }

  private determineAdaptationStrategy(
    performance: any,
    currentEmotion?: EmotionResult
  ): 'encourage' | 'challenge' | 'simplify' | 'refocus' {
    const recentAverage = performance.recentScores.length > 0
      ? performance.recentScores.slice(-3).reduce((a: number, b: number) => a + b, 0) / Math.min(3, performance.recentScores.length)
      : 0.5;

    // If student is performing well and happy/focused
    if (recentAverage >= 0.7 && currentEmotion?.emotion === 'happy') {
      return 'challenge';
    }

    // If student is struggling or sad
    if (recentAverage <= 0.4 || currentEmotion?.emotion === 'sad') {
      return 'simplify';
    }

    // If student is confused
    if (currentEmotion?.emotion === 'confused') {
      return 'refocus';
    }

    // Default: encourage
    return 'encourage';
  }

  private async generateAdaptiveWordImageQuestion(
    context: QuestionGenerationContext,
    strategy: string
  ): Promise<GameQuestion> {
    const { performance, studentAge } = context;

    // AI prompt based on strategy
    const prompt = this.buildWordImagePrompt(strategy, performance.currentDifficulty, studentAge);

    try {
      // Use AI to generate question
      const aiResponse = await huggingFaceService.textGenerate(prompt, 150);
      const parsedQuestion = this.parseAIQuestionResponse(aiResponse, 'word-image');

      if (parsedQuestion) {
        return {
          ...parsedQuestion,
          difficulty: performance.currentDifficulty,
          adaptedFor: strategy === 'challenge' ? 'success' : strategy === 'simplify' ? 'struggle' : 'confusion'
        };
      }
    } catch (error) {
      console.error('AI question generation failed, using adaptive fallback:', error);
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
}

export const adaptiveQuestionGenerator = new AdaptiveQuestionGenerator();
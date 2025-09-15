import { GameQuestion } from '../types';

const HUGGINGFACE_API_KEY = process.env.REACT_APP_HUGGINGFACE_API_KEY;
const API_BASE_URL = 'https://api-inference.huggingface.co/models';

// Free models for content generation
const MODELS = {
  TEXT_GENERATION: 'gpt2',
  QUESTION_ANSWERING: 'distilbert-base-cased-distilled-squad',
  SENTIMENT_ANALYSIS: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
};

interface HuggingFaceResponse {
  generated_text?: string;
  answer?: string;
  score?: number;
  label?: string;
}

class HuggingFaceService {
  private async makeRequest(model: string, inputs: any, options: any = {}): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs,
        options,
      }),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`);
    }

    return response.json();
  }

  async generateWordImageQuestion(
    topic: string = 'animals',
    difficulty: 'easy' | 'medium' | 'hard' = 'easy',
    age: number = 5
  ): Promise<GameQuestion> {
    try {
      // For demo purposes, we'll use a fallback approach with predefined questions
      // In production, you'd want to use more sophisticated models
      const questions = await this.generateFallbackQuestions(topic, difficulty, age);
      return questions[Math.floor(Math.random() * questions.length)];
    } catch (error) {
      console.error('Error generating question:', error);
      const fallbackQuestions = await this.generateFallbackQuestions(topic, difficulty, age);
      return fallbackQuestions[0];
    }
  }

  async generateNumberQuestion(
    range: { min: number; max: number } = { min: 1, max: 10 },
    age: number = 5
  ): Promise<GameQuestion> {
    const number = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const objects = ['🐶', '🐱', '🐸', '🦋', '🌟', '🍎', '🏀', '🚗', '🎈', '🌸'];
    const selectedObject = objects[Math.floor(Math.random() * objects.length)];

    const wrongAnswers: number[] = [];
    for (let i = 0; i < 3; i++) {
      let wrongNumber;
      do {
        wrongNumber = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      } while (wrongNumber === number || wrongAnswers.includes(wrongNumber));
      wrongAnswers.push(wrongNumber);
    }

    const options = [number, ...wrongAnswers].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(number);

    return {
      id: `number_${Date.now()}`,
      question: `Kaç tane ${selectedObject} var?`,
      options: options.map(String),
      correctAnswer: correctIndex,
      confidence: 1.0,
      gameType: 'number'
    };
  }

  async generateColorQuestion(): Promise<GameQuestion> {
    const colors = [
      { name: 'kırmızı', emoji: '🔴', hex: '#FF0000' },
      { name: 'mavi', emoji: '🔵', hex: '#0000FF' },
      { name: 'yeşil', emoji: '🟢', hex: '#00FF00' },
      { name: 'sarı', emoji: '🟡', hex: '#FFFF00' },
      { name: 'mor', emoji: '🟣', hex: '#800080' },
      { name: 'turuncu', emoji: '🟠', hex: '#FFA500' }
    ];

    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    const wrongColors = colors.filter(c => c.name !== targetColor.name)
                            .slice(0, 3);

    const options = [targetColor, ...wrongColors].sort(() => Math.random() - 0.5);
    const correctIndex = options.findIndex(c => c.name === targetColor.name);

    return {
      id: `color_${Date.now()}`,
      question: `Hangi renk ${targetColor.name}?`,
      options: options.map(c => c.emoji),
      correctAnswer: correctIndex,
      confidence: 1.0,
      gameType: 'color'
    };
  }

  private async generateFallbackQuestions(
    topic: string,
    difficulty: string,
    age: number
  ): Promise<GameQuestion[]> {
    const questionSets = {
      animals: [
        {
          question: 'Hangi hayvan köpek?',
          options: ['🐶', '🐱', '🐸', '🦋'],
          correctAnswer: 0
        },
        {
          question: 'Hangi hayvan kedi?',
          options: ['🦋', '🐱', '🐸', '🐶'],
          correctAnswer: 1
        },
        {
          question: 'Hangi hayvan kurbağa?',
          options: ['🐶', '🦋', '🐸', '🐱'],
          correctAnswer: 2
        },
        {
          question: 'Hangi hayvan kelebek?',
          options: ['🐱', '🐶', '🐸', '🦋'],
          correctAnswer: 3
        }
      ],
      fruits: [
        {
          question: 'Hangi meyve elma?',
          options: ['🍎', '🍌', '🍇', '🍊'],
          correctAnswer: 0
        },
        {
          question: 'Hangi meyve muz?',
          options: ['🍊', '🍌', '🍇', '🍎'],
          correctAnswer: 1
        }
      ],
      vehicles: [
        {
          question: 'Hangi araç araba?',
          options: ['🚗', '🚌', '🚂', '✈️'],
          correctAnswer: 0
        },
        {
          question: 'Hangi araç otobüs?',
          options: ['✈️', '🚌', '🚂', '🚗'],
          correctAnswer: 1
        }
      ]
    };

    const questions = questionSets[topic as keyof typeof questionSets] || questionSets.animals;

    return questions.map((q, index) => ({
      id: `${topic}_${index}_${Date.now()}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      confidence: 0.95,
      gameType: 'word-image'
    }));
  }

  async analyzeSentiment(text: string): Promise<{ emotion: string; confidence: number }> {
    try {
      const response = await this.makeRequest(MODELS.SENTIMENT_ANALYSIS, text);
      const result = response[0];

      const emotionMap: { [key: string]: string } = {
        'LABEL_0': 'sad',
        'LABEL_1': 'neutral',
        'LABEL_2': 'happy',
        'NEGATIVE': 'sad',
        'NEUTRAL': 'neutral',
        'POSITIVE': 'happy'
      };

      return {
        emotion: emotionMap[result.label] || 'neutral',
        confidence: result.score || 0.5
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { emotion: 'neutral', confidence: 0.5 };
    }
  }

  async generateAIInsight(
    studentName: string,
    recentPerformance: number[],
    emotions: string[]
  ): Promise<string> {
    const avgPerformance = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
    const dominantEmotion = this.getDominantEmotion(emotions);

    if (avgPerformance >= 80 && dominantEmotion === 'happy') {
      return `${studentName} harika ilerliyor! Yüksek başarı oranı ve pozitif duygusal durum görülüyor.`;
    } else if (avgPerformance < 60) {
      return `${studentName} için daha kolay aktiviteler önerilir. Motivasyonu artırmaya odaklanın.`;
    } else if (dominantEmotion === 'confused') {
      return `${studentName} karışık görünüyor. Açıklamaları basitleştirin ve daha fazla rehberlik sağlayın.`;
    } else {
      return `${studentName} istikrarlı ilerliyor. Çeşitli aktivitelerle ilerlemeyi sürdürün.`;
    }
  }

  private getDominantEmotion(emotions: string[]): string {
    const emotionCounts: { [key: string]: number } = {};
    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    return Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    ) || 'neutral';
  }
}

export const huggingFaceService = new HuggingFaceService();
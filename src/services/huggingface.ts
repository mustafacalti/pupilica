// huggingface.ts (Vite/browser uyumlu sürüm)
import { GameQuestion } from "../types";

const API_BASE_URL = "https://api-inference.huggingface.co/models";

// Vite ortam değişkenleri
const HF_TOKEN = (import.meta.env.VITE_HUGGINGFACE_API_KEY as string | undefined)?.trim();
if (!HF_TOKEN) {
  // Prod'da token'ı frontend'e koymak güvenli değildir; demo/gelistirme için kabul.
  throw new Error("VITE_HUGGINGFACE_API_KEY is missing. Set it in your .env");
}

// .env ile override edilebilir; yoksa makul varsayılanlar
const MODELS = {
  TEXT_GENERATION:
    (import.meta.env.VITE_HUGGINGFACE_TEXT_MODEL as string) ||
    "gpt2",
  QUESTION_ANSWERING:
    (import.meta.env.VITE_HUGGINGFACE_QA_MODEL as string) ||
    "distilbert-base-cased-distilled-squad",
  SENTIMENT_ANALYSIS:
    (import.meta.env.VITE_HUGGINGFACE_SENTIMENT_MODEL as string) ||
    "cardiffnlp/twitter-roberta-base-sentiment-latest",
} as const;

// HF API yanıtları için gevşek tipler
type HFTextGen = Array<{ generated_text?: string }>;
type HFSentiment = Array<{ label: string; score: number }>;
type HFQA = Array<{ answer: string; score: number; start?: number; end?: number }>;

class HuggingFaceService {
  // Model load (503) durumunda kısa retry ile istek
  private async makeRequest<T = unknown>(
    model: string,
    inputs: unknown,
    options: Record<string, unknown> = {},
    retries = 2
  ): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs, options }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Model loading: 503
      if (res.status === 503 && retries > 0) {
        // küçük bir gecikme, sonra tekrar dene
        await new Promise((r) => setTimeout(r, 1200));
        return this.makeRequest<T>(model, inputs, options, retries - 1);
      }
      // Daha anlamlı hata
      throw new Error(
        `HuggingFace API ${res.status}: ${res.statusText}${
          text ? ` — ${text.slice(0, 200)}` : ""
        }`
      );
    }

    return (await res.json()) as T;
  }

  // --- Oyun soru üretimi (demo/fallback) ---

  async generateWordImageQuestion(
    topic: string = "animals",
    difficulty: "easy" | "medium" | "hard" = "easy",
    age: number = 5
  ): Promise<GameQuestion> {
    try {
      // Demo/fallback yaklaşımı; istersen burada TEXT_GENERATION modelini de çağırabilirsin
      const questions = await this.generateFallbackQuestions(topic, difficulty, age);
      return questions[Math.floor(Math.random() * questions.length)];
    } catch (err) {
      console.error("Error generating question:", err);
      const fallback = await this.generateFallbackQuestions(topic, difficulty, age);
      return fallback[0];
    }
  }

  async generateNumberQuestion(
    range: { min: number; max: number } = { min: 1, max: 10 },
    age: number = 5
  ): Promise<GameQuestion> {
    const number =
      Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const objects = ["🐶", "🐱", "🐸", "🦋", "🌟", "🍎", "🏀", "🚗", "🎈", "🌸"];
    const selectedObject = objects[Math.floor(Math.random() * objects.length)];

    const wrongAnswers: number[] = [];
    while (wrongAnswers.length < 3) {
      const w =
        Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      if (w !== number && !wrongAnswers.includes(w)) wrongAnswers.push(w);
    }

    const options = [number, ...wrongAnswers].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(number);

    return {
      id: `number_${Date.now()}`,
      question: `Kaç tane ${selectedObject} var?`,
      options: options.map(String),
      correctAnswer: correctIndex,
      confidence: 1.0,
      gameType: "number",
    };
  }

  async generateColorQuestion(): Promise<GameQuestion> {
    const colors = [
      { name: "kırmızı", emoji: "🔴", hex: "#FF0000" },
      { name: "mavi", emoji: "🔵", hex: "#0000FF" },
      { name: "yeşil", emoji: "🟢", hex: "#00FF00" },
      { name: "sarı", emoji: "🟡", hex: "#FFFF00" },
      { name: "mor", emoji: "🟣", hex: "#800080" },
      { name: "turuncu", emoji: "🟠", hex: "#FFA500" },
    ];

    const target = colors[Math.floor(Math.random() * colors.length)];
    const wrong = colors.filter((c) => c.name !== target.name).slice(0, 3);

    const opts = [target, ...wrong].sort(() => Math.random() - 0.5);
    const correctIndex = opts.findIndex((c) => c.name === target.name);

    return {
      id: `color_${Date.now()}`,
      question: `Hangi renk ${target.name}?`,
      options: opts.map((c) => c.emoji),
      correctAnswer: correctIndex,
      confidence: 1.0,
      gameType: "color",
    };
  }

  private async generateFallbackQuestions(
    topic: string,
    _difficulty: string,
    _age: number
  ): Promise<GameQuestion[]> {
    const questionSets = {
      animals: [
        { question: "Hangi hayvan köpek?", options: ["🐶", "🐱", "🐸", "🦋"], correctAnswer: 0 },
        { question: "Hangi hayvan kedi?", options: ["🦋", "🐱", "🐸", "🐶"], correctAnswer: 1 },
        { question: "Hangi hayvan kurbağa?", options: ["🐶", "🦋", "🐸", "🐱"], correctAnswer: 2 },
        { question: "Hangi hayvan kelebek?", options: ["🐱", "🐶", "🐸", "🦋"], correctAnswer: 3 },
      ],
      fruits: [
        { question: "Hangi meyve elma?", options: ["🍎", "🍌", "🍇", "🍊"], correctAnswer: 0 },
        { question: "Hangi meyve muz?", options: ["🍊", "🍌", "🍇", "🍎"], correctAnswer: 1 },
      ],
      vehicles: [
        { question: "Hangi araç araba?", options: ["🚗", "🚌", "🚂", "✈️"], correctAnswer: 0 },
        { question: "Hangi araç otobüs?", options: ["✈️", "🚌", "🚂", "🚗"], correctAnswer: 1 },
      ],
    } as const;

    const set = questionSets[topic as keyof typeof questionSets] || questionSets.animals;

    return set.map((q, i): GameQuestion => ({
  id: `${topic}_${i}_${Date.now()}`,
  question: q.question,
  options: [...q.options],        // <-- readonly'u kopyalayarak mutable string[] yapar
  correctAnswer: q.correctAnswer,
  confidence: 0.95,
  gameType: "word-image" as const // union daraltma gerekiyorsa
}));
  }

  // --- Analiz fonksiyonları ---

  async analyzeSentiment(text: string): Promise<{ emotion: string; confidence: number }> {
    try {
      const resp = await this.makeRequest<HFSentiment>(MODELS.SENTIMENT_ANALYSIS, text);
      const result = resp?.[0];
      const emotionMap: Record<string, "sad" | "neutral" | "happy"> = {
        LABEL_0: "sad",
        LABEL_1: "neutral",
        LABEL_2: "happy",
        NEGATIVE: "sad",
        NEUTRAL: "neutral",
        POSITIVE: "happy",
      };
      const emotion = result ? emotionMap[result.label] ?? "neutral" : "neutral";
      const confidence = result?.score ?? 0.5;
      return { emotion, confidence };
    } catch (e) {
      console.error("Error analyzing sentiment:", e);
      return { emotion: "neutral", confidence: 0.5 };
    }
  }

  async textGenerate(prompt: string, maxNewTokens = 30): Promise<string> {
    // Not: Bazı modellerin güvenli kullanım için özel parametreleri olabilir
    const options = { wait_for_model: true, max_new_tokens: maxNewTokens };
    const out = await this.makeRequest<HFTextGen>(MODELS.TEXT_GENERATION, prompt, options);
    return out?.[0]?.generated_text ?? "";
    // İstersen: return out.map(x => x.generated_text).filter(Boolean).join("\n");
  }

  async questionAnswering(question: string, context: string): Promise<{ answer: string; score: number }> {
    // QA için inputs nesnesi { question, context } olmalı
    const out = await this.makeRequest<HFQA>(MODELS.QUESTION_ANSWERING, { question, context }, { wait_for_model: true });
    const best = out?.[0];
    return { answer: best?.answer ?? "", score: best?.score ?? 0 };
  }

  async generateAIInsight(studentName: string, recentPerformance: number[], emotions: string[]): Promise<string> {
    const avg = recentPerformance.length
      ? recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length
      : 0;
    const dominantEmotion = this.getDominantEmotion(emotions);

    if (avg >= 80 && dominantEmotion === "happy") {
      return `${studentName} harika ilerliyor! Yüksek başarı oranı ve pozitif duygusal durum görülüyor.`;
    } else if (avg < 60) {
      return `${studentName} için daha kolay aktiviteler önerilir. Motivasyonu artırmaya odaklanın.`;
    } else if (dominantEmotion === "confused") {
      return `${studentName} karışık görünüyor. Açıklamaları basitleştirin ve daha fazla rehberlik sağlayın.`;
    } else {
      return `${studentName} istikrarlı ilerliyor. Çeşitli aktivitelerle ilerlemeyi sürdürün.`;
    }
  }

  private getDominantEmotion(emotions: string[]): string {
    const counts = emotions.reduce<Record<string, number>>((acc, e) => {
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    }, {});
    let best = "neutral";
    let bestCount = -1;
    for (const [k, v] of Object.entries(counts)) {
      if (v > bestCount) {
        best = k;
        bestCount = v;
      }
    }
    return best;
  }
}

export const huggingFaceService = new HuggingFaceService();

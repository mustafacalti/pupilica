// huggingface.ts (Vite/browser uyumlu, düzeltilmiş sürüm)
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
    "openai-community/gpt2",
  QUESTION_ANSWERING:
    (import.meta.env.VITE_HUGGINGFACE_QA_MODEL as string) ||
    "distilbert-base-cased-distilled-squad",
  SENTIMENT_ANALYSIS:
    (import.meta.env.VITE_HUGGINGFACE_SENTIMENT_MODEL as string) ||
    "cardiffnlp/twitter-roberta-base-sentiment-latest",
} as const;

// HF API yanıt tipleri (gevşek)
type HFTextGen = Array<{ generated_text?: string }>;
type HFSentiment = Array<{ label: string; score: number }>;
type HFQAObj = { answer: string; score: number; start?: number; end?: number };
type HFQA = HFQAObj | HFQAObj[];

// Ufak yardımcı: model path güvenli hale getir
function sanitizeModelId(model: string): string {
  try {
    // Eğer yanlışlıkla encode edilmişse düzelt (openai-community%2Fgpt2 -> openai-community/gpt2)
    const maybeDecoded = model.includes("%2F") ? decodeURIComponent(model) : model;
    // Yolun başında/sonunda slash varsa düzelt
    return maybeDecoded.replace(/^\/+|\/+$/g, "");
  } catch {
    return model.replace(/^\/+|\/+$/g, "");
  }
}

class HuggingFaceService {
  // Model load (503) durumunda kısa retry ile istek
  private async makeRequest<T = unknown>(
    model: string,
    inputs: unknown,
    {
      // HF'de generation ayarları "parameters" altında, altyapı ayarları "options" altında olmalı:
      parameters,
      options,
      retries = 2,
    }: {
      parameters?: Record<string, unknown>;
      options?: Record<string, unknown>;
      retries?: number;
    } = {}
  ): Promise<T> {
    const safeModel = sanitizeModelId(model);
    const url = `${API_BASE_URL}/${safeModel}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        parameters: parameters ?? {},
        options: { wait_for_model: true, ...(options ?? {}) },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // 503 ise kısa bir bekleme ile tekrar dene
      if (res.status === 503 && retries > 0) {
        await new Promise((r) => setTimeout(r, 1200));
        return this.makeRequest<T>(model, inputs, { parameters, options, retries: retries - 1 });
      }

      // 404 için ek ipucu: %2F / yanlış repo-id
      const extraHint =
        res.status === 404 && (safeModel.includes("%2F") || safeModel.split("/").length < 2)
          ? " (Muhtemel neden: model id encode edilmiş ya da organizasyon adı eksik. Örn: 'openai-community/gpt2')"
          : "";

      throw new Error(
        `HuggingFace API ${res.status}: ${res.statusText}${extraHint}${
          text ? ` — ${text.slice(0, 500)}` : ""
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
      // İstersen burada TEXT_GENERATION modelini de kullanıp prompt tabanlı üretim yapabilirsin.
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
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      confidence: 0.95,
      gameType: "word-image" as const
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
      const emotion = result ? (emotionMap[result.label] ?? "neutral") : "neutral";
      const confidence = result?.score ?? 0.5;
      return { emotion, confidence };
    } catch (e) {
      console.error("Error analyzing sentiment:", e);
      return { emotion: "neutral", confidence: 0.5 };
    }
  }

  async textGenerate(prompt: string, maxNewTokens = 30): Promise<string> {
    // Generation parametreleri "parameters" altında olmalı
    const out = await this.makeRequest<HFTextGen>(
      MODELS.TEXT_GENERATION,
      prompt,
      { parameters: { max_new_tokens: maxNewTokens } }
    );
    return out?.[0]?.generated_text ?? "";
  }

  async questionAnswering(question: string, context: string): Promise<{ answer: string; score: number }> {
    // QA için inputs: { question, context }
    const raw = await this.makeRequest<HFQA>(
      MODELS.QUESTION_ANSWERING,
      { question, context }
    );
    // Bazı modeller array, bazıları object döndürebiliyor; normalize edelim
    const best: HFQAObj | undefined = Array.isArray(raw) ? raw[0] : raw;
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

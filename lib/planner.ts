import pdfParse from "pdf-parse";
import { differenceInCalendarDays, eachDayOfInterval, formatISO } from "date-fns";

const STOP_WORDS = new Set(
  [
    "the",
    "and",
    "for",
    "that",
    "with",
    "from",
    "this",
    "have",
    "into",
    "which",
    "your",
    "their",
    "about",
    "there",
    "would",
    "could",
    "should",
    "because",
    "through",
    "while",
    "where",
    "when",
    "then",
    "than",
    "been",
    "over",
    "after",
    "before",
    "within",
    "among",
    "those",
    "these",
    "such",
    "using",
    "used",
    "also",
    "them",
    "they",
    "were",
    "will",
    "therefore",
    "between",
    "other"
  ].map((word) => word.toLowerCase())
);

export type StudyDay = {
  goal: string;
};

export type StudyPlanPayload = {
  summary: string;
  highlights: string[];
  studyDays: StudyDay[];
};

export async function parsePdf(buffer: Buffer) {
  const pdfData = await pdfParse(buffer);
  const text = (pdfData.text || "").replace(/\s+/g, " ").trim();
  if (!text) {
    throw new Error("The uploaded PDF does not contain readable text.");
  }
  return text;
}

export function summarizeText(text: string, maxSentences = 5) {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);

  if (sentences.length <= maxSentences) {
    return sentences.join(" ");
  }

  const wordFrequency = new Map<string, number>();
  const words = text
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  for (const word of words) {
    wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
  }

  const sentenceScores = sentences.map((sentence) => {
    const sentenceWords = sentence
      .toLowerCase()
      .split(/[^a-zA-Z0-9]+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    const totalScore = sentenceWords.reduce(
      (score, word) => score + (wordFrequency.get(word) ?? 0),
      0
    );
    return { sentence, score: totalScore / (sentenceWords.length || 1) };
  });

  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence));

  return topSentences.map((item) => item.sentence).join(" ");
}

export function extractHighlights(text: string, limit = 6) {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (sentences.length <= limit) {
    return sentences;
  }

  const keywordScores = new Map<string, number>();
  const cleanSentences = sentences.map((sentence) => {
    const keywords = sentence
      .toLowerCase()
      .split(/[^a-zA-Z0-9]+/)
      .filter((w) => w.length > 4 && !STOP_WORDS.has(w));
    for (const keyword of keywords) {
      keywordScores.set(keyword, (keywordScores.get(keyword) ?? 0) + 1);
    }
    return { sentence, keywords };
  });

  const ranked = cleanSentences
    .map(({ sentence, keywords }) => {
      const score =
        keywords.reduce((total, keyword) => total + (keywordScores.get(keyword) ?? 0), 0) /
        (keywords.length || 1);
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence));

  return ranked.map((item) => item.sentence);
}

export function buildStudyPlan(
  text: string,
  startDate: Date,
  endDate: Date
): StudyPlanPayload {
  const summary = summarizeText(text);
  const highlights = extractHighlights(text);

  const totalDays = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const sections = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunkSize = Math.max(1, Math.ceil(sections.length / totalDays));
  const studyDays: StudyDay[] = days.map((_, index) => {
    const chunk = sections.slice(index * chunkSize, index * chunkSize + chunkSize);
    const goal = chunk.join(" ").slice(0, 600);
    return {
      goal: goal || "Review previous material and consolidate understanding."
    };
  });

  return {
    summary,
    highlights,
    studyDays
  };
}

export function formatPlanDates(studyDays: StudyDay[], start: Date) {
  return studyDays.map((day, index) => ({
    ...day,
    targetDate: formatISO(new Date(start.getTime() + index * 24 * 60 * 60 * 1000), {
      representation: "date"
    })
  }));
}

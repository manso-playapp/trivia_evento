import type { AnswerOption, AnswerOptionId } from "@/types/answer-option";

/**
 * Pregunta base para la trivia en vivo.
 */
export type Question = {
  id: string;
  order: number;
  category: string;
  prompt: string;
  options: AnswerOption[];
  correctOptionId: AnswerOptionId;
  timeLimitSeconds: number;
};

import type { AnswerOptionId } from "@/types/answer-option";

/**
 * Respuesta actual de una mesa para una ronda dada.
 * Puede modificarse mientras la ronda siga activa.
 */
export type SubmittedAnswer = {
  tableId: string;
  questionId: string;
  roundNumber: number;
  optionId: AnswerOptionId;
  updatedAt: string;
  locked: boolean;
};

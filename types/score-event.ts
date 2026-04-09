export type ScoreReason = "correct" | "incorrect" | "no_answer" | "frozen";

/**
 * Historial de scoring para poder auditar la partida y mostrar feedback.
 */
export type ScoreEvent = {
  id: string;
  tableId: string;
  questionId: string;
  roundNumber: number;
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  reason: ScoreReason;
  createdAt: string;
};

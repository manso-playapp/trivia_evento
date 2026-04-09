import type { AnswerOptionId } from "@/types/answer-option";

/**
 * Comandos intencionales del dominio.
 * Hoy se ejecutan localmente; despues pueden convertirse en RPC o writes remotas.
 */
export type GameCommand =
  | { type: "reveal_question" }
  | { type: "start_round" }
  | { type: "submit_answer"; tableId: string; optionId: AnswerOptionId }
  | { type: "lock_round" }
  | { type: "reveal_correct_answer" }
  | { type: "apply_scores" }
  | { type: "activate_x2"; tableId: string }
  | { type: "activate_bomb"; sourceTableId: string; targetTableId: string }
  | { type: "apply_freeze_for_round" }
  | { type: "reset_game" }
  | { type: "simulate_answers" };

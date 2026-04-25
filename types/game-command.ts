import type { AnswerOptionId } from "@/types/answer-option";

/**
 * Comandos intencionales del dominio.
 * Hoy se ejecutan localmente; despues pueden convertirse en RPC o writes remotas.
 */
export type GameCommand =
  | { type: "reveal_question" }
  | { type: "start_round" }
  | { type: "submit_answer"; tableId: string; optionId: AnswerOptionId }
  | { type: "set_table_name"; tableId: string; name: string }
  | { type: "set_table_active"; tableId: string; active: boolean }
  | { type: "set_active_table_count"; count: number }
  | { type: "set_round_duration"; seconds: number }
  | { type: "set_public_screen_size"; widthPx: number; heightPx: number }
  | { type: "lock_round" }
  | { type: "reveal_correct_answer" }
  | { type: "apply_scores" }
  | { type: "activate_x2"; tableId: string }
  | { type: "activate_bomb"; sourceTableId: string; targetTableId: string }
  | { type: "apply_freeze_for_round" }
  | { type: "reset_game" }
  | { type: "simulate_answers" };

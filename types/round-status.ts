/**
 * Maquina de estados simple del MVP.
 * Se usa igual en pantalla publica, operador y mobile.
 */
export type RoundStatus =
  | "idle"
  | "question_revealed"
  | "round_active"
  | "round_locked"
  | "answer_revealed"
  | "score_updated"
  | "game_finished";

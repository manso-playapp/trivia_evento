import type { AnswerOptionId } from "@/types/answer-option";

export type GameEventType =
  | "question_revealed"
  | "round_started"
  | "answer_submitted"
  | "table_activity_updated"
  | "round_locked"
  | "correct_answer_revealed"
  | "scores_applied"
  | "x2_activated"
  | "bomb_activated"
  | "freeze_applied"
  | "game_reset";

export type GameActorRole = "operator" | "table" | "system";

/**
 * Evento serializable del dominio.
 * En una capa realtime real, este contrato puede viajar por Supabase Realtime,
 * Firebase, WebSockets o colas sin cambiar la UI.
 */
export type GameEvent = {
  id: string;
  gameId: string;
  type: GameEventType;
  actorRole: GameActorRole;
  actorId: string;
  createdAt: string;
  payload: Record<string, string | number | boolean | null | string[]>;
};

/**
 * Snapshot preparado para sincronizacion cliente-servidor.
 * Un backend realtime podria publicar snapshots, eventos o ambos.
 */
export type GameSyncSnapshot = {
  revision: number;
  state: {
    gameId: string;
    roundStatus: string;
    currentQuestionIndex: number | null;
    updatedAt: string;
  };
};

export type SubmitAnswerPayload = {
  tableId: string;
  optionId: AnswerOptionId;
};

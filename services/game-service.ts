import type {
  AnswerOptionId,
  GameActorRole,
  GameEvent,
  GameState,
} from "@/types";

export type GameServiceListener = () => void;

/**
 * Contrato de acciones del juego.
 * Hoy la implementacion usa mocks locales. En realtime real:
 * - `readState` podria leer un snapshot remoto cacheado.
 * - `subscribe` podria conectarse a canales de Supabase o listeners de Firebase.
 * - las acciones podrian convertirse en RPC, Edge Functions o writes validadas por servidor.
 */
export interface GameService {
  initialize(): void;
  readState(): GameState;
  subscribe(listener: GameServiceListener): () => void;
  revealQuestion(actorId?: string): void;
  startRound(actorId?: string): void;
  submitAnswer(
    tableId: string,
    optionId: AnswerOptionId,
    actorId?: string
  ): void;
  setTableName(tableId: string, name: string, actorId?: string): void;
  setTableActive(tableId: string, active: boolean, actorId?: string): void;
  setActiveTableCount(count: number, actorId?: string): void;
  lockRound(actorId?: string): void;
  revealCorrectAnswer(actorId?: string): void;
  applyScores(actorId?: string): void;
  activateX2(tableId: string, actorId?: string): void;
  activateBomb(
    sourceTableId: string,
    targetTableId: string,
    actorId?: string
  ): void;
  applyFreezeForRound(actorId?: string): void;
  resetGame(actorId?: string): void;
  simulateAnswers(actorId?: string): void;
}

export const createGameEvent = ({
  gameId,
  type,
  actorRole,
  actorId,
  payload,
}: {
  gameId: string;
  type: GameEvent["type"];
  actorRole: GameActorRole;
  actorId: string;
  payload: GameEvent["payload"];
}): GameEvent => ({
  id: `${type}-${Date.now()}`,
  gameId,
  type,
  actorRole,
  actorId,
  createdAt: new Date().toISOString(),
  payload,
});

import "server-only";

import { createInitialGameState } from "@/data/initial-game-state";
import { serverRuntimeConfig } from "@/lib/server/runtime-config";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin-client";
import type { AnswerOptionId, GameEvent, GameState, SubmittedAnswer } from "@/types";

type SessionRow = {
  id: string;
  revision: number;
  state: GameState;
  last_event: GameEvent | null;
  updated_at: string;
};

type SubmittedAnswerRow = {
  game_id: string;
  table_id: string;
  question_id: string;
  round_number: number;
  option_id: string;
  updated_at: string;
};

const createSeedState = (gameId: string): GameState => ({
  ...createInitialGameState(),
  gameId,
  updatedAt: new Date().toISOString(),
});

const normalizeStateFromRow = (row: SessionRow): GameState => ({
  ...(row.state as GameState),
  gameId: row.id,
  revision: row.revision,
  lastEvent: row.last_event ?? row.state.lastEvent ?? null,
  updatedAt: row.updated_at ?? row.state.updatedAt,
});

const toSessionRow = (state: GameState) => ({
  id: state.gameId,
  revision: state.revision,
  state,
  last_event: state.lastEvent,
  updated_at: state.updatedAt,
});

const toEventRow = (event: GameEvent, revision: number) => ({
  id: event.id,
  game_id: event.gameId,
  revision,
  type: event.type,
  actor_role: event.actorRole,
  actor_id: event.actorId,
  payload: event.payload,
  created_at: event.createdAt,
});

const rowToSubmittedAnswer = (row: SubmittedAnswerRow): SubmittedAnswer => ({
  tableId: row.table_id,
  questionId: row.question_id,
  roundNumber: row.round_number,
  optionId: row.option_id as AnswerOptionId,
  updatedAt: row.updated_at,
  locked: false,
});

export class GameStateConflictError extends Error {
  currentState: GameState;

  constructor(currentState: GameState) {
    super("El estado remoto cambio antes de persistir este comando.");
    this.name = "GameStateConflictError";
    this.currentState = currentState;
  }
}

export const readSubmittedAnswersForGame = async (
  gameId: string
): Promise<SubmittedAnswer[]> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("submitted_answers")
    .select("game_id, table_id, question_id, round_number, option_id, updated_at")
    .eq("game_id", gameId);

  if (error) {
    throw new Error(`No se pudo leer submitted_answers: ${error.message}`);
  }

  return (data ?? []).map((row) => rowToSubmittedAnswer(row as SubmittedAnswerRow));
};

export const upsertSubmittedAnswer = async ({
  gameId,
  tableId,
  questionId,
  roundNumber,
  optionId,
}: {
  gameId: string;
  tableId: string;
  questionId: string;
  roundNumber: number;
  optionId: string;
}): Promise<void> => {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("submitted_answers").upsert(
    {
      game_id: gameId,
      table_id: tableId,
      question_id: questionId,
      round_number: roundNumber,
      option_id: optionId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "game_id,table_id,round_number" }
  );

  if (error) {
    throw new Error(`No se pudo guardar la respuesta: ${error.message}`);
  }
};

export const clearSubmittedAnswersForGame = async (
  gameId: string
): Promise<void> => {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("submitted_answers")
    .delete()
    .eq("game_id", gameId);

  if (error) {
    throw new Error(`No se pudo limpiar submitted_answers: ${error.message}`);
  }
};

/**
 * Repositorio server-only del snapshot del juego.
 *
 * Lee el snapshot de game_sessions y las respuestas actuales de submitted_answers
 * en paralelo, devolviendo el estado con ambas fuentes mergeadas. Esto garantiza
 * que los reducers del dominio (lockRound, applyScores) siempre operen sobre las
 * respuestas reales, no sobre las que quedaron en el snapshot.
 */
export const readOrSeedServerGameState = async (
  gameId = serverRuntimeConfig.supabaseGameId
): Promise<GameState> => {
  const supabase = getSupabaseAdminClient();

  const [{ data, error }, submittedAnswers] = await Promise.all([
    supabase
      .from("game_sessions")
      .select("id, revision, state, last_event, updated_at")
      .eq("id", gameId)
      .maybeSingle(),
    readSubmittedAnswersForGame(gameId).catch(() => [] as SubmittedAnswer[]),
  ]);

  if (error) {
    throw new Error(`No se pudo leer game_sessions: ${error.message}`);
  }

  if (data) {
    return {
      ...normalizeStateFromRow(data as SessionRow),
      submittedAnswers,
    };
  }

  const seededState = createSeedState(gameId);
  const { error: seedError } = await supabase
    .from("game_sessions")
    .upsert(toSessionRow(seededState));

  if (seedError) {
    throw new Error(`No se pudo crear el snapshot inicial: ${seedError.message}`);
  }

  return seededState;
};

export const persistServerGameTransition = async ({
  state,
  event,
  expectedRevision,
}: {
  state: GameState;
  event: GameEvent;
  expectedRevision: number;
}) => {
  const supabase = getSupabaseAdminClient();
  const { data: updatedRows, error: sessionError } = await supabase
    .from("game_sessions")
    .update(toSessionRow(state))
    .eq("id", state.gameId)
    .eq("revision", expectedRevision)
    .select("id");

  if (sessionError) {
    throw new Error(`No se pudo guardar game_sessions: ${sessionError.message}`);
  }

  if (!updatedRows || updatedRows.length === 0) {
    const currentState = await readOrSeedServerGameState(state.gameId);
    throw new GameStateConflictError(currentState);
  }

  const { error: eventError } = await supabase
    .from("game_events")
    .insert(toEventRow(event, state.revision));

  if (eventError) {
    throw new Error(`No se pudo guardar game_events: ${eventError.message}`);
  }
};

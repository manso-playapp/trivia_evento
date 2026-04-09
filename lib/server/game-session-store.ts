import "server-only";

import { createInitialGameState } from "@/data/initial-game-state";
import { serverRuntimeConfig } from "@/lib/server/runtime-config";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin-client";
import type { GameEvent, GameState } from "@/types";

type SessionRow = {
  id: string;
  revision: number;
  state: GameState;
  last_event: GameEvent | null;
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

export class GameStateConflictError extends Error {
  currentState: GameState;

  constructor(currentState: GameState) {
    super("El estado remoto cambio antes de persistir este comando.");
    this.name = "GameStateConflictError";
    this.currentState = currentState;
  }
}

/**
 * Repositorio server-only del snapshot del juego.
 *
 * En produccion conviene encapsular esto en RPC o transacciones SQL para validar
 * `revision` de forma atomica. Por ahora dejamos un paso intermedio mas seguro
 * que el write directo desde cliente.
 */
export const readOrSeedServerGameState = async (
  gameId = serverRuntimeConfig.supabaseGameId
): Promise<GameState> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .select("id, revision, state, last_event, updated_at")
    .eq("id", gameId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer game_sessions: ${error.message}`);
  }

  if (data) {
    return normalizeStateFromRow(data as SessionRow);
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

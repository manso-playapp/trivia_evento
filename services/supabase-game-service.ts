"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createInitialGameState } from "@/data/initial-game-state";
import {
  activateBomb,
  activateX2,
  applyFreezeForRound,
  applyScores,
  lockRound,
  resetGame,
  revealCorrectAnswer,
  revealQuestion,
  setActiveTableCount,
  setTableActive,
  setTableName,
  simulateAnswers,
  startRound,
  submitAnswer,
} from "@/engine/game-domain";
import {
  getCurrentQuestion,
  getCurrentRoundNumber,
} from "@/engine/game-selectors";
import { runtimeConfig, shouldUseServerWrites } from "@/lib/runtime-config";
import {
  readStoredGameState,
  writeStoredGameState,
} from "@/lib/game-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser-client";
import {
  createGameEvent,
  type GameService,
  type GameServiceListener,
} from "@/services/game-service";
import type { GameActorRole, GameEvent, GameState } from "@/types";

type SessionRow = {
  id: string;
  revision: number;
  state: GameState;
  last_event: GameEvent | null;
  updated_at: string;
};

type CommitPayload =
  | Record<string, string | number | boolean | null | string[]>
  | ((currentState: GameState, nextState: GameState) => Record<
      string,
      string | number | boolean | null | string[]
    >);

const listeners = new Set<GameServiceListener>();
let realtimeChannel: RealtimeChannel | null = null;
let initialized = false;
let cachedState: GameState = createConfiguredInitialState();

function createConfiguredInitialState(): GameState {
  const baseState = createInitialGameState();

  return {
    ...baseState,
    gameId: runtimeConfig.supabaseGameId,
    updatedAt: new Date().toISOString(),
  };
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function setCachedState(nextState: GameState) {
  cachedState = nextState;
  writeStoredGameState(nextState);
  notifyListeners();
}

function normalizeStateFromRow(row: SessionRow): GameState {
  return {
    ...(row.state as GameState),
    gameId: row.id,
    revision: row.revision,
    lastEvent: row.last_event ?? row.state.lastEvent ?? null,
    updatedAt: row.updated_at ?? row.state.updatedAt,
  };
}

function toSessionRow(state: GameState) {
  return {
    id: state.gameId,
    revision: state.revision,
    state,
    last_event: state.lastEvent,
    updated_at: state.updatedAt,
  };
}

function toEventRow(event: GameEvent, revision: number) {
  return {
    id: event.id,
    game_id: event.gameId,
    revision,
    type: event.type,
    actor_role: event.actorRole,
    actor_id: event.actorId,
    payload: event.payload,
    created_at: event.createdAt,
  };
}

async function pullRemoteState() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .select("id, revision, state, last_event, updated_at")
    .eq("id", runtimeConfig.supabaseGameId)
    .maybeSingle();

  if (error) {
    console.error("Supabase: no se pudo leer el snapshot del juego.", error);
    return;
  }

  if (!data) {
    const seededState = createConfiguredInitialState();
    await supabase.from("game_sessions").upsert(toSessionRow(seededState));
    setCachedState(seededState);
    return;
  }

  setCachedState(normalizeStateFromRow(data as SessionRow));
}

function ensureRealtimeChannel() {
  if (realtimeChannel) {
    return;
  }

  const supabase = getSupabaseBrowserClient();
  realtimeChannel = supabase
    .channel(`game-session-${runtimeConfig.supabaseGameId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_sessions",
        filter: `id=eq.${runtimeConfig.supabaseGameId}`,
      },
      (payload) => {
        const nextRow = payload.new as SessionRow | undefined;

        if (!nextRow?.state) {
          return;
        }

        const nextState = normalizeStateFromRow(nextRow);

        if (nextState.revision <= cachedState.revision) {
          return;
        }

        setCachedState(nextState);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void pullRemoteState();
      }
    });
}

async function commitRemoteState({
  reducer,
  type,
  payload,
  actorRole,
  actorId,
}: {
  reducer: (state: GameState) => GameState;
  type: Parameters<typeof createGameEvent>[0]["type"];
  payload: CommitPayload;
  actorRole: GameActorRole;
  actorId: string;
}) {
  const currentState = cachedState;
  const nextDomainState = reducer(currentState);

  if (nextDomainState === currentState) {
    return;
  }

  const resolvedPayload =
    typeof payload === "function" ? payload(currentState, nextDomainState) : payload;

  const event = createGameEvent({
    gameId: currentState.gameId,
    type,
    actorRole,
    actorId,
    payload: resolvedPayload,
  });

  const nextState: GameState = {
    ...nextDomainState,
    gameId: currentState.gameId,
    revision: currentState.revision + 1,
    lastEvent: event,
  };

  /**
   * Modo actual:
   * - optimista en cliente para no frenar la UI
   * - sincronizado por snapshot en Supabase
   *
   * Produccion:
   * - estas transiciones deberian ejecutarse del lado servidor
   * - la escritura deberia validar `revision` para evitar carreras
   */
  setCachedState(nextState);

  const supabase = getSupabaseBrowserClient();
  const { error: sessionError } = await supabase
    .from("game_sessions")
    .upsert(toSessionRow(nextState));

  if (sessionError) {
    console.error("Supabase: no se pudo guardar el snapshot del juego.", sessionError);
    await pullRemoteState();
    return;
  }

  const { error: eventError } = await supabase
    .from("game_events")
    .insert(toEventRow(event, nextState.revision));

  if (eventError) {
    console.error("Supabase: no se pudo guardar el evento del juego.", eventError);
  }
}

async function commitServerCommand({
  command,
  actorId,
}: {
  command: import("@/types").GameCommand;
  actorId: string;
}) {
  const response = await fetch("/api/game/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      command,
      actorId,
      expectedRevision: cachedState.revision,
    }),
  });

  if (!response.ok) {
    let message = "No se pudo ejecutar el comando en backend.";

    try {
      const body = (await response.json()) as {
        error?: string;
        state?: GameState;
        conflict?: boolean;
      };
      message = body.error ?? message;

      if (body.state) {
        setCachedState(body.state);
      } else if (body.conflict) {
        await pullRemoteState();
      }
    } catch {
      // noop
    }

    throw new Error(message);
  }

  const body = (await response.json()) as {
    state?: GameState;
    ignored?: boolean;
  };

  if (body.state) {
    setCachedState(body.state);
    return;
  }

  await pullRemoteState();
}

export const createSupabaseGameService = (): GameService => ({
  initialize() {
    if (initialized) {
      return;
    }

    initialized = true;

    const localState = readStoredGameState();
    cachedState =
      localState.gameId === runtimeConfig.supabaseGameId
        ? localState
        : createConfiguredInitialState();

    void pullRemoteState();
    ensureRealtimeChannel();
  },

  readState() {
    return cachedState;
  },

  subscribe(listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },

  revealQuestion(actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "reveal_question" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: revealQuestion,
      type: "question_revealed",
      actorRole: "operator",
      actorId,
      payload: (_currentState, nextState) => ({
        roundNumber: getCurrentRoundNumber(nextState),
        questionId: getCurrentQuestion(nextState)?.id ?? null,
      }),
    });
  },

  startRound(actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "start_round" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: startRound,
      type: "round_started",
      actorRole: "operator",
      actorId,
      payload: (_currentState, nextState) => ({
        roundNumber: getCurrentRoundNumber(nextState),
        roundEndsAt: nextState.roundEndsAt,
      }),
    });
  },

  submitAnswer(tableId, optionId, actorId = tableId) {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "submit_answer", tableId, optionId },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => submitAnswer(state, tableId, optionId),
      type: "answer_submitted",
      actorRole: "table",
      actorId,
      payload: (currentState) => ({
        tableId,
        optionId,
        roundNumber: getCurrentRoundNumber(currentState),
      }),
    });
  },

  setTableName(tableId, name, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "set_table_name", tableId, name },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => setTableName(state, tableId, name),
      type: "table_activity_updated",
      actorRole: "operator",
      actorId,
      payload: {
        tableId,
        name,
      },
    });
  },

  setTableActive(tableId, active, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "set_table_active", tableId, active },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => setTableActive(state, tableId, active),
      type: "table_activity_updated",
      actorRole: "operator",
      actorId,
      payload: {
        tableId,
        active,
      },
    });
  },

  setActiveTableCount(count, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "set_active_table_count", count },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => setActiveTableCount(state, count),
      type: "table_activity_updated",
      actorRole: "operator",
      actorId,
      payload: (_currentState, nextState) => ({
        activeTableCount: nextState.tables.filter((table) => table.active).length,
      }),
    });
  },

  lockRound(actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "lock_round" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: lockRound,
      type: "round_locked",
      actorRole: "operator",
      actorId,
      payload: (currentState) => ({
        roundNumber: getCurrentRoundNumber(currentState),
      }),
    });
  },

  revealCorrectAnswer(actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "reveal_correct_answer" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: revealCorrectAnswer,
      type: "correct_answer_revealed",
      actorRole: "operator",
      actorId,
      payload: (currentState) => {
        const currentQuestion = getCurrentQuestion(currentState);

        return {
          roundNumber: getCurrentRoundNumber(currentState),
          questionId: currentQuestion?.id ?? null,
          correctOptionId: currentQuestion?.correctOptionId ?? null,
        };
      },
    });
  },

  applyScores(actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "apply_scores" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: applyScores,
      type: "scores_applied",
      actorRole: "operator",
      actorId,
      payload: (currentState, nextState) => ({
        roundNumber: getCurrentRoundNumber(nextState),
        scoreEventIds: nextState.scoreEvents
          .slice(currentState.scoreEvents.length)
          .map((scoreEvent) => scoreEvent.id),
      }),
    });
  },

  activateX2(tableId, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "activate_x2", tableId },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => activateX2(state, tableId),
      type: "x2_activated",
      actorRole: "operator",
      actorId,
      payload: (currentState) => ({
        tableId,
        roundNumber: getCurrentRoundNumber(currentState),
      }),
    });
  },

  activateBomb(sourceTableId, targetTableId, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: {
          type: "activate_bomb",
          sourceTableId,
          targetTableId,
        },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => activateBomb(state, sourceTableId, targetTableId),
      type: "bomb_activated",
      actorRole: "operator",
      actorId,
      payload: (currentState) => ({
        sourceTableId,
        targetTableId,
        targetRoundNumber: getCurrentRoundNumber(currentState) + 1,
      }),
    });
  },

  applyFreezeForRound(actorId = "system") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "apply_freeze_for_round" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: applyFreezeForRound,
      type: "freeze_applied",
      actorRole: "system",
      actorId,
      payload: (_currentState, nextState) => ({
        roundNumber: getCurrentRoundNumber(nextState),
        tableIds: nextState.tables
          .filter(
            (table) =>
              table.frozenRoundNumber === getCurrentRoundNumber(nextState) &&
              table.frozenByTableId
          )
          .map((table) => table.id),
      }),
    });
  },

  resetGame(actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "reset_game" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: () => ({
        ...resetGame(),
        gameId: runtimeConfig.supabaseGameId,
      }),
      type: "game_reset",
      actorRole: "operator",
      actorId,
      payload: {},
    });
  },

  simulateAnswers(actorId = "system") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "simulate_answers" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: simulateAnswers,
      type: "answer_submitted",
      actorRole: "system",
      actorId,
      payload: (currentState) => ({
        mode: "bulk-simulated",
        roundNumber: getCurrentRoundNumber(currentState),
      }),
    });
  },
});

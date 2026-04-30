"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createInitialGameState } from "@/data/initial-game-state";
import {
  activateBomb,
  activateX2,
  adjustScore,
  applyFreezeForRound,
  applyScores,
  enablePowerUps,
  lockRound,
  resetGame,
  restorePowerUp,
  revealCorrectAnswer,
  revealQuestion,
  setActiveTableCount,
  setPublicScreenSize,
  setRoundDuration,
  setSoundSettings,
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
import type {
  AnswerOptionId,
  GameActorRole,
  GameEvent,
  GameState,
  SubmittedAnswer,
} from "@/types";

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

type CommitPayload =
  | Record<string, string | number | boolean | null | string[]>
  | ((currentState: GameState, nextState: GameState) => Record<
      string,
      string | number | boolean | null | string[]
    >);

const listeners = new Set<GameServiceListener>();
let realtimeChannel: RealtimeChannel | null = null;
let answersRealtimeChannel: RealtimeChannel | null = null;
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
  const base = row.state as GameState;
  return {
    ...base,
    gameId: row.id,
    revision: row.revision,
    lastEvent: row.last_event ?? base.lastEvent ?? null,
    updatedAt: row.updated_at ?? base.updatedAt,
    powerUpsEnabled: base.powerUpsEnabled ?? false,
    scoreAdjustments: base.scoreAdjustments ?? [],
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

function rowToSubmittedAnswer(row: SubmittedAnswerRow): SubmittedAnswer {
  return {
    tableId: row.table_id,
    questionId: row.question_id,
    roundNumber: row.round_number,
    optionId: row.option_id as AnswerOptionId,
    updatedAt: row.updated_at,
    locked: false,
  };
}

/**
 * Mergea una respuesta entrante en cachedState.submittedAnswers.
 * Reemplaza si ya existe una para esa mesa/ronda, agrega si es nueva.
 */
function mergeIncomingAnswer(answer: SubmittedAnswer) {
  const existing = cachedState.submittedAnswers.findIndex(
    (a) => a.tableId === answer.tableId && a.roundNumber === answer.roundNumber
  );

  const nextAnswers =
    existing === -1
      ? [...cachedState.submittedAnswers, answer]
      : cachedState.submittedAnswers.map((a, i) =>
          i === existing ? answer : a
        );

  cachedState = { ...cachedState, submittedAnswers: nextAnswers };
  writeStoredGameState(cachedState);
  notifyListeners();
}

async function pullRemoteState() {
  const supabase = getSupabaseBrowserClient();

  if (shouldUseServerWrites) {
    const [sessionResult, answersResult] = await Promise.all([
      supabase
        .from("game_sessions")
        .select("id, revision, state, last_event, updated_at")
        .eq("id", runtimeConfig.supabaseGameId)
        .maybeSingle(),
      supabase
        .from("submitted_answers")
        .select("game_id, table_id, question_id, round_number, option_id, updated_at")
        .eq("game_id", runtimeConfig.supabaseGameId),
    ]);

    if (sessionResult.error) {
      console.error(
        "Supabase: no se pudo leer el snapshot del juego.",
        sessionResult.error
      );
      return;
    }

    const { data } = sessionResult;
    const submittedAnswers = (answersResult.data ?? []).map((row) =>
      rowToSubmittedAnswer(row as SubmittedAnswerRow)
    );

    if (!data) {
      const seededState = createConfiguredInitialState();
      await supabase.from("game_sessions").upsert(toSessionRow(seededState));
      setCachedState({ ...seededState, submittedAnswers });
      return;
    }

    setCachedState({
      ...normalizeStateFromRow(data as SessionRow),
      submittedAnswers,
    });
    return;
  }

  // Modo direct: las respuestas vienen dentro del snapshot de game_sessions.
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

        // En modo server: el snapshot puede no tener las respuestas actuales
        // (submit_answer ya no las escribe ahí). Preservar las que tenemos en cache.
        if (shouldUseServerWrites) {
          setCachedState({
            ...nextState,
            submittedAnswers: cachedState.submittedAnswers,
          });
        } else {
          setCachedState(nextState);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void pullRemoteState();
      }
    });
}

/**
 * Canal Realtime exclusivo para submitted_answers.
 * Solo activo en modo server. Cada fila de respuesta llega individualmente
 * y se mergea en el estado local sin tocar el resto del snapshot.
 */
function ensureAnswersRealtimeChannel() {
  if (answersRealtimeChannel) {
    return;
  }

  const supabase = getSupabaseBrowserClient();
  answersRealtimeChannel = supabase
    .channel(`submitted-answers-${runtimeConfig.supabaseGameId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "submitted_answers",
        filter: `game_id=eq.${runtimeConfig.supabaseGameId}`,
      },
      (payload) => {
        const row = payload.new as SubmittedAnswerRow | undefined;

        if (!row?.table_id) {
          return;
        }

        mergeIncomingAnswer(rowToSubmittedAnswer(row));
      }
    )
    .subscribe();
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
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch("/api/game/command", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command,
        actorId,
        expectedRevision: cachedState.revision,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      state?: GameState;
      ignored?: boolean;
      conflict?: boolean;
    };

    if (body.state) {
      // Preservar las respuestas que ya tenemos en cache: el snapshot del servidor
      // puede no incluirlas si submit_answer usa la tabla separada.
      setCachedState({
        ...body.state,
        submittedAnswers: shouldUseServerWrites
          ? cachedState.submittedAnswers
          : body.state.submittedAnswers,
      });
    }

    if (response.ok) {
      if (!body.state) {
        await pullRemoteState();
      }
      return;
    }

    if (body.conflict || response.status === 409) {
      if (!body.state) {
        await pullRemoteState();
      }

      if (attempt < maxAttempts) {
        continue;
      }

      return;
    }

    throw new Error(body.error ?? "No se pudo ejecutar el comando en backend.");
  }
}

/**
 * Fast path para submit_answer en modo server.
 * No envía expectedRevision ni reintenta: el upsert del servidor es atómico
 * por (game_id, table_id, round_number) y no compite con otras mesas.
 */
async function commitSubmitAnswerCommand({
  tableId,
  optionId,
  actorId,
}: {
  tableId: string;
  optionId: string;
  actorId: string;
}) {
  const response = await fetch("/api/game/command", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      command: { type: "submit_answer", tableId, optionId },
      actorId,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "No se pudo registrar la respuesta.");
  }
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

    if (shouldUseServerWrites) {
      ensureAnswersRealtimeChannel();
    }
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
      // Optimistic update: el botón se muestra seleccionado inmediatamente,
      // sin esperar el round-trip al servidor.
      const optimisticState = submitAnswer(cachedState, tableId, optionId);
      if (optimisticState !== cachedState) {
        setCachedState(optimisticState);
      }

      void commitSubmitAnswerCommand({ tableId, optionId, actorId }).catch(
        (error) => {
          console.error("Supabase backend write error (submit_answer):", error);
          // Revertir al estado real del servidor si el POST falla.
          void pullRemoteState();
        }
      );
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

  setRoundDuration(seconds, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "set_round_duration", seconds },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => setRoundDuration(state, seconds),
      type: "round_duration_updated",
      actorRole: "operator",
      actorId,
      payload: (_currentState, nextState) => ({
        seconds: nextState.roundDurationSeconds,
      }),
    });
  },

  setPublicScreenSize(widthPx, heightPx, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "set_public_screen_size", widthPx, heightPx },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => setPublicScreenSize(state, widthPx, heightPx),
      type: "public_screen_size_updated",
      actorRole: "operator",
      actorId,
      payload: (_currentState, nextState) => ({
        widthPx: nextState.publicScreenWidthPx,
        heightPx: nextState.publicScreenHeightPx,
      }),
    });
  },

  setSoundSettings(settings, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "set_sound_settings", settings },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => setSoundSettings(state, settings),
      type: "sound_settings_updated",
      actorRole: "operator",
      actorId,
      payload: (_currentState, nextState) => ({
        gameMusicEnabled: nextState.soundSettings.gameMusicEnabled,
        roundMusicEnabled: nextState.soundSettings.roundMusicEnabled,
        effectsEnabled: nextState.soundSettings.effectsEnabled,
        musicVolume: nextState.soundSettings.musicVolume,
        effectsVolume: nextState.soundSettings.effectsVolume,
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
        roundNumber: getCurrentRoundNumber(currentState) + 1,
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
      reducer: (state) => ({
        ...resetGame(),
        gameId: runtimeConfig.supabaseGameId,
        publicScreenWidthPx: state.publicScreenWidthPx,
        publicScreenHeightPx: state.publicScreenHeightPx,
        soundSettings: state.soundSettings,
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

  enablePowerUps(actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "enable_power_ups" },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: enablePowerUps,
      type: "game_reset",
      actorRole: "operator",
      actorId,
      payload: () => ({ powerUpsEnabled: true }),
    });
  },

  adjustScore(tableId, delta, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "adjust_score", tableId, delta },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => adjustScore(state, tableId, delta),
      type: "scores_applied",
      actorRole: "operator",
      actorId,
      payload: () => ({ tableId, delta }),
    });
  },

  restorePowerUp(tableId, powerUpType, actorId = "operator") {
    if (shouldUseServerWrites) {
      void commitServerCommand({
        command: { type: "restore_power_up", tableId, powerUpType },
        actorId,
      }).catch((error) => {
        console.error("Supabase backend write error:", error);
      });
      return;
    }

    void commitRemoteState({
      reducer: (state) => restorePowerUp(state, tableId, powerUpType),
      type: "scores_applied",
      actorRole: "operator",
      actorId,
      payload: () => ({ tableId, powerUpType }),
    });
  },
});

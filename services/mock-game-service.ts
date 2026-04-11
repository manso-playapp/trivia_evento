"use client";

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
import {
  ensureStoredGameState,
  readStoredGameState,
  subscribeToGameState,
  writeStoredGameState,
} from "@/lib/game-storage";
import { createGameEvent, type GameService } from "@/services/game-service";
import type { GameActorRole, GameState } from "@/types";

const commitLocalState = ({
  reducer,
  type,
  payload,
  actorRole,
  actorId,
}: {
  reducer: (state: GameState) => GameState;
  type: Parameters<typeof createGameEvent>[0]["type"];
  payload: Record<string, string | number | boolean | null | string[]>;
  actorRole: GameActorRole;
  actorId: string;
}) => {
  const currentState = readStoredGameState();
  const nextState = reducer(currentState);

  if (nextState === currentState) {
    return;
  }

  const event = createGameEvent({
    gameId: nextState.gameId,
    type,
    actorRole,
    actorId,
    payload,
  });

  writeStoredGameState({
    ...nextState,
    revision: currentState.revision + 1,
    lastEvent: event,
  });
};

/**
 * Implementacion mock/local.
 * Reemplazo futuro:
 * - Supabase: `readState` desde tabla/cache y `subscribe` via channel.
 * - Firebase: `readState` via doc y `subscribe` con onSnapshot.
 * Las pantallas no deberian cambiar: solo cambia esta implementacion.
 */
export const mockGameService: GameService = {
  initialize() {
    ensureStoredGameState();
  },

  readState() {
    return readStoredGameState();
  },

  subscribe(listener) {
    return subscribeToGameState(listener);
  },

  revealQuestion(actorId = "operator") {
    const currentState = readStoredGameState();
    const nextState = revealQuestion(currentState);

    if (nextState === currentState) {
      return;
    }

    const event = createGameEvent({
      gameId: nextState.gameId,
      type: "question_revealed",
      actorRole: "operator",
      actorId,
      payload: {
        roundNumber: getCurrentRoundNumber(nextState),
        questionId: getCurrentQuestion(nextState)?.id ?? null,
      },
    });

    writeStoredGameState({
      ...nextState,
      revision: currentState.revision + 1,
      lastEvent: event,
    });
  },

  startRound(actorId = "operator") {
    const currentState = readStoredGameState();
    const nextState = startRound(currentState);

    if (nextState === currentState) {
      return;
    }

    const event = createGameEvent({
      gameId: nextState.gameId,
      type: "round_started",
      actorRole: "operator",
      actorId,
      payload: {
        roundNumber: getCurrentRoundNumber(nextState),
        roundEndsAt: nextState.roundEndsAt,
      },
    });

    writeStoredGameState({
      ...nextState,
      revision: currentState.revision + 1,
      lastEvent: event,
    });
  },

  submitAnswer(tableId, optionId, actorId = tableId) {
    commitLocalState({
      reducer: (state) => submitAnswer(state, tableId, optionId),
      type: "answer_submitted",
      actorRole: "table",
      actorId,
      payload: {
        tableId,
        optionId,
        roundNumber: getCurrentRoundNumber(readStoredGameState()),
      },
    });
  },

  setTableName(tableId, name, actorId = "operator") {
    commitLocalState({
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
    commitLocalState({
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
    commitLocalState({
      reducer: (state) => setActiveTableCount(state, count),
      type: "table_activity_updated",
      actorRole: "operator",
      actorId,
      payload: {
        activeTableCount: count,
      },
    });
  },

  lockRound(actorId = "operator") {
    commitLocalState({
      reducer: lockRound,
      type: "round_locked",
      actorRole: "operator",
      actorId,
      payload: {
        roundNumber: getCurrentRoundNumber(readStoredGameState()),
      },
    });
  },

  revealCorrectAnswer(actorId = "operator") {
    const currentState = readStoredGameState();
    const currentQuestion = getCurrentQuestion(currentState);

    commitLocalState({
      reducer: revealCorrectAnswer,
      type: "correct_answer_revealed",
      actorRole: "operator",
      actorId,
      payload: {
        roundNumber: getCurrentRoundNumber(currentState),
        questionId: currentQuestion?.id ?? null,
        correctOptionId: currentQuestion?.correctOptionId ?? null,
      },
    });
  },

  applyScores(actorId = "operator") {
    const currentState = readStoredGameState();
    const nextState = applyScores(currentState);

    if (nextState === currentState) {
      return;
    }

    const createdScoreEvents = nextState.scoreEvents
      .slice(currentState.scoreEvents.length)
      .map((scoreEvent) => scoreEvent.id);

    const event = createGameEvent({
      gameId: nextState.gameId,
      type: "scores_applied",
      actorRole: "operator",
      actorId,
      payload: {
        roundNumber: getCurrentRoundNumber(nextState),
        scoreEventIds: createdScoreEvents,
      },
    });

    writeStoredGameState({
      ...nextState,
      revision: currentState.revision + 1,
      lastEvent: event,
    });
  },

  activateX2(tableId, actorId = "operator") {
    commitLocalState({
      reducer: (state) => activateX2(state, tableId),
      type: "x2_activated",
      actorRole: "operator",
      actorId,
      payload: {
        tableId,
        roundNumber: getCurrentRoundNumber(readStoredGameState()),
      },
    });
  },

  activateBomb(sourceTableId, targetTableId, actorId = "operator") {
    const currentState = readStoredGameState();

    commitLocalState({
      reducer: (state) => activateBomb(state, sourceTableId, targetTableId),
      type: "bomb_activated",
      actorRole: "operator",
      actorId,
      payload: {
        sourceTableId,
        targetTableId,
        targetRoundNumber: getCurrentRoundNumber(currentState) + 1,
      },
    });
  },

  applyFreezeForRound(actorId = "system") {
    const currentState = readStoredGameState();
    const nextState = applyFreezeForRound(currentState);

    if (nextState === currentState) {
      return;
    }

    const frozenTables = nextState.tables
      .filter(
        (table) =>
          table.frozenRoundNumber === getCurrentRoundNumber(nextState) &&
          table.frozenByTableId
      )
      .map((table) => table.id);

    const event = createGameEvent({
      gameId: nextState.gameId,
      type: "freeze_applied",
      actorRole: "system",
      actorId,
      payload: {
        roundNumber: getCurrentRoundNumber(nextState),
        tableIds: frozenTables,
      },
    });

    writeStoredGameState({
      ...nextState,
      revision: currentState.revision + 1,
      lastEvent: event,
    });
  },

  resetGame(actorId = "operator") {
    const nextState = resetGame();
    const event = createGameEvent({
      gameId: nextState.gameId,
      type: "game_reset",
      actorRole: "operator",
      actorId,
      payload: {},
    });

    writeStoredGameState({
      ...nextState,
      revision: 1,
      lastEvent: event,
    });
  },

  simulateAnswers(actorId = "system") {
    commitLocalState({
      reducer: simulateAnswers,
      type: "answer_submitted",
      actorRole: "system",
      actorId,
      payload: {
        mode: "bulk-simulated",
        roundNumber: getCurrentRoundNumber(readStoredGameState()),
      },
    });
  },
};

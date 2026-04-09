import "server-only";

import {
  applyScores,
  lockRound,
  revealCorrectAnswer,
} from "@/engine/game-domain";
import {
  getCurrentQuestion,
  getCurrentRoundNumber,
} from "@/engine/game-selectors";
import {
  persistServerGameTransition,
  readOrSeedServerGameState,
} from "@/lib/server/game-session-store";
import { serverRuntimeConfig } from "@/lib/server/runtime-config";
import { createGameEvent } from "@/services/game-service";
import type { GameEvent, GameState } from "@/types";

const hasElapsedSince = (timestamp: string | null, delayMs: number) => {
  if (!timestamp) {
    return false;
  }

  return Date.now() - new Date(timestamp).getTime() >= delayMs;
};

const getReferenceTimestamp = (
  state: GameState,
  expectedEventType: GameEvent["type"]
) =>
  state.lastEvent?.type === expectedEventType
    ? state.lastEvent.createdAt
    : state.updatedAt;

const persistSystemTransition = async ({
  currentState,
  nextState,
  eventType,
  payload,
  actorId,
}: {
  currentState: GameState;
  nextState: GameState;
  eventType: GameEvent["type"];
  payload: GameEvent["payload"];
  actorId: string;
}) => {
  const event = createGameEvent({
    gameId: currentState.gameId,
    type: eventType,
    actorRole: "system",
    actorId,
    payload,
  });

  const persistedState = {
    ...nextState,
    gameId: currentState.gameId,
    revision: currentState.revision + 1,
    lastEvent: event,
  };

  await persistServerGameTransition({
    state: persistedState,
    event,
    expectedRevision: currentState.revision,
  });

  return persistedState;
};

/**
 * Ejecuta un solo paso de automatizacion del juego.
 *
 * La idea es mantener estas transiciones fuera de la UI para que despues
 * puedan vivir en un scheduler, worker o Edge Function sin reescribir reglas.
 */
export async function runServerGameAutomationTick() {
  const currentState = await readOrSeedServerGameState(
    serverRuntimeConfig.supabaseGameId
  );

  if (currentState.roundStatus === "round_active" && currentState.roundEndsAt) {
    const remainingMs = new Date(currentState.roundEndsAt).getTime() - Date.now();

    if (remainingMs <= 0) {
      const nextState = lockRound(currentState);

      if (nextState !== currentState) {
        const persistedState = await persistSystemTransition({
          currentState,
          nextState,
          eventType: "round_locked",
          actorId: "system-timer",
          payload: {
            roundNumber: getCurrentRoundNumber(currentState),
          },
        });

        return {
          state: persistedState,
          advanced: true,
          step: "round_locked" as const,
        };
      }
    }
  }

  if (
    currentState.roundStatus === "round_locked" &&
    hasElapsedSince(
      getReferenceTimestamp(currentState, "round_locked"),
      serverRuntimeConfig.revealDelayMs
    )
  ) {
    const currentQuestion = getCurrentQuestion(currentState);
    const nextState = revealCorrectAnswer(currentState);

    if (nextState !== currentState) {
      const persistedState = await persistSystemTransition({
        currentState,
        nextState,
        eventType: "correct_answer_revealed",
        actorId: "system-reveal",
        payload: {
          roundNumber: getCurrentRoundNumber(currentState),
          questionId: currentQuestion?.id ?? null,
          correctOptionId: currentQuestion?.correctOptionId ?? null,
        },
      });

      return {
        state: persistedState,
        advanced: true,
        step: "correct_answer_revealed" as const,
      };
    }
  }

  if (
    currentState.roundStatus === "answer_revealed" &&
    hasElapsedSince(
      getReferenceTimestamp(currentState, "correct_answer_revealed"),
      serverRuntimeConfig.scoreDelayMs
    )
  ) {
    const nextState = applyScores(currentState);

    if (nextState !== currentState) {
      const persistedState = await persistSystemTransition({
        currentState,
        nextState,
        eventType: "scores_applied",
        actorId: "system-score",
        payload: {
          roundNumber: getCurrentRoundNumber(nextState),
          scoreEventIds: nextState.scoreEvents
            .slice(currentState.scoreEvents.length)
            .map((scoreEvent) => scoreEvent.id),
        },
      });

      return {
        state: persistedState,
        advanced: true,
        step: "scores_applied" as const,
      };
    }
  }

  return {
    state: currentState,
    advanced: false,
    step: "noop" as const,
  };
}

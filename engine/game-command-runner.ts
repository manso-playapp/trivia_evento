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
  setPublicScreenSize,
  setRoundDuration,
  setTableActive,
  setTableName,
  simulateAnswers,
  startRound,
  submitAnswer,
} from "@/engine/game-domain";
import { getCurrentQuestion, getCurrentRoundNumber } from "@/engine/game-selectors";
import type { GameActorRole, GameCommand, GameEvent, GameState } from "@/types";

type GameCommandPayload = Record<
  string,
  string | number | boolean | null | string[]
>;

export type GameCommandExecution = {
  nextState: GameState;
  actorRole: GameActorRole;
  eventType: GameEvent["type"];
  payload: GameCommandPayload;
};

/**
 * Traduce comandos de transporte a cambios reales del dominio.
 *
 * Esta pieza permite usar el mismo lenguaje de acciones tanto desde cliente
 * como desde un backend futuro sin duplicar reglas ni nombres.
 */
export const executeGameCommand = (
  state: GameState,
  command: GameCommand
): GameCommandExecution => {
  switch (command.type) {
    case "reveal_question": {
      const nextState = revealQuestion(state);

      return {
        nextState,
        actorRole: "operator",
        eventType: "question_revealed",
        payload: {
          roundNumber: getCurrentRoundNumber(nextState),
          questionId: getCurrentQuestion(nextState)?.id ?? null,
        },
      };
    }

    case "start_round": {
      const nextState = startRound(state);

      return {
        nextState,
        actorRole: "operator",
        eventType: "round_started",
        payload: {
          roundNumber: getCurrentRoundNumber(nextState),
          roundEndsAt: nextState.roundEndsAt,
        },
      };
    }

    case "submit_answer": {
      const nextState = submitAnswer(state, command.tableId, command.optionId);

      return {
        nextState,
        actorRole: "table",
        eventType: "answer_submitted",
        payload: {
          tableId: command.tableId,
          optionId: command.optionId,
          roundNumber: getCurrentRoundNumber(state),
        },
      };
    }

    case "set_table_name": {
      const nextState = setTableName(state, command.tableId, command.name);
      const persistedName =
        nextState.tables.find((table) => table.id === command.tableId)?.name ??
        command.name;

      return {
        nextState,
        actorRole: "operator",
        eventType: "table_activity_updated",
        payload: {
          tableId: command.tableId,
          name: persistedName,
        },
      };
    }

    case "set_table_active": {
      const nextState = setTableActive(state, command.tableId, command.active);

      return {
        nextState,
        actorRole: "operator",
        eventType: "table_activity_updated",
        payload: {
          tableId: command.tableId,
          active: command.active,
        },
      };
    }

    case "set_active_table_count": {
      const nextState = setActiveTableCount(state, command.count);

      return {
        nextState,
        actorRole: "operator",
        eventType: "table_activity_updated",
        payload: {
          activeTableCount: nextState.tables.filter((table) => table.active).length,
        },
      };
    }

    case "set_round_duration": {
      const nextState = setRoundDuration(state, command.seconds);

      return {
        nextState,
        actorRole: "operator",
        eventType: "round_duration_updated",
        payload: {
          seconds: nextState.roundDurationSeconds,
        },
      };
    }

    case "set_public_screen_size": {
      const nextState = setPublicScreenSize(
        state,
        command.widthPx,
        command.heightPx
      );

      return {
        nextState,
        actorRole: "operator",
        eventType: "public_screen_size_updated",
        payload: {
          widthPx: nextState.publicScreenWidthPx,
          heightPx: nextState.publicScreenHeightPx,
        },
      };
    }

    case "lock_round": {
      const nextState = lockRound(state);

      return {
        nextState,
        actorRole: "operator",
        eventType: "round_locked",
        payload: {
          roundNumber: getCurrentRoundNumber(state),
        },
      };
    }

    case "reveal_correct_answer": {
      const currentQuestion = getCurrentQuestion(state);
      const nextState = revealCorrectAnswer(state);

      return {
        nextState,
        actorRole: "operator",
        eventType: "correct_answer_revealed",
        payload: {
          roundNumber: getCurrentRoundNumber(state),
          questionId: currentQuestion?.id ?? null,
          correctOptionId: currentQuestion?.correctOptionId ?? null,
        },
      };
    }

    case "apply_scores": {
      const nextState = applyScores(state);

      return {
        nextState,
        actorRole: "operator",
        eventType: "scores_applied",
        payload: {
          roundNumber: getCurrentRoundNumber(nextState),
          scoreEventIds: nextState.scoreEvents
            .slice(state.scoreEvents.length)
            .map((scoreEvent) => scoreEvent.id),
        },
      };
    }

    case "activate_x2": {
      const nextState = activateX2(state, command.tableId);

      return {
        nextState,
        actorRole: "operator",
        eventType: "x2_activated",
        payload: {
          tableId: command.tableId,
          roundNumber: getCurrentRoundNumber(state) + 1,
        },
      };
    }

    case "activate_bomb": {
      const nextState = activateBomb(
        state,
        command.sourceTableId,
        command.targetTableId
      );

      return {
        nextState,
        actorRole: "operator",
        eventType: "bomb_activated",
        payload: {
          sourceTableId: command.sourceTableId,
          targetTableId: command.targetTableId,
          targetRoundNumber: getCurrentRoundNumber(state) + 1,
        },
      };
    }

    case "apply_freeze_for_round": {
      const nextState = applyFreezeForRound(state);

      return {
        nextState,
        actorRole: "system",
        eventType: "freeze_applied",
        payload: {
          roundNumber: getCurrentRoundNumber(nextState),
          tableIds: nextState.tables
            .filter(
              (table) =>
                table.frozenRoundNumber === getCurrentRoundNumber(nextState) &&
                table.frozenByTableId
            )
            .map((table) => table.id),
        },
      };
    }

    case "reset_game": {
      const nextState = {
        ...resetGame(),
        gameId: state.gameId,
        publicScreenWidthPx: state.publicScreenWidthPx,
        publicScreenHeightPx: state.publicScreenHeightPx,
      };

      return {
        nextState,
        actorRole: "operator",
        eventType: "game_reset",
        payload: {},
      };
    }

    case "simulate_answers": {
      const nextState = simulateAnswers(state);

      return {
        nextState,
        actorRole: "system",
        eventType: "answer_submitted",
        payload: {
          mode: "bulk-simulated",
          roundNumber: getCurrentRoundNumber(state),
        },
      };
    }
  }
};

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { initialGameState } from "@/data/initial-game-state";
import {
  runtimeConfig,
  shouldUseClientTickPolling,
} from "@/lib/runtime-config";
import { gameService } from "@/services/create-game-service";
import type { AnswerOptionId, GameState, SoundSettings } from "@/types";

type GameActions = {
  revealQuestion: () => void;
  startRound: () => void;
  submitAnswer: (tableId: string, optionId: AnswerOptionId) => void;
  setRoundDuration: (seconds: number) => void;
  setPublicScreenSize: (widthPx: number, heightPx: number) => void;
  setSoundSettings: (settings: Partial<SoundSettings>) => void;
  setTableName: (tableId: string, name: string) => void;
  setTableActive: (tableId: string, active: boolean) => void;
  setActiveTableCount: (count: number) => void;
  lockRound: () => void;
  revealCorrectAnswer: () => void;
  applyScores: () => void;
  activateX2: (tableId: string) => void;
  activateBomb: (sourceTableId: string, targetTableId: string) => void;
  applyFreezeForRound: () => void;
  resetGame: () => void;
  simulateAnswers: () => void;
};

type GameContextValue = {
  state: GameState;
  actions: GameActions;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialGameState);

  useEffect(() => {
    /*
     * La UI consume un servicio, no el dominio directo.
     * En la version realtime futura, este provider puede seguir igual y solo
     * cambiar la implementacion elegida en `services/create-game-service.ts`.
     */
    gameService.initialize();

    const syncState = () => {
      setState(gameService.readState());
    };

    syncState();

    return gameService.subscribe(syncState);
  }, []);

  useEffect(() => {
    if (shouldUseClientTickPolling) {
      const shouldPollAutomationTick =
        state.roundStatus === "round_active" ||
        state.roundStatus === "round_locked" ||
        state.roundStatus === "answer_revealed";

      if (!shouldPollAutomationTick) {
        return;
      }

      const runAutomationTick = async () => {
        try {
          const response = await fetch("/api/game/tick", {
            method: "POST",
          });

          if (!response.ok) {
            return;
          }

          const body = (await response.json()) as {
            state?: GameState;
          };

          if (body.state) {
            setState(body.state);
          }
        } catch {
          // noop
        }
      };

      void runAutomationTick();

      const intervalId = window.setInterval(() => {
        void runAutomationTick();
      }, runtimeConfig.gameAutomationMode === "client" ? 1000 : 1500);

      return () => {
        window.clearInterval(intervalId);
      };
    }

    if (state.roundStatus !== "round_active" || !state.roundEndsAt) {
      return;
    }

    const timeoutMs = new Date(state.roundEndsAt).getTime() - Date.now();

    if (timeoutMs <= 0) {
      gameService.lockRound("system-timer");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      gameService.lockRound("system-timer");
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.roundEndsAt, state.roundStatus]);

  const actions: GameActions = {
    revealQuestion: () => gameService.revealQuestion(),
    startRound: () => gameService.startRound(),
    submitAnswer: (tableId, optionId) =>
      gameService.submitAnswer(tableId, optionId, tableId),
    setRoundDuration: (seconds) => gameService.setRoundDuration(seconds),
    setPublicScreenSize: (widthPx, heightPx) =>
      gameService.setPublicScreenSize(widthPx, heightPx),
    setSoundSettings: (settings) => gameService.setSoundSettings(settings),
    setTableName: (tableId, name) => gameService.setTableName(tableId, name),
    setTableActive: (tableId, active) =>
      gameService.setTableActive(tableId, active),
    setActiveTableCount: (count) => gameService.setActiveTableCount(count),
    lockRound: () => gameService.lockRound(),
    revealCorrectAnswer: () => gameService.revealCorrectAnswer(),
    applyScores: () => gameService.applyScores(),
    activateX2: (tableId) => gameService.activateX2(tableId),
    activateBomb: (sourceTableId, targetTableId) =>
      gameService.activateBomb(sourceTableId, targetTableId),
    applyFreezeForRound: () => gameService.applyFreezeForRound(),
    resetGame: () => gameService.resetGame(),
    simulateAnswers: () => gameService.simulateAnswers(),
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used inside GameProvider.");
  }

  return context;
};

"use client";

import { createInitialGameState, initialGameState } from "@/data/initial-game-state";
import type { GameState } from "@/types";

export const GAME_STORAGE_KEY = "trivia-evento-game-state";
const GAME_STORAGE_EVENT = "trivia-evento-game-state-updated";

const isBrowser = () => typeof window !== "undefined";

export const readStoredGameState = (): GameState => {
  if (!isBrowser()) {
    return initialGameState;
  }

  const rawState = window.localStorage.getItem(GAME_STORAGE_KEY);

  if (!rawState) {
    return initialGameState;
  }

  try {
    return JSON.parse(rawState) as GameState;
  } catch {
    return initialGameState;
  }
};

export const writeStoredGameState = (state: GameState) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(GAME_STORAGE_EVENT));
};

export const ensureStoredGameState = () => {
  if (!isBrowser()) {
    return;
  }

  if (!window.localStorage.getItem(GAME_STORAGE_KEY)) {
    writeStoredGameState(createInitialGameState());
  }
};

export const subscribeToGameState = (listener: () => void) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === GAME_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(GAME_STORAGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(GAME_STORAGE_EVENT, listener);
  };
};

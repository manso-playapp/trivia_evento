"use client";

import { createInitialGameState, initialGameState } from "@/data/initial-game-state";
import type { GameState } from "@/types";

const BASE_STORAGE_KEY = "trivia-evento-game-state";
const GAME_STORAGE_EVENT = "trivia-evento-game-state-updated";

const isBrowser = () => typeof window !== "undefined";

function readTableIdFromCookie(): string | null {
  if (!isBrowser() || typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)trivia_table_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Devuelve la clave de localStorage para el estado del juego.
 *
 * Con table_id (clientes de mesa): "trivia-evento-game-state:<tableId>"
 * Sin table_id (operador, sin cookie de mesa): "trivia-evento-game-state"
 *
 * El operador no tiene cookie trivia_table_session — es exactamente el
 * comportamiento correcto: usa la clave base y ve el estado global del game.
 * No es un olvido; ver decisión de modelo "un dispositivo = una mesa".
 */
export function getStateStorageKey(tableId: string | null): string {
  return tableId ? `${BASE_STORAGE_KEY}:${tableId}` : BASE_STORAGE_KEY;
}

function currentStorageKey(): string {
  return getStateStorageKey(readTableIdFromCookie());
}

export const readStoredGameState = (): GameState => {
  if (!isBrowser()) {
    return initialGameState;
  }

  const rawState = window.localStorage.getItem(currentStorageKey());

  if (!rawState) {
    return initialGameState;
  }

  try {
    const parsed = JSON.parse(rawState) as GameState;
    return {
      ...parsed,
      powerUpsEnabled: parsed.powerUpsEnabled ?? false,
      scoreAdjustments: parsed.scoreAdjustments ?? [],
    };
  } catch {
    return initialGameState;
  }
};

export const writeStoredGameState = (state: GameState) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(currentStorageKey(), JSON.stringify(state));
  window.dispatchEvent(new Event(GAME_STORAGE_EVENT));
};

export const ensureStoredGameState = () => {
  if (!isBrowser()) {
    return;
  }

  if (!window.localStorage.getItem(currentStorageKey())) {
    writeStoredGameState(createInitialGameState());
  }
};

export const subscribeToGameState = (listener: () => void) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const key = currentStorageKey();

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === key) {
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

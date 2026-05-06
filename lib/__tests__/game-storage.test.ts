/**
 * Tests de namespace de localStorage por mesa (Hipótesis 3).
 *
 * Qué prueba cada test:
 *
 * K1: cliente con cookie de mesa X → clave namespaced "trivia-evento-game-state:X".
 * K2: operador sin cookie → clave base "trivia-evento-game-state".
 * K3: mesas distintas generan claves distintas (garantía de aislamiento).
 *
 * S1: escribe estado con cookie mesa X → la clave usada en localStorage es la namespaced.
 * S2: escribe con cookie mesa X, lee con cookie mesa X → recupera el estado correcto.
 * S3: escribe con cookie mesa X, lee con cookie mesa Y → no recupera nada (aislamiento).
 * S4: sin cookie (operador) → escribe y lee bajo la clave base.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStateStorageKey, readStoredGameState, writeStoredGameState } from "@/lib/game-storage";
import type { GameState } from "@/types";

// --- K1–K3: getStateStorageKey (pura, sin browser) ---

describe("getStateStorageKey", () => {
  it("K1: mesa X → clave namespaced", () => {
    expect(getStateStorageKey("table-2")).toBe("trivia-evento-game-state:table-2");
  });

  it("K2: operador (null) → clave base", () => {
    expect(getStateStorageKey(null)).toBe("trivia-evento-game-state");
  });

  it("K3: mesas distintas generan claves distintas", () => {
    expect(getStateStorageKey("table-2")).not.toBe(getStateStorageKey("table-4"));
  });
});

// --- S1–S4: lectura/escritura con browser simulado ---

function makeStorage(): Record<string, string> {
  return {};
}

function stubBrowser(cookie: string | null, storage: Record<string, string>) {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = v; },
      removeItem: (k: string) => { delete storage[k]; },
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  vi.stubGlobal("document", {
    cookie: cookie ? `trivia_table_session=${cookie}` : "",
  });
}

describe("lectura y escritura namespaced", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = makeStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("S1: escribe con cookie mesa X → clave namespaced en localStorage", () => {
    stubBrowser("table-2", storage);
    const state = { gameId: "test" } as unknown as GameState;
    writeStoredGameState(state);
    expect(Object.keys(storage)).toContain("trivia-evento-game-state:table-2");
    expect(Object.keys(storage)).not.toContain("trivia-evento-game-state");
  });

  it("S2: escribe y lee con cookie mesa X → recupera el estado", () => {
    stubBrowser("table-2", storage);
    const state = { gameId: "test-game", powerUpsEnabled: true, scoreAdjustments: [] } as unknown as GameState;
    writeStoredGameState(state);
    const recovered = readStoredGameState();
    expect(recovered.gameId).toBe("test-game");
  });

  it("S3: escribe con cookie mesa X, lee con cookie mesa Y → no recupera nada", () => {
    // Escribe como mesa 2
    stubBrowser("table-2", storage);
    const state = { gameId: "test-game", powerUpsEnabled: false, scoreAdjustments: [] } as unknown as GameState;
    writeStoredGameState(state);
    vi.unstubAllGlobals();

    // Lee como mesa 4 (clave distinta → sin estado guardado)
    stubBrowser("table-4", storage);
    const recovered = readStoredGameState();
    // No hay estado en "trivia-evento-game-state:table-4" → devuelve initialGameState
    expect(recovered.gameId).not.toBe("test-game");
  });

  it("S4: sin cookie (operador) → usa clave base", () => {
    stubBrowser(null, storage);
    const state = { gameId: "op-game", powerUpsEnabled: false, scoreAdjustments: [] } as unknown as GameState;
    writeStoredGameState(state);
    expect(Object.keys(storage)).toContain("trivia-evento-game-state");
    expect(Object.keys(storage)).not.toContain("trivia-evento-game-state:null");
    const recovered = readStoredGameState();
    expect(recovered.gameId).toBe("op-game");
  });
});

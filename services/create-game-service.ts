import { shouldUseSupabase } from "@/lib/runtime-config";
import { mockGameService } from "@/services/mock-game-service";
import type { GameService } from "@/services/game-service";
import { createSupabaseGameService } from "@/services/supabase-game-service";

/**
 * Punto unico de composicion del servicio de juego.
 *
 * La UI nunca importa una implementacion concreta.
 * Cambiamos de mock a Supabase solo desde aca.
 */
const buildGameService = (): GameService => {
  if (shouldUseSupabase) {
    return createSupabaseGameService();
  }

  if (process.env.NEXT_PUBLIC_GAME_SYNC_PROVIDER === "supabase") {
    console.warn(
      "Supabase esta seleccionado pero faltan variables de entorno. Se usa mock."
    );
  }

  return mockGameService;
};

export const gameService: GameService = buildGameService();

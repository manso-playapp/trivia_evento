import { NextResponse } from "next/server";
import {
  hasSupabaseAdminCredentials,
  serverRuntimeConfig,
} from "@/lib/server/runtime-config";
import { readOrSeedServerGameState } from "@/lib/server/game-session-store";

/**
 * Endpoint simple de inspeccion/lectura.
 * No es necesario para la UI actual, pero deja una base BFF para depuracion,
 * health checks o futuros clientes que no lean directo desde Supabase.
 */
export async function GET() {
  if (!hasSupabaseAdminCredentials) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. La lectura segura por backend no esta habilitada.",
      },
      { status: 503 }
    );
  }

  try {
    const state = await readOrSeedServerGameState(
      serverRuntimeConfig.supabaseGameId
    );

    return NextResponse.json({ state });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado al leer el juego.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { runServerGameAutomationTick } from "@/lib/server/game-automation";
import { hasValidCronAuthorization } from "@/lib/server/cron-auth";
import { GameStateConflictError } from "@/lib/server/game-session-store";
import {
  hasSupabaseAdminCredentials,
  serverRuntimeConfig,
} from "@/lib/server/runtime-config";

/**
 * Endpoint pensado para un scheduler externo o Vercel Cron.
 *
 * No depende de una pestaña abierta. Si hay un scheduler serio llamando esta
 * ruta, la UI puede dejar de hacer polling al backend.
 */
export async function GET(request: NextRequest) {
  if (!hasValidCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  if (!hasSupabaseAdminCredentials) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. La automatizacion remota no esta habilitada.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runServerGameAutomationTick();

    return NextResponse.json({
      ...result,
      gameId: serverRuntimeConfig.supabaseGameId,
      triggeredBy: "scheduler",
    });
  } catch (error) {
    if (error instanceof GameStateConflictError) {
      return NextResponse.json(
        {
          state: error.currentState,
          advanced: false,
          step: "conflict",
          conflict: true,
        },
        { status: 409 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Error inesperado en cron game tick.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

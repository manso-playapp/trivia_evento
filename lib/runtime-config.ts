/**
 * Configuracion publica del cliente.
 *
 * Solo usamos variables `NEXT_PUBLIC_*` porque esta capa vive en el navegador.
 * En Next.js 16, cualquier variable sin ese prefijo no llega al bundle cliente.
 */
export const runtimeConfig = {
  gameSyncProvider: process.env.NEXT_PUBLIC_GAME_SYNC_PROVIDER ?? "mock",
  gameWriteMode: process.env.NEXT_PUBLIC_GAME_WRITE_MODE ?? "direct",
  gameAutomationMode:
    process.env.NEXT_PUBLIC_GAME_AUTOMATION_MODE ?? "hybrid",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",
  supabaseGameId: process.env.NEXT_PUBLIC_SUPABASE_GAME_ID ?? "trivia-evento-mvp",
} as const;

export const isSupabaseConfigured = Boolean(
  runtimeConfig.supabaseUrl && runtimeConfig.supabasePublishableKey
);

export const shouldUseSupabase =
  runtimeConfig.gameSyncProvider === "supabase" && isSupabaseConfigured;

export const shouldUseServerWrites =
  shouldUseSupabase && runtimeConfig.gameWriteMode === "server";

export const shouldUseClientTickPolling =
  shouldUseServerWrites && runtimeConfig.gameAutomationMode !== "scheduler";

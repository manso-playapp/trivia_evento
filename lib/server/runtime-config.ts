import "server-only";

/**
 * Configuracion privada del servidor.
 * Estas variables nunca deben consumirse desde componentes cliente.
 */
export const serverRuntimeConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseGameId: process.env.NEXT_PUBLIC_SUPABASE_GAME_ID ?? "trivia-evento-mvp",
  operatorApiToken: process.env.TRIVIA_OPERATOR_API_TOKEN ?? "",
  gameAutomationMode:
    process.env.NEXT_PUBLIC_GAME_AUTOMATION_MODE ?? "hybrid",
  revealDelayMs: Number(process.env.TRIVIA_REVEAL_DELAY_MS ?? "2500"),
  scoreDelayMs: Number(process.env.TRIVIA_SCORE_DELAY_MS ?? "2500"),
} as const;

export const hasSupabaseAdminCredentials = Boolean(
  serverRuntimeConfig.supabaseUrl && serverRuntimeConfig.supabaseServiceRoleKey
);

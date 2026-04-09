import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  hasSupabaseAdminCredentials,
  serverRuntimeConfig,
} from "@/lib/server/runtime-config";

let supabaseAdminClient: SupabaseClient | null = null;

/**
 * Cliente administrativo para writes del lado servidor.
 * Solo debe usarse en Route Handlers o utilidades server-only.
 */
export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!hasSupabaseAdminCredentials) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor."
    );
  }

  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  supabaseAdminClient = createClient(
    serverRuntimeConfig.supabaseUrl,
    serverRuntimeConfig.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return supabaseAdminClient;
};

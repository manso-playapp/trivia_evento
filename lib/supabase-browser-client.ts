"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runtimeConfig } from "@/lib/runtime-config";

let supabaseClient: SupabaseClient | null = null;

/**
 * Cliente browser singleton.
 * Esta app todavia no usa auth, por eso desactivamos persistencia de sesion.
 */
export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabasePublishableKey) {
    throw new Error("Supabase no esta configurado en las variables de entorno.");
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return supabaseClient;
};

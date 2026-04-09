"use client";

import { useCallback, useEffect, useState } from "react";
import { shouldUseServerWrites } from "@/lib/runtime-config";

type TableSessionState = {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  signIn: (accessCode: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

/**
 * Sesion minima por mesa.
 * Solo es relevante cuando los writes pasan por backend.
 */
export const useTableSession = (tableId: string): TableSessionState => {
  const [authenticated, setAuthenticated] = useState(!shouldUseServerWrites);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!shouldUseServerWrites) {
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/table/session?tableId=${encodeURIComponent(tableId)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const body = (await response.json()) as { authenticated?: boolean };

      setAuthenticated(Boolean(body.authenticated));
      setError(null);
    } catch {
      setError("No se pudo verificar la sesion de la mesa.");
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (accessCode: string) => {
      setLoading(true);

      try {
        const response = await fetch("/api/table/session", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tableId,
            accessCode,
          }),
        });

        const body = (await response.json()) as { error?: string };

        if (!response.ok) {
          setAuthenticated(false);
          setError(body.error ?? "No se pudo abrir sesion de mesa.");
          return false;
        }

        setAuthenticated(true);
        setError(null);
        return true;
      } catch {
        setAuthenticated(false);
        setError("No se pudo abrir sesion de mesa.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [tableId]
  );

  const signOut = useCallback(async () => {
    setLoading(true);

    try {
      await fetch("/api/table/session", {
        method: "DELETE",
        credentials: "include",
      });
      setAuthenticated(false);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    authenticated,
    loading,
    error,
    signIn,
    signOut,
  };
};

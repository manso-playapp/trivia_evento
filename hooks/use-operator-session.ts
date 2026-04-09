"use client";

import { useCallback, useEffect, useState } from "react";
import { shouldUseServerWrites } from "@/lib/runtime-config";

type OperatorSessionState = {
  enabled: boolean;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  signIn: (token: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const defaultState = {
  enabled: false,
  authenticated: true,
  loading: false,
  error: null,
};

/**
 * Hook de sesion minima para la vista `/operator`.
 * Solo se activa cuando la app usa backend writes.
 */
export const useOperatorSession = (): OperatorSessionState => {
  const [enabled, setEnabled] = useState(defaultState.enabled);
  const [authenticated, setAuthenticated] = useState(defaultState.authenticated);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(defaultState.error);

  const refresh = useCallback(async () => {
    if (!shouldUseServerWrites) {
      setEnabled(false);
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/operator/session", {
        method: "GET",
        credentials: "include",
      });
      const body = (await response.json()) as {
        enabled?: boolean;
        authenticated?: boolean;
      };

      setEnabled(Boolean(body.enabled));
      setAuthenticated(Boolean(body.authenticated));
      setError(null);
    } catch {
      setError("No se pudo verificar la sesion del operador.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (token: string) => {
    setLoading(true);

    try {
      const response = await fetch("/api/operator/session", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setAuthenticated(false);
        setError(body.error ?? "No se pudo abrir sesion de operador.");
        return false;
      }

      setEnabled(true);
      setAuthenticated(true);
      setError(null);
      return true;
    } catch {
      setAuthenticated(false);
      setError("No se pudo abrir sesion de operador.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);

    try {
      await fetch("/api/operator/session", {
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
    enabled,
    authenticated,
    loading,
    error,
    signIn,
    signOut,
  };
};

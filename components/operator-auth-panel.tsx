"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";

type OperatorAuthPanelProps = {
  loading: boolean;
  error: string | null;
  onSubmit: (token: string) => Promise<boolean>;
};

export function OperatorAuthPanel({
  loading,
  error,
  onSubmit,
}: OperatorAuthPanelProps) {
  const [token, setToken] = useState("");

  return (
    <SectionCard
      title="Acceso de operador"
      description="Esta pantalla ahora requiere una sesion minima para ejecutar comandos administrativos."
    >
      <div className="space-y-4">
        <div className="rounded-[1.2rem] border border-accent/20 bg-accent/10 p-4 text-sm text-accent-foreground/90">
          <p className="flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-accent">
            <ShieldCheck className="size-4" />
            Operador protegido
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresá el token configurado en `TRIVIA_OPERATOR_API_TOKEN` para habilitar los controles.
          </p>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(token);
          }}
        >
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Token de operador"
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-accent"
          />
          <Button type="submit" className="h-11 w-full justify-center" disabled={loading}>
            {loading ? "Validando acceso..." : "Entrar al panel"}
          </Button>
        </form>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </SectionCard>
  );
}

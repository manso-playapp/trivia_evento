"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";

type TableAuthPanelProps = {
  tableName: string;
  tableId: string;
  autoAccessEnabled?: boolean;
  loading: boolean;
  error: string | null;
  onSubmit: (accessCode: string) => Promise<boolean>;
};

export function TableAuthPanel({
  tableName,
  tableId,
  autoAccessEnabled = false,
  loading,
  error,
  onSubmit,
}: TableAuthPanelProps) {
  const [accessCode, setAccessCode] = useState("");

  return (
    <SectionCard
      title={`Acceso de ${tableName}`}
      description="La mesa necesita validar su codigo antes de poder responder."
    >
      <div className="space-y-4">
        <div className="app-accent-panel p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-accent">
            <Smartphone className="size-4" />
            Acceso por mesa
          </p>
          <p className="mt-2 text-muted-foreground">
            {autoAccessEnabled
              ? `Estamos intentando validar automaticamente el acceso de ${tableName}.`
              : `Ingresá el codigo asignado a ${tableName}.`}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Identificador: {tableId}
          </p>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(accessCode);
          }}
        >
          <input
            type="password"
            inputMode="numeric"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="Codigo de mesa"
            className="app-input h-12 text-base"
          />
          <Button type="submit" className="h-12 w-full justify-center" disabled={loading}>
            {loading ? "Validando mesa..." : "Entrar a responder"}
          </Button>
        </form>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </SectionCard>
  );
}

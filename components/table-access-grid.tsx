"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Copy, ExternalLink, KeyRound } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { QrCodeTile } from "@/components/qr-code-tile";
import { getTableAccessCode, getTableJoinUrl } from "@/lib/table-access";
import { cn } from "@/lib/utils";
import type { Table } from "@/types";

type TableAccessGridProps = {
  tables: Table[];
};

const copyToClipboard = async (value: string) => {
  await navigator.clipboard.writeText(value);
};

export function TableAccessGrid({ tables }: TableAccessGridProps) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  const tableAccessEntries = useMemo(
    () =>
      tables.map((table) => {
        const accessCode = getTableAccessCode(table.id) ?? "";
        const joinUrl = getTableJoinUrl({
          tableId: table.id,
          accessCode,
          origin,
        });

        return {
          table,
          accessCode,
          joinUrl,
        };
      }),
    [origin, tables]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[1.35rem] border border-accent/20 bg-accent/10 p-4 text-sm text-muted-foreground">
        <p className="font-semibold uppercase tracking-[0.18em] text-accent">
          Acceso por QR
        </p>
        <p className="mt-2">
          Cada QR abre la URL de participacion de una mesa y lleva el codigo de
          acceso en el link para entrar directo al juego.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {tableAccessEntries.map(({ table, accessCode, joinUrl }) => (
          <article
            key={table.id}
            className="broadcast-panel-soft flex flex-col gap-4 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {table.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {table.id}
                </p>
              </div>
              <div className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-warning">
                Join QR
              </div>
            </div>

            <QrCodeTile value={joinUrl} label={`QR de acceso para ${table.name}`} />

            <div className="rounded-[1.1rem] border border-border/60 bg-background/60 p-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <KeyRound className="size-3.5" />
                Codigo de respaldo
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[0.22em] text-foreground">
                {accessCode}
              </p>
            </div>

            <div className="rounded-[1.1rem] border border-border/60 bg-background/60 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                URL de participacion
              </p>
              <p className="mt-2 break-all text-sm text-foreground/90">
                {joinUrl}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 justify-center"
                onClick={() => void copyToClipboard(joinUrl)}
              >
                <Copy className="size-4" />
                Copiar link
              </Button>
              <Link
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-11 justify-center"
                )}
              >
                <ExternalLink className="size-4" />
                Abrir mesa
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

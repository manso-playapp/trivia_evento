"use client";

import { useState } from "react";
import { Minus, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Table } from "@/types";

type TableRosterManagerProps = {
  tables: Table[];
  disabled?: boolean;
  onSetTableName: (tableId: string, name: string) => void;
  onSetTableActive: (tableId: string, active: boolean) => void;
  onSetActiveTableCount: (count: number) => void;
};

export function TableRosterManager({
  tables,
  disabled = false,
  onSetTableName,
  onSetTableActive,
  onSetActiveTableCount,
}: TableRosterManagerProps) {
  const activeCount = tables.filter((table) => table.active).length;
  const minTableCount = 1;
  const maxTableCount = tables.length;
  const [editedNamesByTableId, setEditedNamesByTableId] = useState<
    Record<string, string>
  >({});

  return (
    <div className="space-y-5">
      <div className="app-accent-panel p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-accent">
          <Users className="size-4" />
          Configuracion de mesas
        </p>
        <p className="mt-2">
          Defini que mesas participan en este evento. La cantidad solo se puede
          cambiar antes de empezar la partida.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-foreground/80">
          {activeCount}/{tables.length} mesas activas
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="size-11 p-0"
          disabled={disabled || activeCount <= minTableCount}
          aria-label="Quitar una mesa"
          title="Quitar una mesa"
          onClick={() =>
            onSetActiveTableCount(Math.max(minTableCount, activeCount - 1))
          }
        >
          <Minus className="size-4" />
        </Button>
        <div className="min-w-36 border border-border/70 bg-[#2d333d] px-4 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Mesas
          </p>
          <p className="text-2xl font-semibold leading-none text-foreground">
            {activeCount}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="size-11 p-0"
          disabled={disabled || activeCount >= maxTableCount}
          aria-label="Agregar una mesa"
          title="Agregar una mesa"
          onClick={() =>
            onSetActiveTableCount(Math.min(maxTableCount, activeCount + 1))
          }
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`rounded-[0.95rem] border p-4 ${
              table.active
                ? "border-border/70 bg-[#2d333d]"
                : "border-border/40 bg-[#252a31] opacity-70"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{table.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {table.id}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  table.active
                    ? "border border-success/30 bg-success/10 text-success"
                    : "border border-border/60 bg-background/80 text-muted-foreground"
                }`}
              >
                {table.active ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="mb-3 space-y-2">
              <input
                type="text"
                value={editedNamesByTableId[table.id] ?? table.name}
                onChange={(event) =>
                  setEditedNamesByTableId((currentDrafts) => ({
                    ...currentDrafts,
                    [table.id]: event.target.value,
                  }))
                }
                placeholder="Nombre de la mesa"
                className="app-input h-10"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full justify-center"
                disabled={
                  disabled ||
                  !editedNamesByTableId[table.id] ||
                  editedNamesByTableId[table.id].trim() === "" ||
                  editedNamesByTableId[table.id].trim() === table.name
                }
                onClick={() => {
                  const normalizedName = (editedNamesByTableId[table.id] ?? "")
                    .trim()
                    .replace(/\s+/g, " ");

                  if (!normalizedName) {
                    return;
                  }

                  setEditedNamesByTableId((currentDrafts) => {
                    const nextDrafts = { ...currentDrafts };
                    delete nextDrafts[table.id];
                    return nextDrafts;
                  });
                  onSetTableName(table.id, normalizedName);
                }}
              >
                Guardar nombre
              </Button>
            </div>

            <Button
              type="button"
              variant={table.active ? "outline" : "default"}
              className="h-10 w-full justify-center"
              disabled={disabled}
              onClick={() => onSetTableActive(table.id, !table.active)}
            >
              {table.active ? "Dar de baja" : "Dar de alta"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

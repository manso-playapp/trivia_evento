"use client";

import { useEffect, useState } from "react";
import { BookOpenText, CircleAlert, RefreshCcw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProjectMetaResponse = {
  release: {
    version: string;
    releasedAt: string;
    notes: string[];
  };
  context: {
    updatedAt: string | null;
    summary: string;
    handoffChecklist: string[];
    openRisks: string[];
  };
  handoff: {
    generatedAt: string | null;
    preview: string;
    lineCount: number;
  };
  source: {
    changelog: string;
    projectContext: string;
    handoff: string;
  };
};

export function VersionContextPanel() {
  const [meta, setMeta] = useState<ProjectMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkpointLoading, setCheckpointLoading] = useState(false);

  const loadMeta = async (controller?: AbortController) => {
    setLoading(true);

    try {
      const response = await fetch("/api/meta/context", {
        method: "GET",
        cache: "no-store",
        signal: controller?.signal,
      });
      const body = (await response.json()) as ProjectMetaResponse;

      if (!response.ok) {
        throw new Error("No se pudo leer metadata de version/contexto.");
      }

      setMeta(body);
      setError(null);
    } catch (fetchError) {
      if (controller?.signal.aborted) {
        return;
      }

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "No se pudo leer metadata de version/contexto."
      );
    } finally {
      if (!controller?.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadMeta(controller);

    return () => {
      controller.abort();
    };
  }, []);

  const runCheckpoint = async () => {
    setCheckpointLoading(true);

    try {
      const response = await fetch("/api/meta/context/checkpoint", {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "No se pudo refrescar el checkpoint.");
      }

      await loadMeta();
    } catch (checkpointError) {
      setError(
        checkpointError instanceof Error
          ? checkpointError.message
          : "No se pudo refrescar el checkpoint."
      );
    } finally {
      setCheckpointLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="broadcast-panel-soft p-4 text-sm text-muted-foreground">
        Cargando metadata de version y contexto...
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="broadcast-panel-soft rounded-[0.95rem] p-4 text-sm text-danger">
        {error ?? "No hay metadata disponible."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="app-accent-panel p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          <Tag className="size-3.5" />
          Version activa
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {meta.release.version}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Release: {meta.release.releasedAt}
          {" | "}
          Context update: {meta.context.updatedAt ?? "sin fecha"}
          {" | "}
          Handoff generated: {meta.handoff.generatedAt ?? "pendiente"}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-10 justify-center"
          onClick={() => void runCheckpoint()}
          disabled={checkpointLoading}
        >
          {checkpointLoading ? "Actualizando..." : "Actualizar checkpoint ahora"}
        </Button>
      </div>

      <div className="broadcast-panel-soft rounded-[0.95rem] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <RefreshCcw className="size-3.5" />
          Ultimos cambios
        </p>
        <ul className="mt-3 space-y-2 text-sm text-foreground/90">
          {meta.release.notes.slice(0, 5).map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      </div>

      <div className="broadcast-panel-soft rounded-[0.95rem] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <BookOpenText className="size-3.5" />
          Contexto comprimido
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">
          {meta.handoff.preview}
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          lineas en handoff: {meta.handoff.lineCount}
        </p>
      </div>

      <div className="broadcast-panel-soft rounded-[0.95rem] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-warning">
          <CircleAlert className="size-3.5" />
          Checklist para nuevo hilo
        </p>
        <ul className="mt-3 space-y-2 text-sm text-foreground/90">
          {meta.context.handoffChecklist.length > 0 ? (
            meta.context.handoffChecklist.map((item) => <li key={item}>- {item}</li>)
          ) : (
            <li>- Completar checklist en `docs/PROJECT_CONTEXT.md`.</li>
          )}
        </ul>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Fuentes: {meta.source.changelog}, {meta.source.projectContext} y{" "}
          {meta.source.handoff}
        </p>
      </div>
    </div>
  );
}

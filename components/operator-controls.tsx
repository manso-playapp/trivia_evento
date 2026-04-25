"use client";

import { useEffect, useState } from "react";
import { ChevronRight, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GameState } from "@/types";

type OperatorControlsProps = {
  state: GameState;
  disabled?: boolean;
  sessionLoading?: boolean;
  onSignOut?: () => Promise<void>;
  onRevealQuestion: () => void;
  onLockRound: () => void;
  onRevealAnswer: () => void;
  onApplyScore: () => void;
  onSetRoundDuration: (seconds: number) => void;
  onSetPublicScreenSize: (widthPx: number, heightPx: number) => void;
  onSimulateAnswers: () => void;
  onResetGame: () => void;
  onActivateX2: (tableId: string) => void;
  onScheduleBomb: (sourceTableId: string, targetTableId: string) => void;
};

export function OperatorControls({
  state,
  disabled = false,
  sessionLoading = false,
  onSignOut,
  onRevealQuestion,
  onLockRound,
  onRevealAnswer,
  onApplyScore,
  onSetRoundDuration,
  onSetPublicScreenSize,
  onSimulateAnswers,
  onResetGame,
  onActivateX2,
  onScheduleBomb,
}: OperatorControlsProps) {
  const [selectedX2TableId, setSelectedX2TableId] = useState(
    state.tables[0]?.id ?? ""
  );
  const [selectedBombSourceId, setSelectedBombSourceId] = useState(
    state.tables[0]?.id ?? ""
  );
  const [selectedBombTargetId, setSelectedBombTargetId] = useState(
    state.tables[1]?.id ?? state.tables[0]?.id ?? ""
  );
  const [roundDurationDraft, setRoundDurationDraft] = useState(
    String(state.roundDurationSeconds)
  );
  const [screenWidthDraft, setScreenWidthDraft] = useState(
    String(state.publicScreenWidthPx ?? 1356)
  );
  const [screenHeightDraft, setScreenHeightDraft] = useState(
    String(state.publicScreenHeightPx ?? 768)
  );
  const powerUpControlsDisabled = disabled || state.roundStatus !== "score_updated";
  const roundDurationControlsDisabled =
    disabled || state.roundStatus === "round_active";
  const parsedRoundDurationDraft = Number(roundDurationDraft);
  const isRoundDurationDraftValid =
    Number.isInteger(parsedRoundDurationDraft) &&
    parsedRoundDurationDraft >= 10 &&
    parsedRoundDurationDraft <= 120;
  const hasPendingRoundDurationChange =
    isRoundDurationDraftValid &&
    parsedRoundDurationDraft !== state.roundDurationSeconds;
  const parsedScreenWidthDraft = Number(screenWidthDraft);
  const parsedScreenHeightDraft = Number(screenHeightDraft);
  const currentScreenWidthPx = state.publicScreenWidthPx ?? 1356;
  const currentScreenHeightPx = state.publicScreenHeightPx ?? 768;
  const isScreenSizeDraftValid =
    Number.isInteger(parsedScreenWidthDraft) &&
    parsedScreenWidthDraft >= 320 &&
    parsedScreenWidthDraft <= 7680 &&
    Number.isInteger(parsedScreenHeightDraft) &&
    parsedScreenHeightDraft >= 320 &&
    parsedScreenHeightDraft <= 7680;
  const hasPendingScreenSizeChange =
    isScreenSizeDraftValid &&
    (parsedScreenWidthDraft !== currentScreenWidthPx ||
      parsedScreenHeightDraft !== currentScreenHeightPx);
  const nextStep = (() => {
    switch (state.roundStatus) {
      case "idle":
        return {
          label: "Lanzar primera pregunta",
          description: "Abre la ronda y arranca el timer.",
          action: onRevealQuestion,
          disabled: false,
        };
      case "score_updated":
        return {
          label: "Lanzar siguiente pregunta",
          description: "Pasa de la pausa entre rondas a la proxima pregunta.",
          action: onRevealQuestion,
          disabled: false,
        };
      case "round_active":
        return {
          label: "Cerrar respuestas",
          description: "Bloquea las respuestas de la ronda actual.",
          action: onLockRound,
          disabled: false,
        };
      case "round_locked":
        return {
          label: "Revelar correcta",
          description: "Muestra la opcion correcta al publico.",
          action: onRevealAnswer,
          disabled: false,
        };
      case "answer_revealed":
        return {
          label: "Actualizar score",
          description: "Aplica los puntos y muestra la pausa de ronda.",
          action: onApplyScore,
          disabled: false,
        };
      case "question_revealed":
        return {
          label: "Ronda preparada",
          description: "La pregunta ya fue revelada. Espera el inicio de la ronda.",
          action: undefined,
          disabled: true,
        };
      case "game_finished":
        return {
          label: "Partida finalizada",
          description: "Reinicia la partida para volver a operar desde cero.",
          action: undefined,
          disabled: true,
        };
      default:
        return {
          label: "Siguiente paso",
          description: "No hay una accion disponible para este estado.",
          action: undefined,
          disabled: true,
        };
    }
  })();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setRoundDurationDraft(String(state.roundDurationSeconds));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.roundDurationSeconds]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setScreenWidthDraft(String(currentScreenWidthPx));
      setScreenHeightDraft(String(currentScreenHeightPx));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentScreenHeightPx, currentScreenWidthPx]);

  return (
    <div className="broadcast-panel space-y-5 px-5 py-5">
      {disabled ? (
        <div className="app-accent-panel p-4 text-sm text-foreground">
          Los controles estan bloqueados hasta validar la sesion de operador.
        </div>
      ) : null}

      <div className="broadcast-panel-soft p-4">
        <p className="broadcast-label mb-2">Control principal</p>
        <p className="mb-4 text-sm text-muted-foreground">
          {nextStep.description}
        </p>
        <Button
          onClick={nextStep.action}
          className="h-12 w-full justify-center gap-2"
          disabled={disabled || nextStep.disabled || !nextStep.action}
        >
          <ChevronRight className="size-4" />
          {nextStep.label}
        </Button>
      </div>

      <div className="broadcast-panel-soft p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="broadcast-label mb-2">Timer proxima ronda</p>
            <p className="text-sm text-muted-foreground">
              Cambia los segundos antes de lanzar la siguiente pregunta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[0.75rem] border border-border/70 bg-background/70 text-lg font-semibold text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() =>
                setRoundDurationDraft((currentValue) =>
                  String(Math.max(10, (Number(currentValue) || state.roundDurationSeconds) - 5))
                )
              }
              disabled={roundDurationControlsDisabled}
              aria-label="Restar 5 segundos"
            >
              -
            </button>
            <label className="flex items-center gap-2 rounded-[0.75rem] border border-border/70 bg-background/70 px-3 py-2.5">
              <input
                type="number"
                min={10}
                max={120}
                step={5}
                value={roundDurationDraft}
                onChange={(event) => setRoundDurationDraft(event.target.value)}
                className="w-16 bg-transparent text-center text-lg font-semibold text-foreground outline-none"
                disabled={roundDurationControlsDisabled}
                aria-label="Segundos por ronda"
              />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                seg
              </span>
            </label>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[0.75rem] border border-border/70 bg-background/70 text-lg font-semibold text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() =>
                setRoundDurationDraft((currentValue) =>
                  String(Math.min(120, (Number(currentValue) || state.roundDurationSeconds) + 5))
                )
              }
              disabled={roundDurationControlsDisabled}
              aria-label="Sumar 5 segundos"
            >
              +
            </button>
            <Button
              onClick={() => onSetRoundDuration(parsedRoundDurationDraft)}
              variant="secondary"
              className="h-11 justify-center"
              disabled={roundDurationControlsDisabled || !hasPendingRoundDurationChange}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </div>

      <div className="broadcast-panel-soft p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="broadcast-label mb-2">Render pantalla publica</p>
            <p className="text-sm text-muted-foreground">
              Ajusta el lienzo exacto para la pantalla LED.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="grid gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Ancho px
              </span>
              <input
                type="number"
                min={320}
                max={7680}
                step={1}
                value={screenWidthDraft}
                onChange={(event) => setScreenWidthDraft(event.target.value)}
                className="app-input h-11 w-28 text-center text-lg font-semibold"
                disabled={disabled}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Alto px
              </span>
              <input
                type="number"
                min={320}
                max={7680}
                step={1}
                value={screenHeightDraft}
                onChange={(event) => setScreenHeightDraft(event.target.value)}
                className="app-input h-11 w-28 text-center text-lg font-semibold"
                disabled={disabled}
              />
            </label>
            <Button
              onClick={() =>
                onSetPublicScreenSize(
                  parsedScreenWidthDraft,
                  parsedScreenHeightDraft
                )
              }
              variant="secondary"
              className="mt-5 h-11 justify-center"
              disabled={disabled || !hasPendingScreenSizeChange}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="broadcast-panel-soft p-4">
          <p className="broadcast-label mb-3">
            Activar X2
          </p>
          <select
            value={selectedX2TableId}
            onChange={(event) => setSelectedX2TableId(event.target.value)}
            className="app-input mb-3"
            disabled={powerUpControlsDisabled}
          >
            {state.tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
          <Button
            onClick={() => onActivateX2(selectedX2TableId)}
            variant="outline"
            className="h-11 w-full justify-center"
            disabled={powerUpControlsDisabled}
          >
            Activar X2 en mesa
          </Button>
        </div>

        <div className="broadcast-panel-soft p-4">
          <p className="broadcast-label mb-3">
            Programar bomba
          </p>
          <div className="grid gap-3">
            <select
              value={selectedBombSourceId}
              onChange={(event) => setSelectedBombSourceId(event.target.value)}
              className="app-input"
              disabled={powerUpControlsDisabled}
            >
              {state.tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Fuente: {table.name}
                </option>
              ))}
            </select>
            <select
              value={selectedBombTargetId}
              onChange={(event) => setSelectedBombTargetId(event.target.value)}
              className="app-input"
              disabled={powerUpControlsDisabled}
            >
              {state.tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Destino: {table.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() => onScheduleBomb(selectedBombSourceId, selectedBombTargetId)}
              variant="outline"
              className="h-11 w-full justify-center"
              disabled={
                powerUpControlsDisabled ||
                selectedBombSourceId === selectedBombTargetId
              }
            >
              Programar bomba
            </Button>
          </div>
        </div>
      </div>

      {onSignOut ? (
        <Button
          onClick={() => void onSignOut()}
          variant="outline"
          className="h-11 w-full justify-center"
          disabled={sessionLoading}
        >
          Cerrar sesion de operador
        </Button>
      ) : null}

      <details className="broadcast-panel-soft p-4">
        <summary className="flex cursor-pointer items-center gap-2 broadcast-label">
          <FlaskConical className="size-3.5 text-accent" />
          Herramientas de prueba
        </summary>
        <p className="mt-3 text-sm text-muted-foreground">
          Acciones para demo o ensayo. No usarlas durante una partida real.
        </p>
        <Button
          onClick={onSimulateAnswers}
          variant="outline"
          className="mt-4 h-11 w-full justify-center"
          disabled={disabled}
        >
          Simular respuestas faltantes
        </Button>
      </details>

      <Button
        onClick={onResetGame}
        variant="destructive"
        className="h-11 w-full justify-center"
        disabled={disabled}
      >
        Reiniciar partida
      </Button>
    </div>
  );
}

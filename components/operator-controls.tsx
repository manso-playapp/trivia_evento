"use client";

import { useEffect, useState } from "react";
import { ChevronRight, FlaskConical, Music2, Sparkles, Volume2, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { normalizeSoundSettings } from "@/data/default-sound-settings";
import { MAIN_ROUND_COUNT, needsTiebreaker } from "@/engine/game-selectors";
import type { GameState, PowerUpType, SoundSettings } from "@/types";

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
  onSetSoundSettings: (settings: Partial<SoundSettings>) => void;
  onSimulateAnswers: () => void;
  onResetGame: () => void;
  onEnablePowerUps: () => void;
  onAdjustScore: (tableId: string, delta: number) => void;
  onRestorePowerUp: (tableId: string, powerUpType: PowerUpType) => void;
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
  onSetSoundSettings,
  onSimulateAnswers,
  onResetGame,
  onEnablePowerUps,
  onAdjustScore,
  onRestorePowerUp,
}: OperatorControlsProps) {
  const [enablePowerUpsConfirm, setEnablePowerUpsConfirm] = useState(false);
  const [adjustTableId, setAdjustTableId] = useState(state.tables[0]?.id ?? "");
  const [adjustDelta, setAdjustDelta] = useState("");
  const [restoreTableId, setRestoreTableId] = useState(state.tables[0]?.id ?? "");
  const [restorePowerUpType, setRestorePowerUpType] = useState<PowerUpType>("x2");
  const [roundDurationDraft, setRoundDurationDraft] = useState(
    String(state.roundDurationSeconds)
  );
  const [screenWidthDraft, setScreenWidthDraft] = useState(
    String(state.publicScreenWidthPx ?? 1356)
  );
  const [screenHeightDraft, setScreenHeightDraft] = useState(
    String(state.publicScreenHeightPx ?? 768)
  );
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
  const soundSettings = normalizeSoundSettings(state.soundSettings);
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
  const isTiebreakerLaunch =
    state.roundStatus === "score_updated" &&
    state.currentQuestionIndex === MAIN_ROUND_COUNT - 1 &&
    needsTiebreaker(state);
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
          label: isTiebreakerLaunch
            ? "Lanzar desempate"
            : "Lanzar siguiente pregunta",
          description: isTiebreakerLaunch
            ? "Abre las 3 preguntas extra para las mesas empatadas arriba."
            : "Pasa de la pausa entre rondas a la proxima pregunta.",
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
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="broadcast-label mb-2">Sonido pantalla publica</p>
            <p className="text-sm text-muted-foreground">
              Controla musica, ronda y efectos de la vista /screen.
            </p>
          </div>
          <Volume2 className="mt-1 size-5 shrink-0 text-accent" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              key: "gameMusicEnabled" as const,
              label: "Juego",
              description: "Ambiente activo",
            },
            {
              key: "effectsEnabled" as const,
              label: "Efectos",
              description: "Tipeo, opciones y tic",
            },
          ].map((control) => (
            <label
              key={control.key}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-[0.75rem] border border-border/70 bg-background/70 px-3 py-2.5"
            >
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {control.label}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {control.description}
                </span>
              </span>
              <input
                type="checkbox"
                checked={soundSettings[control.key]}
                onChange={(event) =>
                  onSetSoundSettings({ [control.key]: event.target.checked })
                }
                disabled={disabled}
                className="size-5 accent-accent"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="rounded-[0.75rem] border border-border/70 bg-background/70 px-3 py-3">
            <span className="mb-2 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Music2 className="size-4 text-accent" />
                Musica
              </span>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {Math.round(soundSettings.musicVolume * 100)}%
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(soundSettings.musicVolume * 100)}
              onChange={(event) =>
                onSetSoundSettings({
                  musicVolume: Number(event.target.value) / 100,
                })
              }
              disabled={disabled}
              className="w-full accent-accent"
            />
          </label>

          <label className="rounded-[0.75rem] border border-border/70 bg-background/70 px-3 py-3">
            <span className="mb-2 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Volume2 className="size-4 text-accent" />
                Efectos
              </span>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {Math.round(soundSettings.effectsVolume * 100)}%
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(soundSettings.effectsVolume * 100)}
              onChange={(event) =>
                onSetSoundSettings({
                  effectsVolume: Number(event.target.value) / 100,
                })
              }
              disabled={disabled}
              className="w-full accent-accent"
            />
          </label>
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

      {/* ── Activar comodines ── */}
      <div className="broadcast-panel-soft p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="broadcast-label mb-1 flex items-center gap-2">
              <Sparkles className="size-3.5 text-accent" />
              Comodines
            </p>
            <p className="text-sm text-muted-foreground">
              {state.powerUpsEnabled
                ? "Comodines activos. Las mesas pueden usarlos desde su dispositivo."
                : "Comodines desactivados. Activalos cuando quieras introducir el giro."}
            </p>
          </div>
        </div>
        {!state.powerUpsEnabled ? (
          enablePowerUpsConfirm ? (
            <div className="flex gap-2">
              <Button
                onClick={() => { onEnablePowerUps(); setEnablePowerUpsConfirm(false); }}
                className="h-11 flex-1 justify-center"
                disabled={disabled}
              >
                Confirmar activacion
              </Button>
              <Button
                onClick={() => setEnablePowerUpsConfirm(false)}
                variant="outline"
                className="h-11 justify-center"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setEnablePowerUpsConfirm(true)}
              variant="outline"
              className="h-11 w-full justify-center"
              disabled={disabled}
            >
              Activar comodines
            </Button>
          )
        ) : (
          <p className="text-sm font-semibold text-success">Comodines activos</p>
        )}
      </div>

      {/* ── Correcciones del operador ── */}
      <details className="broadcast-panel-soft p-4">
        <summary className="flex cursor-pointer items-center gap-2 broadcast-label">
          <Wrench className="size-3.5 text-warning" />
          Correcciones
        </summary>
        <div className="mt-4 space-y-4">
          {/* Ajuste manual de puntos */}
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Ajuste de puntos</p>
            <div className="flex flex-wrap gap-2">
              <select
                value={adjustTableId}
                onChange={(e) => setAdjustTableId(e.target.value)}
                className="app-input flex-1"
                disabled={disabled}
              >
                {state.tables.filter((t) => t.active).map((table) => (
                  <option key={table.id} value={table.id}>{table.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="+10 / -5"
                className="app-input w-28 text-center"
                disabled={disabled}
              />
              <Button
                variant="outline"
                className="h-11 justify-center"
                disabled={disabled || adjustDelta === "" || Number(adjustDelta) === 0 || !Number.isFinite(Number(adjustDelta))}
                onClick={() => { onAdjustScore(adjustTableId, Number(adjustDelta)); setAdjustDelta(""); }}
              >
                Aplicar
              </Button>
            </div>
          </div>

          {/* Restaurar comodin */}
          {state.powerUpsEnabled ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Restaurar comodin</p>
              <div className="flex flex-wrap gap-2">
                <select
                  value={restoreTableId}
                  onChange={(e) => setRestoreTableId(e.target.value)}
                  className="app-input flex-1"
                  disabled={disabled}
                >
                  {state.tables.filter((t) => t.active).map((table) => (
                    <option key={table.id} value={table.id}>{table.name}</option>
                  ))}
                </select>
                <select
                  value={restorePowerUpType}
                  onChange={(e) => setRestorePowerUpType(e.target.value as PowerUpType)}
                  className="app-input w-28"
                  disabled={disabled}
                >
                  <option value="x2">X2</option>
                  <option value="bomb">Bomba</option>
                </select>
                <Button
                  variant="outline"
                  className="h-11 justify-center"
                  disabled={disabled || (() => {
                    const table = state.tables.find((t) => t.id === restoreTableId);
                    return table?.powerUps.find((p) => p.type === restorePowerUpType)?.status !== "spent";
                  })()}
                  onClick={() => onRestorePowerUp(restoreTableId, restorePowerUpType)}
                >
                  Restaurar
                </Button>
              </div>
              {(() => {
                const table = state.tables.find((t) => t.id === restoreTableId);
                const pu = table?.powerUps.find((p) => p.type === restorePowerUpType);
                if (!pu || pu.status === "spent") return null;
                return (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Este comodin esta en estado <span className="font-semibold">{pu.status}</span> — solo se pueden restaurar los gastados.
                  </p>
                );
              })()}
            </div>
          ) : null}

          {/* Historial de correcciones */}
          {(state.scoreAdjustments ?? []).length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Historial</p>
              <ul className="space-y-1.5">
                {[...(state.scoreAdjustments ?? [])].reverse().map((adj) => (
                  <li key={adj.id} className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{adj.tableName}</span>
                    {adj.reason.kind === "manual_points"
                      ? ` — ${adj.reason.delta > 0 ? "+" : ""}${adj.reason.delta} pts`
                      : ` — comodin ${adj.reason.powerUpType.toUpperCase()} restaurado`}
                    {adj.roundNumber ? ` (ronda ${adj.roundNumber})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </details>

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

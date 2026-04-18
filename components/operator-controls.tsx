"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { GameState } from "@/types";

type OperatorControlsProps = {
  state: GameState;
  disabled?: boolean;
  sessionLoading?: boolean;
  onSignOut?: () => Promise<void>;
  onRevealQuestion: () => void;
  onStartRound: () => void;
  onLockRound: () => void;
  onRevealAnswer: () => void;
  onApplyScore: () => void;
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
  onStartRound,
  onLockRound,
  onRevealAnswer,
  onApplyScore,
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

  return (
    <div className="broadcast-panel space-y-5 px-5 py-5">
      {disabled ? (
        <div className="app-accent-panel p-4 text-sm text-foreground">
          Los controles estan bloqueados hasta validar la sesion de operador.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button onClick={onRevealQuestion} className="h-11 justify-center" disabled={disabled}>
          Mostrar siguiente pregunta
        </Button>
        <Button
          onClick={onStartRound}
          variant="secondary"
          className="h-11 justify-center"
          disabled={disabled}
        >
          Iniciar ronda
        </Button>
        <Button
          onClick={onLockRound}
          variant="outline"
          className="h-11 justify-center"
          disabled={disabled}
        >
          Cerrar respuestas
        </Button>
        <Button
          onClick={onRevealAnswer}
          variant="outline"
          className="h-11 justify-center"
          disabled={disabled}
        >
          Revelar correcta
        </Button>
        <Button
          onClick={onApplyScore}
          variant="secondary"
          className="h-11 justify-center"
          disabled={disabled}
        >
          Actualizar score
        </Button>
        <Button
          onClick={onSimulateAnswers}
          variant="outline"
          className="h-11 justify-center"
          disabled={disabled}
        >
          Simular respuestas faltantes
        </Button>
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
            disabled={disabled}
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
            disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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

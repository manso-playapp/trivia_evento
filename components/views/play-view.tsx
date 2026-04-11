"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Snowflake } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  getCurrentSubmittedAnswer,
  isTableActive,
  isTableFrozenForCurrentRound,
} from "@/engine/game-selectors";
import { EventHeader } from "@/components/event-header";
import { GameStatusBanner } from "@/components/game-status-banner";
import { MobileAnswerPad } from "@/components/mobile-answer-pad";
import { PowerUpBadge } from "@/components/power-up-badge";
import { QuestionCard } from "@/components/question-card";
import { SectionCard } from "@/components/section-card";
import { useGameView } from "@/hooks/use-game-view";
import { useTableSession } from "@/hooks/use-table-session";
import { TableAuthPanel } from "@/components/table-auth-panel";

export function PlayView({ tableId }: { tableId: string }) {
  const { state, actions, currentQuestion, currentRoundNumber, statusMeta } =
    useGameView();
  const table = state.tables.find((entry) => entry.id === tableId);
  const {
    authenticated,
    error: tableSessionError,
    loading: tableSessionLoading,
    signIn,
    signOut,
  } = useTableSession(tableId);
  const searchParams = useSearchParams();
  const accessCodeFromQuery = searchParams.get("code");
  const attemptedAutoAccessCode = useRef<string | null>(null);

  useEffect(() => {
    if (authenticated) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [authenticated]);

  useEffect(() => {
    if (!accessCodeFromQuery || tableSessionLoading || authenticated) {
      return;
    }

    if (attemptedAutoAccessCode.current === accessCodeFromQuery) {
      return;
    }

    attemptedAutoAccessCode.current = accessCodeFromQuery;
    void signIn(accessCodeFromQuery);
  }, [accessCodeFromQuery, authenticated, signIn, tableSessionLoading]);

  if (!table) {
    return (
      <AppShell>
        <SectionCard
          title="Mesa no encontrada"
          description="Revisa la URL de la mesa. Ejemplo valido: /play/1"
        >
          <p className="text-sm text-muted-foreground">
            La vista mobile necesita un `tableId` existente.
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  if (!isTableActive(state, table.id)) {
    return (
      <AppShell>
        <SectionCard
          title="Mesa no habilitada"
          description="Esta mesa existe, pero no esta dada de alta para el evento actual."
        >
          <p className="text-sm text-muted-foreground">
            Pedile al operador que la active desde el panel antes de participar.
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const answer = getCurrentSubmittedAnswer(state, table.id);
  const isFrozen = isTableFrozenForCurrentRound(state, table.id);
  const isLocked = state.roundStatus !== "round_active" || !authenticated;

  return (
    <AppShell className="max-w-3xl space-y-5">
      <EventHeader
        eventName={`${state.eventName} / ${table.name}`}
        eventTagline={state.eventTagline}
        currentRoundNumber={Math.max(currentRoundNumber, 1)}
        totalRounds={state.totalRounds}
        statusLabel={statusMeta.label}
        statusTone={statusMeta.tone}
      />

      <GameStatusBanner roundStatus={state.roundStatus} />

      {!authenticated ? (
        <TableAuthPanel
          tableId={table.id}
          tableName={table.name}
          autoAccessEnabled={Boolean(accessCodeFromQuery)}
          loading={tableSessionLoading}
          error={tableSessionError}
          onSubmit={signIn}
        />
      ) : null}

      {isFrozen ? (
        <div className="rounded-[1.2rem] border border-warning/30 bg-warning/10 p-4 text-warning">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
            <Snowflake className="size-4" />
            Mesa congelada
          </p>
          <p className="mt-2 text-sm">
            Esta mesa no participa en la ronda actual por efecto de BOMBA.
          </p>
        </div>
      ) : null}

      {isLocked && state.roundStatus !== "idle" && state.roundStatus !== "question_revealed" ? (
        <div className="broadcast-panel-soft p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4 text-accent" />
            {!authenticated
              ? "Validá el acceso de la mesa para responder."
              : "La ronda ya no acepta cambios."}
          </p>
        </div>
      ) : null}

      <QuestionCard
        question={currentQuestion}
        roundStatus={state.roundStatus}
        selectedOptionId={answer?.optionId ?? null}
      />

        <SectionCard
          title="Responder"
          description="Podes cambiar tu opcion mientras la ronda siga activa y la mesa este validada."
        >
          <MobileAnswerPad
            question={currentQuestion}
          selectedOptionId={answer?.optionId ?? null}
          disabled={isLocked}
          frozen={isFrozen}
          onSelect={(optionId) => actions.submitAnswer(table.id, optionId)}
        />
      </SectionCard>

      {currentRoundNumber >= 7 ? (
        <SectionCard
          title="Comodines disponibles"
          description="En este MVP se activan desde el panel del operador."
        >
          <div className="flex flex-wrap gap-2">
            {table.powerUps.map((powerUp) => (
              <PowerUpBadge key={`${table.id}-${powerUp.type}`} powerUp={powerUp} />
            ))}
          </div>
          {authenticated ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-4 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Cambiar de mesa en este dispositivo
            </button>
          ) : null}
        </SectionCard>
      ) : null}
    </AppShell>
  );
}

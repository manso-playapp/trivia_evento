"use client";

import { useEffect } from "react";
import { CheckCircle2, CircleSlash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { OperatorAuthPanel } from "@/components/operator-auth-panel";
import {
  getCurrentSubmittedAnswer,
  isTableFrozenForCurrentRound,
} from "@/engine/game-selectors";
import { EventHeader } from "@/components/event-header";
import { GameStatusBanner } from "@/components/game-status-banner";
import { OperatorControls } from "@/components/operator-controls";
import { QuestionCard } from "@/components/question-card";
import { SectionCard } from "@/components/section-card";
import { TableAccessGrid } from "@/components/table-access-grid";
import { TableRosterManager } from "@/components/table-roster-manager";
import { VersionContextPanel } from "@/components/version-context-panel";
import { useGameView } from "@/hooks/use-game-view";
import { useOperatorSession } from "@/hooks/use-operator-session";

export function OperatorView() {
  const {
    activeTables,
    state,
    actions,
    currentQuestion,
    currentRoundNumber,
    statusMeta,
  } = useGameView();
  const operatorSession = useOperatorSession();

  const answeredTables = activeTables.filter((table) =>
    Boolean(getCurrentSubmittedAnswer(state, table.id))
  );

  useEffect(() => {
    if (!operatorSession.enabled || operatorSession.authenticated) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [operatorSession.authenticated, operatorSession.enabled]);

  return (
    <AppShell className="space-y-5 sm:space-y-6">
      <EventHeader
        eventName={`${state.eventName} / Operator`}
        eventTagline={state.eventTagline}
        currentRoundNumber={Math.max(currentRoundNumber, 1)}
        totalRounds={state.totalRounds}
        statusLabel={statusMeta.label}
        statusTone={statusMeta.tone}
        roundDurationSeconds={state.roundDurationSeconds}
      />

      {operatorSession.enabled && !operatorSession.authenticated ? (
        <OperatorAuthPanel
          loading={operatorSession.loading}
          error={operatorSession.error}
          onSubmit={operatorSession.signIn}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <QuestionCard question={currentQuestion} roundStatus={state.roundStatus} />
          <SectionCard
            title="Respuesta correcta"
            description="Referencia operativa para reveal y scoring."
          >
            <p className="text-xl font-semibold tracking-tight text-foreground">
              {currentQuestion
                ? `${currentQuestion.correctOptionId} - ${
                    currentQuestion.options.find(
                      (option) => option.id === currentQuestion.correctOptionId
                    )?.text ?? ""
                  }`
                : "Todavia no hay pregunta activa."}
            </p>
          </SectionCard>
          <GameStatusBanner roundStatus={state.roundStatus} />
        </div>

        <OperatorControls
          state={state}
          disabled={operatorSession.enabled && !operatorSession.authenticated}
          sessionLoading={operatorSession.loading}
          onSignOut={operatorSession.enabled ? operatorSession.signOut : undefined}
          onRevealQuestion={actions.revealQuestion}
          onLockRound={actions.lockRound}
          onRevealAnswer={actions.revealCorrectAnswer}
          onApplyScore={actions.applyScores}
          onSetRoundDuration={actions.setRoundDuration}
          onSetPublicScreenSize={actions.setPublicScreenSize}
          onSimulateAnswers={actions.simulateAnswers}
          onResetGame={actions.resetGame}
          onActivateX2={actions.activateX2}
          onScheduleBomb={actions.activateBomb}
        />
      </div>

      <SectionCard
        title="Respuestas por mesa"
        description={`${answeredTables.length}/${activeTables.length} mesas activas respondieron la ronda actual.`}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {activeTables.map((table) => {
            const answer = getCurrentSubmittedAnswer(state, table.id);
            const frozen = isTableFrozenForCurrentRound(state, table.id);

            return (
              <div
                key={table.id}
                className="broadcast-panel-soft p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{table.name}</p>
                  {answer ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <CircleSlash2 className="size-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {frozen
                    ? "Congelada por BOMBA."
                    : answer
                      ? `Eligio ${answer.optionId}`
                      : "Sin respuesta todavia."}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Alta y baja de mesas"
        description="Defini cuantas mesas participan y cuales quedan fuera del evento actual."
      >
        <TableRosterManager
          tables={state.tables}
          disabled={
            (operatorSession.enabled && !operatorSession.authenticated) ||
            state.roundStatus !== "idle"
          }
          onSetTableName={actions.setTableName}
          onSetTableActive={actions.setTableActive}
          onSetActiveTableCount={actions.setActiveTableCount}
        />
      </SectionCard>

      <SectionCard
        title="QR de participacion"
        description="Material operativo para que cada mesa entre directo a su vista mobile."
      >
        <TableAccessGrid tables={activeTables} />
      </SectionCard>

      <SectionCard
        title="Version y contexto"
        description="Control de release/contexto para continuidad cuando se reinicia el hilo de trabajo."
      >
        <VersionContextPanel />
      </SectionCard>
    </AppShell>
  );
}

"use client";

import { AppShell } from "@/components/app-shell";
import { AnswerOptionsBoard } from "@/components/answer-options-board";
import { EventHeader } from "@/components/event-header";
import { GameStatusBanner } from "@/components/game-status-banner";
import { QuestionCard } from "@/components/question-card";
import { RankingBoard } from "@/components/ranking-board";
import { SectionCard } from "@/components/section-card";
import { TableGrid } from "@/components/table-grid";
import { TimerDisplay } from "@/components/timer-display";
import { useGameView } from "@/hooks/use-game-view";

export function ScreenView() {
  const { state, currentQuestion, currentRoundNumber, ranking, statusMeta } =
    useGameView();
  const showPowerUps = currentRoundNumber >= 7;

  return (
    <AppShell className="space-y-5 sm:space-y-6">
      <EventHeader
        eventName={state.eventName}
        eventTagline={state.eventTagline}
        currentRoundNumber={Math.max(currentRoundNumber, 1)}
        totalRounds={state.totalRounds}
        statusLabel={statusMeta.label}
        statusTone={statusMeta.tone}
      />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="space-y-4">
          <QuestionCard question={currentQuestion} roundStatus={state.roundStatus} />
          <AnswerOptionsBoard
            question={currentQuestion}
            roundStatus={state.roundStatus}
          />
        </div>

        <div className="space-y-4">
          <TimerDisplay
            roundEndsAt={state.roundEndsAt}
            roundDurationSeconds={state.roundDurationSeconds}
            roundStatus={state.roundStatus}
          />
          <GameStatusBanner roundStatus={state.roundStatus} />
          <RankingBoard ranking={ranking} />
        </div>
      </div>

      <SectionCard
        title="Mesas del evento"
        description="Estado de las 20 mesas con score, respuesta y comodines."
      >
        <TableGrid state={state} showPowerUps={showPowerUps} />
      </SectionCard>
    </AppShell>
  );
}

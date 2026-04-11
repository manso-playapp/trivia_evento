"use client";

import { AppShell } from "@/components/app-shell";
import { AnswerOptionsBoard } from "@/components/answer-options-board";
import { QuestionCard } from "@/components/question-card";
import { RankingBoard } from "@/components/ranking-board";
import { TableGrid } from "@/components/table-grid";
import { TimerDisplay } from "@/components/timer-display";
import { useGameView } from "@/hooks/use-game-view";

export function ScreenView() {
  const {
    state,
    currentQuestion,
    ranking,
  } = useGameView();

  return (
    <AppShell className="mx-auto h-[768px] max-h-[768px] w-full max-w-[1356px] overflow-hidden p-4 sm:p-4">
      <div className="grid h-full min-h-0 grid-rows-[92px_1fr_246px] gap-3">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <TimerDisplay
            roundEndsAt={state.roundEndsAt}
            roundDurationSeconds={state.roundDurationSeconds}
            roundStatus={state.roundStatus}
            variant="header"
          />
          <div className="broadcast-panel flex min-w-[330px] items-center justify-end px-4 py-3 text-right">
            <div>
              <p className="broadcast-label text-accent">Logo del evento</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {state.eventName}
              </p>
              <p className="text-xs text-muted-foreground">{state.eventTagline}</p>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 gap-3 xl:grid-cols-[1.55fr_0.45fr]">
          <div className="min-h-0 space-y-3">
            <QuestionCard
              question={currentQuestion}
              roundStatus={state.roundStatus}
              compact
            />
            <AnswerOptionsBoard
              question={currentQuestion}
              roundStatus={state.roundStatus}
              compact
            />
          </div>
          <RankingBoard ranking={ranking} limit={10} compact />
        </div>

        <div className="broadcast-panel min-h-0 overflow-hidden px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="broadcast-label text-accent">Mesas</p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              20 en pantalla
            </p>
          </div>
          <TableGrid
            state={state}
            showPowerUps={false}
            compact
            includeInactive
            maxItems={20}
          />
        </div>
      </div>
    </AppShell>
  );
}

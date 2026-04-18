"use client";

import { AnswerOptionsBoard } from "@/components/answer-options-board";
import { CompanyLogo } from "@/components/company-logo";
import { MobileRoundTimer } from "@/components/mobile-round-timer";
import { QuestionCard } from "@/components/question-card";
import { RankingBoard } from "@/components/ranking-board";
import { TableGrid } from "@/components/table-grid";
import { useGameView } from "@/hooks/use-game-view";

export function ScreenView() {
  const { state, currentQuestion, ranking, activeTables, currentRoundNumber } =
    useGameView();
  const activeTableCount = activeTables.length;
  const compactRows = activeTableCount > 10 ? 2 : 1;
  const compactColumns = Math.max(
    1,
    Math.min(10, Math.ceil(activeTableCount / compactRows))
  );
  const questionOrder = currentQuestion?.order ?? Math.max(currentRoundNumber, 1);
  const totalQuestionCount = state.questions.length || state.totalRounds;

  return (
    <div className="min-h-screen px-2 py-2">
      <main className="mx-auto h-[768px] max-h-[768px] w-full max-w-[1356px] overflow-hidden">
        <div className="grid h-full min-h-0 grid-rows-[3fr_1fr] gap-2">
          <div className="grid min-h-0 gap-2 xl:grid-cols-[1.58fr_0.42fr]">
            <div className="flex min-h-0 flex-col pr-1">
              <div className="flex items-center justify-start gap-3 pb-2 pt-0.5 text-left">
                <CompanyLogo
                  className="h-10 w-[165px]"
                  imageClassName="object-left"
                  priority
                />
                <h2 className="text-[2.15rem] font-semibold leading-none tracking-[-0.05em] text-foreground">
                  TRIVIA
                </h2>
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-between py-2">
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
            </div>

            <aside className="flex min-h-0 flex-col">
              <div className="mt-2 flex justify-center xl:mt-0">
                <MobileRoundTimer
                  roundEndsAt={state.roundEndsAt}
                  roundDurationSeconds={state.roundDurationSeconds}
                  roundStatus={state.roundStatus}
                  currentStep={questionOrder}
                  totalSteps={totalQuestionCount}
                  size="screen"
                />
              </div>

              <div className="mt-3 min-h-0 flex-1">
                <RankingBoard ranking={ranking} limit={5} compact />
              </div>
            </aside>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden pt-1">
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <p className="broadcast-label text-accent">Mesas activas</p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {activeTableCount}
              </p>
            </div>
            <div className="min-h-0 flex-1">
              <TableGrid
                state={state}
                showPowerUps={false}
                compact
                compactColumns={compactColumns}
                compactRows={compactRows}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

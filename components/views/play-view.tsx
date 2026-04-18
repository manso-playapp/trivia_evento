"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Crown, DoorOpen, Snowflake, XCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  getCurrentSubmittedAnswer,
  isTableActive,
  isTableFrozenForCurrentRound,
} from "@/engine/game-selectors";
import { MobileRoundTimer } from "@/components/mobile-round-timer";
import { MobileAnswerPad } from "@/components/mobile-answer-pad";
import { SectionCard } from "@/components/section-card";
import { SuccessConfetti } from "@/components/success-confetti";
import { useGameView } from "@/hooks/use-game-view";
import { useTableSession } from "@/hooks/use-table-session";
import { TableAuthPanel } from "@/components/table-auth-panel";

export function PlayView({ tableId }: { tableId: string }) {
  const { state, actions, currentQuestion, currentRoundNumber } = useGameView();
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
  const questionOrder = currentQuestion?.order ?? Math.max(currentRoundNumber, 1);
  const totalQuestionCount = state.questions.length || state.totalRounds;
  const tableLabel = table.name;
  const isTimeFinished = [
    "round_locked",
    "answer_revealed",
    "score_updated",
    "game_finished",
  ].includes(state.roundStatus);
  const isResultRevealed = [
    "answer_revealed",
    "score_updated",
    "game_finished",
  ].includes(state.roundStatus);
  const hasSubmittedAnswer = Boolean(answer);
  const isSelectedCorrect = Boolean(
    isResultRevealed &&
      hasSubmittedAnswer &&
      currentQuestion &&
      answer?.optionId === currentQuestion.correctOptionId
  );
  const isSelectedIncorrect = Boolean(
    isResultRevealed &&
      hasSubmittedAnswer &&
      currentQuestion &&
      answer?.optionId !== currentQuestion.correctOptionId
  );

  if (!authenticated) {
    return (
      <AppShell className="max-w-3xl space-y-5">
        <TableAuthPanel
          tableId={table.id}
          tableName={table.name}
          autoAccessEnabled={Boolean(accessCodeFromQuery)}
          loading={tableSessionLoading}
          error={tableSessionError}
          onSubmit={signIn}
        />
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#343a43] px-3 py-4 sm:py-6">
      <main className="mx-auto w-full max-w-[430px] px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex size-9 items-center justify-center rounded-[0.8rem] bg-[#2d333d] text-muted-foreground shadow-[0_8px_18px_rgba(0,0,0,0.33)] transition-colors hover:text-foreground"
            aria-label="Cambiar mesa"
          >
            <DoorOpen className="size-4" />
          </button>
          <div className="inline-flex items-center gap-2 rounded-[0.8rem] bg-[#2d333d] px-3 py-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground shadow-[0_8px_18px_rgba(0,0,0,0.33)]">
            <Crown className="size-3.5 text-accent" />
            {tableLabel}
          </div>
        </div>

        <div className="pt-2">
          <MobileRoundTimer
            roundEndsAt={state.roundEndsAt}
            roundDurationSeconds={state.roundDurationSeconds}
            roundStatus={state.roundStatus}
            currentStep={questionOrder}
            totalSteps={totalQuestionCount}
          />
        </div>

        <p className="mx-auto mt-4 max-w-[320px] text-center text-[1.32rem] leading-[1.4] text-foreground/88">
          {currentQuestion?.prompt ?? "Esperando la próxima pregunta..."}
        </p>

        {isFrozen ? (
          <div className="mt-4 rounded-[1rem] bg-warning/14 px-4 py-3 text-warning shadow-[0_10px_22px_rgba(0,0,0,0.24)]">
            <p className="flex items-center gap-2 text-[1rem] font-semibold">
              <Snowflake className="size-4" />
              Mesa congelada por BOMBA
            </p>
          </div>
        ) : null}

        {isTimeFinished ? (
          <div
            className={`relative mt-4 overflow-hidden rounded-[1rem] px-4 py-3 shadow-[0_10px_22px_rgba(0,0,0,0.24)] ${
              isSelectedCorrect
                ? "bg-success/18 text-success"
                : isSelectedIncorrect
                  ? "bg-danger/18 text-danger"
                  : "bg-[#2d333d] text-muted-foreground"
            }`}
          >
            {isSelectedCorrect ? <SuccessConfetti /> : null}
            {!hasSubmittedAnswer ? (
              <p className="flex items-start gap-2 text-[0.92rem] leading-snug">
                <Clock3 className="mt-[0.1rem] size-4 shrink-0" />
                Tiempo terminado.
              </p>
            ) : !isResultRevealed ? (
              <p className="flex items-start gap-2 text-[0.92rem] leading-snug">
                <Clock3 className="mt-[0.1rem] size-4 shrink-0" />
                Tiempo terminado.
              </p>
            ) : isSelectedCorrect ? (
              <p className="flex items-start gap-2 text-[0.92rem] leading-snug">
                <CheckCircle2 className="mt-[0.1rem] size-4 shrink-0" />
                Respuesta correcta!
              </p>
            ) : (
              <p className="flex items-start gap-2 text-[0.92rem] leading-snug">
                <XCircle className="mt-[0.1rem] size-4 shrink-0" />
                Respuesta incorrecta.
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-5">
          <MobileAnswerPad
            question={currentQuestion}
            selectedOptionId={answer?.optionId ?? null}
            roundStatus={state.roundStatus}
            disabled={isLocked}
            frozen={isFrozen}
            onSelect={(optionId) => actions.submitAnswer(table.id, optionId)}
          />
        </div>
      </main>
    </div>
  );
}

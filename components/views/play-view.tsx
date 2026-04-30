"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bomb, CheckCircle2, Clock3, Crown, DoorOpen, Snowflake, Sparkles, XCircle, Zap } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CompanyLogo } from "@/components/company-logo";
import {
  getCurrentSubmittedAnswer,
  getPowerUp,
  isTableActive,
  isTableEligibleForCurrentRound,
  isTableFrozenForCurrentRound,
} from "@/engine/game-selectors";
import { MobileRoundTimer } from "@/components/mobile-round-timer";
import { MobileAnswerPad } from "@/components/mobile-answer-pad";
import { SectionCard } from "@/components/section-card";
import { SuccessConfetti } from "@/components/success-confetti";
import { useGameView } from "@/hooks/use-game-view";
import { useTableSession } from "@/hooks/use-table-session";
import { TableAuthPanel } from "@/components/table-auth-panel";
import { TypewriterText } from "@/components/typewriter-text";

export function PlayView({ tableId }: { tableId: string }) {
  const {
    state,
    actions,
    currentQuestion,
    currentRoundNumber,
    finalWinners,
    hasUniqueWinner,
    visibleTotalRounds,
  } = useGameView();
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
  const otherActiveTables = state.tables.filter((t) => t.active && t.id !== tableId);
  const [bombTargetId, setBombTargetId] = useState(otherActiveTables[0]?.id ?? "");

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
  const isTiebreakerEligible = isTableEligibleForCurrentRound(state, table.id);
  const isLocked =
    state.roundStatus !== "round_active" ||
    !authenticated ||
    !isTiebreakerEligible;
  const questionOrder = currentQuestion?.order ?? Math.max(currentRoundNumber, 1);
  const totalQuestionCount = visibleTotalRounds;
  const tableLabel = table.name;
  const finalWinnerNames = finalWinners
    .map((winner) => winner.name)
    .join(" / ");
  const powerUpNoticeRoundNumber =
    state.roundStatus === "score_updated"
      ? currentRoundNumber + 1
      : currentRoundNumber;
  const x2PowerUp = getPowerUp(table, "x2");
  const hasActiveX2 =
    x2PowerUp?.status === "armed" &&
    x2PowerUp.armedForRound === powerUpNoticeRoundNumber;
  const incomingBombSourceTable = state.tables.find((sourceTable) => {
    const bomb = getPowerUp(sourceTable, "bomb");

    return (
      sourceTable.active &&
      bomb?.status === "armed" &&
      bomb.armedForRound === powerUpNoticeRoundNumber &&
      bomb.targetTableId === table.id
    );
  });
  const bombSourceTable = table.frozenByTableId
    ? state.tables.find((entry) => entry.id === table.frozenByTableId)
    : incomingBombSourceTable;
  const hasBombNotice = isFrozen || Boolean(incomingBombSourceTable);
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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#343a43] px-3 py-4 sm:py-6">
        <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[430px] flex-col px-5 py-5 sm:min-h-[calc(100vh-3rem)]">
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

          <section className="flex flex-1 flex-col items-center justify-center pb-12 text-center">
            <CompanyLogo
              priority
              className="mb-8 h-20 w-[260px]"
              imageClassName="object-center"
              sizes="260px"
            />
            <p className="text-[1.85rem] font-semibold leading-tight text-foreground">
              {tableLabel}
            </p>
            <p className="mt-3 max-w-[300px] text-[1.12rem] leading-snug text-foreground/82">
              Registrada correctamente.
            </p>
            <p className="mt-7 max-w-[310px] text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Esperando la primera pregunta
            </p>
          </section>
        </main>
      </div>
    );
  }

  if (state.roundStatus === "game_finished") {
    const isWinningTable = finalWinners.some((winner) => winner.id === table.id);

    return (
      <div className="min-h-screen bg-[#343a43] px-3 py-4 sm:py-6">
        {hasUniqueWinner && isWinningTable ? (
          <SuccessConfetti fullScreen durationMs={20_000} />
        ) : null}
        <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[430px] flex-col px-5 py-5 sm:min-h-[calc(100vh-3rem)]">
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

          <section className="flex flex-1 flex-col items-center justify-center pb-12 text-center">
            <CompanyLogo
              priority
              className="mb-8 h-20 w-[260px]"
              imageClassName="object-center"
              sizes="260px"
            />
            <p className="text-[1.85rem] font-semibold leading-tight text-foreground">
              {isWinningTable
                ? hasUniqueWinner
                  ? "Ganaron la trivia"
                  : "Empate en la cima"
                : "Partida finalizada"}
            </p>
            <p className="mt-3 max-w-[320px] text-[1.05rem] leading-snug text-foreground/82">
              {hasUniqueWinner
                ? `${finalWinnerNames} terminó con ${finalWinners[0]?.score ?? 0} puntos.`
                : `${finalWinnerNames} comparten el primer puesto.`}
            </p>
          </section>
        </main>
      </div>
    );
  }

  if (state.roundStatus === "score_updated") {
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

          <section className="pt-20 text-center">
            <p className="text-[1.85rem] font-semibold leading-tight text-foreground">
              Preparando proxima ronda
            </p>
            <p className="mx-auto mt-3 max-w-[300px] text-[1.02rem] leading-snug text-foreground/76">
              {isTiebreakerEligible
                ? "Atentos a los comodines antes de la siguiente pregunta."
                : "La mesa queda mirando el desempate desde afuera."}
            </p>
          </section>

          {hasActiveX2 ? (
            <div className="mt-8 rounded-[1rem] bg-cyan-300/12 px-4 py-3 text-cyan-100 shadow-[0_10px_22px_rgba(0,0,0,0.24)]">
              <p className="text-[1rem] font-semibold">X2 activo</p>
              <p className="mt-1 text-[0.9rem] leading-snug text-cyan-100/82">
                Si responden bien, duplican los puntos de la proxima ronda.
              </p>
            </div>
          ) : null}

          {hasBombNotice ? (
            <div className="mt-4 rounded-[1rem] bg-danger/16 px-4 py-3 text-danger shadow-[0_10px_22px_rgba(0,0,0,0.24)]">
              <p className="flex items-center gap-2 text-[1rem] font-semibold">
                <Snowflake className="size-4" />
                Bomba de {bombSourceTable?.name ?? "otra mesa"}
              </p>
              <p className="mt-1 text-[0.9rem] leading-snug text-danger/85">
                No pueden responder la proxima ronda.
              </p>
            </div>
          ) : null}

          {state.powerUpsEnabled && isTiebreakerEligible ? (
            <div className="mt-8 space-y-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Sparkles className="size-3.5" />
                Comodines
              </p>

              {x2PowerUp?.status === "available" ? (
                <button
                  type="button"
                  onClick={() => actions.activateX2(table.id)}
                  className="flex w-full items-center gap-3 rounded-[1rem] bg-cyan-300/10 px-4 py-3 text-left text-cyan-100 shadow-[0_10px_22px_rgba(0,0,0,0.24)] transition-colors hover:bg-cyan-300/18 active:scale-[0.98]"
                >
                  <Zap className="size-5 shrink-0" />
                  <span>
                    <span className="block text-[1rem] font-semibold">Usar X2</span>
                    <span className="block text-[0.85rem] leading-snug text-cyan-100/76">
                      Duplica tus puntos si acertais la proxima ronda.
                    </span>
                  </span>
                </button>
              ) : x2PowerUp?.status === "armed" ? (
                <div className="rounded-[1rem] bg-cyan-300/10 px-4 py-3 text-cyan-100/60">
                  <p className="text-[0.9rem]">X2 ya activado para la proxima ronda.</p>
                </div>
              ) : x2PowerUp?.status === "spent" ? (
                <div className="rounded-[1rem] bg-[#2d333d] px-4 py-3 text-muted-foreground">
                  <p className="text-[0.9rem]">X2 ya utilizado.</p>
                </div>
              ) : null}

              {(() => {
                const bomb = getPowerUp(table, "bomb");
                if (!bomb || bomb.status === "spent") {
                  return bomb?.status === "spent" ? (
                    <div className="rounded-[1rem] bg-[#2d333d] px-4 py-3 text-muted-foreground">
                      <p className="text-[0.9rem]">Bomba ya utilizada.</p>
                    </div>
                  ) : null;
                }
                if (bomb.status === "armed") {
                  return (
                    <div className="rounded-[1rem] bg-danger/12 px-4 py-3 text-danger/70">
                      <p className="text-[0.9rem]">Bomba ya lanzada para la proxima ronda.</p>
                    </div>
                  );
                }
                return otherActiveTables.length > 0 ? (
                  <div className="rounded-[1rem] bg-danger/10 px-4 py-3 shadow-[0_10px_22px_rgba(0,0,0,0.24)]">
                    <p className="mb-2 flex items-center gap-2 text-[1rem] font-semibold text-danger">
                      <Bomb className="size-5 shrink-0" />
                      Lanzar bomba
                    </p>
                    <p className="mb-3 text-[0.85rem] leading-snug text-danger/76">
                      Congela a otra mesa: no podra responder la proxima ronda.
                    </p>
                    <select
                      value={bombTargetId}
                      onChange={(e) => setBombTargetId(e.target.value)}
                      className="mb-3 w-full rounded-[0.75rem] border border-danger/30 bg-[#2d333d] px-3 py-2 text-sm text-foreground"
                    >
                      {otherActiveTables.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => actions.activateBomb(table.id, bombTargetId)}
                      disabled={!bombTargetId}
                      className="w-full rounded-[0.75rem] bg-danger/20 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/30 disabled:opacity-50"
                    >
                      Confirmar bomba
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          ) : null}
        </main>
      </div>
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
          <TypewriterText
            text={currentQuestion?.prompt ?? "Esperando la próxima pregunta..."}
            speedMs={20}
          />
        </p>

        {hasActiveX2 ? (
          <div className="mt-4 rounded-[1rem] bg-cyan-300/12 px-4 py-3 text-cyan-100 shadow-[0_10px_22px_rgba(0,0,0,0.24)]">
            <p className="text-[1rem] font-semibold">
              X2 activo
            </p>
            <p className="mt-1 text-[0.9rem] leading-snug text-cyan-100/82">
              Si responden bien, duplican los puntos de esta ronda.
            </p>
          </div>
        ) : null}

        {hasBombNotice ? (
          <div className="mt-4 rounded-[1rem] bg-danger/16 px-4 py-3 text-danger shadow-[0_10px_22px_rgba(0,0,0,0.24)]">
            <p className="flex items-center gap-2 text-[1rem] font-semibold">
              <Snowflake className="size-4" />
              Bomba de {bombSourceTable?.name ?? "otra mesa"}
            </p>
            <p className="mt-1 text-[0.9rem] leading-snug text-danger/85">
              No pueden responder esta ronda.
            </p>
          </div>
        ) : null}

        {!isTiebreakerEligible ? (
          <div className="mt-4 rounded-[1rem] bg-[#2d333d] px-4 py-3 text-muted-foreground shadow-[0_10px_22px_rgba(0,0,0,0.24)]">
            <p className="text-[1rem] font-semibold text-foreground">
              Desempate en curso
            </p>
            <p className="mt-1 text-[0.9rem] leading-snug">
              Solo responden las mesas que empataron arriba.
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

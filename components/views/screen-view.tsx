"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerOptionsBoard } from "@/components/answer-options-board";
import { CompanyLogo } from "@/components/company-logo";
import { MobileRoundTimer } from "@/components/mobile-round-timer";
import { QuestionCard } from "@/components/question-card";
import { RankingBoard } from "@/components/ranking-board";
import { SuccessConfetti } from "@/components/success-confetti";
import { TableGrid } from "@/components/table-grid";
import { TypewriterText } from "@/components/typewriter-text";
import { useGameView } from "@/hooks/use-game-view";
import {
  configureScreenSounds,
  playQuestionTypeSound,
  setGameActiveSound,
  setRoundSound,
  stopScreenLoopSounds,
  unlockScreenSounds,
} from "@/lib/screen-sounds";
import type { GameState, Table } from "@/types";

const getRoundWinnerNames = (state: GameState, tables: Table[]) => {
  const currentRoundNumber =
    state.currentQuestionIndex === null ? 0 : state.currentQuestionIndex + 1;
  const currentRoundScores = state.scoreEvents.filter(
    (event) => event.roundNumber === currentRoundNumber && event.totalPoints > 0
  );
  const maxRoundScore = Math.max(
    0,
    ...currentRoundScores.map((event) => event.totalPoints)
  );

  if (maxRoundScore === 0) {
    return [];
  }

  return currentRoundScores
    .filter((event) => event.totalPoints === maxRoundScore)
    .map((event) => tables.find((table) => table.id === event.tableId)?.name)
    .filter((name): name is string => Boolean(name));
};

const pickRoundText = (options: string[], roundNumber: number) =>
  options[(Math.max(1, roundNumber) - 1) % options.length];

function RoundIntermission({
  state,
  ranking,
}: {
  state: GameState;
  ranking: Table[];
}) {
  const winnerNames = getRoundWinnerNames(state, ranking);
  const totalRoundCount = state.questions.length || state.totalRounds || 1;
  const currentRoundNumber =
    state.currentQuestionIndex === null ? 0 : state.currentQuestionIndex + 1;
  const leader = ranking[0];
  const secondPlace = ranking[1];
  const leadGap =
    leader && secondPlace ? leader.score - secondPlace.score : leader?.score ?? 0;
  const isLateGame = currentRoundNumber >= Math.max(4, Math.ceil(totalRoundCount * 0.6));
  const isVeryLateGame =
    currentRoundNumber >= Math.max(6, Math.ceil(totalRoundCount * 0.8));
  const isRunawayLead = Boolean(
    leader &&
      secondPlace &&
      isLateGame &&
      leadGap >= (isVeryLateGame ? 320 : 220)
  );
  const isTieAtTop =
    leader && secondPlace ? leader.score === secondPlace.score : false;
  const title = winnerNames.length ? "Ronda con aciertos" : "Ronda cerrada";
  let nudge = pickRoundText(
    [
      "Buen momento para mirar los poderes antes de la siguiente.",
      "El margen todavia existe, pero cada ronda empieza a pesar mas.",
      "Hay puntos en juego y tambien decisiones para incomodar al resto.",
      "La tabla se mueve rapido. Conviene elegir bien el proximo golpe.",
      "Todavia hay carrera: una respuesta fina puede cambiar el clima.",
      "La proxima pregunta puede ordenar o desordenar todo de nuevo.",
      "Si hay X2 guardados, esta es una buena pausa para pensarlos.",
      "Los de arriba no pueden dormirse y los de atras tienen con que pegar.",
    ],
    currentRoundNumber
  );
  const footer = pickRoundText(
    currentRoundNumber === totalRoundCount - 1
      ? [
          "Ajusten punteria: falta otra vuelta.",
          "Queda una mas para mover la tabla.",
          "Una ronda mas y se define el cierre.",
        ]
      : [
          "Respiren un segundo: se viene otra pregunta.",
          "Miren la tabla antes de volver a jugar.",
          "Cinco segundos para recalcular la estrategia.",
          "La proxima ronda ya empieza a asomar.",
          "El tablero quedo caliente para la siguiente.",
          "Ajusten punteria: todavia queda juego.",
          "Todavia queda margen para sorprender.",
          "Que nadie se confie: esto sigue abierto.",
        ],
    currentRoundNumber + winnerNames.length
  );

  if (currentRoundNumber === 20 && isTieAtTop) {
    nudge = "Hay empate en el primer puesto. Se abre el desempate con 3 preguntas extra.";
  } else if (currentRoundNumber <= 2) {
    nudge = pickRoundText(
      [
        "Vamos bien, esto recien arranca.",
        "Primeras rondas y la tabla ya empieza a tomar forma.",
      ],
      currentRoundNumber
    );
  } else if (currentRoundNumber <= 4) {
    nudge = pickRoundText(
      [
        "La tabla apenas se empieza a acomodar. Una buena ronda cambia todo.",
        "Todavia no hay nada cerrado: el peloton sigue cerca.",
        "Estas rondas empiezan a separar intuicion de suerte.",
      ],
      currentRoundNumber
    );
  } else if (isTieAtTop) {
    nudge = pickRoundText(
      [
        "Punta compartida. La proxima ronda puede romper el tablero.",
        "Empate arriba: cualquier detalle puede dejar a una mesa sola en la cima.",
        "La punta esta apretada. Una respuesta cambia el orden.",
        "Nadie se despega todavia; la siguiente puede marcar distancia.",
      ],
      currentRoundNumber
    );
  } else if (isRunawayLead && leader) {
    nudge = pickRoundText(
      [
        `${leader.name} se esta escapando. Hay que descontarle ya.`,
        `${leader.name} abrio una brecha seria. El resto necesita precision.`,
        `${leader.name} mira desde arriba, pero todavia puede recibir presion.`,
      ],
      currentRoundNumber
    );
  } else if (leader && secondPlace && leadGap >= 120) {
    nudge = pickRoundText(
      [
        `${leader.name} manda por ${leadGap} puntos. Todavia hay margen para darle alcance.`,
        `${leader.name} saco ${leadGap} de ventaja. No es definitivo, pero ya pesa.`,
        `${secondPlace.name} necesita descontar: la diferencia es de ${leadGap}.`,
      ],
      currentRoundNumber
    );
  } else if (isLateGame) {
    nudge = pickRoundText(
      [
        "Todo sigue abierto. En esta altura, cada decision pesa el doble.",
        "Entramos en zona sensible: una ronda buena vale muchisimo.",
        "Ya no hay respuestas inocentes. Cada punto se nota.",
        "La parte final pide calma, memoria y un poco de riesgo.",
      ],
      currentRoundNumber
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center py-8">
      <div className="max-w-5xl">
        <p className="mb-4 inline-flex border border-accent/35 bg-accent/12 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">
          Entre ronda
        </p>
        <h2 className="text-[2.45rem] font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-[3.2rem]">
          <TypewriterText text={title} speedMs={18} />
        </h2>
        <p className="mt-5 max-w-4xl text-[1.55rem] font-semibold leading-tight text-cyan-100">
          <TypewriterText text={nudge} speedMs={22} startDelayMs={260} />
        </p>
        <p className="mt-4 max-w-3xl text-lg leading-snug text-muted-foreground">
          {footer}
        </p>
      </div>
    </div>
  );
}

function FinalScreen({
  ranking,
  winners,
  uniqueWinner,
}: {
  ranking: Table[];
  winners: Table[];
  uniqueWinner: boolean;
}) {
  const winnerNames = winners.map((winner) => winner.name).join(" / ");
  const leader = winners[0];

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-black px-8 py-7">
      {uniqueWinner ? <SuccessConfetti fullScreen durationMs={20_000} /> : null}

      <div className="flex items-center justify-between">
        <CompanyLogo
          className="h-16 w-[400px]"
          imageClassName="object-left"
          sizes="400px"
          priority
        />
        <p className="broadcast-label text-accent">Resultado final</p>
      </div>

      <div className="grid min-h-0 flex-1 items-center gap-8 xl:grid-cols-[1.36fr_0.64fr]">
        <section className="min-w-0">
          <p className="mb-5 inline-flex border border-accent/35 bg-accent/12 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">
            {uniqueWinner ? "Ganador unico" : "Empate final"}
          </p>
          <h1 className="max-w-5xl text-[4.8rem] font-semibold leading-[0.95] text-foreground">
            {uniqueWinner ? (
              <>
                Felicitaciones,
                <br />
                {leader?.name ?? "mesa ganadora"}
              </>
            ) : (
              <>
                Empate en la cima
                <br />
                tras el desempate
              </>
            )}
          </h1>
          <p className="mt-7 max-w-4xl text-[1.75rem] font-semibold leading-tight text-cyan-100">
            {uniqueWinner
              ? `${leader?.score ?? 0} puntos y primer puesto confirmado.`
              : `${winnerNames || "Las mesas líderes"} comparten el primer puesto con ${
                  leader?.score ?? 0
                } puntos.`}
          </p>
        </section>

        <div className="min-h-0">
          <RankingBoard ranking={ranking} limit={5} />
        </div>
      </div>
    </div>
  );
}

export function ScreenView() {
  const {
    state,
    currentQuestion,
    ranking,
    activeTables,
    currentRoundNumber,
    finalWinners,
    hasUniqueWinner,
    visibleTotalRounds,
  } = useGameView();
  const [visibleAnswersQuestionId, setVisibleAnswersQuestionId] = useState<
    string | null
  >(null);
  const revealAnswersTimeoutRef = useRef<number | null>(null);
  const activeTableCount = activeTables.length;
  const compactRows = activeTableCount > 10 ? 2 : 1;
  const compactColumns = Math.max(
    1,
    Math.min(10, Math.ceil(activeTableCount / compactRows))
  );
  const questionOrder = currentQuestion?.order ?? Math.max(currentRoundNumber, 1);
  const totalQuestionCount = visibleTotalRounds;
  const isIntermission = state.roundStatus === "score_updated";
  const showAnswers = visibleAnswersQuestionId === currentQuestion?.id;
  const publicScreenWidthPx = state.publicScreenWidthPx ?? 1356;
  const publicScreenHeightPx = state.publicScreenHeightPx ?? 768;

  useEffect(() => {
    configureScreenSounds(state.soundSettings);
  }, [state.soundSettings]);

  useEffect(() => {
    const unlock = () => {
      const gameIsActive =
        state.roundStatus !== "idle" && state.roundStatus !== "game_finished";
      const roundIsActive = state.roundStatus === "round_active";

      unlockScreenSounds();
      setGameActiveSound(gameIsActive && !roundIsActive);
      setRoundSound(false);
    };

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("touchstart", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [state.roundStatus]);

  useEffect(() => {
    const gameIsActive =
      state.roundStatus !== "idle" && state.roundStatus !== "game_finished";
    const roundIsActive = state.roundStatus === "round_active";

    setGameActiveSound(gameIsActive && !roundIsActive);
    setRoundSound(false);

    return () => {
      stopScreenLoopSounds();
    };
  }, [state.roundStatus]);

  useEffect(() => {
    if (revealAnswersTimeoutRef.current !== null) {
      window.clearTimeout(revealAnswersTimeoutRef.current);
      revealAnswersTimeoutRef.current = null;
    }

    return () => {
      if (revealAnswersTimeoutRef.current !== null) {
        window.clearTimeout(revealAnswersTimeoutRef.current);
        revealAnswersTimeoutRef.current = null;
      }
    };
  }, [currentQuestion?.id]);

  const revealAnswersAfterPrompt = useCallback(() => {
    const questionId = currentQuestion?.id;

    if (!questionId) {
      return;
    }

    if (revealAnswersTimeoutRef.current !== null) {
      window.clearTimeout(revealAnswersTimeoutRef.current);
    }

    revealAnswersTimeoutRef.current = window.setTimeout(() => {
      setVisibleAnswersQuestionId(questionId);
      revealAnswersTimeoutRef.current = null;
    }, 1000);
  }, [currentQuestion?.id]);

  return (
    <div className="min-h-screen bg-black px-2 py-2">
      <main
        className="mx-auto w-full overflow-hidden bg-black"
        style={{
          height: `${publicScreenHeightPx}px`,
          maxHeight: `${publicScreenHeightPx}px`,
          maxWidth: `${publicScreenWidthPx}px`,
        }}
      >
        {state.roundStatus === "game_finished" ? (
          <FinalScreen
            ranking={ranking}
            winners={finalWinners}
            uniqueWinner={hasUniqueWinner}
          />
        ) : (
        <div className="grid h-full min-h-0 grid-rows-[3fr_1fr] gap-2">
          <div className="grid min-h-0 gap-2 xl:grid-cols-[1.58fr_0.42fr]">
            <div className="flex min-h-0 flex-col pr-1">
              <div className="flex items-center justify-start pb-2 pt-4 text-left">
                <CompanyLogo
                  className="h-16 w-[400px]"
                  imageClassName="object-left"
                  sizes="400px"
                  priority
                />
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-between py-2">
                {isIntermission ? (
                  <RoundIntermission state={state} ranking={ranking} />
                ) : (
                  <>
                    <QuestionCard
                      question={currentQuestion}
                      roundStatus={state.roundStatus}
                      compact
                      onPromptCharacter={playQuestionTypeSound}
                      onPromptAnimationComplete={revealAnswersAfterPrompt}
                    />
                    <AnswerOptionsBoard
                      question={currentQuestion}
                      roundStatus={state.roundStatus}
                      compact
                      visible={showAnswers}
                    />
                  </>
                )}
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

              <div className="mt-0 min-h-0 flex-1">
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
                showPowerUps
                compact
                compactColumns={compactColumns}
                compactRows={compactRows}
              />
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}

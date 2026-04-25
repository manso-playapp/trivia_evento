import type { AnswerOptionId, Question, RoundStatus } from "@/types";

type AnswerOptionsBoardProps = {
  question: Question | null;
  roundStatus: RoundStatus;
  selectedOptionId?: AnswerOptionId | null;
  compact?: boolean;
  visible?: boolean;
};

export function AnswerOptionsBoard({
  question,
  roundStatus,
  selectedOptionId,
  compact = false,
  visible = true,
}: AnswerOptionsBoardProps) {
  if (!question) {
    return null;
  }

  const revealCorrect =
    roundStatus === "answer_revealed" ||
    roundStatus === "score_updated" ||
    roundStatus === "game_finished";

  return (
    <div className={`grid sm:grid-cols-2 ${compact ? "gap-3" : "gap-3"}`}>
      {question.options.map((option, index) => {
        const isCorrect = option.id === question.correctOptionId;
        const isSelected = selectedOptionId === option.id;

        const optionClassName =
          revealCorrect && isCorrect
            ? "bg-success/14 shadow-[0_10px_22px_rgba(0,0,0,0.24)] ring-1 ring-success/35"
            : isSelected
              ? "bg-surface shadow-[0_12px_24px_rgba(0,0,0,0.28)] ring-1 ring-success/65"
              : "bg-surface/92 shadow-[0_10px_22px_rgba(0,0,0,0.24)]";

        return (
          <div
            key={option.id}
            className={`${compact ? `grid min-h-[7.4rem] grid-cols-[6.25rem_1fr] items-stretch rounded-[1.15rem] px-4 py-3.5 transition-[opacity,transform] duration-300 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}` : "rounded-[1.3rem] p-4 sm:min-h-44 sm:p-6"} ${optionClassName}`}
            style={compact ? { transitionDelay: visible ? `${index * 180}ms` : "0ms" } : undefined}
          >
            {compact ? (
              <>
                <span className="flex h-full items-center justify-center border-r border-white/10 pr-3 text-[5.7rem] font-semibold leading-none text-foreground">
                  {option.label}
                </span>
                <div className="flex min-w-0 items-center pl-5">
                  <p className="max-h-[5.15rem] overflow-hidden text-left text-[1.57rem] font-semibold leading-[1.09] text-foreground">
                    {option.text}
                  </p>
                  {revealCorrect && isCorrect ? (
                    <span className="ml-4 shrink-0 border border-success/35 bg-success/18 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-success uppercase">
                      Correcta
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-background/80 text-2xl font-semibold tracking-tight text-foreground sm:size-14 sm:text-3xl">
                    {option.label}
                  </span>
                  {revealCorrect && isCorrect ? (
                    <span className="border border-success/35 bg-success/18 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-success uppercase">
                      Correcta
                    </span>
                  ) : null}
                </div>
                <p className="text-lg leading-snug text-foreground sm:text-xl">
                  {option.text}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

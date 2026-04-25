import type { AnswerOptionId, Question, RoundStatus } from "@/types";
import { TypewriterText } from "@/components/typewriter-text";

type QuestionCardProps = {
  question: Question | null;
  roundStatus: RoundStatus;
  selectedOptionId?: AnswerOptionId | null;
  compact?: boolean;
  onPromptAnimationComplete?: () => void;
};

export function QuestionCard({
  question,
  roundStatus,
  selectedOptionId,
  compact = false,
  onPromptAnimationComplete,
}: QuestionCardProps) {
  if (!question) {
    return (
      <div className={compact ? "pb-3" : "broadcast-panel px-6 py-8"}>
        <p className="text-sm text-muted-foreground">
          La partida todavia no mostro la primera pregunta.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="py-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="border border-accent/35 bg-accent/12 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">
            Pregunta {question.order}
          </span>
          <span className="border border-border/70 bg-background/60 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {question.category}
          </span>
          <span className="border border-border/70 bg-background/60 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {roundStatus.replaceAll("_", " ")}
          </span>
          {selectedOptionId ? (
            <span className="border border-success/65 bg-success/12 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-success uppercase">
              Mesa eligio {selectedOptionId}
            </span>
          ) : null}
        </div>

        <h2 className="max-w-5xl text-[2.17rem] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[2.43rem]">
          <TypewriterText
            text={question.prompt}
            speedMs={20}
            onComplete={onPromptAnimationComplete}
          />
        </h2>
      </div>
    );
  }

  return (
    <div className="broadcast-panel px-6 py-7 sm:px-8 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">
          Pregunta {question.order}
        </span>
        <span className="rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">
          {question.category}
        </span>
        {selectedOptionId ? (
          <span className="rounded-full border border-success/65 bg-success/12 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-success uppercase">
            Mesa eligio {selectedOptionId}
          </span>
        ) : null}
        <span className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {roundStatus.replaceAll("_", " ")}
        </span>
      </div>

      <h2
        className="max-w-5xl text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground sm:text-5xl xl:text-6xl"
      >
        <TypewriterText
          text={question.prompt}
          speedMs={16}
          onComplete={onPromptAnimationComplete}
        />
      </h2>
    </div>
  );
}

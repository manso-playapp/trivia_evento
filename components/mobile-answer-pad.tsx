"use client";

import type { AnswerOptionId, Question, RoundStatus } from "@/types";

type MobileAnswerPadProps = {
  question: Question | null;
  selectedOptionId: AnswerOptionId | null;
  roundStatus: RoundStatus;
  disabled: boolean;
  frozen: boolean;
  onSelect: (optionId: AnswerOptionId) => void;
};

export function MobileAnswerPad({
  question,
  selectedOptionId,
  roundStatus,
  disabled,
  frozen,
  onSelect,
}: MobileAnswerPadProps) {
  if (!question) {
    return null;
  }

  return (
    <div className="space-y-4">
      {question.options.map((option) => {
        const isSelected = selectedOptionId === option.id;
        const isCorrect = option.id === question.correctOptionId;
        const revealCorrectAnswer =
          roundStatus === "answer_revealed" ||
          roundStatus === "score_updated" ||
          roundStatus === "game_finished";
        const isSelectedAndCorrect = revealCorrectAnswer && isSelected && isCorrect;
        const isSelectedAndIncorrect = revealCorrectAnswer && isSelected && !isCorrect;
        const isCorrectUnselected = revealCorrectAnswer && !isSelected && isCorrect;
        const optionToneClassName = isSelected
          ? "bg-[#1e2229] border-[0.5px] border-[var(--selection-green)] shadow-[0_14px_26px_rgba(0,0,0,0.33)]"
          : "bg-[#1e2229] border-[0.5px] border-transparent shadow-[0_14px_26px_rgba(0,0,0,0.3)]";
        const optionTextToneClassName = isSelectedAndCorrect || isSelectedAndIncorrect
          ? "text-white"
          : isCorrectUnselected
            ? "text-success"
          : isSelected
            ? "text-[var(--selection-green)]"
          : "text-foreground/92";
        const optionLabelToneClassName = isSelectedAndCorrect || isSelectedAndIncorrect
          ? "text-white"
          : isCorrectUnselected
            ? "text-success"
          : isSelected
            ? "text-[var(--selection-green)]"
          : "text-foreground/95";
        const optionResultToneClassName = isSelectedAndCorrect
          ? "bg-[var(--selection-green)] border-[0.5px] border-[var(--selection-green)] shadow-[0_14px_26px_rgba(0,0,0,0.33)]"
          : isSelectedAndIncorrect
            ? "bg-danger/85 border-[0.5px] border-danger shadow-[0_14px_26px_rgba(0,0,0,0.33)]"
            : isCorrectUnselected
              ? "bg-success/14 border-[0.5px] border-success/75 shadow-[0_14px_26px_rgba(0,0,0,0.33)]"
              : optionToneClassName;

        return (
          <button
            type="button"
            key={option.id}
            onClick={() => onSelect(option.id)}
            disabled={disabled || frozen}
            className={`flex min-h-[4.65rem] w-full items-center rounded-[1.15rem] px-5 py-4 text-left text-foreground transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${optionResultToneClassName}`}
          >
            <span
              className={`mr-2 text-[1.32rem] font-semibold leading-none tracking-[-0.02em] ${optionLabelToneClassName}`}
            >
              {option.label}.
            </span>
            <span
              className={`text-[1.22rem] font-semibold leading-snug whitespace-normal ${optionTextToneClassName}`}
            >
              {option.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

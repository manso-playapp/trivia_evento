import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneClassMap: Record<StatusTone, string> = {
  neutral: "border-border/70 bg-background/80 text-foreground",
  accent: "border-accent/30 bg-accent/12 text-accent",
  success: "border-success/30 bg-success/12 text-success",
  warning: "border-warning/30 bg-warning/14 text-warning",
  danger: "border-danger/30 bg-danger/14 text-danger",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase",
        toneClassMap[tone]
      )}
    >
      {label}
    </Badge>
  );
}

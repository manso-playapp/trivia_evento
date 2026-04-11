import { Medal } from "lucide-react";

import type { Table } from "@/types";

type RankingBoardProps = {
  ranking: Table[];
  limit?: number;
  compact?: boolean;
};

export function RankingBoard({
  ranking,
  limit = 10,
  compact = false,
}: RankingBoardProps) {
  const topTables = ranking.slice(0, limit);

  return (
    <div className={`broadcast-panel ${compact ? "h-full overflow-hidden px-3 py-3" : "px-5 py-5"}`}>
      <div className={`${compact ? "mb-2" : "mb-4"} flex items-center gap-2`}>
        <Medal className="size-4 text-accent" />
        <h3 className={`${compact ? "text-base" : "text-xl"} font-semibold tracking-tight text-foreground`}>
          Top ranking
        </h3>
      </div>

      <div className={`${compact ? "space-y-1.5" : "space-y-3"}`}>
        {topTables.map((table, index) => (
          <div
            key={table.id}
            className={`flex items-center justify-between rounded-[1.1rem] border ${
              compact ? "px-2.5 py-1.5" : "px-4 py-3.5"
            } ${
              index === 0
                ? "border-accent/35 bg-accent/10"
                : "border-border/60 bg-background/70"
            }`}
          >
            <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
              <div
                className={`flex items-center justify-center rounded-2xl bg-background/80 font-semibold tracking-tight text-foreground ${
                  compact ? "size-8 text-sm" : "size-11 text-lg"
                }`}
              >
                {index + 1}
              </div>
              <div>
                <p className={`${compact ? "text-[10px]" : "text-xs"} tracking-[0.18em] text-muted-foreground uppercase`}>
                #{index + 1}
                </p>
                <p className={`${compact ? "text-sm" : "text-base sm:text-lg"} font-semibold text-foreground`}>
                  {table.name}
                </p>
              </div>
            </div>
            <p className={`${compact ? "text-xl" : "text-3xl"} font-semibold tracking-tight text-foreground`}>
              {table.score}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

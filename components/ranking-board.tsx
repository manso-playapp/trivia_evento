import { Medal } from "lucide-react";

import type { Table } from "@/types";

type RankingBoardProps = {
  ranking: Table[];
};

export function RankingBoard({ ranking }: RankingBoardProps) {
  const topTables = ranking.slice(0, 5);

  return (
    <div className="broadcast-panel px-5 py-5">
      <div className="mb-4 flex items-center gap-2">
        <Medal className="size-4 text-accent" />
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          Top ranking
        </h3>
      </div>

      <div className="space-y-3">
        {topTables.map((table, index) => (
          <div
            key={table.id}
            className={`flex items-center justify-between rounded-[1.1rem] border px-4 py-3.5 ${
              index === 0
                ? "border-accent/35 bg-accent/10"
                : "border-border/60 bg-background/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-background/80 text-lg font-semibold tracking-tight text-foreground">
                {index + 1}
              </div>
              <div>
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                #{index + 1}
                </p>
                <p className="text-base font-semibold text-foreground sm:text-lg">
                  {table.name}
                </p>
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {table.score}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1480px]">
        {/* Marco visual base. Acá vive el layout general, no la lógica del juego. */}
        <main
          className={cn(
            "broadcast-panel relative overflow-hidden p-4 sm:p-7",
            "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/8",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

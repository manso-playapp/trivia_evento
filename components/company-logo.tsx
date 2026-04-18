"use client";

import Image from "next/image";
import { useState } from "react";

import { BRANDING } from "@/lib/branding";
import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Renderiza el logo de marca en formato consistente para todas las vistas.
 * Si todavia no existe el archivo en /public, muestra una referencia clara.
 */
export function CompanyLogo({
  className,
  imageClassName,
  priority = false,
  sizes = "220px",
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={cn(
          "flex h-12 w-[220px] items-center justify-center rounded-lg border border-border/60 bg-surface/60 px-3 text-center",
          className
        )}
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Subi logo en <span className="text-foreground">public/branding/company-logo.png</span>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative h-12 w-[220px]", className)}>
      <Image
        src={BRANDING.companyLogoPath}
        alt={BRANDING.companyLogoAlt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-contain object-right", imageClassName)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

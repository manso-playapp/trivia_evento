"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QrCodeTileProps = {
  value: string;
  label: string;
  size?: number;
};

/**
 * Render simple de QR como data URL.
 *
 * Lo dejamos en cliente para mantener el operador flexible entre local,
 * preview y produccion, sin depender de generar imagenes en el servidor.
 */
export function QrCodeTile({
  value,
  label,
  size = 224,
}: QrCodeTileProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderQr = async () => {
      try {
        const nextDataUrl = await QRCode.toDataURL(value, {
          width: size,
          margin: 1,
          color: {
            dark: "#f7fafc",
            light: "#0b1020",
          },
        });

        if (!cancelled) {
          setDataUrl(nextDataUrl);
        }
      } catch {
        if (!cancelled) {
          setDataUrl(null);
        }
      }
    };

    void renderQr();

    return () => {
      cancelled = true;
    };
  }, [size, value]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
      {dataUrl ? (
        <Image
          src={dataUrl}
          alt={label}
          width={size}
          height={size}
          className="h-auto w-full max-w-56 rounded-2xl border border-white/10 bg-[#0b1020] p-2"
        />
      ) : (
        <div className="flex aspect-square w-full max-w-56 items-center justify-center rounded-2xl border border-border/70 bg-background text-sm text-muted-foreground">
          Generando QR...
        </div>
      )}

      <p className="text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

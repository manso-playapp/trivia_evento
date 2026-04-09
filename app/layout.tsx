import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { GameProvider } from "@/components/game-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Trivia Evento",
    template: "%s | Trivia Evento",
  },
  description: "Base profesional para app de trivia corporativa en vivo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full", inter.variable, geistMono.variable, "font-sans")}
    >
      {/* Base visual global. La lógica de juego se construye en rutas/componentes. */}
      <body className="min-h-full text-foreground">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

import { ScreenView } from "@/components/views/screen-view";

export const metadata: Metadata = {
  title: "Pantalla Publica",
};

export default function ScreenPage() {
  return <ScreenView />;
}

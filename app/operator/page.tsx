import type { Metadata } from "next";

import { OperatorView } from "@/components/views/operator-view";

export const metadata: Metadata = {
  title: "Panel Operador",
};

export default function OperatorPage() {
  return <OperatorView />;
}

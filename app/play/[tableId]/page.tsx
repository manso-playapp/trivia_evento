import type { Metadata } from "next";

import { PlayView } from "@/components/views/play-view";

type PlayPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export async function generateMetadata({
  params,
}: PlayPageProps): Promise<Metadata> {
  const { tableId } = await params;
  const normalizedTableId = tableId.startsWith("table-")
    ? tableId
    : `table-${tableId}`;
  const tableLabel = normalizedTableId.replace("table-", "Mesa ");

  return {
    title: tableLabel,
  };
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { tableId } = await params;
  const normalizedTableId = tableId.startsWith("table-")
    ? tableId
    : `table-${tableId}`;

  return <PlayView tableId={normalizedTableId} />;
}

import { PlayView } from "@/components/views/play-view";

type PlayPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function PlayPage({ params }: PlayPageProps) {
  const { tableId } = await params;
  const normalizedTableId = tableId.startsWith("table-")
    ? tableId
    : `table-${tableId}`;

  return <PlayView tableId={normalizedTableId} />;
}

import { NextResponse } from "next/server";

import { getProjectMetaFromDocs } from "@/lib/server/project-context-docs";

/**
 * Expone metadata de version/contexto para panel admin.
 * La fuente de verdad son los documentos en `docs/*.md`.
 */
export async function GET() {
  const meta = await getProjectMetaFromDocs();

  return NextResponse.json(meta);
}

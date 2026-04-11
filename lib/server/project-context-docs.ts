import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const changelogPath = join(process.cwd(), "docs/CHANGELOG.md");
const projectContextPath = join(process.cwd(), "docs/PROJECT_CONTEXT.md");
const handoffContextPath = join(process.cwd(), "docs/HANDOFF_CONTEXT.md");

type LatestRelease = {
  version: string;
  releasedAt: string;
  notes: string[];
};

type ContextSnapshot = {
  updatedAt: string | null;
  summary: string;
  handoffChecklist: string[];
  openRisks: string[];
};

type HandoffSnapshot = {
  generatedAt: string | null;
  preview: string;
  lineCount: number;
};

type ProjectMeta = {
  release: LatestRelease;
  context: ContextSnapshot;
  handoff: HandoffSnapshot;
  source: {
    changelog: string;
    projectContext: string;
    handoff: string;
  };
};

const readFileSafe = async (filePath: string) => {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
};

const extractSectionBody = (markdown: string, heading: string) => {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `^## ${escapedHeading}\\s*\\n([\\s\\S]*?)(?=^##\\s|\\Z)`,
    "m"
  ).exec(markdown);

  return match?.[1]?.trim() ?? "";
};

const extractBullets = (markdownSection: string) =>
  markdownSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());

const parseLatestRelease = (markdown: string): LatestRelease => {
  const releaseMatch = /^## \[([^\]]+)\] - ([^\n]+)$/m.exec(markdown);

  if (!releaseMatch) {
    return {
      version: "0.0.0",
      releasedAt: "unknown",
      notes: ["No hay version registrada en docs/CHANGELOG.md"],
    };
  }

  const releaseHeaderLine = releaseMatch[0];
  const releaseBodyStart = markdown.indexOf(releaseHeaderLine);
  const releaseBody = markdown.slice(releaseBodyStart + releaseHeaderLine.length);
  const nextReleaseIndex = releaseBody.search(/^## /m);
  const currentReleaseSection =
    nextReleaseIndex === -1
      ? releaseBody
      : releaseBody.slice(0, nextReleaseIndex);

  const notes = extractBullets(currentReleaseSection);

  return {
    version: releaseMatch[1],
    releasedAt: releaseMatch[2],
    notes:
      notes.length > 0
        ? notes
        : ["La version existe, pero no tiene notas de cambio."],
  };
};

const parseContextSnapshot = (markdown: string): ContextSnapshot => {
  const contextUpdatedAt =
    /^- context_updated_at:\s*(.+)$/m.exec(markdown)?.[1]?.trim() ?? null;

  const summarySection = extractSectionBody(markdown, "Resumen operativo");
  const summary = summarySection
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  const handoffChecklist = extractBullets(
    extractSectionBody(markdown, "Handoff rapido para nuevo hilo")
  );

  const openRisks = extractBullets(extractSectionBody(markdown, "Riesgos abiertos"));

  return {
    updatedAt: contextUpdatedAt,
    summary: summary || "Sin resumen operativo en docs/PROJECT_CONTEXT.md",
    handoffChecklist,
    openRisks,
  };
};

const parseHandoffSnapshot = (markdown: string): HandoffSnapshot => {
  const generatedAt =
    /^- generated_at:\s*(.+)$/m.exec(markdown)?.[1]?.trim() ?? null;
  const previewSection = extractSectionBody(markdown, "Compressed Context");
  const preview = previewSection
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  return {
    generatedAt,
    preview: preview || "Sin contenido generado en docs/HANDOFF_CONTEXT.md",
    lineCount: markdown ? markdown.split("\n").length : 0,
  };
};

export const getProjectMetaFromDocs = async (): Promise<ProjectMeta> => {
  const [changelog, projectContext, handoff] = await Promise.all([
    readFileSafe(changelogPath),
    readFileSafe(projectContextPath),
    readFileSafe(handoffContextPath),
  ]);

  return {
    release: parseLatestRelease(changelog),
    context: parseContextSnapshot(projectContext),
    handoff: parseHandoffSnapshot(handoff),
    source: {
      changelog: "docs/CHANGELOG.md",
      projectContext: "docs/PROJECT_CONTEXT.md",
      handoff: "docs/HANDOFF_CONTEXT.md",
    },
  };
};

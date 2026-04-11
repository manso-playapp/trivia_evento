#!/usr/bin/env node

import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const docsDir = join(root, "docs");
const changelogPath = join(docsDir, "CHANGELOG.md");
const projectContextPath = join(docsDir, "PROJECT_CONTEXT.md");
const handoffPath = join(docsDir, "HANDOFF_CONTEXT.md");
const archivePath = join(docsDir, "CONTEXT_ARCHIVE.md");

const MAX_GIT_STATUS_LINES = 30;
const MAX_COMMIT_LINES = 10;
const MAX_ARCHIVE_ENTRIES = 120;
const ENTRY_SEPARATOR = "\n\n<!-- context-entry -->\n\n";

const readFileSafe = async (filePath) => {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
};

const runGitCommand = (command) => {
  try {
    return execSync(command, {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
};

const extractSectionBody = (markdown, heading) => {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `^## ${escapedHeading}\\s*\\n([\\s\\S]*?)(?=^##\\s|\\Z)`,
    "m"
  ).exec(markdown);

  return match?.[1]?.trim() ?? "";
};

const extractBullets = (section) =>
  section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());

const parseRelease = (markdown) => {
  const match = /^## \[([^\]]+)\] - ([^\n]+)$/m.exec(markdown);

  if (!match) {
    return {
      version: "0.0.0",
      releasedAt: "unknown",
      notes: ["No hay release registrada en docs/CHANGELOG.md"],
    };
  }

  const releaseHeaderLine = match[0];
  const releaseBodyStart = markdown.indexOf(releaseHeaderLine);
  const releaseBody = markdown.slice(releaseBodyStart + releaseHeaderLine.length);
  const nextReleaseIndex = releaseBody.search(/^## /m);
  const releaseSection =
    nextReleaseIndex === -1 ? releaseBody : releaseBody.slice(0, nextReleaseIndex);

  const notes = extractBullets(releaseSection);

  return {
    version: match[1],
    releasedAt: match[2],
    notes: notes.slice(0, 8),
  };
};

const updateContextTimestamp = async (timestamp) => {
  const originalContext = await readFileSafe(projectContextPath);

  if (!originalContext) {
    return;
  }

  const nextContext = originalContext.match(/^- context_updated_at:/m)
    ? originalContext.replace(
        /^- context_updated_at:\s*.+$/m,
        `- context_updated_at: ${timestamp.slice(0, 10)}`
      )
    : `${originalContext.trim()}\n- context_updated_at: ${timestamp.slice(0, 10)}\n`;

  await writeFile(projectContextPath, `${nextContext.trim()}\n`, "utf-8");
};

const buildHandoffDocument = ({
  generatedAt,
  release,
  contextSummary,
  handoffChecklist,
  openRisks,
  gitStatusLines,
  recentCommitLines,
}) => `# Handoff Context

- generated_at: ${generatedAt}
- release_version: ${release.version}
- release_date: ${release.releasedAt}
- source_changelog: docs/CHANGELOG.md
- source_context: docs/PROJECT_CONTEXT.md

## Compressed Context

${contextSummary || "Sin resumen en docs/PROJECT_CONTEXT.md"}

## Latest Functional Changes

${release.notes.length > 0 ? release.notes.map((note) => `- ${note}`).join("\n") : "- Sin notas"}

## Working Tree Snapshot

${gitStatusLines.length > 0 ? gitStatusLines.map((line) => `- ${line}`).join("\n") : "- Workspace limpio"}

## Recent Commits

${recentCommitLines.length > 0 ? recentCommitLines.map((line) => `- ${line}`).join("\n") : "- Sin commits disponibles"}

## Handoff Checklist

${handoffChecklist.length > 0 ? handoffChecklist.map((item) => `- ${item}`).join("\n") : "- Completar checklist en docs/PROJECT_CONTEXT.md"}

## Open Risks

${openRisks.length > 0 ? openRisks.map((risk) => `- ${risk}`).join("\n") : "- Sin riesgos registrados"}

## Prompt For New Thread

\`\`\`text
Continuar Trivia Evento desde version ${release.version}.
Revisar docs/CHANGELOG.md, docs/PROJECT_CONTEXT.md y docs/HANDOFF_CONTEXT.md.
Usar engine/services actuales y no romper el flujo operator/screen/play.
\`\`\`
`;

const updateArchive = async ({ generatedAt, releaseVersion, handoff }) => {
  const previousArchive = await readFileSafe(archivePath);
  const archiveHeader = `# Context Archive

Historial compacto de checkpoints automáticos.
`;
  const cleanArchive = previousArchive || archiveHeader;
  const previousEntries = cleanArchive
    .split(ENTRY_SEPARATOR)
    .filter((entry) => entry.includes("## Snapshot"));

  const statusLine = runGitCommand("git status --short | wc -l")
    .split("\n")
    .pop()
    ?.trim();
  const changedFilesCount = Number.parseInt(statusLine ?? "0", 10) || 0;
  const firstCommit = runGitCommand("git log --oneline -n 1");
  const compressedPreview = handoff
    .split("\n")
    .slice(0, 16)
    .join("\n")
    .trim();

  const nextEntry = `## Snapshot ${generatedAt}

- release: ${releaseVersion}
- changed_files: ${changedFilesCount}
- head_commit: ${firstCommit || "n/a"}

\`\`\`md
${compressedPreview}
\`\`\``;

  const keptEntries = [...previousEntries, nextEntry].slice(-MAX_ARCHIVE_ENTRIES);
  const nextArchive = `${archiveHeader}${ENTRY_SEPARATOR}${keptEntries.join(
    ENTRY_SEPARATOR
  )}\n`;

  await writeFile(archivePath, nextArchive, "utf-8");
};

const main = async () => {
  await mkdir(docsDir, { recursive: true });

  const now = new Date().toISOString();
  const [changelog, projectContext] = await Promise.all([
    readFileSafe(changelogPath),
    readFileSafe(projectContextPath),
  ]);

  const release = parseRelease(changelog);
  const summarySection = extractSectionBody(projectContext, "Resumen operativo")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
  const handoffChecklist = extractBullets(
    extractSectionBody(projectContext, "Handoff rapido para nuevo hilo")
  );
  const openRisks = extractBullets(extractSectionBody(projectContext, "Riesgos abiertos"));

  const gitStatusLines = runGitCommand("git status --short")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_GIT_STATUS_LINES);
  const recentCommitLines = runGitCommand(`git log --oneline -n ${MAX_COMMIT_LINES}`)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  await updateContextTimestamp(now);

  const handoff = buildHandoffDocument({
    generatedAt: now,
    release,
    contextSummary: summarySection,
    handoffChecklist,
    openRisks,
    gitStatusLines,
    recentCommitLines,
  });

  await writeFile(handoffPath, handoff, "utf-8");
  await updateArchive({
    generatedAt: now,
    releaseVersion: release.version,
    handoff,
  });

  console.log(
    `context-checkpoint: generated docs/HANDOFF_CONTEXT.md (release ${release.version})`
  );
};

void main().catch((error) => {
  console.error("context-checkpoint: failed", error);
  process.exitCode = 1;
});
